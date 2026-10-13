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

// Prices or standard selling prices for retail cans & water
const defaultPrices = {
  "Red bull": 125,
  "Monster Energy": 125,
  "Hell Energy": 60,
  "Predator Energy": 60,
  "Sprite Can": 40,
  "thums up can": 40,
  "Coc  can": 40,
  "Diet Coke": 50,
  "Campa Energy gold boost": 20,
  "campa energy neon boost": 20,
  "Armour Energy Ayurveda Power": 20,
  "raskik": 20,
  "water bottle": 20,
};

async function sync() {
  const invSnap = await db.collection('inventory').get();
  const menuSnap = await db.collection('menuItems').get();

  const existingMenuNames = new Set();
  menuSnap.forEach(d => {
    existingMenuNames.add(d.data().name?.toLowerCase().trim());
  });

  const batch = db.batch();
  let added = 0;

  invSnap.forEach(d => {
    const data = d.data();
    if (data.type === 'retail') {
      const isSoftDrink = data.retailCategory === 'soft_drinks';
      const isWater = data.name.toLowerCase().includes('water') || data.retailCategory === 'water_bottles';
      
      if (isSoftDrink || isWater) {
        const cleanName = data.name.trim();
        if (!existingMenuNames.has(cleanName.toLowerCase())) {
          const cat = isWater ? "Water Bottles" : "Cold Drinks (Cans / Energy)";
          const price = defaultPrices[cleanName] || Math.round((data.totalCost / (data.quantity || 1)) * 1.3) || 40;
          
          const newDocRef = db.collection('menuItems').doc();
          batch.set(newDocRef, {
            name: cleanName,
            description: data.company ? `Brand: ${data.company}` : (isWater ? "Packaged Drinking Water" : "Chilled Can / Bottle"),
            price: price,
            category: cat,
            isRetail: true,
            available: (data.quantity || 0) > 0,
            linkedInventoryId: d.id,
            linkedInventoryAmount: 1,
            itemNumber: data.itemNumber || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            archived: false,
          });
          console.log(`+ Adding to Menu: ${cleanName} [${cat}] at ₹${price}`);
          added++;
        } else {
          console.log(`= Already exists in menu: ${cleanName}`);
        }
      }
    }
  });

  if (added > 0) {
    await batch.commit();
  }
  console.log(`\n🎉 Successfully published ${added} retail beverage & water items to menuItems collection!`);
  process.exit(0);
}

sync().catch(e => { console.error(e); process.exit(1); });
