'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { usePrintStation } from '@/lib/printStation';
import { AGENT_URL, isExcludedFromKOT } from '@/lib/kot';

const RETRY_EVERY_MS = 20_000;
const GIVE_UP_AFTER_MS = 3 * 60 * 60 * 1000; // never dump a stale slip hours later
const TOAST_EVERY_MS = 60_000;

const shouldPrint = (o: any) => (o.status === 'pending' || o.status === 'preparing') && !o.printedKOT;

export default function PrintAgent() {
  const { isStation } = usePrintStation();
  const inFlight = useRef<Set<string>>(new Set());
  const latest = useRef<Map<string, any>>(new Map()); // newest copy of every recent order
  const failed = useRef<Set<string>>(new Set()); // orders waiting for the printer to come back
  const lastToast = useRef(0);

  useEffect(() => {
    // Only the device the printer is connected to prints; phones and other computers stay quiet
    if (!isStation) return;

    const warn = (message: string) => {
      if (Date.now() - lastToast.current < TOAST_EVERY_MS) return;
      lastToast.current = Date.now();
      toast.error(message);
    };

    /** Returns true once the order needs nothing more (printed, or nothing to print). */
    const attempt = async (order: any): Promise<boolean> => {
      if (inFlight.current.has(order.id)) return false;
      inFlight.current.add(order.id);
      try {
        const kitchenItems = (order.items || []).filter((i: any) => !isExcludedFromKOT(i));
        if (kitchenItems.length === 0) {
          // Only chai or retail: nothing for the kitchen, so there is no slip to print
          await updateDoc(doc(db, 'orders', order.id), { printedKOT: true });
          return true;
        }

        // Real table name, because older orders stored odd table numbers
        let tableName = order.tableNumber;
        try {
          const t = await getDoc(doc(db, 'tables', order.tableId));
          if (t.exists()) tableName = t.data().name || t.data().number || order.tableNumber;
        } catch { /* keep the stored number */ }

        const res = await fetch(`${AGENT_URL}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: { ...order, items: kitchenItems, tableNumber: tableName, tableName } }),
          signal: AbortSignal.timeout(60_000),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Printer did not accept the slip');

        // Only now is the slip really out: the agent confirmed it reached the printer
        await updateDoc(doc(db, 'orders', order.id), { printedKOT: true });
        toast.success(`KOT printed (${tableName || order.tableNumber})`);
        return true;
      } catch (e: any) {
        console.error('Print failed', e);
        failed.current.add(order.id);
        const why = e?.name === 'TypeError' || e?.name === 'TimeoutError'
          ? 'Print agent is not running on this computer.'
          : e?.message || 'Printer problem.';
        warn(`KOT NOT printed: ${why} It will retry automatically.`);
        return false;
      } finally {
        inFlight.current.delete(order.id);
      }
    };

    // Look back 12 hours so a midnight rollover never drops active orders
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const unsubscribe = onSnapshot(query(collection(db, 'orders'), where('createdAt', '>=', cutoff)), snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') { latest.current.delete(change.doc.id); failed.current.delete(change.doc.id); return; }
        const order = { id: change.doc.id, ...change.doc.data() } as any;
        latest.current.set(order.id, order);
        if (shouldPrint(order)) void attempt(order).then(ok => { if (ok) failed.current.delete(order.id); });
        else failed.current.delete(order.id);
      });
    });

    // Slips that failed (printer off, paper out, agent not started) are retried until they print
    const retry = setInterval(() => {
      failed.current.forEach(id => {
        const order = latest.current.get(id);
        const created = order?.createdAt?.toMillis?.() ?? 0;
        if (!order || !shouldPrint(order) || Date.now() - created > GIVE_UP_AFTER_MS) { failed.current.delete(id); return; }
        void attempt(order).then(ok => { if (ok) failed.current.delete(id); });
      });
    }, RETRY_EVERY_MS);

    return () => { unsubscribe(); clearInterval(retry); };
  }, [isStation]);

  return null;
}
