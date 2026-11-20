import { useEffect, useMemo, useState } from "react";
import { BLOCKS, PARTY_BY_ID, QUESTIONS, QUESTION_BY_ID } from "../../lib/data";
import { ABBR, DISPLAY, PARTY_POSITION_LABEL, RATINGS, RATING_HELP, answerLabel, pct, signed } from "../../lib/format";
import {
  agreement, blockAffinity, contributions, partnerDiscrepancies, partyAxis, surprisingMatches, userAxis,
  type BootstrapResult, type PartyScore, type Pivot, type RankedParty,
} from "../../lib/scoring";
import { PARTY_IDS, type Answers, type PartyId, type Question, type Rating, type Scale } from "../../lib/types";
import { AxisMap, MiniBars, Ruler, Waterfall } from "./charts";

export interface Ctx {
  answers: Answers;
  weights: Record<string, number>;
  priorities: number[];
  scores: Record<PartyId, PartyScore>;
  ranked: RankedParty[];
  order: PartyId[];
  boot: BootstrapResult;
  pivots: Pivot[];
  setAnswer: (id: string, v: Scale | null) => void;
}

const shortText = (q: Question, n = 90) => (q.text.length > n ? q.text.slice(0, n - 1).trimEnd() + "…" : q.text);

function PartyChips({ order, value, onChange, label }: { order: PartyId[]; value: PartyId; onChange: (p: PartyId) => void; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {order.map((p) => (
        <button key={p} type="button" className="chip" aria-pressed={value === p} onClick={() => onChange(p)}>{DISPLAY[p]}</button>
      ))}
    </div>
  );
}

function Quote({ q, party }: { q: Question; party: PartyId }) {
  const pos = q.positions[party];
  const e = pos.evidence[0];
  if (!e) return null;
  const pdf = PARTY_BY_ID[e.sourceReport]?.report.pdf;
  return (
    <blockquote className="quote">
      «{e.quote}»
      <footer className="small muted">
        {e.sourceReport === party ? "Informe" : `Dato documentado en el informe`} de {DISPLAY[e.sourceReport]}{e.unitId ? `, unidad ${e.unitId}` : ""}{e.page ? `, p. ${e.page}` : ""}.{" "}
        {pdf && e.page ? <a href={`${pdf}#page=${e.page}`} target="_blank" rel="noopener">Ver en el informe</a> : null}
      </footer>
    </blockquote>
  );
}

/* 3. Por qué */
export function WhySection({ ctx }: { ctx: Ctx }) {
  const [party, setParty] = useState<PartyId>(ctx.order[0]);
  const items = useMemo(() => contributions(QUESTIONS, ctx.answers, ctx.weights, party), [ctx.answers, ctx.weights, party]);
  const sorted = [...items].sort((a, b) => b.delta - a.delta);
  const unite = sorted.filter((x) => x.delta > 0).slice(0, 3);
  const split = [...sorted].reverse().filter((x) => x.delta < 0).slice(0, 3);
  const Row = ({ id, delta }: { id: string; delta: number }) => {
    const q = QUESTION_BY_ID[id];
    return (
      <li>
        <p className="why__q">{q.text}</p>
        <p className="small">
          Tú: <strong>{answerLabel(ctx.answers[id])}</strong>. {DISPLAY[party]}: <strong>{PARTY_POSITION_LABEL[String(q.positions[party].value)]}</strong>.{" "}
          <span className={delta >= 0 ? "pos" : "neg"}>{signed(delta)} puntos</span>
        </p>
      </li>
    );
  };
  return (
    <>
      <PartyChips order={ctx.order} value={party} onChange={setParty} label="Elige partido" />
      <div className="why">
        <div>
          <h3 className="serif">Lo que más os une</h3>
          {unite.length ? <ol className="why__list">{unite.map((x) => <Row key={x.id} {...x} />)}</ol> : <p className="muted">No hay preguntas que sumen afinidad.</p>}
        </div>
        <div>
          <h3 className="serif">Lo que más os separa</h3>
          {split.length ? <ol className="why__list">{split.map((x) => <Row key={x.id} {...x} />)}</ol> : <p className="muted">No hay preguntas que resten afinidad.</p>}
        </div>
      </div>
      <h3 className="serif">De dónde sale el {pct(ctx.scores[party].value)}%</h3>
      <Waterfall items={items} final={ctx.scores[party].value} labelFor={(id) => shortText(QUESTION_BY_ID[id], 70)} />
      <div className="pivots">
        <h3 className="serif">Preguntas bisagra</h3>
        {ctx.pivots.length ? (
          <ul>
            {ctx.pivots.map((p) => (
              <li key={p.id}>
                <p>
                  Si en «{shortText(QUESTION_BY_ID[p.id], 80)}» hubieras respondido <strong>{p.to == null ? "Prefiero no responder" : answerLabel(p.to)}</strong> en vez de{" "}
                  <strong>{answerLabel(p.from)}</strong>, <strong>{DISPLAY[p.newFirst]}</strong> pasaría a primero.
                </p>
                <button type="button" className="btn btn--small" onClick={() => ctx.setAnswer(p.id, p.to)}>Probar este cambio</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Ningún cambio de un punto en una sola respuesta mueve tu primer puesto. Tu resultado es estable.</p>
        )}
      </div>
    </>
  );
}

/* 4. Mapa */
export function MapSection({ ctx }: { ctx: Ctx }) {
  const [picked, setPicked] = useState<PartyId | null>(null);
  const ux = userAxis(QUESTIONS, ctx.answers, "ECO"), uy = userAxis(QUESTIONS, ctx.answers, "SOC");
  const user = ux != null && uy != null ? { x: ux, y: uy } : null;
  const parties = PARTY_IDS.map((id) => ({ id, x: partyAxis(QUESTIONS, id, "ECO") ?? 0, y: partyAxis(QUESTIONS, id, "SOC") ?? 0 }));
  const gaps = useMemo(() => {
    if (!picked) return [];
    return QUESTIONS.filter((q) => (q.axis === "ECO" || q.axis === "SOC") && ctx.answers[q.id] != null && q.positions[picked].value != null)
      .map((q) => ({ q, d: Math.abs((ctx.answers[q.id] as number) - (q.positions[picked].value as number)) }))
      .filter((x) => x.d >= 2)
      .sort((a, b) => b.d - a.d)
      .slice(0, 3);
  }, [picked, ctx.answers]);
  if (!user) return <p>Responde preguntas de economía y de temas sociales para ver tu posición en el mapa.</p>;
  return (
    <div className="mapwrap">
      <AxisMap user={user} parties={parties} ellipse={ctx.boot.userAxes} picked={picked} onPick={setPicked} />
      <div>
        {picked ? (
          <>
            <h3 className="serif">Qué te separa de {DISPLAY[picked]}</h3>
            {gaps.length ? (
              <ul className="plain">
                {gaps.map(({ q }) => (
                  <li key={q.id}>«{q.text}» Tú: <strong>{answerLabel(ctx.answers[q.id])}</strong>. {DISPLAY[picked]}: <strong>{PARTY_POSITION_LABEL[String(q.positions[picked].value)]}</strong>.</li>
                ))}
              </ul>
            ) : <p>En estos dos ejes no hay ninguna pregunta en la que os separen 2 puntos o más.</p>}
          </>
        ) : (
          <p className="muted">Toca un partido en el mapa para ver las preguntas que más os separan.</p>
        )}
      </div>
    </div>
  );
}

/* 5. Por temas */
export function BlocksSection({ ctx }: { ctx: Ctx }) {
  const data = BLOCKS.map((b) => {
    const values = ctx.order.map((id) => ({ id, value: blockAffinity(QUESTIONS, ctx.answers, ctx.weights, id, b.id)?.value ?? null }));
    const valid = values.filter((v) => v.value != null).sort((x, y) => (y.value as number) - (x.value as number));
    return { b, values, top: valid[0], second: valid[1] };
  });
  const lines = data.filter((d) => d.top).map((d) => {
    const close = d.second && (d.top!.value as number) - (d.second.value as number) < 3;
    return `En ${d.b.name.toLowerCase()} coincides más con ${DISPLAY[d.top!.id]}${close ? ` y casi igual con ${DISPLAY[d.second!.id]}` : ""}.`;
  });
  return (
    <>
      {lines.length > 0 && <p className="blocks__summary">{lines.join(" ")}</p>}
      <ul className="blocks">
        {data.map((d) => (
          <li key={d.b.id} className={"card blocks__card" + (ctx.priorities.includes(d.b.id) ? " is-priority" : "")}>
            <p className="kicker">{ctx.priorities.includes(d.b.id) ? `Prioridad ${ctx.priorities.indexOf(d.b.id) + 1}` : `Bloque ${d.b.id}`}</p>
            <h3 className="serif">{d.b.name}</h3>
            {d.top ? <MiniBars values={d.values} /> : <p className="small muted">Sin datos suficientes en este bloque.</p>}
          </li>
        ))}
      </ul>
    </>
  );
}

/* 6. Coincidencias inesperadas */
export function SurprisingSection({ ctx }: { ctx: Ctx }) {
  const items = surprisingMatches(QUESTIONS, ctx.answers, ctx.weights, ctx.order);
  if (!items.length) return <p>No hay coincidencias fuertes con los 3 partidos que quedan más lejos de ti.</p>;
  return (
    <ul className="surprise">
      {items.map((m) => {
        const q = QUESTION_BY_ID[m.id];
        const place = ctx.order.indexOf(m.party) + 1;
        return (
          <li key={m.id + m.party} className="card">
            <p className="kicker">{DISPLAY[m.party]} · {place}º en tu podio</p>
            <p className="serif surprise__q">«{q.text}»</p>
            <p className="small">Tú: <strong>{answerLabel(ctx.answers[m.id])}</strong>. {DISPLAY[m.party]}: <strong>{PARTY_POSITION_LABEL[String(q.positions[m.party].value)]}</strong>.</p>
            <Quote q={q} party={m.party} />
          </li>
        );
      })}
    </ul>
  );
}

type UnitInfo = { id: string; title: string; text: string; condition: string | null; figures: string[]; page: number };
const unitCache = new Map<PartyId, Promise<UnitInfo[]>>();
function useUnits(party: PartyId) {
  const [units, setUnits] = useState<UnitInfo[] | null>(null);
  useEffect(() => {
    let alive = true;
    if (!unitCache.has(party)) unitCache.set(party, fetch(`/datos/unidades-${party}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => []));
    unitCache.get(party)!.then((u) => alive && setUnits(u));
    return () => { alive = false; };
  }, [party]);
  return units;
}

/* 7. Si gobiernan */
export function ScenarioSection({ ctx }: { ctx: Ctx }) {
  const [party, setParty] = useState<PartyId>(ctx.order[0]);
  const [scen, setScen] = useState<"A" | "B" | "C">("A");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const units = useUnits(party);
  const P = PARTY_BY_ID[party];
  const matches = QUESTIONS.filter((q) => {
    const u = ctx.answers[q.id], v = q.positions[party].value;
    return u != null && v != null && agreement(u, v) >= 0.75;
  });
  const col = (q: Question): Rating | "sin" => (q.positions[party].viability[scen] as Rating) ?? "sin";
  const groups: (Rating | "sin")[] = [...RATINGS, "sin"];
  const count = (r: Rating | "sin") => matches.filter((q) => col(q) === r).length;
  return (
    <>
      <PartyChips order={ctx.order} value={party} onChange={setParty} label="Partido que gobierna" />
      <div className="chips" role="group" aria-label="Escenario">
        {(["A", "B", "C"] as const).map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={scen === k} onClick={() => setScen(k)}>{k}: {P.scenarios[k].label}</button>
        ))}
      </div>
      <p className="small">{P.scenarios[scen].definition}</p>
      <p className="scen__count">
        {matches.length ? <>{count("Alta")} de tus {matches.length} coincidencias con {DISPLAY[party]} tienen aprobación <strong>Alta</strong> en este escenario.</> : <>No tienes coincidencias claras con {DISPLAY[party]}.</>}
      </p>
      <div className="scen">
        {groups.map((g) => {
          const qs = matches.filter((q) => col(q) === g);
          if (g === "sin" && !qs.length) return null;
          return (
            <section key={g} className="scen__col" aria-label={`Aprobación ${g === "sin" ? "sin valoración" : g}`}>
              <h3 className="display scen__head">{g === "sin" ? "Sin valoración" : g} <span>{qs.length}</span></h3>
              {g !== "sin" && <p className="small muted">{RATING_HELP[g]}</p>}
              {(open[`${party}-${scen}-${g}`] ? qs : qs.slice(0, 4)).map((q) => {
                const e = q.positions[party].evidence[0];
                const u = units?.find((x) => x.id === e?.unitId);
                const v = q.positions[party].value as number;
                return (
                  <article key={q.id} className="scen__card">
                    <p className="small"><strong>{e?.unitId ?? ""}{u ? ` · ${u.title}` : ""}</strong></p>
                    {e?.quote && <p className="small">{e.sourceReport === party ? "Propone" : `Según el informe de ${DISPLAY[e.sourceReport]}`}: «{e.quote}»</p>}
                    {u?.condition && <p className="small muted">Condición: {u.condition}</p>}
                    {u?.figures?.length ? <p className="small muted">Cifras: {u.figures.slice(0, 2).join("; ")}</p> : null}
                    {q.positions[party].viability.E && <p className="small">Entrega: <strong>{q.positions[party].viability.E}</strong></p>}
                    <p className="small muted scen__rel">
                      Coincidís {v > 0 ? "a favor de" : v < 0 ? "en contra de" : "en una posición intermedia sobre"}: «{shortText(q, 90)}»
                    </p>
                  </article>
                );
              })}
              {qs.length > 4 && !open[`${party}-${scen}-${g}`] && (
                <button type="button" className="btn btn--small scen__more" onClick={() => setOpen((o) => ({ ...o, [`${party}-${scen}-${g}`]: true }))}>
                  Ver {qs.length - 4} más
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="small muted">Son juicios cualitativos del informe de {DISPLAY[party]}. No son probabilidades y no se promedian.</p>
    </>
  );
}

/* 8. Pactos */
export function CoalitionSection({ ctx }: { ctx: Ctx }) {
  const [party, setParty] = useState<PartyId>(ctx.order[0]);
  const P = PARTY_BY_ID[party];
  return (
    <>
      <PartyChips order={ctx.order} value={party} onChange={setParty} label="Partido" />
      <div className="coal">
        <div>
          <p className="kicker">Escenario B del informe</p>
          <h3 className="serif">{P.scenarios.B.label}</h3>
          <p>{P.scenarios.B.definition}</p>
          {P.partners.map((partner) => {
            const ids = partnerDiscrepancies(QUESTIONS, party, partner);
            return (
              <div key={partner} className="coal__partner">
                <h4 className="serif">Con {DISPLAY[partner]}: tu afinidad {pct(ctx.scores[partner].value)}%</h4>
                {ids.length ? (
                  <>
                    <p className="small">Si gobiernan juntos, esto se negocia ({ids.length} {ids.length === 1 ? "pregunta" : "preguntas"} con 2 puntos o más de diferencia):</p>
                    <ul className="plain">
                      {ids.map((id) => {
                        const q = QUESTION_BY_ID[id];
                        return (
                          <li key={id}>
                            «{shortText(q, 100)}» {ABBR[party]}: {PARTY_POSITION_LABEL[String(q.positions[party].value)]}. {ABBR[partner]}: {PARTY_POSITION_LABEL[String(q.positions[partner].value)]}. Tú: <strong>{answerLabel(ctx.answers[id])}</strong>.
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : <p className="small">No discrepan 2 puntos o más en ninguna pregunta del test.</p>}
              </div>
            );
          })}
        </div>
        <div>
          <p className="kicker">Interlocutores según el informe de {DISPLAY[party]}</p>
          <div className="table-scroll" tabIndex={0} role="region" aria-label={`Interlocutores de ${DISPLAY[party]} según su informe`}>
          <table className="table">
            <thead><tr><th scope="col">Con</th><th scope="col">Terreno común</th><th scope="col">Fricciones</th></tr></thead>
            <tbody>
              {P.agreements.map((a, i) => (
                <tr key={i}>
                  <th scope="row">{a.counterpart}</th>
                  <td className="small" data-label="Terreno común">{a.commonGround}</td>
                  <td className="small" data-label="Fricciones">{a.frictions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}

const SIGN: Record<string, string> = { "2": "++", "1": "+", "0": "=", "-1": "−", "-2": "−−" };

/** Versión impresa de "Pregunta a pregunta": una fila por pregunta, sin citas (docs/arquitectura.md 7.4, sección 10). */
function PrintTable({ answers }: { answers: Answers }) {
  return (
    <div className="print-only">
      <p className="small">Leyenda: ++ muy de acuerdo o lo propone; + de acuerdo o a favor con matices; = intermedio; − en desacuerdo; −− muy en desacuerdo o propone lo contrario; · sin respuesta o sin posición documentada. Las citas y páginas de cada posición están en la versión web de este resultado.</p>
      <table className="qtable">
        <thead>
          <tr><th scope="col">Nº</th><th scope="col">Afirmación</th><th scope="col">Tú</th>{PARTY_IDS.map((p) => <th key={p} scope="col">{ABBR[p]}</th>)}</tr>
        </thead>
        <tbody>
          {QUESTIONS.map((q) => (
            <tr key={q.id}>
              <td>{q.order}</td>
              <td>{q.text}</td>
              <td className="qtable__you">{answers[q.id] == null ? "·" : SIGN[String(answers[q.id])]}</td>
              {PARTY_IDS.map((p) => <td key={p}>{q.positions[p].value == null ? "·" : SIGN[String(q.positions[p].value)]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* 9. Pregunta a pregunta */
export function QuestionsSection({ ctx }: { ctx: Ctx }) {
  const [block, setBlock] = useState<number | 0>(0);
  const [onlyPrio, setOnlyPrio] = useState(false);
  const [onlyClash, setOnlyClash] = useState(false);
  const [onlyPivot, setOnlyPivot] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const first = ctx.order[0];
  const pivotIds = new Set(ctx.pivots.map((p) => p.id));
  const list = QUESTIONS.filter((q) => {
    if (block && q.block !== block) return false;
    if (onlyPrio && !ctx.priorities.includes(q.block)) return false;
    if (onlyClash) {
      const u = ctx.answers[q.id], v = q.positions[first].value;
      if (u == null || v == null || u * v >= 0) return false;
    }
    if (onlyPivot && !pivotIds.has(q.id)) return false;
    return true;
  });
  return (
    <>
      <div className="filters">
        <label className="small">Bloque{" "}
          <select value={block} onChange={(e) => setBlock(Number(e.target.value))}>
            <option value={0}>Todos</option>
            {BLOCKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <button type="button" className="chip" aria-pressed={onlyPrio} onClick={() => setOnlyPrio((x) => !x)} disabled={!ctx.priorities.length}>Solo mis prioridades</button>
        <button type="button" className="chip" aria-pressed={onlyClash} onClick={() => setOnlyClash((x) => !x)}>Solo donde discrepo de {DISPLAY[first]}</button>
        <button type="button" className="chip" aria-pressed={onlyPivot} onClick={() => setOnlyPivot((x) => !x)} disabled={!ctx.pivots.length}>Solo bisagras</button>
      </div>
      <p className="small muted no-print">{list.length} preguntas.</p>
      <PrintTable answers={ctx.answers} />
      <ol className="qlist">
        {(showAll || block || onlyPrio || onlyClash || onlyPivot ? list : list.slice(0, 10)).map((q) => {
          const missing = PARTY_IDS.filter((p) => q.positions[p].value == null);
          return (
            <li key={q.id} className="qlist__item">
              <p className="kicker">{BLOCKS.find((b) => b.id === q.block)?.name} · {q.order}</p>
              <p className="serif qlist__text">«{q.text}»</p>
              <Ruler q={q} answer={ctx.answers[q.id]} />
              {missing.length > 0 && <p className="small muted">Sin posición documentada: {missing.map((p) => DISPLAY[p]).join(", ")}.</p>}
              <details>
                <summary>Qué dice cada informe</summary>
                <ul className="evidence">
                  {PARTY_IDS.filter((p) => q.positions[p].value != null).map((p) => {
                    const pos = q.positions[p];
                    return (
                      <li key={p}>
                        <p><strong>{DISPLAY[p]}</strong>: {PARTY_POSITION_LABEL[String(pos.value)]} <span className="small muted">(confianza {pos.confidence})</span>
                          {Object.keys(pos.viability).length > 0 && <span className="small"> · A {pos.viability.A ?? "–"} / B {pos.viability.B ?? "–"} / C {pos.viability.C ?? "–"} / E {pos.viability.E ?? "–"}</span>}
                        </p>
                        <Quote q={q} party={p} />
                      </li>
                    );
                  })}
                </ul>
                {q.help?.ahora && <p className="small"><strong>Situación actual.</strong> {q.help.ahora}</p>}
                <label className="small change">Cambiar mi respuesta{" "}
                  <select value={ctx.answers[q.id] == null ? "x" : String(ctx.answers[q.id])} onChange={(e) => ctx.setAnswer(q.id, e.target.value === "x" ? null : (Number(e.target.value) as Scale))}>
                    {[2, 1, 0, -1, -2].map((v) => <option key={v} value={v}>{answerLabel(v as Scale)}</option>)}
                    <option value="x">Prefiero no responder</option>
                  </select>
                </label>
              </details>
            </li>
          );
        })}
      </ol>
      {!showAll && !block && !onlyPrio && !onlyClash && !onlyPivot && list.length > 10 && (
        <button type="button" className="btn qlist__more no-print" onClick={() => setShowAll(true)}>Ver las {list.length} preguntas <span className="arrow" aria-hidden="true">→</span></button>
      )}
    </>
  );
}
