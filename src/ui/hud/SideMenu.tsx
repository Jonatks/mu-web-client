import { observer } from 'mobx-react-lite';
import { Store } from '../../store';
import { EventBus } from '../../libs/eventBus';
import { enterImmersive } from '../shell/device';

export const SideMenu = observer(() => (
  <div className="side-menu">
    <button onClick={() => (Store.inventoryEnabled = !Store.inventoryEnabled)}><i>🎒</i><b>Inventario</b></button>
    <button onClick={() => (Store.characterInfoEnabled = !Store.characterInfoEnabled)}><i>🛡</i><b>Personaje</b></button>
    <button onClick={() => EventBus.emit('keyPressed' as any, 'KeyM' as any)}><i>🗺</i><b>Mapas</b></button>
    <button onClick={() => enterImmersive()}><i>⛶</i><b>Pantalla</b></button>
  </div>
));
