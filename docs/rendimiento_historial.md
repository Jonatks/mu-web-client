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

Lectura: no se ha cambiado todavia ningun codigo de rendimiento; los cambios publicados hasta ahora (anillo, ventanas, menu, lista de servidores) no tocan el dibujo del mundo.
La unica medicion directamente comparable entre Magdalena y mi cliente en el mismo escenario es la 3 contra la 3b: mi cliente hace menos llamadas (25 contra 44), mas triangulos (24.9k contra 8.6k) y menos fotogramas (40 contra 57).
Pendiente: medir en linea (mundo real) con el panel de rendimiento abierto, para repetir la fila 1 y saber si algo mejora de verdad.
