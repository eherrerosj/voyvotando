/** Datos mínimos para el test: textos, bloques e interludios, sin posiciones ni citas (docs/arquitectura.md 8.6). */
import coreJson from "../content/questions_core.json";
import blocksJson from "../content/blocks.json";
import metaJson from "../content/meta.json";
import interludesJson from "../content/interludes.json";
import type { Block, Help } from "./types";

export interface CoreQuestion { id: string; order: number; block: number; ambito: number; text: string; fast: boolean; help: Help | null }
export const CORE_QUESTIONS = coreJson as CoreQuestion[];
export const CORE_FAST = CORE_QUESTIONS.filter((q) => q.fast);
export const BLOCKS = blocksJson as Block[];
export const META = metaJson as { version: string; questions: number; fast: number };
export const INTERLUDES = interludesJson as { bloque: number; dato: string; fuente: unknown }[];
