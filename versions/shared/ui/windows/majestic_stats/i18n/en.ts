/** English text of the `majestic_stats` window. See src/i18n/readme.md. */

const en = {
  'majestic.title': 'Majestic stats',
  'majestic.info': 'Level {level} · points {points}',
  'majestic.defense': 'Defense',
  'majestic.attack': 'Attack',
  'majestic.close': 'Close',
  'majestic.node.1137': 'Max HP',
  'majestic.node.1138': 'Vitality (4th stat)',
  'majestic.node.1241': 'Vitality (4th stat)',
  'majestic.node.1139': 'Basic defense',
  'majestic.node.1140': 'Wing defense',
  'majestic.node.1141': 'Damage',
  'majestic.node.1142': 'Wizardry',
  'majestic.node.1143': 'Main stat (4th stat)',
  'majestic.node.1242': 'Command (4th stat)',
  'majestic.node.1144': 'Skill damage',
  'majestic.node.1145': 'Wing damage',
  'majestic.node.1146': 'Damage and wizardry',
  'majestic.node.1157': 'Wizardry and curse',
  'majestic.node.1193': 'Wing wizardry',
  'majestic.node.1194': 'Wing damage and wizardry',
  'majestic.node.1195': 'Wing wizardry and curse',
};

export default en;

declare module '@/i18n' {
  interface TextOwners {
    'versions/shared/ui/windows/majestic_stats': typeof en;
  }
}
