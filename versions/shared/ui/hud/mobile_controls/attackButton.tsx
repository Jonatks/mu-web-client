import { observer } from 'mobx-react-lite';
import { t } from '@/i18n';
import { HeroSkills } from '@/modules/skills';
import { isHotbarSkill } from '@/modules/skills/skillCasting';
import { SkillIcon } from '../../components/skill_icon';
import { MobileButton } from './mobileButton';
import { toggleFire } from './fireControl';
import { MobileMenu } from './menuState';
import { Icon } from './icons';

/**
 * The big round button bottom right (Mu Magdalena's skill button): it shows the current skill. One thumb press picks the nearest
 * monster and keeps hitting it with that skill (`fireControl.ts`) - Energy Ball, a book spell - or with the plain swing when no attack
 * skill is selected; pressed again it lets go. In AUTO mode it picks the next monster by itself, like a small Helper.
 */
export const AttackButton = observer(() => {
  const current = HeroSkills.currentSkill;
  const showSkill = current >= 0 && isHotbarSkill(current);
  const auto = MobileMenu.auto;

  return (
    <>
      <MobileButton
        className="mobile-book"
        title={t('skills.title')}
        onTap={() => (MobileMenu.picker = 0)}
      >
        {() => <Icon name="skills" size={22} />}
      </MobileButton>
      <MobileButton
        className={`mobile-attack${auto ? ' is-auto' : ''}${MobileMenu.firing ? ' is-firing' : ''}`}
        title={t('mobile.attack')}
        onTap={toggleFire}
      >
        {() =>
          showSkill ? (
            <div className="mobile-attack-skill">
              <SkillIcon number={current} disabled={false} />
            </div>
          ) : (
            <Icon name="attack" size={34} />
          )
        }
      </MobileButton>
    </>
  );
});
