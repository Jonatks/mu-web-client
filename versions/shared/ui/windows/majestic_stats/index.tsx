import { MuWindows } from '@/controllers/interface/windowManager';
import './style.less';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { uiClick } from '@/controllers/sound/sfx';
import { MuText } from '@/controllers/interface/components/mu_text';
import { useWindowChrome } from '@/controllers/interface/components/mu_window';
import { getBaseClass } from '@/core/types';
import { Hero } from '@/modules/hero';
import { majesticStatCap, majesticStatNodes, majesticStatValue, skills, spendMajesticStat } from '@/modules/skills';
import { t, type TextKey } from '@/i18n';

/**
 * The Majestic stat tree of Season 19 (SkillTreeMajesticStat.xml): two sections of four nodes, one point each from the
 * Majestic points. No Season 6 sheet to port, so it is the session panel's black plate. See readme.md.
 */

const WINDOW_ID = 'majestic-stats';
const WIDTH = 230;
const ROW = 14;
const TITLE_Y = 4;
const INFO_Y = 18;
const FIRST = 36;
const SECTION_GAP = 18;
const HEIGHT = FIRST + 2 * SECTION_GAP + 8 * ROW + 18;
const LABEL_X = 8;
const VALUE_X = 168;
const POINTS_X = 204;
const PLUS_X = 210;
const CLOSE_HEIGHT = 12;

const TITLE_COLOR = 'rgb(255, 204, 26)';
const LABEL_COLOR = 'rgb(127, 178, 255)';
const VALUE_COLOR = 'rgb(140, 255, 140)';

export const MajesticStatsWindow = observer(() => {
  const open = MuWindows.isOpen('majestic_stats');
  const close = () => runInAction(() => MuWindows.setOpen('majestic_stats', false));
  const chrome = useWindowChrome(WINDOW_ID, { width: WIDTH, height: HEIGHT, onClose: close });
  if (!open) return null;

  const nodes = majesticStatNodes(getBaseClass(Hero.charClass));
  const level = skills.majesticLevel;
  const left = skills.majesticPoints;

  return (
    <div
      ref={chrome.ref as React.Ref<HTMLDivElement>}
      role="dialog"
      aria-label={t('majestic.title')}
      className="majestic-window"
      onPointerDown={chrome.onPointerDown}
      style={{ width: WIDTH, height: HEIGHT, ...chrome.style, transformOrigin: '0 0' }}
    >
      <MuText face="bold" className="majestic-center" color={TITLE_COLOR} style={{ left: WIDTH / 2, top: TITLE_Y }} text={t('majestic.title')} />
      <MuText className="majestic-center" style={{ left: WIDTH / 2, top: INFO_Y }} text={t('majestic.info', { level, points: left })} />

      {[0, 1].map(section => (
        <MuText
          key={section}
          face="bold"
          className="majestic-label"
          color={TITLE_COLOR}
          style={{ left: LABEL_X, top: FIRST + section * (4 * ROW + SECTION_GAP) }}
          text={t(section === 0 ? 'majestic.defense' : 'majestic.attack')}
        />
      ))}

      {nodes.map((node, i) => {
        const top = FIRST + (i >> 2) * (4 * ROW + SECTION_GAP) + ROW + (i % 4) * ROW;
        const points = skills.majesticStatPoints(i);
        const cap = majesticStatCap(node, level);
        const canSpend = left > 0 && points < cap;
        return (
          <div key={i}>
            <MuText className="majestic-label" color={LABEL_COLOR} style={{ left: LABEL_X, top }} text={t(`majestic.node.${node.skill}` as TextKey)} />
            <MuText className="majestic-right" color={VALUE_COLOR} style={{ left: VALUE_X, top }} text={`+${Math.floor(majesticStatValue(node, points))}`} />
            <MuText className="majestic-right" style={{ left: POINTS_X, top }} text={`${points}/${cap}`} />
            <div
              className={canSpend ? 'majestic-plus' : 'majestic-plus off'}
              data-no-drag="true"
              style={{ left: PLUS_X, top: top + 1 }}
              onClick={canSpend ? uiClick(() => spendMajesticStat(i)) : undefined}
            >
              +
            </div>
          </div>
        );
      })}

      <div
        className="majestic-close"
        data-no-drag="true"
        style={{ top: HEIGHT - CLOSE_HEIGHT - 2, height: CLOSE_HEIGHT, lineHeight: `${CLOSE_HEIGHT}px` }}
        onClick={uiClick(close)}
      >
        <MuText text={t('majestic.close')} />
      </div>
    </div>
  );
});
