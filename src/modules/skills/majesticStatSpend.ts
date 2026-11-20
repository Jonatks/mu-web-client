import { Session } from '../session';

/** Asks the server to spend a Majestic point on a node of the stat tree (our plugin's C1 05 E7 11 node). */
export function spendMajesticStat(node: number): void {
  Session.sendToGS(new DataView(new Uint8Array([0xc1, 5, 0xe7, 0x11, node]).buffer));
}
