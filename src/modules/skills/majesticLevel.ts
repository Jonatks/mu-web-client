/**
 * The Majestic level of Season 19 (1 to 900, past master level 400): our OpenMU plugin's `MajesticStatus` (C1 E7 10,
 * `openmu/plugins/GameLogic/Majestic`). The experience passes JavaScript's exact integers, so it stays a bigint.
 */
import { observable, runInAction } from 'mobx';
import { EventBus } from '../../core/eventBus';
import { t } from '@/i18n';
import { Social } from '../social/social';
import { MajesticStatusPacket } from '@versions/shared/packets/ServerToClientPackets';

interface MajesticState {
  level: number;
  points: number;
  experience: bigint;
  experienceOfLevel: bigint;
  experienceOfNextLevel: bigint;
  /** Points spent on each node of the stat tree (section * 4 + id). */
  statPoints: number[];
  /** A `MajesticStatus` arrived: the hero's master level is at its top. */
  received: boolean;
}

const state = observable.object<MajesticState>({
  level: 0,
  points: 0,
  experience: 0n,
  experienceOfLevel: 0n,
  experienceOfNextLevel: 0n,
  statPoints: [0, 0, 0, 0, 0, 0, 0, 0],
  received: false,
});

export const majesticLevel = (): number => state.level;
export const majesticPoints = (): number => state.points;
/** Whether the hero levels in Majestic (the server sends it once the master level is at its top). */
export const majesticActive = (): boolean => state.received;
/** Points spent on a node of the stat tree. */
export const majesticStatPoints = (node: number): number => state.statPoints[node] ?? 0;

/** Progress through the current Majestic level, 0…1 (bigint maths; only the ratio becomes a number). */
export function majesticExpPercent(): number {
  const need = state.experienceOfNextLevel - state.experienceOfLevel;
  const have = state.experience - state.experienceOfLevel;
  if (need <= 0n || have <= 0n) return 0;
  return have >= need ? 1 : Number((have * 10000n) / need) / 10000;
}

/** Reads a `MajesticStatus` into the state; a level up is said in the chat. */
export function applyMajesticStatus(p: MajesticStatusPacket): void {
  const raw = p.buffer;
  runInAction(() => {
    // Bytes 33-40, the stat tree (the generated getter copies from the start of the underlying buffer).
    if (raw.byteLength >= 41) state.statPoints = Array.from({ length: 8 }, (_, i) => raw.getUint8(33 + i));
    state.level = p.Level;
    state.points = p.Points;
    state.experience = p.Experience;
    state.experienceOfLevel = p.ExperienceOfLevel;
    state.experienceOfNextLevel = p.ExperienceOfNextLevel;
    state.received = true;
  });
  if (p.LevelUp) Social.systemMessage(t('notify.majesticLevelUp', { level: p.Level }));
}

/** Registers the listener; the skills module installs it (module.ts). */
export function installMajesticLevel(): void {
  EventBus.on('MajesticStatus', packet => applyMajesticStatus(new MajesticStatusPacket(packet)));
  // F3 03 starts every character in the world: it has no Majestic level until its own MajesticStatus.
  EventBus.on('CharacterInformation', resetMajestic);
  EventBus.on('CharacterInformationExtended', resetMajestic);
}

function resetMajestic(): void {
  runInAction(() => {
    state.level = 0;
    state.points = 0;
    state.experience = 0n;
    state.experienceOfLevel = 0n;
    state.experienceOfNextLevel = 0n;
    state.statPoints = [0, 0, 0, 0, 0, 0, 0, 0];
    state.received = false;
  });
}
