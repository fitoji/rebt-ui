#!/usr/bin/env python3
"""Audita cuánto texto del PDF original llegó al Markdown generado.

Sirve para detectar pérdida de contenido sin leer los 37 documentos a mano: compara
las palabras del PDF (vía `pdftotext -layout`, de poppler) con las de `md/` y
`tablas/`. Lo que se espera que falte es la cabecera y el pie repetidos (que se
quitan a propósito) y las líneas del índice con puntos guía.

Uso:
    pdftotext -layout pdf/BT-19.pdf /tmp/BT-19.txt
    python auditar_cobertura.py /tmp/BT-19.txt --md md/BT-19.md --tablas tablas/BT-19_t01.csv
    python auditar_cobertura.py /tmp/BT-19.txt --md md/BT-19.md --tablas 'tablas/BT-19_t*.csv' --listar 30

Clasifica lo que falta, porque no todo es pérdida:
  - `cabecera`: palabras del encabezado o del pie repetidos, que se quitan a propósito.
  - `artefactos`: formas que sí están en el corpus pero que pdftotext deforma
    (palabras partidas, glifos duplicados limpios, líneas de índice con puntos).
  - `SIN EXPLICAR`: lo que hay que mirar. Incluye pérdida real **y** texto que
    pdftotext entrevera entre dos corridas (`mmeeto`, `toddoolo`), que no lo
    explica ninguna regla simple y se revisa a mano (ver README).

Códigos de salida: 0 siempre verde (la cobertura se juzga por los números y la lista).
"""
from __future__ import annotations

import argparse
import collections
import glob
import pathlib
import re
import sys
import unicodedata

# Palabras del encabezado/pie de las guías y de los números de página
CABECERA = {
    "guia", "guia-bt", "guia-bt-anexo", "ministerio", "industria", "turismo", "comercio",
    "ciencia", "tecnologia", "edicion", "revision", "aspectos", "generales", "aplicacion",
    "anexos", "pagina",
}


def palabras(texto: str) -> collections.Counter:
    """Palabras normalizadas (sin acentos, minúsculas) de más de dos letras."""
    plano = _plano(texto)
    return collections.Counter(w for w in re.findall(r"[a-z0-9][a-z0-9.,+-]*", plano) if len(w) > 2)


def _plano(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()


def _vocabulario(texto: str, sin_filtro_largo: bool = True) -> set[str]:
    """Palabras del texto. Sin filtro de largo incluye las de una o dos letras, que son
    necesarias para reconocer glifos duplicados ("ddee" es "de" dibujado dos veces)."""
    plano = _plano(texto)
    if sin_filtro_largo:
        return set(re.findall(r"[a-z0-9]+", plano))
    return {w for w in re.findall(r"[a-z0-9][a-z0-9.,+-]*", plano) if len(w) > 2}


def _desdoblado(forma: str) -> str | None:
    """'ddee' -> 'de'; None si la forma no es cada carácter repetido dos veces."""
    if len(forma) >= 4 and len(forma) % 2 == 0 and forma[0::2] == forma[1::2]:
        return forma[0::2]
    return None


def sospechosos_de_glifos_doblados(texto: str) -> list[str]:
    """Palabras del texto con todos sus caracteres duplicados y mitad conocida.

    Así se detecta `ddee` (mitad `de`, palabra del texto) sin marcar palabras
    legítimas como `adosados`, cuya mitad `ados` no es palabra.
    """
    vocabulario = _vocabulario(texto)
    sospechosos = []
    for palabra in re.findall(r"[a-z0-9]{4,}", _plano(texto)):
        if sum(c.isalpha() for c in palabra) < 2:
            continue  # "2200", "3322": números de tabla, no glifos duplicados
        mitad = _desdoblado(palabra)
        if mitad and mitad in vocabulario:
            sospechosos.append(palabra)
    return sospechosos


def faltantes(texto_pdf: str, texto_generado: str) -> tuple[dict[str, int], int, int]:
    """Palabras del PDF que no aparecen en lo generado y los totales de ocurrencias."""
    pdf = palabras(texto_pdf)
    generado = palabras(texto_generado)
    faltan = {w: c for w, c in pdf.items() if w not in generado}
    return faltan, sum(faltan.values()), sum(pdf.values())


def clasificar(faltan: dict[str, int], texto_generado: str) -> tuple[dict, dict, dict]:
    """Separa lo faltante en cabecera, artefactos de medición y sin explicar.

    Los artefactos son formas que sí están en el corpus pero que `pdftotext`
    deforma: palabras partidas por el interletrado (`stalac` dentro de
    `instalaciones`), glifos duplicados (`ddee` por `de`) y líneas del índice con
    puntos guía, que se reformatean a `- 2.2.2 Sección — 4`.
    """
    vocabulario = " ".join(palabras(texto_generado).keys())
    todas = _vocabulario(texto_generado)
    cabecera: dict[str, int] = {}
    artefactos: dict[str, int] = {}
    reales: dict[str, int] = {}
    for forma, veces in faltan.items():
        limpia = forma.strip(".,;:-+()")
        mitad = _desdoblado(limpia)
        if not limpia or limpia in CABECERA or limpia.startswith("guia-bt"):
            cabecera[forma] = veces
        elif re.search(r"\.{3,}\s*\d*\s*$", forma):
            artefactos[forma] = veces
        elif limpia in vocabulario or (mitad is not None and (mitad in todas or mitad in vocabulario)):
            artefactos[forma] = veces
        else:
            reales[forma] = veces
    return cabecera, artefactos, reales


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("texto_pdf", help="texto extraído del PDF (pdftotext -layout)")
    ap.add_argument("--md", required=True, help="Markdown generado")
    ap.add_argument("--tablas", action="append", default=[], help="CSV (acepta globs)")
    ap.add_argument("--listar", type=int, default=20, help="cuántas palabras faltantes listar")
    args = ap.parse_args()

    ruta = pathlib.Path(args.texto_pdf)
    generado = pathlib.Path(args.md).read_text(encoding="utf-8")
    for patron in args.tablas:
        for archivo in glob.glob(patron):
            generado += "\n" + pathlib.Path(archivo).read_text(encoding="utf-8")

    faltan, perdidas, total = faltantes(ruta.read_text(encoding="utf-8", errors="replace"), generado)
    cabecera, artefactos, reales = clasificar(faltan, generado)
    print(f"{ruta.name}: {total} palabras; faltan {perdidas} ({perdidas / max(1, total):.2%}) "
          f"en {len(faltan)} formas distintas → cabecera {len(cabecera)} | artefactos "
          f"{len(artefactos)} | SIN EXPLICAR {len(reales)}")
    if args.listar and reales:
        for palabra, veces in collections.Counter(reales).most_common(args.listar):
            print(f"  {veces:4d}x  {palabra}")
    sys.exit(0)


if __name__ == "__main__":
    main()
