import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  authDomain: "dbcafe-3f5ee.firebaseapp.com",
  projectId: "dbcafe-3f5ee",
  storageBucket: "dbcafe-3f5ee.firebasestorage.app",
  messagingSenderId: "357679112647",
  appId: "1:357679112647:web:644f1c32e484879245b9e2",
  measurementId: "G-8SD5F8GLYK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeCollection(collectionName) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const toDelete = [];
  querySnapshot.forEach((document) => {
    toDelete.push(document.id);
  });
  
  for (const id of toDelete) {
    await deleteDoc(doc(db, collectionName, id));
  }
  console.log(`Wiped ${toDelete.length} documents from ${collectionName}`);
}

async function run() {
  await wipeCollection('inventory');
  await wipeCollection('orders');
  await wipeCollection('customers');
  await wipeCollection('inventoryLog');
  console.log('Database wiped successfully.');
  process.exit(0);
}

run().catch(console.error);
