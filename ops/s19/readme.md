# s19

Fase 0b del plan ([../plan/plan_por_fases.md](../plan/plan_por_fases.md)): pasar datos del servidor Season 19 a
nuestro OpenMU Season 6 y al cliente web. Del S19 se toman datos y graficos, nunca su protocolo.

```
convert.ts          lee ItemList.xml, ItemSetType.xml, ItemSetOption.xml y MasteryItemMix.xml de una carpeta Data del S19
                    y escribe items_s19.json, sets_s19.json y mixes_s19.json de una generacion
convert.test.ts     lo de Bloodangel es igual a lo que la fase 3 cargo a mano (necesita S19_DATA; sin ella se salta)
generaciones.json   que items toma cada generacion: grado Mastery, grupos, exclusiones y numeros de set del S19
equivalencias.json  numeros S19 -> Season 6: items renumerados, primer set del cliente, clases y estadistica de cada una,
                    codigos de opcion de set que S6 no tiene
```

Uso: `bun ops/s19/convert.ts "<Data del servidor S19>" bloodangel <salida>`. La salida alimenta los generadores
de `ops/bloodangel/` (`gen_items.py`, `gen_sets.ts`, `client_sets.ts`, `craft.sql`), que siguen igual. Los XML del
S19 no entran al repositorio.

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
