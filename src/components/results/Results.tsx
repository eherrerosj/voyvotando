import { useEffect, useMemo, useRef, useState } from "react";
import { BLOCKS, META, QUESTIONS, QUESTION_BY_ID } from "../../lib/data";
import { COINCIDENCE_LABEL, DISPLAY, answerLabel, districtNote, pct } from "../../lib/format";
import {
  LOW_PRECISION_BELOW, MIN_ANSWERS_RANKING, bootstrap, certainty, coincidenceCounts, order, personAffinity, pivots, questionWeights, rank, scoreAll, sensitivity,
  type Coincidence,
} from "../../lib/scoring";
import { fromHash, toHash, type SavedState } from "../../lib/state";
import { PARTY_IDS, type Answers, type Scale } from "../../lib/types";
import { BlocksSection, CoalitionSection, MapSection, QuestionsSection, ScenarioSection, SurprisingSection, WhySection, type Ctx } from "./Sections";
import "./results.css";

const SECTIONS = [
  { id: "titular", label: "Resultado" },
  { id: "podio", label: "Podio" },
  { id: "por-que", label: "Por qué" },
  { id: "mapa", label: "Mapa" },
  { id: "temas", label: "Por temas" },
  { id: "inesperadas", label: "Inesperadas" },
  { id: "si-gobiernan", label: "Si gobiernan" },
  { id: "pactos", label: "Pactos" },
  { id: "preguntas", label: "Pregunta a pregunta" },
  { id: "precision", label: "Precisión" },
];

export default function Results() {
  const [state, setState] = useState<SavedState | null | undefined>(undefined);
  useEffect(() => {
    setState(fromHash(QUESTIONS, window.location.hash));
  }, []);
  if (state === undefined) return <p className="wrap res-loading">Calculando…</p>;
  if (!state) {
    return (
      <section className="wrap res-empty">
        <h1 className="display">No hay resultado que mostrar</h1>
        <p>Este enlace no contiene respuestas. Haz el test para ver tu resultado.</p>
        <a className="btn btn--solid" href="/test">Hacer el test <span className="arrow" aria-hidden="true">→</span></a>
      </section>
    );
  }
  return <ResultsView initial={state} />;
}

function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(target);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function ResultsView({ initial }: { initial: SavedState }) {
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [priorities, setPriorities] = useState<number[]>(initial.priorities);
  const weights = useMemo(() => questionWeights(QUESTIONS, priorities), [priorities]);
  const answered = QUESTIONS.filter((q) => answers[q.id] != null).length;
  const neutral = QUESTIONS.filter((q) => answers[q.id] === 0).length;
  const scores = useMemo(() => scoreAll(QUESTIONS, answers, weights), [answers, weights]);
  const boot = useMemo(() => bootstrap(QUESTIONS, answers, weights), [answers, weights]);
  const ranked = useMemo(() => rank(scores, boot), [scores, boot]);
  const ord = ranked.map((r) => r.party);
  const piv = useMemo(() => pivots(QUESTIONS, answers, weights), [answers, weights]);
  const versionChanged = initial.version !== META.version;

  // El enlace siempre refleja el estado actual.
  useEffect(() => {
    const hash = toHash(QUESTIONS, { version: META.version, mode: initial.mode, priorities, answers });
    window.history.replaceState(null, "", window.location.pathname + hash);
  }, [answers, priorities, initial.mode]);

  const ctx: Ctx = {
    answers, weights, priorities, scores, ranked, order: ord, boot, pivots: piv,
    setAnswer: (id, v) => setAnswers((a) => ({ ...a, [id]: v })),
  };

  if (answered < MIN_ANSWERS_RANKING) {
    return (
      <section className="wrap res-empty">
        <h1 className="display">Faltan respuestas</h1>
        <p>Has respondido {answered} preguntas. Responde al menos {MIN_ANSWERS_RANKING} para calcular tu afinidad.</p>
        <a className="btn btn--solid" href="/test">Volver al test <span className="arrow" aria-hidden="true">→</span></a>
      </section>
    );
  }

  return (
    <div className="results">
      <nav className="secnav" aria-label="Secciones del resultado">
        <div className="secnav__inner">
          {SECTIONS.map((s) => <a key={s.id} className="chip" href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}>{s.label}</a>)}
        </div>
      </nav>
      {versionChanged && (
        <p className="wrap res-notice" role="status">Este resultado se calculó con la versión {initial.version || "anterior"} de los datos. Lo hemos recalculado con la versión {META.version}.</p>
      )}
      <Hero ranked={ranked} answered={answered} neutral={neutral} priorities={priorities} pivots={piv} />
      <section id="podio" className="section">
        <div className="wrap">
          <p className="kicker">2 · Podio</p>
          <h2 className="display res-h2">Los {PARTY_IDS.length} partidos</h2>
          <Podium ctx={ctx} setPriorities={setPriorities} answered={answered} />
        </div>
      </section>
      <section id="por-que" className="section res-alt">
        <div className="wrap">
          <p className="kicker">3 · Por qué</p>
          <h2 className="display res-h2">Qué decide tu resultado</h2>
          <WhySection ctx={ctx} />
        </div>
      </section>
      <section id="mapa" className="section section--teal">
        <div className="wrap">
          <p className="kicker">4 · Mapa</p>
          <h2 className="display res-h2">Dónde estás</h2>
          <MapSection ctx={ctx} />
        </div>
      </section>
      <section id="temas" className="section">
        <div className="wrap">
          <p className="kicker">5 · Por temas</p>
          <h2 className="display res-h2">Tu afinidad cambia según el tema</h2>
          <BlocksSection ctx={ctx} />
        </div>
      </section>
      <section id="inesperadas" className="section section--pink">
        <div className="wrap">
          <p className="kicker">6 · Coincidencias inesperadas</p>
          <h2 className="display res-h2">También coincides con…</h2>
          <SurprisingSection ctx={ctx} />
        </div>
      </section>
      <section id="si-gobiernan" className="section">
        <div className="wrap">
          <p className="kicker">7 · Si gobiernan</p>
          <h2 className="display res-h2">Qué podría aprobarse de lo que compartes</h2>
          <ScenarioSection ctx={ctx} />
        </div>
      </section>
      <section id="pactos" className="section section--teal">
        <div className="wrap">
          <p className="kicker">8 · Pactos</p>
          <h2 className="display res-h2">Qué pasa con tus ideas si pactan</h2>
          <CoalitionSection ctx={ctx} />
        </div>
      </section>
      <section id="preguntas" className="section">
        <div className="wrap">
          <p className="kicker">9 · Pregunta a pregunta</p>
          <h2 className="display res-h2">Qué dice cada programa</h2>
          <QuestionsSection ctx={ctx} />
        </div>
      </section>
      <Precision ctx={ctx} answered={answered} mode={initial.mode} />
    </div>
  );
}

/** Proporción de respuestas «Neutral» a partir de la cual se avisa en el titular (docs/metodologia.md 6.12). */
const NEUTRAL_SHARE_WARNING = 0.6;

function Hero({ ranked, answered, neutral, priorities, pivots }: { ranked: ReturnType<typeof rank>; answered: number; neutral: number; priorities: number[]; pivots: Ctx["pivots"] }) {
  const top = ranked[0];
  const group = [top, ...ranked.slice(1).filter((r) => r.tiedWithFirst)];
  const tie = group.length > 1;
  const names = (xs: typeof group) => xs.map((r) => DISPLAY[r.party]).join(", ").replace(/, ([^,]*)$/, " y $1");
  const shown = useCountUp(top.score.value);
  const prioNames = priorities.map((b) => BLOCKS.find((x) => x.id === b)?.name).filter(Boolean);
  return (
    <section id="titular" className="section section--orange hero-res">
      <div className="wrap">
        <p className="kicker">1 · Tu resultado</p>
        {tie ? (
          <>
            <h1 className="display hero-res__title">Empate técnico entre {group.length}</h1>
            <p className={"hero-res__names outline" + (group.length > 2 ? " is-many" : "")}>{names(group)}</p>
            <p className="hero-res__sub">
              {group.map((r) => `${DISPLAY[r.party]} ${pct(r.score.value)}%`).join(", ")}. La diferencia es menor que el margen de error del test: con otras preguntas parecidas, el orden podría cambiar.
              {pivots[0] && ` Basta cambiar tu respuesta a una sola pregunta para que ${DISPLAY[pivots[0].newFirst]} pase a primero.`}
            </p>
          </>
        ) : (
          <>
            <h1 className="display hero-res__title">Coincides más con</h1>
            <p className="hero-res__names outline">{DISPLAY[top.party]}</p>
            <p className="hero-res__pct display" aria-label={`${pct(top.score.value)} por ciento`}>{pct(shown)}%</p>
            {districtNote(top.party) && <p className="hero-res__sub"><strong>{districtNote(top.party)}.</strong> El test lo compara igual que al resto, aunque no esté en tu papeleta.</p>}
          </>
        )}
        <p className="hero-res__sub">
          Entre {pct(top.interval[0])} y {pct(top.interval[1])}. Basado en {answered} respuestas{prioNames.length ? `, con ${prioNames.join(", ")} como prioridades` : ""}.
          {answered < LOW_PRECISION_BELOW && " Con menos de 20 respuestas, la precisión es baja."}
        </p>
        {neutral >= NEUTRAL_SHARE_WARNING * answered && (
          <p className="hero-res__sub">
            Has respondido «Neutral» en {neutral} de {answered} preguntas. Con tantas respuestas neutrales, quedan arriba los partidos con más posiciones intermedias en sus programas.
          </p>
        )}
        <p className="hero-res__note">Mide coincidencias con programas. No es una recomendación de voto.</p>
      </div>
    </section>
  );
}

type PodiumMode = "base" | "sinPrioridades" | "soloAlta";

function Podium({ ctx, setPriorities, answered }: { ctx: Ctx; setPriorities: (p: number[]) => void; answered: number }) {
  const [mode, setMode] = useState<PodiumMode>("base");
  const sens = useMemo(() => sensitivity(QUESTIONS, ctx.answers, ctx.weights), [ctx.answers, ctx.weights]);
  const scores = useMemo(() => {
    if (mode === "sinPrioridades") return scoreAll(QUESTIONS, ctx.answers, questionWeights(QUESTIONS, []));
    if (mode === "soloAlta") return scoreAll(QUESTIONS, ctx.answers, ctx.weights, { minConfidence: "alta" });
    return ctx.scores;
  }, [mode, ctx.answers, ctx.weights, ctx.scores]);
  const ord = order(scores);
  const changed = mode !== "base" && ord[0] !== ctx.order[0];
  const togglePrio = (b: number) => {
    const p = ctx.priorities;
    setPriorities(p.includes(b) ? p.filter((x) => x !== b) : p.length < 3 ? [...p, b] : p);
  };
  return (
    <>
      <div className="chips" role="group" aria-label="Sensibilidad">
        <button type="button" className="chip" aria-pressed={mode === "base"} onClick={() => setMode("base")}>Mi resultado</button>
        <button type="button" className="chip" aria-pressed={mode === "sinPrioridades"} onClick={() => setMode("sinPrioridades")} disabled={!ctx.priorities.length}>Sin mis prioridades</button>
        <button type="button" className="chip" aria-pressed={mode === "soloAlta"} onClick={() => setMode("soloAlta")}>Solo evidencia de confianza alta</button>
      </div>
      {changed && <p className="res-notice" role="status">Tu primer puesto cambia en esta variante: {DISPLAY[ctx.order[0]]} pasa a {DISPLAY[ord[0]]}.</p>}
      {mode === "base" && (sens.noPriorities !== sens.base || sens.onlyHigh !== sens.base) && (
        <p className="small">Aviso: tu primer puesto depende de {sens.noPriorities !== sens.base ? "las prioridades que elegiste" : "posiciones con evidencia media o baja"}.</p>
      )}
      <ol className="podium" style={{ ["--n" as string]: PARTY_IDS.length }}>
        {PARTY_IDS.map((p) => {
          const i = ord.indexOf(p);
          const s = scores[p];
          const r = ctx.ranked.find((x) => x.party === p)!;
          const tied = mode === "base" && r.tiedWithPrevious;
          const c = coincidenceCounts(QUESTIONS, ctx.answers, p);
          return (
            <li key={p} className={"podium__row" + (i === 0 ? " is-first" : "")} style={{ ["--i" as string]: i }}>
              <span className="podium__pos display" aria-hidden="true">{i + 1}</span>
              <div className="podium__body">
                <div className="podium__head">
                  <span className="podium__name serif">{DISPLAY[p]}</span>
                  {tied && <span className="podium__tie small" title="La diferencia con el partido de arriba es menor que el margen de error del test">empate técnico</span>}
                  <span className="podium__val display">{pct(s.value)}%</span>
                </div>
                <div className="podium__track" aria-hidden="true">
                  <span className="podium__fill" style={{ width: `${s.value}%` }} />
                  {mode === "base" && <span className="podium__ci" style={{ left: `${r.interval[0]}%`, width: `${Math.max(r.interval[1] - r.interval[0], 0.5)}%` }} />}
                </div>
                {districtNote(p) && <p className="small podium__meta">{districtNote(p)}.</p>}
                <p className="small muted podium__meta">
                  {(["coincidencia", "discrepancia", "parcial", "sin_posicion"] as Coincidence[]).map((k) => `${c[k]} ${COINCIDENCE_LABEL[k]}`).join(" · ")}
                  {" · "}posición documentada en {s.withPosition} de {answered}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="prio-edit">
        <p className="small"><strong>Tus prioridades</strong> (pulsa en orden; pesan ×2,0, ×1,5 y ×1,2):</p>
        <div className="chips">
          {BLOCKS.map((b) => {
            const k = ctx.priorities.indexOf(b.id);
            return <button key={b.id} type="button" className="chip" aria-pressed={k >= 0} onClick={() => togglePrio(b.id)}>{k >= 0 ? `${k + 1}. ` : ""}{b.name}</button>;
          })}
        </div>
      </div>
    </>
  );
}

function Precision({ ctx, answered, mode }: { ctx: Ctx; answered: number; mode: "c" | "r" }) {
  const top = ctx.ranked[0];
  const [copied, setCopied] = useState(false);
  const [other, setOther] = useState("");
  const otherState = useMemo(() => {
    const i = other.indexOf("#");
    return i >= 0 ? fromHash(QUESTIONS, other.slice(i)) : null;
  }, [other]);
  const cmp = otherState ? personAffinity(QUESTIONS, ctx.answers, otherState.answers) : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copia este enlace:", window.location.href);
    }
  };

  const download = () => {
    const c = canvasRef.current;
    if (!c) return;
    drawShare(c, ctx);
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "voy-votando.png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  return (
    <section id="precision" className="section section--ink">
      <div className="wrap prec">
        <div>
          <p className="kicker">10 · Precisión</p>
          <h2 className="display res-h2">Cuánto te puedes fiar</h2>
          <ul className="plain">
            <li>Has respondido {answered} preguntas en el modo {mode === "r" ? "rápido" : "completo"}.</li>
            <li>
              Seguridad de tu primer puesto: <strong>{certainty(top.firstShare)}</strong>.{" "}
              {certainty(top.firstShare) === "alta" && `${DISPLAY[top.party]} sale primero aunque el test hubiera usado otras preguntas parecidas.`}
              {certainty(top.firstShare) === "media" && `${DISPLAY[top.party]} sale primero casi siempre, pero con otras preguntas parecidas podría adelantarle otro partido.`}
              {certainty(top.firstShare) === "baja" && "Con otras preguntas parecidas, el primer puesto cambiaría a menudo. Mira también el segundo y el tercero."}
            </li>
            <li>Cobertura: {ctx.order.map((p) => `${DISPLAY[p]} ${pct(ctx.scores[p].coverage * 100)}%`).join(", ")}. Es la parte de tus respuestas en la que cada partido tiene posición documentada.</li>
            <li>Datos versión {META.version}, con corte el 18/11/2026. <a href="/metodologia">Cómo se calcula</a>.</li>
          </ul>
        </div>
        <div>
          <p className="kicker">Siguiente paso</p>
          <div className="prec__actions">
            <button type="button" className="btn prec__btn" onClick={copy}>{copied ? "Enlace copiado" : "Copiar enlace con mis respuestas"}</button>
            <button type="button" className="btn prec__btn" onClick={download}>Descargar imagen (sin respuestas)</button>
            <button type="button" className="btn prec__btn" onClick={() => window.print()}>Imprimir o guardar en PDF</button>
            <a className="btn prec__btn" href="/test">Repetir el test</a>
          </div>
          <p className="small">El enlace contiene tus respuestas. Compártelo solo con quien quieras.</p>
          <canvas ref={canvasRef} width={1200} height={630} hidden />
          <div className="compare">
            <label htmlFor="cmp" className="serif">Compárate con alguien</label>
            <p className="small">Pega el enlace de resultado de otra persona. El cálculo se hace en tu navegador.</p>
            <input id="cmp" type="url" value={other} onChange={(e) => setOther(e.target.value)} placeholder="https://…/resultados#v=…" />
            {other && !otherState && <p className="small">Ese enlace no contiene respuestas válidas.</p>}
            {otherState && !cmp && <p className="small">Necesitáis al menos {MIN_ANSWERS_RANKING} preguntas respondidas en común.</p>}
            {cmp && (
              <div className="compare__out">
                <p><strong className="display">{pct(cmp.value)}%</strong> de afinidad entre vosotros, en {cmp.shared} preguntas comunes.</p>
                <p className="small">Donde más discrepáis:</p>
                <ul className="plain small">
                  {cmp.mostDifferent.map((id) => (
                    <li key={id}>«{QUESTION_BY_ID[id].text}» Tú: {answerLabel(ctx.answers[id])}. La otra persona: {answerLabel(otherState!.answers[id] as Scale)}.</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function drawShare(c: HTMLCanvasElement, ctx: Ctx) {
  const g = c.getContext("2d");
  if (!g) return;
  g.fillStyle = "#f6581e";
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = "#1f1f1f";
  g.font = "700 30px 'Archivo Variable', sans-serif";
  g.fillText("VOY VOTANDO · MI AFINIDAD CON LOS PROGRAMAS", 60, 80);
  ctx.ranked.slice(0, 6).forEach((r, i) => {
    const y = 150 + i * 70;
    g.font = "600 34px 'Fraunces Variable', serif";
    g.fillText(`${i + 1}. ${DISPLAY[r.party]}`, 60, y + 34);
    g.fillStyle = "rgba(31,31,31,0.18)";
    g.fillRect(420, y + 8, 600, 30);
    g.fillStyle = "#1f1f1f";
    g.fillRect(420, y + 8, (600 * r.score.value) / 100, 30);
    g.font = "700 34px 'Archivo Variable', sans-serif";
    g.fillText(`${Math.round(r.score.value)}%`, 1040, y + 34);
  });
  g.font = "400 22px 'Inter Variable', sans-serif";
  g.fillText(`Datos v${META.version} · ${PARTY_IDS.length} informes de evaluación · No es una recomendación de voto · ${window.location.host}`, 60, 600);
}
