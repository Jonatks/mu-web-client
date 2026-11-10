import { observer } from 'mobx-react-lite';
import { Store } from '../../store';
import { Joystick } from './Joystick';
import { Orbs, ExpStrip } from './Orbs';
import { ActionCluster } from './ActionCluster';
import { SideMenu } from './SideMenu';
import { Minimap } from './Minimap';
import './hud.less';

const PlayerBadge = observer(() => (
  <div className="player-badge">
    <div className="lvl">{Store.playerData.level}</div>
    <div className="meta">
      <b>{Store.focusedChar || Store.username || 'Jugador'}</b>
      <span>HP {Store.playerData.currentHP}/{Store.playerData.maxHP}</span>
    </div>
  </div>
));

export const Hud = () => (
  <div className="game-hud">
    <PlayerBadge />
    <Minimap />
    <SideMenu />
    <Joystick />
    <ActionCluster />
    <Orbs />
    <ExpStrip />
  </div>
);
