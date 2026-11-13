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
| 6 | 2026-11-13 | Mi cliente en linea (test6, Lorencia 145,108) con el panel de rendimiento, ANTES de partir el suelo | 12-13 | 94 | 144.5k | 184 MB | base para la 7 | fps +3.5 frente a la inicial (escena distinta de la 1) |
| 7 | 2026-11-13 | Igual que la 6, con el suelo partido en cuadros de 32x32 casillas | 14 | 96 | 23.6k | 212 MB | triangulos -84 % (144.5k a 23.6k), fotograma 79 a 71.5 ms (-10 %), llamadas +2; memoria dentro del ruido (184-231) | fps 8.8 a 14 (+59 %) |
| 8 | 2026-11-13 | Igual que la 7, con el perfil de celular v4 (sin briznas de pasto, como Magdalena) | 19 | 91 | 23.7k | 198 MB | fps 14 a 19 (+36 %), fotograma 71.5 a 56.5 ms (-21 %) | fps 8.8 a 19 (+116 %); memoria igual (193 a 198) |

Pruebas sueltas sobre la 8 (sin cambiar el codigo): sin nubes 20.4 fps, sin efectos de suelo 18.2, sin particulas ni clima 22.5, base 19.9: todas dentro del ruido (unos 2 fps), asi que ninguna de esas opciones es la palanca.
Comparacion con Magdalena en la misma maquina: 22 fps en su mundo (medicion inicial); mi cliente esta ahora en 19-20, cerca de igualarlo, partiendo de 8.8.

Lectura: fila 8: el pasto en briznas costaba un cuarto del fotograma y Magdalena no lo tiene; el perfil de celular lo apaga (Opciones lo devuelve). Que cuesta ahora (apagando partes en la fila 7): el suelo unos 19 ms, los objetos del mapa unos 15 ms sin el pasto, los personajes poco. El primer cambio de rendimiento es la fila 7: el suelo era una sola malla de 131 072 triangulos dibujada entera en cada fotograma; ahora se dibujan solo los cuadros que ve la camara, con el mismo aspecto. Antes de eso los cambios publicados hasta ahora (anillo, ventanas, menu, lista de servidores) no tocan el dibujo del mundo.
La unica medicion directamente comparable entre Magdalena y mi cliente en el mismo escenario es la 3 contra la 3b: mi cliente hace menos llamadas (25 contra 44), mas triangulos (24.9k contra 8.6k) y menos fotogramas (40 contra 57).
La fila 4 repite la 1: los fotogramas no cambiaron (no se toco el dibujo) y la memoria JS subio 38 MB; la fila 5 muestra que fue un pico: la memoria sigue en torno a 195-200 MB.
De donde sale (muestreo de la fila 5): 138 MB son de Babylon: datos de los modelos que el cargador glTF guarda en la CPU (22 MB), copias de vertices para calcular cajas de colision de mallas con huesos (7 MB, `refreshBoundingInfo`), huesos y geometria clonada por cada personaje (unos 10 MB). Pistas para bajarla sin cambiar el aspecto: no clonar la geometria por personaje (compartirla) y no recalcular cajas con huesos cada vez.

## Memoria real del proceso (2026-11-13)
La columna "Memoria JS" no compara bien: Magdalena es C++ compilado a WebAssembly y guarda casi todo en la memoria de WebAssembly, que no cuenta como memoria JS (por eso marcaba 19 MB). Medida la memoria real de la pestana (proceso renderer) y de la GPU, en el mundo, misma maquina:

| | Pestana | GPU | Descarga inicial | fps en esa corrida |
|---|---|---|---|---|
| Mi cliente (fila 8, servidor local) | 786 MB | 264 MB | 4.6 MB | 16.7 |
| Magdalena (Lorencia con multitud) | 1495 MB | 256 MB | 564 MB | 31.6 |

Mi cliente usa la mitad de memoria que Magdalena y descarga 120 veces menos. La meta de memoria queda cumplida; el trabajo pendiente es de fotogramas.
Sobre los fotogramas: entre corridas de mi cliente hay mucho ruido (14 a 20 fps en la misma escena), y Magdalena dio 22 en la primera medicion y 31.6 en esta. El suelo cuesta unos 20 ms por fotograma, de ellos unos 15 de su sombreado (con un material plano sube de 17.6 a 24.2 fps); en calidad 0 ya salta las nubes y las luces por pixel, asi que lo que queda es su trabajo base (dos capas de textura, grano y luz horneada).
