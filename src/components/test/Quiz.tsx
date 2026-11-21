import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BLOCKS, CORE_FAST, CORE_QUESTIONS, INTERLUDES, META, type CoreQuestion } from "../../lib/data-core";
import { DISPLAY } from "../../lib/format";
import { clearProgress, loadProgress, saveProgress, toHash } from "../../lib/state";
import type { Answers, Help, Scale } from "../../lib/types";
import "./quiz.css";

const SCALE: { v: Scale; label: string; key: string }[] = [
  { v: 2, label: "Muy de acuerdo", key: "1" },
  { v: 1, label: "De acuerdo", key: "2" },
  { v: 0, label: "Ni de acuerdo ni en desacuerdo", key: "3" },
  { v: -1, label: "En desacuerdo", key: "4" },
  { v: -2, label: "Muy en desacuerdo", key: "5" },
];


type Stage = { kind: "priorities" } | { kind: "question"; index: number };

function blockName(id: number) {
  return BLOCKS.find((b) => b.id === id)?.name ?? "";
}

/** Fuentes de la ayuda agrupadas por informe, con enlace a cada página del PDF. */
function Sources({ help }: { help: Help }) {
  const byReport = new Map<string, number[]>();
  for (const f of help.fuentes) {
    if (!f.informe || !f.pagina) continue;
    const pages = byReport.get(f.informe) ?? [];
    if (!pages.includes(f.pagina)) pages.push(f.pagina);
    byReport.set(f.informe, pages);
  }
  if (!byReport.size) return null;
  const items = [...byReport.entries()];
  return (
    <p className="help__src small">
      Fuentes: informe de evaluación del programa de{" "}
      {items.map(([rep, pages], i) => (
        <span key={rep}>
          {DISPLAY[rep as keyof typeof DISPLAY] ?? rep} (
          {pages.sort((a, b) => a - b).map((pg, j) => (
            <span key={pg}>{j > 0 ? ", " : ""}<a href={`/informes/${rep}.pdf#page=${pg}`} target="_blank" rel="noopener">p. {pg}</a></span>
          ))}
          ){i < items.length - 2 ? ", " : i === items.length - 2 ? " y " : ""}
        </span>
      ))}
      . Cada informe analiza un programa con el mismo método, y los argumentos salen de ese análisis.
    </p>
  );
}

export default function Quiz() {
  const mode: "c" | "r" = useMemo(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modo") === "rapido" ? "r" : "c"), []);
  const questions: CoreQuestion[] = mode === "r" ? CORE_FAST : CORE_QUESTIONS;
  const [answers, setAnswers] = useState<Answers>({});
  const [priorities, setPriorities] = useState<number[]>([]);
  const [stage, setStage] = useState<Stage>({ kind: "priorities" });
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [resumed, setResumed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);

  // Retomar un test a medias en esta pestaña.
  useEffect(() => {
    const saved = loadProgress();
    if (saved && saved.mode === mode && saved.version === META.version && Object.keys(saved.answers).length) {
      setAnswers(saved.answers);
      setPriorities(saved.priorities);
      setStage({ kind: "question", index: Math.min(saved.index, questions.length - 1) });
      setResumed(true);
    }
  }, [mode, questions.length]);

  const index = stage.kind === "question" ? stage.index : -1;
  const q = index >= 0 ? questions[index] : null;
  const answeredCount = questions.filter((x) => x.id in answers).length;
  const pct = Math.round((answeredCount / questions.length) * 100);
  const blocksInTest = BLOCKS.filter((b) => questions.some((x) => x.block === b.id));
  const blockPos = q ? blocksInTest.findIndex((b) => b.id === q.block) + 1 : 0;
  const isBlockStart = !!q && (index === 0 || questions[index - 1].block !== q.block);

  useEffect(() => {
    if (stage.kind !== "priorities") saveProgress({ version: META.version, mode, priorities, answers, index: Math.max(index, 0) });
  }, [answers, priorities, index, mode, stage.kind]);

  useEffect(() => {
    setShowHelp(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    headingRef.current?.focus({ preventScroll: true });
  }, [stage]);

  // La ayuda abierta se desplaza a la vista, por encima de la barra fija.
  useEffect(() => {
    if (showHelp) helpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [showHelp]);

  // Cada bloque tiñe el fondo de la página: el cambio de tema se ve de un vistazo.
  useEffect(() => {
    const root = document.documentElement;
    if (q) root.dataset.block = String(q.block);
    else delete root.dataset.block;
    return () => { delete root.dataset.block; };
  }, [q]);

  const finish = useCallback((a: Answers) => {
    clearProgress();
    const hash = toHash(CORE_QUESTIONS, { version: META.version, mode, priorities, answers: a });
    window.location.href = "/resultados" + hash;
  }, [mode, priorities]);

  const goTo = useCallback((i: number, a: Answers = answers) => {
    window.clearTimeout(advanceTimer.current);
    if (i >= questions.length) return finish(a);
    if (i < 0) return setStage({ kind: "priorities" });
    setStage({ kind: "question", index: i });
  }, [answers, finish, questions.length]);

  const answer = useCallback((v: Scale | null) => {
    if (!q) return;
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    window.clearTimeout(advanceTimer.current);
    if (autoAdvance) advanceTimer.current = window.setTimeout(() => goTo(index + 1, next), 220);
  }, [answers, autoAdvance, goTo, index, q]);

  // Teclado: 1 a 5 responden, 0 salta, Intro y flechas navegan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      // Intro sobre un botón o un enlace hace su propia acción.
      const onControl = tag === "BUTTON" || tag === "A" || tag === "SUMMARY";
      if (stage.kind === "priorities") {
        if (e.key === "Enter" && !onControl) { e.preventDefault(); setStage({ kind: "question", index: 0 }); }
        return;
      }
      const s = SCALE.find((x) => x.key === e.key);
      if (s) { e.preventDefault(); answer(s.v); }
      else if (e.key === "0") { e.preventDefault(); answer(null); }
      else if (e.key === "Enter" && !onControl) { e.preventDefault(); goTo(index + 1); }
      else if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, goTo, index, stage.kind]);

  const restart = () => {
    if (!window.confirm("¿Borrar tus respuestas y empezar de nuevo?")) return;
    clearProgress();
    setAnswers({});
    setPriorities([]);
    setStage({ kind: "priorities" });
    setResumed(false);
  };

  const togglePriority = (b: number) => {
    setPriorities((p) => (p.includes(b) ? p.filter((x) => x !== b) : p.length < 3 ? [...p, b] : p));
  };

  if (stage.kind === "priorities") {
    return (
      <section className="quiz quiz--priorities" aria-labelledby="prio-title">
        <p className="kicker">Antes de empezar · opcional</p>
        <h1 id="prio-title" ref={headingRef} tabIndex={-1} className="display quiz__h1">¿Qué temas te importan más?</h1>
        <p className="quiz__lead">Pulsa hasta 3 bloques en orden de importancia. El primero pesa ×2,0, el segundo ×1,5 y el tercero ×1,2. Podrás cambiarlo en los resultados.</p>
        <ul className="prio-grid">
          {blocksInTest.map((b) => {
            const rank = priorities.indexOf(b.id);
            const n = questions.filter((x) => x.block === b.id).length;
            return (
              <li key={b.id}>
                <button type="button" className={"prio" + (rank >= 0 ? " is-on" : "")} aria-pressed={rank >= 0} onClick={() => togglePriority(b.id)}>
                  <span className="prio__rank display" aria-hidden="true">{rank >= 0 ? rank + 1 : ""}</span>
                  <span className="prio__name serif">{b.name}</span>
                  <span className="prio__meta small">{n} {n === 1 ? "pregunta" : "preguntas"}{rank >= 0 ? ` · prioridad ${rank + 1}` : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="quiz__actions">
          <button type="button" className="btn btn--solid" onClick={() => setStage({ kind: "question", index: 0 })}>
            {priorities.length ? "Empezar con estas prioridades" : "Empezar sin prioridades"} <span className="arrow" aria-hidden="true">→</span>
          </button>
          <span className="small muted">{questions.length} preguntas, unos {Math.round((questions.length * 12) / 60)} minutos. Pulsa Intro para empezar. Tus respuestas no salen de este navegador.</span>
        </div>
      </section>
    );
  }

  if (!q) return null;
  const current = answers[q.id];
  const isLast = index === questions.length - 1;
  const fact = isBlockStart ? INTERLUDES.find((x) => x.bloque === q.block) : undefined;
  const nextIsNewBlock = !isLast && questions[index + 1].block !== q.block;

  return (
    <section className="quiz" aria-labelledby="q-title">
      {resumed && <p className="quiz__resumed small" role="status">Hemos recuperado tus respuestas de esta sesión.</p>}

      {isBlockStart ? (
        <header className="blockband" key={`band-${q.block}`}>
          <p className="kicker">Bloque {blockPos} de {blocksInTest.length}{priorities.includes(q.block) ? ` · tu prioridad ${priorities.indexOf(q.block) + 1}` : ""}</p>
          <p className="blockband__title outline">{blockName(q.block)}</p>
          {fact && <p className="blockband__fact small">{fact.dato}</p>}
        </header>
      ) : (
        <p className="blockchip"><span className="display">Bloque {blockPos}</span> {blockName(q.block)}</p>
      )}

      <div className="quiz__top">
        <p className="kicker">Pregunta {index + 1} de {questions.length} · {pct}% completado</p>
        <div className="quiz__tools">
          <label className="toggle small">
            <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} /> Avance automático
          </label>
          <button type="button" className="linkish small" onClick={() => setShowGrid((s) => !s)} aria-expanded={showGrid}>Ir a pregunta</button>
        </div>
      </div>

      <Progress questions={questions} answers={answers} index={index} />

      {showGrid && (
        <nav className="qgrid" aria-label="Ir a una pregunta">
          {questions.map((x, i) => (
            <button key={x.id} type="button" className={"qgrid__cell" + (x.id in answers ? " is-done" : "") + (i === index ? " is-current" : "")}
              aria-label={`Pregunta ${i + 1}${x.id in answers ? ", respondida" : ""}`} aria-current={i === index ? "step" : undefined}
              onClick={() => { setShowGrid(false); goTo(i); }}>{i + 1}</button>
          ))}
          <button type="button" className="linkish small qgrid__restart" onClick={restart}>Reiniciar el test</button>
        </nav>
      )}

      <h1 id="q-title" ref={headingRef} tabIndex={-1} className="quiz__statement serif">«{q.text}»</h1>

      <div className="scale" role="radiogroup" aria-labelledby="q-title">
        {SCALE.map((s) => (
          <button key={s.v} type="button" role="radio" aria-checked={current === s.v} className={"scale__opt" + (current === s.v ? " is-on" : "")}
            onClick={() => answer(s.v)}>
            <span className="scale__key" aria-hidden="true">{s.key}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="quiz__secondary">
        <button type="button" className={"linkish" + (current === null ? " is-on" : "")} onClick={() => answer(null)} aria-pressed={current === null}>
          Prefiero no responder <span className="small muted">(tecla 0)</span>
        </button>
        {q.help && (q.help.ahora || q.help.aFavor) && (
          <button type="button" className="linkish" onClick={() => setShowHelp((s) => !s)} aria-expanded={showHelp} aria-controls="help">
            ¿Qué significa?
          </button>
        )}
      </div>

      {showHelp && q.help && (
        <div id="help" ref={helpRef} className="help card">
          {q.help.ahora && <p><strong>Situación actual.</strong> {q.help.ahora}</p>}
          {q.help.aFavor && <p><strong>Argumentos a favor.</strong> {q.help.aFavor}</p>}
          {q.help.enContra && <p><strong>Argumentos en contra.</strong> {q.help.enContra}</p>}
          <Sources help={q.help} />
        </div>
      )}

      <p className="sr-only" aria-live="polite">Pregunta {index + 1} de {questions.length}. {answeredCount} respondidas.</p>

      <nav className="quiz__nav" aria-label="Navegación del test">
        <button type="button" className="btn btn--small" onClick={() => goTo(index - 1)} aria-label="Pregunta anterior">← <span className="hide-sm">Anterior</span></button>
        <span className="quiz__navhint small muted">{nextIsNewBlock ? `Siguiente bloque: ${blockName(questions[index + 1].block)}` : "Intro: siguiente"}</span>
        <button type="button" className={"btn btn--small" + (current !== undefined ? " btn--solid" : "")} onClick={() => goTo(index + 1)}>
          {isLast ? "Ver resultados" : current === undefined ? "Saltar" : "Siguiente"} <span className="arrow" aria-hidden="true">→</span>
        </button>
      </nav>
    </section>
  );
}

function Progress({ questions, answers, index }: { questions: CoreQuestion[]; answers: Answers; index: number }) {
  const groups = BLOCKS.map((b) => questions.map((q, i) => ({ q, i })).filter(({ q }) => q.block === b.id)).filter((g) => g.length);
  return (
    <div className="progress" aria-hidden="true">
      {groups.map((g, k) => (
        <div key={k} className="progress__block" style={{ flexGrow: g.length }}>
          {g.map(({ q, i }) => (
            <span key={q.id} className={"progress__tick" + (q.id in answers ? " is-done" : "") + (i === index ? " is-current" : "")} />
          ))}
        </div>
      ))}
    </div>
  );
}
