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

async function run() {
  // Wipe orders
  const ordersSnap = await getDocs(collection(db, "orders"));
  for (const docSnap of ordersSnap.docs) {
    await deleteDoc(doc(db, "orders", docSnap.id));
  }
  console.log(`Deleted ${ordersSnap.size} orders`);

  // Reset tables
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
  console.log(`Reset ${tablesSnap.size} tables`);

  // Reset customers
  const customersSnap = await getDocs(collection(db, "customers"));
  for (const custSnap of customersSnap.docs) {
    await updateDoc(doc(db, "customers", custSnap.id), {
      totalOrders: 0,
      totalRevenue: 0
    });
  }
  console.log(`Reset ${customersSnap.size} customers`);

  console.log("History cleared.");
  process.exit(0);
}

run();
