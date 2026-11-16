import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order } from './useOrders';
import { DaySummary, RevenueRange, summarizeDays } from '@/lib/analytics/revenue';
import { LoadStats, fetchOrders, loadDays } from '@/lib/analytics/dailyCache';

const REFRESH_MS = 60_000;

/**
 * Revenue data for a range plus its comparison range.
 * - Day view: raw orders (they are needed for the ledger anyway, about one day's worth).
 * - Week / month / custom: saved daily summaries, a handful of reads. Raw orders are only
 *   loaded when the ledger or an export asks for them.
 */
export function useRevenueRange(range: RevenueRange, comparison: RevenueRange) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [compDays, setCompDays] = useState<DaySummary[]>([]);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [stats, setStats] = useState<LoadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const forceRef = useRef(false);
  const wantLedgerRef = useRef(false);

  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const cStartMs = comparison.start.getTime();
  const cEndMs = comparison.end.getTime();
  const isDay = range.period === 'day';

  const refresh = useCallback(() => setTick(t => t + 1), []);
  /** Recompute every past day in this range from orders and overwrite the saved summaries. */
  const rebuild = useCallback(() => { forceRef.current = true; setTick(t => t + 1); }, []);
  /** Load the individual orders for a multi-day range (ledger, CSV). */
  const loadLedger = useCallback(async (): Promise<Order[]> => {
    wantLedgerRef.current = true;
    const raw = await fetchOrders(range);
    setOrders(raw);
    return raw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMs, endMs]);

  // A different range means any loaded orders no longer apply
  useEffect(() => {
    wantLedgerRef.current = false;
    setOrders(null);
  }, [startMs, endMs]);

  useEffect(() => {
    let cancelled = false;
    const force = forceRef.current;
    forceRef.current = false;
    setLoading(true);
    setError(null);

    (async () => {
      const comp = loadDays(comparison);
      if (isDay) {
        const raw = await fetchOrders(range);
        const cur = summarizeDays(raw, range);
        const [c] = await Promise.all([comp]);
        if (cancelled) return;
        setOrders(raw); setDays(cur); setCompDays(c.days); setStats({ saved: c.stats.saved, built: c.stats.built, live: 1 });
      } else {
        const [cur, c] = await Promise.all([loadDays(range, force), comp]);
        const raw = wantLedgerRef.current || force ? await fetchOrders(range) : null;
        if (cancelled) return;
        setDays(cur.days); setCompDays(c.days); setStats(cur.stats);
        if (raw) setOrders(raw);
      }
      setFetchedAt(new Date());
    })()
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

  return { days, compDays, orders, ledgerLoaded: orders !== null, loadLedger, stats, loading, error, fetchedAt, refresh, rebuild };
}
