import questionsJson from "../content/questions.json";
import partiesJson from "../content/parties.json";
import blocksJson from "../content/blocks.json";
import metaJson from "../content/meta.json";
import ambitosJson from "../content/ambitos.json";
import glossaryJson from "../content/glossary.json";
import interludesJson from "../content/interludes.json";
import type { Block, Party, PartyId, Question } from "./types";

export const QUESTIONS = questionsJson as unknown as Question[];
export const PARTIES = partiesJson as unknown as Party[];
export const BLOCKS = blocksJson as Block[];
export const META = metaJson as {
  version: string; sha256: string; questions: number; fast: number; parties: number; units: number;
  reportPages: number; cutoff: string; adjudicated: boolean; electionDate: string;
};
export const AMBITOS = ambitosJson as Record<string, string>;
export const GLOSSARY = glossaryJson as { termino: string; definicion: string; norma?: string; fuente?: unknown }[];
export const INTERLUDES = interludesJson as { bloque: number; dato: string; fuente: unknown }[];

export const PARTY_BY_ID = Object.fromEntries(PARTIES.map((p) => [p.id, p])) as Record<PartyId, Party>;
export const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q])) as Record<string, Question>;
export const FAST_QUESTIONS = QUESTIONS.filter((q) => q.fast);

/** Minutos estimados a 12 segundos por pregunta (docs/metodologia.md 4.3). */
export const minutesFor = (n: number) => Math.round((n * 12) / 60);
