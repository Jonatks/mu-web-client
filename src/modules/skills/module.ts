import { defineModule } from '../module';
import { installNet } from './net';
import { installMasterLevel } from './masterLevel';
import { installMajesticLevel } from './majesticLevel';
import { installMasterTree } from './masterTree';

export default defineModule({
  id: 'skills',
  core: true,
  install() {
    installMasterLevel();
    installMajesticLevel();
    installMasterTree();
    installNet();
  },
});
