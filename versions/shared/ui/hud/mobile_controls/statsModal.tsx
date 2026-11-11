import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { MuWindows } from '@/controllers/interface/windowManager';
import { Hero } from '@/modules/hero';
import { StatType } from '@/modules/hero/characterStats';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

const STATS: readonly { stat: StatType; label: string; value: () => number }[] = [
  { stat: StatType.Strength, label: 'STR', value: () => Hero.str },
  { stat: StatType.Agility, label: 'AGI', value: () => Hero.agi },
  { stat: StatType.Vitality, label: 'STA', value: () => Hero.sta },
  { stat: StatType.Energy, label: 'ENG', value: () => Hero.eng },
];

/**
 * Mu Magdalena's "Allocate points": name and level, the points left, and a row per stat with a big plus. The whole character
 * window stays one tap away for the details (damage, defence, resistances).
 */
export const StatsModal = observer(() => {
  if (!MobileMenu.stats) return null;
  const close = () => (MobileMenu.stats = false);
  const spare = Hero.points;

  return (
    <div className="mobile-modal" onPointerDown={close}>
      <div className="mobile-panel mobile-stats" onPointerDown={e => e.stopPropagation()}>
        <div className="mobile-panel-head">
          <span>
            {t('mobile.cmd.points')}
            <small>
              {Hero.name} · {t('mobile.level', { n: Hero.level })}
            </small>
          </span>
          <MobileButton className="mobile-close" onTap={close}>
            {() => <Icon name="close" size={20} />}
          </MobileButton>
        </div>
        <div className="mobile-stats-body">
          <div className="mobile-stats-points">
            <span>{t('mobile.availablePoints')}</span>
            <b>{spare}</b>
          </div>
          {STATS.map(row => (
            <div key={row.stat} className="mobile-stat-row">
              <span className="mobile-stat-label">{row.label}</span>
              <span className="mobile-stat-value">{row.value()}</span>
              <MobileButton
                className={`mobile-stat-add${spare > 0 ? '' : ' is-off'}`}
                onTap={() => spare > 0 && Hero.increaseStatRequest(row.stat)}
              >
                {() => <span>＋</span>}
              </MobileButton>
            </div>
          ))}
          <div className="mobile-stats-vitals">
            <span>
              HP {Hero.currentHP} / {Hero.maxHP}
            </span>
            <span>
              Mana {Hero.currentMP} / {Hero.maxMP}
            </span>
          </div>
          <MobileButton
            className="mobile-stats-details"
            onTap={() => {
              close();
              MuWindows.setOpen('character_info', true);
            }}
          >
            {() => <span>{t('mobile.cmd.character')}</span>}
          </MobileButton>
        </div>
      </div>
    </div>
  );
});
