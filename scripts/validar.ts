// Validación del algoritmo con el motor de la web (docs/metodologia.md 6.13).
// Ejecuta: npm run validar. Las cifras son deterministas: la semilla es fija.
import questionsJson from "../src/content/questions.json";
import { bootstrap, order, rank, rng, scoreAll } from "../src/lib/scoring";
import { PARTY_IDS, type Answers, type PartyId, type Question, type Scale } from "../src/lib/types";

const ALL = questionsJson as unknown as Question[];
const FAST = ALL.filter((q) => q.fast);
const PER_PARTY = 1000;
const TIE_PER_PARTY = 300;
const NAME: Record<PartyId, string> = { fa: "Frente Amplio", podemos: "Podemos", pp: "PP", psoe: "PSOE", salf: "SALF", vox: "Vox" };

const random = rng(20261129);
const gauss = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
const clip = (x: number) => Math.max(-2, Math.min(2, Math.round(x))) as Scale;
const anyAnswer = () => (Math.floor(random() * 5) - 2) as Scale;

function top(qs: Question[], answers: Answers) {
  const s = scoreAll(qs, answers, {});
  const ids = order(s);
  return { first: ids[0], margin: s[ids[0]].value - s[ids[1]].value, scores: s };
}

// Votante sintético: parte de las posiciones del partido y suma ruido gaussiano. Donde el partido es nulo, responde al azar.
function voter(qs: Question[], party: PartyId, sigma: number): Answers {
  const a: Answers = {};
  for (const q of qs) {
    const v = q.positions[party].value;
    a[q.id] = v == null ? anyAnswer() : clip(v + sigma * gauss());
  }
  return a;
}

function validate(qs: Question[]) {
  const autotest = PARTY_IDS.map((p) => {
    const a: Answers = {};
    for (const q of qs) if (q.positions[p].value != null) a[q.id] = q.positions[p].value;
    const t = top(qs, a);
    return { p, ok: t.first === p, margin: t.margin };
  });
  const recovery = (sigma: number) =>
    Object.fromEntries(PARTY_IDS.map((p) => {
      let hit = 0;
      for (let i = 0; i < PER_PARTY; i++) if (top(qs, voter(qs, p, sigma)).first === p) hit++;
      return [p, hit / PER_PARTY];
    })) as Record<PartyId, number>;
  const firstAtRandom = Object.fromEntries(PARTY_IDS.map((p) => [p, 0])) as Record<PartyId, number>;
  const n = PER_PARTY * PARTY_IDS.length;
  for (let i = 0; i < n; i++) {
    const a: Answers = {};
    for (const q of qs) a[q.id] = anyAnswer();
    firstAtRandom[top(qs, a).first] += 1 / n;
  }
  // Empate técnico con el primero, con el mismo umbral que la web (TIE_THRESHOLD).
  const ties = (sigma: number) => {
    let tied = 0;
    for (const p of PARTY_IDS) for (let i = 0; i < TIE_PER_PARTY; i++) {
      const a = voter(qs, p, sigma);
      const r = rank(scoreAll(qs, a, {}), bootstrap(qs, a, {}));
      if (r[1].tiedWithFirst) tied++;
    }
    return tied / (TIE_PER_PARTY * PARTY_IDS.length);
  };
  const neutral: Answers = Object.fromEntries(qs.map((q) => [q.id, 0]));
  return { autotest, r075: recovery(0.75), r125: recovery(1.25), firstAtRandom, tie075: ties(0.75), tie125: ties(1.25), neutral: top(qs, neutral) };
}

const pct = (x: number) => `${(100 * x).toFixed(1).replace(".", ",")}%`;
const dec = (x: number) => x.toFixed(3).replace(".", ",");
const range = (r: Record<string, number>, f: (x: number) => string) => {
  const v = Object.values(r);
  return `${f(Math.min(...v))} a ${f(Math.max(...v))}`;
};

const full = validate(ALL);
const fast = validate(FAST);
const row = (label: string, f: (r: ReturnType<typeof validate>) => string) => `| ${label} | ${f(full)} | ${f(fast)} |`;
console.log(`| Prueba | Modo completo (${ALL.length}) | Modo rápido (${FAST.length}) |`);
console.log("|---|---|---|");
console.log(row("Autotest: cada partido responde sus propias posiciones", (r) =>
  `${r.autotest.filter((x) => x.ok).length} de 6 en primer puesto; margen mínimo ${Math.min(...r.autotest.map((x) => x.margin)).toFixed(1).replace(".", ",")} puntos`));
console.log(row("Recuperación con ruido σ = 0,75", (r) => range(r.r075, dec)));
console.log(row("Recuperación con ruido σ = 1,25", (r) => range(r.r125, dec)));
console.log(row("Primer puesto con respuestas al azar (ideal: 16,7% cada uno)", (r) => range(r.firstAtRandom, pct)));
console.log(row("Empate técnico con el primero, σ = 0,75", (r) => pct(r.tie075)));
console.log(row("Empate técnico con el primero, σ = 1,25", (r) => pct(r.tie125)));
console.log(row("Todo «Neutral»: primer puesto", (r) => `${NAME[r.neutral.first]}, ${r.neutral.margin.toFixed(1).replace(".", ",")} puntos por delante`));
console.log("");
for (const [mode, r] of [["completo", full], ["rápido", fast]] as const) {
  console.log(`Modo ${mode}`);
  console.log(`  σ 0,75: ${PARTY_IDS.map((p) => `${NAME[p]} ${dec(r.r075[p])}`).join(", ")}`);
  console.log(`  σ 1,25: ${PARTY_IDS.map((p) => `${NAME[p]} ${dec(r.r125[p])}`).join(", ")}`);
  console.log(`  azar:   ${PARTY_IDS.map((p) => `${NAME[p]} ${pct(r.firstAtRandom[p])}`).join(", ")}`);
  console.log(`  autotest: ${r.autotest.map((x) => `${NAME[x.p]} ${x.margin.toFixed(1).replace(".", ",")}`).join(", ")}`);
}
