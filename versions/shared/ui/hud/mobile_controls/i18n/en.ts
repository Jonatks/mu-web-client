/** English text of the touch HUD. See src/i18n/readme.md. */

const en = {
  'mobile.talk': 'Talk · {name}',
};

export default en;

declare module '@/i18n' {
  interface TextOwners {
    'versions/shared/ui/hud/mobile_controls': typeof en;
  }
}
