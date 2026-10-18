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


def palabras(texto: str) -> collections.Counter:
    """Palabras normalizadas (sin acentos, minúsculas) de más de dos letras."""
    plano = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    return collections.Counter(w for w in re.findall(r"[a-z0-9][a-z0-9.,+-]*", plano) if len(w) > 2)


def faltantes(texto_pdf: str, texto_generado: str) -> tuple[dict[str, int], int, int]:
    """Palabras del PDF que no aparecen en lo generado y los totales de ocurrencias."""
    pdf = palabras(texto_pdf)
    generado = palabras(texto_generado)
    faltan = {w: c for w, c in pdf.items() if w not in generado}
    return faltan, sum(faltan.values()), sum(pdf.values())


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
    print(f"{ruta.name}: {total} palabras; faltan {perdidas} ({perdidas / max(1, total):.2%}) "
          f"en {len(faltan)} formas distintas")
    if args.listar:
        for palabra, veces in collections.Counter(faltan).most_common(args.listar):
            print(f"  {veces:4d}x  {palabra}")
    sys.exit(0)


if __name__ == "__main__":
    main()
