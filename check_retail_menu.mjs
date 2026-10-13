import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: "dbcafe-3f5ee",
    clientEmail: "firebase-adminsdk-fbsvc@dbcafe-3f5ee.iam.gserviceaccount.com",
    privateKey: PRIVATE_KEY,
  })
});

const db = getFirestore();

async function check() {
  const menuSnap = await db.collection('menuItems').get();
  console.log(`Checking ${menuSnap.size} menu items for retail...`);
  menuSnap.forEach(d => {
    const data = d.data();
    if (data.isRetail || data.linkedInventoryId || (data.category || '').toLowerCase().includes('retail')) {
      console.log(`- ${data.name} (cat: ${data.category}, isRetail: ${data.isRetail}, linked: ${data.linkedInventoryId})`);
    }
  });
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
