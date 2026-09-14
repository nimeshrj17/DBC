import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { exec } from "child_process";
import fs from "fs";

// Your exact Firebase config
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

console.log("🖨️  Dream Bean Cafe Print Daemon Started!");
console.log("📡 Listening for new kitchen orders...");

// Listen to all orders from the last 24 hours to find unprinted ones
const today = new Date();
today.setHours(0, 0, 0, 0);

const q = query(
  collection(db, "orders"),
  where("createdAt", ">=", today)
);

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === "added" || change.type === "modified") {
      const order = change.doc.data();
      const orderId = change.doc.id;

      // Check if it's a new order that hasn't had a KOT printed yet
      if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
        console.log(`\n🔔 New KOT triggered for Order #${order.displayId || orderId.substring(0, 6)} (Table ${order.tableNumber})`);

        // Format the Kitchen Order Ticket
        let kotText = `\n`;
        kotText += `   RAKHA BHAI KI CHAI & CAFE\n`;
        kotText += `================================\n`;
        kotText += `      KITCHEN ORDER TICKET\n`;
        kotText += `================================\n`;
        kotText += `Table: ${order.tableName || order.tableNumber}\n`;
        kotText += `Order #: ${order.displayId || orderId.substring(0, 6)}\n`;
        if (order.customerName) kotText += `Customer: ${order.customerName}\n`;
        
        const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        kotText += `Time: ${date.toLocaleTimeString()}\n`;
        kotText += `--------------------------------\n`;
        kotText += `QTY  ITEM\n`;
        kotText += `--------------------------------\n`;

        order.items.forEach(item => {
          kotText += ` ${item.qty}x  ${item.name}\n`;
          if (item.notes) {
            kotText += `      Note: ${item.notes}\n`;
          }
        });

        kotText += `================================\n`;
        kotText += `\n\n\n`; // Extra spacing for the tear-off

        // Write to temp file
        const filePath = `/tmp/kot_${orderId}.txt`;
        // Convert text to buffer
        const textBuffer = Buffer.from(kotText, 'utf8');
        
        // ESC/POS Commands
        const initCmd = Buffer.from([0x1B, 0x40]); // Initialize printer
        const cutCmd = Buffer.from([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00]); // Feed 4 lines and FULL CUT

        // Combine all buffers
        const finalBuffer = Buffer.concat([initCmd, textBuffer, cutCmd]);
        
        fs.writeFileSync(filePath, finalBuffer);

        // Send to CUPS printer
        exec(`lpr -P Kitchen ${filePath}`, async (error) => {
          if (error) {
            console.error(`❌ Failed to print KOT for ${orderId}:`, error);
          } else {
            console.log(`✅ KOT Printed Successfully!`);
            // Mark as printed in Firebase so it doesn't print again
            await updateDoc(doc(db, "orders", orderId), {
              printedKOT: true
            });
            console.log(`💾 Marked as printed in database.`);
          }
        });
      }
    }
  });
});
