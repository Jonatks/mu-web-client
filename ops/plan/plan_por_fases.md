## 18. Plan por fases (versión 4)

Base: secciones 1 a 17. Nada se implementa hasta que apruebes cada fase.

Reglas de trabajo:
- Lo aprendido, las recetas que ya funcionan y los reemplazos provisionales van en [bitacora.md](bitacora.md), al dia en cada paso.
- Cliente: solo en la rama `contenido-temporadas` de `mu-web-client`. La fusión a `release` y el despliegue los hace el otro chat.
- Servidor, datos: los edito yo desde Cloud Shell, con respaldo previo y probando antes en `openmu_probe`.
- Servidor, código: se programa en una copia propia de OpenMU que se compila y se despliega en tu VM (fase 0). Todo lo que pediste que se programe (earrings, Muun, pentagramas, Ruud, nivel alto, eventos y clases) va ahí.
- Archivos de clientes nuevos (mapas, modelos, clases, íconos): los consigues tú. Yo tomo de ellos solo las partes que cada fase necesita.

### Cobertura de tus pedidos

| Pedido | Fase |
| --- | --- |
| Sets ancient clásicos | 1 (12 sets) y 15 (6 sets sin base) |
| Sets y armas Mastery | 3 (Bloodangel) y 7 (10 generaciones más) |
| NPC con tienda (Priest James) | 3 (en zen) y 6 (en Ruud) |
| Recetas nuevas | 3, 5, 7 y 8 |
| Bonus de set | 1, 3, 7 y 15 |
| Nivel máximo superior a 400 | 2 (tramos Master 400 y Majestic 900, como el S19) |
| Usar archivos de Season 19 en tu Season 6 | 0b |
| Inventario, baúl y espacios especiales | 4 (ampliaciones), 6 (Gremory Case), 8 (ranuras de earring), 9 (ranura de pentagrama), 10 (inventario de Muun) |
| Apilado | 4 (medido; se ajusta ahí) |
| Anillos, collares, alas de cuarta y quinta, armas Moss | 5 |
| Ruud | 6 |
| Earrings | 8 |
| Pentagramas, errtel y elementos | 9 |
| Muun | 10 |
| Mapas nuevos | 11 |
| Jefes y eventos nuevos | 12 |
| Clases nuevas | 13 |
| Modelos reales | 14 (y en cada fase en cuanto tengas los archivos) |

### Resumen de cantidades

| Fase | Ítems nuevos | Sets | Recetas | NPC | Código nuevo |
| --- | --- | --- | --- | --- | --- |
| 0. Preparación | 0 | 1 de prueba | 0 | 0 | Compilación propia de OpenMU y generadores de archivos de cliente |
| 0b. Adaptación S19 a S6 | 0 | 0 | 0 | 0 | Tabla de equivalencias, convertidor y lectura de modelos S19 |
| 1. Sets ancient clásicos | 0 | 12 | 0 | 0 | No |
| 2. Tramos Master y Majestic | 0 | 0 | 0 | 0 | Master a 400, tramo Majestic 1-900 con su árbol, requisito por nivel total |
| 3. Generación Bloodangel | 46 | 7 | 2 | 1 | Clase de recetas Mastery |
| 4. Inventario y baúl | 5 | 0 | 0 | 0 | Ventanas del cliente y 3 misiones de Zyro |
| 5. Joyería, alas y armas Moss | 33 | 0 | 4 | 0 | Apuesta de Moss, si no existe |
| 6. Ruud, James con Ruud y Gremory Case | 29 | 0 | 0 | 0 | Moneda, caja y almacén nuevos |
| 7. Generaciones Mastery 2 a 10 | ~400 | 63 | 18 | 0 | Reutiliza la clase de la fase 3 y el convertidor (la 11 necesita un cliente más nuevo) |
| 8. Earrings | 16 | 0 | 5 | 0 | 2 ranuras nuevas de equipo |
| 9. Pentagramas y errtel | 28 | 0 | por definir | 1 (Adniel) | Sistema de elementos y 1 ranura |
| 10. Muun | 106 Muun, más piedras | 0 | 0 | 1 (Monica) | Inventario y sistema de Muun |
| 11. Mapas nuevos | 0 | 0 | 0 | por mapa | Terreno y objetos de cliente nuevo |
| 12. Jefes y eventos nuevos | por evento | 0 | 0 | por evento | 3 eventos y sus jefes |
| 13. Clases nuevas | por clase | por clase | 0 | 0 | 9 clases, una por una |
| 14. Modelos reales | 0 | 0 | 0 | 0 | Cambio de modelos prestados por reales |
| 15. Los 6 sets sin ítem base | por definir | 6 | 0 | 0 | Necesita ítems de cliente nuevo |
| G. Gráficos e interfaz | 0 | 0 | 0 | 0 | Opciones Enhanced/Ultra: resolución, suavizado, cámara, luz, tema de ventanas, texturas HD |

Con las fases 1, 3, 7 y 15 tu cliente pasaría de 49 a 144 sets. El archivo de sets guarda el número de set en un byte, así que el tope real es 254: alcanza, pero hay que subir el tope de 64 en mu-web (fase 3).

### Fase 0. Preparación

Estado de cada punto: [../fase0/readme.md](../fase0/readme.md). Fase 0 cerrada el 19-11-2026. Fase 1: los 12 sets cargados en el servidor (Bes Eclipse y 11 más). Siguen el editor (borrar varios ítems e insertar set completo, hecho) y la fase 2.

1. Rama `contenido-temporadas` desde `release`.
2. Respaldo completo de la base `openmu`, y otro antes de cada fase.
3. Copia propia de OpenMU con su compilación y despliegue en tu VM, y la forma de volver a la versión actual si algo falla.
4. Generadores de los archivos de cliente: sets (`itemsettype.bmd` y los 4 de opciones) y recetas (`mix.bmd`). Prueba: leer y reescribir sin cambios da archivos idénticos.
5. Scripts SQL repetibles con su reversa.
6. Set piloto: Bes Eclipse (2 piezas), probado en el juego.

### Fase 0b. Adaptación S19 a S6

El servidor sigue siendo tu OpenMU (Season 6) y el cliente tu cliente web. Del S19 se toman datos y gráficos, nunca su protocolo.

1. Gráficos (hecho): el cliente web lee los modelos BMD versión 14 (ModulusCryptor con TEA, 3-Way, CAST-128, RC5, RC6, MARS, IDEA y GOST) y las texturas OZD; probado con 2020 modelos y 1245 texturas del S19. Mapas (ATT/MAP/OBJ cifrados igual) se comprueban en la fase 11. Las ventanas Scaleform (`.ozg`) no se usan: se redibujan en el cliente web con sus imágenes.
2. Tabla de equivalencias (`ops/s19/equivalencias.json`): grupos 16-20 del S19 a números libres de los grupos 12-15 (el protocolo S6 guarda el grupo en 4 bits); números ya usados en S6 a números libres (2/22 a 2/30); sets del S19 (hasta 342) renumerados desde 62 (el cliente guarda el set en 1 byte); clases S19 a clases OpenMU (3 = tercera clase: 3, 7, 11, 13, 17, 23, 25); opciones S19 a opciones OpenMU.
3. Convertidor (`ops/s19/`, hecho para ítems, sets y mezclas; probado igual a la fase 3): lee `ItemList.xml`, `ItemSetType.xml`, `ItemSetOption.xml`, `MasteryItemMix.xml`, drops y tiendas del S19 y la tabla; genera a la vez el SQL de OpenMU (con reversa) y los archivos de ítems y sets del cliente web, iguales entre sí. Prueba: lo generado para Bloodangel coincide con lo cargado a mano en la fase 3.
4. "Season 6 ampliado" (lista en `ops/s19/readme.md`): el protocolo S6 sin cambios más mensajes propios para lo que S6 no tiene (ranuras de earring, pentagrama y Muun, Ruud, niveles Majestic, experiencia de 64 bits). Lista de mensajes y quién los usa; se implementan en las fases 2, 6, 8, 9 y 10.

### Fase 1. Los 12 sets ancient clásicos con ítem base

Mahes y Bragi (Dark Knight), Bes y Alvis (Dark Wizard), Serket (Elf), Apis y Tyr (Magic Gladiator), Khone y Surt (Dark Lord), Harpy (Summoner), Horus y Magni (Rage Fighter). 12 filas de set, entre 39 y 42 piezas, números de set 50 a 61 en el cliente. Primer paso: fijar las piezas exactas de Harpy y Khone.

### Fase 2. Tramos Master y Majestic

- Datos reales del S19 (`Data/ExpSystem`): Normal 1-400, Master 1-400 (hoy 200), Majestic 1-900, total 1700.
- Master a 400 con su tabla de experiencia (hecho 19-11-2026, `ops/fase2/`); tramo Majestic nuevo con `SkillTreeMajestic.xml` y `SkillTreeMajesticStat.xml` (2b: niveles, experiencia y puntos como plugin, hecho; 2c: árbol de estadísticas, hecho 20-11-2026; 2d: árbol de habilidades).
- El requisito de nivel de los ítems pasa a contar el nivel total (400 + Master + Majestic).
- Necesita la compilación propia de OpenMU (fase 0) y mensajes nuevos del "Season 6 ampliado" (fase 0b).
- Riesgo: la experiencia Majestic acumulada (9,7·10^15) pasa el máximo exacto de JavaScript (9,0·10^15); el cliente debe usar enteros grandes.

#### 2d. Árbol de habilidades Majestic, completo (decisión del dueño 20-11-2026)

El árbol del S19 (`SkillTreeMajestic.xml`, 129 a 319 nodos por clase) se apoya en las habilidades de cuarta clase, que
S6 no tiene. Se traen primero, después el árbol.

| Paso | Qué | Dónde |
|---|---|---|
| 2d-1 | Datos de las ~22 habilidades nuevas (`SkillList.xml`): daño, maná, distancia, área, tipo; pergaminos (`SkillLearn.xml`, ítems 12/290...) y requisitos (`SkillRequire.xml`: habilidad base y nivel de la master) | generador en `ops/fase2/`, SQL con reversa al servidor; `skillsDatabase.ts` y textos al cliente |
| 2d-2 | Lo que S6 no hace de esas habilidades: versiones master de cuarta clase (812, 809, 806, 876, 911, 563) | plugins y datos de OpenMU |
| 2d-3 | Cómo se ven: una por una, por clase (DW, DK, Elf, MG, DL, SUM, RF y las tres comunes), con modelos y texturas del cliente S19 (`Data/Skill`); la coreografía del S19 está en su ejecutable, así que se arma a ojo y queda anotada | `versions/shared/skills/<clase>/<habilidad>/` |
| 2d-4 | El árbol: puntos Majestic, enlaces (`LinkSlot`, `ActiveNextPoints`), padres (`ParentSkill`), mínimo por nodo (`ReqPoints`) y ventana con la disposición del S19 (`PositionTemp`) | plugin Majestic y ventana del cliente |
| 2d-5 | Efectos de los nodos: daño de habilidad y daño de arma primero (atributos por habilidad de OpenMU), después golpes extra, alcance, área y los campos mágicos (sangrado, congelación y sus debuffs) | plugins |

Orden por clase: Dark Wizard primero (Meteor Strike), como receta para las demás.

Estado 20-11-2026: 2d-1 hecho (22 habilidades en `openmu`, pergaminos, requisito por plugin, íconos); 2d-3 primera
pasada hecha (aspecto propio en todas menos Sword Blow y Strong Blessing, que se dibujan como Twisting Slash y Swell
Life). Siguen 2d-2, 2d-4 y 2d-5.

### Fase 3. Generación Bloodangel

- 43 ítems: 33 armaduras, 9 armas y 1 Ancient Hero's Soul.
- 7 sets de 4 piezas con los bonus de Webzen.
- 1 receta en C#: pieza + Ancient Hero's Soul = pieza ancient (hecha). El Soul no se fabrica en el S19: cae de jefes (hecho).
- 3 grupos de drop en Raklion, Vulcanus y Kanturu, hasta que existan sus mapas oficiales (fase 11).
- Priest James en Elvenland con tienda en zen.
- Subir el tope de sets del cliente.

### Fase 4. Inventario y baúl

- 2 ampliaciones oficiales de inventario de 8x4 y 1 de baúl de 8x15, con 3 misiones de Zyro (NPC que ya existe).
- 5 ítems: Magic Cloth, Space Cloth, Ancient Statue, Magic Backpack y Vault Expansion Certificate.
- El servidor ya admite hasta 4 ampliaciones y el baúl doble; falta que tu cliente dibuje las filas extra y el segundo baúl.
- Revisar qué más debe apilarse (por ejemplo las joyas sueltas) con lo medido hoy.

### Fase 5. Joyería, alas y armas Moss

- 3 anillos: Protection Ring, Protector Protection Ring y Ring of Ultimatum.
- 6 collares: Solid Symbol, Necklace of Agony, Jasper, Lapis Lazuli y sus versiones Battle (los 4 de nivel 850 usan los sockets que ya tiene Season 6).
- 7 alas de cuarta y 1 Divine Object, con una receta propia (Webzen no publica las cantidades).
- 7 alas de quinta, 1 Divine Object y 3 materiales (Feather of Uriel, Golden Crest y Ultimate Magic Crystal), con la receta oficial.
- 5 armas Moss y su venta al azar.
- 4 recetas y 33 ítems en total.

### Fase 6. Ruud, James con Ruud y Gremory Case

Moneda Ruud y su ventana, tienda de James en Ruud con 28 piezas selladas, la caja Mastery en 5 eventos (Blood Castle, Devil Square, Chaos Castle, Illusion Temple y Doppelganger) y el Gremory Case (2 almacenes de 50). 29 ítems.

### Fase 7. Generaciones Mastery 2 a 11

De Darkangel a Lightning, 10 generaciones. Cada una: 42 ítems (33 armaduras y 9 armas), 2 materiales (alma de armadura y yunque de arma), 7 sets y 2 recetas de mejora. Total: 440 ítems, 70 sets y 20 recetas.

### Fase 8. Earrings

2 ranuras nuevas de equipo, 10 earrings (5 pares), 1 Lapidary Stone, 4 moldes de mejora y 1 caja de Moss. Mejora de +0 a +15 y 4 recetas para pasar de un par al siguiente. 16 ítems y 5 recetas.

### Fase 9. Pentagramas y errtel

Sistema de 5 elementos (daño y defensa elemental, ventaja entre elementos), 1 ranura de pentagrama, 20 pentagramas, 5 tipos de errtel con 3 rangos, Elemental Powder, Elemental Capsule y el pergamino del quinto socket, y la NPC Adniel. 28 ítems. Primer paso: los porcentajes de mejora de errtel no están publicados y hay que definirlos.

### Fase 10. Muun

Inventario de Muun, 3 ranuras (principal, secundaria y hero), 106 Muun (64 normales, 4 montables, 36 premium y 2 hero), sus piedras de evolución, la NPC Monica y el evento de huevos. Recomiendo empezar con 10 Muun para probar el sistema y luego el resto.

### Fase 11. Mapas nuevos

26 zonas. Primero las que dan drops ya planeados: Acheron (Alkmar y Ubaid), Debenter, Uruk Mountain, Nars, Ferea y Nixies Lake (7). Después el resto, en orden de nivel. Cada mapa necesita terreno, objetos, monstruos y sus apariciones.

### Fase 12. Jefes y eventos nuevos

Jefes de los mapas nuevos (Lord Silvester, Core Magriffy, Lord Ferea, Nix, Gorgon, God of Darkness y otros) y 3 eventos que no tienes: Maze of Dimensions, Boss Battle Together y Arca War.

### Fase 13. Clases nuevas

9 clases, una por vez: Grow Lancer (trae sus 5 sets ancient), Rune Wizard, Slayer, Gun Crusher, White Wizard, Mage, Illusion Knight, Alchemist y Crusader. Cada una necesita estadísticas, habilidades, árbol de maestría, modelos, animaciones y sus variantes de sets Mastery.

### Fase 14. Modelos reales

Cambiar los modelos prestados por los reales a medida que tengas los archivos.

### Fase 15. Los 6 sets sin ítem base

Frigg, Emile, Arkajin, Moloso, Vesper y Elune, con los ítems Holy Spirit, Kenaz y Night Wing de un cliente nuevo.

### Fase G. Gráficos e interfaz

Independiente del contenido; se intercala con las otras fases. Todo va como opción (Enhanced/Ultra) y la vista clásica no cambia.

- G1 (después de la fase 3): resolución completa en celular (hecho: Opciones > Video > Resolución > Densidad de píxeles, 1.5x, 2x o la del teléfono); suavizado de bordes, filtrado de texturas y cámara más cercana ya existían en Opciones (MSAA, FXAA, anisotropía, campo de visión, zoom con Ctrl+rueda y pellizco); el resplandor era el anillo del set ancient (destellos apilados), corregido. Además, por decisión tuya: celular a 2x con el aspecto clásico, cámara abriendo a 840 en celular y PC, y celdas con ítem sin tinte.
- G2: luz y efectos (brillo suave, color, sombras).
- G3: tema moderno de ventanas pensado para celular (inventario, personaje, tienda, barras y habilidades).
- G4: inventario y baúl ampliados con el tema nuevo, junto con la fase 4.
- G5: paquete opcional de texturas en alta resolución, por partes.

Adelantada por decisión tuya (20-11-2026), con el arte del cliente S19 (datos sin proteger: texturas, modelos, mapas,
interfaz, efectos, sonido, música y movimientos; el motor está en el ejecutable protegido y no se toca). Orden:

1. GS1: los 68 movimientos nuevos del personaje S19 (mismo esqueleto) y su asignación a cada habilidad.
2. GS2: la tubería de arte S19: convertir el cliente S19 a lo que el cliente web carga, servirlo desde la VM (nunca del
   repo público) y la opción "Gráficos S19" en Opciones, apagada por defecto, con la vista clásica igual.
3. GS3 (G3 con arte S19): tema de ventanas con el arte de interfaz del S19 (marcos, botones, barras, íconos), primero
   las ventanas que usas más; la ventana del árbol Majestic (2d-4) se hace ya con este tema.
4. Fase 2d-4 y 2d-5.
5. GS4 (G5 con arte S19): ítems, monstruos, NPC, personajes y mapas con modelos y texturas S19, por partes, con tabla
   de equivalencias S19 -> S6 para monstruos y mapas como la de ítems.
6. G2 (motor): sombras, luz y postproceso; se intercala con lo demás porque no depende del arte.


#### Protocolo S19 (decisión tuya 24-11-2026: opción 3; si resulta imposible, se vuelve al S6 ampliado)

Base pública y legal: MuEmu (github.com/Yomalex/MuEmu, licencia MIT), servidor en C# que ya habla los protocolos
Season 16 y 17 coreanos (cliente 1.19.75). Las claves de cifrado del S19 (`Enc1.dat`, `Dec2.dat`) están en el
cliente y no van protegidas. El GameServer del S19 sí está protegido (WinLicense): no se analiza.

Hallazgo (24-11-2026): desde S17 cada versión del cliente oficial baraja sus códigos de mensaje (MuEmu trae la tabla
de la 1.19.75); la del S19 está en su ejecutable protegido. Decisión tuya: protocolo estilo S17 propio entre nuestro
cliente y nuestro servidor. Base elegida: el protocolo "Extended" que OpenMU ya trae (cliente de código abierto,
versión 106.3, bytes de versión `20404`), con ítems de 5 a 15 bytes (excelente, ancient, harmony, guardian, sockets),
estadísticas, nivel y experiencia en 32/64 bits, lista de personajes, mapa, apariencia y golpes ampliados. Es lo que
S17 agranda, ya mantenido por OpenMU; lo del S19 que falte se suma encima con las estructuras S17 de MuEmu como guía.

| Paso | Qué |
|---|---|
| P1 | Lista de diferencias S6 -> S17 (MuEmu tiene unas 40 estructuras propias de S16/S17: personaje, inventario de 15 bytes por ítem, visión de monstruos y jugadores, tienda, Muun, Gremory, eventos) |
| P2 | OpenMU: la versión 106.3 ya existe; se suman los mensajes S19 que falten como plugins de esa versión |
| P3 | Cliente web: hablar la versión 106.3 (paquetes `…Extended`, ítems de largo variable) desde el borde de versiones |
| P4 | Pasar de S6 a S19 en tu servidor, con vuelta atrás; los mensajes propios (Majestic, Ruud, etc.) pasan a los del S19 cuando existan |
| P5 | Ajuste a S19 exacto: solo comprobable capturando el tráfico de un cliente y un servidor S19 reales (Windows); sin eso queda "S17 coreano más lo del S19" |

#### Reemplazo total por el S19 (decisión tuya 24-11-2026)

Objetivo: al entrar se ve y se juega el S19, cliente y servidor, con sus configuraciones por defecto en tu servidor.
Dos frentes que avanzan juntos, mapa por mapa, empezando por Lorencia (corte vertical: al terminar Lorencia ya se ve
y se juega como en el S19):

- GS4, gráficos S19 en el cliente: terreno y objetos de cada mapa, monstruos, NPC, ítems (armas, armaduras, alas),
  personajes y efectos con los modelos y texturas del cliente S19 (datos sin proteger), servidos desde la VM.
- Fase S, servidor S19 (datos de `Servidor Season 19 Part 2-3/Data` convertidos a la configuración de OpenMU, con
  respaldo y reversa, puestos por defecto en tu servidor):
  - S1 experiencia: `ExpSystem` (tabla normal, master y majestic, tasas, grupo).
  - S2 monstruos: estadísticas (`Monster/MonsterList.xml`), dónde y cuántos aparecen (`MonsterSpawn.xml`,
    `MonsterRespawnLocation.xml`) y sus habilidades.
  - S3 drops: lo que suelta cada monstruo (`Item/Drop`), cajas y bolsas (`ItemBag`, `ItemBagList.xml`), opciones
    excelentes y de joyas.
  - S4 tiendas de NPC (`Shops/ShopList.xml`) y precios.
  - S5 mapas: puertas y movimientos (`World/GateTemplate.xml`, `MoveLevel.xml`) y el terreno caminable de cada mapa
    S19, igual en cliente y servidor.
  - S6 mezclas y tasas (`Mix`, `ChaosMix.ini`).
  - S7 eventos: Blood Castle, Devil Square, Chaos Castle y demás, con horarios y premios.
  - S8 fórmulas del personaje (`CalcCharacter.ini`, `Character`).

Límites que siguen igual: el protocolo es el de S6 ampliado (lo nuevo va por mensajes propios); lo que el S19 resuelve
en sus ejecutables (efectos, interfaz cifrada, reglas internas del GameServer) se rehace en OpenMU y en el cliente; las
clases nuevas siguen en la fase 13.

No se usa el arte ni el cliente de otros juegos de MU para móvil: son de otra empresa y hablan otro protocolo.

### Decisiones que necesito de ti, con mi recomendación

| Decisión | Mi recomendación |
| --- | --- |
| Fases en curso | 2 (0, 0b, 1 y 3 hechas) |
| Nivel máximo | 400 normal + 400 Master + 900 Majestic (como el S19) |
| Nivel master máximo | 400 en la fase 2 |
| Mapas de drop de Bloodangel mientras no existan los oficiales | Raklion y Vulcanus para normales; Kanturu para excellent |
| Nivel para usar Bloodangel | 400 y tercera clase |
| Bonus del set Bloodangel de Rage Fighter | Copiar los del Knight con Strength |
| Ampliaciones de inventario | Las 2 oficiales por misión; el servidor admite hasta 4 |
| Receta de alas de cuarta | Propia, inspirada en la de alas de quinta |
| Orden de las fases 4 a 15 | El de la tabla; se puede cambiar sin rehacer lo anterior |

### Lo que se resuelve al empezar cada fase

- Fase 1: piezas exactas de Harpy y Khone.
- Fase 5: segunda fuente para anillos y collares; cantidades de la receta de alas de cuarta.
- Fase 9: porcentajes de mejora de errtel.
- Fase 10: estadísticas de cada Muun.
- Fase 11: nivel de entrada exacto de cada mapa.
