import { defineWindow } from '@/controllers/interface/windows';
import { InventoryExtension } from '.';

export default defineWindow({ id: 'inventory_extension', slot: 'hud', order: 82, component: InventoryExtension });
