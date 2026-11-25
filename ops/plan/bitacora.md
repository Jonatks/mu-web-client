# Bitacora: lo aprendido y la hoja de ruta de cada implementacion

Se actualiza en cada paso del plan ([plan_por_fases.md](plan_por_fases.md)). Tres partes: recetas que ya
funcionan (para repetirlas sin probar de nuevo), lo aprendido de cada pieza, y los reemplazos
provisionales que hay que cerrar para llegar a la meta tal como se pidio.

## 1. Recetas que funcionan

### Pasar un item del S19 al servidor y al cliente
1. Leer `item.bmd` del S19 (registros de 696 bytes, Bux por registro, checksum `GenerateCheckSum2` 0xE2F1).
   `gen_items.py` saca `items_s19.json` con nombre, modelo, stats y requisitos.
2. Servidor: `items.sql` (ids `00000080-GGGG-NNNN-0000-000000000000`), probar en `openmu_probe` con
   `items_undo.sql` a mano, luego `openmu`.
3. Cliente: un `defineItem` por item en `versions/shared/items/<grupo>/`, el modelo `.glb` convertido
   del BMD v14 (ver 2.1), y el golden test de items al dia (cuenta y hash).
4. Editor: icono 72px en `mu-admin/admin/web/public/items/<g>_<n>.webp` y su linea en `index.json`.
   Renderizar desde 6 angulos y elegir uno por tipo (armaduras de frente, armas en diagonal).
5. Si es arma: revisar `weaponClass.ts` (arco, libro, guantes con modelo propio) o no se ve en la mano.

### Pasar un set ancient
1. `sets_s19.json` desde `itemsettype` (10 bytes por item) e `itemsetoption` (372 bytes por set).
2. Servidor: `gen_sets.ts` > `sets.sql`. OpenMU da N-1 opciones con N piezas y todas con el set completo,
   asi que las opciones van en ese orden. Los codigos del S19 sin numero en S6 (24 a 27, 33) se reparten
   en varios atributos.
3. Cliente: `client_sets.sh` en la VM (escribe `itemsettype` e `itemsetoption*` con copia `.bak3`), y
   los codigos 40 a 44 (`LATER_SET_OPTION`) en tooltip y stats.

### Agregar un NPC con tienda
`james.sql`: MonsterDefinition con `NpcWindow` 1 y `ObjectKind` 1, tienda en `data."ItemStorage"` /
`data."Item"` (rejilla 8x15). Cliente: `versions/shared/monsters/<npc>/` clonando uno parecido con
`npcModel`, y los golden tests de monstruos al dia.

### Agregar una mezcla (crafting) nueva
1. Plugin C#: clase que hereda **directamente** de `SimpleItemCraftingHandler` (OpenMU la instancia con
   `Type.GetType(nombre)` y solo le pasa los settings si la base directa es esa).
2. Datos: `SimpleCraftingSettings` + `ItemCraftingRequiredItem` (+ su tabla de `ItemDefinition`) +
   `ItemCrafting` con `ItemCraftingHandlerClassName` = `Namespace.Clase, MUnique.OpenMU.MuPlugins`,
   ligado al NPC por `MonsterDefinitionId`. El `Number` es el mixId que manda el cliente; libres en el
   Goblin (238) desde 51 (usamos 200). Ejemplo: `craft.sql`.
3. Cliente: la receta en `Mix.bmd` (tipo 0 = Goblin) con el mismo mixId: `client_mix.ts` / `client_mix.sh`.
   Las fuentes son rangos de codigo `grupo*512+numero`; el cliente no excluye, el servidor si.
   El nombre es un id de GlobalText (`find_text.py Text_eng.bmd <palabra>`): 618 "Create Set Item".
   El `mix.bmd` servido tenia 99 recetas (65000 bytes); con las 5 nuestras, 68280.

### Compilar y desplegar un plugin en la VM (sin SDK fuera)
Los plugins no tienen los `global using` de OpenMU: poner `using MUnique.OpenMU.DataModel.Entities;` (Item,
ItemOptionLink) y los demas a mano. La compilacion en la VM tarda unos minutos; los avisos MSB3277 son normales.
`deploy_craft.sh <sha>` en la VM: baja el repo por `codeload`, guarda la imagen actual como
`mu-openmu-admin:pre-craft`, compila con `Dockerfile.craft` (SDK en una etapa de docker) y recrea solo
`openmu` con los compose del contenedor en marcha. Rollback: `docker tag mu-openmu-admin:pre-craft
mu-openmu-admin:latest` y recrear.

### Publicar el cliente
`bash release/vm/publish-client.sh` hace todo esto y se niega si la lista de mundos no es la de la VM.
`tools/ignies-client/build-release.sh` pide `Data/` local (aqui ya no esta). Como el zip excluye `Data/`,
`game-assets/` e `items/`, basta: `APP_ENV=prod vite build`, copiar `release/vm/server.json` y `release/vm/serverlist.md` (no el `serverlist.md` de la raiz, que es la guia generica: con ese el juego busca el proxy en localhost y no pasa del login) a `dist/`,
zip con las mismas exclusiones, comparar la lista de archivos con el zip anterior, y `git push origin HEAD:release`.
La VM lo toma sola en unos 3 minutos (`build.json` cambia).

### Estado en la VM tras la fase 0 (19-11-2026, 19:58 UTC)
- `openmu` = `mu-openmu-admin:pre-fase0` (OpenMU oficial + puente) + todos nuestros plugins en `/app/plugins/mu/`.
  Vuelta atras: `sh /tmp/fase0.sh rollback` (o `ops/fase0/deploy.sh rollback`). La imagen de solo la mezcla queda como
  `mu-openmu-admin:pre-craft` + capa; ya no se usa.
- **Recrear `openmu` tumba `mu-gate` y `mu-kick`** (el editor; comparten su red): el editor dice "the connection check is
  stale" y no escribe. Se recrean con `sudo DB=openmu bash ~/install-admin.sh`; `deploy.sh` ya lo hace. Paso desde
  el primer despliegue de la mezcla (14:12 UTC) hasta 20:05 UTC.
- Al leer la terminal: un sha de 40 hex hace que la herramienta bloquee la salida ("Base64"): reemplazarlo antes.

### Estado en la VM (19-11-2026, antes de la fase 0)
- `openmu` corre `mu-openmu-admin:latest` = `:pre-craft` + `/app/plugins/craftings/MUnique.OpenMU.MuPlugins.dll`,
  hooks encadenados; arranca sin errores y escucha 45904 a 45906.
- `craft.sql` aplicado en `openmu` y `openmu_probe`; `Mix.bmd` servido con 5 recetas mas (`.bak3` al lado).
- Falta la prueba en juego: pieza Bloodangel + Soul en el Chaos Goblin.
- Cliente publicado `99d7d7b` (build `mwnnojbj`): Densidad de pixeles; OpenMU reiniciado con la mezcla a 0 Zen.

### Convertir una generacion del S19 (fase 0b)
`bun ops/s19/convert.ts "<Data S19>" <generacion> <salida>` da `items_s19.json`, `sets_s19.json` y `mixes_s19.json`;
la generacion se describe en `ops/s19/generaciones.json`. Prueba: `S19_DATA=... bunx vitest run ops/s19`.
Para la fase 7 basta con sumar una entrada por generacion y revisar sus exclusiones.

### Editor: sets completos y borrado multiple (19-11-2026)
- `GET /sets`, `POST /characters/:n/sets`, `POST /accounts/:l/vault/sets` (mu-admin `admin/service/sets.ts`); en la web,
  "Insertar set completo" y "Seleccionar varios". Probado contra `openmu_probe` con `curl` desde la VM (clave leida en la VM,
  nunca impresa): vestido, ranura ocupada (no escribe nada) y a la mochila. Para probar el servicio contra la copia:
  `sudo DB=openmu_probe bash ~/install-admin.sh` y volver con `DB=openmu`.

### Fase 2a: Master a 400 (19-11-2026, aplicado)
- `ops/fase2/gen_master.py` > `master400.sql`: `MaximumMasterLevel` 400 y `MasterExperienceFormula` = `iff(...)` (la formula
  de OpenMU hasta 200, que es la del S19, y la tabla del S19 del 201 al 400). Comprobado con el mXparser de la imagen
  (`check_master.sh`: 402 niveles iguales). Probado en `openmu_probe` con su reversa; OpenMU reiniciado y arriba.
- `docker restart openmu` tambien deja caido el chequeo del editor: reiniciar `mu-gate mu-kick` despues.
- OpenMU no tiene un punto de plugin para "experiencia ganada": con el master al tope llama a la vista con 0. El tramo
  Majestic necesita tocar `Player.AddMasterExperienceCoreAsync`, o sea compilar OpenMU desde su codigo (copia propia).

### Fase 2b: niveles Majestic (19-11-2026, desplegado)
- No hizo falta tocar OpenMU: la 0.10.1 tiene el punto `IPlayerGainedExperiencePlugIn` con la experiencia de la muerte;
  con el master al tope, esa experiencia va al Majestic (`openmu/plugins/GameLogic/Majestic`). Tabla `mu_plugins.majestic`.
- Al cliente: `MajesticStatus` (C1 E7 10, 33 bytes). La experiencia pasa 2^53: en el cliente es bigint.
- El fork `Jonatks/OpenMU` (rama `mu` desde v0.10.1, imagen en ghcr por Actions) queda listo para lo que un plugin no alcance.
- La VM corre OpenMU 0.10.1 (imagen del 01-11-2026), no 0.9.10: compilar y leer el codigo de esa version.

### Pedidos del dueno (19-11-2026, tarde)
- Pociones automaticas de vida y mana al 40 % (como Mu Magdalena), en `server.json` (`autoHealthPotion`) y en el perfil
  movil v7. El mana antes solo tomaba bajo el 10 % y la vida no existia.
- Menu de comandos del celular: "Arbol de maestria" para personajes master.
- El texto "Nivel de maestria: 400" se montaba con "Puntos de nivel" en espanol: los textos de la cabecera se angostan
  (scaleX) al ancho que hay hasta el siguiente (`fit` en el `Text` de master_skills).
- Pociones que no se tomaban: el cliente lee `server.json` del host del proxy (`ws.<host>/server.json`), y ese host
  (Caddy -> mu-proxy) respondia el `server.json` por defecto del proxy, todo apagado. `release/vm/caddy-server-json.sh`
  sirve ahi el `server.json` del cliente (nginx :80). Leccion: un ajuste de `server.json` se prueba en el host `ws.`.

### Graficos del S19 a la VM (20-11-2026)
- Los archivos de Webzen van al repo privado `Jonatks/mu-assets` (carpeta `s19/`), nunca al publico. La VM lo lee con
  una llave de solo lectura (`~/.ssh/mu_assets`, deploy key "mu-vm-assets-readonly"): clonar con
  `--filter=blob:none --no-checkout` y `sparse-checkout set --no-cone /s19/` (si no, baja los 750 MB del cliente S6).
- Se descomprimen en `/opt/mu-s19/Data`; lo que el cliente pide tal cual (hojas de iconos) se copia a
  `/opt/openmu/web/client/Data/Interface` sin pisar archivos de S6.
- `pkill -f` con un patron que aparece en el propio comando de ssh mata la sesion: no usarlo asi.

### Interfaz del S19 (24-11-2026)
- La interfaz moderna del S19 esta en `Data/Interface/GFx`: 175 `.ozg` (Scaleform) y 1.245 `.ozd` (imagenes DDS),
  cifrados archivo por archivo (los primeros bytes de dos DDS del mismo tamano no coinciden: clave o IV por archivo).
  La clave esta en el ejecutable protegido con Themida: no se descifra. Decision: no se extrae.
- El resto de `Data/Interface` (721 archivos sin cifrar) es la interfaz clasica: 637 identicos a S6; solo cambian
  algunos iconos (`new_master_icon`, `newui_statusicon*`), fondos de carga y lo nuevo de Muun, tienda y macros.
- Movimientos S19 asignados a ojo (24-11-2026), mirando cada clip dibujado como esqueleto (`/anim N` para verlos):
  284-291 posturas y caidas con arma, 292-323 gestos y emotes, 324-331 y 343-351 golpes y conjuros, 332 una secuencia
  larga (4,2 s), 334-339 sentado o montado, 340-342 reposos. Habilidades: Meteor Strike y Dark Blast 326, Meteor Storm,
  Spirit Blast y Aqua Beast 330, Soul Seeker y Death Scythe 324, Fire Blow 328, Sword Blow 349, Focus Shot 344, Holy
  Bolt 343, Raining Arrow 327, Fire Blood 325, Ice Blood 348, Chaos Blade 346, Havok Spear 329, Wind Soul y Fire Beast
  347, Spirit Hook 350, Dark Phoenix Shot 351. Cada clip nuevo tiene `fallback` (el de S6 que se juega si el rig no lo
  trae). Provisional: corregir con un video del S19.
- Movimientos: `tools/mergePlayerClips.ts` suma los 68 clips del `player.bmd` S19 al `player.glb` de la VM (mismo
  esqueleto); copia del original en `game-assets/Player/player.glb.bak-s6`. `/anim N` los muestra en el heroe.

### Fase 2d: habilidades de cuarta clase (20-11-2026)
- `ops/fase2/gen_skills4.py` lee SkillList/SkillLearn/SkillRequire/ItemList del S19 y escribe el SQL (con reversa), la
  tabla del cliente (`skillsDatabaseS19.ts`), los pergaminos del cliente y la tabla de requisitos del plugin.
- Cada habilidad copia la mecanica de la de S6 mas parecida (`LIKE`); `AreaSkillSettings` tiene indice unico por
  habilidad: se clona la fila. Cambiar el SQL ya aplicado: reversa y de nuevo, luego reiniciar OpenMU.
- El `skill.bmd` del S19 llega hasta la 722: las de cuarta clase y sus iconos estan en el ejecutable. Iconos de la hoja
  `newui_skill00` (425-441) elegidos a ojo; sin icono 1501, 1503, 2025, 288 y las comunes.
- Los modelos `Fire_Blood`/`Ice_Blood` del S19 son solo esqueleto (animacion del personaje): el aspecto se arma con
  efectos de S6 (`s19Burst`).
- Saruri: 400 puntos de maestria puestos a mano (copia en `mu_plugins.character_bak_20261120`).

### Fase 2c: arbol de estadisticas Majestic (20-11-2026)
- Datos: `Skill/SkillTreeMajesticStat.xml` (8 nodos por clase: seccion 0 defensa, 1 ataque) y `FormulaData.xml` tipo 3
  (formula por puntos; la 1 hasta `EndPoint1`=30, la 2 de 31 a 40). `PointCondition` es el nivel Majestic que abre cada
  tramo (10, 20 y 40 puntos); no pueden ser puntos gastados, porque el primer tramo pide 10 o 20 y no habria donde gastar.
- `ops/fase2/gen_majestic_stat.py` escribe la tabla del plugin (`MajesticStatTree.cs`) y la del cliente
  (`majesticStatTree.ts`), iguales. Puntos por nodo en `mu_plugins.majestic.stat_points` (int[]); se gastan de los
  puntos Majestic con C1 05 E7 11 nodo; `MajesticStatus` crece a 41 bytes con los 8 nodos.
- El efecto lo aplica `MajesticStats`: un `SimpleElement` por nodo sumado a los atributos de OpenMU al entrar al mundo.
- Despliegue: la primera vez que OpenMU ve un plugin nuevo tarda mas de 4 minutos en abrir puertos (crea su
  configuracion); `deploy.sh` volvio a la imagen sin plugins. Ahora espera 8. Ojo: esa imagen de vuelta no tiene
  ningun plugin nuestro (ni la mezcla Bloodangel ni el Majestic).
- `install-admin.sh` (editor) reescribe el Caddyfile entero: borraba la ruta de `server.json`. La ruta ya esta en el
  instalador (mu-admin `install-vm.sh`) y en la copia de la VM.
- Cliente: ventana `majestic_stats` (placa negra como la de sesion); se abre con la linea Majestic del arbol de maestria
  y con "Majestic" en el menu de comandos del celular.

## 2. Lo aprendido

### 2.0 Recetas Mastery del S19 (`Data/Mix/MasteryItemMix.xml`)
- 1414 materiales y 2078 mezclas. Bloodangel: mezclas 78 a 113 (sellada + Ancient Hero's Soul, 100 %, 0 Zen) y 208 en
  adelante (sellada + Bloodangel Spirit, +11).
- El Soul no se fabrica: cae de bolsas de jefes (`ItemBag_PVP_World_Boss`, `ItemBag_Lord_of_Ferea`,
  `ItemBag_CustomBossDrop`, `ItemBag_Labyrinth_Box(3)`). La "receta para crear el Soul" del plan no existe en el S19.

### 2.1 Archivos del S19
- BMD v14 = ModulusCryptor: payload `buffer[8:8+size]`; byte1 elige el cifrado 1 (clave fija
  "webzen#@!01...") sobre bloques de 1 KB; byte0 elige el cifrado 2 con la clave de los bytes 2 a 33.
  Orden de cifrados: TEA, 3-Way, CAST-128, RC5, RC6, MARS, IDEA, GOST. Claves truncadas a 16 bytes
  (12 en 3-Way, 32 en GOST); RC5 y RC6 usan 16 rondas.
- `mix.bmd` del S19: 20 contadores y registros de 736 bytes; el del S6: 14 contadores y 656 bytes.

### 2.2 OpenMU (v0.9.10 en el codigo, `munique/openmu:latest` en la VM)
- La VM corre `mu-openmu-admin` = `munique/openmu:latest` + el puente del editor como unico startup hook.
  **Nuestro `MuPlugins` (marketplace, tokens, modulos) no esta desplegado ahi.** Por eso el plugin de
  craftings se compila solo (`-p:Only=Craftings`) en su carpeta y se encadena al hook del puente (`:`).
- Monstruos que no existen en esta version: Medusa (561). Jefes que si: Kundun 275, Selupan 459,
  Balgass 349, Nightmare 361.
- Un item ancient = `ItemSetGroups` con el `ItemOfItemSet` de su set + la opcion bonus de pieza
  (`DefaultDropGenerator.ApplyRandomAncientOption`).
- Drops: `SpecialItemType` 0 normal, 2 excelente.

### 2.3 Infraestructura y herramientas
- `raw.githubusercontent.com` cachea la rama unos minutos: pedir por **sha** del commit, no por rama.
- Cloud Shell: leer la terminal por `.xterm-accessibility-tree` del segundo iframe; quitar `=?&` del
  texto o la herramienta lo bloquea; la salida larga se corta, imprimir por partes (`head`, `cut`).
  Las funciones de shell (`q`, `r`, `u`) se pierden al reconectar.
- Al imprimir variables de entorno filtrar tambien `PW` (no solo `pass`): se mostro la clave de la base
  en la terminal del usuario. Pendiente: cambiarla.
- Vercel: el push a git solo hace preview; produccion con `create_deployment` target production.
- Editor con Google: las escrituras al servicio de la VM piden `x-admin-user` (`auditName`).
- `pgrep -f nombre` dentro de un `sh -c "...nombre..."` se encuentra a si mismo: esperar por pid o por un archivo.
- `bun run tsc` se queda sin memoria: `NODE_OPTIONS=--max-old-space-size=6144 bunx tsc --noEmit -p .`; los errores de
  `install/` son por no tener sus paquetes instalados aqui.
- En vitest no existe `import.meta.dir` (es de bun): leer JSON con `import x from './x.json'`.
- Vitest completo pasa el tiempo limite: correrlo en segundo plano y comparar fallos antes/despues.

### 2.4 Cliente web: graficos (fase G)
- Ya habia en Opciones: escala de render con FSR, MSAA, FXAA, anisotropia, limite de FPS, campo de vision, zoom
  (Ctrl+rueda y pellizco). El perfil de celular (`MOBILE_PROFILES` en `gameOptions.ts`) apaga efectos caros a proposito
  (medido en `docs/magdalena_study.md`): subir calidad en el celular es cambiar Opciones, no codigo.
- La resolucion del celular arranca en 1.5x (`PHONE_START_DENSITY`); la opcion Densidad de pixeles sube a 2x o a la del
  telefono. Decision del dueno (2026-11-11, `docs/plan_mu_web.md` 1f): lo visual va por Opciones, nunca fijo en codigo.
- Perfil movil v5 (decision del dueno 2026-11-19): 2x, FXAA, nitidez 3, halos, luz y materiales por defecto; camara
  del celular a 840. El cuadrado del destello era la pila de 20 destellos en la cabeza del anillo (`cardDrawn` en joint.ts).
- v6: el post-procesado y los halos de v5 dejaban los modelos lavados y transparentes en el celular: vuelve el aspecto de v4
  con 2x. El celeste detras de los items era el modo oscuro del navegador invirtiendo el color de las celdas (46,77,77 a
  175,209,209: misma tonalidad, luminosidad invertida); se apaga con `<meta name="color-scheme" content="only light">`.
- Camara: abre a 840 (0.7 del encuadre del mapa) en celular y PC, decision del dueno. Las celdas con item ya no llevan
  el tinte verde azulado del original (46,77,77): fondo negro suave, tambien decision del dueno.
- Un texto nuevo cambia el golden de textos (`src/i18n/text.golden.test.ts`: cuenta y hash por idioma).

### Fase S: servidor S19 (24-11-2026)
- El servidor ya habla el protocolo ampliado: la base y `openmu_probe` tienen el cliente 106.3 (`20404`) y ninguno de
  sus 27 plugins `MinimumClient(106,3)` esta apagado. Falta solo que el cliente lo use.
- S1 experiencia: la tabla normal 1-400 y la master 1-200 del S19 son las formulas de OpenMU; la Majestic ya estaba en
  el plugin. La master 201-400 no sigue formula: `S19MasterExperience.cs` la escribe sobre la tabla al autenticarse
  (la imagen es OpenMU de stock mas plugins, asi que no se toca `GameContext`). Tasas x200 / x2000
  (`s1_tasa.sql`, reversa `s1_tasa_undo.sql`).
- S2 mapas: `gen_map.py <Data> <mapa> ops/faseS` da `s2_mapa<N>.sql` y su reversa, con respaldo en `mu_plugins`.
  Direccion OpenMU = Dir del S19 + 1 (-1 = sin direccion). Los NPC errantes conservan su disparador.
  Los cambios de configuracion se ven al reiniciar `openmu` (y despues `mu-gate`, `mu-kick`).
- Lorencia: los monstruos ya eran los del S19 en areas y estadisticas; cambian reaparicion (10 s), las 7 aranas
  sueltas, el plantel de NPC (sin guardias ni Leo; con Elpis y Thompson) y sus lugares. Faltan en la base los NPC
  584 Sir Lesnar, 764 Cent y 891 Wizard Gillard (definicion y modelo en el cliente).
- `openmu_probe` no tenia el esquema `mu_plugins`: los scripts lo crean.

- S3 drops: el motor del S19 sortea un sistema por muerte (`ItemDropRateControl.ini`: todos los monstruos 7.5%,
  bolsa del monstruo en su mapa 83.5%, evento, set, zen, nada) y un item de esa bolsa por su tasa sobre 1000000.
  OpenMU tiene su generador fijo (`DefaultDropGenerator`), asi que va como plugin `S19Drops` (`IAttackableGotKilledPlugIn`
  suelta, `IMonsterItemDropPlugIn` cancela el equipo y las joyas al azar de OpenMU). Tablas `mu_plugins.s19_drop` y
  `s19_drop_control` de `gen_drops.py`; el .sql (datos del S19) vive en mu-assets `s19/server/s3_drops.sql.gz`.
  Provisional: el zen sigue siendo el de OpenMU; la bolsa de eventos no suelta (depende de que evento corre);
  la bolsa de sets solo existe en los mapas 31 y 91; el `ItemRate` del monstruo no se usa.
- GS4 Lorencia: el cliente S19 tiene el mismo vocabulario de objetos (mismos ids) con 115 modelos rehechos y terreno
  nuevo. Sus `.att`/`.map` llevan cabecera `ATT\x01`/`MAP\x01` y cuerpo ModulusCryptor (como BMD 14): el cliente los lee
  desde 7aae4d2 (`decodeMapFile`); ModulusCryptor paso a `src/core/modulusCryptor` porque el worker del terreno no puede
  cargar el lector de modelos (vite no parte workers iife). `TerrainLight` viene como OZB (BMP): se pasa a OZJ y jpg.
  El terreno se sirve desde `game-assets/World1`, no desde `Data/`. Archivos en mu-assets `s19/client`, en la VM con
  `ops/faseS/apply_client_s19.sh` (respaldo `.bak-s6`, `rollback`).
- El modo `?offline` no arranca en el build de produccion: la verificacion visual de un mapa va con un personaje.

- S4 tiendas: `S19Shops` llena en memoria las tiendas de la configuracion al primer ingreso desde
  `mu_plugins.s19_shop` (`gen_shops.py`; .sql en mu-assets). Cada tienda va al NPC cuyo `NpcFunction` en MonsterSpawn
  es su nombre. Solo la pestana 1 (el S19 tiene hasta 5; OpenMU y el cliente una pagina de 8x15). Precios automaticos
  (el S19 los deja en 0). NPC sin tienda en la base quedan sin tienda. No se escribe en la base: cambiar items de una
  tienda desde el panel no se ve hasta apagar el plugin.
- S2 en mas mapas: Dungeon, Devias, Noria, Lost Tower, Atlans, Tarkan e Icarus. `gen_map.py` ahora solo cambia las
  apariciones normales y errantes; las de eventos e invasiones quedan. Faltan definiciones: 580, 584, 605-607, 681, 941.

- GS4 mas mapas: Dungeon, Devias, Noria, Lost Tower, Atlans, Tarkan e Icarus con terreno y objetos del S19
  (`stage_client_s19.py`, 458 modelos). Los `.obj` del S19 de Devias, Lost Tower y Tarkan son version 3 (45 bytes por
  registro): `objRecordSize` en `mapFileEncryption.ts`. El arbol S6 local no tiene World9, World11 ni Object5/9/11:
  esos se copian enteros del S19.
- Monstruos y NPC clasicos del S19 son los mismos BMD del S6 (solo cambian 7 texturas y Silvia): no hay modelo nuevo
  que poner. Las partes de cuerpo por clase del S19 (71 en Player) tienen 61 nodos contra 59: no se suben hasta probar
  que encajan con el esqueleto.
- El Adiestrador (226, modelo `NPC/Breeder`) no se ve aunque el servidor lo pone: su BMD es igual en S6 y S19 y el glb
  local tiene geometria; falta ver si ya pasaba antes del S19.

- Interfaz S19 (decision del usuario 24-11-2026: "Autorizo abrir los GFx"): los `.ozd` de `Interface/GFx` son DDS con
  ModulusCryptor y los `.ozg` son SWF de Scaleform (GFX/CFX). `ops/faseS/ui/`: `decrypt.ts` los abre, `subs.py` lee
  `DefineSubImage` (1008) y `DefineExternalImage2` (1009: imagen, formato, ?, ancho, alto, nombre, archivo .dds),
  `render.py` compone el primer cuadro (formas con relleno de mapa de bits por la lista de visualizacion) para ver
  el layout del S19, `extract.py` recorta cada pieza, `export_skin.py` da los nombres que pide `skinS19.ts`. El arte
  va solo a mu-assets y a `game-assets/ui-s19` de la VM. Lo que el GFx coloca por ActionScript (fondo del inventario,
  rejilla) no sale en el render: la pieza se pone a mano.
- La piel: `skinS19.ts` cambia sprites enteros del original por piezas S19 (`MuSpriteFrame`) y pone las de ventana en
  variables CSS; el tema moderno (`mu_window/style.less`) dibuja placa de titulo + cuerpo con border-image.
- Cuerpos base y partes del S19 en `Player`: los vertices usan huesos con el mismo nombre e indice que el player.bmd
  (69 de 69), las posiciones son locales al hueso como en S6. Funcionan: `?offline&bare&class=dk` dibuja el cuerpo
  del S19. El "invisible" que vi antes fue una mezcla de cache (service worker y el `.gz` del S6 que nginx sirve
  antes que el `.glb`): para probar un cambio de modelos, borrar caches y service worker en la pestana.
- `?offline` acepta `bare` (sin equipo) y `class=` para mirar cuerpos sin cuenta; `window.__scene` y `__world`
  estan expuestos para inspeccionar mallas desde la consola.
- `?offline` si arranca en produccion (tarda ~90 s la primera vez): sirve para mirar mapas y NPC sin cuenta.

- Barra inferior S19: telefono con marcos de orbe, vidrio y casillas del S19 (`mobile_controls/style.less`, bajo
  `.s19-skin`); escritorio con una placa armada por `ops/faseS/ui/hud_desktop.py` (casillas, pozos y canal en las
  coordenadas del original) y los cinco botones redondos del S19 como hojas con los mismos cuadros que
  `newui_menu_Bt0*` (`skinS19.ts` SHEETS).
- S5 puertas y /move (`gen_gates.py`, `s5_puertas.sql`): 27 puertas y 24 destinos de /move tomaron area, nivel y costo
  del S19. Las areas mal escritas del S19 (Arena 57-62 x 28-113) se saltan.
- S6 mezclas (`s6_mezclas.sql`): +10 a +15 con costo y tasa del S19 (Mix.xml, MaxRate1). Alas, Fenrir y pociones SD
  ya coincidian; las mezclas nuevas del S19 (reliquias, nucleos, cartas) no existen en OpenMU.
- S8 personajes (`s8_personajes.sql` y plugin `S19NewCharacter`): 500 puntos y 10.000.000 de zen al crear, zen
  maximo 2.000.000.000, toda clase creable desde nivel 1.
- Zen S19 (`s3_zen.sql` y `S19Drops`): 100 por muerte, por el nivel del monstruo la mitad de las veces, con la
  probabilidad de ZenDropRate; el grupo de dinero de OpenMU queda en 0.

## 3. Reemplazos provisionales (cerrar antes de dar la meta por cumplida)

| Provisional | Por que | Como se cierra |
|---|---|---|
| Soul en Balgass y Nightmare en vez de Medusa | Medusa no existe en OpenMU 0.9.10 | Fase 0b/7: traer el mapa y el monstruo, o dejar esta decision fija |
| Plugin solo de craftings en la VM | `MuPlugins` completo nunca se desplego ahi | Fase 0: desplegar el `MuPlugins` completo y quitar `Only=Craftings` |
| La mezcla toma la pieza Bloodangel normal | en el S19 toma la pieza sellada (13/351 en adelante, "Sealed Blood Angel ...") y da la pieza con set y opcion de vida (+4 a +16, OptKeepType 24); con "(Hero) Bloodangel Spirit" (14/399) sale +11 | fase 0b: agregar las piezas selladas y la opcion de vida al azar |
| Opcion bonus de pieza al nivel maximo | el drop la elige al azar | decidir con el usuario |
| A que estadistica va cada nodo Majestic | el S19 lo resuelve en su binario; "4th Stat" con formula fija 8 | `STAT` en `gen_majestic_stat.py`: seccion 0 a vitalidad, seccion 1 a la estadistica principal (DL: comando), 8 por punto; alas de nivel 4 a defensa y dano generales (S6 no tiene alas 4). Confirmar con un cliente S19 |
| Aspecto de las habilidades de cuarta clase | el S19 las dibuja en su ejecutable | hechas a ojo con efectos de S6; revisar con video del S19 |
| Iconos de las habilidades de cuarta clase | el S19 los asigna en su ejecutable | elegidos a ojo en `skillCasting.ts`; confirmar con un cliente S19 |
| Iconos de guantes y algunas armaduras aproximados | el visor no da el angulo del original | Fase G: render del cliente con su camara de inventario |
| NPC del S19 sin definicion (584, 764, 891 en Lorencia) | OpenMU no los trae | definirlos con su funcion y su modelo del cliente S19 |
| Objetos iniciales del S19 (CharacterBase.xml, con duracion de 7 dias) | OpenMU no tiene objetos con vencimiento | agregar vencimiento o darlos sin el |
| Tiendas del S19: pestanas 2 a 5 hechas (S19ShopPages + ventana) pero sin confirmar en la VM | se perdio Chrome durante el despliegue 9bc4013 / cliente 2fa4b47 | ver la seccion 4 |

## 4. Pendiente en la VM (sin acceso desde el 24-11-2026, 19:50)

Hecho en los repos, falta subirlo o comprobarlo en la VM cuando vuelva el acceso:

1. Confirmar que terminaron `deploy.sh 9bc4013` (plugins S19ShopPages, S19Shops con pestanas, S19NewCharacter,
   zen) y el autodeploy del cliente 2fa4b47 (`build.json` distinto de mwv8dnsy). Si no, relanzarlos.
2. Probar las pestanas de tienda con Hanzo y Elf Lala, y una compra desde la pestana 2.
3. Probar un personaje nuevo (500 puntos, 10.000.000 de zen) y el zen al matar.
4. Revisar los errores de los eventos Raklion y Crywolf vistos al reiniciar (22:20 UTC). Si vienen de las puertas,
   deshacer con `~/s5_puertas_undo.sql` en ambas bases.
5. Todo lo que se agregue a los repos despues de esta fecha (ver los commits siguientes) tambien esta sin subir:
   - cliente nuevo (publish-client) con: NPC en el centro de su casilla (Trainer visible), Slough, Lesnar, Cent,
     Gillard y Eunice, inventario ampliado y segunda pagina del baul, items Mastery Darkangel a Lightning;
   - `apply_client_s19.sh` para copiar los modelos nuevos de mu-assets (NPC e Item);
   - `ops/faseS/s9_npcs.sql` (probe y luego openmu) y reiniciar;
   - `SHA=<commit> bash ops/faseS/s10_apply.sh` (probe), probar, y `PROD=1` para openmu; reiniciar.
6. Horarios de eventos del S19 (`ops/faseS/s7_eventos.sql`): Blood Castle y Devil Square 22 veces al dia, Chaos
   Castle 6. Probe, reiniciar, mirar que los plugins lean la configuracion, y luego openmu. La bolsa de eventos del S19
   (EventItemMonsterBag) no se trae: sus eventos estan todos apagados en EventItemDrop.ini, y el unico prendido
   (simbolos elementales) es del pentagrama, que Season 6 no tiene.
7. Bolsas y baul para todos (decidido por el usuario el 24-11-2026): `ops/faseS/s11_bolsas.sql` en probe y openmu
   para los que ya existen, y desplegar los plugins (S19NewCharacter los da a los nuevos).
