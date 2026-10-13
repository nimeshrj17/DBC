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

// Map each item name to its proper sub-category
const categoryMap = {
  "Hakka Noodles":         "Chinese - Noodles",
  "Chilli Garlic Noodles": "Chinese - Noodles",
  "Veg Noodles":           "Chinese - Noodles",
  "Honey Chilli Potato":   "Chinese - Snacks",
  "Chilli Potato":         "Chinese - Snacks",
  "Chilli Paneer Dry":     "Chinese - Snacks",
  "Chilli Paneer Gravy":   "Chinese - Snacks",
  "Gravy Manchurian":      "Chinese - Snacks",
  "Dry Manchurian":        "Chinese - Snacks",
  "Veg Steam Momos":       "Chinese - Momos",
  "Veg Fried Momos":       "Chinese - Momos",
  "Veg Fried Rice":        "Chinese - Rice",
  "Chilli Garlic Fried Rice": "Chinese - Rice",
  "Paneer Fried Rice":     "Chinese - Rice",
};

async function updateChinese() {
  const snapshot = await db.collection('menuItems')
    .where('category', '==', 'Chinese')
    .get();

  if (snapshot.empty) {
    console.log('No Chinese items found');
    process.exit(0);
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const name = doc.data().name;
    const newCategory = categoryMap[name];
    if (newCategory) {
      batch.update(doc.ref, { category: newCategory, updatedAt: new Date() });
      console.log(`  ${name} → ${newCategory}`);
      count++;
    } else {
      console.log(`  ⚠️  No mapping for: ${name}`);
    }
  });

  await batch.commit();
  console.log(`\n✅ Updated ${count} Chinese items into sub-categories`);
  process.exit(0);
}

updateChinese().catch(e => { console.error(e); process.exit(1); });
