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
  const invSnap = await db.collection('inventory').get();
  console.log("=== Inventory item 'water bottle' ===");
  invSnap.forEach(d => {
    if (d.data().name?.toLowerCase().includes('water')) {
      console.log("ID:", d.id, JSON.stringify(d.data()));
    }
  });

  const menuSnap = await db.collection('menuItems').get();
  console.log("=== Menu item 'water bottle' ===");
  menuSnap.forEach(d => {
    if (d.data().name?.toLowerCase().includes('water')) {
      console.log("ID:", d.id, JSON.stringify(d.data()));
    }
  });

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
