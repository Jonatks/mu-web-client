import { describe, expect, it } from 'vitest';
import type { Item } from '@/ecs/world';
import { isBook, isBow, isCrossbow, swordformGlovesModel } from './weaponClass';

const item = (group: number, num: number) => ({ group, num }) as Item;

// The later Mastery weapons (S19 ItemList, generations Bloodangel to Lightning).
describe('Mastery weapons', () => {
  it('reads the books as books and the staffs as staffs', () => {
    expect([57, 58, 106, 146].map(n => isBook(item(5, n)))).toEqual([true, true, true, true]);
    expect([41, 51, 61].map(n => isBook(item(5, n)))).toEqual([false, false, false]);
  });

  it('draws the bows as bows', () => {
    expect([28, 31, 67].map(n => isBow(item(4, n)))).toEqual([true, true, true]);
    expect(isCrossbow(item(4, 31))).toBe(false);
  });

  it('wears each claw as its right and left pair', () => {
    expect(swordformGlovesModel(item(0, 56), 0)).toBe('Sword39_R.glb');
    expect(swordformGlovesModel(item(0, 124), 1)).toBe('sword49_L.glb');
  });
});
