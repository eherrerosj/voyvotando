import { useEffect, useRef, useState } from "react";
import { ABBR, DISPLAY, dec1, signed } from "../../lib/format";
import { PARTY_IDS, type PartyId, type Question, type Scale } from "../../lib/types";

/**
 * Ancho real del contenedor. Los gráficos se dibujan a escala 1:1 para que el texto
 * mida siempre lo mismo (11 a 12 px) en móvil, tableta y escritorio.
 */
function useWidth<T extends HTMLElement>(fallback: number, max = Infinity) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(Math.max(260, Math.min(max, Math.round(el.getBoundingClientRect().width))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [max]);
  return [ref, w] as const;
}

/** Cascada de 50 a la afinidad final con la contribución de cada pregunta (docs/metodologia.md 6.16). */
export function Waterfall({ items, final, labelFor }: { items: { id: string; delta: number }[]; final: number; labelFor: (id: string) => string }) {
  const [ref, W] = useWidth<HTMLElement>(640, 760);
  const sorted = [...items].sort((a, b) => b.delta - a.delta);
  const H = 220, padL = 30, padR = 36, padT = 20, padB = 14;
  const n = sorted.length + 2;
  const bw = (W - padL - padR) / n;
  let run = 50;
  const points = sorted.map((it) => {
    const from = run;
    run += it.delta;
    return { ...it, from, to: run };
  });
  const lo = Math.min(50, ...points.map((p) => Math.min(p.from, p.to)), final) - 4;
  const hi = Math.max(50, ...points.map((p) => Math.max(p.from, p.to)), final) + 4;
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);
  return (
    <figure className="chart" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cascada: parte de 50 y llega a ${dec1(final)} sumando la contribución de ${items.length} preguntas.`}>
        <line x1={padL} x2={W - padR} y1={y(50)} y2={y(50)} className="chart__base" />
        <text x={padL - 6} y={y(50) + 4} textAnchor="end" className="chart__label">50</text>
        <rect x={padL} y={y(50) - 1} width={bw * 0.8} height={2} className="chart__start" />
        {points.map((p, i) => (
          <rect key={p.id} x={padL + (i + 1) * bw} width={Math.max(bw * 0.8, 1)} y={y(Math.max(p.from, p.to))} height={Math.max(Math.abs(y(p.from) - y(p.to)), 1)}
            className={p.delta >= 0 ? "chart__pos" : "chart__neg"}>
            <title>{`${labelFor(p.id)}: ${signed(p.delta)} puntos`}</title>
          </rect>
        ))}
        <rect x={padL + (n - 1) * bw} width={Math.max(bw * 0.8, 4)} y={y(Math.max(final, 50))} height={Math.abs(y(final) - y(50)) || 2} className="chart__final" />
        <text x={Math.min(padL + (n - 1) * bw + bw * 0.4, W - 18)} y={Math.max(14, Math.min(y(Math.max(final, 50)), ...points.slice(-2).map((p) => y(Math.max(p.from, p.to)))) - 8)}
          textAnchor="middle" className="chart__label chart__label--strong">{dec1(final)}</text>
      </svg>
      <figcaption className="small muted">Cada barra es una pregunta. Hacia arriba, suma afinidad; hacia abajo, resta. Empieza en 50, que es el valor sin información.</figcaption>
    </figure>
  );
}

/** Mapa de 2 ejes (docs/metodologia.md 6.8). x = ECO, y = SOC. Los rótulos de los polos van fuera del cuadro. */
export function AxisMap({ user, parties, ellipse, onPick, picked }: {
  user: { x: number; y: number } | null;
  parties: { id: PartyId; x: number; y: number }[];
  ellipse: { cov: [[number, number], [number, number]] } | null;
  onPick: (p: PartyId | null) => void;
  picked: PartyId | null;
}) {
  const [ref, W] = useWidth<HTMLElement>(460, 480);
  const side = 6, top = 30, bottom = 54;
  const P = W - 2 * side;
  const H = P + top + bottom;
  const sx = (v: number) => side + ((v + 1) / 2) * P;
  const sy = (v: number) => top + P - ((v + 1) / 2) * P;
  let ell: { rx: number; ry: number; angle: number } | null = null;
  if (ellipse && user) {
    // Elipse del 90% (chi-cuadrado con 2 grados de libertad: 4,605).
    const [[a, b], [, d]] = ellipse.cov;
    const tr = a + d, det = a * d - b * b;
    const l1 = tr / 2 + Math.sqrt(Math.max(tr * tr / 4 - det, 0));
    const l2 = tr / 2 - Math.sqrt(Math.max(tr * tr / 4 - det, 0));
    const k = Math.sqrt(4.605);
    ell = { rx: Math.sqrt(Math.max(l1, 1e-6)) * k * (P / 2), ry: Math.sqrt(Math.max(l2, 1e-6)) * k * (P / 2), angle: (-Math.atan2(l1 - a, b || 1e-9) * 180) / Math.PI };
  }
  return (
    <figure className="chart map" ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Mapa de posiciones en dos ejes: economía en horizontal y temas sociales en vertical. Pulsa un partido para ver qué os separa.">
        <rect x={side} y={top} width={P} height={P} className="map__frame" />
        <line x1={sx(0)} x2={sx(0)} y1={top} y2={top + P} className="map__axis" />
        <line x1={side} x2={side + P} y1={sy(0)} y2={sy(0)} className="map__axis" />
        <text x={W / 2} y={top - 10} textAnchor="middle" className="map__pole">↑ Más conservador</text>
        <text x={W / 2} y={top + P + 20} textAnchor="middle" className="map__pole">↓ Más progresista</text>
        <text x={side} y={top + P + 44} className="map__pole">← Más intervención</text>
        <text x={W - side} y={top + P + 44} textAnchor="end" className="map__pole">Más mercado →</text>
        {user && picked && (() => {
          const p = parties.find((x) => x.id === picked);
          return p ? <line x1={sx(user.x)} y1={sy(user.y)} x2={sx(p.x)} y2={sy(p.y)} className="map__link" /> : null;
        })()}
        {user && ell && <ellipse cx={sx(user.x)} cy={sy(user.y)} rx={ell.rx} ry={ell.ry} transform={`rotate(${ell.angle} ${sx(user.x)} ${sy(user.y)})`} className="map__ellipse" />}
        {parties.map((p) => {
          // Puntos casi coincidentes: etiquetas apiladas. Si otro punto ocupa el hueco de la etiqueta, va al otro lado o encima.
          const near = parties.filter((o) => Math.hypot(sx(o.x) - sx(p.x), sy(o.y) - sy(p.y)) < 22).sort((a, b) => sy(a.y) - sy(b.y));
          const k = near.findIndex((o) => o.id === p.id);
          // La pila se centra en la altura media del grupo, no en la de cada punto.
          const meanY = near.reduce((s, o) => s + sy(o.y), 0) / near.length;
          const dy = meanY - sy(p.y) + 4 + (k - (near.length - 1) / 2) * 15;
          const labelW = ABBR[p.id].length * 8 + 14;
          const blocked = (s: 1 | -1) => parties.some((o) => o.id !== p.id && !near.includes(o)
            && Math.abs(sy(o.y) - sy(p.y)) < 16 && (s * (sx(o.x) - sx(p.x))) > 0 && (s * (sx(o.x) - sx(p.x))) < labelW + 10);
          const pos: 1 | -1 | 0 = sx(p.x) > W - labelW - 16 ? (blocked(-1) ? 0 : -1) : blocked(1) ? (blocked(-1) || sx(p.x) < side + labelW ? 0 : -1) : 1;
          return (
            <g key={p.id} className={"map__party" + (picked === p.id ? " is-picked" : "")} transform={`translate(${sx(p.x)},${sy(p.y)})`}
              onClick={() => onPick(picked === p.id ? null : p.id)} role="button" tabIndex={0} aria-label={`${DISPLAY[p.id]}: ver qué os separa`} aria-pressed={picked === p.id}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(picked === p.id ? null : p.id); } }}>
              <circle r={20} className="map__hit" />
              <circle r={9} />
              <text x={pos === 1 ? Math.max(...near.map((o) => sx(o.x))) - sx(p.x) + 13 : pos === -1 ? Math.min(...near.map((o) => sx(o.x))) - sx(p.x) - 13
                : Math.min(Math.max(sx(p.x), labelW / 2 + 2), W - labelW / 2 - 2) - sx(p.x)}
                y={pos === 0 ? -14 : dy} textAnchor={pos === 1 ? "start" : pos === -1 ? "end" : "middle"}>{ABBR[p.id]}</text>
            </g>
          );
        })}
        {user && (
          <g transform={`translate(${sx(user.x)},${sy(user.y)})`} className="map__user" aria-hidden="true">
            <circle r={11} />
            <text x={14} y={-10}>Tú</text>
          </g>
        )}
      </svg>
      <figcaption className="small muted">Las posiciones salen de las preguntas del test y miden coincidencias en estas medidas concretas. La mancha naranja es tu margen de error.</figcaption>
    </figure>
  );
}

/** Barras pequeñas de todos los partidos, para las tarjetas de bloque. */
export function MiniBars({ values }: { values: { id: PartyId; value: number | null }[] }) {
  const best = Math.max(...values.map((v) => v.value ?? -1));
  return (
    <ul className="minibars">
      {values.map((v) => (
        <li key={v.id} className={v.value === best ? "is-best" : ""}>
          <span className="minibars__name">{ABBR[v.id]}</span>
          <span className="minibars__track"><span className="minibars__fill" style={{ width: `${v.value ?? 0}%` }} /></span>
          <span className="minibars__val">{v.value == null ? "·" : Math.round(v.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Regla de 5 posiciones con tu respuesta y la de cada partido (docs/arquitectura.md 7.4, sección 9).
 * Cada partido es una etiqueta centrada bajo su posición: caben 5 columnas incluso a 328 px.
 */
export function Ruler({ q, answer }: { q: Question; answer: Scale | null | undefined }) {
  const [ref, W] = useWidth<HTMLDivElement>(560, 620);
  const m = 36;
  const x = (v: number) => m + ((v + 2) / 4) * (W - 2 * m);
  const byValue = new Map<number, PartyId[]>();
  for (const p of PARTY_IDS) {
    const v = q.positions[p].value;
    if (v == null) continue;
    byValue.set(v, [...(byValue.get(v) ?? []), p]);
  }
  const maxStack = Math.max(1, ...[...byValue.values()].map((v) => v.length));
  const H = 50 + maxStack * 17;
  const [hover, setHover] = useState<PartyId | null>(null);
  return (
    <div ref={ref} className="ruler-wrap">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="ruler" role="img"
        aria-label={`Tu respuesta: ${answer == null ? "sin respuesta" : answer}. ` + PARTY_IDS.map((p) => `${DISPLAY[p]}: ${q.positions[p].value ?? "sin posición"}`).join(". ")}>
        <text x={x(-2) - 6} y={13} className="ruler__end">Muy en desacuerdo</text>
        <text x={x(2) + 6} y={13} textAnchor="end" className="ruler__end">Muy de acuerdo</text>
        <line x1={x(-2)} x2={x(2)} y1={30} y2={30} className="ruler__line" />
        {[-2, -1, 0, 1, 2].map((v) => <line key={v} x1={x(v)} x2={x(v)} y1={24} y2={36} className="ruler__tick" />)}
        {answer != null && <circle cx={x(answer)} cy={30} r={10} className="ruler__user"><title>Tu respuesta</title></circle>}
        {[...byValue.entries()].map(([v, ps]) => ps.map((p, i) => (
          <text key={p} x={x(v)} y={56 + i * 17} textAnchor="middle" className={"ruler__plabel" + (hover === p ? " is-hover" : "")}
            onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}>● {ABBR[p]}</text>
        )))}
      </svg>
    </div>
  );
}
