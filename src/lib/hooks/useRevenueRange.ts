import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from './useOrders';
import type { RevenueRange } from '@/lib/analytics/revenue';

const REFRESH_MS = 60_000;

async function fetchRange(range: RevenueRange): Promise<Order[]> {
  const snap = await getDocs(
    query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(range.start)),
      where('createdAt', '<', Timestamp.fromDate(range.end)),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

/** Orders for a business-day range plus its comparison range. Refreshes while the range is still open. */
export function useRevenueRange(range: RevenueRange, comparison: RevenueRange) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [compOrders, setCompOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const cStartMs = comparison.start.getTime();
  const cEndMs = comparison.end.getTime();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchRange(range), fetchRange(comparison)])
      .then(([cur, prev]) => {
        if (cancelled) return;
        setOrders(cur);
        setCompOrders(prev);
        setFetchedAt(new Date());
      })
      .catch(e => {
        console.error('Revenue fetch failed', e);
        if (!cancelled) setError('Could not load orders. Check your connection and try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs, endMs, cStartMs, cEndMs, tick]);

  // Keep the current period live; past periods never change so they are not polled.
  useEffect(() => {
    if (endMs <= Date.now()) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [endMs, refresh]);

  return { orders, compOrders, loading, error, fetchedAt, refresh };
}
