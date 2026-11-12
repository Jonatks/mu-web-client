// OpenMU's experience formula (GameConfiguration.ExperienceFormula): total experience a level needs.
export function experienceFor(level: number): number {
  if (level <= 0) return 0;
  if (level < 256) return 10 * (level + 8) * (level - 1) * (level - 1);
  return 10 * (level + 8) * (level - 1) * (level - 1) + 1000 * (level - 247) * (level - 256) * (level - 256);
}
