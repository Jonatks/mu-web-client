# Fase S12: que modelo del cliente S19 dibuja cada monstruo nuevo (numero >= 581 en MonsterSpawn.xml).
#   python3 ops/s19/gen_monster_models.py > ops/s19/monster_models.tsv
# La tabla del cliente esta dentro de su main.exe protegido; esta se reconstruye de los propios modelos (nombre
# interno y texturas de cada .bmd), del monstruo Season 6 que cada modelo "renew" renueva y de los bloques de
# numeros consecutivos (ver readme.md, "Modelos de monstruos").
# Confianza: alta = nombre o textura del modelo y bloque coinciden; media = solo bloque u orden de colores;
# baja = suposicion por mapa, se confirma dibujandolo. "s6:<n>" = el modelo que ya usa el monstruo <n> del cliente.

M = 'Monster/Monster{}.bmd'.format
ROWS = []


def add(ids, models, conf, note=''):
    for i, m in zip(ids, models):
        ROWS.append((i, m, conf, note))


def block(first, model_first, n, conf='alta', note=''):
    add(range(first, first + n), [M(model_first + k) for k in range(n)], conf, note)


# Acheron (91) y Stadium: d368. Hellraiser es "hilasha". 229 (GM.smd) es un humano: Satyros usa el de Season 6.
block(586, 218, 11, note='Acheron; textura por elemento (_red/_blue/_green/_black/_yellow)')
add([597], ['s6:353'], 'media', 'Summoned Satyros: el 229 del bloque es un humano (GM)')
add([598, 599, 600, 601, 602], [M(k) for k in range(230, 235)], 'media', 'torres elementales (obeliscos)')
add([581, 582, 583], ['NPC/Akeron/deruvish.bmd', 'NPC/adniel.bmd', 'NPC/Akeron/jinn.bmd'], 'alta', 'NPC')
# Debenter (95): d368, sus 5 elementales son las versiones "D" de Acheron.
block(608, 240, 8, note='Debenter: Sellihoden=salamandra D, Ukanva=undine, Silla=silfide, Normus=gnomo, Muff=hilasha')
# Malditos del Stadium: los elementales de Acheron con otra textura.
add(range(632, 637), [M(k) for k in range(224, 229)], 'media', 'Cursed: mismo modelo que Acheron')
# Eventos del Stadium (6): animales del ano lunar por color.
block(647, 253, 4, note='serpientes')
add([652, 677], ['s6:78', 's6:78'], 'alta', 'Golden Goblin')
add([653, 654, 655, 656], ['s6:53', 's6:82', 's6:295', 's6:309'], 'alta', 'dorados: Titan, Tantallos, Erohim, Hell Maine')
add([657], ['s6:161'], 'media', 'Illusion of Golden Kundun')
add([670, 671, 672, 673], [M(k) for k in range(260, 264)], 'alta', 'Uruk y Lord Silvester')
add([674, 675], ['s6:413', 's6:365'], 'alta', 'Moon Rabbit = Lunar Rabbit; Pouch of Blessing')
add([676], [M(127)], 'baja', 'Fire Flame Ghost: por confirmar')
add([678, 679, 680], [M(k) for k in range(260, 263)], 'baja', 'Lord Devil Fairy/Beast/Knight: modelos Uruk?')
add([691, 692, 693, 694], [M(k) for k in (266, 267, 268, 269)], 'alta', 'caballos: verde, amarillo, marron, azul (visto)')
add([724], [M(270)], 'alta', 'Chaos Goblin (4 colores 270-273)')
block(726, 278, 4, note='cabras = sheep (verde, blanco, violeta, naranja)')
block(739, 295, 4, note='monos')
block(759, 307, 4, note='gallos')
add([795, 796, 797, 798], [M(k) for k in range(333, 337)], 'alta', 'perros (verde, gris, violeta, naranja)')
add([808], [M(337)], 'media', 'Power Chicken = chicken_basic')
block(817, 345, 4, note='cerdos')
block(855, 361, 4, note='ratas')
block(884, 376, 4, note='vacas')
block(901, 400, 4, note='tigres')
block(933, 421, 4, note='conejos negros')
add([888, 889], [M(380), M(380)], 'media', 'Box of Blessing: cofre treasureUp (visto)')
# NPC de Loren Market y otros.
add([669, 682, 695, 722, 723, 748, 758],
    ['NPC/NpcElin.bmd', 'NPC/monicaNPC.bmd', 'NPC/NPC_LIVAIN.bmd', 'NPC/mirazu.bmd', 'NPC/Lugard.bmd',
     'NPC/SpiritNixie.bmd', 'NPC/hs_dimensiondoorA.bmd'], 'alta', 'NPC')
add([719, 720, 721], ['s6:232', 's6:237', 's6:522'], 'alta', 'NPC Season 6: Archangel, Charon, Jerint')
add([643], ['?'], 'baja', 'Mait: sin modelo identificado')
add([651], ['NPC/so_pershop.bmd'], 'media', 'tablero de tiendas personales')
add([838, 866, 925], ['NPC/obj_flag.bmd'] * 3, 'media', 'bandera de zona elite')
# Nars (110), Ferea (112), Nixies Lake (113): d439 y d444.
block(713, 274, 4, note='Nars')
block(730, 286, 3, note='Ferea')
add([735], [M(291)], 'media', 'Ferea Crystal Orb = amoro_balls')
add([736, 737, 738], [M(k) for k in range(286, 289)], 'alta', 'Ferea (segundo grupo)')
block(743, 299, 3, note='Nixies Lake: Paraca, Vasuki=baski, Bass')
# Deep Dungeon (116-120): la version renovada de los de Lorencia y Dungeon (d455); esqueletos con nombre propio.
add([767, 768, 769], ['Monster/DarkSkeletonWarrior.bmd', 'Monster/DarkSkeletonArcher.bmd',
                      'Monster/DarkSkeletonWarriorGeneral.bmd'], 'alta', 'Deep Dungeon')
block(770, 315, 9, note='Deep Dungeon: Larva..Gorgon')
block(786, 324, 4, note='Swamp of Darkness')
block(810, 338, 7, note='Kubera Mine')
add([605, 606, 607], ['?'] * 3, 'baja', 'Mining Area: sin modelo (237-239 no existen)')
add([681, 689], ['?', '?'], 'baja', 'Evomon y Flame Trap: sin modelo identificado')
# Mapas S14 a S17: un bloque por mapa; las elite repiten el modelo salvo donde hay copia propia.
block(832, 349, 6, note='Abyss of Atlans')
add([839, 840], [M(353), M(354)], 'alta', 'Abyss elite')
block(845, 355, 3, note='Scorched Canyon')
add([848, 849, 850], [M(k) for k in range(355, 358)], 'alta', 'Scorched elite')
block(859, 365, 7, note='Red Smoke Icarus (Phoenix lleva tambien Monster372)')
block(867, 373, 3, note='Arenil Temple')
add([870, 871, 872], [M(k) for k in range(373, 376)], 'alta', 'Temple elite')
block(875, 385, 6, note='Ashen Aida')
block(892, 391, 9, note='Old y Blaze Kethotum')
block(905, 404, 6, note='Kanturu Undergrounds')
block(911, 418, 3, note='Ignis Volcano')
add([914, 915, 916], [M(k) for k in range(418, 421)], 'alta', 'Ignis elite')
block(926, 425, 4, note='Bloody Tarkan')
add([930, 931, 932], [M(k) for k in range(426, 429)], 'alta', 'Bloody Tarkan elite')
block(942, 432, 6, note='Tormenta Island')
block(955, 444, 3, note='Twisted Karutan')
add([958, 959, 960], [M(k) for k in range(444, 447)], 'alta', 'Twisted elite')
# Visto: 304-306 son demonios oscuros armados (cuchillas curvas, baston, espada); 257-259 son criaturas aladas.
add([963, 964, 965, 966, 967, 968], [M(k) for k in (306, 304, 305, 306, 304, 305)], 'media',
    'Kardamahal: Sword=leviathan (espada), Scythe=mephisto (cuchillas), Sorcerer=belial (baston)')
# Ya hechos en la fase S9 (modelo NPC propio).
add([584, 725, 764, 765, 891, 941], ['NPC/Akeron/lesnar.bmd', 'NPC/james.bmd', 'NPC/scent.bmd', 'NPC/scent.bmd',
                                    'NPC/Gillard.bmd', 'NPC/N_eunice.bmd'], 'alta', 'hecho en S9')

if __name__ == '__main__':
    seen = set()
    print('id\tmodelo\tconfianza\tnota')
    for i, m, c, n in sorted(ROWS):
        assert i not in seen, i
        seen.add(i)
        print(f'{i}\t{m}\t{c}\t{n}')
