import type { InProcessApi } from '../_api/host';
import { decodePages } from './pagesWire';
import { Merchant } from './state';

/** Wires the Season 19 shop tabs (`pagesWire.ts`) to the merchant: the request on open and the pick before a buy. */
export function installPages(api?: InProcessApi): void {
  if (!api) return;
  Merchant.pageLink = {
    request: () => api.sendPacket(new Uint8Array([0])),
    pick: (page, slot) => api.sendPacket(new Uint8Array([1, page, slot])),
  };
  api.onPacket(payload => {
    if (payload[0] === 0) Merchant.setExtraPages(decodePages(payload));
  });
}
