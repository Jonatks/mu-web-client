import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Store } from '../../../store';
import { Preload } from '../../shell/preload';
import { enterImmersive } from '../../shell/device';
import './style.less';

export const PreloaderPage = observer(() => {
  useEffect(() => {
    Preload.start();
  }, []);

  const pct = Math.round(Preload.progress * 100);
  const ready = Preload.status === 'done' || Preload.status === 'error';

  return (
    <div className="preloader-page launcher">
      <div className="launcher-bg" />
      <div className="launcher-card">
        <h1 className="launcher-title">MU WEB</h1>
        <p className="launcher-sub">Cliente de pruebas</p>

        <div className="launcher-progress">
          <div className="bar">
            <div className="fill" style={{ width: `${ready ? 100 : pct}%` }} />
          </div>
          <div className="status">
            {Preload.status === 'error'
              ? 'No se pudo precargar; el juego cargará bajo demanda'
              : ready
                ? 'Archivos listos'
                : `Preparando archivos del juego… ${pct}%`}
          </div>
        </div>

        <button
          className="play-btn"
          disabled={!ready}
          onClick={async () => {
            await enterImmersive();
            Store.playOnline();
          }}
        >
          JUGAR
        </button>
        <button
          className="link-btn"
          disabled={!ready}
          onClick={async () => {
            await enterImmersive();
            Store.playOffline();
          }}
        >
          Modo sin conexión
        </button>
      </div>
    </div>
  );
});
