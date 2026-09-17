'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function PrintAgent() {
  const printingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only listen to today's orders to save bandwidth
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const order = { id: change.doc.id, ...change.doc.data() } as any;

          // Check if it's an active order that hasn't printed
          if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
            
            // Prevent duplicate print calls for the same order while fetch is running
            if (printingRef.current.has(order.id)) return;
            printingRef.current.add(order.id);

            try {
              // Call the Localhost Mac Print Agent
              const res = await fetch('http://localhost:5050/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
              });
              
              const result = await res.json();
              if (result.success) {
                 // Mark as printed in Firestore so it never triggers again
                 await updateDoc(doc(db, "orders", order.id), { printedKOT: true });
                 toast.success(`KOT Printed (Table ${order.tableNumber || order.tableName})`, {
                   icon: '🖨️',
                   duration: 3000
                 });
              } else {
                 throw new Error(result.error);
              }
            } catch (e) {
              console.error("Local Print Agent Error:", e);
              toast.error("Printer disconnected! Please start the Print Agent App.", {
                duration: 5000
              });
              // Remove from lock so it can be retried later
              printingRef.current.delete(order.id);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  return null; // This component is invisible
}
