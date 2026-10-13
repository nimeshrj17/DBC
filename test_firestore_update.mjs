import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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

try {
  console.log("Testing updateDoc on inventory item bTn5zEE6LLcpHifbRGBU...");
  await updateDoc(doc(db, 'inventory', 'bTn5zEE6LLcpHifbRGBU'), {
    retailCategory: 'water_bottles'
  });
  console.log("SUCCESS updating inventory!");
} catch (e) {
  console.error("FAILED updating inventory:", e.message);
}

try {
  console.log("Testing updateDoc on menu item CSfR5WtZqWnordGvEzVn...");
  await updateDoc(doc(db, 'menuItems', 'CSfR5WtZqWnordGvEzVn'), {
    price: 30
  });
  console.log("SUCCESS updating menuItem!");
} catch (e) {
  console.error("FAILED updating menuItem:", e.message);
}

process.exit(0);
