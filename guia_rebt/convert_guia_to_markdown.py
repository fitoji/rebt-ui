#!/usr/bin/env python3
"""
Descarga las Guías Técnicas de aplicación del REBT publicadas por el Ministerio
de Industria (industria.gob.es) y las convierte a Markdown con la misma forma
que el corpus REBT de `boe-rebt`:

  <salida>/
    pdf/BT-19.pdf            PDF original descargado (fuente; fuera de git)
    md/BT-19.md              texto convertido, tablas incluidas como tablas
    tablas/BT-19_t01.csv     cada tabla detectada, en CSV
    imgs/BT-19_p12_i01.png   figuras extraídas o páginas solo-figura rasterizadas
    indice.json              documentos, metadatos, tablas, figuras y sha256

Decisiones de conversión (medidas contra los PDF reales):
  - Motor: pdfplumber para texto y tablas (pymupdf4llm no detectó las tablas
    grandes de estas guías); PyMuPDF solo para figuras y render de páginas.
  - Cabeceras y pies repetidos se quitan por geometría (bandas superior e
    inferior); el texto de la cabecera se reusa como metadatos (edición,
    revisión, código de guía).
  - Los diagramas de estas guías son vectoriales: no se rasterizan las páginas
    con texto. Se extraen las imágenes embebidas reales (>= 200x150 px) y se
    rasterizan solo las páginas que son prácticamente una figura; el resto deja
    un enlace a la página del PDF local.

Uso:
    python convert_guia_to_markdown.py                 # descarga y convierte todo
    python convert_guia_to_markdown.py --solo BT-19    # un solo documento
    python convert_guia_to_markdown.py --no-figuras    # sin extraer figuras
    python convert_guia_to_markdown.py --debug         # trazas de descarga y bandas

Requiere: pdfplumber, PyMuPDF (ver requirements.txt)
"""
from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import html as html_mod
import io
import json
import math
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

INDICE_URL = (
    "https://industria.gob.es/Calidad-Industrial/seguridadindustrial/"
    "instalacionesindustriales/baja-tension/Paginas/guia-tecnica-aplicacion.aspx"
)
BASE = "https://industria.gob.es"
UA = "guia-rebt-to-markdown/1.0 (uso personal)"

# Guías que el ministerio publica pero ya no enlaza en la página. La página de
# Industria dejó de enlazar la guía BT-51 (instalaciones domóticas) en algún
# mantenimiento: el PDF responde 200 y el índice oficial de unidades temáticas
# (guia_bt_indice_jul19R8.pdf) la lista. Se agregan acá a mano, con evidencia.
EXTRAS = [
    ("BT-51",
     "https://industria.gob.es/Calidad-Industrial/seguridadindustrial/"
     "instalacionesindustriales/baja-tension/Documents/bt/guia_bt_51_feb07R1.pdf",
     "BT-51. Instalaciones de sistemas de automatización, gestión técnica de la energía "
     "y seguridad para viviendas y edificios"),
]

# bandas de cabecera/pie
FRACCION_SUPERIOR = 0.30
FRACCION_INFERIOR = 0.12
UMBRAL_REPETIDO = 0.5

# figuras
MIN_IMAGEN_ANCHO = 200
MIN_IMAGEN_ALTO = 150
MIN_TRAZOS_FIGURA = 20  # trazos no rectilíneos (curvas o diagonales)
MAX_TEXTO_PAGINA_FIGURA = 400
DPI_RENDER = 110

# un párrafo nuevo empieza cuando el hueco vertical supera este factor del alto de línea
FACTOR_SALTO_PARRAFO = 1.35

HEADER_RE = re.compile(
    r"^(?:GU[ÍI]A|MINISTERIO|DE INDUSTRIA|TURISMO|COMERCIO|Edici[óo]n|Revisi[óo]n|APLICACI[ÓO]N)",
    re.IGNORECASE,
)
PIE_RE = re.compile(r"^(?:\d{1,4}|p[áa]gina\s+\d+.*)$", re.IGNORECASE)
# etiquetas que siempre abren una columna de la cabecera (a diferencia de APLICACIÓN:,
# que es parte del rótulo central "GUÍA TÉCNICA DE APLICACIÓN:")
ETIQUETA_COLUMNA_RE = re.compile(r"^(?:GU[ÍI]A|MINISTERIO|DE INDUSTRIA|TURISMO|COMERCIO|Edici[óo]n|Revisi[óo]n)",
                                 re.IGNORECASE)
ANCLA_PDF_RE = re.compile(r'<a[^>]*href="([^"]+\.pdf)"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL)
MARCADOR_PDF_RE = re.compile(r"\[\s*(?:pdf|\d[\d.,]*\s*(?:kb|mb))\s*\]", re.IGNORECASE)
PUNTOS_GUIA_RE = re.compile(r"^(.*?)\.{3,}\s*(\d+)\s*$")
APARTADO_RE = re.compile(r"^(\d+(?:\.\d+)*)\.?\s+[A-ZÁÉÍÓÚÑÜ]")
CABECERA_ETIQUETA_RE = re.compile(
    r"^(?:MINISTERIO|DE\s+INDUSTRIA|TURISMO|COMERCIO|GU[ÍI]A\s+T[ÉE]CNICA|GU[ÍI]A\s*-?\s*BT|"
    r"Edici[óo]n\s*:|Revisi[óo]n\s*:?$|P[ÁA]GINA\b)",
    re.IGNORECASE,
)


# ------------------------------------------------------------------ descargas
def es_pdf_valido(data: bytes) -> bool:
    """Un PDF real empieza con %PDF y termina con %%EOF (no una página de error)."""
    if not data or not data.startswith(b"%PDF"):
        return False
    return b"%%EOF" in data[-2048:]


def descargar(url: str, destino: Path, debug: bool = False, reintentos: int = 3) -> Path:
    """GET a disco con caché: solo se reusa (y solo se guarda) un PDF válido."""
    destino = Path(destino)
    if destino.exists() and destino.stat().st_size > 0:
        if es_pdf_valido(destino.read_bytes()):
            return destino
        destino.unlink()
        if debug:
            print(f"[debug] caché no es un PDF válido, se re-descarga: {destino}", file=sys.stderr)
    ultimo = None
    for intento in range(1, reintentos + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
            if not es_pdf_valido(data):
                raise ValueError(f"respuesta no PDF ({len(data)} bytes)")
            destino.parent.mkdir(parents=True, exist_ok=True)
            destino.write_bytes(data)
            time.sleep(0.3)  # cortesía con el servidor
            return destino
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            ultimo = e
            if debug:
                print(f"[debug] intento {intento} fallido para {url}: {e}", file=sys.stderr)
            time.sleep(1.0 * intento)
    raise SystemExit(f"No se pudo descargar {url}\n  último error: {ultimo}")


def sha256_de(ruta: Path) -> str:
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def bajar_indice(debug: bool = False) -> str:
    req = urllib.request.Request(INDICE_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        html_texto = r.read().decode("utf-8", errors="replace")
    if ".pdf" not in html_texto:
        raise SystemExit("La página del ministerio no contiene enlaces a PDF; revisala con --debug")
    if debug:
        print(f"[debug] índice descargado: {len(html_texto)} caracteres", file=sys.stderr)
    return html_texto


# --------------------------------------------------------- nombres y títulos
def slug(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")


def doc_id_desde_archivo(nombre: str) -> str:
    """Identificador estable y ordenable a partir del nombre del PDF del ministerio.

    guia_bt_19_feb09R2.pdf -> BT-19 ; guia_bt_anexo_1_sep03R1.pdf -> BT-Anexo-1
    guia_bt_rd_842_02_sep03R1.pdf -> BT-RD-842-02 ; guia_bt_introduccion.pdf -> 00-Introduccion
    """
    base = urllib.parse.unquote(str(nombre)).replace("\\", "/").rsplit("/", 1)[-1]
    if base.lower().endswith(".pdf"):
        base = base[:-4]
    bajo = base.lower()

    m = re.search(r"bt[_-]?anexo[_-]?(\d{1,2})", bajo)
    if m:
        return f"BT-Anexo-{int(m.group(1))}"
    if "rd_842" in bajo:
        return "BT-RD-842-02"
    if "introducci" in bajo:
        return "00-Introduccion"
    if "indice" in bajo:
        return "01-Indice-unidades-tematicas"
    m = re.search(r"(?:itc[_-]?)?bt[_-]?(\d{2})(?!\d)", bajo)
    if m:
        return f"BT-{int(m.group(1)):02d}"

    partes = [p for p in re.split(r"[_\-\s]+", base) if p]
    if not partes:
        return "ZZ-Documento"
    partes[0] = partes[0][:1].upper() + partes[0][1:].lower()
    return "ZZ-" + "-".join([partes[0]] + [p.lower() for p in partes[1:]])


def limpiar_titulo(texto: str) -> str:
    """'BT-19. Instalaciones [...]. [pdf] [291,29 KB]' -> 'BT-19. Instalaciones [...]'"""
    txt = html_mod.unescape(re.sub(r"<[^>]+>", " ", texto))
    txt = MARCADOR_PDF_RE.sub(" ", txt)
    return re.sub(r"\s+", " ", txt).strip().strip(" .")


def agregar_extras(docs: list[dict]) -> list[dict]:
    """Suma las guías publicadas que la página ya no enlaza (ver EXTRAS).

    Se insertan al final del bloque de guías, antes de los anexos, para que el
    corpus mantenga el orden de la página. Si la página vuelve a enlazarlas, no
    se duplican.
    """
    presentes = {d["id"] for d in docs}
    faltantes = [e for e in EXTRAS if e[0] not in presentes]
    if not faltantes:
        return docs
    corte = next((i for i, d in enumerate(docs)
                  if re.match(r"BT-Anexo|ZZ-", d["id"])), len(docs))
    for ident, url, titulo in faltantes:
        docs.insert(corte, {
            "archivo": urllib.parse.unquote(url.rsplit("/", 1)[-1]),
            "id": ident,
            "titulo": titulo,
            "url": url,
            "origen": "extra",
        })
        corte += 1
    for i, doc in enumerate(docs, 1):
        doc["n"] = i
    return docs


def parsear_indice(html_texto: str, base: str = BASE) -> list[dict]:
    """Documentos en el orden en que aparecen en la página, sin duplicados."""
    docs: list[dict] = []
    vistos: set[str] = set()
    for m in ANCLA_PDF_RE.finditer(html_texto):
        url = urllib.parse.urljoin(base, html_mod.unescape(m.group(1)).strip())
        if url in vistos:
            continue
        vistos.add(url)
        archivo = urllib.parse.unquote(url.rsplit("/", 1)[-1])
        docs.append({
            "n": len(docs) + 1,
            "archivo": archivo,
            "id": doc_id_desde_archivo(archivo),
            "titulo": limpiar_titulo(m.group(2)) or archivo,
            "url": url,
        })
    return docs


# ------------------------------------------------------------ cabeceras y pies
def _normaliza(txt: str) -> str:
    return re.sub(r"\s+", " ", (txt or "").strip())


def _es_cabecera(texto: str, repetidos: set[str]) -> bool:
    return texto in repetidos or bool(HEADER_RE.match(texto))


def lineas_de_banda(palabras: list[dict], max_top: float, tolerancia: float = 3.0,
                    salto_columna: float = 12.0) -> list[str]:
    """Arma las líneas de la cabecera agrupando palabras por altura y separando columnas.

    La cabecera de estas guías son tres columnas (ministerio, título y código):
    palabras casi a la misma altura pero separadas horizontalmente se unen con
    " · " para que la edición ("Edición: feb 09") no se mezcle con ellas.
    """
    utiles = sorted((p for p in palabras if p["top"] <= max_top and _normaliza(p.get("text", ""))),
                    key=lambda p: (p["top"], p["x0"]))
    lineas: list[str] = []
    actual = ""
    clave_previa: int | None = None
    x_fin: float | None = None
    for p in utiles:
        clave = round(p["top"] / tolerancia)
        texto = _normaliza(p["text"])
        if clave_previa is not None and clave != clave_previa:
            lineas.append(actual.strip())
            actual, x_fin = "", None
        if actual:
            # una etiqueta de cabecera (Edición:, Revisión:, GUÍA-BT-…) siempre abre columna:
            # así el corte no depende de que el hueco horizontal sea grande
            separador = " · " if (ETIQUETA_COLUMNA_RE.match(texto) or
                                   (x_fin is not None and p["x0"] - x_fin > salto_columna)) else " "
            actual += separador + texto
        else:
            actual = texto
        clave_previa, x_fin = clave, p["x1"]
    if actual.strip():
        lineas.append(actual.strip())
    return lineas


def detectar_bandas(paginas_palabras: list[list[dict]], alto: float,
                    umbral: float = UMBRAL_REPETIDO) -> tuple[float, float]:
    """Altura de la cabecera y del pie repetidos, en puntos, para recortarlos.

    Cada página es una lista de palabras con `text`, `top` y `bottom`. Se
    consideran cabecera las palabras de la franja superior que se repiten en
    varias páginas o que coinciden con las etiquetas fijas de la guía; nunca se
    recorta por encima de la primera palabra de la franja que no es cabecera.
    """
    n = max(1, len(paginas_palabras))
    minimo = max(2, math.ceil(umbral * n)) if n > 1 else 1
    zona_sup = alto * FRACCION_SUPERIOR
    zona_inf = alto * (1 - FRACCION_INFERIOR)

    conteo: collections.Counter = collections.Counter()
    for pagina in paginas_palabras:
        for texto in {_normaliza(p["text"]) for p in pagina
                      if p["bottom"] <= zona_sup and _normaliza(p["text"])}:
            conteo[texto] += 1
    repetidos = {t for t, c in conteo.items() if c >= minimo}

    corte_sup = 0.0
    cabecera = [p for pagina in paginas_palabras for p in pagina
                if p["bottom"] <= zona_sup and _es_cabecera(_normaliza(p["text"]), repetidos)]
    if cabecera:
        corte_sup = min(max(p["bottom"] for p in cabecera) + 2, zona_sup)
        ajenas = [p["top"] for pagina in paginas_palabras for p in pagina
                  if p["bottom"] <= zona_sup and not _es_cabecera(_normaliza(p["text"]), repetidos)]
        if ajenas:
            corte_sup = min(corte_sup, min(ajenas))

    corte_inf = 0.0
    pie = [p for pagina in paginas_palabras for p in pagina
           if p["top"] >= zona_inf and PIE_RE.match(_normaliza(p["text"]))]
    if pie:
        corte_inf = min(alto - min(p["top"] for p in pie) + 2, alto * FRACCION_INFERIOR)
        ajenas_inf = [p["bottom"] for pagina in paginas_palabras for p in pagina
                      if p["top"] >= zona_inf and not PIE_RE.match(_normaliza(p["text"]))]
        if ajenas_inf:
            corte_inf = min(corte_inf, alto - max(ajenas_inf))
        corte_inf = max(0.0, corte_inf)

    return corte_sup, corte_inf


def metadatos_cabecera(lineas: list[str]) -> dict:
    """Edición, revisión, código y título tomados de la propia cabecera del PDF.

    La edición es mes y año ("feb 09"): la captura va acotada porque en la misma
    línea puede venir otra columna de la cabecera. Las líneas con puntos guía o
    números de página no son título.
    """
    texto = " · ".join(_normaliza(l) for l in lineas if _normaliza(l))
    ed = re.search(r"Edici[óo]n\s*:\s*([A-Za-zÁÉÍÓÚáéíóú.]{2,12}(?:\s+\d{2,4})?)", texto)
    rev = re.search(r"Revisi[óo]n\s*:?\s*(\d+)", texto)
    candidatas = []
    for l in lineas:
        for segmento in _normaliza(l).split(" · "):
            t = _normaliza(segmento)
            if not t or CABECERA_ETIQUETA_RE.match(t):
                continue
            if PUNTOS_GUIA_RE.search(t) or PIE_RE.match(t) or re.match(r"^[ÍI]NDICE\b", t, re.IGNORECASE):
                continue
            # una frase del cuerpo no es el título de la guía (p. ej. la Introducción,
            # que no tiene título en la cabecera)
            if len(t) > 80 or len(t.split()) > 12:
                continue
            candidatas.append(t)
    titulo = max(candidatas, key=len) if candidatas else ""
    return {
        "edicion": _normaliza(ed.group(1)) if ed else "",
        "revision": rev.group(1) if rev else "",
        "titulo_pdf": titulo,
    }


# ------------------------------------------------------------------- rejillas
def limpiar_rejilla(filas: list[list]) -> list[list[str]]:
    """Normaliza celdas, descarta filas vacías y columnas finales vacías."""
    limpias: list[list[str]] = []
    for fila in filas or []:
        celdas = [_normaliza("" if c is None else str(c)) for c in fila]
        if any(celdas):
            limpias.append(celdas)
    ancho = 0
    for fila in limpias:
        for i, celda in enumerate(fila):
            if celda:
                ancho = max(ancho, i + 1)
    return [fila[:ancho] + [""] * (ancho - len(fila)) for fila in limpias]


def rejilla_a_csv(filas: list[list[str]]) -> str:
    buf = io.StringIO()
    csv.writer(buf).writerows(filas)
    return buf.getvalue()


def rejilla_a_markdown(filas: list[list[str]]) -> str:
    if not filas:
        return ""
    escapar = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
    lineas = ["| " + " | ".join(escapar(c) for c in filas[0]) + " |",
              "|" + "|".join("---" for _ in filas[0]) + "|"]
    for fila in filas[1:]:
        lineas.append("| " + " | ".join(escapar(c) for c in fila) + " |")
    return "\n".join(lineas)


def es_tabla_de_datos(filas: list[list[str]]) -> bool:
    """Una tabla de datos tiene al menos dos columnas y dos filas.

    Estas guías enmarcan secciones y figuras con recuadros: pdfplumber los
    detecta como tabla de una sola columna y, si se aceptan, el texto de la
    sección termina en un CSV en lugar de en el Markdown.
    """
    if not filas:
        return False
    return len(filas[0]) >= 2 and len(filas) >= 2


def rejillas_de_pagina(tablas: list[dict], corte_sup: float = 0) -> list[dict]:
    """Tablas de datos: descarta la cabecera de página, los recuadros y las vacías."""
    salida = []
    for t in tablas:
        if t["bbox"][1] < corte_sup - 1:
            continue
        filas = limpiar_rejilla(t["filas"])
        if not es_tabla_de_datos(filas):
            continue
        salida.append({"bbox": t["bbox"], "filas": filas})
    return salida


def combinar_contenido(lineas: list[dict], tablas: list[dict]) -> list[dict]:
    """Contenido de una página en orden de lectura: líneas de texto y tablas."""
    items = [{"tipo": "tabla", "top": t["bbox"][1], "filas": t["filas"], "bbox": t["bbox"]}
             for t in tablas]
    for l in lineas:
        dentro = any(t["bbox"][1] <= l["top"] and l["bottom"] <= t["bbox"][3] for t in tablas)
        if not dentro:
            items.append({"tipo": "texto", "top": l["top"], "bottom": l["bottom"], "texto": l["text"]})
    items.sort(key=lambda i: i["top"])
    return items


# ------------------------------------------------------------------ texto
def deduplicar_chars(chars: list[dict]) -> list[dict]:
    """Quita los caracteres dibujados dos veces en el mismo punto.

    Varias guías usan 'negrita falsa' (ArialMT repetido exactamente en la misma
    posición) y pdfplumber extrae los dos trazos: el texto sale como
    "CCOOMMPPAAÑÑÍÍAA". No afecta a letras repetidas legítimas ("acción"),
    porque ahí las posiciones son distintas. Los trazos repetidos pueden diferir
    en centésimas de punto (99,478 vs 99,479), así que se redondea a décimas.
    """
    vistos: set[tuple] = set()
    unicos: list[dict] = []
    for c in chars:
        clave = (c.get("text"), round(float(c["x0"]), 1), round(float(c["top"]), 1))
        if clave in vistos:
            continue
        vistos.add(clave)
        unicos.append(c)
    return unicos


def sin_glifos_superpuestos(pagina):
    """Página de pdfplumber sin los caracteres repetidos en la misma posición."""
    permitidos = {id(c) for c in deduplicar_chars(list(pagina.chars))}
    return pagina.filter(lambda obj: obj.get("object_type") != "char" or id(obj) in permitidos)


def nivel_encabezado_numerado(txt: str) -> int:
    """'1. Objeto' -> 3, '2.2.2 Sección...' -> 5; 0 si no parece encabezado.

    Los encabezados de estas guías no terminan en punto: así las enumeraciones
    del cuerpo no se promocionan por error.
    """
    if len(txt) > 90 or txt.rstrip().endswith((".", ";", ",", ":")):
        return 0
    m = APARTADO_RE.match(txt)
    if not m:
        return 0
    partes = m.group(1).split(".")
    if any(int(p) > 99 or (len(p) > 1 and p.startswith("0")) for p in partes):
        return 0
    return min(6, 2 + len(partes))


def nivel_encabezado_mayusculas(txt: str) -> int:
    """Título en mayúsculas suelto en el cuerpo (sin numerar) -> nivel 3."""
    t = txt.strip()
    if len(t) < 10 or t.endswith((".", ";", ",", ":", "…")):
        return 0
    if re.search(r"[a-zñáéíóúü]", t):
        return 0
    if len(t.split()) < 2 or len(re.findall(r"[A-ZÁÉÍÓÚÑ]", t)) < 8:
        return 0
    if HEADER_RE.match(t):
        return 0
    return 3


def limpiar_linea_indice(txt: str) -> str:
    """'2.2.2 Sección....4' -> '- 2.2.2 Sección — 4'; el resto queda igual."""
    m = PUNTOS_GUIA_RE.match(txt.strip())
    if not m:
        return txt.strip()
    return f"- {m.group(1).strip()} — {m.group(2)}"


def es_linea_indice(txt: str) -> bool:
    return bool(PUNTOS_GUIA_RE.match(txt.strip()))


def nivel_encabezado(txt: str) -> int:
    return nivel_encabezado_numerado(txt) or nivel_encabezado_mayusculas(txt)


def agrupar_parrafos(lineas: list[dict], factor: float = FACTOR_SALTO_PARRAFO) -> list[dict]:
    """Une las líneas visuales de una misma página en párrafos.

    Corta cuando el hueco vertical supera `factor` veces el alto de línea, cuando
    alguna de las dos líneas es del índice (puntos guía) o cuando la anterior era
    un encabezado. Palabra partida con guion al final de línea se recompone.
    """
    parrafos: list[dict] = []
    anterior: dict | None = None
    for l in lineas:
        txt = _normaliza(l.get("text", ""))
        if not txt:
            continue
        alto_linea = max(1.0, float(l["bottom"]) - float(l["top"]))
        hueco = math.inf if anterior is None else float(l["top"]) - float(anterior["bottom"])
        corte = (
            anterior is None
            or hueco > factor * alto_linea
            or es_linea_indice(txt)
            or es_linea_indice(anterior["text"])
            or anterior.get("encabezado", False)
            or bool(nivel_encabezado(txt))
        )
        if corte:
            parrafos.append({"texto": txt, "top": float(l["top"]),
                             "encabezado": bool(nivel_encabezado(txt))})
        else:
            previo = parrafos[-1]["texto"]
            if previo.endswith("-") and txt[:1].islower():
                parrafos[-1]["texto"] = previo[:-1] + txt
            else:
                parrafos[-1]["texto"] = f"{previo} {txt}"
            parrafos[-1]["encabezado"] = parrafos[-1]["encabezado"] or bool(nivel_encabezado(txt))
        anterior = {"text": txt, "top": float(l["top"]), "bottom": float(l["bottom"]),
                    "encabezado": bool(nivel_encabezado(txt))}
    return parrafos


def md_de_pagina(items: list[dict], doc_id: str, tab_dir: Path, desde: int) -> tuple[list[str], int]:
    """Markdown de una página respetando el orden de lectura; escribe los CSV.

    Los tramos de texto se agrupan en párrafos; cada tabla se escribe como CSV y
    se inserta como tabla Markdown en el punto donde aparece.
    """
    salida: list[str] = []
    n = desde
    buffer: list[dict] = []

    def volcar() -> None:
        for p in agrupar_parrafos(buffer):
            texto = limpiar_linea_indice(p["texto"])
            nivel = 0 if texto.startswith("- ") else nivel_encabezado(p["texto"])
            salida.append(("#" * nivel + " " + texto + "\n") if nivel else texto + "\n")
        buffer.clear()

    for item in items:
        if item["tipo"] == "texto":
            buffer.append({"text": item["texto"], "top": item["top"], "bottom": item["bottom"]})
            continue
        volcar()
        n += 1
        nombre = f"{doc_id}_t{n:02d}.csv"
        (tab_dir / nombre).write_text(rejilla_a_csv(item["filas"]), encoding="utf-8")
        salida.append(f"\n<!-- tabla: ../tablas/{nombre} -->\n")
        salida.append(rejilla_a_markdown(item["filas"]) + "\n")
    volcar()
    return salida, n


# ------------------------------------------------------------------ figuras
def es_imagen_real(ancho: float, alto: float) -> bool:
    """Distingue una figura de verdad de un logo o un pedazo de diagrama."""
    return ancho >= MIN_IMAGEN_ANCHO and alto >= MIN_IMAGEN_ALTO


def es_pagina_solo_figura(texto: str, trazos: int) -> bool:
    return len(texto.strip()) < MAX_TEXTO_PAGINA_FIGURA and trazos >= MIN_TRAZOS_FIGURA


def nombre_imagen(doc_id: str, pagina: int, indice: int | None = None) -> str:
    if indice is None:
        return f"{doc_id}_p{pagina:02d}_pagina.png"
    return f"{doc_id}_p{pagina:02d}_i{indice:02d}.png"


def marca_figura_vectorial(doc_id: str, pagina: int) -> str:
    """Las figuras vectoriales no se rasterizan: se enlaza la página del PDF local."""
    return (f"<!-- figura vectorial en la pág. {pagina} del PDF original -->\n"
            f"> Figura en la pág. {pagina} del PDF original: "
            f"[ver en el PDF](../pdf/{doc_id}.pdf#page={pagina})")


def trazos_no_rectos(pagina) -> int:
    """Curvas y diagonales: el borde de una tabla o un filete no cuentan, un diagrama sí."""
    total = 0
    for dibujo in pagina.get_drawings():
        for item in dibujo["items"]:
            if item[0] == "c":
                total += 1
            elif item[0] == "l":
                p1, p2 = item[1], item[2]
                if abs(p1.x - p2.x) > 1.5 and abs(p1.y - p2.y) > 1.5:
                    total += 1
    return total


def figuras_embebidas(mu_pagina) -> list[dict]:
    """Imágenes raster reales de la página, por su rectángulo en la página."""
    salida = []
    for xref, _smask, ancho, alto, *_ in mu_pagina.get_images(full=True):
        if not es_imagen_real(ancho, alto):
            continue
        for rect in mu_pagina.get_image_rects(xref):
            salida.append({"xref": xref, "rect": rect})
            break
    return salida


def region_figura(rect, corte_sup: float, corte_inf: float, ancho: float, alto: float):
    """Recorta el rectángulo de una figura a la zona útil (sin cabecera ni pie).

    Devuelve (x0, y0, x1, y1) o None si la figura queda fuera o es un resto diminuto.
    """
    x0, y0, x1, y1 = (float(v) for v in rect)
    x0, x1 = max(0.0, x0), min(float(ancho), x1)
    y0, y1 = max(float(corte_sup), y0), min(float(alto) - float(corte_inf), y1)
    if x1 - x0 < 5 or y1 - y0 < 5:
        return None
    return (x0, y0, x1, y1)


def dibujar_region(mu_pagina, rect, doc: dict, num: int, img_dir: Path, nombre: str,
                   corte_sup: float, corte_inf: float, debug: bool = False) -> bool:
    """Rasteriza una región de la página (la figura, sin cabecera ni pie) a PNG."""
    import pymupdf

    region = region_figura(rect, corte_sup, corte_inf, mu_pagina.rect.width, mu_pagina.rect.height)
    if region is None:
        return False
    try:
        pix = mu_pagina.get_pixmap(dpi=DPI_RENDER, clip=pymupdf.Rect(*region))
    except Exception as e:  # noqa: BLE001 - una figura ilegible no debe cortar la conversión
        if debug:
            print(f"[debug] figura ilegible en {doc['id']} pág {num}: {e}", file=sys.stderr)
        return False
    (img_dir / nombre).write_bytes(pix.tobytes("png"))
    return True


def figuras_de_pagina(mu_pagina, num: int, doc: dict, img_dir: Path, corte_sup: float,
                      corte_inf: float, imgs: list[str], debug: bool = False) -> list[str]:
    """Marcas Markdown de las figuras de una página, guardando las imágenes."""
    salida: list[str] = []
    embebidas: list[dict] = []
    vistos: set[int] = set()
    for fig in figuras_embebidas(mu_pagina):
        if fig["xref"] in vistos:  # la misma imagen repetida en la misma página
            continue
        vistos.add(fig["xref"])
        embebidas.append(fig)
    for i, fig in enumerate(embebidas, 1):
        nombre = nombre_imagen(doc["id"], num, i)
        if not dibujar_region(mu_pagina, fig["rect"], doc, num, img_dir, nombre,
                              corte_sup, corte_inf, debug):
            continue
        imgs.append(f"imgs/{nombre}")
        salida.append(f"\n![figura pág {num}](../imgs/{nombre})\n")
    if embebidas:
        return salida

    trazos = trazos_no_rectos(mu_pagina)
    if es_pagina_solo_figura(mu_pagina.get_text() or "", trazos):
        nombre = nombre_imagen(doc["id"], num)
        pagina = (0, corte_sup, mu_pagina.rect.width, mu_pagina.rect.height - corte_inf)
        if dibujar_region(mu_pagina, pagina, doc, num, img_dir, nombre,
                          corte_sup, corte_inf, debug):
            imgs.append(f"imgs/{nombre}")
            salida.append(f"\n![página {num}](../imgs/{nombre})\n")
    elif trazos >= MIN_TRAZOS_FIGURA:
        salida.append("\n" + marca_figura_vectorial(doc["id"], num) + "\n")
    return salida


# --------------------------------------------------------------- markdown
def front_matter(meta: dict) -> str:
    orden = ["guia", "titulo", "edicion", "revision", "paginas", "fuente_pdf", "sha256", "convertido"]
    lineas = ["---"]
    for clave in orden:
        valor = meta.get(clave)
        if valor in (None, ""):
            continue
        if isinstance(valor, str):
            cita = any(c in valor for c in ':#"') or valor != valor.strip()
            lineas.append(f"{clave}: {json.dumps(valor, ensure_ascii=False) if cita else valor}")
        else:
            lineas.append(f"{clave}: {valor}")
    lineas.append("---")
    return "\n".join(lineas) + "\n"


def limpiar_salidas_previas(docs: list[dict], md_dir: Path, tab_dir: Path, img_dir: Path) -> None:
    """Borra solo lo que este script regenera, para no dejar restos de corridas viejas."""
    for doc in docs:
        (md_dir / f"{doc['id']}.md").unlink(missing_ok=True)
        for viejo in tab_dir.glob(f"{doc['id']}_t*.csv"):
            viejo.unlink()
        for viejo in img_dir.glob(f"{doc['id']}_*"):
            viejo.unlink()


def convertir_documento(pdf_path: Path, doc: dict, dirs: dict, debug: bool = False,
                        con_figuras: bool = True) -> dict:
    """Convierte un PDF a md + tablas CSV + figuras y devuelve sus metadatos."""
    import pdfplumber
    import pymupdf

    md_dir, tab_dir, img_dir = dirs["md"], dirs["tablas"], dirs["imgs"]
    lineas_md: list[str] = []
    imgs: list[str] = []
    n_tablas = 0

    with pdfplumber.open(pdf_path) as pdf, pymupdf.open(pdf_path) as mu:
        paginas = [sin_glifos_superpuestos(p) for p in pdf.pages]
        palabras = [p.extract_words() for p in paginas]
        corte_sup, corte_inf = detectar_bandas(palabras, paginas[0].height)
        cabecera_lineas = lineas_de_banda(palabras[0], paginas[0].height * FRACCION_SUPERIOR)
        meta_cab = metadatos_cabecera(cabecera_lineas)
        if debug:
            print(f"[debug] {doc['id']}: {len(paginas)} páginas, corte_sup={corte_sup:.1f}, "
                  f"corte_inf={corte_inf:.1f}, cabecera={meta_cab}", file=sys.stderr)

        for num, pagina in enumerate(paginas, 1):
            alto = pagina.height
            lineas = [{"text": l["text"], "top": l["top"], "bottom": l["bottom"]}
                      for l in pagina.extract_text_lines()
                      if l["bottom"] > corte_sup + 1 and l["top"] < alto - corte_inf - 1]
            tablas = rejillas_de_pagina(
                [{"bbox": t.bbox, "filas": t.extract()} for t in pagina.find_tables()
                 if t.bbox[1] >= corte_sup - 1 and t.bbox[3] <= alto - corte_inf + 1])
            md_pagina, n_tablas = md_de_pagina(combinar_contenido(lineas, tablas), doc["id"],
                                               tab_dir, n_tablas)
            lineas_md.extend(md_pagina)
            if con_figuras:
                lineas_md.extend(figuras_de_pagina(mu[num - 1], num, doc, img_dir,
                                                   corte_sup, corte_inf, imgs, debug))

    meta = {
        "guia": doc["id"],
        "titulo": doc["titulo"],
        "edicion": meta_cab["edicion"],
        "revision": meta_cab["revision"],
        "paginas": len(paginas),
        "fuente_pdf": doc["url"],
        "sha256": sha256_de(pdf_path),
        "convertido": time.strftime("%Y-%m-%d"),
    }
    cuerpo = "\n".join(lineas_md).strip()
    encabezado = f"# {doc['titulo']}\n"
    if meta_cab["titulo_pdf"] and meta_cab["titulo_pdf"].upper() not in cuerpo.upper():
        encabezado += f"\n_{meta_cab['titulo_pdf']}_\n"
    (md_dir / f"{doc['id']}.md").write_text(
        front_matter(meta) + "\n" + encabezado + "\n" + cuerpo + "\n", encoding="utf-8")

    return {"id": doc["id"], "md": f"md/{doc['id']}.md", "tablas": n_tablas,
            "imgs": imgs, "titulo": doc["titulo"], "edicion": meta["edicion"],
            "revision": meta["revision"], "paginas": meta["paginas"],
            "sha256": meta["sha256"], "fuente_pdf": doc["url"]}


# ------------------------------------------------------------------- principal
def convertir_todo(out: Path, solo: str | None = None, debug: bool = False,
                   con_figuras: bool = True, html_texto: str | None = None) -> dict:
    dirs = {n: out / n for n in ("pdf", "md", "tablas", "imgs")}
    for d in dirs.values():
        d.mkdir(parents=True, exist_ok=True)

    docs = agregar_extras(parsear_indice(html_texto if html_texto is not None else bajar_indice(debug)))
    if solo:
        docs = [d for d in docs if d["id"].lower() == solo.lower()]
        if not docs:
            raise SystemExit(f"No existe el documento {solo!r} en el índice")
    limpiar_salidas_previas(docs, dirs["md"], dirs["tablas"], dirs["imgs"])

    resultados = []
    for doc in docs:
        pdf_path = descargar(doc["url"], dirs["pdf"] / f"{doc['id']}.pdf", debug)
        resultados.append(convertir_documento(pdf_path, doc, dirs, debug, con_figuras))

    indice = {
        "fuente": INDICE_URL,
        "convertido": time.strftime("%Y-%m-%d"),
        "documentos": resultados,
        "total_documentos": len(resultados),
        "total_paginas": sum(r["paginas"] for r in resultados),
        "total_tablas": sum(r["tablas"] for r in resultados),
        "total_imgs": sum(len(r["imgs"]) for r in resultados),
    }
    (out / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, indent=2) + "\n",
                                     encoding="utf-8")
    return indice


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent),
                    help="carpeta de salida (por defecto, la del script)")
    ap.add_argument("--solo", help="convertir un único documento por su id (p. ej. BT-19)")
    ap.add_argument("--no-figuras", action="store_true", help="no extraer figuras")
    ap.add_argument("--debug", action="store_true", help="trazas de descarga y bandas")
    args = ap.parse_args()

    indice = convertir_todo(Path(args.out), args.solo, args.debug, not args.no_figuras)
    print(f"Hecho: {indice['total_documentos']} documentos, {indice['total_paginas']} páginas, "
          f"{indice['total_tablas']} tablas, {indice['total_imgs']} imágenes")
    print("Revisa indice.json y comprueba a mano las tablas críticas contra el PDF original.")


if __name__ == "__main__":
    main()
