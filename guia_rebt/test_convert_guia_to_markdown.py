#!/usr/bin/env python3
"""Tests para convert_guia_to_markdown.py — stdlib unittest, sin red ni PDFs.

Cubre las piezas puras del conversor: nombres de archivo, índice de la página
del ministerio, validación de descargas, limpieza de cabeceras/pies por
geometría, rejillas de tabla, encabezados, líneas de índice, orden de
contenido y reglas de figuras.
"""
import csv
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
import convert_guia_to_markdown as g


# --------------------------------------------------------------- nombres de archivo
class TestIdDeDocumento(unittest.TestCase):
    def test_archivos_reales_del_ministerio(self):
        esperado = {
            "guia_bt_introduccion.pdf": "00-Introduccion",
            "guia_bt_indice_jul19R8.pdf": "01-Indice-unidades-tematicas",
            "guia_bt_rd_842_02_sep03R1.pdf": "BT-RD-842-02",
            "guia_bt_03_sep03R1.pdf": "BT-03",
            "Guia_bt_40_sep13R1.pdf": "BT-40",
            "guia_bt_52_nov17R1.pdf": "BT-52",
            "ITC-BT-09_guia_E_jul_20_R2.pdf": "BT-09",
            "ITC-BT-17_guia_E_Sep_20_R2.pdf": "BT-17",
            "ITC-BT-33%20guia%20E%20ene%2024%20R2.pdf": "BT-33",
            "guia_bt_anexo_1_sep03R1.pdf": "BT-Anexo-1",
            "guia_bt_anexo_4_sep03R1.pdf": "BT-Anexo-4",
            "nota_interpretacion_separacion_galvanica.pdf": "ZZ-Nota-interpretacion-separacion-galvanica",
        }
        for archivo, ident in esperado.items():
            self.assertEqual(g.doc_id_desde_archivo(archivo), ident, archivo)

    def test_ids_unicos_para_los_37_archivos(self):
        archivos = [
            "Guia_bt_40_sep13R1.pdf", "ITC-BT-09_guia_E_jul_20_R2.pdf",
            "ITC-BT-17_guia_E_Sep_20_R2.pdf", "ITC-BT-33%20guia%20E%20ene%2024%20R2.pdf",
            "guia_bt_03_sep03R1.pdf", "guia_bt_04_sep03R1.pdf", "guia_bt_05_sep03R1.pdf",
            "guia_bt_08_oct05R1.pdf", "guia_bt_10_sep03R1.pdf", "guia_bt_12_sep03R1.pdf",
            "guia_bt_13_sep03R1.pdf", "guia_bt_14_sep03R1.pdf", "guia_bt_15_sep03R1.pdf",
            "guia_bt_16_sep03R1.pdf", "guia_bt_18_oct05R1.pdf", "guia_bt_19_feb09R2.pdf",
            "guia_bt_20_sep03R1.pdf", "guia_bt_21_sep03R1.pdf", "guia_bt_22_oct05R1.pdf",
            "guia_bt_23_nov19R4.pdf", "guia_bt_24_jun19R2.pdf", "guia_bt_25_jul12R2.pdf",
            "guia_bt_26_sep03R1.pdf", "guia_bt_27_sep03R1.pdf", "guia_bt_28_mar15R3.pdf",
            "guia_bt_29_nov19R4.pdf", "guia_bt_30_feb09R1.pdf", "guia_bt_49_sep03R1.pdf",
            "guia_bt_52_nov17R1.pdf", "guia_bt_anexo_1_sep03R1.pdf",
            "guia_bt_anexo_2_sep03R1.pdf", "guia_bt_anexo_3_sep03R1.pdf",
            "guia_bt_anexo_4_sep03R1.pdf", "guia_bt_indice_jul19R8.pdf",
            "guia_bt_introduccion.pdf", "guia_bt_rd_842_02_sep03R1.pdf",
            "nota_interpretacion_separacion_galvanica.pdf",
        ]
        ids = [g.doc_id_desde_archivo(a) for a in archivos]
        self.assertEqual(len(archivos), 37)
        self.assertEqual(len(set(ids)), 37)
        self.assertTrue(all(i for i in ids))


class TestLimpiarTitulo(unittest.TestCase):
    def test_quita_marcadores_de_pdf_y_tamano(self):
        self.assertEqual(
            g.limpiar_titulo(
                "BT-19. Instalaciones interiores o receptoras. Prescripciones generales [pdf] [291,29 KB]"
            ),
            "BT-19. Instalaciones interiores o receptoras. Prescripciones generales",
        )

    def test_titulo_sin_marcadores_queda_igual(self):
        self.assertEqual(g.limpiar_titulo("Introducción [pdf] [61,47 KB]"), "Introducción")

    def test_marcador_pdf_en_mayusculas(self):
        self.assertEqual(
            g.limpiar_titulo("Nota de Interpretación Técnica [PDF] [38,78 KB]"),
            "Nota de Interpretación Técnica",
        )


# ------------------------------------------------------------------------ índice
HTML_INDICE = """
<div><ul>
  <li><a href="/Calidad-Industrial/.../bt/guia_bt_introduccion.pdf">Introducción [pdf] [61,47 KB]</a></li>
  <li><a href="/Calidad-Industrial/.../bt/guia_bt_introduccion.pdf">Introducción [pdf] [61,47 KB]</a></li>
  <li><a href="/Calidad-Industrial/.../bt/guia_bt_19_feb09R2.pdf">BT-19. Instalaciones interiores o
      receptoras. Prescripciones generales [pdf] [291,29 KB]</a></li>
  <li><a href="/otra/cosa/imagen.png">una imagen</a></li>
  <li><a href="notas/nota_interpretacion_separacion_galvanica.pdf">Nota de Interpretación [pdf] [38,78 KB]</a></li>
</ul></div>
"""


class TestParsearIndice(unittest.TestCase):
    def setUp(self):
        self.docs = g.parsear_indice(HTML_INDICE, base="https://industria.gob.es/Calidad-Industrial/x/")

    def test_solo_pdfs_y_sin_duplicados(self):
        self.assertEqual(len(self.docs), 3)
        self.assertEqual([d["archivo"] for d in self.docs],
                         ["guia_bt_introduccion.pdf", "guia_bt_19_feb09R2.pdf",
                          "nota_interpretacion_separacion_galvanica.pdf"])

    def test_conserva_orden_de_la_pagina(self):
        self.assertEqual(self.docs[0]["id"], "00-Introduccion")
        self.assertEqual(self.docs[1]["id"], "BT-19")

    def test_titulo_y_url_absoluta(self):
        self.assertEqual(self.docs[1]["titulo"],
                         "BT-19. Instalaciones interiores o receptoras. Prescripciones generales")
        self.assertTrue(self.docs[1]["url"].startswith("https://industria.gob.es/"), self.docs[1]["url"])
        self.assertTrue(self.docs[1]["url"].endswith("guia_bt_19_feb09R2.pdf"))

    def test_sin_pdfs_devuelve_lista_vacia(self):
        self.assertEqual(g.parsear_indice("<html><body>nada</body></html>"), [])


# -------------------------------------------------------------------- descargas
class TestValidacionPdf(unittest.TestCase):
    def test_pdf_completo_es_valido(self):
        self.assertTrue(g.es_pdf_valido(b"%PDF-1.6\n...contenido...\n%%EOF\n"))

    def test_pagina_de_error_no_es_valida(self):
        self.assertFalse(g.es_pdf_valido(b"Bad Gateway"))
        self.assertFalse(g.es_pdf_valido(b"<html>error</html>"))

    def test_pdf_truncado_no_es_valido(self):
        self.assertFalse(g.es_pdf_valido(b"%PDF-1.6\n" + b"x" * 5000))

    def test_vacio_no_es_valido(self):
        self.assertFalse(g.es_pdf_valido(b""))


class TestCache(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.destino = Path(self.tmp.name) / "doc.pdf"
        self.valido = b"%PDF-1.6\ncontenido\n%%EOF\n"

    def test_descarga_y_escribe(self):
        with mock.patch.object(g.urllib.request, "urlopen") as u:
            u.return_value.__enter__.return_value.read.return_value = self.valido
            g.descargar("http://x/doc.pdf", self.destino)
        self.assertEqual(self.destino.read_bytes(), self.valido)

    def test_cache_valida_no_sale_a_red(self):
        self.destino.write_bytes(self.valido)
        with mock.patch.object(g.urllib.request, "urlopen",
                               side_effect=AssertionError("no debe salir a red")):
            g.descargar("http://x/doc.pdf", self.destino)

    def test_cache_corrupta_se_reemplaza(self):
        self.destino.write_bytes(b"<html>error</html>")
        with mock.patch.object(g.urllib.request, "urlopen") as u:
            u.return_value.__enter__.return_value.read.return_value = self.valido
            g.descargar("http://x/doc.pdf", self.destino)
        self.assertEqual(self.destino.read_bytes(), self.valido)

    def test_respuesta_invalida_no_se_guarda(self):
        with mock.patch.object(g.urllib.request, "urlopen") as u:
            u.return_value.__enter__.return_value.read.return_value = b"Bad Gateway"
            with self.assertRaises(SystemExit):
                g.descargar("http://x/doc.pdf", self.destino, reintentos=1)
        self.assertFalse(self.destino.exists())


# ------------------------------------------------------- cabeceras y pies
def palabra(text, top, bottom):
    return {"text": text, "top": top, "bottom": bottom,
            "x0": 50.0, "x1": 50.0 + 7 * len(text)}


ALTO = 800.0


def paginas_con_cabecera(n=4, extra_superior=None, con_pie=True):
    """Simula n páginas con la cabecera real de las guías y un cuerpo abajo."""
    paginas = []
    for i in range(n):
        palabras = [
            palabra("MINISTERIO", 30, 42),
            palabra("GUÍA", 30, 42), palabra("TÉCNICA", 34, 46), palabra("DE", 34, 46),
            palabra("APLICACIÓN:", 34, 46),
            palabra("GUÍA-BT-19", 30, 42),
            palabra("Edición:", 52, 64), palabra("feb", 52, 64), palabra("09", 52, 64),
            palabra("Revisión:", 68, 80), palabra("2", 68, 80),
            palabra(f"linea de cuerpo {i}", 300, 312),
        ]
        if extra_superior:
            palabras.append(palabra(extra_superior, 100, 112))
        if con_pie:
            palabras.append(palabra(str(i + 1), 760, 772))
        paginas.append(palabras)
    return paginas


class TestBandas(unittest.TestCase):
    def test_corta_cabecera_y_pie_repetidos(self):
        corte_sup, corte_inf = g.detectar_bandas(paginas_con_cabecera(), ALTO)
        self.assertGreaterEqual(corte_sup, 80)
        self.assertLess(corte_sup, 300)
        self.assertGreater(corte_inf, 0)
        self.assertLessEqual(corte_inf, 60)

    def test_texto_no_repetido_de_la_cabecera_no_se_corta(self):
        paginas = paginas_con_cabecera()
        paginas[1][-1] = palabra("2", 760, 772)
        paginas[0].append(palabra("SÓLO EN LA PÁGINA 1", 140, 152))
        corte_sup, _ = g.detectar_bandas(paginas, ALTO)
        self.assertLessEqual(corte_sup, 140)

    def test_una_sola_pagina_no_corta_nada_mas_alla_de_la_zona_superior(self):
        corte_sup, corte_inf = g.detectar_bandas(paginas_con_cabecera(n=1), ALTO)
        self.assertLessEqual(corte_sup, ALTO * g.FRACCION_SUPERIOR)
        self.assertLessEqual(corte_inf, ALTO * g.FRACCION_INFERIOR)

    def test_sin_pie_no_corta_de_abajo(self):
        _, corte_inf = g.detectar_bandas(paginas_con_cabecera(con_pie=False), ALTO)
        self.assertEqual(corte_inf, 0)


class TestMetadatosCabecera(unittest.TestCase):
    LINEAS = ["MINISTERIO", "DE INDUSTRIA,", "TURISMO Y", "COMERCIO",
              "GUÍA TÉCNICA DE APLICACIÓN:", "GUÍA-BT-19",
              "INSTALACIONES INTERIORES", "INSTALACIONES INTERIORES O RECEPTORAS.",
              "PRESCRIPCIONES GENERALES", "Edición: feb 09", "Revisión: 2"]

    def test_extrae_edicion_revision_y_codigo(self):
        meta = g.metadatos_cabecera(self.LINEAS)
        self.assertEqual(meta["edicion"], "feb 09")
        self.assertEqual(meta["revision"], "2")

    def test_titulo_pdf_es_la_linea_larga_no_etiqueta(self):
        meta = g.metadatos_cabecera(self.LINEAS)
        self.assertEqual(meta["titulo_pdf"], "INSTALACIONES INTERIORES O RECEPTORAS.")

    def test_cabecera_sin_edicion_no_inventa_datos(self):
        meta = g.metadatos_cabecera(["GUÍA TÉCNICA DE APLICACIÓN:", "GUÍA-BT-49", "MUEBLES"])
        self.assertEqual(meta["edicion"], "")
        self.assertEqual(meta["revision"], "")


# ---------------------------------------------------------------------- tablas
class TestRejilla(unittest.TestCase):
    def test_limpiar_normaliza_none_y_espacios(self):
        filas = [["  A  ", None], ["x\ny", ""], ["", ""]]
        self.assertEqual(g.limpiar_rejilla(filas), [["A"], ["x y"]])

    def test_limpiar_quita_columnas_finales_vacias(self):
        filas = [["A", "", ""], ["1", "2", ""]]
        self.assertEqual(g.limpiar_rejilla(filas), [["A", ""], ["1", "2"]])

    def test_csv_con_escapado(self):
        texto = g.rejilla_a_csv([["a|b", 'c"d'], ["1", "2"]])
        self.assertEqual(texto, 'a|b,"c""d"\r\n1,2\r\n')

    def test_markdown_escapa_pipes_y_saltos(self):
        md = g.rejilla_a_markdown([["a|b", "c"], ["1", "2"]])
        self.assertEqual(md, "| a\\|b | c |\n|---|---|\n| 1 | 2 |")

    def test_markdown_de_rejilla_vacia_es_vacio(self):
        self.assertEqual(g.rejilla_a_markdown([]), "")


class TestExtraerRejillas(unittest.TestCase):
    def test_toma_tabla_sin_cabecera_repetida_y_descarta_vacias(self):
        tabla = {"bbox": (0, 100, 500, 200),
                 "filas": [["Sección", "Intensidad"], ["1,5", "11"], ["", ""]]}
        rejillas = g.rejillas_de_pagina([tabla])
        self.assertEqual(len(rejillas), 1)
        self.assertEqual(rejillas[0]["filas"], [["Sección", "Intensidad"], ["1,5", "11"]])

    def test_descarta_tabla_de_cabecera_de_pagina(self):
        # la cabecera de la guía es la primera tabla de la página: no es contenido
        tabla = {"bbox": (0, 20, 500, 90), "filas": [["MINISTERIO", "GUÍA-BT-19"]]}
        self.assertEqual(g.rejillas_de_pagina([tabla], corte_sup=95), [])


# ------------------------------------------------------------------ encabezados
class TestEncabezados(unittest.TestCase):
    def test_apartado_numerado_corto(self):
        self.assertEqual(g.nivel_encabezado_numerado("1. PROTECCIÓN DE LAS INSTALACIONES"), 3)
        self.assertEqual(g.nivel_encabezado_numerado("2.2.2 Sección de los conductores"), 5)

    def test_enumeracion_del_cuerpo_no_es_encabezado(self):
        self.assertEqual(g.nivel_encabezado_numerado(
            "1. Todo circuito estará protegido contra los efectos de las sobreintensidades."), 0)

    def test_linea_en_mayusculas_es_encabezado(self):
        self.assertEqual(
            g.nivel_encabezado_mayusculas("INTENSIDADES MÁXIMAS ADMISIBLES SEGÚN LA NORMA UNE 20460-5-523"), 3)

    def test_siglas_cortas_no_son_encabezado(self):
        for txt in ("PVC", "XLPE", "GUÍA-BT-19", "MINISTERIO", "A1"):
            self.assertEqual(g.nivel_encabezado_mayusculas(txt), 0, txt)

    def test_linea_normal_no_es_encabezado(self):
        self.assertEqual(g.nivel_encabezado_mayusculas("Las intensidades admisibles se regirán por"), 0)


class TestLineaIndice(unittest.TestCase):
    def test_linea_con_puntos_y_pagina(self):
        self.assertEqual(g.limpiar_linea_indice("0. ÍNDICE............................................1"),
                         "- 0. ÍNDICE — 1")
        self.assertEqual(
            g.limpiar_linea_indice("2.2.2 Sección de los conductores. Caídas de tensión...........4"),
            "- 2.2.2 Sección de los conductores. Caídas de tensión — 4")

    def test_linea_normal_se_devuelve_tal_cual(self):
        self.assertEqual(g.limpiar_linea_indice("Todo circuito estará protegido"), "Todo circuito estará protegido")


# -------------------------------------------------------------------- párrafos
class TestAgruparParrafos(unittest.TestCase):
    @staticmethod
    def linea(texto, top, bottom):
        return {"text": texto, "top": top, "bottom": bottom}

    def test_hueco_pequeno_une_en_un_parrafo(self):
        lineas = [self.linea("Todo circuito estará protegido contra", 100, 112),
                  self.linea("los efectos de las sobreintensidades.", 114, 126)]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual(len(parrafos), 1)
        self.assertEqual(parrafos[0]["texto"],
                         "Todo circuito estará protegido contra los efectos de las sobreintensidades.")

    def test_hueco_mayor_que_135_veces_el_alto_corta_parrafo(self):
        # alto de línea 12 → 1.35 * 12 = 16.2; un hueco de 18 abre párrafo nuevo
        lineas = [self.linea("Fin del primer párrafo.", 100, 112),
                  self.linea("Comienzo del segundo párrafo.", 130, 142)]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual([p["texto"] for p in parrafos],
                         ["Fin del primer párrafo.", "Comienzo del segundo párrafo."])

    def test_palabra_partida_con_guion_se_recompone(self):
        lineas = [self.linea("la instala-", 100, 112),
                  self.linea("ción queda empotrada.", 114, 126)]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual(len(parrafos), 1)
        self.assertEqual(parrafos[0]["texto"], "la instalación queda empotrada.")

    def test_linea_de_indice_no_se_funde_con_la_siguiente(self):
        indice = "1. CAMPO DE APLICACIÓN......2"
        lineas = [self.linea(indice, 100, 112),
                  self.linea("Esta guía se aplica a las instalaciones.", 114, 126)]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual([p["texto"] for p in parrafos],
                         [indice, "Esta guía se aplica a las instalaciones."])

    def test_corte_por_indice_no_depende_de_ser_encabezado(self):
        # sin numerar y con minúsculas no es encabezado: solo corta la regla del índice
        indice = "Anexo III. Tabla de dimensionamiento......27"
        lineas = [self.linea("Texto del párrafo anterior.", 100, 112),
                  self.linea(indice, 114, 126),
                  self.linea("Texto que sigue al índice.", 116, 128)]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual([p["texto"] for p in parrafos],
                         ["Texto del párrafo anterior.", indice, "Texto que sigue al índice."])


# ----------------------------------------------------------------- orden y figuras
class TestCombinarContenido(unittest.TestCase):
    def test_orden_por_posicion_y_lineas_dentro_de_tabla_descartadas(self):
        lineas = [{"text": "antes", "top": 50, "bottom": 62},
                  {"text": "dentro", "top": 120, "bottom": 132},
                  {"text": "después", "top": 300, "bottom": 312}]
        tablas = [{"bbox": (0, 100, 500, 200), "filas": [["A", "B"]]}]
        items = g.combinar_contenido(lineas, tablas)
        self.assertEqual([i["tipo"] for i in items], ["texto", "tabla", "texto"])
        self.assertEqual([i.get("texto") or i.get("filas") for i in items],
                         ["antes", [["A", "B"]], "después"])


# --------------------------------------------------------------- md de página
class TestMdDePagina(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.tab_dir = Path(self.tmp.name)

    @staticmethod
    def items_con_tabla(filas, top_tabla=100):
        return [
            {"tipo": "texto", "top": 40, "bottom": 52, "texto": "Texto previo a la tabla."},
            {"tipo": "tabla", "top": top_tabla, "filas": filas,
             "bbox": (0, top_tabla, 500, top_tabla + 60)},
            {"tipo": "texto", "top": 300, "bottom": 312, "texto": "Texto posterior a la tabla."},
        ]

    def test_orden_csv_y_numeracion_corrida(self):
        filas = [["A", "B"], ["1", "2"]]
        salida, n = g.md_de_pagina(self.items_con_tabla(filas), "BT-19", self.tab_dir, 0)
        texto_md = "".join(salida)

        # orden de lectura: el texto previo queda antes de la marca de la tabla
        self.assertLess(texto_md.index("Texto previo a la tabla."),
                        texto_md.index("<!-- tabla: ../tablas/BT-19_t01.csv -->"))
        self.assertLess(texto_md.index("<!-- tabla: ../tablas/BT-19_t01.csv -->"),
                        texto_md.index("Texto posterior a la tabla."))

        # tabla Markdown real, no solo la marca
        self.assertIn("| A | B |", texto_md)
        self.assertIn("|---|---|", texto_md)
        self.assertIn("| 1 | 2 |", texto_md)

        # el CSV guarda las mismas filas
        with open(self.tab_dir / "BT-19_t01.csv", newline="", encoding="utf-8") as f:
            self.assertEqual(list(csv.reader(f)), filas)

        # la numeración sigue donde quedó en la llamada anterior
        self.assertEqual(n, 1)
        salida2, n2 = g.md_de_pagina(self.items_con_tabla([["C", "D"]], top_tabla=400),
                                     "BT-19", self.tab_dir, n)
        self.assertEqual(n2, 2)
        self.assertIn("<!-- tabla: ../tablas/BT-19_t02.csv -->", "".join(salida2))
        with open(self.tab_dir / "BT-19_t02.csv", newline="", encoding="utf-8") as f:
            self.assertEqual(list(csv.reader(f)), [["C", "D"]])


class TestFiguras(unittest.TestCase):
    def test_pagina_solo_figura(self):
        self.assertTrue(g.es_pagina_solo_figura("", 30))
        self.assertTrue(g.es_pagina_solo_figura("GRÁFICO", 30))
        self.assertFalse(g.es_pagina_solo_figura("x" * g.MAX_TEXTO_PAGINA_FIGURA, 40))
        self.assertFalse(g.es_pagina_solo_figura("poco texto", 3))

    def test_imagen_real_desde_200x150(self):
        self.assertTrue(g.es_imagen_real(200, 150))
        self.assertTrue(g.es_imagen_real(800, 600))
        self.assertFalse(g.es_imagen_real(199, 150))
        self.assertFalse(g.es_imagen_real(200, 149))

    def test_nombres_de_imagen(self):
        self.assertEqual(g.nombre_imagen("BT-19", 12, 1), "BT-19_p12_i01.png")
        self.assertEqual(g.nombre_imagen("BT-19", 12, None), "BT-19_p12_pagina.png")

    def test_marca_de_figura_vectorial_enlaza_al_pdf_local(self):
        marca = g.marca_figura_vectorial("BT-19", 12)
        self.assertIn("pdf/BT-19.pdf#page=12", marca)
        self.assertIn("pág", marca)


class TestFrontMatter(unittest.TestCase):
    def test_orden_fijo_de_claves_y_escapado(self):
        fm = g.front_matter({"guia": "BT-19", "titulo": "Con: dos puntos", "paginas": 26})
        self.assertTrue(fm.startswith("---\n"))
        self.assertTrue(fm.endswith("---\n"))
        self.assertIn('titulo: "Con: dos puntos"', fm)
        self.assertIn("guia: BT-19", fm)
        self.assertIn("paginas: 26", fm)
        self.assertLess(fm.index("guia:"), fm.index("titulo:"))


class TestLineasDeBanda(unittest.TestCase):
    """La cabecera real son tres columnas a la misma altura."""

    @staticmethod
    def ancho(text, top, x0):
        return {"text": text, "top": top, "bottom": top + 10, "x0": x0, "x1": x0 + 7 * len(text)}

    def palabras(self):
        return [
            self.ancho("MINISTERIO", 30, 35),
            self.ancho("GUÍA", 30, 150), self.ancho("TÉCNICA", 30, 190),
            self.ancho("DE", 30, 240), self.ancho("APLICACIÓN:", 30, 265),
            self.ancho("GUÍA-BT-19", 30, 470),
            self.ancho("DE", 45, 35), self.ancho("INDUSTRIA", 45, 60),
            self.ancho("INSTALACIONES", 45, 150), self.ancho("INTERIORES", 45, 250),
            self.ancho("Edición:", 45, 470), self.ancho("feb", 45, 520), self.ancho("09", 45, 545),
            self.ancho("TURISMO", 60, 35), self.ancho("Y", 60, 105),
            self.ancho("INSTALACIONES", 60, 150), self.ancho("INTERIORES", 60, 250),
            self.ancho("O", 60, 325), self.ancho("RECEPTORAS.", 60, 335),
            self.ancho("Revisión:", 60, 470), self.ancho("2", 60, 525),
            self.ancho("COMERCIO", 75, 35),
            self.ancho("PRESCRIPCIONES", 75, 150), self.ancho("GENERALES", 75, 280),
            self.ancho("cuerpo", 300, 60),
        ]

    def test_palabras_a_la_misma_altura_son_una_linea_con_columnas_separadas(self):
        lineas = g.lineas_de_banda(self.palabras(), max_top=100)
        self.assertEqual(lineas[0], "MINISTERIO · GUÍA TÉCNICA DE APLICACIÓN: · GUÍA-BT-19")
        self.assertEqual(len(lineas), 4)

    def test_no_toma_palabras_fuera_de_la_banda(self):
        self.assertNotIn("cuerpo", " ".join(g.lineas_de_banda(self.palabras(), max_top=100)))

    def test_edicion_completa_mes_y_anio(self):
        meta = g.metadatos_cabecera(g.lineas_de_banda(self.palabras(), max_top=100))
        self.assertEqual(meta["edicion"], "feb 09")
        self.assertEqual(meta["revision"], "2")

    def test_titulo_desde_la_columna_del_medio(self):
        meta = g.metadatos_cabecera(g.lineas_de_banda(self.palabras(), max_top=100))
        self.assertEqual(meta["titulo_pdf"], "INSTALACIONES INTERIORES O RECEPTORAS.")

    def test_etiqueta_pegada_al_titulo_corta_segmento(self):
        palabras = [self.ancho("INSTALACIONES", 45, 150), self.ancho("INTERIORES", 45, 250),
                    self.ancho("Revisión:", 45, 325), self.ancho("2", 45, 380)]
        lineas = g.lineas_de_banda(palabras, max_top=100)
        self.assertEqual(lineas, ["INSTALACIONES INTERIORES · Revisión: 2"])
        self.assertEqual(g.metadatos_cabecera(lineas)["titulo_pdf"], "INSTALACIONES INTERIORES")


class TestMetadatosCabeceraRuido(unittest.TestCase):
    def test_linea_de_indice_no_es_titulo(self):
        meta = g.metadatos_cabecera(["MINISTERIO", "ÍNDICE.....................................................1"])
        self.assertEqual(meta["titulo_pdf"], "")

    def test_numero_de_pagina_no_es_titulo(self):
        self.assertEqual(g.metadatos_cabecera(["12"])["titulo_pdf"], "")

    def test_frase_del_cuerpo_no_es_titulo(self):
        # la Introducción no tiene título en la cabecera: el texto de arriba es la primera frase
        frase = ("El 2 de Agosto de 2002 el Consejo de Ministros aprobó el Reglamento "
                 "Electrotécnico para Baja")
        self.assertEqual(g.metadatos_cabecera([frase])["titulo_pdf"], "")


class TestEncabezadoCortaParrafo(unittest.TestCase):
    def test_linea_encabezado_empieza_parrafo_propio(self):
        lineas = [
            {"text": "texto anterior del cuerpo", "top": 100, "bottom": 112},
            {"text": "2.2.3 Intensidades máximas admisibles", "top": 114, "bottom": 126},
            {"text": "Las intensidades máximas admisibles se regirán", "top": 128, "bottom": 140},
        ]
        parrafos = g.agrupar_parrafos(lineas)
        self.assertEqual([p["texto"] for p in parrafos],
                         ["texto anterior del cuerpo",
                          "2.2.3 Intensidades máximas admisibles",
                          "Las intensidades máximas admisibles se regirán"])


class TestGlifosSuperpuestos(unittest.TestCase):
    """La negrita falsa de estas guías dibuja cada carácter dos veces en el mismo punto."""

    @staticmethod
    def char(texto, x0, top):
        return {"object_type": "char", "text": texto, "x0": x0, "x1": x0 + 6, "top": top}

    def test_colapsa_el_caracter_dibujado_dos_veces(self):
        chars = [self.char("C", 105.6, 394.24), self.char("C", 105.6, 394.24),
                 self.char("T", 114.24, 394.24), self.char("T", 114.24, 394.24)]
        self.assertEqual([c["text"] for c in g.deduplicar_chars(chars)], ["C", "T"])

    def test_colapsa_trazos_que_difieren_en_centesimas(self):
        # medido en la pág. 6 de BT-19: los dos trazos difieren 0,001 pt
        chars = [self.char("C", 99.478, 161.213), self.char("C", 99.479, 161.213)]
        self.assertEqual(len(g.deduplicar_chars(chars)), 1)

    def test_no_toca_letras_repetidas_legitimas(self):
        chars = [self.char("c", 10.0, 50.0), self.char("c", 14.0, 50.0)]
        self.assertEqual(len(g.deduplicar_chars(chars)), 2)

    def test_no_toca_caracteres_en_distinta_altura(self):
        chars = [self.char("C", 105.6, 394.24), self.char("C", 105.6, 420.0)]
        self.assertEqual(len(g.deduplicar_chars(chars)), 2)


class TestTablaDeDatos(unittest.TestCase):
    """Estas guías enmarcan secciones y figuras: esos recuadros no son tablas."""

    def test_dos_columnas_y_dos_filas_es_tabla(self):
        self.assertTrue(g.es_tabla_de_datos([["Sección", "Intensidad"], ["1,5", "11"]]))

    def test_recuadro_de_seccion_de_una_columna_no_es_tabla(self):
        self.assertFalse(g.es_tabla_de_datos([["2. PRESCRIPCIONES DE CARÁCTER GENERAL"],
                                              ["2.1 Regla general"],
                                              ["La determinación de las características..."]]))

    def test_una_sola_fila_no_es_tabla(self):
        self.assertFalse(g.es_tabla_de_datos([["A", "B"]]))

    def test_rejilla_vacia_no_es_tabla(self):
        self.assertFalse(g.es_tabla_de_datos([]))

    def test_rejillas_de_pagina_descarta_el_recuadro(self):
        tablas = [{"bbox": (0, 300, 500, 500), "filas": [["2.2 Conductores activos"], [""],
                                                           ["2.2.1 Naturaleza de los conductores"]]}]
        self.assertEqual(g.rejillas_de_pagina(tablas), [])

    def test_el_texto_del_recuadro_sigue_siendo_texto(self):
        # si el recuadro no es tabla, sus líneas no se descartan al combinar
        lineas = [{"text": "2.2.1 Naturaleza de los conductores", "top": 350, "bottom": 362},
                  {"text": "Los conductores serán de cobre o aluminio.", "top": 364, "bottom": 376}]
        items = g.combinar_contenido(lineas, [])
        self.assertEqual([i["texto"] for i in items],
                         ["2.2.1 Naturaleza de los conductores",
                          "Los conductores serán de cobre o aluminio."])


class TestFalsoEncabezado(unittest.TestCase):
    def test_cuerpo_que_empieza_con_numero_y_minuscula_no_es_encabezado(self):
        self.assertEqual(g.nivel_encabezado_numerado(
            "6 mm2 debe realizarse mediante terminales engastados al conductor"), 0)


class TestLimpiarSalidas(unittest.TestCase):
    def test_borra_solo_lo_del_documento_a_regenerar(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            dirs = {n: base / n for n in ("md", "tablas", "imgs")}
            for d in dirs.values():
                d.mkdir()
            (dirs["md"] / "BT-19.md").write_text("viejo")
            (dirs["md"] / "BT-20.md").write_text("otro")
            (dirs["tablas"] / "BT-19_t01.csv").write_text("viejo")
            (dirs["imgs"] / "BT-19_p01_i01.png").write_bytes(b"x")
            (dirs["imgs"] / "BT-20_p01_i01.png").write_bytes(b"x")
            g.limpiar_salidas_previas([{"id": "BT-19"}], dirs["md"], dirs["tablas"], dirs["imgs"])
            self.assertFalse((dirs["md"] / "BT-19.md").exists())
            self.assertFalse((dirs["tablas"] / "BT-19_t01.csv").exists())
            self.assertFalse((dirs["imgs"] / "BT-19_p01_i01.png").exists())
            self.assertTrue((dirs["md"] / "BT-20.md").exists())
            self.assertTrue((dirs["imgs"] / "BT-20_p01_i01.png").exists())


class TestRegionFigura(unittest.TestCase):
    """El recorte de una figura no puede incluir cabecera ni pie, ni la página entera."""

    def test_figura_dentro_de_la_zona_util_queda_igual(self):
        self.assertEqual(g.region_figura((131, 101, 464, 325), 100.0, 42.7, 595.0, 842.0),
                         (131.0, 101.0, 464.0, 325.0))

    def test_figura_que_entra_en_la_cabecera_se_recorta(self):
        self.assertEqual(g.region_figura((100, 30, 400, 300), 100.0, 40.0, 595.0, 842.0),
                         (100.0, 100.0, 400.0, 300.0))

    def test_figura_del_pie_se_descarta(self):
        self.assertIsNone(g.region_figura((100, 800, 400, 840), 100.0, 40.0, 595.0, 842.0))

    def test_resto_diminuto_se_descarta(self):
        self.assertIsNone(g.region_figura((100, 200, 104, 203), 100.0, 40.0, 595.0, 842.0))

    def test_dos_figuras_de_la_misma_pagina_son_regiones_distintas(self):
        a = g.region_figura((131, 101, 464, 325), 100.0, 40.0, 595.0, 842.0)
        b = g.region_figura((100, 439, 496, 631), 100.0, 40.0, 595.0, 842.0)
        self.assertNotEqual(a, b)


class TestPaginaIlegible(unittest.TestCase):
    """Tablas que pdfplumber lee como caracteres sueltos: se muestran como imagen."""

    @staticmethod
    def lineas(n, texto):
        return [{"text": texto, "top": i * 10, "bottom": i * 10 + 8} for i in range(n)]

    def test_tabla_partida_en_cientos_de_lineas(self):
        self.assertTrue(g.es_pagina_ilegible(self.lineas(213, "0 ,5")))  # BT-Anexo-2 pág. 6

    def test_ochenta_lineas_cortas(self):
        self.assertTrue(g.es_pagina_ilegible(self.lineas(80, "21")))     # BT-21 pág. 16

    def test_densidad_baja_con_treinta_lineas(self):
        self.assertTrue(g.es_pagina_ilegible(self.lineas(30, "12")))

    def test_pagina_normal_no_es_ilegible(self):
        self.assertFalse(g.es_pagina_ilegible(self.lineas(42, "x" * 60)))

    def test_pagina_con_pocas_lineas_no_se_marca(self):
        self.assertFalse(g.es_pagina_ilegible(self.lineas(20, "12")))

    def test_pagina_sin_lineas_no_se_marca(self):
        self.assertFalse(g.es_pagina_ilegible([]))

    def test_nombre_y_marca_apuntan_a_la_pagina(self):
        self.assertEqual(g.nombre_pagina_ilegible("BT-Anexo-2", 6), "BT-Anexo-2_p06_tabla.png")
        marca = g.marca_pagina_ilegible(6, "BT-Anexo-2")
        self.assertIn("no se puede extraer como texto", marca)
        self.assertIn("pdf/BT-Anexo-2.pdf#page=6", marca)


class TestBandasUnaPagina(unittest.TestCase):
    """Con una sola página no hay repetición: la cabecera son las primeras filas etiquetadas."""

    PALABRAS = [
        palabra("MINISTERIO", 30, 42), palabra("DE", 30, 60), palabra("CIENCIA", 30, 90),
        palabra("GUÍA", 45, 57), palabra("TÉCNICA", 45, 70), palabra("APLICACIÓN:", 45, 115),
        palabra("GUÍA-BT-ANEXO", 60, 72), palabra("3", 60, 104),
        palabra("Edición:", 75, 87), palabra("sep", 75, 110),
        palabra("Revisión:", 90, 102), palabra("1", 90, 115),
        palabra("CÁLCULO", 105, 117), palabra("DE", 105, 140),
        palabra("impedancia", 300, 312), palabra("red", 300, 330),
    ]

    def test_no_se_come_un_tercio_del_cuerpo(self):
        corte_sup, _ = g.detectar_bandas([self.PALABRAS], ALTO)
        self.assertLess(corte_sup, 200)      # la regla de repetición cortaba 252 pt (30%)
        self.assertGreaterEqual(corte_sup, 40)  # y la cabecera igual se quita

    def test_el_cuerpo_queda_intacto(self):
        corte_sup, corte_inf = g.detectar_bandas([self.PALABRAS], ALTO)
        que_queda = [p["text"] for p in self.PALABRAS
                     if p["bottom"] > corte_sup + 1 and p["top"] < ALTO - corte_inf - 1]
        self.assertIn("impedancia", que_queda)
        self.assertIn("red", que_queda)
        self.assertNotIn("MINISTERIO", que_queda)


class TestExtras(unittest.TestCase):
    """Guías publicadas que la página ya no enlaza (BT-51)."""

    DOCS = [
        {"n": 1, "id": "00-Introduccion", "titulo": "Introducción", "archivo": "a.pdf", "url": "u"},
        {"n": 2, "id": "BT-24", "titulo": "BT-24", "archivo": "b.pdf", "url": "u"},
        {"n": 3, "id": "BT-52", "titulo": "BT-52", "archivo": "c.pdf", "url": "u"},
        {"n": 4, "id": "BT-Anexo-1", "titulo": "Anexo 1", "archivo": "d.pdf", "url": "u"},
        {"n": 5, "id": "ZZ-Nota", "titulo": "Nota", "archivo": "e.pdf", "url": "u"},
    ]

    def test_agrega_bt51_antes_de_los_anexos(self):
        docs = g.agregar_extras([dict(d) for d in self.DOCS])
        ids = [d["id"] for d in docs]
        self.assertEqual(ids.index("BT-51"), ids.index("BT-Anexo-1") - 1)
        self.assertEqual(ids.index("BT-51"), ids.index("BT-52") + 1)
        self.assertEqual([d["n"] for d in docs], list(range(1, len(docs) + 1)))

    def test_no_duplica_si_la_pagina_ya_la_enlaza(self):
        docs = [dict(d) for d in self.DOCS] + [
            {"n": 6, "id": "BT-51", "titulo": "BT-51", "archivo": "f.pdf", "url": "u"}]
        self.assertEqual(len(g.agregar_extras(docs)), len(self.DOCS) + 1)

    def test_el_extra_esta_documentado_con_titulo_y_url(self):
        docs = g.agregar_extras([])
        extra = next(d for d in docs if d["id"] == "BT-51")
        self.assertTrue(extra["url"].endswith("guia_bt_51_feb07R1.pdf"))
        self.assertIn("automatización", extra["titulo"].lower())
        self.assertEqual(extra["origen"], "extra")


if __name__ == "__main__":
    unittest.main()
