import { makeAutoObservable, runInAction } from 'mobx';

type ManifestFile = { u: string; s: number };

// Descarga por adelantado los archivos esenciales para que el navegador los guarde en caché.
class PreloadState {
  status: 'idle' | 'loading' | 'done' | 'error' = 'idle';
  loadedBytes = 0;
  totalBytes = 0;
  label = '';
  error = '';

  constructor() {
    makeAutoObservable(this);
  }

  get progress() {
    return this.totalBytes ? Math.min(1, this.loadedBytes / this.totalBytes) : 0;
  }

  async start() {
    if (this.status === 'loading' || this.status === 'done') return;
    runInAction(() => (this.status = 'loading'));
    try {
      const res = await fetch('./preload-manifest.json', { cache: 'no-cache' });
      const files: ManifestFile[] = (await res.json()).files;
      runInAction(() => {
        this.totalBytes = files.reduce((a, f) => a + f.s, 0);
      });

      let next = 0;
      const worker = async () => {
        while (next < files.length) {
          const f = files[next++];
          runInAction(() => (this.label = f.u.split('/').slice(-2).join('/')));
          try {
            const r = await fetch(f.u, { cache: 'force-cache' });
            const reader = r.body?.getReader();
            if (!reader) {
              const b = await r.arrayBuffer();
              runInAction(() => (this.loadedBytes += b.byteLength));
            } else {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                runInAction(() => (this.loadedBytes += value.byteLength));
              }
            }
          } catch {
            runInAction(() => (this.loadedBytes += f.s));
          }
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      runInAction(() => (this.status = 'done'));
    } catch (e: any) {
      runInAction(() => {
        this.status = 'error';
        this.error = String(e?.message ?? e);
      });
    }
  }
}

export const Preload = new PreloadState();
