import { observer } from 'mobx-react-lite';
import { t, type TextKey } from '@/i18n';
import { MuWindows } from '@/controllers/interface/windowManager';
import { GameOptions, setGameOption, uiScaleFactor, UI_SCALE_MAX, type GameOptions as Options } from '@/controllers/settings/gameOptions';
import { Drops } from '@/modules/drops';
import { MobileButton } from './mobileButton';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

type NumberKey = { [K in keyof Options]: Options[K] extends number ? K : never }[keyof Options];
type BoolKey = { [K in keyof Options]: Options[K] extends boolean ? K : never }[keyof Options];

const Switch = observer(({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) => (
  <label className="mobile-set-row">
    <span>{label}</span>
    <input type="checkbox" className="mobile-switch" checked={on} onChange={e => set(e.target.checked)} />
  </label>
));

const Slider = observer(
  ({ label, option, max, show }: { label: string; option: NumberKey; max: number; show: (v: number) => string }) => (
    <label className="mobile-set-row">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={GameOptions[option]}
        onChange={e => setGameOption(option, Number(e.target.value) as never)}
      />
      <b>{show(GameOptions[option])}</b>
    </label>
  )
);

const bool = (key: BoolKey, label: TextKey) => <Switch key={key} label={t(label)} on={GameOptions[key]} set={v => setGameOption(key, v as never)} />;

/**
 * Mu Magdalena's "Settings" for a phone: interface size, pad size and visibility, the volumes, the ground item names and the two
 * automatic potions, as sliders and switches in one panel. The full Options window (every setting there is) is one button away.
 */
export const SettingsModal = observer(() => {
  if (!MobileMenu.settings) return null;
  const close = () => (MobileMenu.settings = false);

  return (
    <div className="mobile-modal" onPointerDown={close}>
      <div className="mobile-panel mobile-settings" onPointerDown={e => e.stopPropagation()}>
        <div className="mobile-panel-head">
          <span>{t('mobile.cmd.options')}</span>
          <MobileButton className="mobile-close" onTap={close}>
            {() => <Icon name="close" size={20} />}
          </MobileButton>
        </div>
        <div className="mobile-settings-body">
          <Slider label={t('mobile.set.uiScale')} option="uiScale" max={UI_SCALE_MAX} show={v => `${Math.round(uiScaleFactor(v) * 100)}%`} />
          <Slider
            label={t('mobile.set.padSize')}
            option="touchStickSize"
            max={2}
            show={v => t(['options.touchStickSize.small', 'options.touchStickSize.normal', 'options.touchStickSize.large'][v] as TextKey)}
          />
          <Switch label={t('mobile.set.showPad')} on={!GameOptions.touchStickHidden} set={v => setGameOption('touchStickHidden', !v)} />
          <Slider label={t('mobile.set.music')} option="musicVolume" max={10} show={v => `${v * 10}%`} />
          <Slider label={t('mobile.set.effects')} option="effectsVolume" max={10} show={v => `${v * 10}%`} />
          <Switch label={t('mobile.set.groundNames')} on={Drops.showDropNames} set={() => Drops.toggleDropNames()} />
          {bool('autoManaPotion', 'options.autoManaPotion')}
          {bool('autoQuiver', 'options.autoQuiver')}
          <MobileButton
            className="mobile-settings-all"
            onTap={() => {
              close();
              MuWindows.setOpen('options', true);
            }}
          >
            {() => <span>{t('mobile.set.all')}</span>}
          </MobileButton>
        </div>
      </div>
    </div>
  );
});
