# s19

Fase 0b del plan ([../plan/plan_por_fases.md](../plan/plan_por_fases.md)): pasar datos del servidor Season 19 a
nuestro OpenMU Season 6 y al cliente web. Del S19 se toman datos y graficos, nunca su protocolo.

```
convert.ts          lee ItemList.xml, ItemSetType.xml, ItemSetOption.xml y MasteryItemMix.xml de una carpeta Data del S19
                    y escribe items_s19.json, sets_s19.json y mixes_s19.json de una generacion
convert.test.ts     lo de Bloodangel es igual a lo que la fase 3 cargo a mano (necesita S19_DATA; sin ella se salta)
generaciones.json   que items toma cada generacion: grado Mastery, grupos, exclusiones y numeros de set del S19
gen_monster_models.py  monstruo nuevo (>= 581) -> modelo del cliente S19; escribe monster_models.tsv
gen_monster_defs.py   las carpetas versions/shared/monsters de esos monstruos (numeros o rangos), desde la tabla
equivalencias.json  numeros S19 -> Season 6: items renumerados, primer set del cliente, clases y estadistica de cada una,
                    codigos de opcion de set que S6 no tiene
```

Uso: `bun ops/s19/convert.ts "<Data del servidor S19>" bloodangel <salida>`. La salida alimenta los generadores
de `ops/bloodangel/` (`gen_items.py`, `gen_sets.ts`, `client_sets.ts`, `craft.sql`), que siguen igual. Los XML del
S19 no entran al repositorio.

## Generaciones 2 a 11 (fase S10)

`generaciones.json` tiene tambien Darkangel a Temple Guard, con las mismas reglas: fuera el carcaj, las "(Belief)" y
la segunda variante de un mismo nombre (la de numero mas alto). `ops/faseS/gen_mastery.py` clona cada item del item
Bloodangel de su tipo y escribe el SQL del servidor y los archivos del cliente; `ops/faseS/gen_mastery_sets.ts` los
sets. Temple Guard queda fuera: el cliente S19 Part 2-3 no trae sus modelos. Los JSON y el SQL van a mu-assets
(`s19/server/s10`), los modelos a `s19/client/game-assets/Item`; `ops/faseS/s10_apply.sh` lo aplica en la VM.

## Reglas de seleccion (Bloodangel, igual a la fase 3)

- `MasteryGrade` de la generacion, grupos 0 a 11, y al menos una clase de Season 6 con valor distinto de 0.
- Fuera: el carcaj (4/34), la segunda variante de Elf (158), la de Magic Gladiator suelta (161) y las "(Belief)" (200).
- Sets: los pares 78 a 90 del `ItemSetOption`; la estadistica de pieza sale de la clase (`classStat`).

## Equivalencias pendientes

- Grupos 16 a 20 del S19 (Muun, objetos sin categoria, piezas selladas de Twilight y Freedom): el protocolo S6
  guarda el grupo en 4 bits, asi que van a numeros libres de los grupos 12 a 15. `groupMap` queda en `null` hasta la
  fase que los use (fase 10 Muun; fase 7 piezas selladas).
- Piezas selladas de Bloodangel (13/351 en adelante): la receta del S19 las usa; hoy la mezcla toma la pieza normal
  (ver [../plan/bitacora.md](../plan/bitacora.md)).

## "Season 6 ampliado": mensajes propios

El protocolo S6 sin cambios, mas mensajes propios por el paquete de modulos (0xE8, `openmu/readme.md`) para lo que
S6 no tiene. Lista y fase que lo implementa:

| Mensaje | Para que | Fase |
|---|---|---|
| nivel Majestic y sus puntos | tramo 1 a 900 | 2 |
| experiencia de 64 bits | la experiencia Majestic pasa 2^53 | 2 |
| saldo de Ruud | tienda de James y Gremory | 6 |
| ranuras de earring | 2 ranuras nuevas del personaje | 8 |
| pentagrama y errtel | ranura y sus 5 errtel | 9 |
| Muun | ranura, invocacion y sus opciones | 10 |

## Modelos de monstruos (fase S12)

El cliente S19 elige el modelo de cada monstruo dentro de su main.exe protegido, y el `Model` de MonsterList.xml es
igual al numero del monstruo. `gen_monster_models.py` reconstruye la tabla con tres pistas:

- El nombre interno y las texturas de cada .bmd (`devilfairy.SMD`, `undine.smd`, `ferea_king.SMD`).
- Los modelos "renew": las mismas texturas que un monstruo Season 6 con sufijo (`_renew`, `_2`, `_red`); Ashen Aida
  385-390 son Death Tree, Forest Orc, Death Rider, Witch Queen, Blue Golem y Bloody Witch Queen.
- Los bloques: cada mapa nuevo ocupa numeros seguidos, con una diferencia fija entre monstruo y modelo (Acheron y
  Debenter 368, Ferea y Nixies Lake 444, Deep Dungeon 455, Abyss 483, Ashen Aida 490).

Los NPC nuevos estan en `Data/NPC` (`Akeron/deruvish`, `adniel`, `monicaNPC`, `NpcElin`, `Lugard`). Los elementales de
Acheron y Debenter cambian de textura segun su elemento (`DevilFairy_red/_blue/_green/_black/_yellow`).

Pendiente de los monstruos: el S19 cambia la textura de los de elemento 6 (Devil Fairy, Elemental Beast y Knight de
Acheron) segun el elemento con que aparecen, y el protocolo Season 6 no lo envia: quedan con la textura del modelo
(`_red`). La escala va en 1 salvo `SCALE` en el generador; Elemental Knight se ve unas tres veces el personaje.
