import { expect, test } from 'bun:test';
import { experienceFor } from './exp';

test('matches the values OpenMU stores', () => {
  expect(experienceFor(1)).toBe(0);
  expect(experienceFor(400)).toBe(3822148080);
});
