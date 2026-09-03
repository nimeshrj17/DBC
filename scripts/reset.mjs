import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  authDomain: "dbcafe-3f5ee.firebaseapp.com",
  projectId: "dbcafe-3f5ee",
  storageBucket: "dbcafe-3f5ee.firebasestorage.app",
  messagingSenderId: "357679112647",
  appId: "1:357679112647:web:644f1c32e484879245b9e2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeCollection(name) {
  const querySnapshot = await getDocs(collection(db, name));
  console.log(`Wiping ${querySnapshot.size} docs from ${name}`);
  for (const docSnap of querySnapshot.docs) {
    await deleteDoc(doc(db, name, docSnap.id));
  }
}

async function run() {
  await wipeCollection("inventory");
  await wipeCollection("orders");
  await wipeCollection("customers");
  await wipeCollection("inventoryLog");
  
  // Also reset tables active orders
  const tablesSnap = await getDocs(collection(db, "tables"));
  for (const tableSnap of tablesSnap.docs) {
    await updateDoc(doc(db, "tables", tableSnap.id), {
      status: 'empty',
      activeOrderIds: [],
      currentOrderId: null,
      customerId: null,
      customerName: null,
      customerPhone: null,
      currentSessionId: null
    });
  }
  
  console.log("Database reset complete.");
  process.exit(0);
}

run();
