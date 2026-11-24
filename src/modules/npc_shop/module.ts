import { defineModule } from '../module';
import { installNet } from './net';
import { installPages } from './pages';

export default defineModule({
  id: 'npc_shop',
  core: true,
  install: api => {
    installNet();
    installPages(api);
  },
});
