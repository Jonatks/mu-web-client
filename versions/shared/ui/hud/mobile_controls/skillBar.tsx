import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { Hero } from '@/modules/hero';
import { skills, HeroSkills } from '@/modules/skills';
import { onCooldownTick } from '@/modules/skills/cooldowns';
import { isHotbarSkill } from '@/modules/skills/skillCasting';
import { skillDefinition } from '@versions/shared/skills/skillsDatabase';
import { MobileSkillSlots, MOBILE_SKILL_SLOTS } from '@/modules/options/mobileSkillSlots';
import { SkillIcon } from '../../components/skill_icon';
import { MobileButton } from './mobileButton';
import { castSkill } from './castSkill';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

const SLOT_SIZE = 40;

/** One of the six slots: the icon, the greyed state and the delay sweep of a bar slot. */
const Slot = observer(({ slot }: { slot: number }) => {
  const number = MobileSkillSlots.slots[slot] ?? -1;
  const usable = number >= 0 && skills.requirementsMet(number);
  const selected = number >= 0 && number === HeroSkills.currentSkill;
  const sweep = useRef<HTMLDivElement>(null);

  // RenderSkillDelay: written straight to the element on the cooldown tick, so a running delay never re-renders React.
  useEffect(() => {
    const tick = () => {
      const el = sweep.current;
      if (!el) return;
      const delay = number >= 0 ? skills.cooldown(number) : null;
      const css = delay ? `${Math.round(delay.fraction * SLOT_SIZE)}px` : '0px';
      if (el.style.height !== css) el.style.height = css;
    };
    tick();
    return onCooldownTick(tick);
  }, [number]);

  return (
    <MobileButton
      className={`mobile-slot${selected ? ' is-selected' : ''}${number < 0 ? ' is-empty' : ''}`}
      title={number >= 0 ? (skillDefinition(number)?.name ?? '') : t('skills.title')}
      onTap={() => (number >= 0 ? castSkill(number) : (MobileMenu.picker = slot))}
      onLongPress={() => (MobileMenu.picker = slot)}
    >
      {() => (
        <>
          {number >= 0 && (
            <div className="mobile-skill-art">
              <SkillIcon number={number} disabled={!usable} />
            </div>
          )}
          <span className="mobile-slot-key">{slot + 1}</span>
          <div ref={sweep} className="mobile-skill-delay" />
        </>
      )}
    </MobileButton>
  );
});

export const Slots = observer(() => (
  <div className="mobile-slots">
    {Array.from({ length: MOBILE_SKILL_SLOTS }, (_, slot) => (
      <Slot key={slot} slot={slot} />
    ))}
  </div>
));

/** Mu Magdalena's "Skills" window: 1 pick the position, 2 pick the skill, Clear to empty it. */
export const SkillPicker = observer(() => {
  const open = MobileMenu.picker;
  if (open < 0) return null;
  const learned = HeroSkills.skills.map(s => s.number).filter(isHotbarSkill);
  const close = () => (MobileMenu.picker = -1);

  const place = (number: number) => {
    MobileSkillSlots.assign(open, number);
    if (number >= 0 && open < MOBILE_SKILL_SLOTS - 1) MobileMenu.picker = open + 1;
  };

  return (
    <div className="mobile-modal" onPointerDown={close}>
      <div className="mobile-panel mobile-picker" onPointerDown={e => e.stopPropagation()}>
        <div className="mobile-panel-head">
          <span>{t('skills.title')}</span>
          <MobileButton className="mobile-close" onTap={close}>
            {() => <Icon name="close" size={20} />}
          </MobileButton>
        </div>
        <div className="mobile-picker-body">
          <div className="mobile-picker-col positions">
            <div className="mobile-picker-title">{t('mobile.pickPosition')}</div>
            <div className="mobile-picker-positions">
              {Array.from({ length: MOBILE_SKILL_SLOTS }, (_, slot) => {
                const number = MobileSkillSlots.slots[slot] ?? -1;
                return (
                  <MobileButton
                    key={slot}
                    className={`mobile-pick-slot${slot === open ? ' is-active' : ''}`}
                    onTap={() => (MobileMenu.picker = slot)}
                  >
                    {() => (
                      <>
                        {number >= 0 && (
                          <div className="mobile-skill-art">
                            <SkillIcon number={number} disabled={false} />
                          </div>
                        )}
                        <span className="mobile-slot-key">{slot + 1}</span>
                      </>
                    )}
                  </MobileButton>
                );
              })}
            </div>
            <MobileButton
              className={`mobile-attack-mode${MobileMenu.auto ? ' is-auto' : ''}`}
              onTap={() => (MobileMenu.auto = !MobileMenu.auto)}
            >
              {() => (
                <>
                  <Icon name="attack" size={18} />
                  <span>{MobileMenu.auto ? t('mobile.auto') : t('mobile.manual')}</span>
                </>
              )}
            </MobileButton>
          </div>
          <div className="mobile-picker-col skills">
            <div className="mobile-picker-title">{t('mobile.pickSkill')}</div>
            <div className="mobile-picker-grid">
              <MobileButton className="mobile-pick-skill is-clear" onTap={() => place(-1)}>
                {() => <span>{t('mobile.clear')}</span>}
              </MobileButton>
              {learned.map(number => (
                <MobileButton
                  key={number}
                  className={`mobile-pick-skill${skills.requirementsMet(number) ? '' : ' is-locked'}`}
                  title={skillDefinition(number)?.name ?? ''}
                  onTap={() => place(number)}
                >
                  {() => (
                    <div className="mobile-skill-art">
                      <SkillIcon number={number} disabled={!skills.requirementsMet(number)} />
                    </div>
                  )}
                </MobileButton>
              ))}
            </div>
            <div className="mobile-picker-hint">{learned.length ? t('mobile.pickHint') : t('skills.empty')}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

/** Per character: swap in its pad on a character change, seed a fresh one, drop skills it no longer has. */
export const useHeroPad = () => {
  const character = Hero.name;
  const learned = HeroSkills.skills;
  useEffect(() => {
    if (character) MobileSkillSlots.forCharacter(character);
  }, [character]);
  useEffect(() => {
    const numbers = learned.map(s => s.number);
    MobileSkillSlots.seed(numbers);
    MobileSkillSlots.prune(numbers);
  }, [learned]);
};
