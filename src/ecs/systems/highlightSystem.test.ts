import { describe, expect, it } from 'vitest';
import { World } from 'miniplex';
import { HighlightSystem } from './highlightSystem';
import type { Entity, World as GameWorld } from '../world';

function build() {
  const ecs = new World<Entity>();
  const removed: unknown[] = [];
  const world = Object.assign(ecs, {
    scene: { hl: { addMesh() {}, removeMesh: (m: unknown) => removed.push(m) } },
  }) as unknown as GameWorld;
  const mesh = {};
  const model = { Ready: true, getMeshes: () => [mesh] };
  const entity = ecs.add({
    highlighted: { color: {}, layer: null },
    modelObject: model,
    visibility: { state: 'visible' },
  } as unknown as Entity);
  return { ecs, system: HighlightSystem(world), entity, removed, mesh };
}

describe('HighlightSystem', () => {
  it('outlines a visible entity once its model is ready', () => {
    const { system, entity } = build();
    system.update?.(1);
    expect(entity.highlighted?.layer).not.toBeNull();
  });

  it('drops the outline of an entity that is dying, and takes its meshes off the layer', () => {
    const { ecs, system, entity, removed, mesh } = build();
    system.update?.(1);
    ecs.addComponent(entity, 'dying', {} as never);
    system.update?.(1);
    expect(entity.highlighted).toBeUndefined();
    expect(removed).toContain(mesh);
  });
});
