# Historial de rendimiento

Cada medicion nueva se compara con la anterior y con la inicial. Misma maquina (sin GPU, navegador por software), pantalla 915x412 de celular, muestras de 15 s.
Un "fotograma por segundo" aqui sirve para comparar entre filas, no para predecir un telefono real.

| # | Fecha | Que se midio | fps | Llamadas de dibujo | Triangulos | Memoria JS | Frente a la anterior | Frente a la inicial |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-12 | Mi cliente, mundo en linea (medicion inicial) | 8.8 | n/d | n/d | 193 MB | inicial | inicial |
| 1b | 2026-11-12 | Magdalena, mundo en linea (referencia) | 22 | n/d | n/d | 19 MB | n/a | n/a |
| 2 | 2026-11-12 | Mi cliente, Lorencia sin conexion, vacio | 52 | 16 | 23.8k | n/d | no comparable (otra escena) | no comparable |
| 3 | 2026-11-12 | Mi cliente, Lorencia sin conexion, 40 jugadores y 10 monstruos | 40 | 25 | 24.9k | n/d | igual de ligero que 2 (-12 fps por la multitud) | no comparable |
| 3b | 2026-11-12 | Magdalena, mundo con unos 50 jugadores (referencia) | 57 | 44 | 8.6k | n/d | n/a | n/a |
| 4 | 2026-11-12 | Mi cliente, mundo en linea, mismo metodo que la 1 (servidor local, cuenta test6) | 9.1 | n/d | n/d | 231 MB | frente a la 3: no comparable (otra escena) | fps +0.3 (8.8 a 9.1, dentro del ruido); memoria JS peor, +38 MB (193 a 231) |
| 5 | 2026-11-12 | Igual que la 4, repetida con muestreo de memoria | 10.1 | n/d | n/d | 199 MB | fps +1.0 frente a la 4; memoria -32 MB (la 4 fue un pico antes de la limpieza de memoria) | fps +1.3 (8.8 a 10.1, poco, sin cambios de dibujo); memoria +6 MB, igual |

Lectura: no se ha cambiado todavia ningun codigo de rendimiento; los cambios publicados hasta ahora (anillo, ventanas, menu, lista de servidores) no tocan el dibujo del mundo.
La unica medicion directamente comparable entre Magdalena y mi cliente en el mismo escenario es la 3 contra la 3b: mi cliente hace menos llamadas (25 contra 44), mas triangulos (24.9k contra 8.6k) y menos fotogramas (40 contra 57).
La fila 4 repite la 1: los fotogramas no cambiaron (no se toco el dibujo) y la memoria JS subio 38 MB; la fila 5 muestra que fue un pico: la memoria sigue en torno a 195-200 MB.
De donde sale (muestreo de la fila 5): 138 MB son de Babylon: datos de los modelos que el cargador glTF guarda en la CPU (22 MB), copias de vertices para calcular cajas de colision de mallas con huesos (7 MB, `refreshBoundingInfo`), huesos y geometria clonada por cada personaje (unos 10 MB). Pistas para bajarla sin cambiar el aspecto: no clonar la geometria por personaje (compartirla) y no recalcular cajas con huesos cada vez.
