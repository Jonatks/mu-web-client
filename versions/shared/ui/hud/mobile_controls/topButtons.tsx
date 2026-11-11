import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Ecs } from '@/ecs/current';
import { autoGetItem, dropNearby } from '@/ecs/systems/itemPickupSystem';
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
/** The hand (Mu Magdalena's): appears when something lies within reach of the hero; one tap sweeps up what is around (`AutoGetItem`). */
const PickupButton = observer(() => {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => {
      const world = Ecs.world;
      const next = !!world && dropNearby(world);
      setNear(prev => (prev === next ? prev : next));
    }, 300);
    return () => window.clearInterval(id);
  }, []);
  if (!near && !MobileMenu.picking) return null;
  return (
    <div className="mobile-round-wrap">
      <MobileButton
        className={`mobile-round${MobileMenu.picking ? ' is-on' : ''}`}
        title={t('mobile.pickup')}
        onTap={() => {
          const world = Ecs.world;
          if (!world) return;
          MobileMenu.picking = true;
          autoGetItem(world);
        }}
      >
        {() => <Icon name="hand" size={26} />}
      </MobileButton>
    </div>
  );
});

export const TopButtons = observer(() => (
  <div className="mobile-top-buttons">
    <PickupButton />
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
