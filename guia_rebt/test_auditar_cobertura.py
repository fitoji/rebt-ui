#!/usr/bin/env python3
"""Tests para auditar_cobertura.py — stdlib unittest, sin PDFs."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import auditar_cobertura as ac


class TestPalabras(unittest.TestCase):
    def test_normaliza_acentos_y_mayusculas(self):
        c = ac.palabras("Instalación ELÉCTRICA")
        self.assertIn("instalacion", c)
        self.assertIn("electrica", c)

    def test_ignora_palabras_de_dos_letras(self):
        self.assertNotIn("de", ac.palabras("de la red"))


class TestFaltantes(unittest.TestCase):
    def test_detecta_lo_que_no_esta(self):
        faltan, perdidas, total = ac.faltantes("impedancia red sobrante", "impedancia red")
        self.assertEqual(set(faltan), {"sobrante"})
        self.assertEqual((perdidas, total), (1, 3))


class TestClasificar(unittest.TestCase):
    def test_cabecera_reconocida(self):
        cab, art, reales = ac.clasificar({"ministerio": 3, "guia-bt-19": 2}, "texto")
        self.assertEqual(len(cab), 2)
        self.assertEqual((art, reales), ({}, {}))

    def test_fragmento_de_una_palabra_del_corpus(self):
        # pdftotext parte "instalaciones" por el interletrado
        cab, art, reales = ac.clasificar({"stalac": 8}, "las instalaciones eléctricas")
        self.assertEqual(list(art), ["stalac"])
        self.assertEqual(reales, {})

    def test_glifo_duplicado_no_es_perdida(self):
        # pdftotext duplica glifos en las páginas con negrita falsa: "ddee" es "de"
        cab, art, reales = ac.clasificar({"ddee": 3}, "de la red instalaciones")
        self.assertEqual(list(art), ["ddee"])
        self.assertEqual(reales, {})

    def test_entreverado_no_lo_explica_ninguna_regla(self):
        # "mmeeto" sale de dos corridas de texto intercaladas: no es un duplicado
        # limpio y queda en la lista a revisar a mano (documentado en el README)
        cab, art, reales = ac.clasificar({"mmeeto": 1, "toddoolo": 1}, "de la red")
        self.assertEqual(sorted(reales), ["mmeeto", "toddoolo"])
        self.assertEqual(art, {})

    def test_linea_de_indice_no_es_perdida(self):
        cab, art, reales = ac.clasificar({"conductores......4": 1}, "conductores activos")
        self.assertEqual(list(art), ["conductores......4"])
        self.assertEqual(reales, {})

    def test_lo_que_no_se_explica_queda_marcado(self):
        cab, art, reales = ac.clasificar({"53,906": 2, "impedancia": 1}, "otras cosas")
        self.assertEqual(set(reales), {"53,906", "impedancia"})
        self.assertEqual((cab, art), ({}, {}))

    def test_palabra_legitima_con_mitad_repetida_no_es_glifo(self):
        # "adosados" = "ados"+"ados", y "ados" no es palabra: no es un glifo duplicado
        cab, art, reales = ac.clasificar({"adosados": 2}, "otras palabras")
        self.assertEqual(set(reales), {"adosados"})
        self.assertEqual(art, {})


class TestGlifosDoblados(unittest.TestCase):
    def test_detecta_el_caracter_dibujado_dos_veces(self):
        # en la página real están las dos formas: "ddee" y "de"
        self.assertEqual(ac.sospechosos_de_glifos_doblados("ddee de la red"), ["ddee"])

    def test_no_marca_palabras_legitimas(self):
        self.assertEqual(ac.sospechosos_de_glifos_doblados("adosados y conexiones"), [])

    def test_no_marca_numeros_de_tabla(self):
        self.assertEqual(ac.sospechosos_de_glifos_doblados("2200 y 3322 mm2"), [])


if __name__ == "__main__":
    unittest.main()
