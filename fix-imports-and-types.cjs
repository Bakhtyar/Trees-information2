const fs = require('fs');
let content = fs.readFileSync('src/components/AccountModal.tsx', 'utf8');

content = content.replace(
  /getUserProjectsFromFirestore\n\} from '\.\.\/lib\/firebase';/,
  'getUserProjectsFromFirestore,\n  getUserFromFirestoreByEmail\n} from \'../lib/firebase\';'
);

content = content.replace(
  /googleConnected: true,\n\s*lastSyncedAt: Date\.now\(\),/g,
  'googleConnected: true,\n      createdAt: Date.now(),\n      lastSyncedAt: Date.now(),'
);

content = content.replace(
  /googleConnected: false,\n\s*lastSyncedAt: Date\.now\(\)/g,
  'googleConnected: false,\n      createdAt: Date.now(),\n      lastSyncedAt: Date.now()'
);

fs.writeFileSync('src/components/AccountModal.tsx', content);
