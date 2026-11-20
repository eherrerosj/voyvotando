import { describe, expect, it } from "vitest";
import fc from "fast-check";
import questionsJson from "../content/questions.json";
import { decodeAnswers, encodeAnswers, fromHash, toHash } from "./state";
import type { Answers, Question, Scale } from "./types";

const questions = questionsJson as unknown as Question[];

describe("serialización en la URL (8.5)", () => {
  it("codifica y decodifica sin pérdida", () => {
    fc.assert(fc.property(fc.array(fc.option(fc.constantFrom<Scale>(-2, -1, 0, 1, 2), { nil: undefined }), { minLength: 40, maxLength: 40 }), (vals) => {
      const a: Answers = {};
      questions.forEach((q, i) => { if (vals[i] !== undefined) a[q.id] = vals[i]; });
      expect(decodeAnswers(questions, encodeAnswers(questions, a))).toEqual(a);
    }));
  });
  it("cabe en menos de 32 caracteres", () => {
    const a = Object.fromEntries(questions.map((q) => [q.id, 2])) as Answers;
    expect(encodeAnswers(questions, a).length).toBeLessThan(32);
  });
  it("conserva versión, modo y prioridades", () => {
    const s = { version: "1.0", mode: "r" as const, priorities: [2, 5, 1], answers: { Q03: 1 as Scale } };
    expect(fromHash(questions, toHash(questions, s))).toEqual(s);
  });
  it("rechaza fragmentos rotos", () => {
    expect(fromHash(questions, "#r=%%%")).toBeNull();
  });
});
