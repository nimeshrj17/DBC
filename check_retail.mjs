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
  console.log(`=== INVENTORY (${invSnap.size} items) ===`);
  invSnap.forEach(d => {
    const data = d.data();
    console.log(`- [${data.type || 'no-type'}] ${data.name} (cat: ${data.retailCategory || data.category}, qty: ${data.quantity})`);
  });

  const menuSnap = await db.collection('menuItems').get();
  console.log(`\n=== MENUITEMS (${menuSnap.size} items) ===`);
  const cats = new Set();
  menuSnap.forEach(d => cats.add(d.data().category));
  console.log('Categories:', Array.from(cats));
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
