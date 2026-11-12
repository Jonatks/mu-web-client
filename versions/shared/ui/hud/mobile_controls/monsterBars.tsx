import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Matrix, Vector3, Viewport } from '@/controllers/render/babylon/exports';
import { Ecs } from '@/ecs/current';
import { isAttackableEntity } from '@/ecs/systems/attackSystem';
import type { Entity } from '@/ecs/world';

/** How many monsters carry a label at once, and how near (tiles) they must be. */
const POOL = 5;
const RANGE = 8;
/** Frames between looks for who is nearest; the labels themselves follow every frame. */
const REFRESH = 6;
/** Above the model's root, in world units. */
const HEAD = 2.1;

/**
 * Mu Magdalena draws the name and a red life bar over every monster in view. On a phone that is a lot of labels, so it is the
 * nearest few (the ones a thumb can reach), a fixed pool of elements moved straight on the DOM after each render: no allocation and
 * no React render per frame. The target's own bar at the top stays as it was.
 */
export const MonsterBars = observer(() => {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const world = Ecs.world;
    const container = root.current;
    if (!world || !container) return undefined;

    const scene = world.scene;
    const engine = scene.getEngine();
    const ring = container.lastElementChild as HTMLElement;
    const slots = Array.from(container.children).slice(0, POOL) as HTMLElement[];
    const chosen: (Entity | null)[] = new Array(POOL).fill(null);
    const dist: number[] = new Array(POOL).fill(Infinity);
    const names: string[] = new Array(POOL).fill('');
    const viewProjection = Matrix.Identity();
    const anchor = Vector3.Zero();
    const screen = Vector3.Zero();
    const viewport = new Viewport(0, 0, 0, 0);
    let frame = 0;

    const pick = () => {
      const hero = world.playerEntity;
      chosen.fill(null);
      dist.fill(RANGE * RANGE);
      if (!hero) return;
      const hx = hero.transform.pos.x;
      const hz = hero.transform.pos.z;
      for (const e of world.netObjsQuery.entities) {
        if (!e.transform || e.dying || e.objOutOfScope || !e.modelObject || !isAttackableEntity(world, e)) continue;
        const d = (e.transform.pos.x - hx) ** 2 + (e.transform.pos.z - hz) ** 2;
        // Insertion into the five nearest.
        for (let i = 0; i < POOL; i++) {
          if (d < dist[i]) {
            for (let j = POOL - 1; j > i; j--) {
              dist[j] = dist[j - 1];
              chosen[j] = chosen[j - 1];
            }
            dist[i] = d;
            chosen[i] = e;
            break;
          }
        }
      }
    };

    const sub = scene.onAfterRenderObservable.add(() => {
      if (frame++ % REFRESH === 0) pick();
      const camera = scene.activeCamera;
      if (!camera) return;

      camera.getViewMatrix().multiplyToRef(camera.getProjectionMatrix(), viewProjection);
      const renderW = engine.getRenderWidth();
      const renderH = engine.getRenderHeight();
      camera.viewport.toGlobalToRef(renderW, renderH, viewport);
      const canvas = engine.getRenderingCanvas();
      const kx = (canvas?.clientWidth || renderW) / renderW;
      const ky = (canvas?.clientHeight || renderH) / renderH;

      for (let i = 0; i < POOL; i++) {
        const el = slots[i];
        const e = chosen[i];
        if (!e || e.dying || !e.modelObject) {
          if (el.style.display !== 'none') el.style.display = 'none';
          continue;
        }
        anchor.copyFrom(e.modelObject.node.getAbsolutePosition());
        anchor.y += HEAD;
        Vector3.ProjectToRef(anchor, Matrix.IdentityReadOnly, viewProjection, viewport, screen);
        if (screen.z < 0 || screen.z > 1) {
          el.style.display = 'none';
          continue;
        }
        if (el.style.display !== 'flex') el.style.display = 'flex';
        el.style.transform = `translate(${screen.x * kx}px, ${screen.y * ky}px) translate(-50%, -100%)`;

        const name = e.objectNameInWorld ?? '';
        if (name !== names[i]) {
          names[i] = name;
          (el.firstChild as HTMLElement).textContent = name;
        }
        const attributes = e.attributeSystem;
        const max = attributes ? attributes.getValue('maxHealth') : 0;
        const current = attributes ? attributes.getValue('currentHealth') : 0;
        const fraction = max > 0 ? Math.max(0, Math.min(1, current / max)) : 1;
        const bar = el.lastElementChild?.firstElementChild as HTMLElement | null;
        if (bar) bar.style.width = `${fraction * 100}%`;
      }

      // The orange ring under the attack target (Mu Magdalena draws it at the feet).
      const target = world.attackTarget;
      if (!target || target.dying || !target.modelObject) {
        if (ring.style.display !== 'none') ring.style.display = 'none';
        return;
      }
      anchor.copyFrom(target.modelObject.node.getAbsolutePosition());
      Vector3.ProjectToRef(anchor, Matrix.IdentityReadOnly, viewProjection, viewport, screen);
      if (screen.z < 0 || screen.z > 1) {
        ring.style.display = 'none';
        return;
      }
      if (ring.style.display !== 'block') ring.style.display = 'block';
      ring.style.transform = `translate(${screen.x * kx}px, ${screen.y * ky}px) translate(-50%, -50%)`;
    });

    return () => {
      scene.onAfterRenderObservable.remove(sub);
    };
  }, []);

  return (
    <div className="mobile-monsters" ref={root}>
      {Array.from({ length: POOL }, (_, i) => (
        <div key={i} className="mobile-monster" style={{ display: 'none' }}>
          <span />
          <div>
            <i />
          </div>
        </div>
      ))}
      <b className="mobile-target-ring" style={{ display: 'none' }} />
    </div>
  );
});
