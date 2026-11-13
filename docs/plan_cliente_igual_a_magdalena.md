# PLAN UNICO: un cliente casi identico a Mu Magdalena (aspecto, juego, rendimiento y servidor)

Es el unico plan vigente: reemplaza al de 7 fases (`plan_mu_web.md`, que queda como historia). Decisiones del propietario (2026-11-12): servidor de pruebas privado, no se abre a otros
jugadores (sin registro publico, sin aviso legal ni pruebas con jugadores reales); cuentas de prueba ya quitadas; sin APK ni arte original; la web de administracion la hace el otro chat.
Documento vivo, escrito a partir de TODO lo que el propietario ha pedido. Cada punto lleva: que se hace, como se comprueba y su estado.
Reglas fijas: PC conserva raton y teclado (todo lo nuevo es solo tactil); textos nuevos solo en ingles y espanol; sin gastar dinero; no se copian compras, recargas ni banderas;
no se publican assets de Webzen; las credenciales de prueba no se guardan en archivos; el propietario no interviene (lo que exija su mano se anota y se sigue).
Estados: [hecho] [parcial] [pendiente] [solo el propietario].

## A. Estudio de Mu Magdalena (cuenta normal, personaje nuevo, celular horizontal 915x412)
Para cada area: entrar, jugar, capturar, volcar el DOM (medidas, fuentes, colores), anotar comportamiento y pasos exactos. Resultado en `docs/magdalena_study.md`.
A1. Clases y razas, una por una (DW, DK, Elf, MG, DL, Summoner, RF): donde nace, habilidad inicial, armas, como ataca (cerca, lejos, maná, AG), primeras 10 subidas de nivel. [hecho: las 7 clases estudiadas, ver secciones 12 y 16 del estudio]
A2. Mobs: cada familia (arana, dragon rojo, bull fighter, esqueleto...), tamano, barra de vida, daño, que sueltan, cuanto tardan en morir segun nivel. [parcial]
A3. Peleas: apuntar, anillo del objetivo, golpe basico contra habilidad, numeros de daño, muerte del mob, muerte del jugador y reaparicion, experiencia y nivel. [parcial]
A4. Botin: como cae, nombre en el suelo, oro, ítems especiales, mano de recoger, que pasa con varios ítems a la vez, inventario lleno. [parcial]
A5. Inventario y equipo: tamaño de las ventanas, celdas, mover, equipar, usar, soltar, apilar, reparar, comparar. [parcial]
A6. Armas, armaduras y ropa: como se ven puestas, en el suelo, en el inventario y en la tienda. [pendiente]
A7. Tiendas de NPC: abrir, comprar, vender, reparar, precios, impuesto, ítems no vendibles, falta de zen. [parcial]
A8. NPC con buffs, misiones, evolucion de clase, entrada a eventos, guardia, baúl del banco: cada dialogo y cada opcion. [parcial]
A9. Habilidades y poderes: ventana, libros y orbes, requisitos, casillas, cooldown, mana y AG, buffs, invocaciones, teletransporte. [parcial]
A10. Atributos y progresion: puntos, nivel, zonas por nivel, evolucion, master. [parcial]
A11. Movimiento: joystick, tocar el suelo, caminar entre mapas, puertas, correr, mover con enemigos cerca, tirones. [parcial]
A12. Mapas y minimapa: cada mapa del mundo, mover/teleport, minimapa, zona segura. [parcial]
A13. Jugadores: comercio, fiesta, clan, amigos, susurros, menu rapido por pulsacion larga. [pendiente]
A14. Chat y avisos: burbuja, panel, anuncios del servidor, sistema, colores. [hecho]
A15. Interfaz general: pantalla de carga, inicio de sesion, personajes, crear heroe, menu, ajustes, Helper, ranking (solo mirar). [parcial]
A16. Sonido y musica: que suena y cuando (menu, mundo, golpes, ítems). [pendiente]
A17. Efectos: auras, habilidades, buffs, luz de ítems, particulas, clima. [pendiente]
A18. Letras: fuente, tamaño, color y sombra de cada texto del HUD. [parcial]

## B. Comparacion lado a lado
B1. Capturas del mismo momento (misma pantalla, mismo tamaño) de Magdalena y de este cliente, una pareja por cada pantalla de A. [pendiente]
B2. Tabla de diferencias por pantalla: color, brillo, tamano de letra, tamano de ventana, posicion, comportamiento. [pendiente]
B3. Problemas visuales vistos en el telefono del propietario (celdas celestes, personaje transparente, cuadrado del aura, tirones): reproducirlos o pedir capturas. [solo el propietario]

## C. Interfaz y jugabilidad (solo tactil)
C1. Inicio de sesion, personajes, crear heroe. [hecho]
C2. HUD del mundo: barra, orbes, casillas, estado, botones redondos, menu de teselas, chat, mano, hablar, ataque. [hecho]
C3. Ventanas del juego 1,4 veces mas grandes: Magdalena estira la interfaz 640x480 sobre toda la pantalla (1,43 a lo ancho, 0,86 a lo alto en 915x412). [hecho: `windowStretch`, ventanas pegadas arriba a la derecha, 270 px de ancho como Magdalena; falta revisar cada ventana una por una]
C4. Ventanas en columnas, cierre con X grande, tocar fuera para cerrar. [parcial]
C5. Tienda: comprar y vender con la hoja de detalle, precio, falta de zen, impuesto. [hecho: probado en linea contra OpenMU local con la vendedora de pociones: compra 10.000.000 a 9.999.980 zen y vende +250; sin zen no compra; los nombres de los mobs ya no tapan las ventanas]
C6. NPC: hablar, dialogos con opciones numeradas, misiones (aceptar, seguir, entregar), buffs, evolucion, baul. [parcial: probado en linea el dialogo del Gens Duprian Steward (opciones numeradas, texto con flecha de seguir, cerrar) y la tienda; la ventana ahora tapa la barra inferior como en Magdalena; baul probado: abre junto al inventario y mover un item con la hoja (Mover y tocar la celda) funciona; dialogo de misiones probado: "Accept a gens quest" responde "There is no available quest" con "Go back" (OpenMU demo no trae misiones Gens); faltan una mision real con entrega, buffs y evolucion]
C7. Habilidades: cada clase empieza con su primera habilidad; el boton repite la habilidad; verificar con cada clase; sin mana vuelve al golpe. [parcial: el codigo ya vuelve al golpe sin mana (fireControl); falta que el servidor de las habilidades, ver F4]
C8. Helper tactil: pestañas Combate y Recoger, rotacion, buffs, rangos, pociones con umbral, boton Start. [hecho: `helperSheet.tsx`, mismo borrador y guardado que la ventana clasica; las fichas de Recoger son las del protocolo (todo, joyas, zen, excelentes, ancient, por nombre), no una por joya como Magdalena]
C9. Pociones: automaticas (no hay botones). [hecho]
C10. Barra de vida y nombre sobre todos los mobs visibles (con tope por rendimiento), anillo naranja del objetivo, numeros de daño. [hecho: barras para los 5 mas cercanos y anillo naranja con 4 marcas, publicado]
C11. Drops: pastilla de nombre, oro con "Zen N", mano. Verificar varios a la vez. [parcial]
C12. Comercio, fiesta, clan, amigos con la interfaz tactil. [pendiente]
C13. Mapa y minimapa tactil. [pendiente]
C14. Movimiento: tirones, "tiron hacia atras", NPC que bloquea. Reproducir con registros del servidor y corregir. [pendiente]
C15. Sonido: el mismo mapa de sonidos que Magdalena. [pendiente]
C16. Letras y colores exactos del HUD de Magdalena. [parcial]
C17. Opciones: perfil de celular, ajustes tactiles, todo lo demas en el menu de Opciones del cliente. [hecho]
C18. Pantalla instantanea de arranque, pantalla completa y horizontal automaticos, aviso de girar. [hecho]
C19. PC sin cambios (comprobar que nada tactil aparece con raton). [hecho, repetir al final]

## D. Aspecto del dibujo (que se vea igual)
D1. Resolucion, brillo, tono, nitidez, iluminacion, sombras, pasto, nubes, particulas comparados con Magdalena en la misma escena. [pendiente]
D2. Personajes y mobs: que no se vean oscuros ni transparentes; mismo color y brillo que Magdalena. [pendiente]
D3. Suelo, objetos del mapa, agua, cielo. [pendiente]
D4. Efectos de habilidades y auras. [pendiente]
D5. Ajustar ayudandose de las Opciones del cliente; lo que no tenga opcion, en el codigo, solo tactil. [pendiente]

## E. Rendimiento (meta medible)
E1. Meta: igualar los 22 fotogramas por segundo de Magdalena en el mundo, en la misma maquina y navegador; memoria JS mucho menor que hoy (193 MB contra 19 MB, no se llegara a 19 por ser otra tecnologia: se pone una meta realista tras medir); descarga inicial comparable o mejor. [pendiente]
E2. Instrumentar el tiempo por sistema (terreno, objetos, personajes, efectos, posprocesado, interfaz) y hallar el cuello de botella real. [pendiente]
E3. Instanciar pasto y objetos repetidos; reducir llamadas de dibujo. [pendiente]
E4. Texturas comprimidas (KTX2). [pendiente]
E5. Liberar modelos y texturas que no se usan; revisar fugas de memoria. [pendiente]
E6. Resolucion de dibujo del celular: tope por dispositivo. [pendiente]
E7. Pantalla de inicio de sesion mas ligera. [pendiente]
E8. Descarga: decidir entre bajar todo al inicio (como Magdalena, 510 MB) o por demanda (hoy, ~5 MB); el propietario prefirio todo al inicio con barra de progreso. [parcial]
E9. Optimizar al final, sin tocar lo que quedo igual; repetir las mediciones y guardarlas. [pendiente]

## F. Servidor y administracion
F1. Copia diaria, proxy endurecido, HTTPS con wss, dominio corto de Vercel, cuentas de prueba quitadas. [hecho]
F2. Revocar el token `mu-vm-install`, borrar `mu-assets` cuando no haga falta y borrar `client-old-20261110-1940` de la VM. [solo el propietario / otro chat]
F3. Web de administracion estilo MU Editor (otro chat, con la extension de Chrome): ingreso propio, crear y editar cuentas y personajes, ítems, baneos. Diseno en `docs/admin_web.md`. [otro chat]
F4. Habilidades de clase: Magdalena da TODAS al crear el personaje (lo dice su tarjeta de bienvenida). Decision: darlas al crear con un plugin de OpenMU (openmu/plugins), probado antes en el OpenMU local; no se publica codigo de servidor sin probar. [pendiente, decidido]
F5. Comprobar que el cliente solo consulta nuestro mundo. [hecho: al abrir contacta solo su propio origen, el wss de la VM y api.github.com (la ventana de creditos, que debe quedar); el listado publico de Ignies ya no se pide cuando el mundo esta fijado por direct login]

## G. Verificacion y entrega
G1. Pruebas automaticas: tipos, estructura, pruebas de unidad, idiomas. [continuo]
G2. Cada cambio visible: captura antes y despues, en emulacion movil y en PC. [continuo]
G3. Despliegue por `release`, comprobar `build.json` y `Data/gate.bmd`. [continuo]
G4. Prueba en un telefono real, Chrome y Samsung Internet. [solo el propietario]
G5. Informe final con cambios, opciones nuevas, lo fijo en el cliente, lo sin resolver y lo que debe hacer el propietario. [al final]

## Orden de trabajo
1. A completo (estudio de cada area) con B1 y B2.
2. C3, C5, C6, C7 con todas las clases, C8, C10 a C16.
3. D (ajuste de aspecto), con mediciones de lo que cuesta cada ajuste (E2).
4. E3 a E9 (optimizar sin cambiar lo igualado).
5. G4 y correcciones con lo que vea el propietario.
