import { useEffect, useRef, useState } from 'react';
import { Store } from '../../store';

const TILES = 64; // tiles visibles
const PX = 2.4; // px por tile

export const Minimap = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const draw = () => {
      const w = Store.world;
      const c = ref.current;
      const p = w?.playerEntity;
      if (!w || !c || !p) return;
      const ctx = c.getContext('2d')!;
      const cx = Math.floor(p.transform.pos.x);
      const cz = Math.floor(p.transform.pos.z);
      const size = TILES * PX;
      ctx.fillStyle = '#0b0a07';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < TILES; i++) {
        for (let j = 0; j < TILES; j++) {
          const tx = cx - TILES / 2 + i;
          const tz = cz - TILES / 2 + j;
          if (tx < 0 || tz < 0 || tx > 255 || tz > 255) continue;
          ctx.fillStyle = w.isWalkable(tx, tz) ? '#6b5a35' : '#241f14';
          // eje Z hacia arriba en pantalla
          ctx.fillRect(i * PX, (TILES - 1 - j) * PX, PX, PX);
        }
      }
      ctx.fillStyle = '#7CFC8A';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
      setPos({ x: cx, y: cz });
    };
    const id = window.setInterval(draw, 250);
    draw();
    return () => clearInterval(id);
  }, []);

  const size = TILES * PX;
  return (
    <div className="minimap">
      <canvas ref={ref} width={size} height={size} />
      <span className="coords">{pos.x}, {pos.y}</span>
    </div>
  );
};
