# Informe del trabajo: cliente igual a Mu Magdalena (2026-11-13)

Resumen del plan `plan_cliente_igual_a_magdalena.md`: que se cambio, que opciones hay, que quedo fijo en el cliente, que falta y que debe hacer el propietario.
Todo esta publicado en la rama `release` (la VM lo instala sola cada ~3 minutos). Detalle de cada estudio en `magdalena_study.md` y de cada medicion en `rendimiento_historial.md`.

## Donde esta el cliente
- Para jugar: https://mu-valhalla.vercel.app (redirige a https://155-181-133-84.sslip.io).
- Codigo: https://github.com/Jonatks/mu-web-client (`main` el codigo, `release` lo que se despliega).

## Cambios en el celular (en PC nada cambia salvo donde se dice)
Interfaz con el aspecto de Magdalena, dibujada aqui (SVG y CSS propios; no se copio arte de Magdalena):
- Joystick de bronce con colmillos de hueso, gemas y calavera; centro transparente.
- Botones redondos de bronce con calavera: Helper (engranaje con ojo), menu (huesos), libro de habilidades, ataque, chat.
- Barra inferior del tamano de Magdalena: esferas ovaladas de cristal, tallas con calavera, barras finas de AG y SD, casillas de bronce, franja a todo el ancho; queda detras de las ventanas.
- Nombre, nivel y zona arriba a la izquierda; pastilla "Hablar"; todos los paneles con marco de cuero y bronce, titulo centrado y X redonda.
- Ventanas estiradas como Magdalena (la interfaz 640x480 sobre toda la pantalla), pegadas arriba a la derecha y apiladas desde el borde.
- Helper tactil nuevo con pestanas Combate y Recoger.
- Seleccion y creacion de personaje compactas.
- Anillo naranja bajo el objetivo; nombres y barras de los monstruos debajo de las ventanas.
- Nombres de los demas jugadores siempre visibles (12 casillas); los NPC al tocarlos.
- Aviso "No hay suficiente mana / AG" al lanzar una habilidad sin poder pagarla.
- Camara a la distancia del original.

Errores corregidos al probar en linea:
- El menu de jugador se cerraba al soltar una pulsacion larga.
- El toque de un boton atravesaba la hoja de item y pulsaba lo de abajo.
- "Warning" se encimaba en el comercio.
- Baul, comercio y maquina Chaos dejaban un hueco junto al inventario (tambien en PC, hacia el original).
- El registro de mensajes tapaba el joystick.

Probado en linea contra OpenMU local: comprar y vender, baul, dialogos de NPC, grupo, comercio y amigos entre dos jugadores, musica del pueblo.

## Rendimiento (misma prueba en la misma maquina)
| | Inicial | Ahora | Magdalena |
|---|---|---|---|
| Fotogramas por segundo | 8.8 | 19 (+116 %) | 22 a 31 |
| Triangulos por fotograma | 144 mil | 24 mil | 8.6 mil |
| Memoria real de la pestana | - | 786 MB | 1495 MB |
| Descarga inicial | 4.6 MB | 4.6 MB | 564 MB |

Dos cambios lo lograron: el suelo se dibuja solo donde mira la camara, y el perfil de celular quita el pasto en briznas (Magdalena no lo tiene).

## Opciones nuevas o cambiadas
- Perfil de celular v4: pasto en briznas apagado (Opciones > densidad del pasto lo devuelve).
- Perfil de celular v3 (anterior): sin posprocesado, sombras ni luces dinamicas; todo se puede volver a encender en Opciones.

## Fijo en el cliente (sin opcion)
Todo lo anterior de interfaz tactil, el apilado de ventanas, los nombres siempre visibles, el aviso de mana y la camara del celular. En PC no cambia nada.

## Sin resolver
- Personajes y NPC medio transparentes en la version de escritorio (captura del propietario): no se reproduce en esta maquina sin GPU; pendiente de la prueba de opciones que se le pidio.
- Habilidades de clase al crear personaje: el plugin del otro chat esta instalado; faltan desactivar "Add Lance For Summoner", reiniciar OpenMU y corregir las listas de MG y DL (ver seccion 22 del estudio).
- Misiones completas, buffs del Elfo y evolucion de clase: el OpenMU de demostracion no las trae; probar en el servidor real.
- Crear clan: sin probar (pide el NPC Guild Master y nivel).
- Efectos de habilidades no comparados fotograma a fotograma con Magdalena.
- Brillo: este cliente es un 10 % mas oscuro que Magdalena; no se aclaro para no aclarar los mapas de noche.

## Lo que debe hacer el propietario
1. Probar en el telefono (Chrome y Samsung Internet) con la direccion de arriba.
2. La prueba de opciones para la transparencia en PC (preset Bajo y luego apagar de una en una MSAA, Brillo, Bloom, Tono y Luces dinamicas).
3. Entrar a Cloud Shell para que el otro chat termine el plugin de habilidades.
4. Revocar el token `mu-vm-install`, borrar `mu-assets` cuando no haga falta y borrar `client-old-20261110-1940` de la VM.
