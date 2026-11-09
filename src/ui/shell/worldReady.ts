import { makeAutoObservable } from 'mobx';
import { EventBus } from '../../libs/eventBus';
import { Store } from '../../store';

// Estado de carga del mundo. Se considera listo cuando la escena está lista y
// la cantidad de mallas se mantiene estable durante ~1 s (los modelos se cargan de forma asíncrona).
class WorldReadyState {
  loading = false;
  private timer?: number;

  constructor() {
    makeAutoObservable(this);
    EventBus.on('requestWarp', () => {
      this.loading = true;
      this.stopPolling();
    });
    EventBus.on('warpCompleted', () => this.startPolling());
  }

  private stopPolling() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private startPolling() {
    this.stopPolling();
    const t0 = performance.now();
    let lastCount = -1;
    let stable = 0;
    this.timer = window.setInterval(() => {
      const scene = Store.world?.scene;
      const count = scene?.meshes.length ?? 0;
      const ready = !!scene && scene.isReady();
      stable = ready && count === lastCount && count > 0 ? stable + 1 : 0;
      lastCount = count;
      const elapsed = performance.now() - t0;
      if ((stable >= 5 && elapsed > 1500) || elapsed > 45000) {
        this.stopPolling();
        this.loading = false;
      }
    }, 200);
  }
}
export const WorldReady = new WorldReadyState();
