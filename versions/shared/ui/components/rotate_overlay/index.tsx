import './style.less';
import { observer } from 'mobx-react-lite';
import { Immersive } from '@/controllers/interface/immersive';
import { t } from '@/i18n';

/**
 * Two touch-only notices over everything (`controllers/interface/immersive.ts`): the rotate screen
 * while the phone is upright (a tap on it asks for fullscreen and landscape, which turns the
 * screen by itself where the browser allows), and a small hint when fullscreen was left.
 */
export const RotateOverlay = observer(() => {
  if (Immersive.showRotate) {
    return (
      <div className="rotate-overlay">
        <svg className="rotate-phone" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="20" y="6" width="24" height="44" rx="4" />
          <circle cx="32" cy="43" r="2" />
          <path d="M10 52 C16 60 28 62 38 58" />
          <path d="M38 58 l-1 -6 m1 6 l6 -3" />
        </svg>
        <div className="rotate-title">{t('rotate.title')}</div>
        <div className="rotate-body">{t('rotate.body')}</div>
        {Immersive.supported && <div className="rotate-hint">{t('rotate.fullscreen')}</div>}
      </div>
    );
  }

  if (Immersive.promptFullscreen) {
    return <div className="fullscreen-pill">{t('rotate.fullscreen')}</div>;
  }

  return null;
});
