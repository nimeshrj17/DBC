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

async function dedupe() {
  const querySnapshot = await getDocs(collection(db, 'menuItems'));
  
  const seenNames = new Set();
  const toDelete = [];
  
  querySnapshot.forEach((document) => {
    const data = document.data();
    if (seenNames.has(data.name)) {
      toDelete.push(document.id);
    } else {
      seenNames.add(data.name);
    }
  });
  
  console.log(`Found ${toDelete.length} duplicates to delete.`);
  
  for (const id of toDelete) {
    await deleteDoc(doc(db, 'menuItems', id));
    console.log(`Deleted duplicate: ${id}`);
  }
  
  console.log('Deduplication complete.');
  process.exit(0);
}

dedupe().catch(console.error);
