import { describe, expect, it } from 'vitest';
import { Observable } from '@babylonjs/core/Misc/observable';

/**
 * Why `CharacterSelectSystem` reads the hovered character one microtask after the press: it is
 * registered before `PointerInputSystem` (`ecs/createWorld.ts`), and the observable runs observers
 * in registration order, so on the press itself it sees the target the last hover left behind.
 * With a mouse the hover is current, so nobody noticed; a finger has none, so every tap picked the
 * wrong character.
 */
describe('pointer observers and the target a later one resolves', () => {
  it('an earlier observer sees the stale target now and the fresh one a microtask later', async () => {
    const pointer = new Observable<number>();
    let target = 'first of the line-up';
    let seenAtOnce = '';
    let seenLater = '';

    pointer.add(() => {
      seenAtOnce = target;
      queueMicrotask(() => {
        seenLater = target;
      });
    });
    pointer.add(() => {
      target = 'the one under the finger';
    });

    pointer.notifyObservers(0);
    expect(seenAtOnce).toBe('first of the line-up');

    await Promise.resolve();
    expect(seenLater).toBe('the one under the finger');
  });
});
