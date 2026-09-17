'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function PrintAgent() {
  const printingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log("🖨️ PrintAgent Frontend Component Mounted!");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`🖨️ PrintAgent: Detected ${snapshot.docChanges().length} changes in Firestore`);
      
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const order = { id: change.doc.id, ...change.doc.data() } as any;

          console.log(`🖨️ Checking Order ${order.id} | Status: ${order.status} | Printed: ${order.printedKOT}`);

          if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
            
            if (printingRef.current.has(order.id)) return;
            printingRef.current.add(order.id);

            try {
              console.log(`🖨️ Attempting to send Order ${order.id} to Local Agent at http://127.0.0.1:5050/print...`);
              
              // Using 127.0.0.1 instead of localhost avoids some strict browser CORS/Mixed-Content blocks
              const res = await fetch('http://127.0.0.1:5050/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
              });
              
              const result = await res.json();
              if (result.success) {
                 await updateDoc(doc(db, "orders", order.id), { printedKOT: true });
                 toast.success(`KOT Printed (Table ${order.tableNumber || order.tableName})`);
                 console.log("🖨️ Success! Marked in DB.");
              } else {
                 throw new Error(result.error);
              }
            } catch (e) {
              console.error("🖨️ Local Print Agent Error:", e);
              toast.error("Printer disconnected! Please start the Print Agent App.");
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
