/** English text of the touch HUD. See src/i18n/readme.md. */

const en = {
  'mobile.talk': 'Talk · {name}',
  'mobile.level': 'Lvl {n}',
  'mobile.safeZone': 'SAFE ZONE',
  'mobile.helper': 'HELPER',
  'mobile.attack': 'Attack',
  'mobile.menu': 'Menu',
  'mobile.commands': 'COMMANDS',
  'mobile.cmd.move': 'Move',
  'mobile.cmd.inventory': 'Inventory',
  'mobile.cmd.character': 'Character',
  'mobile.cmd.skills': 'Skills',
  'mobile.cmd.friends': 'Friends',
  'mobile.cmd.party': 'Party',
  'mobile.cmd.guild': 'Guild',
  'mobile.cmd.quests': 'Quests',
  'mobile.cmd.helper': 'MU Helper',
  'mobile.cmd.options': 'Settings',
  'mobile.cmd.switch': 'Change character',
  'mobile.cmd.system': 'System',
  'mobile.pickPosition': '1 - SELECT THE POSITION',
  'mobile.pickSkill': '2 - SELECT THE SKILL',
  'mobile.pickHint': 'Tap a skill to place it in the selected slot.',
  'mobile.move': 'Move',
  'mobile.use': 'Use',
  'mobile.teleport': 'Teleport',
  'mobile.lv': 'Lv.{n}',
  'mobile.cmd.points': 'Allocate points',
  'mobile.availablePoints': 'Available points',
  'mobile.chat': 'Chat',
  'mobile.messages': 'MESSAGES',
  'mobile.writeMessage': 'Write a message',
  'mobile.send': 'Send',
  'mobile.clear': 'Clear',
};

export default en;

declare module '@/i18n' {
  interface TextOwners {
    'versions/shared/ui/hud/mobile_controls': typeof en;
  }
}
