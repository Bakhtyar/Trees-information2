const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

const target = "const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();";
const replacement = `const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const activeConfig = envConfig.apiKey ? envConfig : firebaseConfig;
const app = !getApps().length ? initializeApp(activeConfig) : getApp();`;

content = content.replace(target, replacement);

const target2 = `export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);`;

const replacement2 = `export const db = (activeConfig === firebaseConfig && firebaseConfig.firestoreDatabaseId)
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);`;
content = content.replace(target2, replacement2);

fs.writeFileSync('src/lib/firebase.ts', content);
