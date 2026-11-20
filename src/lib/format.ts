import type { Coincidence } from "./scoring";
import type { PartyId, Rating, Scale } from "./types";

/** Nombre corto que se muestra en la interfaz. */
export const DISPLAY: Record<PartyId, string> = { fa: "Frente Amplio", podemos: "Podemos", pp: "PP", psoe: "PSOE", salf: "SALF", vox: "Vox" };
/** Sigla para gráficos con poco espacio. */
export const ABBR: Record<PartyId, string> = { fa: "FA", podemos: "Podemos", pp: "PP", psoe: "PSOE", salf: "SALF", vox: "Vox" };

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
