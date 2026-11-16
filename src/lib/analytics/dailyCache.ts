import { collection, doc, documentId, getDocs, orderBy, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/hooks/useOrders';
import {
  DAY_SUMMARY_VERSION, DaySummary, RevenueRange, addDaysKey, businessDayStart, makeRange, summarizeDays,
} from './revenue';

const COLLECTION = 'analytics_daily';
/** A business day is only trusted for caching 6 hours after it ends, so late payments still land in it. */
const SETTLE_AFTER_MS = 6 * 3600 * 1000;

export const isSettled = (key: string, now = new Date()) =>
  businessDayStart(addDaysKey(key, 1)).getTime() + SETTLE_AFTER_MS <= now.getTime();

const keysIn = (range: RevenueRange) => {
  const keys: string[] = [];
  for (let k = range.startKey; k <= range.endKey; k = addDaysKey(k, 1)) keys.push(k);
  return keys;
};

/** Groups sorted day keys into runs of consecutive days, so each run is one query. */
function runsOf(keys: string[]): [string, string][] {
  const runs: [string, string][] = [];
  for (const k of [...keys].sort()) {
    const last = runs[runs.length - 1];
    if (last && addDaysKey(last[1], 1) === k) last[1] = k;
    else runs.push([k, k]);
  }
  return runs;
}

export async function fetchOrders(range: RevenueRange): Promise<Order[]> {
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

async function readStored(range: RevenueRange): Promise<Map<string, DaySummary>> {
  const found = new Map<string, DaySummary>();
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTION), where(documentId(), '>=', range.startKey), where(documentId(), '<=', range.endKey))
    );
    snap.forEach(d => {
      const data = d.data() as DaySummary;
      if (data.v === DAY_SUMMARY_VERSION) found.set(d.id, { ...data, key: d.id });
    });
  } catch (e) {
    // Rules may not allow this collection; fall back to computing from orders
    console.warn('Saved daily summaries unavailable, computing from orders', e);
  }
  return found;
}

async function store(days: DaySummary[]) {
  const results = await Promise.allSettled(
    days.map(d => setDoc(doc(db, COLLECTION, d.key), { ...d, computedAt: new Date().toISOString() }))
  );
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed) console.warn(`Could not save ${failed} daily summaries`);
}

export interface LoadStats {
  saved: number; // days read from saved summaries
  built: number; // past days computed from orders this time (and saved)
  live: number; // recent days always computed from orders
}

/**
 * Day summaries for a range. Settled past days come from `analytics_daily` (one query);
 * missing ones are computed from orders and saved; recent days are always computed from orders.
 * With `force`, every settled day is recomputed and overwritten.
 */
export async function loadDays(range: RevenueRange, force = false): Promise<{ days: DaySummary[]; stats: LoadStats }> {
  const keys = keysIn(range);
  const settled = keys.filter(k => isSettled(k));
  const settledSet = new Set(settled);

  const stored = !force && settled.length ? await readStored(makeRange('custom', settled[0], settled[settled.length - 1])) : new Map<string, DaySummary>();
  const missing = settled.filter(k => !stored.has(k));
  const recent = keys.filter(k => !settledSet.has(k));

  const computed = new Map<string, DaySummary>();
  for (const [from, to] of runsOf([...missing, ...recent])) {
    const run = makeRange('custom', from, to);
    for (const d of summarizeDays(await fetchOrders(run), run)) computed.set(d.key, d);
  }

  const toStore = missing.map(k => computed.get(k)!).filter(Boolean);
  if (toStore.length) await store(toStore);

  const days = keys.map(k => stored.get(k) ?? computed.get(k)!);
  return { days, stats: { saved: stored.size, built: missing.length, live: recent.length } };
}
