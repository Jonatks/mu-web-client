/** English text of the `rotate_overlay` UI component. See src/i18n/readme.md. */

const en = {
  'rotate.title': 'Rotate your phone',
  'rotate.body': 'MU Online is played in landscape. Turn your phone sideways to continue.',
  'rotate.fullscreen': 'Tap to play full screen',
};

export default en;

declare module '@/i18n' {
  interface TextOwners {
    'versions/shared/ui/components/rotate_overlay': typeof en;
  }
}
