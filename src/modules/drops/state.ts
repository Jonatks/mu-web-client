import { makeObservable, observable, runInAction } from 'mobx';
import { PickupItemRequestPacket } from '@versions/shared/packets/ClientToServerPackets';
import { Session } from '../session';
import { isMobileDevice } from '@/controllers/interface/mobile';

/** The names over the drops (ALT) and the pick-up request. */
export const Drops = new (class {
  /** Names over every drop (CNewUINameWindow::m_bShowItemName, toggled by ALT). */
  // ALT toggles it on a keyboard; a phone has no ALT, so the names start on there.
  showDropNames = isMobileDevice();

  toggleDropNames(): void {
    runInAction(() => {
      this.showDropNames = !this.showDropNames;
    });
  }

  pickupItemRequest(itemNetId: number): void {
    if (Session.isOffline) return;

    const packet = PickupItemRequestPacket.createPacket();
    packet.ItemId = itemNetId;

    Session.sendToGS(packet.buffer);
  }

  constructor() {
    makeObservable(this, {
      showDropNames: observable,
    });
  }
})();
