"""Escribe catalogo_banco.json: las preguntas publicadas, con su texto final, para codificar partidos nuevos.

Uso: python3 -I data/extracted/catalogo_banco.py (después de npm run data)
Lee src/content/questions.json y las notas de catalogo_afirmaciones_v1.json (docs/incorporar-partidos.md, paso 3).
El texto es el que ve la persona usuaria: los partidos nuevos se codifican con ese signo y export.py no lo invierte.
"""
import json
import os

EXT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(EXT))


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


v1 = load(os.path.join(EXT, "catalogo_afirmaciones_v1.json"))
notes = {a["id"]: a.get("nota", "") for a in v1["afirmaciones"]}
flipped = {p["id"] for p in load(os.path.join(EXT, "polaridad.json"))}
meta = load(os.path.join(ROOT, "src", "content", "meta.json"))
questions = load(os.path.join(ROOT, "src", "content", "questions.json"))

out = {
    "version": meta["version"],
    "uso": "Preguntas publicadas con su texto final. Codifica cada partido nuevo con este texto y este signo.",
    "escala": v1["escala"],
    "afirmaciones": [
        {
            "id": q["id"], "ambito": q["ambito"], "bloque": q["block"], "texto": q["text"],
            # Las notas de las preguntas invertidas se escribieron para la redacción anterior.
            "nota": "" if q["id"] in flipped else notes.get(q["id"], ""),
        }
        for q in questions
    ],
}
with open(os.path.join(EXT, "catalogo_banco.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(f"catalogo_banco.json: {len(out['afirmaciones'])} preguntas, versión {out['version']}")
