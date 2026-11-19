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
`tools/ignies-client/build-release.sh` pide `Data/` local (aqui ya no esta). Como el zip excluye `Data/`,
`game-assets/` e `items/`, basta: `APP_ENV=prod vite build`, copiar `release/vm/server.json` y `serverlist.md` a `dist/`,
zip con las mismas exclusiones, comparar la lista de archivos con el zip anterior, y `git push origin HEAD:release`.
La VM lo toma sola en unos 3 minutos (`build.json` cambia).

### Estado en la VM (19-11-2026)
- `openmu` corre `mu-openmu-admin:latest` = `:pre-craft` + `/app/plugins/craftings/MUnique.OpenMU.MuPlugins.dll`,
  hooks encadenados; arranca sin errores y escucha 45904 a 45906.
- `craft.sql` aplicado en `openmu` y `openmu_probe`; `Mix.bmd` servido con 5 recetas mas (`.bak3` al lado).
- Falta la prueba en juego: pieza Bloodangel + Soul en el Chaos Goblin.
- Cliente publicado `99d7d7b` (build `mwnnojbj`): Densidad de pixeles; OpenMU reiniciado con la mezcla a 0 Zen.

### Convertir una generacion del S19 (fase 0b)
`bun ops/s19/convert.ts "<Data S19>" <generacion> <salida>` da `items_s19.json`, `sets_s19.json` y `mixes_s19.json`;
la generacion se describe en `ops/s19/generaciones.json`. Prueba: `S19_DATA=... bunx vitest run ops/s19`.
Para la fase 7 basta con sumar una entrada por generacion y revisar sus exclusiones.

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

## 3. Reemplazos provisionales (cerrar antes de dar la meta por cumplida)

| Provisional | Por que | Como se cierra |
|---|---|---|
| Soul en Balgass y Nightmare en vez de Medusa | Medusa no existe en OpenMU 0.9.10 | Fase 0b/7: traer el mapa y el monstruo, o dejar esta decision fija |
| Plugin solo de craftings en la VM | `MuPlugins` completo nunca se desplego ahi | Fase 0: desplegar el `MuPlugins` completo y quitar `Only=Craftings` |
| La mezcla toma la pieza Bloodangel normal | en el S19 toma la pieza sellada (13/351 en adelante, "Sealed Blood Angel ...") y da la pieza con set y opcion de vida (+4 a +16, OptKeepType 24); con "(Hero) Bloodangel Spirit" (14/399) sale +11 | fase 0b: agregar las piezas selladas y la opcion de vida al azar |
| Opcion bonus de pieza al nivel maximo | el drop la elige al azar | decidir con el usuario |
| Iconos de guantes y algunas armaduras aproximados | el visor no da el angulo del original | Fase G: render del cliente con su camara de inventario |
