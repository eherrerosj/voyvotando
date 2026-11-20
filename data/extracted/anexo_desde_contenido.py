"""Imprime la tabla de posiciones de docs/metodologia.md (4.4) desde src/content/questions.json (datos finales exportados)."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
q = json.load(open(os.path.join(ROOT, "src", "content", "questions.json"), encoding="utf-8"))
P = ["podemos", "fa", "psoe", "pp", "vox", "salf"]
N = {"podemos": "Podemos", "fa": "FA", "psoe": "PSOE", "pp": "PP", "vox": "Vox", "salf": "SALF"}
M = {"alta": "", "media": "ᵐ", "baja": "ᵇ", None: ""}
rows = ["| Nº | ID | Bloque | Afirmación | Eje | Pol. | R | " + " | ".join(N[p] for p in P) + " |", "|---|---|---|---|---|---|---|" + "---|" * 6]
for x in q:
    cells = ["·" if x["positions"][p]["value"] is None else f"{x['positions'][p]['value']:+d}{M[x['positions'][p]['confidence']]}" for p in P]
    eje = "" if not x["axis"] else f"{x['axis']}{'+' if x['dir'] > 0 else '−'}"
    rows.append(f"| {x['order']} | {x['id']} | {x['block']} | {x['text']} | {eje} | {x['polarity']} | {'✓' if x['fast'] else ''} | " + " | ".join(cells) + " |")
cov = {p: sum(x["positions"][p]["value"] is not None for x in q) for p in P}
pol = {k: sum(x["polarity"] == k for x in q) for k in "IDT"}
rows += ["", f"Cobertura (posiciones documentadas de {len(q)}): " + ", ".join(f"{N[p]} {cov[p]}" for p in P) + ".",
         f"Polaridad: {pol['I']} I, {pol['D']} D y {pol['T']} T. Modo rápido: {sum(x['fast'] for x in q)} preguntas."]
print("\n".join(rows))
