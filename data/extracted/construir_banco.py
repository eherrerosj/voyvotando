"""Construye banco_final.json: orden, bloque, polaridad y modo rápido de las 40 preguntas seleccionadas."""
import json
import os

BASE = os.path.dirname(os.path.abspath(__file__))
PARTIES = ["podemos", "fa", "psoe", "pp", "vox", "salf"]
NAMES = {"podemos": "Podemos", "fa": "FA", "psoe": "PSOE", "pp": "PP", "vox": "Vox", "salf": "SALF"}
BLOQUES = {1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 3, 7: 3, 8: 4, 9: 4, 10: 5, 11: 5, 12: 6, 13: 6, 14: 7, 15: 7, 16: 7, 17: 7, 18: 8, 19: 8}
BLOQUE_NOMBRE = {1: "Economía, impuestos y trabajo", 2: "Vivienda", 3: "Sanidad y educación", 4: "Familia, derechos e igualdad",
                 5: "Inmigración y seguridad", 6: "Instituciones y territorio", 7: "Clima, energía, movilidad y tecnología", 8: "Europa, defensa y memoria"}
CONF_MARK = {"alta": "", "media": "ᵐ", "baja": "ᵇ", None: ""}

cat = {a["id"]: a for a in json.load(open(os.path.join(BASE, "catalogo_afirmaciones_v1.json"), encoding="utf-8"))["afirmaciones"]}
pos = json.load(open(os.path.join(BASE, "posiciones_fusion.json"), encoding="utf-8"))
sel = json.load(open(os.path.join(BASE, "seleccion.json"), encoding="utf-8"))
chosen, fast = sel["completo"], set(sel["rapido"])


def lean(q):
    l = [pos[q][p]["value"] for p in ("podemos", "fa", "psoe") if pos[q][p]["value"] is not None]
    r = [pos[q][p]["value"] for p in ("pp", "vox", "salf") if pos[q][p]["value"] is not None]
    if not l or not r:
        return "T"
    d = sum(l) / len(l) - sum(r) / len(r)
    return "I" if d > 0.5 else ("D" if d < -0.5 else "T")


# Orden: por bloque; dentro del bloque se alterna la polaridad (I, D, I, D...) para reducir el sesgo de aquiescencia.
ordered = []
for b in range(1, 9):
    qs = [q for q in chosen if BLOQUES[cat[q]["ambito"]] == b]
    i_ = [q for q in qs if lean(q) == "I"]
    d_ = [q for q in qs if lean(q) == "D"]
    t_ = [q for q in qs if lean(q) == "T"]
    seq = []
    first, second = (d_, i_) if b == 1 else (i_, d_)
    if b == 1 and "Q03" in d_:
        d_.remove("Q03")
        d_.insert(0, "Q03")  # La pregunta más fácil de entender abre el test.
    while first or second:
        if first:
            seq.append(first.pop(0))
        if second:
            seq.append(second.pop(0))
    seq += t_
    ordered += seq

banco = []
for n, q in enumerate(ordered, 1):
    a = cat[q]
    banco.append({"orden": n, "id": q, "bloque": BLOQUES[a["ambito"]], "bloque_nombre": BLOQUE_NOMBRE[BLOQUES[a["ambito"]]],
                  "ambito": a["ambito"], "texto": a["texto"], "eje": a["eje"], "dir": a["dir"], "polaridad": lean(q),
                  "rapido": q in fast, "posiciones": {p: pos[q][p] for p in PARTIES}})
json.dump(banco, open(os.path.join(BASE, "banco_final.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

lines = ["| Nº | ID | Bloque | Afirmación | Eje | Pol. | R | " + " | ".join(NAMES[p] for p in PARTIES) + " |",
         "|---|---|---|---|---|---|---|" + "---|" * len(PARTIES)]
flags = 0
for b in banco:
    cells = []
    for p in PARTIES:
        c = b["posiciones"][p]
        v = "·" if c["value"] is None else f"{c['value']:+d}{CONF_MARK.get(c['confidence'], '')}"
        if c["flag"]:
            v += "†"
            flags += 1
        cells.append(v)
    eje = "" if not b["eje"] else f"{b['eje']}{'+' if b['dir'] > 0 else '−'}"
    lines.append(f"| {b['orden']} | {b['id']} | {b['bloque']} | {b['texto']} | {eje} | {b['polaridad']} | {'✓' if b['rapido'] else ''} | " + " | ".join(cells) + " |")
cov = {p: sum(b["posiciones"][p]["value"] is not None for b in banco) for p in PARTIES}
pol = {k: sum(b["polaridad"] == k for b in banco) for k in "IDT"}
lines.append("")
lines.append(f"Cobertura (posiciones documentadas de 40): " + ", ".join(f"{NAMES[p]} {cov[p]}" for p in PARTIES) + ".")
lines.append(f"Polaridad: {pol['I']} favorecen a la izquierda (I), {pol['D']} a la derecha (D), {pol['T']} transversales (T). Celdas pendientes de adjudicación (†): {flags}.")
# La tabla del anexo se genera con anexo_desde_contenido.py a partir de los datos finales exportados.
print("\n".join(lines[-2:]))
print("orden:", [b["id"] for b in banco])
print("rapido:", [b["id"] for b in banco if b["rapido"]])
