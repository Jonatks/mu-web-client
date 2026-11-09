import { ServersPage } from './ui/pages/serversPage';
import { observer } from 'mobx-react-lite';
import { Store, UIState } from './store';
import { LoginPage } from './ui/pages/loginPage';
import { CharactersPage } from './ui/pages/charactersPage';
import { WorldPage } from './ui/pages/worldPage';
import { Notification } from './ui/components/notification';
import { useEventBus } from './hooks/useEventBus';
import { Debug } from './ui/components/debug';
import { PreloaderPage } from './ui/pages/preloaderPage';
import { RotateOverlay } from './ui/shell/RotateOverlay';
import { LoadingOverlay } from './ui/shell/LoadingOverlay';

const CurrentPage = observer(() => {
  const state = Store.uiState;

  switch (state) {
    case UIState.Preloader:
      return <PreloaderPage />;
    case UIState.Servers:
      return <ServersPage />;
    case UIState.Login:
      return <LoginPage />;
    case UIState.Characters:
      return <CharactersPage />;
    case UIState.LoadingWorld:
    case UIState.World:
      return <WorldPage />;
    default:
      return <div>No Page</div>;
  }
});

export const App = observer(() => {
  const state = Store.uiState;

  useEventBus('wsError', () => {
    Store.addNotification('Error de conexión con el servidor', 'error');
  });

  return (
    <div className="app">
      <CurrentPage />
      <Notification />
      <LoadingOverlay />
      {state !== UIState.Preloader && <RotateOverlay />}
      {state === UIState.World && location.search.includes('debug') && <Debug />}
    </div>
  );
});
