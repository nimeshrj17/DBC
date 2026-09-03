import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function run() {
  const querySnapshot = await getDocs(collection(db, "menu"));
  const seen = new Set();
  
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    if (seen.has(data.name)) {
      console.log(`Deleting duplicate: ${data.name}`);
      await deleteDoc(doc(db, "menu", docSnap.id));
    } else {
      seen.add(data.name);
    }
  }
  console.log("Deduplication complete.");
  process.exit(0);
}

run();
