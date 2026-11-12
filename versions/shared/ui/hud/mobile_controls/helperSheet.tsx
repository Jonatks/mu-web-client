import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { t, type TextKey } from '@/i18n';
import { HeroSkills } from '@/modules/skills';
import { skillDefinition, type SkillDefinition } from '@versions/shared/skills/skillsDatabase';
import { MAX_HUNTING_RANGE, MAX_OBTAINING_RANGE, type MuHelperConfig } from '@/modules/mu_helper/config';
import { MuHelper, MuHelperState, saveMuHelperConfig, toggleMuHelperWindow } from '@/modules/mu_helper/state';
import { SkillIcon } from '../../components/skill_icon';
import { isAttackSkill, isBuffSkill } from '../../windows/mu_helper';
import { MobileButton } from './mobileButton';
import { Icon } from './icons';

type Slots = 'skills' | 'buffs';
type PickKey = 'pickAllItems' | 'pickJewel' | 'pickZen' | 'pickAncient' | 'pickExcellent' | 'pickExtraItems';

const edit = (fn: (draft: MuHelperConfig) => void) => runInAction(() => fn(MuHelperState.draft));

const PICKS: readonly [PickKey, TextKey][] = [
  ['pickAllItems', 'mobile.hlp.allItems'],
  ['pickJewel', 'mobile.hlp.jewels'],
  ['pickZen', 'mobile.hlp.zen'],
  ['pickExcellent', 'mobile.hlp.excellent'],
  ['pickAncient', 'mobile.hlp.ancient'],
  ['pickExtraItems', 'mobile.hlp.selected'],
];

/** The hero's skills a lane may take, in the order the server sent them. */
const offered = (filter: (def: SkillDefinition) => boolean) =>
  HeroSkills.skills.map(s => skillDefinition(s.number)).filter((def): def is SkillDefinition => !!def && filter(def));

/** One lane: the chosen three on top (tap to drop one), what can be added below (tap to add to the first empty box). */
const Lane = observer(({ slots, title, note, empty }: { slots: Slots; title: TextKey; note: TextKey; empty: TextKey }) => {
  const chosen = MuHelperState.draft[slots];
  const options = offered(slots === 'skills' ? isAttackSkill : isBuffSkill);
  const add = (num: number) =>
    edit(d => {
      const free = d[slots].indexOf(0);
      if (free >= 0 && !d[slots].includes(num)) d[slots][free] = num;
    });

  return (
    <section className="hlp-lane">
      <div className="hlp-lane-title">
        <b>{t(title)}</b>
        <small>{t(note)}</small>
      </div>
      <div className="hlp-row">
        {chosen.every(n => n === 0) && <span className="hlp-empty">{t(empty)}</span>}
        {chosen.map((num, i) =>
          num ? (
            <MobileButton key={i} className="hlp-skill is-chosen" onTap={() => edit(d => (d[slots][i] = 0))}>
              {() => (
                <>
                  <SkillIcon number={num} />
                  <i className="hlp-badge is-remove">×</i>
                </>
              )}
            </MobileButton>
          ) : null
        )}
      </div>
      <div className="hlp-row hlp-offer">
        {options.map(def => {
          const taken = chosen.includes(def.num);
          return (
            <MobileButton key={def.num} className={`hlp-skill${taken ? ' is-taken' : ''}`} onTap={() => add(def.num)}>
              {() => (
                <>
                  <SkillIcon number={def.num} disabled={taken} />
                  <i className="hlp-badge">+</i>
                </>
              )}
            </MobileButton>
          );
        })}
      </div>
    </section>
  );
});

const Range = observer(({ label, value, max, set }: { label: TextKey; value: number; max: number; set: (v: number) => void }) => (
  <label className="hlp-range">
    <span>{t(label)}</span>
    <select value={value} onChange={e => set(Number(e.target.value))}>
      {Array.from({ length: max }, (_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  </label>
));

const Toggle = ({ on, set, label, className = '' }: { on: boolean; set: (v: boolean) => void; label: string; className?: string }) => (
  <label className={`hlp-toggle ${className}`}>
    <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} />
    <span>{label}</span>
  </label>
);

/**
 * Mu Magdalena's MU Helper on a phone: one centred panel, Combat and Pickup tabs, two lanes of skill tiles, the ranges, the
 * potion threshold and a big start button. It edits the same draft as the classic window and saves it the same way.
 */
export const HelperSheet = observer(() => {
  const [tab, setTab] = useState<'combat' | 'pickup'>('combat');
  if (!MuHelperState.windowOpen) return null;
  const draft = MuHelperState.draft;
  const close = () => saveMuHelperConfig();
  const run = () => {
    saveMuHelperConfig();
    MuHelper.toggleMuHelper();
  };

  return (
    <div className="mobile-modal" onPointerDown={close}>
      <section className="hlp-panel" onPointerDown={e => e.stopPropagation()}>
        <header className="hlp-head">
          <span className="hlp-mark">⚔</span>
          <strong>{t('muHelper.title')}</strong>
          <span className={`hlp-status${MuHelper.active ? ' is-on' : ''}`}>{t(MuHelper.active ? 'mobile.hlp.running' : 'mobile.hlp.stopped')}</span>
          <MobileButton className="mobile-close" onTap={() => toggleMuHelperWindow(false)}>
            {() => <Icon name="close" size={20} />}
          </MobileButton>
        </header>
        <nav className="hlp-tabs">
          {(['combat', 'pickup'] as const).map(id => (
            <MobileButton key={id} className={`hlp-tab${tab === id ? ' is-active' : ''}`} onTap={() => setTab(id)}>
              {() => <span>{t(id === 'combat' ? 'mobile.hlp.combat' : 'mobile.hlp.pickup')}</span>}
            </MobileButton>
          ))}
        </nav>
        {tab === 'combat' ? (
          <div className="hlp-lanes">
            <Lane slots="skills" title="mobile.hlp.attacks" note="mobile.hlp.rotation" empty="mobile.hlp.noAttacks" />
            <Lane slots="buffs" title="mobile.hlp.buffs" note="mobile.hlp.onlyMissing" empty="mobile.hlp.noBuffs" />
          </div>
        ) : (
          <div className="hlp-pickup">
            <div className="hlp-lane-title">
              <b>{t('mobile.hlp.autoPickup')}</b>
              <small>{t('mobile.hlp.pickupHint')}</small>
            </div>
            <div className="hlp-tiles">
              {PICKS.map(([key, label]) => (
                <MobileButton key={key} className={`hlp-tile${draft[key] ? ' is-on' : ''}`} onTap={() => edit(d => (d[key] = !d[key]))}>
                  {() => (
                    <>
                      <b>{t(label)}</b>
                      <small>{t(draft[key] ? 'mobile.hlp.auto' : 'mobile.hlp.off')}</small>
                    </>
                  )}
                </MobileButton>
              ))}
            </div>
          </div>
        )}
        <footer className="hlp-foot">
          <Range label="mobile.hlp.attackRange" value={draft.huntingRange} max={MAX_HUNTING_RANGE} set={v => edit(d => (d.huntingRange = v))} />
          <Range label="mobile.hlp.lootRange" value={draft.obtainRange} max={MAX_OBTAINING_RANGE} set={v => edit(d => (d.obtainRange = v))} />
          <Toggle label={t('mobile.hlp.originalPos')} on={draft.returnToOriginalPosition} set={v => edit(d => (d.returnToOriginalPosition = v))} />
          <label className="hlp-potion">
            <input type="checkbox" checked={draft.useHealPotion} onChange={e => edit(d => (d.useHealPotion = e.target.checked))} />
            <span>{t('mobile.hlp.hp')}</span>
            <select value={draft.potionThreshold} onChange={e => edit(d => (d.potionThreshold = Number(e.target.value)))}>
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => (
                <option key={v} value={v}>
                  {v}%
                </option>
              ))}
            </select>
          </label>
          <MobileButton className={`hlp-start${MuHelper.active ? ' is-stop' : ''}`} onTap={run}>
            {() => <span>{t(MuHelper.active ? 'mobile.hlp.stop' : 'mobile.hlp.start')}</span>}
          </MobileButton>
        </footer>
      </section>
    </div>
  );
});
