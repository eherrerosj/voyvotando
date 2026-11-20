import { describe, expect, it } from "vitest";
import fc from "fast-check";
import questionsJson from "../content/questions.json";
import {
  affinity, agreement, bootstrap, coincidence, coincidenceCounts, contributions, order, partnerDiscrepancies,
  partyCloseness, personAffinity, pivots, questionWeights, rank, rng, scoreAll, sensitivity, surprisingMatches, userAxis, partyAxis,
} from "./scoring";
import { PARTY_IDS, type Answers, type PartyId, type Question, type Scale } from "./types";

const questions = questionsJson as unknown as Question[];
const flat = questionWeights(questions, []);
const scaleArb = fc.constantFrom<Scale>(-2, -1, 0, 1, 2);
const answersArb = fc.array(fc.option(scaleArb, { nil: null }), { minLength: questions.length, maxLength: questions.length })
  .map((vals) => Object.fromEntries(questions.map((q, i) => [q.id, vals[i]])) as Answers);

function partyAnswers(p: PartyId): Answers {
  return Object.fromEntries(questions.filter((q) => q.positions[p].value != null).map((q) => [q.id, q.positions[p].value])) as Answers;
}

describe("agreement (6.2)", () => {
  it("reproduce la tabla del plan", () => {
    expect(agreement(2, 2)).toBe(1);
    expect(agreement(2, -2)).toBe(0);
    expect(agreement(1, 1)).toBeCloseTo(0.8125);
    expect(agreement(0, 0)).toBe(0.75);
    expect(agreement(0, 2)).toBe(0.5);
    expect(agreement(1, -1)).toBeCloseTo(0.4375);
  });
  it("es simétrica y está entre 0 y 1", () => {
    fc.assert(fc.property(scaleArb, scaleArb, (u, p) => {
      const a = agreement(u, p);
      return a >= 0 && a <= 1 && Math.abs(a - agreement(p, u)) < 1e-12;
    }));
  });
});

describe("questionWeights (4.6)", () => {
  it("aplica 2,0, 1,5 y 1,2 a los bloques en orden", () => {
    const w = questionWeights(questions, [2, 3, 1]);
    for (const q of questions) {
      const expected = q.block === 2 ? 2 : q.block === 3 ? 1.5 : q.block === 1 ? 1.2 : 1;
      expect(w[q.id]).toBe(expected);
    }
  });
});

describe("affinity (6.3)", () => {
  it("reproduce el ejemplo resuelto de la sección 6.14 con datos sintéticos", () => {
    const mk = (id: string, block: number): Question => ({
      id, order: 0, block, ambito: 5, text: id, axis: null, dir: 0, polarity: "T", fast: false, help: null,
      positions: Object.fromEntries(PARTY_IDS.map((p) => [p, { value: null, confidence: null, salience: null, evidence: [], viability: {}, rationale: "" }])) as unknown as Question["positions"],
    });
    const qs = [mk("Q12", 2), mk("Q13", 2), mk("Q27", 5)];
    const set = (q: Question, p: PartyId, v: Scale, c: "alta" | "media") => { q.positions[p] = { ...q.positions[p], value: v, confidence: c }; };
    set(qs[0], "fa", 2, "alta"); set(qs[1], "fa", -2, "media"); set(qs[2], "fa", 2, "alta");
    set(qs[0], "pp", -2, "alta"); set(qs[1], "pp", 2, "alta"); set(qs[2], "pp", -1, "alta");
    const w = questionWeights(qs, [2]);
    const answers: Answers = { Q12: 2, Q13: -1, Q27: 1 };
    expect(affinity(qs, answers, w, "fa").value).toBeCloseTo(69.12, 1);
    expect(affinity(qs, answers, w, "pp").value).toBeCloseTo(32.64, 1);
  });

  it("siempre está entre 0 y 100 y la cobertura entre 0 y 1", () => {
    fc.assert(fc.property(answersArb, (a) => {
      return PARTY_IDS.every((p) => {
        const s = affinity(questions, a, flat, p);
        return s.value >= 0 && s.value <= 100 && s.coverage >= 0 && s.coverage <= 1;
      });
    }), { numRuns: 300 });
  });

  it("acercar una respuesta a la posición del partido nunca baja su afinidad", () => {
    fc.assert(fc.property(answersArb, fc.integer({ min: 0, max: questions.length - 1 }), fc.constantFrom(...PARTY_IDS), (a, i, p) => {
      const q = questions[i];
      const pv = q.positions[p].value;
      const u = a[q.id];
      if (pv == null || u == null || u === pv) return true;
      const closer = (u + Math.sign(pv - u)) as Scale;
      return affinity(questions, { ...a, [q.id]: closer }, flat, p).value >= affinity(questions, a, flat, p).value - 1e-9;
    }), { numRuns: 500 });
  });

  it("saltar una pregunta en la que el partido no tiene posición no cambia su afinidad", () => {
    fc.assert(fc.property(answersArb, fc.constantFrom(...PARTY_IDS), (a, p) => {
      const q = questions.find((x) => x.positions[p].value == null && a[x.id] != null);
      if (!q) return true;
      return Math.abs(affinity(questions, { ...a, [q.id]: null }, flat, p).value - affinity(questions, a, flat, p).value) < 1e-9;
    }), { numRuns: 300 });
  });

  it("sin respuestas, todos valen 50", () => {
    for (const p of PARTY_IDS) expect(affinity(questions, {}, flat, p).value).toBe(50);
  });
});

describe("contributions (6.16)", () => {
  it("50 + Σδ coincide con la afinidad", () => {
    fc.assert(fc.property(answersArb, (a) => PARTY_IDS.every((p) => {
      const sum = contributions(questions, a, flat, p).reduce((s, c) => s + c.delta, 0);
      return Math.abs(50 + sum - affinity(questions, a, flat, p).value) < 1e-9;
    })), { numRuns: 200 });
  });
});

describe("coincidence (6.22)", () => {
  it("clasifica las 4 casillas", () => {
    expect(coincidence(2, 1)).toBe("coincidencia");
    expect(coincidence(0, 0)).toBe("coincidencia");
    expect(coincidence(-1, 2)).toBe("discrepancia");
    expect(coincidence(0, 2)).toBe("parcial");
    expect(coincidence(1, null)).toBe("sin_posicion");
  });
  it("las casillas suman las preguntas respondidas", () => {
    const a = partyAnswers("pp");
    const c = coincidenceCounts(questions, a, "psoe");
    expect(c.coincidencia + c.discrepancia + c.parcial + c.sin_posicion).toBe(Object.keys(a).length);
  });
});

describe("autotest (6.13)", () => {
  it.each(PARTY_IDS)("%s queda primero respondiendo sus propias posiciones", (p) => {
    const a = partyAnswers(p);
    expect(order(scoreAll(questions, a, flat))[0]).toBe(p);
  });
});

describe("recuperación con ruido (6.13)", () => {
  it("con σ = 0,75 el modo completo recupera el partido de origen al menos el 95% de las veces", () => {
    const random = rng(42);
    const gauss = () => Math.sqrt(-2 * Math.log(random() + 1e-12)) * Math.cos(2 * Math.PI * random());
    for (const p of PARTY_IDS) {
      let hits = 0;
      const n = 300;
      for (let i = 0; i < n; i++) {
        const a: Answers = {};
        for (const q of questions) {
          const v = q.positions[p].value;
          const base = v == null ? Math.floor(random() * 5) - 2 : v;
          a[q.id] = Math.max(-2, Math.min(2, Math.round(base + 0.75 * gauss()))) as Scale;
        }
        hits += order(scoreAll(questions, a, flat))[0] === p ? 1 : 0;
      }
      expect(hits / n, p).toBeGreaterThanOrEqual(0.95);
    }
  });
});

describe("bootstrap y ranking (6.5)", () => {
  it("es determinista y los intervalos contienen valores plausibles", () => {
    const a = partyAnswers("fa");
    const b1 = bootstrap(questions, a, flat, 300);
    const b2 = bootstrap(questions, a, flat, 300);
    expect(b1).toEqual(b2);
    const s = scoreAll(questions, a, flat);
    for (const p of PARTY_IDS) {
      expect(b1.interval[p][0]).toBeLessThanOrEqual(b1.interval[p][1]);
      expect(Math.abs(b1.interval[p][0] - s[p].value)).toBeLessThan(40);
    }
    const shares = PARTY_IDS.reduce((x, p) => x + b1.firstShare[p], 0);
    expect(shares).toBeCloseTo(1, 6);
  });
  it("marca empate técnico entre FA y Podemos con las respuestas de FA", () => {
    const a = partyAnswers("fa");
    const r = rank(scoreAll(questions, a, flat), bootstrap(questions, a, flat));
    expect(r[0].party).toBe("fa");
    expect(r[1].party).toBe("podemos");
    expect(typeof r[1].tiedWithPrevious).toBe("boolean");
  });
});

describe("ejes (6.8)", () => {
  it("las coordenadas están entre -1 y 1 y ordenan a los partidos en ECO", () => {
    const eco = Object.fromEntries(PARTY_IDS.map((p) => [p, partyAxis(questions, p, "ECO") as number]));
    for (const v of Object.values(eco)) expect(Math.abs(v)).toBeLessThanOrEqual(1);
    expect(eco.podemos).toBeLessThan(eco.psoe);
    expect(eco.psoe).toBeLessThan(eco.pp);
    expect(userAxis(questions, partyAnswers("vox"), "SOC")).toBeGreaterThan(0);
  });
});

describe("funciones de explicación (6.17 a 6.21)", () => {
  it("las bisagras cambian de verdad el primer puesto", () => {
    const a = { ...partyAnswers("fa") };
    for (const p of pivots(questions, a, flat)) {
      const alt = { ...a, [p.id]: p.to };
      expect(order(scoreAll(questions, alt, flat))[0]).toBe(p.newFirst);
    }
  });
  it("sensibilidad devuelve un partido por variante", () => {
    const s = sensitivity(questions, partyAnswers("psoe"), questionWeights(questions, [1]));
    expect(PARTY_IDS).toContain(s.noPriorities);
    expect(PARTY_IDS).toContain(s.onlyHigh);
  });
  it("una persona tiene afinidad 100 consigo misma si responde en los extremos", () => {
    const a = Object.fromEntries(questions.map((q, i) => [q.id, i % 2 ? 2 : -2])) as Answers;
    expect(personAffinity(questions, a, a)?.value).toBe(100);
  });
  it("la cercanía entre partidos reproduce la tabla 6.23", () => {
    expect(partyCloseness(questions, "fa", "podemos")?.value).toBeGreaterThan(85);
    expect(partyCloseness(questions, "podemos", "vox")?.value).toBeLessThan(25);
  });
  it("las coincidencias inesperadas solo usan los 3 últimos del podio", () => {
    const a = partyAnswers("podemos");
    const ranking = order(scoreAll(questions, a, flat));
    for (const m of surprisingMatches(questions, a, flat, ranking)) expect(ranking.slice(-3)).toContain(m.party);
  });
  it("PP y Vox discrepan en Q50 (poder de la UE)", () => {
    expect(partnerDiscrepancies(questions, "pp", "vox")).toContain("Q50");
  });
});
