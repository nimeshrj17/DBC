'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function PrintAgent() {
  const printingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("🖨️ PrintAgent Frontend Component Mounted!");
    
    // Look back 12 hours so midnight rollover or timezone differences never drop active orders
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", cutoff)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`🖨️ PrintAgent: Detected ${snapshot.docChanges().length} changes in Firestore`);
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const order = { id: change.doc.id, ...change.doc.data() } as any;

          console.log(`🖨️ Checking Order ${order.id} | Status: ${order.status} | Printed: ${order.printedKOT}`);

          if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
            
            // ONLY Chai and Retail items will not be printed on the KOT slip.
            // All buns, coffee, eatables, and other drinks will be printed!
            const isExcludedFromKOT = (i: any) => {
              if (i.isRetail || i.category === 'Retail') return true;
              const cat = (i.category || '').toLowerCase().trim();
              // Only exclude pure Chai beverage category
              if (cat === 'chai' || cat === 'tea' || cat === 'herbal tea') return true;
              return false;
            };

            const kitchenItems = order.items.filter((i: any) => !isExcludedFromKOT(i));
            
            if (kitchenItems.length === 0) {
              // Order ONLY contains chai or retail items. Skip physical printing, mark as printed.
              await updateDoc(doc(db, "orders", order.id), { printedKOT: true });
              return;
            }

            // Create a modified order object to send to the printer containing ONLY printable items
            
            // Fetch real table name to fix legacy tableNumber bugs
            let realTableName = order.tableNumber;
            try {
              const tDoc = await getDoc(doc(db, 'tables', order.tableId));
              if (tDoc.exists()) {
                const tData = tDoc.data();
                realTableName = tData.name || tData.number || order.tableNumber;
              }
            } catch (e) {}

            const orderToPrint = { ...order, items: kitchenItems, tableNumber: realTableName, tableName: realTableName };

            if (printingRef.current.has(order.id)) return;
            printingRef.current.add(order.id);

            try {
              console.log(`🖨️ Attempting to send Order ${order.id} to Local Agent at http://127.0.0.1:5050/print...`);
              
              // Using 127.0.0.1 instead of localhost avoids some strict browser CORS/Mixed-Content blocks
              const res = await fetch('http://127.0.0.1:5050/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: orderToPrint })
              });
              
              const result = await res.json();
              if (result.success) {
                 await updateDoc(doc(db, "orders", order.id), { printedKOT: true });
                 toast.success(`KOT Printed (Table ${realTableName || order.tableNumber})`);
                 console.log("🖨️ Success! Marked in DB.");
              } else {
                 throw new Error(result.error);
              }
            } catch (e) {
              console.error("🖨️ Local Print Agent Error:", e);
              toast.error("Printer disconnected! Please ensure Print Agent is running on the client Mac.");
              printingRef.current.delete(order.id);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}
