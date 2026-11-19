/** Whether a bar is under the player's threshold (`autoPotionPercent`, in tenths); see autoMana.ts. */
export const underThreshold = (value: number, max: number, tenths: number): boolean => max > 0 && value < (max * tenths) / 10;
