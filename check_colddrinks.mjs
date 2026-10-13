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
  console.log("=== Soft drinks & Water Bottles in Inventory ===");
  invSnap.forEach(d => {
    const data = d.data();
    if (data.retailCategory === 'soft_drinks' || data.name.toLowerCase().includes('water') || data.retailCategory === 'water_bottles') {
      console.log(`- ${data.name} | id: ${d.id} | cat: ${data.retailCategory} | qty: ${data.quantity} | cost: ${data.totalCost}`);
    }
  });

  const menuSnap = await db.collection('menuItems').get();
  console.log("\n=== Related in MenuItems ===");
  menuSnap.forEach(d => {
    const data = d.data();
    if (data.category?.toLowerCase().includes('cold') || data.category?.toLowerCase().includes('soft') || data.name.toLowerCase().includes('water') || data.name.toLowerCase().includes('coke') || data.name.toLowerCase().includes('thums')) {
      console.log(`- ${data.name} | cat: ${data.category} | price: ${data.price} | linked: ${data.linkedInventoryId}`);
    }
  });
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
