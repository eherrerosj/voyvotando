/**
 * Serialización del resultado en el fragmento de la URL (docs/arquitectura.md 8.5 y docs/metodologia.md 6.24).
 * Formato: #v=<versión>&m=<c|r>&p=<bloques separados por coma>&r=<respuestas en base 36>
 * Cada pregunta, en el orden del banco, es un dígito en base 6: 0 sin respuesta, 1..5 = -2..+2.
 */
import type { Answers, Scale } from "./types";

/** Solo hace falta el id y el orden de las preguntas. */
type Q = { id: string };

export interface SavedState {
  version: string;
  mode: "c" | "r";
  priorities: number[];
  answers: Answers;
}

export function encodeAnswers(questions: Q[], answers: Answers): string {
  let n = 0n;
  for (const q of questions) {
    const v = answers[q.id];
    n = n * 6n + BigInt(v == null ? 0 : v + 3);
  }
  return n.toString(36);
}

export function decodeAnswers(questions: Q[], code: string): Answers {
  let n = 0n;
  for (const ch of code.toLowerCase()) {
    const d = parseInt(ch, 36);
    if (Number.isNaN(d)) throw new Error("código no válido");
    n = n * 36n + BigInt(d);
  }
  const digits: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    digits.unshift(Number(n % 6n));
    n /= 6n;
  }
  const out: Answers = {};
  questions.forEach((q, i) => {
    const d = digits[i];
    if (d > 0) out[q.id] = (d - 3) as Scale;
  });
  return out;
}

export function toHash(questions: Q[], s: SavedState): string {
  const params = new URLSearchParams({ v: s.version, m: s.mode, p: s.priorities.join(","), r: encodeAnswers(questions, s.answers) });
  return "#" + params.toString();
}

export function fromHash(questions: Q[], hash: string): SavedState | null {
  try {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const r = params.get("r");
    if (!r) return null;
    const p = (params.get("p") || "").split(",").map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 8);
    return { version: params.get("v") || "", mode: params.get("m") === "r" ? "r" : "c", priorities: p.slice(0, 3), answers: decodeAnswers(questions, r) };
  } catch {
    return null;
  }
}

const KEY = "voyvotando:progreso";

export function saveProgress(s: SavedState & { index: number }): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* almacenamiento no disponible: el test sigue funcionando */
  }
}

export function loadProgress(): (SavedState & { index: number }) | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}
