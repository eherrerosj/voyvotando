"""Exporta los datos de data/extracted a src/content y comprueba los controles de docs/arquitectura.md 8.4.

Uso: python3 -I scripts/export.py
Falla (exit 1) si algún control no se cumple.
"""
import hashlib
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = os.path.join(ROOT, "data", "extracted")
OUT = os.path.join(ROOT, "src", "content")

DATA_VERSION = "1.1"
# Lista única de partidos, en orden alfabético de su nombre corto (docs/incorporar-partidos.md).
with open(os.path.join(ROOT, "data", "partidos.json"), encoding="utf-8") as _f:
    PARTIDOS_FILE = json.load(_f)
PARTIDOS = PARTIDOS_FILE["partidos"]
PARTIES = [p["id"] for p in PARTIDOS]
NAMES = {p["id"]: (p["nombre"], p["corto"]) for p in PARTIDOS}
TXT = {p["id"]: p["informe"] for p in PARTIDOS}
# Socios del escenario B de cada informe (docs/metodologia.md 6.21).
PARTNERS = {p["id"]: p["socios"] for p in PARTIDOS}
INCORPORATED = {p["id"] for p in PARTIDOS if p["incorporado"]}
BLOCKS = [
    {"id": 1, "name": "Economía, impuestos y trabajo", "ambitos": [1, 2, 3, 4]},
    {"id": 2, "name": "Vivienda", "ambitos": [5]},
    {"id": 3, "name": "Sanidad y educación", "ambitos": [6, 7]},
    {"id": 4, "name": "Familia, derechos e igualdad", "ambitos": [8, 9]},
    {"id": 5, "name": "Inmigración y seguridad", "ambitos": [10, 11]},
    {"id": 6, "name": "Instituciones y territorio", "ambitos": [12, 13]},
    {"id": 7, "name": "Clima, energía, movilidad y tecnología", "ambitos": [14, 15, 16, 17]},
    {"id": 8, "name": "Europa, defensa y memoria", "ambitos": [18, 19]},
]
AMBITOS = {
    1: "Economía, productividad y empresas", 2: "Fiscalidad y cuentas públicas", 3: "Empleo y relaciones laborales",
    4: "Pensiones y envejecimiento", 5: "Vivienda y urbanismo", 6: "Sanidad", 7: "Educación, universidad y ciencia",
    8: "Familia, infancia y cuidados", 9: "Protección social e igualdad", 10: "Inmigración y asilo", 11: "Seguridad y justicia",
    12: "Instituciones y calidad democrática", 13: "Modelo territorial y financiación", 14: "Energía, clima y medioambiente",
    15: "Agricultura, pesca y medio rural", 16: "Infraestructuras y movilidad", 17: "Tecnología, IA y datos",
    18: "Unión Europea, exterior y defensa", 19: "Cultura, medios, deporte y consumo",
}
FORBIDDEN_NAMES = sorted({a.lower() for p in PARTIDOS for a in p["alias"] + [p["corto"]]} | {"sumar", "feijóo", "sánchez", "abascal", "alvise", "montero", "díaz", "otegi", "pradales", "esteban"})

errors = []


def jload(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def norm(s):
    s = unicodedata.normalize("NFKC", s or "").lower()
    s = s.replace("­", "").replace("-\n", "")
    return re.sub(r"\s+", " ", s).strip()


def page_texts(party):
    with open(os.path.join(EXT, "txt", TXT[party] + ".txt"), encoding="utf-8") as f:
        return [norm(p) for p in f.read().split("\f")]


PAGES = {p: page_texts(p) for p in PARTIES}


def quote_found(quote, party, page):
    """Busca la cita en su página (±1). Si no aparece literal, acepta que todas sus palabras estén en la página:
    las tablas de 2 columnas intercalan líneas (43 de las 52 citas de SALF)."""
    q = norm(quote).strip(" .…\"'«»")
    pages = PAGES.get(party, [])
    cands = [pages[i] for i in (page - 2, page - 1, page) if page and 0 <= i < len(pages)] if page else pages
    if any(q in c for c in cands):
        return True
    words = [w for w in re.findall(r"\w+", q) if len(w) > 2]
    return bool(words) and any(all(w in c for w in words) for c in cands)


def unit_text(party, u):
    if party == "salf":
        return u.get("proposal") or u.get("instrument") or "", u.get("instrument") if u.get("proposal") else None
    return u.get("instrument") or "", u.get("condition") or None


def export_units(party, rep):
    units = []
    for amb in rep["ambitos"]:
        for sheet in amb["sheets"]:
            for u in sheet.get("units", []):
                text, condition = unit_text(party, u)
                units.append({
                    "party": party, "ambito": amb["num"], "id": u["id"], "title": u.get("title", ""),
                    "text": text, "condition": condition,
                    "A": u.get("A"), "B": u.get("B"), "C": u.get("C"), "E": u.get("E"),
                    "figures": u.get("figures", []), "page": u.get("page") or sheet.get("page"),
                })
    return units


def export_party(party):
    rep = jload(os.path.join(EXT, party, "informe.json"))
    cod = jload(os.path.join(EXT, party, "codificacion.json")) or jload(os.path.join(EXT, party, "codificacion_a.json"), {})
    meta = rep["report_meta"]
    sc = rep["scenarios"]
    units = export_units(party, rep)
    name, short = NAMES[party]
    conf = next(p for p in PARTIDOS if p["id"] == party)
    return {
        "id": party, "name": name, "short": short,
        "display": conf["mostrar"], "abbr": conf["sigla"],
        "scope": conf["ambito"], "districts": conf["circunscripciones"], "addedIn": conf["incorporado"],
        "report": {
            "title": meta.get("title", ""), "version": meta.get("version", ""), "cutoff": meta.get("cutoff_date", ""),
            "programDate": meta.get("program_date", ""), "programTitle": meta.get("program_title", ""),
            "pages": meta.get("pages", 0), "units": len(units), "pdf": f"/informes/{party}.pdf",
        },
        "scenarios": {k: {"label": sc[k].get("label", ""), "definition": sc[k].get("definition", "")} for k in ("A", "B", "C")}
        | {"E": {"definition": sc.get("E", {}).get("definition", "")}},
        "conclusions": [{"title": c.get("title", ""), "text": c.get("text", "")} for c in rep.get("executive_conclusions", [])],
        "salienceByAmbito": {str(s["ambito"]): s["salience"] for s in cod.get("salience_by_ambito", [])},
        "internalSupport": [{"area": s.get("area", ""), "evidence": s.get("evidence", ""), "limit": s.get("inference_and_limit", "")} for s in rep.get("internal_support", [])],
        # Mismos campos para los 6 partidos (auditoría de neutralidad): nombre y cargo.
        "team": [{"name": t.get("name", ""), "role": t.get("role", "").rstrip(".")} for t in rep.get("team", [])],
        # Sin marca de "acuerdo documentado": la extracción la aplicaba de forma distinta según el informe.
        "agreements": [{"counterpart": a.get("counterpart", ""), "commonGround": a.get("common_ground", ""), "frictions": a.get("frictions", "")}
                       for a in rep.get("agreements", [])],
        "partners": PARTNERS[party],
    }, units


def position_out(cell, party, qid):
    ev = []
    for e in cell.get("evidence") or []:
        src = e.get("source_report") or party
        ev.append({"unitId": e.get("unit_id"), "page": e.get("page"), "quote": e.get("quote", ""), "sourceReport": src})
    val = cell.get("value")
    conf = cell.get("confidence")
    if val is not None:
        if not ev:
            errors.append(f"{qid}/{party}: valor sin cita")
        if conf not in ("alta", "media", "baja"):
            errors.append(f"{qid}/{party}: confianza no válida {conf!r}")
        for e in ev:
            if e["quote"] and not quote_found(e["quote"], e["sourceReport"], e["page"]):
                errors.append(f"{qid}/{party}: cita no encontrada en {e['sourceReport']} p.{e['page']}: {e['quote'][:60]}")
    return {
        "value": val, "confidence": conf if val is not None else None, "salience": cell.get("salience"),
        "evidence": ev, "viability": {k: v for k, v in (cell.get("viability") or {}).items() if v},
        "rationale": cell.get("rationale") or cell.get("motivo") or "",
    }


def export_questions():
    bank = jload(os.path.join(EXT, "banco_final.json"))
    adjudicated = jload(os.path.join(EXT, "posiciones_adjudicadas.json"))
    polarity = {p["id"]: p for p in jload(os.path.join(EXT, "polaridad.json"), [])}
    signs_applied = jload(os.path.join(EXT, "polaridad_aplicada.json"), {}).get("signos_ya_invertidos_en_adjudicadas", False)
    ayudas = jload(os.path.join(EXT, "ayudas.json"), {})
    ajustes = jload(os.path.join(EXT, "banco_ajustes.json"), {})
    incorporated = jload(os.path.join(EXT, "posiciones_incorporadas.json"), {"partidos": {}})["partidos"]
    # Ajustes tras la adjudicación: retirar, añadir, reformular y cambiar el modo rápido (banco_ajustes.json).
    bank = [b for b in bank if b["id"] not in ajustes.get("retirar", {})]
    for extra in ajustes.get("añadir", []):
        pos = next(i for i, b in enumerate(bank) if b["id"] == extra["despues_de"]) + 1
        bank.insert(pos, {"id": extra["id"], "orden": 0, "bloque": extra["bloque"], "ambito": extra["ambito"], "texto": extra["texto"],
                          "eje": extra["eje"], "dir": extra["dir"], "polaridad": extra["polaridad"], "rapido": extra["rapido"],
                          "posiciones": extra["posiciones"], "_extra": True})
        ayudas = {**ayudas, extra["id"]: extra["ayuda"]}
    for n, b in enumerate(bank, 1):
        b["orden"] = n
        b["rapido"] = ajustes.get("rapido", {}).get(b["id"], b["rapido"])
    questions = []
    for b in bank:
        qid = b["id"]
        cells = b["posiciones"] if b.get("_extra") or not adjudicated else adjudicated[qid]
        text = b["texto"]
        flip = qid in polarity
        if flip:
            text = polarity[qid]["texto_nuevo"]
        text = ajustes.get("textos", {}).get(qid, text)
        positions = {}
        for p in PARTIES:
            if p in INCORPORATED:
                # Codificados con el texto final (catalogo_banco.json): no se invierten.
                if qid not in incorporated.get(p, {}):
                    errors.append(f"{qid}/{p}: falta en posiciones_incorporadas.json")
                    continue
                positions[p] = position_out(incorporated[p][qid], p, qid)
                continue
            cell = dict(cells[p])
            if flip and not (adjudicated and signs_applied) and cell.get("value") is not None:
                cell["value"] = -cell["value"]
            positions[p] = position_out(cell, p, qid)
        h = ayudas.get(qid)
        help_ = None
        if h:
            pro, con = h.get("a_favor"), h.get("en_contra")
            if flip:
                pro, con = con, pro
            help_ = {"medida": h.get("medida", ""), "ahora": h.get("ahora"), "aFavor": pro, "enContra": con,
                     "fuentes": [{"informe": f.get("informe"), "pagina": f.get("pagina")} for f in h.get("fuentes", [])]}
        dir_ = b["dir"] * (-1 if flip else 1)
        pol = {"I": "D", "D": "I"}.get(b["polaridad"], "T") if flip else b["polaridad"]
        q = {"id": qid, "order": b["orden"], "block": b["bloque"], "ambito": b["ambito"], "text": text,
             "axis": b["eje"], "dir": dir_, "polarity": pol, "fast": b["rapido"], "help": help_, "positions": positions}
        cover = sum(positions[p]["value"] is not None for p in PARTIES)
        if cover < 3:
            errors.append(f"{qid}: solo {cover} partidos con posición")
        low = norm(text)
        for n in FORBIDDEN_NAMES:
            if re.search(rf"\b{re.escape(n)}\b", low):
                errors.append(f"{qid}: el texto contiene el nombre '{n}'")
        questions.append(q)
    return sorted(questions, key=lambda q: q["order"]), bool(adjudicated)


def main():
    os.makedirs(os.path.join(OUT, "units"), exist_ok=True)
    parties, total_units = [], 0
    for p in PARTIES:
        party, units = export_party(p)
        parties.append(party)
        total_units += len(units)
        with open(os.path.join(OUT, "units", f"{p}.json"), "w", encoding="utf-8") as f:
            json.dump(units, f, ensure_ascii=False)
        if len(units) != next(c["unidades"] for c in PARTIDOS if c["id"] == p):
            errors.append(f"{p}: {len(units)} unidades exportadas, data/partidos.json declara otra cifra")
    questions, adjudicated = export_questions()
    glossary = jload(os.path.join(EXT, "glosario.json"), [])
    interludes = jload(os.path.join(EXT, "interludios.json"), [])
    payload = {"parties": parties, "questions": questions, "blocks": BLOCKS, "ambitos": AMBITOS, "glossary": glossary, "interludes": interludes}
    digest = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    meta = {
        "version": DATA_VERSION, "sha256": digest, "questions": len(questions), "fast": sum(q["fast"] for q in questions),
        "parties": len(parties), "units": total_units, "reportPages": sum(p["report"]["pages"] for p in parties),
        "cutoff": max(p["report"]["cutoff"] for p in parties), "adjudicated": adjudicated, "electionDate": "2026-11-29",
        # Nombres y ámbito de cada partido para la interfaz, sin cargar parties.json en el navegador.
        "partyInfo": {p["id"]: {"display": p["display"], "abbr": p["abbr"], "scope": p["scope"], "districts": p["districts"]} for p in parties},
        "notIncluded": PARTIDOS_FILE["sin_informe"],
    }
    core = [{k: q[k] for k in ("id", "order", "block", "ambito", "text", "fast", "help")} for q in questions]
    for name, obj in [("parties", parties), ("questions", questions), ("questions_core", core), ("blocks", BLOCKS), ("ambitos", AMBITOS),
                      ("glossary", glossary), ("interludes", interludes), ("meta", meta)]:
        with open(os.path.join(OUT, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=1)
    print(f"Exportado: {len(questions)} preguntas ({meta['fast']} en modo rápido), {len(parties)} partidos, {total_units} unidades, "
          f"datos {'adjudicados' if adjudicated else 'provisionales'}, sha256 {digest[:12]}")
    if errors:
        print(f"\n{len(errors)} controles fallidos:")
        for e in errors:
            print(" -", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
