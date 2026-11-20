import { defineWindow } from '@/controllers/interface/windows';
import { MajesticStatsWindow } from '.';

export default defineWindow({ id: 'majestic_stats', slot: 'hud', order: 295, component: MajesticStatsWindow });
