/**
 * Motor de puntuación de Voy Votando. Implementa las secciones 6.1 a 6.24 de docs/metodologia.md.
 * Todo es puro y determinista: mismas respuestas, mismo resultado, mismos intervalos.
 */
import { PARTY_IDS, type Answers, type Axis, type Confidence, type PartyId, type Question, type Scale } from "./types";

export const CONF: Record<Confidence, number> = { alta: 1, media: 0.75, baja: 0.5 };
/** Peso de la proximidad en el acuerdo híbrido (6.2). El resto es dirección. */
export const ALPHA = 0.5;
/** Preguntas ficticias con acuerdo 0,5 que contraen a los partidos con poca evidencia (6.3). */
export const PRIOR_N = 4;
export const PRIOR_A = 0.5;
/** Pesos de las prioridades 1, 2 y 3 (4.6). */
export const PRIORITY_WEIGHTS = [2.0, 1.5, 1.2] as const;
export const MIN_ANSWERS_RANKING = 10;
export const LOW_PRECISION_BELOW = 20;
export const BOOTSTRAP_B = 1000;
/**
 * Un partido supera al siguiente sin empate técnico si gana en al menos este porcentaje de remuestreos (6.5).
 * Con 0,8 había empate en el 19% de los votantes simulados con ruido alto; con 0,7, en el 11% (docs/metodologia.md 6.5).
 */
export const TIE_THRESHOLD = 0.7;

/** Seguridad del primer puesto en lenguaje llano, según la proporción de remuestreos en que gana. */
export function certainty(firstShare: number): "alta" | "media" | "baja" {
  return firstShare >= 0.9 ? "alta" : firstShare >= TIE_THRESHOLD ? "media" : "baja";
}

export interface ScoreOptions {
  /** Solo cuenta posiciones con esta confianza o mayor (6.18). */
  minConfidence?: Confidence;
  /** Variante descartada: nulos cuentan como acuerdo 0,5 con confianza 1 (6.18). */
  nullsAsHalf?: boolean;
}

export interface PartyScore {
  party: PartyId;
  /** Afinidad de 0 a 100. */
  value: number;
  /** Parte del peso respondido en la que el partido tiene posición (6.4). */
  coverage: number;
  answered: number;
  withPosition: number;
  /** Numerador y denominador sin previo: Σ w c a y Σ w c. */
  num: number;
  den: number;
}

/** Acuerdo híbrido entre respuesta y posición (6.2). */
export function agreement(u: number, p: number): number {
  const prox = 1 - Math.abs(u - p) / 4;
  const dir = 0.5 + (u * p) / 8;
  return ALPHA * prox + (1 - ALPHA) * dir;
}

/** Peso de cada pregunta según los bloques prioritarios, en orden (6.1). */
export function questionWeights(questions: Question[], priorities: number[]): Record<string, number> {
  const factor = new Map<number, number>();
  priorities.slice(0, PRIORITY_WEIGHTS.length).forEach((block, i) => factor.set(block, PRIORITY_WEIGHTS[i]));
  const w: Record<string, number> = {};
  for (const q of questions) w[q.id] = factor.get(q.block) ?? 1;
  return w;
}

function confidenceAllowed(c: Confidence | null, min?: Confidence): boolean {
  if (!c) return false;
  return min ? CONF[c] >= CONF[min] : true;
}

/** Términos por pregunta para un partido: [peso efectivo w·c, w·c·a, peso de la persona w, tiene posición]. */
function terms(q: Question, u: Scale, w: number, party: PartyId, opts: ScoreOptions): [number, number, boolean] {
  const pos = q.positions[party];
  if (pos.value == null || !confidenceAllowed(pos.confidence, opts.minConfidence)) {
    if (opts.nullsAsHalf) return [w, w * 0.5, false];
    return [0, 0, false];
  }
  const wc = w * CONF[pos.confidence as Confidence];
  return [wc, wc * agreement(u, pos.value), true];
}

export function answeredQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((q) => answers[q.id] != null);
}

/** Afinidad con un partido (6.3) y cobertura (6.4). */
export function affinity(questions: Question[], answers: Answers, weights: Record<string, number>, party: PartyId, opts: ScoreOptions = {}): PartyScore {
  let num = 0, den = 0, cov = 0, tot = 0, answered = 0, withPosition = 0;
  for (const q of questions) {
    const u = answers[q.id];
    if (u == null) continue;
    const w = weights[q.id] ?? 1;
    answered++;
    tot += w;
    const [wc, wca, has] = terms(q, u, w, party, opts);
    num += wca;
    den += wc;
    if (has) {
      cov += w;
      withPosition++;
    }
  }
  return { party, value: (100 * (num + PRIOR_N * PRIOR_A)) / (den + PRIOR_N), coverage: tot ? cov / tot : 0, answered, withPosition, num, den };
}

export function scoreAll(questions: Question[], answers: Answers, weights: Record<string, number>, opts: ScoreOptions = {}): Record<PartyId, PartyScore> {
  const out = {} as Record<PartyId, PartyScore>;
  for (const p of PARTY_IDS) out[p] = affinity(questions, answers, weights, p, opts);
  return out;
}

/** Orden por afinidad; los empates exactos se resuelven por orden alfabético de id (6.12). */
export function order(scores: Record<PartyId, PartyScore>): PartyId[] {
  return [...PARTY_IDS].sort((a, b) => scores[b].value - scores[a].value || a.localeCompare(b));
}

/** Contribución exacta de cada pregunta: S_k = 50 + Σ δ (6.16). */
export function contributions(questions: Question[], answers: Answers, weights: Record<string, number>, party: PartyId): { id: string; delta: number }[] {
  const s = affinity(questions, answers, weights, party);
  const out: { id: string; delta: number }[] = [];
  for (const q of questions) {
    const u = answers[q.id];
    if (u == null) continue;
    const [wc, wca, has] = terms(q, u, weights[q.id] ?? 1, party, {});
    if (!has) continue;
    out.push({ id: q.id, delta: (100 * (wca - PRIOR_A * wc)) / (s.den + PRIOR_N) });
  }
  return out;
}

export type Coincidence = "coincidencia" | "discrepancia" | "parcial" | "sin_posicion";

/** Casilla de coincidencia discreta (6.22). */
export function coincidence(u: Scale, p: Scale | null): Coincidence {
  if (p == null) return "sin_posicion";
  if ((u === 0 && p === 0) || u * p > 0) return "coincidencia";
  if (u * p < 0) return "discrepancia";
  return "parcial";
}

export function coincidenceCounts(questions: Question[], answers: Answers, party: PartyId): Record<Coincidence, number> {
  const c: Record<Coincidence, number> = { coincidencia: 0, discrepancia: 0, parcial: 0, sin_posicion: 0 };
  for (const q of questions) {
    const u = answers[q.id];
    if (u == null) continue;
    c[coincidence(u, q.positions[party].value)]++;
  }
  return c;
}

/** Semilla estable a partir de las respuestas (6.5). FNV-1a de 32 bits. */
export function seedFromAnswers(questions: Question[], answers: Answers, weights: Record<string, number>): number {
  let h = 0x811c9dc5;
  const s = questions.map((q) => `${q.id}:${answers[q.id] ?? "x"}:${weights[q.id] ?? 1}`).join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Generador mulberry32: rápido y reproducible. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BootstrapResult {
  /** Percentiles 5 y 95 de la afinidad de cada partido. */
  interval: Record<PartyId, [number, number]>;
  /** Proporción de remuestreos en los que cada partido queda primero. */
  firstShare: Record<PartyId, number>;
  /** wins[a][b]: proporción de remuestreos en los que a supera a b. */
  wins: Record<PartyId, Record<PartyId, number>>;
  /** Percentiles 5 y 95 de las coordenadas de la persona en ECO y SOC, y su covarianza, para la elipse del mapa. */
  userAxes: { mean: [number, number]; cov: [[number, number], [number, number]] } | null;
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[idx];
}

/** Bootstrap de preguntas respondidas (6.5). */
export function bootstrap(questions: Question[], answers: Answers, weights: Record<string, number>, B = BOOTSTRAP_B): BootstrapResult {
  const qs = answeredQuestions(questions, answers);
  const n = qs.length;
  // Términos precalculados por pregunta y partido.
  const T = PARTY_IDS.map((p) => qs.map((q) => terms(q, answers[q.id] as Scale, weights[q.id] ?? 1, p, {})));
  const axisTerms = qs.map((q) => ({ axis: q.axis, v: q.axis && q.dir ? (q.dir * (answers[q.id] as number)) / 2 : 0 }));
  const random = rng(seedFromAnswers(questions, answers, weights));
  const samples: number[][] = PARTY_IDS.map(() => []);
  const first: Record<string, number> = Object.fromEntries(PARTY_IDS.map((p) => [p, 0]));
  const winCount: number[][] = PARTY_IDS.map(() => PARTY_IDS.map(() => 0));
  const axisSamples: [number, number][] = [];
  for (let b = 0; b < B && n > 0; b++) {
    const num = new Array(PARTY_IDS.length).fill(0);
    const den = new Array(PARTY_IDS.length).fill(0);
    let eco = 0, ecoN = 0, soc = 0, socN = 0;
    for (let i = 0; i < n; i++) {
      const j = Math.floor(random() * n);
      for (let k = 0; k < PARTY_IDS.length; k++) {
        den[k] += T[k][j][0];
        num[k] += T[k][j][1];
      }
      const at = axisTerms[j];
      if (at.axis === "ECO") { eco += at.v; ecoN++; }
      if (at.axis === "SOC") { soc += at.v; socN++; }
    }
    const vals = num.map((x, k) => (100 * (x + PRIOR_N * PRIOR_A)) / (den[k] + PRIOR_N));
    vals.forEach((v, k) => samples[k].push(v));
    let best = 0;
    for (let k = 1; k < vals.length; k++) if (vals[k] > vals[best]) best = k;
    first[PARTY_IDS[best]]++;
    for (let a = 0; a < vals.length; a++) for (let c = 0; c < vals.length; c++) if (vals[a] > vals[c]) winCount[a][c]++;
    if (ecoN && socN) axisSamples.push([eco / ecoN, soc / socN]);
  }
  const interval = {} as Record<PartyId, [number, number]>;
  const firstShare = {} as Record<PartyId, number>;
  const wins = {} as Record<PartyId, Record<PartyId, number>>;
  PARTY_IDS.forEach((p, k) => {
    const s = [...samples[k]].sort((x, y) => x - y);
    interval[p] = [percentile(s, 0.05), percentile(s, 0.95)];
    firstShare[p] = n ? first[p] / B : 0;
    wins[p] = {} as Record<PartyId, number>;
    PARTY_IDS.forEach((q, c) => (wins[p][q] = n ? winCount[k][c] / B : 0));
  });
  let userAxes: BootstrapResult["userAxes"] = null;
  if (axisSamples.length > 1) {
    const m = axisSamples.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]).map((v) => v / axisSamples.length) as [number, number];
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of axisSamples) {
      sxx += (x - m[0]) ** 2;
      syy += (y - m[1]) ** 2;
      sxy += (x - m[0]) * (y - m[1]);
    }
    const d = axisSamples.length - 1;
    userAxes = { mean: m, cov: [[sxx / d, sxy / d], [sxy / d, syy / d]] };
  }
  return { interval, firstShare, wins, userAxes };
}

export interface RankedParty {
  party: PartyId;
  score: PartyScore;
  interval: [number, number];
  firstShare: number;
  /** true si empata técnicamente con el partido anterior del ranking. */
  tiedWithPrevious: boolean;
  /** true si no se separa con claridad del primero (el primero gana en menos del 70% de los remuestreos). */
  tiedWithFirst: boolean;
}

/** Ranking con empates técnicos entre posiciones contiguas (6.5). */
export function rank(scores: Record<PartyId, PartyScore>, boot: BootstrapResult): RankedParty[] {
  const ids = order(scores);
  return ids.map((p, i) => ({
    party: p,
    score: scores[p],
    interval: boot.interval[p],
    firstShare: boot.firstShare[p],
    tiedWithPrevious: i > 0 && boot.wins[ids[i - 1]][p] < TIE_THRESHOLD,
    tiedWithFirst: i > 0 && boot.wins[ids[0]][p] < TIE_THRESHOLD,
  }));
}

/** Coordenadas de la persona en un eje, de -1 a +1 (6.8). */
export function userAxis(questions: Question[], answers: Answers, axis: Axis): number | null {
  let s = 0, n = 0;
  for (const q of questions) {
    const u = answers[q.id];
    if (u == null || q.axis !== axis || !q.dir) continue;
    s += (q.dir * u) / 2;
    n++;
  }
  return n ? s / n : null;
}

/** Coordenadas de un partido en un eje, ponderadas por confianza (6.8). */
export function partyAxis(questions: Question[], party: PartyId, axis: Axis): number | null {
  let s = 0, d = 0;
  for (const q of questions) {
    const pos = q.positions[party];
    if (q.axis !== axis || !q.dir || pos.value == null || !pos.confidence) continue;
    const c = CONF[pos.confidence];
    s += (c * q.dir * pos.value) / 2;
    d += c;
  }
  return d ? s / d : null;
}

/** Afinidad restringida a un bloque; null si no hay datos mínimos (6.7). */
export function blockAffinity(questions: Question[], answers: Answers, weights: Record<string, number>, party: PartyId, block: number): PartyScore | null {
  const qs = questions.filter((q) => q.block === block);
  const s = affinity(qs, answers, weights, party);
  if (s.answered < 2 || s.withPosition < 2) return null;
  return s;
}

export interface Pivot {
  id: string;
  from: Scale | null;
  to: Scale | null;
  newFirst: PartyId;
}

/** Preguntas bisagra: cambios de 1 punto, o saltar, que cambian el primer puesto (6.17). */
export function pivots(questions: Question[], answers: Answers, weights: Record<string, number>, max = 3): Pivot[] {
  const base = order(scoreAll(questions, answers, weights))[0];
  const out: Pivot[] = [];
  for (const q of answeredQuestions(questions, answers)) {
    const u = answers[q.id] as Scale;
    const variants: (Scale | null)[] = [];
    if (u > -2) variants.push((u - 1) as Scale);
    if (u < 2) variants.push((u + 1) as Scale);
    variants.push(null);
    for (const v of variants) {
      const alt = { ...answers, [q.id]: v };
      const first = order(scoreAll(questions, alt, weights))[0];
      if (first !== base) {
        out.push({ id: q.id, from: u, to: v, newFirst: first });
        break;
      }
    }
  }
  // Primero los cambios de respuesta (1 punto), después los de saltar.
  return out.sort((a, b) => Number(a.to === null) - Number(b.to === null)).slice(0, max);
}

/** Sensibilidad: primer puesto con 3 variantes (6.18). */
export function sensitivity(questions: Question[], answers: Answers, weights: Record<string, number>): { base: PartyId; noPriorities: PartyId; onlyHigh: PartyId; nullsHalf: PartyId } {
  const flat = questionWeights(questions, []);
  return {
    base: order(scoreAll(questions, answers, weights))[0],
    noPriorities: order(scoreAll(questions, answers, flat))[0],
    onlyHigh: order(scoreAll(questions, answers, weights, { minConfidence: "alta" }))[0],
    nullsHalf: order(scoreAll(questions, answers, weights, { nullsAsHalf: true }))[0],
  };
}

/** Afinidad entre dos personas (6.19); null si comparten menos de 10 respuestas. */
export function personAffinity(questions: Question[], a: Answers, b: Answers): { value: number; shared: number; mostDifferent: string[] } | null {
  const shared = questions.filter((q) => a[q.id] != null && b[q.id] != null);
  if (shared.length < MIN_ANSWERS_RANKING) return null;
  const scored = shared.map((q) => ({ id: q.id, a: agreement(a[q.id] as number, b[q.id] as number) }));
  const value = (100 * scored.reduce((s, x) => s + x.a, 0)) / scored.length;
  const mostDifferent = [...scored].sort((x, y) => x.a - y.a).slice(0, 5).map((x) => x.id);
  return { value, shared: shared.length, mostDifferent };
}

/** Cercanía entre dos partidos (6.23); null si comparten menos de 10 posiciones. */
export function partyCloseness(questions: Question[], a: PartyId, b: PartyId): { value: number; shared: number } | null {
  const qs = questions.filter((q) => q.positions[a].value != null && q.positions[b].value != null);
  if (qs.length < MIN_ANSWERS_RANKING) return null;
  const v = qs.reduce((s, q) => s + agreement(q.positions[a].value as number, q.positions[b].value as number), 0);
  return { value: (100 * v) / qs.length, shared: qs.length };
}

/** Coincidencias inesperadas con los 3 últimos del podio (6.20). */
export function surprisingMatches(questions: Question[], answers: Answers, weights: Record<string, number>, ranking: PartyId[], max = 3): { id: string; party: PartyId; a: number }[] {
  const tail = new Set(ranking.slice(-3));
  const out: { id: string; party: PartyId; a: number; key: number }[] = [];
  for (const q of answeredQuestions(questions, answers)) {
    const u = answers[q.id] as Scale;
    for (const p of tail) {
      const pos = q.positions[p];
      if (pos.value == null || Math.abs(pos.value) !== 2 || !pos.confidence || CONF[pos.confidence] < CONF.media) continue;
      const a = agreement(u, pos.value);
      if (a < 0.75) continue;
      out.push({ id: q.id, party: p, a, key: (weights[q.id] ?? 1) * CONF[pos.confidence] * a });
    }
  }
  return out.sort((x, y) => y.key - x.key || ranking.indexOf(y.party) - ranking.indexOf(x.party)).slice(0, max).map(({ id, party, a }) => ({ id, party, a }));
}

/** Preguntas en las que dos socios discrepan 2 puntos o más (6.21). */
export function partnerDiscrepancies(questions: Question[], a: PartyId, b: PartyId): string[] {
  return questions
    .filter((q) => {
      const x = q.positions[a].value, y = q.positions[b].value;
      return x != null && y != null && Math.abs(x - y) >= 2;
    })
    .map((q) => q.id);
}
