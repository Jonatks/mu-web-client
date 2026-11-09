import { observer } from 'mobx-react-lite';
import { WorldReady } from './worldReady';

export const LoadingOverlay = observer(() => {
  if (!WorldReady.loading) return null;
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p>Cargando el mundo…</p>
    </div>
  );
});
