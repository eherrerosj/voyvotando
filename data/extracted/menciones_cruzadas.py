"""Añade a menciones_cruzadas.json las menciones de cada partido incorporado en los informes de los demás.

Uso: python3 -I data/extracted/menciones_cruzadas.py (docs/incorporar-partidos.md, paso 5)
Las claves de los 6 partidos de la versión 1.0 no se tocan: son la entrada que usaron sus codificaciones.
Una mención cuenta para un partido si su campo "party" contiene uno de sus alias de data/partidos.json.
"""
import json
import os
import re

EXT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(EXT))
with open(os.path.join(ROOT, "data", "partidos.json"), encoding="utf-8") as f:
    PARTIDOS = json.load(f)["partidos"]
path = os.path.join(EXT, "menciones_cruzadas.json")
with open(path, encoding="utf-8") as f:
    menciones = json.load(f)

reports = {}
for p in PARTIDOS:
    rp = os.path.join(EXT, p["id"], "informe.json")
    if os.path.exists(rp):
        with open(rp, encoding="utf-8") as f:
            reports[p["id"]] = json.load(f)

for p in PARTIDOS:
    if not p["incorporado"]:
        continue
    pattern = re.compile("|".join(rf"\b{re.escape(a)}\b" for a in p["alias"]), re.I)
    menciones[p["id"]] = [
        {"source_report": src, "page": m.get("page"), "text": m.get("text", "")}
        for src, rep in sorted(reports.items()) if src != p["id"]
        for m in rep.get("mentions_of_other_parties", []) if pattern.search(m.get("party", ""))
    ]
    print(f"{p['id']}: {len(menciones[p['id']])} menciones en otros informes")

with open(path, "w", encoding="utf-8") as f:
    json.dump(menciones, f, ensure_ascii=False, indent=1)
