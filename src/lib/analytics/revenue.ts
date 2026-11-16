// Single source of truth for how revenue is counted and bucketed.
// Every revenue screen must go through this module so the numbers agree.

import type { Order } from '@/lib/hooks/useOrders';

/** The business day ends at 2 AM: 1:30 AM on the 16th still belongs to the 15th. */
export const BUSINESS_DAY_START_HOUR = 2;

/**
 * Retail = bought-in goods sold as-is (not made in the kitchen).
 * `isRetail` on order items is not reliable (burgers are flagged retail, some cold drinks are not),
 * so the channel is decided by category/name. Edit these patterns when new retail lines are added.
 */
const RETAIL_CATEGORY_PATTERN = /cigar|tobacco|bidi|beedi|water|cold ?drink|energy|soft ?drink|soda/i;
const RETAIL_NAME_PATTERN = /cigarette|bidi|beedi|\(stick\)|water bottle/i;

export type Channel = 'kitchen' | 'retail';
export type Period = 'day' | 'week' | 'month' | 'custom';

export const itemChannel = (item: { category?: string; name?: string }): Channel =>
  RETAIL_CATEGORY_PATTERN.test(item.category || '') || RETAIL_NAME_PATTERN.test(item.name || '')
    ? 'retail'
    : 'kitchen';

// ---------- dates (all local time, which is IST for the cafe) ----------

const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

/** 'YYYY-MM-DD' business date of a moment in time. */
export function businessDateKey(d: Date): string {
  const shifted = new Date(d);
  shifted.setHours(shifted.getHours() - BUSINESS_DAY_START_HOUR);
  return keyOf(shifted);
}

/** Calendar parts of a business-date key, without timezone surprises. */
function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** The moment a business day begins (02:00 local on that date). */
export function businessDayStart(key: string): Date {
  const { y, m, d } = parseKey(key);
  return new Date(y, m, d, BUSINESS_DAY_START_HOUR, 0, 0, 0);
}

export function addDaysKey(key: string, days: number): string {
  const { y, m, d } = parseKey(key);
  return keyOf(new Date(y, m, d + days, 12));
}

export function currentBusinessDateKey(now = new Date()) {
  return businessDateKey(now);
}

export interface RevenueRange {
  period: Period;
  startKey: string; // first business day, inclusive
  endKey: string; // last business day, inclusive
  start: Date; // first moment (inclusive)
  end: Date; // first moment after the range (exclusive)
  label: string;
}

const fmtShort = (key: string) => {
  const { y, m, d } = parseKey(key);
  return new Date(y, m, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const fmtLong = (key: string) => {
  const { y, m, d } = parseKey(key);
  return new Date(y, m, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export function makeRange(period: Period, startKey: string, endKey: string): RevenueRange {
  const start = businessDayStart(startKey);
  const end = businessDayStart(addDaysKey(endKey, 1));
  const label =
    period === 'day'
      ? fmtLong(startKey)
      : period === 'month'
        ? (() => { const { y, m } = parseKey(startKey); return new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }); })()
        : `${fmtShort(startKey)} – ${fmtShort(endKey)}${period === 'week' ? ` ${parseKey(endKey).y}` : ''}`;
  return { period, startKey, endKey, start, end, label };
}

/** Range containing `anchorKey` for the period. Weeks run Monday to Sunday. */
export function rangeFor(period: Period, anchorKey: string, custom?: { from: string; to: string }): RevenueRange {
  if (period === 'day') return makeRange('day', anchorKey, anchorKey);
  if (period === 'week') {
    const { y, m, d } = parseKey(anchorKey);
    const dow = (new Date(y, m, d).getDay() + 6) % 7; // Monday = 0
    const startKey = addDaysKey(anchorKey, -dow);
    return makeRange('week', startKey, addDaysKey(startKey, 6));
  }
  if (period === 'month') {
    const { y, m } = parseKey(anchorKey);
    return makeRange('month', keyOf(new Date(y, m, 1, 12)), keyOf(new Date(y, m + 1, 0, 12)));
  }
  const from = custom?.from || anchorKey;
  const to = custom?.to && custom.to >= from ? custom.to : from;
  return makeRange('custom', from, to);
}

/** Move a range by one period, keeping its length. */
export function shiftRange(range: RevenueRange, direction: -1 | 1): RevenueRange {
  if (range.period === 'day') return rangeFor('day', addDaysKey(range.startKey, direction));
  if (range.period === 'week') return rangeFor('week', addDaysKey(range.startKey, 7 * direction));
  if (range.period === 'month') {
    const { y, m } = parseKey(range.startKey);
    return rangeFor('month', keyOf(new Date(y, m + direction, 1, 12)));
  }
  const len = daysIn(range);
  return makeRange('custom', addDaysKey(range.startKey, len * direction), addDaysKey(range.endKey, len * direction));
}

export function daysIn(range: RevenueRange) {
  return Math.round((range.end.getTime() - range.start.getTime()) / 86400000);
}

/** The period revenue is compared against. */
export function comparisonRange(range: RevenueRange): { range: RevenueRange; label: string } {
  if (range.period === 'day') return { range: rangeFor('day', addDaysKey(range.startKey, -7)), label: 'same day last week' };
  if (range.period === 'week') return { range: shiftRange(range, -1), label: 'previous week' };
  if (range.period === 'month') return { range: shiftRange(range, -1), label: 'previous month' };
  const len = daysIn(range);
  return { range: makeRange('custom', addDaysKey(range.startKey, -len), addDaysKey(range.startKey, -1)), label: 'previous period' };
}

// ---------- order classification ----------

/**
 * An order counts as revenue once it is paid and not cancelled. Nothing else counts.
 * Orders folded into a combined bill (`mergedInto`) are kept for the record but never counted,
 * because the bill's master order already carries their items and total.
 */
export const isCounted = (o: Pick<Order, 'paymentStatus' | 'status' | 'mergedInto'>) =>
  o.paymentStatus === 'paid' && o.status !== 'cancelled' && !o.mergedInto;
export const isCancelled = (o: Pick<Order, 'status'>) => o.status === 'cancelled';

export type OrderType = 'dine_in' | 'takeaway';
/** Takeaway and counter sales have no real table. */
export function orderTypeFor(tableId?: string, tableNumber?: number, displayId?: string): OrderType {
  if (tableId === 'takeaway' || tableNumber === 0 || tableNumber === 999999) return 'takeaway';
  if (typeof displayId === 'string' && displayId.includes('PARCEL')) return 'takeaway';
  return 'dine_in';
}
export const orderType = (o: any): OrderType => (o.orderType as OrderType) || orderTypeFor(o.tableId, o.tableNumber, o.displayId);

/**
 * Business date in IST regardless of where the code runs (browser or a UTC server).
 * India has no daylight saving, so a fixed +05:30 offset is exact.
 */
export function istBusinessDate(d = new Date()): string {
  const t = new Date(d.getTime() + (330 - BUSINESS_DAY_START_HOUR * 60) * 60000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export const NOT_RECORDED = 'Not recorded';
/** Staff who took the payment; falls back to who created the order. */
export const staffNameOf = (o: any): string => o.paidBy?.name || o.createdBy?.name || NOT_RECORDED;

// ---------- summary ----------

export interface Money { revenue: number; orders: number; qty: number }

export interface RevenueSummary {
  revenue: number;
  orders: number;
  aov: number;
  itemsSold: number;
  itemsPerOrder: number;
  cancelled: { count: number; value: number };
  open: { count: number; value: number };
  channels: Record<Channel, Money & { share: number }>;
  paymentSplit: { method: string; revenue: number; orders: number }[];
  typeSplit: { type: OrderType; revenue: number; orders: number }[];
  categories: { name: string; channel: Channel; revenue: number; qty: number; share: number }[];
  items: { id: string; name: string; category: string; channel: Channel; revenue: number; qty: number; share: number }[];
  daily: { key: string; revenue: number; kitchen: number; retail: number; orders: number }[];
  hourly: { hour: number; label: string; revenue: number; orders: number }[];
  weekday: { day: string; revenue: number; orders: number; avgRevenue: number }[];
  staff: { name: string; orders: number; revenue: number; aov: number; cancelled: number }[];
  bestDay: { key: string; revenue: number } | null;
  worstDay: { key: string; revenue: number } | null;
  peakHour: { label: string; revenue: number } | null;
  /** True when item totals do not add up to order totals (flag for the admin, never hidden). */
  itemsMismatch: number;
  profit:
    | { available: true; cogs: number; grossProfit: number; marginPct: number }
    | { available: false; reason: string; itemsWithoutCost: number };
  ledger: LedgerRow[];
}

export interface LedgerRow {
  id: string;
  displayId: string;
  time: Date | null;
  businessDate: string;
  table: string;
  type: OrderType;
  items: { name: string; qty: number; price: number; channel: Channel }[];
  itemCount: number;
  total: number;
  paymentMethod: string;
  staff: string;
  customer: string;
  state: 'paid' | 'cancelled' | 'open';
  /** When each step happened, oldest first. Only steps that were recorded appear. */
  timeline: { label: string; time: Date }[];
  minutesToPay: number | null;
  mergedRounds: number;
}

const minutesBetween = (a: Date | null, b: Date | null) => (a && b ? Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000)) : null);

function timelineOf(o: Order, created: Date): { label: string; time: Date }[] {
  const steps: [string, Date | null][] = [
    ['Placed', created],
    ['Accepted', toDate(o.acceptedAt)],
    ['Prepared', toDate(o.preparedAt)],
    ['Served', toDate(o.servedAt)],
    ['Billed', toDate(o.billedAt)],
    ['Paid', toDate(o.paidAt)],
    ['Cancelled', toDate(o.cancelledAt)],
  ];
  return steps
    .filter((s): s is [string, Date] => s[1] !== null)
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .map(([label, time]) => ({ label, time }));
}

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const methodName = (m: any) => (m === 'upi' || m === 'qr' ? 'Online' : m === 'cash' ? 'Cash' : 'Not recorded');

/**
 * @param costs menu item id -> making cost per unit. Missing items mean profit cannot be resolved.
 */
export function summarize(
  orders: Order[],
  range: RevenueRange,
  tableName: (o: any) => string,
  costs: Record<string, number> = {}
): RevenueSummary {
  const dailyMap = new Map<string, { revenue: number; kitchen: number; retail: number; orders: number }>();
  for (let k = range.startKey; k <= range.endKey; k = addDaysKey(k, 1)) dailyMap.set(k, { revenue: 0, kitchen: 0, retail: 0, orders: 0 });

  const hourMap = new Map<number, { revenue: number; orders: number }>();
  for (let i = 0; i < 24; i++) hourMap.set((BUSINESS_DAY_START_HOUR + i) % 24, { revenue: 0, orders: 0 });

  const weekdayAgg = WEEKDAYS.map(() => ({ revenue: 0, orders: 0, days: new Set<string>() }));
  const channels = { kitchen: { revenue: 0, orders: 0, qty: 0 }, retail: { revenue: 0, orders: 0, qty: 0 } };
  const pay = new Map<string, { revenue: number; orders: number }>();
  const type = new Map<OrderType, { revenue: number; orders: number }>();
  const cats = new Map<string, { name: string; channel: Channel; revenue: number; qty: number }>();
  const items = new Map<string, { id: string; name: string; category: string; channel: Channel; revenue: number; qty: number }>();
  const staff = new Map<string, { orders: number; revenue: number; cancelled: number }>();
  const uncosted = new Set<string>();

  let revenue = 0, count = 0, itemsSold = 0, itemsTotal = 0, cogs = 0;
  const cancelled = { count: 0, value: 0 };
  const open = { count: 0, value: 0 };
  const ledger: LedgerRow[] = [];

  for (const o of orders) {
    if (o.mergedInto) continue;
    const when = toDate(o.createdAt);
    if (!when) continue;
    const key = businessDateKey(when);
    if (key < range.startKey || key > range.endKey) continue;

    const state: LedgerRow['state'] = isCancelled(o) ? 'cancelled' : isCounted(o) ? 'paid' : 'open';
    const total = o.total || 0;
    const oItems = (o.items || []).map(i => ({ name: i.name, qty: i.qty, price: i.price, channel: itemChannel(i) }));
    const who = staffNameOf(o);

    ledger.push({
      id: o.id,
      displayId: o.displayId || o.id.slice(0, 6),
      time: when,
      businessDate: key,
      table: tableName(o),
      type: orderType(o),
      items: oItems,
      itemCount: oItems.reduce((s, i) => s + i.qty, 0),
      total,
      paymentMethod: state === 'paid' ? methodName(o.paymentMethod) : '—',
      staff: who,
      customer: o.customerName || '',
      state,
      timeline: timelineOf(o, when),
      minutesToPay: minutesBetween(when, toDate(o.paidAt)),
      mergedRounds: o.mergedFrom?.length || 0,
    });

    if (state === 'cancelled') {
      cancelled.count++; cancelled.value += total;
      const s = staff.get(who) || { orders: 0, revenue: 0, cancelled: 0 }; s.cancelled++; staff.set(who, s);
      continue;
    }
    if (state === 'open') { open.count++; open.value += total; continue; }

    // ---- counted order ----
    revenue += total; count++;
    const day = dailyMap.get(key)!;
    day.revenue += total; day.orders++;

    const h = hourMap.get(when.getHours())!;
    h.revenue += total; h.orders++;

    const k = parseKey(key);
    const dow = (new Date(k.y, k.m, k.d).getDay() + 6) % 7;
    weekdayAgg[dow].revenue += total; weekdayAgg[dow].orders++; weekdayAgg[dow].days.add(key);

    const p = pay.get(methodName(o.paymentMethod)) || { revenue: 0, orders: 0 };
    p.revenue += total; p.orders++; pay.set(methodName(o.paymentMethod), p);

    const t = type.get(orderType(o)) || { revenue: 0, orders: 0 };
    t.revenue += total; t.orders++; type.set(orderType(o), t);

    const s = staff.get(who) || { orders: 0, revenue: 0, cancelled: 0 };
    s.orders++; s.revenue += total; staff.set(who, s);

    const seenChannels = new Set<Channel>();
    for (const it of o.items || []) {
      const ch = itemChannel(it);
      const line = it.price * it.qty;
      itemsSold += it.qty; itemsTotal += line;
      channels[ch].revenue += line; channels[ch].qty += it.qty;
      if (!seenChannels.has(ch)) { channels[ch].orders++; seenChannels.add(ch); }
      day[ch] += line;

      const cat = it.category || 'Uncategorized';
      const c = cats.get(cat) || { name: cat, channel: ch, revenue: 0, qty: 0 };
      c.revenue += line; c.qty += it.qty; cats.set(cat, c);

      const id = it.menuItemId || it.name;
      const row = items.get(id) || { id, name: (it.name || '').trim(), category: cat, channel: ch, revenue: 0, qty: 0 };
      row.revenue += line; row.qty += it.qty; items.set(id, row);

      const unitCost = typeof it.unitCost === 'number' ? it.unitCost : costs[it.menuItemId];
      if (typeof unitCost === 'number') cogs += unitCost * it.qty;
      else uncosted.add(id);
    }
  }

  const share = (v: number) => (revenue ? (v / revenue) * 100 : 0);
  const dailyArr = [...dailyMap.entries()].map(([key, v]) => ({ key, ...v }));
  const withSales = dailyArr.filter(d => d.orders > 0);
  const best = withSales.length ? withSales.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const worst = withSales.length ? withSales.reduce((a, b) => (b.revenue < a.revenue ? b : a)) : null;

  const hourly = [...hourMap.entries()]
    .sort((a, b) => ((a[0] - BUSINESS_DAY_START_HOUR + 24) % 24) - ((b[0] - BUSINESS_DAY_START_HOUR + 24) % 24))
    .map(([hour, v]) => ({ hour, label: hourLabel(hour), ...v }));
  const peak = hourly.reduce((a, b) => (b.revenue > a.revenue ? b : a), hourly[0]);

  const profit: RevenueSummary['profit'] =
    count === 0
      ? { available: false, reason: 'No sales in this period.', itemsWithoutCost: 0 }
      : uncosted.size > 0
        ? { available: false, reason: 'Profit margin cannot be resolved due to insufficient data: making cost is missing for items sold.', itemsWithoutCost: uncosted.size }
        : { available: true, cogs, grossProfit: revenue - cogs, marginPct: revenue ? ((revenue - cogs) / revenue) * 100 : 0 };

  return {
    revenue,
    orders: count,
    aov: count ? revenue / count : 0,
    itemsSold,
    itemsPerOrder: count ? itemsSold / count : 0,
    cancelled,
    open,
    channels: {
      kitchen: { ...channels.kitchen, share: share(channels.kitchen.revenue) },
      retail: { ...channels.retail, share: share(channels.retail.revenue) },
    },
    paymentSplit: [...pay.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.revenue - a.revenue),
    typeSplit: [...type.entries()].map(([t, v]) => ({ type: t, ...v })).sort((a, b) => b.revenue - a.revenue),
    categories: [...cats.values()].map(c => ({ ...c, share: share(c.revenue) })).sort((a, b) => b.revenue - a.revenue),
    items: [...items.values()].map(i => ({ ...i, share: share(i.revenue) })).sort((a, b) => b.revenue - a.revenue),
    daily: dailyArr,
    hourly,
    weekday: WEEKDAYS.map((day, i) => ({
      day,
      revenue: weekdayAgg[i].revenue,
      orders: weekdayAgg[i].orders,
      avgRevenue: weekdayAgg[i].days.size ? weekdayAgg[i].revenue / weekdayAgg[i].days.size : 0,
    })),
    staff: [...staff.entries()]
      .map(([name, v]) => ({ name, ...v, aov: v.orders ? v.revenue / v.orders : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    bestDay: best ? { key: best.key, revenue: best.revenue } : null,
    worstDay: worst ? { key: worst.key, revenue: worst.revenue } : null,
    peakHour: peak && peak.revenue > 0 ? { label: `${peak.label} – ${hourLabel((peak.hour + 1) % 24)}`, revenue: peak.revenue } : null,
    itemsMismatch: Math.round((revenue - itemsTotal) * 100) / 100,
    profit,
    ledger: ledger.sort((a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0)),
  };
}

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Percentage change, or null when there is nothing to compare against. */
export const pctChange = (now: number, before: number): number | null =>
  before ? ((now - before) / before) * 100 : null;
