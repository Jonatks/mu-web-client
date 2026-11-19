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
- Master a 400 con su tabla de experiencia; tramo Majestic nuevo con `SkillTreeMajestic.xml` y `SkillTreeMajesticStat.xml`.
- El requisito de nivel de los ítems pasa a contar el nivel total (400 + Master + Majestic).
- Necesita la compilación propia de OpenMU (fase 0) y mensajes nuevos del "Season 6 ampliado" (fase 0b).
- Riesgo: la experiencia Majestic acumulada (9,7·10^15) pasa el máximo exacto de JavaScript (9,0·10^15); el cliente debe usar enteros grandes.

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

- G1 (después de la fase 3): resolución completa en celular (hecho: Opciones > Video > Resolución > Densidad de píxeles, 1.5x, 2x o la del teléfono); suavizado de bordes, filtrado de texturas y cámara más cercana ya existían en Opciones (MSAA, FXAA, anisotropía, campo de visión, zoom con Ctrl+rueda y pellizco); falta el resplandor de las alas (necesito una captura nueva).
- G2: luz y efectos (brillo suave, color, sombras).
- G3: tema moderno de ventanas pensado para celular (inventario, personaje, tienda, barras y habilidades).
- G4: inventario y baúl ampliados con el tema nuevo, junto con la fase 4.
- G5: paquete opcional de texturas en alta resolución, por partes.

No se usa el arte ni el cliente de otros juegos de MU para móvil: son de otra empresa y hablan otro protocolo.

### Decisiones que necesito de ti, con mi recomendación

| Decisión | Mi recomendación |
| --- | --- |
| Fases en curso | 0, 0b y 3 |
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
