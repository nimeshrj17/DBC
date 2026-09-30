import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  projectId: "dbcafe-3f5ee",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function recover() {
  console.log("Fetching tables...");
  const tablesSnap = await getDocs(collection(db, "tables"));
  const tables = tablesSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log("Fetching today's orders...");
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const ordersSnap = await getDocs(collection(db, "orders"));
  const orders = ordersSnap.docs.map(d => ({id: d.id, ...d.data()}))
    .filter(o => o.createdAt && o.createdAt.toDate && o.createdAt.toDate() > today)
    .filter(o => ['pending', 'preparing', 'served', 'billed'].includes(o.status));

  let recoveredCount = 0;

  for (const table of tables) {
    // Find all active orders that belong to this table ID
    const tableOrders = orders.filter(o => o.tableId === table.id);
    const activeIds = tableOrders.map(o => o.id);
    
    // Check if the table's activeOrderIds is missing any of them
    const currentActive = table.activeOrderIds || [];
    const missing = activeIds.filter(id => !currentActive.includes(id));
    
    if (missing.length > 0) {
      console.log(`Table ${table.name || table.number} is missing orders: ${missing.join(', ')}`);
      
      const newActiveOrderIds = [...new Set([...currentActive, ...missing])];
      
      await updateDoc(doc(db, "tables", table.id), {
        activeOrderIds: newActiveOrderIds
      });
      console.log(`Restored! Table ${table.name || table.number} now has activeOrderIds:`, newActiveOrderIds);
      recoveredCount += missing.length;
    }
  }
  
  console.log(`Recovery complete. Restored ${recoveredCount} orphaned orders.`);
  process.exit(0);
}

recover().catch(console.error);
