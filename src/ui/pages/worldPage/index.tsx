import './style.less';
import { observer } from 'mobx-react-lite';
import { WorldObjects } from '../../components/worldObjects';
import { MapsList } from './components/mapsList';
import { Hud } from '../../hud/Hud';
import { CharacterInfo } from './components/characterInfo';
import { Inventory } from './components/inventory';

const HUD = observer(() => {
  return (
    <div className="hud">
      <Hud />
      <div className="panels-stack">
        <Inventory />
        <CharacterInfo />
      </div>
      <MapsList />
    </div>
  );
});

export const WorldPage = observer(() => {
  return (
    <div className="world-page">
      <WorldObjects />
      <HUD />
    </div>
  );
});
