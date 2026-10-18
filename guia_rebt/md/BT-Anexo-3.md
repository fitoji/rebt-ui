---
guia: BT-Anexo-3
titulo: Cálculo de corrientes de cortocircuito
edicion: sep 03
revision: 1
paginas: 1
fuente_pdf: "https://industria.gob.es/Calidad-Industrial/seguridadindustrial/instalacionesindustriales/baja-tension/Documents/bt/guia_bt_anexo_3_sep03R1.pdf"
sha256: 9607cad276e569bccafa88fc2842bf03bc58a88ff4ba9dbc4e24cd1f94d9816e
convertido: 2026-10-18
---

# Cálculo de corrientes de cortocircuito

### DE CIENCIA Y

Edición: sep 03 TECNOLOGÍA CÁLCULO DE CORRIENTES DE CORTOCIRCUITO Revisión: 1

CÁLCULO DE CORRIENTES DE CORTOCIRCUITO.

Como generalmente se desconoce la impedancia del circuito de alimentación a la red (impedancia del transformador, red de distribución y acometida) se admite que en caso de cortocircuito la tensión en el inicio de las instalaciones de los usuarios se puede considerar como 0,8 veces la tensión de suministro. Se toma el defecto fase tierra como el más desfavorable, y además se supone despreciable la inductancia de los cables. Esta consideración es válida cuando el Centro de Transformación, origen de la alimentación, está situado fuera del edificio o lugar del suministro afectado, en cuyo caso habría que considerar todas las impedancias.

Por lo tanto se puede emplear la siguiente fórmula simplificada 0,8 U I = CC R Donde: Icc intensidad de cortocircuito máxima en el punto considerado U tensión de alimentación fase neutro (230 V) R resistencia del conductor de fase entre el punto considerado y la alimentación. Normalmente el valor de R deberá tener en cuenta la suma de las resistencias de los conductores entre la Caja General de Protección y el punto considerado en el que se desea calcular el cortocircuito, por ejemplo el punto donde se emplaza el cuadro con los dispositivos generales de mando y protección. Para el cálculo de R se considerará que los conductores se encuentran a una temperatura de 20ºC, para obtener así el valor máximo posible de Icc. Ejemplo: Se desea calcular la intensidad de cortocircuito en el cuadro general de una vivienda con grado de electrificación básico. Dicha vivienda está alimentada por una Derivación Individual (DI) de 10mm2 de cobre y de longitud de 15 metros. Además se conoce que la Línea General de Alimentación (LGA) tiene una sección de 95 mm2, y una longitud entre la CGP y la Centralización de Contadores de 25 metros. Se comienza por el cálculo de la resistencia de fase de la LGA y de la DI . R = ρ L / S = 0,018 Ω mm2/m . (15 . 2 m / 10 mm2)= 0,054 Ω (DI) (DI) (DI) R = ρ L /S = 0,018 Ω mm2/m . (25 . 2 m / 95 mm2)= 0,0095 Ω

### (LGA) (LGA) (LGA)

R = R + R = 0,0635 Ω (DI) (LGA) Nota: la resistividad del cobre a 20 ºC se puede tomar como ρ ≈0,018 Ω mm2/m. En caso de conductores de aluminio se puede tomar también para 20ºC, ρ ≈0,029 Ω mm2/m. Icc = 0,8 U / R = 0,8 (230/0,0635) = 2898 Amperios.

- 1 -
