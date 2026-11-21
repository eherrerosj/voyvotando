import metaJson from "../content/meta.json";
import type { Coincidence } from "./scoring";
import type { PartyId, Rating, Scale } from "./types";

type PartyInfo = { display: string; abbr: string; scope: "estatal" | "autonomico"; districts: string[] };
const INFO = (metaJson as unknown as { partyInfo: Record<PartyId, PartyInfo> }).partyInfo;
const pick = (k: "display" | "abbr") => Object.fromEntries(Object.entries(INFO).map(([id, i]) => [id, i[k]])) as Record<PartyId, string>;
/** Nombre corto que se muestra en la interfaz (data/partidos.json, campo "mostrar"). */
export const DISPLAY = pick("display");
/** Sigla para gráficos con poco espacio (campo "sigla"). */
export const ABBR = pick("abbr");
/** Lista legible: "A, B y C". */
export const joinEs = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
/** Circunscripciones de un partido autonómico, o null si se presenta en toda España. */
export const districtsOf = (p: PartyId): string[] | null => (INFO[p]?.scope === "autonomico" ? INFO[p].districts : null);
/** "Solo se presenta en Álava, Bizkaia y Gipuzkoa", o null para los partidos estatales. */
export const districtNote = (p: PartyId) => {
  const d = districtsOf(p);
  return d ? (d.length ? `Solo se presenta en ${joinEs(d)}` : "Solo se presenta en algunas provincias") : null;
};

export const SCALE_LABEL: Record<string, string> = {
  "2": "Muy de acuerdo", "1": "De acuerdo", "0": "Ni de acuerdo ni en desacuerdo", "-1": "En desacuerdo", "-2": "Muy en desacuerdo",
};
export const answerLabel = (v: Scale | null | undefined) => (v == null ? "Sin respuesta" : SCALE_LABEL[String(v)]);

export const PARTY_POSITION_LABEL: Record<string, string> = {
  "2": "Lo propone", "1": "A favor con matices", "0": "Posición intermedia", "-1": "En contra con matices", "-2": "Propone lo contrario",
};

export const COINCIDENCE_LABEL: Record<Coincidence, string> = {
  coincidencia: "coincidencias", discrepancia: "discrepancias", parcial: "parciales", sin_posicion: "sin posición",
};

export const RATINGS: Rating[] = ["Alta", "Media", "Baja", "NE"];
export const RATING_HELP: Record<Rating, string> = {
  Alta: "Instrumento identificable y ruta política razonablemente directa en ese escenario.",
  Media: "Necesita acuerdos, presupuesto, capacidad o desarrollo importante.",
  Baja: "Plazo, dependencia externa o barrera institucional hacen poco defendible el cumplimiento íntegro.",
  NE: "No estimable: objetivo sin umbral verificable u horizonte fuera del mandato.",
};

export const pct = (x: number) => Math.round(x).toLocaleString("es-ES");
export const dec1 = (x: number) => x.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const signed = (x: number) => (x >= 0 ? "+" : "−") + dec1(Math.abs(x));
