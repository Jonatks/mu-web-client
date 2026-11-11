import type { Entity, ISystemFactory } from '../world';

export const HighlightSystem: ISystemFactory = world => {
  const query = world.with('highlighted', 'modelObject', 'visibility');

  query.onEntityRemoved.subscribe(entity => {
    const layer = entity.highlighted.layer;
    if (entity.modelObject && layer) {
      entity.modelObject.getMeshes(true).forEach(mesh => {
        layer.removeMesh(mesh);
      });
    }

    entity.highlighted.layer = null;
  });

  const layer = world.scene.hl;
  const dead: Entity[] = [];

  return {
    update: () => {
      // A kill leaves the outline on the corpse until the next pointer event, which a finger may not send
      // for a long while: the red ghost over the body is dropped as soon as it is dying.
      for (const e of query) if (e.dying) dead.push(e);
      for (const e of dead) world.removeComponent(e, 'highlighted');
      dead.length = 0;

      for (const { highlighted, modelObject, visibility } of query) {
        if (visibility.state === 'hidden') continue;
        if (!modelObject.Ready) continue;
        if (highlighted.layer) continue;

        modelObject.getMeshes(true).forEach(mesh => {
          layer.addMesh(mesh, highlighted.color);

          highlighted.layer = layer;
        });
      }
    },
  };
};
