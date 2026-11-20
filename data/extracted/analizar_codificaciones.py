"""Matriz afirmación x partido a partir de data/extracted/<partido>/codificacion.json.

Calcula cobertura, confianza media, dispersión y separación entre pares de partidos.
Uso: python3 -I analizar_codificaciones.py [--extras]
"""
import itertools
import json
import os
import statistics
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PARTIES = ["podemos", "fa", "psoe", "pp", "vox", "salf"]
CONF = {"alta": 1.0, "media": 0.75, "baja": 0.5}


def load():
    cat = json.load(open(os.path.join(BASE, "catalogo_afirmaciones_v0.json"), encoding="utf-8"))
    codings, extras = {}, []
    for p in PARTIES:
        path = os.path.join(BASE, p, "codificacion.json")
        if not os.path.exists(path):
            print(f"FALTA {path}", file=sys.stderr)
            continue
        d = json.load(open(path, encoding="utf-8"))
        codings[p] = {c["id"]: c for c in d["codings"]}
        for x in d.get("extra_statements", []):
            extras.append((p, x))
    return cat, codings, extras


def main():
    cat, codings, extras = load()
    parties = [p for p in PARTIES if p in codings]
    pairs = list(itertools.combinations(parties, 2))
    pair_sep = {pr: [] for pr in pairs}
    rows = []
    for a in cat["afirmaciones"]:
        vals, confs = {}, []
        for p in parties:
            c = codings[p].get(a["id"])
            v = None if c is None else c.get("value")
            vals[p] = v
            if v is not None:
                confs.append(CONF.get(c.get("confidence"), 0.5))
        nn = [v for v in vals.values() if v is not None]
        sd = statistics.pstdev(nn) if len(nn) > 1 else 0.0
        seps = []
        for pr in pairs:
            x, y = vals[pr[0]], vals[pr[1]]
            if x is not None and y is not None and abs(x - y) >= 2:
                seps.append(pr)
                pair_sep[pr].append(a["id"])
        rows.append((a["id"], a["ambito"], len(nn), round(sum(confs) / len(confs), 2) if confs else 0, round(sd, 2), len(seps), vals))

    print("id\támb\tcob\tconf\tsd\tpares\t" + "\t".join(parties))
    for r in rows:
        print("\t".join(str(x) for x in r[:6]) + "\t" + "\t".join("." if r[6][p] is None else f"{r[6][p]:+d}" for p in parties))
    print("\nSeparación por pares (nº afirmaciones con diferencia >= 2):")
    for pr, ids in sorted(pair_sep.items(), key=lambda kv: len(kv[1])):
        print(f"{pr[0]}-{pr[1]}\t{len(ids)}\t{' '.join(ids)}")
    if "--extras" in sys.argv:
        print("\nAfirmaciones extra propuestas:")
        for p, x in extras:
            print(f"[{p}] {x.get('id')} amb{x.get('ambito')} v={x.get('value')} {x.get('confidence')}/{x.get('salience')}: {x.get('texto')}")


if __name__ == "__main__":
    main()
