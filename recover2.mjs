import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  projectId: "dbcafe-3f5ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function recover() {
  const ordersSnap = await getDocs(collection(db, "orders"));
  // Only look at currently active orders
  const orders = ordersSnap.docs.map(d => ({id: d.id, ...d.data()}))
    .filter(o => ['pending', 'preparing', 'served', 'billed'].includes(o.status));

  const tablesSnap = await getDocs(collection(db, "tables"));
  const tables = tablesSnap.docs.map(d => ({id: d.id, ...d.data()}));

  let recoveredCount = 0;

  for (const table of tables) {
    const tableOrders = orders.filter(o => o.tableId === table.id);
    const activeIds = tableOrders.map(o => o.id);
    
    const currentActive = table.activeOrderIds || [];
    const missing = activeIds.filter(id => !currentActive.includes(id));
    
    if (missing.length > 0) {
      console.log(`Table ${table.name || table.number} (${table.id}) is missing active orders: ${missing.join(', ')}`);
      
      const newActiveOrderIds = [...new Set([...currentActive, ...missing])];
      
      await updateDoc(doc(db, "tables", table.id), {
        activeOrderIds: newActiveOrderIds,
        status: table.status === 'empty' ? 'occupied' : table.status // ensure it's not empty
      });
      console.log(`Restored!`);
      recoveredCount += missing.length;
    }
  }
  
  console.log(`Recovery complete. Restored ${recoveredCount} orphaned orders.`);
  process.exit(0);
}

recover().catch(console.error);
