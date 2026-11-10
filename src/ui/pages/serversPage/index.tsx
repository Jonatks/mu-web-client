import './style.less';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import {
  ConnectionInfoPacket,
  ConnectionInfoRequestPacket,
  ServerListResponsePacket,
} from '../../../common/packets/ConnectServerPackets';
import { useEventBus } from '../../../hooks/useEventBus';
import { CS_HOST } from '../../../consts';
import { useEffect, useRef } from 'react';
import { MenuBackdrop, MuLogo } from '../../shell/menu';

export const ServersPage = observer(() => {
  const hasAnyServer = Store.serverList.length > 0;

  const onConnectClick = async (serverId: number) => {
    const packet = ConnectionInfoRequestPacket.createPacket();
    packet.ServerId = serverId;

    Store.sendToCS(packet.buffer);
  };

  useEventBus('ServerListResponse', bytes => {
    const p = new ServerListResponsePacket(bytes);
    const servers = p.getServers(p.ServerCount);
    Store.serverList = servers;
  });

  useEventBus('ConnectionInfo', async bytes => {
    const p = new ConnectionInfoPacket(bytes);
    const address = Store.config.csIp ?? CS_HOST; //use local host

    console.log(`connection info: ${address}:${p.Port}`);

    await Store.connectToGameServer(address, p.Port);
  });

  // Con un solo servidor se conecta automáticamente
  const autoRef = useRef(false);
  useEffect(() => {
    if (Store.serverList.length === 1 && !autoRef.current) {
      autoRef.current = true;
      onConnectClick(Store.serverList[0].ServerId);
    }
  }, [Store.serverList.length]);

  const single = Store.serverList.length === 1;

  return (
    <div className="mu-screen mu-servers">
      <MenuBackdrop />
      <MuLogo />
      {!hasAnyServer || single ? (
        <div className="mu-connecting">
          <i className="spinner" />
          <span>{single ? `Entrando a Servidor ${Store.serverList[0].ServerId}…` : 'Conectando con el servidor…'}</span>
        </div>
      ) : (
        <div className="mu-frame mu-serverlist">
          <h3>Elige servidor</h3>
          {Store.serverList.map(s => (
            <button key={s.ServerId} className="mu-server" onClick={() => onConnectClick(s.ServerId)}>
              <i className={`dot ${s.LoadPercentage >= 80 ? 'busy' : 'ok'}`} />
              <b>Servidor {s.ServerId}</b>
              <em>{s.LoadPercentage}%</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
