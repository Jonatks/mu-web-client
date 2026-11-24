import { defineImprovement } from '@/controllers/fidelity';

/**
 * Our modern window theme: the item windows' frame, inner tables and buttons drawn as forged panels (dark glass,
 * aged-gold edges, cut corners), sharp at any size. Classic: the original's sprites (`newui_item_back0x`,
 * NewUIInventoryCtrl.cpp). Read in `controllers/interface/components/mu_window` (`MuItemWindow`, `MuTableFrame`).
 */
export default defineImprovement({
  id: 'modernWindows',
  preset: 'ultra',
  labelKey: 'fidelity.modernWindows',
  hintKey: 'fidelity.modernWindows.hint',
});
