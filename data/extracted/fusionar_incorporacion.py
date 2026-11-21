"""Fusiona las 2 codificaciones de cada partido incorporado y aplica la adjudicación.

Uso: python3 -I data/extracted/fusionar_incorporacion.py (docs/incorporar-partidos.md, pasos 7 y 8)
Lee data/partidos.json, catalogo_banco.json, <partido>/codificacion_a.json, <partido>/codificacion_b.json
y adjudicacion_incorporaciones.json. Escribe posiciones_incorporadas.json e imprime el acuerdo y las celdas pendientes.
Reglas de fusión de docs/metodologia.md 5.5. Los valores siguen el texto final de cada pregunta: export.py no los invierte.
"""
import json
import os

EXT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(EXT))
RANK = {"alta": 3, "media": 2, "baja": 1}
MAX_EVIDENCE = 3


def load(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def lower_conf(*cs):
    cs = [c for c in cs if c in RANK]
    return min(cs, key=RANK.get) if cs else None


def evidence_of(*cells):
    out, seen = [], set()
    for c in cells:
        for e in c.get("evidence") or []:
            key = (e.get("source_report"), e.get("page"), e.get("quote"))
            if key not in seen:
                seen.add(key)
                out.append(e)
    return out[:MAX_EVIDENCE]


def fuse(a, b):
    """Devuelve (celda provisional, marca). La marca es None si no hace falta adjudicar."""
    va, vb = a.get("value"), b.get("value")
    base = {"salience": a.get("salience") or b.get("salience"), "a": va, "b": vb,
            "cross": bool(a.get("cross") or b.get("cross"))}
    if va is None and vb is None:
        return {**base, "value": None, "confidence": None, "evidence": [], "viability": {},
                "rationale": a.get("rationale") or b.get("rationale") or ""}, None
    if va is not None and vb is not None:
        if va == vb:
            return {**base, "value": va, "confidence": lower_conf(a.get("confidence"), b.get("confidence")),
                    "evidence": evidence_of(a, b), "viability": a.get("viability") or b.get("viability") or {},
                    "rationale": a.get("rationale") or ""}, None
        if abs(va - vb) == 1:
            near = a if abs(va) < abs(vb) else b
            return {**base, "value": near["value"], "confidence": lower_conf(a.get("confidence"), b.get("confidence")),
                    "evidence": evidence_of(near), "viability": near.get("viability") or {},
                    "rationale": near.get("rationale") or ""}, "dif1"
        return {**base, "value": None, "confidence": None, "evidence": [], "viability": {},
                "rationale": f"A: {a.get('rationale', '')} B: {b.get('rationale', '')}"}, "dif2"
    one = a if va is not None else b
    keep = one.get("confidence") in ("alta", "media")
    return {**base, "value": one["value"] if keep else None, "confidence": one.get("confidence") if keep else None,
            "evidence": evidence_of(one) if keep else [], "viability": (one.get("viability") or {}) if keep else {},
            "rationale": one.get("rationale") or ""}, "un_nulo"


def main():
    partidos = [p for p in load(os.path.join(ROOT, "data", "partidos.json"))["partidos"] if p["incorporado"]]
    banco = load(os.path.join(EXT, "catalogo_banco.json"))["afirmaciones"]
    adj = load(os.path.join(EXT, "adjudicacion_incorporaciones.json"), {})
    out = {"signo": "texto_final", "version_banco": load(os.path.join(EXT, "catalogo_banco.json"))["version"], "partidos": {}}
    pending = []
    for p in partidos:
        pid = p["id"]
        ca = load(os.path.join(EXT, pid, "codificacion_a.json"))
        cb = load(os.path.join(EXT, pid, "codificacion_b.json"))
        if not ca or not cb:
            print(f"{pid}: faltan codificaciones, se omite")
            continue
        A = {c["id"]: c for c in ca["codings"]}
        B = {c["id"]: c for c in cb["codings"]}
        stats = {"iguales": 0, "dif1": 0, "dif2": 0, "un_nulo": 0, "ambos_nulos": 0}
        cells = {}
        for q in banco:
            qid = q["id"]
            if qid not in A or qid not in B:
                raise SystemExit(f"{pid}/{qid}: falta en la codificación {'A' if qid not in A else 'B'}")
            cell, flag = fuse(A[qid], B[qid])
            if flag is None:
                stats["ambos_nulos" if A[qid].get("value") is None else "iguales"] += 1
            else:
                stats[flag] += 1
            cell.update({"flag": flag, "decision": "fusion_automatica", "motivo": "", "antes": None, "revisar_humano": False})
            fix = adj.get(pid, {}).get(qid)
            if fix:
                cell["antes"] = cell["value"]
                for k in ("value", "confidence", "evidence", "viability", "rationale"):
                    if k in fix:
                        cell[k] = fix[k]
                cell.update({"decision": fix.get("decision", "adjudicada"), "motivo": fix["motivo"],
                             "revisar_humano": fix.get("revisar_humano", False)})
            elif flag:
                pending.append(f"{pid}/{qid} ({flag}: A {A[qid].get('value')}, B {B[qid].get('value')})")
            cells[qid] = cell
        out["partidos"][pid] = cells
        both = stats["iguales"] + stats["dif1"] + stats["dif2"]
        print(f"{pid}: iguales {stats['iguales']}, diferencia 1 {stats['dif1']}, diferencia 2 o más {stats['dif2']}, "
              f"valor frente a nulo {stats['un_nulo']}, ambos nulos {stats['ambos_nulos']}, "
              f"acuerdo exacto {stats['iguales'] / both:.2f}" if both else f"{pid}: sin valores comunes")
        print(f"   con valor tras fusión y adjudicación: {sum(c['value'] is not None for c in cells.values())} de {len(cells)}")
    with open(os.path.join(EXT, "posiciones_incorporadas.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"\nCeldas marcadas sin adjudicar: {len(pending)}")
    for x in pending:
        print(" -", x)


if __name__ == "__main__":
    main()
