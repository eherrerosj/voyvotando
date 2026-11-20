"""Fusiona las dos codificaciones, mide su acuerdo, selecciona las preguntas y simula el algoritmo.

Entradas: catalogo_afirmaciones_v1.json, <partido>/codificacion.json (v0), <partido>/codificacion_v1.json (v1).
Salidas: posiciones_fusion.json, seleccion.json y un informe en stdout.
Uso: python3 -I seleccion_y_simulacion.py [N_COMPLETO=40] [N_RAPIDO=20]
"""
import itertools
import json
import os
import random
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PARTIES = ["podemos", "fa", "psoe", "pp", "vox", "salf"]
LEFT, RIGHT = {"podemos", "fa", "psoe"}, {"pp", "vox", "salf"}
CONF = {"alta": 1.0, "media": 0.75, "baja": 0.5}
BLOQUES = {1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 3, 8: 4, 9: 4, 10: 5, 11: 5, 12: 6, 13: 6, 14: 7, 15: 7, 16: 7, 17: 7, 18: 8, 19: 8}
PAIRS = list(itertools.combinations(PARTIES, 2))
# Afirmaciones cuya redacción cambió de forma material entre v0 y v1: solo cuenta la codificación v1.
CHANGED = {"Q08", "Q11", "Q35", "Q45", "Q47", "Q48", "Q51"}


def jload(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load():
    cat = jload(os.path.join(BASE, "catalogo_afirmaciones_v1.json"))["afirmaciones"]
    v0, v1 = {}, {}
    for p in PARTIES:
        d0 = jload(os.path.join(BASE, p, "codificacion.json"))
        v0[p] = {c["id"]: c for c in d0["codings"]}
        for x in d0.get("extra_statements", []):
            v0[p][x["id"]] = x
        path1 = os.path.join(BASE, p, "codificacion_v1.json")
        v1[p] = {c["id"]: c for c in jload(path1)["codings"]} if os.path.exists(path1) else {}
    return cat, v0, v1


def merge(cat, v0, v1):
    """Regla provisional: igual -> se queda; dif 1 -> el más cercano a 0 y confianza mínima;
    un nulo -> se queda el no nulo solo con confianza >= media, marcado; dif >= 2 -> se adjudica (provisional null)."""
    out, stats = {}, {p: {"n": 0, "igual": 0, "dif1": 0, "dif2": 0, "nulo_vs_valor": 0, "ambos_nulos": 0} for p in PARTIES}
    for a in cat:
        out[a["id"]] = {}
        for p in PARTIES:
            own_extra = a["v0"].startswith(f"X_{p}_")
            c0 = v0[p].get(a["v0"]) if (not a["v0"].startswith("X_") or own_extra) and a["id"] not in CHANGED else None
            c1 = v1[p].get(a["id"])
            x = None if c0 is None else c0.get("value")
            y = None if c1 is None else c1.get("value")
            s = stats[p]
            s["n"] += 1
            flag, val, conf, src = None, None, None, None
            cx = None if c0 is None else c0.get("confidence")
            cy = None if c1 is None else c1.get("confidence")
            if x is None and y is None:
                s["ambos_nulos"] += 1
            elif x is not None and y is not None and x == y:
                s["igual"] += 1
                val, src = x, (c1 or c0)
                conf = min(cx or "baja", cy or "baja", key=lambda k: CONF.get(k, 0.5))
            elif x is not None and y is not None and abs(x - y) == 1:
                s["dif1"] += 1
                val = x if abs(x) < abs(y) else y
                conf = min(cx or "baja", cy or "baja", key=lambda k: CONF.get(k, 0.5))
                src, flag = c1, "dif1"
            elif x is not None and y is not None:
                s["dif2"] += 1
                flag = "adjudicar"
            elif c0 is None:
                s.setdefault("unica", 0)
                s["unica"] += 1
                val, conf, src, flag = y, cy, c1, "codificacion_unica"
            else:
                s["nulo_vs_valor"] += 1
                c = c0 if x is not None else c1
                if CONF.get(c.get("confidence"), 0) >= 0.75:
                    val, conf, src = c["value"], "baja" if c.get("cross") else c.get("confidence"), c
                flag = "un_nulo"
            out[a["id"]][p] = {"value": val, "confidence": conf, "flag": flag, "v0": x, "v1": y,
                               "evidence": (src or {}).get("evidence", []), "viability": (src or {}).get("viability", {}),
                               "salience": (src or {}).get("salience")}
    return out, stats


def sep(vals, pr):
    x, y = vals[pr[0]], vals[pr[1]]
    return 0 if x is None or y is None else abs(x - y)


def select(cat, pos, n_total, per="ambito"):
    """Selección voraz con objetivo cóncavo: suma sobre pares de log(1 + separación ponderada por confianza).
    Prioriza los pares de partidos peor separados. Garantiza 1 pregunta por ámbito (o por bloque en modo rápido)."""
    import math
    vals = {a["id"]: {p: pos[a["id"]][p]["value"] for p in PARTIES} for a in cat}
    conf = {a["id"]: {p: CONF.get(pos[a["id"]][p]["confidence"], 0.0) for p in PARTIES} for a in cat}
    group = {a["id"]: (a["ambito"] if per == "ambito" else BLOQUES[a["ambito"]]) for a in cat}

    def cover(q):
        return sum(v is not None for v in vals[q].values())

    def psep(q, pr):
        return sep(vals[q], pr) / 2 * min(conf[q][pr[0]], conf[q][pr[1]])

    def objective(chosen):
        return sum(math.log1p(sum(psep(q, pr) for q in chosen)) for pr in PAIRS) + 0.02 * sum(cover(q) for q in chosen)

    cand = [a["id"] for a in cat if cover(a["id"]) >= MIN_COVER]
    chosen = []
    groups = sorted(set(group[q] for q in cand))
    for g in groups:
        opts = [q for q in cand if group[q] == g]
        chosen.append(max(opts, key=lambda q: objective(chosen + [q])))
    while len(chosen) < n_total:
        opts = [q for q in cand if q not in chosen]
        if not opts:
            break
        chosen.append(max(opts, key=lambda q: objective(chosen + [q])))
    order = {a["id"]: i for i, a in enumerate(cat)}
    return sorted(chosen, key=order.get), vals


MIN_COVER = 3
MODE = {"nulls": "exclude", "prior": 4.0, "alpha": 0.5}


def score(user, pos, qs, weights=None):
    if MODE["nulls"] == "exclude":
        return score_exclude(user, pos, qs, weights, MODE["prior"])
    res = {}
    for p in PARTIES:
        num = den = 0.0
        for q in qs:
            u = user.get(q)
            if u is None:
                continue
            w = 1.0 if weights is None else weights.get(q, 1.0)
            v, c = pos[q][p]["value"], CONF.get(pos[q][p]["confidence"], 0.0)
            a = 0.5 if v is None else c * (1 - abs(u - v) / 4) + (1 - c) * 0.5
            num += w * a
            den += w
        res[p] = num / den if den else None
    return res


def score_exclude(user, pos, qs, weights, prior):
    """Algoritmo final: nulos excluidos, confianza como peso, acuerdo híbrido proximidad/dirección (alpha) y previo de 'prior' preguntas a 0,5."""
    res = {}
    for p in PARTIES:
        num = den = 0.0
        for q in qs:
            u = user.get(q)
            v = pos[q][p]["value"]
            if u is None or v is None:
                continue
            w = (1.0 if weights is None else weights.get(q, 1.0)) * CONF.get(pos[q][p]["confidence"], 0.5)
            prox = 1 - abs(u - v) / 4
            dirc = 0.5 + u * v / 8
            num += w * (MODE["alpha"] * prox + (1 - MODE["alpha"]) * dirc)
            den += w
        res[p] = (num + prior * 0.5) / (den + prior)
    return res


def simulate(pos, qs, n=4000, seed=7):
    rnd = random.Random(seed)
    out = {}
    # 1. Autotest: cada partido responde sus propias posiciones.
    out["autotest"] = {}
    for p in PARTIES:
        user = {q: pos[q][p]["value"] for q in qs if pos[q][p]["value"] is not None}
        s = score(user, pos, qs)
        out["autotest"][p] = {"top": max(s, key=s.get), "score": round(s[p], 3), "margen": round(s[p] - sorted(s.values())[-2], 3)}
    # 2. Votantes sintéticos: posición del partido + ruido; en nulos responden al azar.
    for sigma in (0.75, 1.25):
        hits = {p: 0 for p in PARTIES}
        for p in PARTIES:
            for _ in range(n // len(PARTIES)):
                user = {}
                for q in qs:
                    v = pos[q][p]["value"]
                    base = rnd.choice([-2, -1, 0, 1, 2]) if v is None else v
                    user[q] = max(-2, min(2, round(base + rnd.gauss(0, sigma))))
                s = score(user, pos, qs)
                hits[p] += max(s, key=s.get) == p
        out[f"recuperacion_sigma_{sigma}"] = {p: round(hits[p] / (n // len(PARTIES)), 3) for p in PARTIES}
    # 3. Usuarios al azar: reparto del primer puesto (sesgo estructural).
    top = {p: 0 for p in PARTIES}
    for _ in range(n):
        user = {q: rnd.choice([-2, -1, 0, 1, 2]) for q in qs}
        s = score(user, pos, qs)
        top[max(s, key=s.get)] += 1
    out["azar_primer_puesto"] = {p: round(top[p] / n, 3) for p in PARTIES}
    s = score({q: 0 for q in qs}, pos, qs)
    out["usuario_todo_neutral"] = {p: round(v, 3) for p, v in sorted(s.items(), key=lambda kv: -kv[1])}
    return out


def main():
    n_total = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    n_fast = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    cat, v0, v1 = load()
    pos, stats = merge(cat, v0, v1)
    print("ACUERDO ENTRE CODIFICACIONES (53 afirmaciones por partido)")
    for p, s in stats.items():
        both = s["igual"] + s["dif1"] + s["dif2"]
        print(f"{p:8s} igual={s['igual']:2d} dif1={s['dif1']:2d} dif2+={s['dif2']:2d} nulo_vs_valor={s['nulo_vs_valor']:2d} ambos_nulos={s['ambos_nulos']:2d}"
              f"  acuerdo_exacto_en_no_nulos={s['igual'] / both if both else 0:.2f}")
    chosen, vals = select(cat, pos, n_total)
    fast, _ = select([a for a in cat if a["id"] in chosen], pos, n_fast, per="bloque")
    print("\nMATRIZ FUSIONADA (* = seleccionada, r = también en modo rápido; ! = marca pendiente)")
    print("id   amb  " + "  ".join(f"{p[:5]:>5s}" for p in PARTIES))
    for a in cat:
        q = a["id"]
        mark = ("r" if q in fast else "*") if q in chosen else " "
        cells = []
        for p in PARTIES:
            c = pos[q][p]
            v = "  ." if c["value"] is None else f"{c['value']:+3d}"
            cells.append(f"{v}{'!' if c['flag'] else ' '} ")
        print(f"{q}{mark} {a['ambito']:3d}  " + " ".join(cells) + "  " + a["texto"][:70])
    print("\nSEPARACIÓN POR PARES EN LA SELECCIÓN (suma |dif|/2; nº preguntas con |dif|>=2)")
    for pr in PAIRS:
        tot = sum(sep(vals[q], pr) for q in chosen) / 2
        n2 = sum(sep(vals[q], pr) >= 2 for q in chosen)
        print(f"{pr[0]}-{pr[1]:8s} unidades={tot:5.1f}  preguntas_dif2={n2}")
    lean = {"L": 0, "R": 0, "?": 0}
    for q in chosen:
        l = [vals[q][p] for p in LEFT if vals[q][p] is not None]
        r = [vals[q][p] for p in RIGHT if vals[q][p] is not None]
        if l and r:
            lean["L" if sum(l) / len(l) > sum(r) / len(r) else "R"] += 1
        else:
            lean["?"] += 1
    print(f"\nPolaridad de la selección (acuerdo favorece a): {lean}")
    for mode in ("half", "exclude"):
        MODE["nulls"] = mode
        print(f"\nSIMULACIÓN modo completo, nulos={mode}")
        for k, v in simulate(pos, chosen).items():
            print(k, json.dumps(v, ensure_ascii=False))
    MODE["nulls"] = "exclude"
    sim = simulate(pos, chosen)
    sim_fast = simulate(pos, fast)
    print("\nSIMULACIÓN (modo rápido, nulos=exclude)")
    for k, v in sim_fast.items():
        print(k, json.dumps(v, ensure_ascii=False))
    with open(os.path.join(BASE, "posiciones_fusion.json"), "w", encoding="utf-8") as f:
        json.dump(pos, f, ensure_ascii=False, indent=1)
    with open(os.path.join(BASE, "seleccion.json"), "w", encoding="utf-8") as f:
        json.dump({"completo": chosen, "rapido": fast, "simulacion": sim, "simulacion_rapido": sim_fast, "acuerdo": stats}, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
