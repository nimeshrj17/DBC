import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  authDomain: "dbcafe-3f5ee.firebaseapp.com",
  projectId: "dbcafe-3f5ee",
  storageBucket: "dbcafe-3f5ee.firebasestorage.app",
  messagingSenderId: "357679112647",
  appId: "1:357679112647:web:644f1c32e484879245b9e2"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const editingItemId = "bTn5zEE6LLcpHifbRGBU"; // water bottle
const itemData = {
  name: "water bottle",
  type: "retail",
  quantity: 509,
  unit: "pcs",
  totalCost: 63330,
  itemNumber: "w1",
  retailCategory: "water_bottles",
  company: ""
};

async function run() {
  console.log("Step 1: updateInventoryItem...");
  try {
    const invUpdates = {
      name: itemData.name,
      type: itemData.type,
      quantity: itemData.quantity,
      unit: itemData.unit,
      totalCost: itemData.totalCost,
      itemNumber: itemData.itemNumber,
      retailCategory: itemData.retailCategory,
      company: itemData.company,
    };
    await updateDoc(doc(db, 'inventory', editingItemId), invUpdates);

    // auto-sync menu availability in useInventory:
    const q = query(collection(db, 'menuItems'), where('linkedInventoryId', '==', editingItemId));
    const snapshot = await getDocs(q);
    const isAvailable = invUpdates.quantity > 0;
    const updatePromises = snapshot.docs.map(docSnap => 
      updateDoc(docSnap.ref, { available: isAvailable })
    );
    await Promise.all(updatePromises);
    console.log("Step 1 success!");
  } catch (err) {
    console.error("Step 1 failed:", err);
  }

  console.log("Step 2: updateMenuItem for linkedMenu...");
  try {
    const menuId = "CSfR5WtZqWnordGvEzVn";
    await updateDoc(doc(db, 'menuItems', menuId), {
      linkedInventoryId: editingItemId,
      linkedInventoryAmount: 1,
      name: itemData.name,
      price: 30,
      description: 'Packaged Drinking Water',
      category: 'Water Bottles'
    });
    console.log("Step 2 success!");
  } catch (err) {
    console.error("Step 2 failed:", err);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
