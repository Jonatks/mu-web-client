import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { MuHelper } from '@/modules/mu_helper';
import { toggleMuHelperWindow } from '@/modules/mu_helper/state';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

/**
 * Top right, like Mu Magdalena: the Helper switch (tap starts or stops it, a long press opens its settings) and the
 * menu. The five buttons of the original bar are gone from a touch screen; every one of them is a tile in the menu.
 */
export const TopButtons = observer(() => (
  <div className="mobile-top-buttons">
    <div className="mobile-round-wrap">
      <MobileButton
        className={`mobile-round${MuHelper.active ? ' is-on' : ''}`}
        title="MU Helper"
        onTap={() => MuHelper.toggleMuHelper()}
        onLongPress={() => toggleMuHelperWindow(true)}
      >
        {() => <Icon name="helper" size={26} />}
      </MobileButton>
      <span className="mobile-round-label">{t('mobile.helper')}</span>
    </div>
    <div className="mobile-round-wrap">
      <MobileButton className="mobile-round" title={t('mobile.menu')} onTap={() => (MobileMenu.open = !MobileMenu.open)}>
        {() => <Icon name="menu" size={26} />}
      </MobileButton>
    </div>
  </div>
));
