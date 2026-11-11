# Plan del proyecto MU Web

Documento vivo. Es la ruta acordada con el propietario; cualquier sesion de trabajo lo lee antes de actuar y lo
actualiza al terminar una fase. Ultima revision: 2026-11-10.

## 1. Objetivo y reglas

Un MU Online jugable desde el navegador del celular, fiel al cliente original (S6E3), contra un servidor OpenMU
propio en una VM de Oracle Cloud Always Free (Ubuntu 24.04, 1 GB de RAM, IP publica 155.181.133.84).

- Prueba privada con los archivos del cliente 1.04d del propietario. Los assets de Webzen y los derivados
  NUNCA van a un repo publico (viven en `Jonatks/mu-assets`, privado, y en la VM).
- A largo plazo, arte original que reemplace al de Webzen.
- Cambios irreversibles en la VM se confirman antes. El acceso a la VM lo tiene la otra sesion (extension de Chrome);
  esta sesion no llega a la VM salvo por el puerto 80.
- Prioridad del propietario: que todo funcione bien en cada interfaz con cada clase, antes que el pulido visual.
- Licencia del codigo base: MIT mas la condicion de creditos (ventana Ctrl+F8 intacta). Ver `LICENSE`.

## 2. Estado actual (hecho y verificado)

- Cliente base: fork de Ignies/OpenMu-Client-Babylon (ver `FORK.md`). El cliente anterior esta en la rama `legacy-muonlinejs`.
- En linea en `http://155.181.133.84`: abre directo en el login del mundo (`server.json` con `directLogin`).
- Probado de punta a punta contra OpenMU: login, seleccion de personaje en 3D, Lorencia, HUD, minimapa, inventario con
  iconos, ventana de personaje, monstruos, objetivo con barra de vida, ataque, habilidades reales por personaje.
- Reproduccion: `tools/ignies-client/` (assets desde el cliente original) y `tools/reference-client/` (cliente de Windows con Wine).
- Despliegue: codigo por la rama `release` (autodespliegue de la VM cada 3 minutos); assets por repo privado y `vm-install.sh`.
- Feedback del propietario tras probar en celular: carga rapida y bien. Falta pantalla completa y horizontal automaticos,
  y la interfaz no esta pensada para celular.

## 3. Fases, en orden

**Regla de entregables (pedida por el propietario).** Cada parte del plan termina con un ENTREGABLE: algo que se pueda abrir y
jugar en su celular en `http://155.181.133.84` (cuando la parte toque el cliente). Antes de publicarlo se prueba aqui en emulacion
movil; se publica por la rama `release` (la VM lo aplica sola en ~3 minutos) y se le avisa con que probar y que reportar.
Las partes que no tocan el cliente (proxy, web de administracion) tienen su propio entregable verificable (por ejemplo, un enlace).

### Fase 1. Celular: inmersion e interfaz (prioridad inmediata)
**Regla de formato (pedida por el propietario):** el formato de celular NO es el de PC. El cliente detecta solo el tipo de
dispositivo (`src/controllers/interface/mobile.ts`: puntero tactil como principal y puntos de contacto) y en un PC con raton y
teclado se queda exactamente como el cliente de escritorio: sin joystick, sin aviso de girar, sin pantalla completa forzada.
Todo lo nuevo de esta fase cuelga de esa deteccion. Para probar: `?mobile=1` fuerza el formato celular y `?mobile=0` el de PC.
Se verifica en cada entregable con una prueba de PC y una de celular.
1a. **Pantalla completa y horizontal.** Aviso "gira tu celular" si esta en vertical; al primer toque (START) entrar en
    pantalla completa, bloquear orientacion horizontal y ocultar la barra del navegador. En iPhone no existe la API de
    pantalla completa: ahi se resuelve con "agregar a inicio" (PWA) y, mas adelante, con la app.
    Hecho cuando: en Android/Chrome el juego ocupa toda la pantalla tras tocar START, y vuelve a pedirla si se sale.
    ENTREGABLE 1a: abrir la IP en el celular, en vertical aparece "gira tu celular"; en horizontal, al tocar START, pantalla completa.
    ESTADO 1a: hecha y publicada el 2026-11-10 (pruebas: celular vertical, celular horizontal y PC); falta la prueba del propietario en su celular.
    1a.2 PANTALLA INSTANTANEA (pedida por el propietario, hecha): `index.html` trae una pantalla estatica ("MU", rueda, "Cargando..." y,
    solo en celular vertical, "Gira tu celular") que se ve antes de que llegue el JavaScript y se retira al arrancar la app.
    Motivo: con una conexion lenta o un primer arranque se veia solo negro. Nota: al teclear la IP sin `http://` el navegador prueba
    HTTPS primero y el puerto 443 esta cerrado, asi que puede esperar varios segundos; se resuelve con la fase 2b.
    Rehecha el 2026-11-10 a pedido del propietario ("muy simple"): fondo de montana, logo MU dorado y barra de carga dorada.
1b. **HUD tactil v1** sobre lo que ya trae el cliente (`versions/shared/ui/hud/mobile_controls/`), siguiendo la seccion 3b.
    Criterio del propietario: fieles al juego original en las ventanas y los iconos, pocas licencias; el objetivo es un juego
    pulido y muy fluido en celular. Lo nuevo es lo que rodea al juego (joystick, menu en tiles, boton contextual de NPC).
    ENTREGABLE 1b: se puede caminar con el joystick, atacar, usar habilidades y pociones, hablar con un NPC y abrir el menu, todo con el pulgar.
    ESTADO 1b: parte 1 hecha (joystick de 8 direcciones, 120 px, abajo a la izquierda; camina por el mismo codigo que W-A-S-D y solo
    existe en celular). Ya traia el cliente: boton de mover, 5 botones de menu y selector de habilidades con los sprites originales.
    CORRECCION 2026-11-10: al tocar un personaje en la seleccion, entraba siempre el primero (el sistema de seleccion leia el
    objetivo antes de que el de punteros lo calculara; con raton no se notaba por el hover). Ahora lo lee un instante despues.
    Verificado en celular emulado: se toca al Dark Wizard y entra test3Dw. Pendiente de confirmar por el propietario.
    Comparacion grafica con Mu Magdalena (Noria, misma resolucion, emulacion sin GPU): no reproduzco lo opaco/transparente;
    se necesita una captura del celular del propietario con el problema.
    Pulido de interfaz tomando a Magdalena como guia (seccion 3b): pendiente, es el grueso de lo que falta de la 1b.
    Faltan: boton contextual "Hablar - NPC", pociones rapidas, menu de comandos en tiles, y la opcion de mostrar/ocultar el joystick.
1c. **Escala de la interfaz** ajustable (fuente, ventanas, joystick) y zoom de camara. Ventanas de MU a tamano tocable.
    ENTREGABLE 1c: ajustes con deslizadores; las ventanas del juego se ven y se tocan comodas en el celular.
1d. **Ayudas de combate**: pociones automaticas con umbral y MU Helper (auto-ataque, buffs, recoger botin). Es "mejora",
    va detras de opciones, como exige la guia del fork.
    ENTREGABLE 1d: el Helper se configura y arranca con el dedo, y las pociones se toman solas al umbral elegido.
1e. **Estrategia de descarga.** Dato del propietario: Mu Magdalena baja ~377 MB al iniciar, todo por adelantado, y despues sigue
    bajando un poco mas. Nuestro cliente baja por demanda: "core" 56 MB comprimido (154 MB en disco) mas ~7-10 MB por mapa; todo
    junto serian ~423 MB (cifras del indice de assets, no medidas en un telefono). El propietario nota que nuestro cliente ARRANCA
    mucho mas rapido (la de Magdalena se queda varios segundos en negro) y prefiere descargar todo al inicio.
    Decision: conservar el arranque rapido y, justo despues, descargar todo en segundo plano con barra de progreso (MB y
    archivos), con cache para que solo ocurra la primera vez. Medir en telefono real antes y despues.
    Verificacion: emulacion movil en Playwright (Pixel 7 horizontal), capturas, y el propietario prueba en su celular
    despues de cada despliegue y reporta; ese ciclo es el que decide si una fase se da por buena.
    Interfaz de Mu Magdalena ya observada con cuenta de prueba del propietario: ver seccion 3b.

### 1f. Lista de defectos reportados por el propietario (capturas del celular, 2026-11-10)
Estado: [hecho] ya publicado, [investigado] causa estudiada pero sin arreglo, [pendiente].
1. [hecho] Personajes pequenos: la camara abre un paso mas cerca en celular y se puede hacer zoom con pellizco (antes solo existia Ctrl+rueda).
2. [hecho] Items del suelo sin nombre: en celular los nombres de los drops estan activos desde el inicio (en PC se activan con ALT).
3. [hecho] Al tocar un item del suelo salia el cuadro completo con todos sus datos: en celular ahora solo el nombre, como el original; el cuadro completo
   queda para el inventario. Se puede volver a activar en Opciones.
4. [hecho] El registro de chat tapaba el joystick: en celular empieza a la derecha del joystick y desvanece las lineas viejas.
5. [investigado] Fondo celeste de los items en inventario y tienda: el color del codigo es el del original (`glColor4f(0.3, 0.5, 0.5, 0.6)`, citado en
   `inventory/style.less`) y en mi emulacion se ve verde-azulado oscuro (58,89,89), no el celeste claro de la captura. Sospecha: algo del navegador
   o de la GPU del telefono (la barra de la captura parece Samsung Internet). Pendiente: probar el mismo telefono con Chrome y comparar.
6. [investigado] Personaje, mob y drops "transparentes", todo "opaco": no se reproduce en emulacion por software; misma sospecha que el punto 5.
   Medido: brillo medio nuestro 34% frente a 22% de Mu Magdalena en Noria (en emulacion nuestro es mas claro).
7. [investigado] Tiron junto a un NPC (el personaje intenta ocupar su lugar y vuelve atras): el servidor OpenMU rechaza un paso y "tira del cliente
   hacia atras" (`RejectWalkAndResynchronizeClient`) por camino bloqueado, exceso de velocidad o posicion de inicio desfasada. Descartado: diferencia
   de casillas entre cliente y servidor (en Lorencia 1 de 65 536). Pendiente: reproducirlo contra OpenMU local con registro del servidor.
7b. [hecho, a probar] "Poco definido": el 3D se dibujaba SIEMPRE a 1 pixel por pixel CSS (`limitDeviceRatio: 1` con el antialiasing fijo en apagado), o sea a
   915x412 en un celular de 2400x1082, y el navegador lo estiraba. Ahora en celular dibuja hasta 2x (1830x824); si va lento, se baja con la opcion de escala de
   render que ya existe. Comparacion antes/despues con la misma escena: bordes sin dientes de sierra y mas detalle de textura. Tambien se rehizo la pantalla del
   resaltado rojo: tras matar a un monstruo el contorno rojo se quedaba pegado al cuerpo (con el dedo no hay movimiento de cursor que lo quite); ahora se retira al morir.
   Pendiente: el recuadro cuadrado que el propietario ve cuando los orbes del aura pasan sobre el cuerpo (sospecha: mezcla alfa de sprites aditivos sobre
   el cuerpo que se desvanece en GPU movil; no se reproduce en emulacion por software). Se revisara en una captura de Chrome.
8. [pendiente] Seleccion de personajes: personajes pequenos y ambiente oscuro; Magdalena acerca el personaje elegido y lo muestra grande.
9. [pendiente] Interfaz que tapa la vision: botones del menu duplicados (arriba derecha y en la barra), tres ranuras de habilidad vacias y
   "Activar" a la derecha, ventanas abiertas encima de los botones del menu. Magdalena usa un solo boton de menu, aviso de chat colapsado y
   el 3D casi libre.
10. [pendiente] Comparaciones lado a lado con Magdalena que faltan: hablar con un NPC, matar monstruos, caida de drops, menus y estadisticas.

### 3b. Referencia de diseno movil (Mu Magdalena, observada el 2026-11-10 en un celular de 915x412 px CSS)
Su cliente tambien es un derivado de la misma base (Babylon.js) con interfaz HTML encima del 3D. Lo que hay que copiar en espiritu:
- **Entrada.** Se abre tambien en vertical; en algun momento pide girar a horizontal para continuar ("Gira tu telefono").
  NO entra en pantalla completa (la barra del navegador queda visible): eso lo haremos nosotros (fase 1a).
- **Seleccion de personaje.** Panel inferior con nombre, clase y nivel, puntos de pagina, flechas laterales grandes (unos 52 px),
  botones Enter / Create / Delete en forma de pastilla. Crear: botones de las 7 clases, retrato grande que cambia, campo de nombre.
- **HUD en el mundo.** Arriba a la izquierda: nivel, nombre, zona con coordenadas, estado (NORMAL), barra de la mascota.
  Arriba a la derecha: 4 botones redondos de 48x48 px separados 8 px (pociones "99+", HELPER, tienda del servidor, menu).
  Abajo a la izquierda: joystick grande (~120 px) con aro ornamental. Abajo al centro: orbes de vida y maná y barra de
  6 ranuras con el arte original. A la derecha: boton de habilidad de 50x50 px y boton "configurar habilidades" de 50x50 px.
  Boton contextual (pildora de ~211x38 px) "Hablar - <NPC>" que aparece al acercarse a un NPC. Indicador "SAFE ZONE".
  Globo de chat de 32 px con contador de mensajes sin leer.
- **Menu de comandos.** Pantalla casi completa con tiles cuadrados grandes (~114x121 px) con icono y texto: Mover, Inventario,
  Asignar puntos, Ranking, Gremio, MU Helper, Ajustes, Cambiar personaje, Salir. Pie con jugadores en linea.
- **Ventanas del juego.** El inventario es la ventana ORIGINAL de MU (mismo marco, ranuras de equipo y bolsa de 8 columnas), acoplada
  a la derecha y ampliada; solo cambia la moneda. Es el criterio de fidelidad que se pide aqui.
- **Ajustes.** Pestanas Interfaz y Juego; deslizadores de fuente de juego (190%), fuente de interfaz (190%), tamano del joystick
  (100%), interruptores "mostrar joystick" y "joystick de precision", zoom de camara (1.25x), restaurar.
- **MU Helper.** Pestanas Combate y Recoger; rotacion de ataques (cuadricula de iconos de habilidad), buffs "solo si faltan",
  alcance de ataque y de botin, "posicion original", pociones automaticas HP/Maná/SD con umbral del 10% al 100% y boton
  grande "Start helper". Nuestro cliente ya trae un Helper original: la tarea es hacerlo comodo al tacto.
- **Personaje nuevo.** Empieza en zona segura, nivel 1, ranuras de habilidad vacias. Ojo: el punto de partida depende de la
  clase (el Elf de prueba aparecio en Noria; segun el propietario, la mayoria de las clases empiezan en Lorencia). Cada clase
  trae sus propias particularidades (flechas del Elf, Command del Dark Lord, libros del Summoner, etc.); se verifican una a una en la fase 3.
- Rechazado a proposito: tienda de monedas, recargas y cualquier flujo de pago de ese servidor.
- Reglas tactiles que se adoptan: objetivos tocables de al menos 44-48 px; nada importante bajo el pulgar del joystick;
  interfaz escalable por el jugador; el 3D nunca se tapa con paneles permanentes.

### Fase 2. Seguridad y conexion segura de la VM
2a. **Proxy**: el actual (puerto 8090) acepta cualquier destino. Reemplazarlo por el de Ignies con `ALLOW_TARGETS`
    (solo 44405, 44406 y 45901-45906 de la VM) y sin el registro de eventos que guarda susurros.
    ENTREGABLE 2a: el juego sigue funcionando igual en el celular y, desde fuera, el proxy rechaza cualquier otro destino (prueba mostrada).
2b. **HTTPS y `wss://`** sin comprar dominio: nombre gratuito `155-181-133-84.sslip.io` con certificado automatico
    (Caddy) para la web y el proxy. Requiere abrir el puerto 443 en la lista de seguridad de Oracle y en el firewall de la VM
    (lo hace el propietario o la otra sesion). Con HTTPS se habilitan tambien PWA, bloqueo de orientacion fiable y la app.
2c. **Dominio gratuito de Vercel** (`algo.vercel.app`). DECISION / RECOMENDACION:
    - Vercel puede alojar la web de administracion (fase 4), pero NO puede hacer de puente WebSocket hacia el servidor de juego.
    - Si el juego se abre desde una direccion `https://`, el navegador exige que el puente sea `wss://`, y eso necesita un
      certificado en la VM. Hay una forma gratuita sin comprar dominio: el nombre `155-181-133-84.sslip.io` (apunta solo a la IP
      de la VM) con certificado automatico de Let's Encrypt a traves de Caddy, que sirve la web y el proxy `wss://`.
    - Por eso el juego se sirve desde la VM (tampoco conviene alojar alli los assets de Webzen), y el dominio `algo.vercel.app`
      es la direccion corta y facil de recordar: una redireccion hacia `https://155-181-133-84.sslip.io`. El jugador teclea el
      dominio de Vercel y no necesita la IP.
    - Requisito: abrir el puerto 443 en Oracle y en el firewall de la VM (pregunta abierta 3).
    ENTREGABLE 2b/2c: `https://155-181-133-84.sslip.io` abre el juego con candado y se puede jugar con `wss://`; el dominio de Vercel redirige ahi.
2e. **Archivos precomprimidos (`.gz`) en la VM.** Hoy la VM comprime al vuelo cada archivo que se pide (el paquete se envio sin
    los `.gz` para ahorrar 186 MB de subida); con la VM de 1 GB y poca CPU, varios jugadores nuevos a la vez la ahogarian. Generar
    los `.gz` una sola vez en la VM (como hacia el script anterior) o enviarlos en el paquete, antes de abrir al publico.
2d. Dejar solo nuestro mundo en el cliente (sin consultas a servidores de terceros) y respaldos de la base de datos.

### Fase 3. Calidad de juego por clase (prioridad del propietario)
Matriz clases x interfaces, verificada contra el cliente original de Windows (referencia en `tools/reference-client/`):
clases DK, DW, Elf, DL (y las que el servidor habilite) x seleccion, HUD, inventario/equipo, ventana de personaje
(Command solo para Dark Lord), habilidades por clase, combate (muerte, botin, experiencia), tienda, bobeda, comercio,
party, chat. Se automatiza con las cuentas GM de pruebas. Cada diferencia encontrada se registra y se corrige.
Despues: suelo de Lorencia mas claro que el original (iluminacion) y otros detalles visuales.
Fidelidad visual en celular (reportada por el propietario el 2026-11-10): texturas, resplandores y brillos se ven "opacos y en algunos
casos transparentes". Pendiente de investigar con capturas del celular y del cliente original: mezcla alfa y formatos de textura en GPU
movil, texturas faltantes, iluminacion y los efectos con brillo aditivo.
ENTREGABLE fase 3: por cada lote de clases, un informe (que se comparo y que se corrigio, con capturas lado a lado) y la correccion
desplegada para jugar con esa clase en el celular.

### Fase 4. Web de administracion ("webmaster") en Vercel
Meta: entrar con usuario y contrasena propios y manejar el juego: crear cuentas, editar personajes (nivel, stats, zen),
inventario y objetos con opciones, baneos, monedas, una especie de MU Editor.
- **Arquitectura propuesta**: interfaz en Vercel (con su login de administradores) + un servicio de administracion pequeno
  en la VM, con HTTPS y clave, que es el unico que toca la base de datos de OpenMU. La base de datos nunca se expone a internet.
- **Investigar antes de construir (spike)**: OpenMU mantiene los datos de un jugador en memoria mientras esta conectado, asi
  que editar la base con el jugador dentro se pierde o se pisa. Hay que decidir entre: usar la administracion propia de OpenMU
  (cuentas, personajes, inventario, habilidades; panel Blazor, comandos de GM y una opcion de MCP), expulsar al jugador antes de
  editar, o apoyarse en esas interfaces. Criterio: nada que corrompa datos.
- **MVP** (orden): ingreso de administradores; crear/listar cuentas y cambiar contrasena; banear/desbanear; ver personajes;
  editar nivel/stats/zen; ver e insertar objetos. Despues: bobeda, habilidades, mapas, registros.
- Registro de jugadores abierto al publico: el fork trae un servicio de registro; se evalua reutilizarlo.
- El panel de OpenMU nunca se publica: solo por tunel SSH.
- Nota sobre MU Editor (MSPro): su pagina publica no documenta funciones, solo un historial de cambios; no es una especificacion.
  Las funciones se definen con lo que OpenMU ya expone y con lo que el propietario pida.
- ENTREGABLE fase 4: una direccion `algo.vercel.app` con login de administrador donde, por tramos del MVP, se puede crear una cuenta
  y comprobar en el juego (en el celular) que entra. Cada tramo se entrega asi.

### Fase 5. Preparar la apertura
Quitar o banear `test0` a `test7` y las cuentas de demostracion; flujo de creacion de cuentas; limites de recursos (la VM
tiene 1 GB de RAM); copias de seguridad; aviso legal (marcas y archivos de terceros) y terminos; pruebas con jugadores reales.
ENTREGABLE fase 5: lista de verificacion firmada por el propietario y el juego listo para invitar a otras personas.

### Fase 6. App Android y PWA
Envoltorio de la web (TWA o Capacitor) una vez exista HTTPS (fase 2b). iPhone: PWA.
ENTREGABLE fase 6: un APK para instalar en el celular y una guia de "agregar a inicio" para iPhone.

### Fase 7. Arte original (largo plazo)
Reemplazo gradual de modelos, texturas, iconos y sonidos de Webzen por arte propio, sistema por sistema.

## 4. Como trabajamos
- Una fase a la vez; al terminar se actualiza este documento y se informa con capturas.
- Codigo: commits a `main`; lo que despliega al sitio es solo la rama `release` (se publica cuando algo esta probado).
- Cambios en la VM: scripts reversibles con respaldo, ejecutados por la sesion con acceso o por el propietario.
- Tokens y claves: de solo lectura, vencimiento corto, borrados al terminar. Nunca en el repo.
- Pruebas que fallan por falta de assets (14 al 2026-11-10, ninguna del codigo): las de la version 0.97d (`Data-v097d`, `game-assets-v097d`), el indice de paquetes de texturas (`public/packs`), nombres de archivo con otras mayusculas en `Data/Local`, y 8 archivos propios de Ignies (instrumentos del sistema de banda, `coin.wav`, `win.mp3`). No hay que perseguirlas.
- Idiomas: solo ingles y espanol son obligatorios en los textos nuevos (`src/i18n/coverage.test.ts`); el resto cae a ingles.
- Pruebas locales: OpenMU en Docker (`-demo`), su proxy con `ALLOW_TARGETS`, cliente con Vite o `vite preview`.
  Sin GPU el dibujo va a ~1 fps, asi que las pruebas automaticas usan clics sostenidos largos.

## 5. Preguntas y bloqueos abiertos
1. RESUELTO. Cuenta de prueba en Mu Magdalena: el propietario dio una cuenta propia; se uso solo para ver la interfaz (login,
   seleccion, creacion de personaje, HUD, menu, inventario, ajustes y Helper). Se creo en ella un personaje de prueba "ClauElf"
   que el propietario puede borrar. La contrasena no se guarda en ningun archivo.
2. RESUELTO. Vercel: el propietario tiene cuenta y esta sesion tiene el conector de Vercel. Falta, al llegar a la fase 4,
   comprobar que el conector puede crear y desplegar un proyecto (un paso de lectura no hace dano).
3. **Oracle**: abrir el puerto 443 (fase 2b); lo hace el propietario o la otra sesion.
4. **Sobre el repo**: las reglas de commits del fork original piden no incluir atribucion; en este repo se mantienen las
   lineas de atribucion de la sesion. Si el propietario prefiere otra convencion, se cambia aqui.
