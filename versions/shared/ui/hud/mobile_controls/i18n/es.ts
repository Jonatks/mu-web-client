/** Spanish text of the touch HUD. */

import type en from './en';

export default {
  'mobile.talk': 'Hablar · {name}',
  'mobile.level': 'Nv {n}',
  'mobile.safeZone': 'ZONA SEGURA',
  'mobile.helper': 'HELPER',
  'mobile.attack': 'Atacar',
  'mobile.menu': 'Menú',
  'mobile.commands': 'COMANDOS',
  'mobile.cmd.move': 'Mover',
  'mobile.cmd.inventory': 'Inventario',
  'mobile.cmd.character': 'Personaje',
  'mobile.cmd.skills': 'Habilidades',
  'mobile.cmd.friends': 'Amigos',
  'mobile.cmd.party': 'Grupo',
  'mobile.cmd.guild': 'Clan',
  'mobile.cmd.quests': 'Misiones',
  'mobile.cmd.helper': 'MU Helper',
  'mobile.cmd.options': 'Ajustes',
  'mobile.cmd.switch': 'Cambiar personaje',
  'mobile.cmd.system': 'Sistema',
  'mobile.pickPosition': '1 - ELIGE LA POSICIÓN',
  'mobile.pickSkill': '2 - ELIGE LA HABILIDAD',
  'mobile.pickHint': 'Toca una habilidad para ponerla en la posición elegida.',
  'mobile.move': 'Mover',
  'mobile.use': 'Usar',
  'mobile.clear': 'Quitar',
} satisfies Partial<Record<keyof typeof en, string>>;
