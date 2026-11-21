// Mismo orden que data/partidos.json: alfabético por el nombre que se muestra. Una prueba lo comprueba.
export const PARTY_IDS = ["bildu", "fa", "pnv", "podemos", "pp", "psoe", "salf", "vox"] as const;
export type PartyId = (typeof PARTY_IDS)[number];

export type Confidence = "alta" | "media" | "baja";
export type Rating = "Alta" | "Media" | "Baja" | "NE";
export type Scale = -2 | -1 | 0 | 1 | 2;
export type Axis = "ECO" | "SOC" | "TER" | "EUR";

/** Respuesta de la persona: valor de la escala, o null si eligió "Prefiero no responder". Ausente si no llegó a la pregunta. */
export type Answers = Partial<Record<string, Scale | null>>;

export interface Evidence {
  unitId: string | null;
  page: number | null;
  quote: string;
  sourceReport: PartyId;
}

export interface Position {
  value: Scale | null;
  confidence: Confidence | null;
  salience: Confidence | null;
  evidence: Evidence[];
  viability: Partial<Record<"A" | "B" | "C" | "E", Rating>>;
  rationale: string;
}

export interface Help {
  medida: string;
  ahora: string | null;
  aFavor: string | null;
  enContra: string | null;
  fuentes: { informe: PartyId; pagina: number }[];
}

export interface Question {
  id: string;
  order: number;
  block: number;
  ambito: number;
  text: string;
  axis: Axis | null;
  dir: 1 | -1 | 0;
  polarity: "I" | "D" | "T";
  fast: boolean;
  help: Help | null;
  positions: Record<PartyId, Position>;
}

export interface Scenario {
  label: string;
  definition: string;
}

export interface Agreement {
  counterpart: string;
  commonGround: string;
  frictions: string;
}

export interface Party {
  id: PartyId;
  name: string;
  short: string;
  display: string;
  abbr: string;
  /** "estatal" o "autonomico". Los autonómicos solo se presentan en `districts`. */
  scope: "estatal" | "autonomico";
  districts: string[];
  /** Versión de los datos en la que se añadió, o null si estaba en la 1.0. */
  addedIn: string | null;
  report: { title: string; version: string; cutoff: string; programDate: string; programTitle: string; pages: number; units: number; pdf: string };
  scenarios: { A: Scenario; B: Scenario; C: Scenario; E: { definition: string } };
  conclusions: { title: string; text: string }[];
  salienceByAmbito: Record<string, Confidence>;
  internalSupport: { area: string; evidence: string; limit: string }[];
  team: { name: string; role: string }[];
  agreements: Agreement[];
  partners: PartyId[];
}

export interface Block {
  id: number;
  name: string;
  ambitos: number[];
}
