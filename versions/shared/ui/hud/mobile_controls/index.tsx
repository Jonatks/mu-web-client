import './style.less';
import { observer } from 'mobx-react-lite';
import { AppState, UIState } from '@/controllers/interface/uiState';
import { useIsMobile } from '@/controllers/interface/mobile';
import { StatusPanel } from './statusPanel';
import { TopButtons } from './topButtons';
import { Orb, Gauges, ExpLine } from './vitals';
import { Slots, SkillPicker, useHeroPad } from './skillBar';
import { AttackButton } from './attackButton';
import { CommandMenu } from './commandMenu';
import { Joystick } from './joystick';
import { TalkButton } from './talkButton';
import { ItemSheetView } from './itemSheet';

/** The bottom bar of a touch screen: life, the six skill slots with AG / SD over them and experience under, mana. */
const Bar = observer(() => {
  useHeroPad();
  return (
    <div className="mobile-bar">
      <Orb kind="hp" />
      <div className="mobile-bar-mid">
        <Gauges />
        <Slots />
        <ExpLine />
      </div>
      <Orb kind="mp" />
    </div>
  );
});

/**
 * The touch HUD (Mu Magdalena's layout). This one guard is what makes "mobile only" true for everything under it, so
 * no child widget needs a check of its own: on a mouse none of this exists in the DOM at all. The original bar, its
 * five buttons, the event timers and the Helper buttons hide themselves on a touch screen (`isMobileDevice`).
 *
 * It renders into `.hud`, which is `pointer-events: none`, so each button opts itself back in.
 */
export const MobileControls = observer(() => {
  if (!useIsMobile()) return null;
  // Not over the loading screen: `playerEntity` is plain per-frame state and would not re-render this when it arrives,
  // so the observable state is what gates the HUD.
  if (AppState.uiState !== UIState.World) return null;

  return (
    <div className="mobile-controls">
      <StatusPanel />
      <TopButtons />
      <Bar />
      <AttackButton />
      <Joystick />
      <TalkButton />
      <SkillPicker />
      <CommandMenu />
      <ItemSheetView />
    </div>
  );
});
