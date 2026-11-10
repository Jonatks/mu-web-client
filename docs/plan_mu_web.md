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

### Fase 1. Celular: inmersion e interfaz (prioridad inmediata)
1a. **Pantalla completa y horizontal.** Aviso "gira tu celular" si esta en vertical; al primer toque (START) entrar en
    pantalla completa, bloquear orientacion horizontal y ocultar la barra del navegador. En iPhone no existe la API de
    pantalla completa: ahi se resuelve con "agregar a inicio" (PWA) y, mas adelante, con la app.
    Hecho cuando: en Android/Chrome el juego ocupa toda la pantalla tras tocar START, y vuelve a pedirla si se sale.
1b. **HUD tactil v1** sobre lo que ya trae el cliente (`versions/shared/ui/hud/mobile_controls/`): joystick o tocar para
    caminar, boton de ataque grande, habilidades en arco, pociones, menu de comandos, chat, minimapa. Inspiracion
    (Mu Magdalena): joystick con mostrar/ocultar, modo precision y tamano ajustable; barra Mover/Atacar/Hablar con NPC;
    menu de comandos (Inventario, Puntos con botones mas y menos, Helper, Configuracion, Cambiar personaje).
1c. **Escala de la interfaz** ajustable (fuente, ventanas, joystick) y zoom de camara. Ventanas de MU a tamano tocable.
1d. **Ayudas de combate**: pociones automaticas con umbral y MU Helper (auto-ataque, buffs, recoger botin). Es "mejora",
    va detras de opciones, como exige la guia del fork.
    Verificacion: emulacion movil en Playwright (Pixel 7 horizontal), capturas, y el propietario prueba en su celular
    despues de cada despliegue y reporta; ese ciclo es el que decide si una fase se da por buena.
    Pendiente de observar: la interfaz de Mu Magdalena con cuenta (ver preguntas abiertas).

### Fase 2. Seguridad y conexion segura de la VM
2a. **Proxy**: el actual (puerto 8090) acepta cualquier destino. Reemplazarlo por el de Ignies con `ALLOW_TARGETS`
    (solo 44405, 44406 y 45901-45906 de la VM) y sin el registro de eventos que guarda susurros.
2b. **HTTPS y `wss://`** sin comprar dominio: nombre gratuito `155-181-133-84.sslip.io` con certificado automatico
    (Caddy) para la web y el proxy. Requiere abrir el puerto 443 en la lista de seguridad de Oracle y en el firewall de la VM
    (lo hace el propietario o la otra sesion). Con HTTPS se habilitan tambien PWA, bloqueo de orientacion fiable y la app.
2c. **Dominio corto de Vercel** (`algo.vercel.app`) que redirige al sitio de juego. Vercel no puede hacer de puente
    WebSocket hacia el servidor ni conviene alojar alli los assets de Webzen; por eso el juego se sirve desde la VM.
2d. Dejar solo nuestro mundo en el cliente (sin consultas a servidores de terceros) y respaldos de la base de datos.

### Fase 3. Calidad de juego por clase (prioridad del propietario)
Matriz clases x interfaces, verificada contra el cliente original de Windows (referencia en `tools/reference-client/`):
clases DK, DW, Elf, DL (y las que el servidor habilite) x seleccion, HUD, inventario/equipo, ventana de personaje
(Command solo para Dark Lord), habilidades por clase, combate (muerte, botin, experiencia), tienda, bobeda, comercio,
party, chat. Se automatiza con las cuentas GM de pruebas. Cada diferencia encontrada se registra y se corrige.
Despues: suelo de Lorencia mas claro que el original (iluminacion) y otros detalles visuales.

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

### Fase 5. Preparar la apertura
Quitar o banear `test0` a `test7` y las cuentas de demostracion; flujo de creacion de cuentas; limites de recursos (la VM
tiene 1 GB de RAM); copias de seguridad; aviso legal (marcas y archivos de terceros) y terminos; pruebas con jugadores reales.

### Fase 6. App Android y PWA
Envoltorio de la web (TWA o Capacitor) una vez exista HTTPS (fase 2b). iPhone: PWA.

### Fase 7. Arte original (largo plazo)
Reemplazo gradual de modelos, texturas, iconos y sonidos de Webzen por arte propio, sistema por sistema.

## 4. Como trabajamos
- Una fase a la vez; al terminar se actualiza este documento y se informa con capturas.
- Codigo: commits a `main`; lo que despliega al sitio es solo la rama `release` (se publica cuando algo esta probado).
- Cambios en la VM: scripts reversibles con respaldo, ejecutados por la sesion con acceso o por el propietario.
- Tokens y claves: de solo lectura, vencimiento corto, borrados al terminar. Nunca en el repo.
- Pruebas locales: OpenMU en Docker (`-demo`), su proxy con `ALLOW_TARGETS`, cliente con Vite o `vite preview`.
  Sin GPU el dibujo va a ~1 fps, asi que las pruebas automaticas usan clics sostenidos largos.

## 5. Preguntas y bloqueos abiertos
1. **Cuenta de prueba en Mu Magdalena** para ver su interfaz dentro del juego: su registro pide usuario, correo (unico) y
   contrasena, sin captcha. Falta decidir con que correo (el del propietario, uno desechable, o que el propietario cree la cuenta
   y comparta una contrasena de prueba) y si el propietario autoriza el uso de su correo con un tercero.
2. **Vercel**: confirmar que hay una cuenta y como se me dara acceso (conector o token) para la web de administracion.
3. **Oracle**: abrir el puerto 443 (fase 2b); lo hace el propietario o la otra sesion.
4. **Sobre el repo**: las reglas de commits del fork original piden no incluir atribucion; en este repo se mantienen las
   lineas de atribucion de la sesion. Si el propietario prefiere otra convencion, se cambia aqui.
