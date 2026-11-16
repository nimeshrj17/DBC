'use client';
import React, { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, Cell,
} from 'recharts';

import { useAuth } from '@/lib/context/AuthContext';
import { useMenu } from '@/lib/hooks/useMenu';
import { useTables } from '@/lib/hooks/useTables';
import { useStaff } from '@/lib/hooks/useStaff';
import { Heatmap } from '@/components/revenue/Heatmap';
import { InsightsPanel } from '@/components/revenue/InsightsPanel';
import { CashReconciliation } from '@/components/revenue/CashReconciliation';
import { MonthlyPnl } from '@/components/revenue/MonthlyPnl';
import { downloadRevenuePdf } from '@/lib/analytics/pdf';
import { useRevenueRange } from '@/lib/hooks/useRevenueRange';
import {
  BUSINESS_DAY_START_HOUR, LedgerRow, Period, RevenueRange, comparisonRange, currentBusinessDateKey, pctChange,
  buildLedger, combineDays, insights, movers, projectRevenue, rangeFor, rupees, shiftRange,
} from '@/lib/analytics/revenue';

const KITCHEN = '#10b981';
const RETAIL = '#f59e0b';
const hourText = BUSINESS_DAY_START_HOUR > 12 ? `${BUSINESS_DAY_START_HOUR - 12} PM` : `${BUSINESS_DAY_START_HOUR} AM`;

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs ${className}`}>{children}</div>
);

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  const pct = pctChange(now, before);
  if (pct === null) return <div className="text-xs font-semibold text-slate-400 mt-auto pt-3">No data for {label}</div>;
  return (
    <div className={`text-xs font-bold mt-auto pt-3 ${pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      {pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% vs {label}
    </div>
  );
}

function Kpi({ title, value, sub, children }: { title: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col !p-3.5 md:!p-5">
      <div className="text-xs md:text-sm font-semibold text-slate-500 mb-1 md:mb-2">{title}</div>
      <div className="text-xl md:text-2xl font-black text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      {children}
    </Card>
  );
}

const csvCell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function RevenuePage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const { staff } = useStaff();
  const [cashVariance, setCashVariance] = useState<number | null>(null);
  const { menuItems } = useMenu();
  const { tables } = useTables();

  const todayKey = currentBusinessDateKey();
  const [period, setPeriod] = useState<Period>('day');
  const [anchor, setAnchor] = useState(todayKey);
  const [custom, setCustom] = useState({ from: todayKey, to: todayKey });
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | LedgerRow['state']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemChannelFilter, setItemChannelFilter] = useState<'all' | 'kitchen' | 'retail'>('all');
  const [showAllItems, setShowAllItems] = useState(false);
  const [ledgerLimit, setLedgerLimit] = useState(50);

  const range: RevenueRange = useMemo(() => rangeFor(period, anchor, custom), [period, anchor, custom]);
  const comp = useMemo(() => comparisonRange(range), [range]);
  const { days, compDays, orders, ledgerLoaded, loadLedger, stats, loading, error, fetchedAt, refresh, rebuild } = useRevenueRange(range, comp.range);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const tableName = useMemo(() => {
    const byId = new Map(tables.map(t => [t.id, t]));
    return (o: any) => {
      if (o.tableId === 'takeaway' || o.tableNumber === 0 || o.tableNumber === 999999) return o.displayId?.includes('PARCEL') ? 'Takeaway' : 'Counter sale';
      const t = byId.get(o.tableId);
      if (t) return t.name || `Table ${t.number}`;
      return String(o.tableNumber).length > 5 ? 'Table' : `Table ${o.tableNumber}`;
    };
  }, [tables]);

  const costs = useMemo(() => {
    const m: Record<string, number> = {};
    menuItems.forEach(i => { if (i.costing && typeof i.costing.totalCost === 'number' && i.costing.totalCost > 0) m[i.id] = i.costing.totalCost; });
    return m;
  }, [menuItems]);

  const s = useMemo(
    () => ({ ...combineDays(days, range, costs), ledger: orders ? buildLedger(orders, range, tableName) : [] }),
    [days, orders, range, tableName, costs]
  );
  const prev = useMemo(() => combineDays(compDays, comp.range, costs), [compDays, comp.range, costs]);
  const orderCount = s.orders + s.cancelled.count + s.open.count;
  const staffCost = useMemo(() => staff.filter(x => x.isActive).reduce((sum, x) => sum + (x.salary || 0), 0), [staff]);
  const moved = useMemo(() => movers(s.items, prev.items), [s.items, prev.items]);
  const projection = useMemo(() => (period === 'month' || period === 'custom' ? projectRevenue(s.daily, todayKey) : null), [period, s.daily, todayKey]);

  const tableLabel = (t: { id: string; number: number }) => {
    const found = tables.find(x => x.id === t.id);
    return found?.name || `Table ${found?.number ?? t.number}`;
  };

  if (authLoading) return null;
  if (!hasPermission('view_revenue')) {
    return <div className="p-8 text-slate-500 font-semibold">You do not have permission to view revenue.</div>;
  }

  const isCurrent = range.endKey >= todayKey;
  const alerts = insights(s, prev, { range, todayKey, compLabel: comp.label, cashVariance: period === 'day' ? cashVariance : null });
  const cashSales = s.paymentSplit.find(p => p.method === 'Cash')?.revenue ?? 0;
  const pickPeriod = (p: Period) => {
    if (p === 'custom') setCustom({ from: range.startKey, to: range.endKey });
    setPeriod(p);
  };
  const move = (dir: -1 | 1) => {
    const next = shiftRange(range, dir);
    if (period === 'custom') setCustom({ from: next.startKey, to: next.endKey });
    else setAnchor(next.startKey);
  };
  const canGoForward = range.endKey < todayKey;
  const drillDay = (key: string) => { setPeriod('day'); setAnchor(key); };

  const ledger = s.ledger.filter(r => {
    if (stateFilter !== 'all' && r.state !== stateFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.displayId, r.table, r.staff, r.customer, r.paymentMethod, ...r.items.map(i => i.name)].join(' ').toLowerCase().includes(q);
  });

  const ensureLedger = async () => {
    setLoadingLedger(true);
    try { return orders ?? (await loadLedger()); } finally { setLoadingLedger(false); }
  };

  const exportCsv = async () => {
    const raw = await ensureLedger();
    const rows0 = buildLedger(raw, range, tableName);
    const head = ['Business date', 'Time', 'Order', 'Table/Type', 'Items', 'Qty', 'Total', 'Payment', 'Staff', 'Status'];
    const rows = rows0.map(r => [
      r.businessDate, r.time?.toLocaleTimeString('en-IN') ?? '', r.displayId, r.table,
      r.items.map(i => `${i.qty}x ${i.name}`).join('; '), r.itemCount, r.total, r.paymentMethod, r.staff, r.state,
    ]);
    const csv = [head, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `orders_${range.startKey}_to_${range.endKey}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const itemRows = s.items.filter(i => itemChannelFilter === 'all' || i.channel === itemChannelFilter);
  const dailyChart = s.daily.map(d => ({ ...d, label: d.key.slice(5) }));
  const showDaily = period !== 'day';
  const retailCats = s.categories.filter(c => c.channel === 'retail');
  const kitchenCats = s.categories.filter(c => c.channel === 'kitchen');

  return (
    <div className="flex flex-col w-full h-full pb-10 bg-slate-50 overflow-y-auto custom-scroll">
      {/* Header / period controls */}
      <div className="px-4 md:px-8 pt-4 md:pt-5 pb-4 bg-white border-b border-slate-200 md:sticky md:top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Revenue</h2>
            <p className="hidden sm:block text-sm font-medium text-slate-500 mt-1">
              Business day runs {hourText} to {hourText}. Revenue = paid orders, cancelled excluded.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['day', 'week', 'month', 'custom'] as Period[]).map(p => (
                <button key={p} onClick={() => pickPeriod(p)} className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => move(-1)} aria-label="Previous" className="w-11 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold">‹</button>
              <div className="px-3 py-2 min-w-[11rem] text-center text-sm font-bold text-slate-800">{range.label}</div>
              <button onClick={() => move(1)} disabled={!canGoForward} aria-label="Next" className="w-11 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-30">›</button>
            </div>
            {range.endKey < todayKey && (
              <button
                onClick={() => (period === 'custom' ? setCustom({ from: todayKey, to: todayKey }) : setAnchor(todayKey))}
                className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50"
              >
                Today
              </button>
            )}
            <button onClick={refresh} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">Refresh</button>
            {period !== 'day' && (
              <button onClick={rebuild} title="Recompute past days from the orders" className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50">Rebuild</button>
            )}
            <button onClick={() => downloadRevenuePdf({ range, s, prev, compLabel: comp.label })} disabled={!s.orders} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold hover:bg-slate-50 disabled:opacity-40">PDF</button>
            <button onClick={exportCsv} disabled={!orderCount || loadingLedger} className="px-3 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">Export CSV</button>
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <input type="date" value={custom.from} max={todayKey} onChange={e => e.target.value && setCustom(c => ({ from: e.target.value, to: c.to < e.target.value ? e.target.value : c.to }))} className="border border-slate-200 rounded-lg px-3 py-2" />
            <span className="text-slate-500">to</span>
            <input type="date" value={custom.to} min={custom.from} max={todayKey} onChange={e => e.target.value && setCustom(c => ({ ...c, to: e.target.value }))} className="border border-slate-200 rounded-lg px-3 py-2" />
          </div>
        )}
        <div className="text-xs text-slate-400 mt-2">
          {loading ? 'Loading…' : fetchedAt ? `Updated ${fetchedAt.toLocaleTimeString('en-IN')}${isCurrent ? ' · refreshes every minute' : ''}${stats && period !== 'day' ? ` · ${stats.saved} days from saved summaries${stats.built ? `, ${stats.built} newly saved` : ''}` : ''}` : ''}
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-5 md:space-y-6">
        {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">{error}</div>}

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          <Kpi title="Revenue" value={rupees(s.revenue)} sub={`${s.orders} paid orders`}>
            <Delta now={s.revenue} before={prev.revenue} label={comp.label} />
          </Kpi>
          <Kpi title="Orders" value={String(s.orders)} sub={`${s.itemsSold} items · ${s.itemsPerOrder.toFixed(1)} per order`}>
            <Delta now={s.orders} before={prev.orders} label={comp.label} />
          </Kpi>
          <Kpi title="Average order value" value={rupees(s.aov)}>
            <Delta now={s.aov} before={prev.aov} label={comp.label} />
          </Kpi>
          <Kpi title="Cancelled" value={`${s.cancelled.count}`} sub={`${rupees(s.cancelled.value)} not collected`}>
            {s.open.count > 0 && <div className="text-xs font-semibold text-amber-600 mt-auto pt-3">{s.open.count} open / unpaid ({rupees(s.open.value)})</div>}
          </Kpi>
          <Card className="flex flex-col col-span-2 xl:col-span-1 !p-3.5 md:!p-5">
            <div className="text-xs md:text-sm font-semibold text-slate-500 mb-1 md:mb-2">Profit margin</div>
            {s.profit.available ? (
              <>
                <div className="text-2xl font-black text-slate-900">{s.profit.marginPct.toFixed(1)}%</div>
                <div className="text-xs text-slate-500 mt-1">Gross profit {rupees(s.profit.grossProfit)}</div>
              </>
            ) : (
              <>
                <div className="text-base font-bold text-slate-400">Cannot be resolved</div>
                <div className="text-xs text-slate-500 mt-1">{s.profit.reason}</div>
              </>
            )}
          </Card>
        </div>
        <InsightsPanel items={alerts} />

        {/* Kitchen vs retail */}
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h3 className="text-base font-bold text-slate-900">Kitchen vs Retail</h3>
            <p className="text-xs text-slate-500">Cigarettes and other bought-in items are included in total revenue and shown here separately.</p>
          </div>
          {s.revenue === 0 ? <div className="text-slate-400 py-6 text-center text-sm">No sales in this period.</div> : (
            <>
              <div className="flex h-4 rounded-full overflow-hidden bg-slate-100 mb-4">
                <div style={{ width: `${s.channels.kitchen.share}%`, background: KITCHEN }} />
                <div style={{ width: `${s.channels.retail.share}%`, background: RETAIL }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {([['kitchen', 'Kitchen items', KITCHEN, kitchenCats, prev.channels.kitchen.revenue], ['retail', 'Retail items', RETAIL, retailCats, prev.channels.retail.revenue]] as const).map(([k, name, color, cats, before]) => {
                  const c = s.channels[k];
                  return (
                    <div key={k} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className="w-3 h-3 rounded-full" style={{ background: color }} />{name}</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{rupees(c.revenue)} <span className="text-sm font-bold text-slate-400">{c.share.toFixed(1)}%</span></div>
                      <div className="text-xs text-slate-500">{c.qty} items sold · in {c.orders} orders</div>
                      <Delta now={c.revenue} before={before} label={comp.label} />
                      <div className="mt-3 space-y-1">
                        {cats.slice(0, 6).map(cat => (
                          <div key={cat.name} className="flex justify-between text-xs"><span className="text-slate-600">{cat.name}</span><span className="font-semibold text-slate-800">{rupees(cat.revenue)}</span></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Trend chart */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-1">{showDaily ? 'Revenue by business day' : 'Revenue by hour'}</h3>
          <p className="text-xs text-slate-500 mb-4">{showDaily ? 'Click a bar to open that day.' : `Hours run from ${hourText} to ${hourText} next day.`}</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {showDaily ? (
                <BarChart data={dailyChart} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} onClick={(d: any) => d?.activePayload?.[0] && drillDay(d.activePayload[0].payload.key)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" minTickGap={12} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} tickFormatter={v => `₹${v}`} />
                  <RechartsTooltip formatter={(v: any, n: any) => [rupees(v), n === 'kitchen' ? 'Kitchen' : 'Retail']} labelFormatter={(l, p: any) => p?.[0]?.payload?.key ?? l} />
                  <Legend formatter={v => (v === 'kitchen' ? 'Kitchen' : 'Retail')} />
                  <Bar dataKey="kitchen" stackId="a" fill={KITCHEN} cursor="pointer" />
                  <Bar dataKey="retail" stackId="a" fill={RETAIL} cursor="pointer" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={s.hourly} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={1} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} tickFormatter={v => `₹${v}`} />
                  <RechartsTooltip formatter={(v: any, _n: any, p: any) => [`${rupees(v)} · ${p.payload.orders} orders`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {s.hourly.map(h => <Cell key={h.hour} fill={s.peakHour && h.label === s.peakHour.label.split(' – ')[0] ? '#059669' : KITCHEN} />)}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-slate-600">
            {s.peakHour && <span>Peak hour: <b>{s.peakHour.label}</b> ({rupees(s.peakHour.revenue)})</span>}
            {showDaily && s.bestDay && <span>Best day: <b>{s.bestDay.key}</b> ({rupees(s.bestDay.revenue)})</span>}
            {showDaily && s.worstDay && <span>Slowest day: <b>{s.worstDay.key}</b> ({rupees(s.worstDay.revenue)})</span>}
          </div>
        </Card>

        {/* Weekday pattern for multi-day ranges */}
        {showDaily && s.daily.length >= 7 && (
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-1">Average revenue by weekday</h3>
            <p className="text-xs text-slate-500 mb-4">Useful for staffing and stock planning.</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.weekday} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" width={60} tickFormatter={v => `₹${v}`} />
                  <RechartsTooltip formatter={(v: any) => [rupees(v), 'Avg revenue']} />
                  <Bar dataKey="avgRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Week by week and projection */}
        {s.weeks.length > 1 && (
          <Card>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-slate-900">Week by week</h3>
              {projection && (
                <p className="text-xs text-slate-600">
                  At the current pace ({rupees(projection.perDay)} a day over {projection.basedOnDays} finished days) this period ends near <b>{rupees(projection.projected)}</b>. An estimate, not a promise.
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead><tr className="text-xs text-slate-500 border-b border-slate-200"><th className="py-2">Week</th><th className="text-right">Days</th><th className="text-right">Orders</th><th className="text-right">Revenue</th><th className="text-right">Avg order</th><th className="text-right">vs previous week</th></tr></thead>
                <tbody>
                  {s.weeks.map((w, i) => {
                    const before = s.weeks[i - 1];
                    const pct = before && before.days === w.days ? pctChange(w.revenue, before.revenue) : null;
                    return (
                      <tr key={w.startKey} className="border-b border-slate-100">
                        <td className="py-2 font-semibold text-slate-800">{w.startKey.slice(5)} – {w.endKey.slice(5)}</td>
                        <td className="text-right text-slate-500">{w.days}</td>
                        <td className="text-right">{w.orders}</td>
                        <td className="text-right font-semibold">{rupees(w.revenue)}</td>
                        <td className="text-right">{rupees(w.aov)}</td>
                        <td className={`text-right font-semibold ${pct === null ? 'text-slate-300' : pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{pct === null ? '–' : `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Heatmap */}
        {showDaily && s.revenue > 0 && (
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-1">When the money comes in</h3>
            <p className="text-xs text-slate-500 mb-4">Revenue by weekday and hour. Darker is busier. Use it to plan shifts and prep.</p>
            <Heatmap data={s.heatmap} />
          </Card>
        )}

        {/* Movers */}
        {(moved.up.length > 0 || moved.down.length > 0) && (
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-1">Items moving vs {comp.label}</h3>
            <p className="text-xs text-slate-500 mb-4">Biggest changes in item revenue.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {([['Selling more', moved.up, 'text-emerald-600'], ['Selling less', moved.down, 'text-red-500']] as const).map(([title, list, color]) => (
                <div key={title}>
                  <div className="text-sm font-bold text-slate-700 mb-2">{title}</div>
                  {list.length === 0 && <div className="text-xs text-slate-400">Nothing notable.</div>}
                  {list.map(m => (
                    <div key={m.id} className="flex justify-between text-sm py-1 border-b border-slate-100">
                      <span className="text-slate-700">{m.name.trim()} <span className="text-xs text-slate-400">{m.qtyBefore} → {m.qtyNow}</span></span>
                      <span className={`font-semibold ${color}`}>{m.delta > 0 ? '+' : '−'}{rupees(Math.abs(m.delta))}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-3">Payment method</h3>
            <SplitTable rows={s.paymentSplit.map(p => ({ name: p.method, revenue: p.revenue, orders: p.orders }))} total={s.revenue} />
          </Card>
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-3">Order type</h3>
            <SplitTable rows={s.typeSplit.map(t => ({ name: t.type === 'dine_in' ? 'Dine-in' : 'Takeaway / counter', revenue: t.revenue, orders: t.orders }))} total={s.revenue} />
          </Card>
        </div>

        {/* Cash reconciliation (one day) and monthly P&L */}
        {period === 'day' && (
          <CashReconciliation dateKey={range.startKey} cashSales={cashSales} who={user ? { id: user.id, name: user.name } : undefined} onVariance={setCashVariance} />
        )}
        {period === 'month' && (
          <MonthlyPnl
            monthKey={range.startKey.slice(0, 7)}
            monthInProgress={isCurrent}
            revenue={s.revenue}
            cogs={s.profit.available ? s.profit.cogs : null}
            itemsWithoutCost={s.profit.available ? 0 : s.profit.itemsWithoutCost}
            staffCost={staffCost}
          />
        )}

        {/* Staff */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 mb-1">Staff performance</h3>
          <p className="text-xs text-slate-500 mb-3">Credited to whoever took the payment. Orders paid before staff tracking was added show as &quot;Not recorded&quot;.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-200"><th className="py-2">Staff</th><th className="text-right">Orders</th><th className="text-right">Revenue</th><th className="text-right">Avg order</th><th className="text-right">Cancelled</th><th className="text-right">Share</th></tr></thead>
              <tbody>
                {s.staff.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">No data.</td></tr>}
                {s.staff.map(r => (
                  <tr key={r.name} className="border-b border-slate-100">
                    <td className="py-2 font-semibold text-slate-800">{r.name}</td>
                    <td className="text-right">{r.orders}</td>
                    <td className="text-right font-semibold">{rupees(r.revenue)}</td>
                    <td className="text-right">{rupees(r.aov)}</td>
                    <td className="text-right">{r.cancelled}</td>
                    <td className="text-right text-slate-500">{s.revenue ? ((r.revenue / s.revenue) * 100).toFixed(0) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Tables and service speed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-3">Tables</h3>
            {s.tables.length === 0 ? <div className="text-slate-400 text-sm py-4">No dine-in sales.</div> : (
              <table className="w-full text-sm text-left">
                <thead><tr className="text-xs text-slate-500 border-b border-slate-200"><th className="py-2">Table</th><th className="text-right">Orders</th><th className="text-right">Revenue</th><th className="text-right">Share</th></tr></thead>
                <tbody>
                  {s.tables.slice(0, 12).map(t => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-2 font-semibold text-slate-800">{tableLabel(t)}</td>
                      <td className="text-right">{t.orders}</td>
                      <td className="text-right font-semibold">{rupees(t.revenue)}</td>
                      <td className="text-right text-slate-500">{s.revenue ? ((t.revenue / s.revenue) * 100).toFixed(0) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-1">Service speed</h3>
            <p className="text-xs text-slate-500 mb-4">Measured only on orders placed since time tracking started.</p>
            {([['Time to prepare', s.timing.avgPrepMin, s.timing.prepN], ['Order to served', s.timing.avgServeMin, s.timing.serveN], ['Order to paid', s.timing.avgPayMin, s.timing.payN]] as const).map(([label, v, n]) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{v === null ? <span className="text-slate-400 font-normal">no data yet</span> : `${Math.round(v)} min`} {v !== null && <span className="text-xs text-slate-400 font-normal">({n} orders)</span>}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Items */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-bold text-slate-900">Items sold</h3>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'kitchen', 'retail'] as const).map(c => (
                <button key={c} onClick={() => setItemChannelFilter(c)} className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${itemChannelFilter === c ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-200"><th className="py-2">Item</th><th>Category</th><th className="text-right">Qty</th><th className="text-right">Revenue</th><th className="text-right">Share</th></tr></thead>
              <tbody>
                {itemRows.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-400">No items sold.</td></tr>}
                {(showAllItems ? itemRows : itemRows.slice(0, 15)).map(i => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-2 font-semibold text-slate-800">{i.name}</td>
                    <td className="text-slate-500"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: i.channel === 'retail' ? RETAIL : KITCHEN }} />{i.category}</td>
                    <td className="text-right">{i.qty}</td>
                    <td className="text-right font-semibold">{rupees(i.revenue)}</td>
                    <td className="text-right text-slate-500">{i.share.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {itemRows.length > 15 && <button onClick={() => setShowAllItems(v => !v)} className="mt-3 text-sm font-semibold text-slate-600 hover:text-slate-900">{showAllItems ? 'Show top 15' : `Show all ${itemRows.length} items`}</button>}
        </Card>

        {/* Order ledger */}
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Order ledger</h3>
              <p className="text-xs text-slate-500">Every order behind the numbers above.{ledgerLoaded ? ` ${ledger.length} shown.` : ''}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={query} onChange={e => { setQuery(e.target.value); setLedgerLimit(50); }} placeholder="Search order, table, item, staff…" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64" />
              <select value={stateFilter} onChange={e => { setStateFilter(e.target.value as any); setLedgerLimit(50); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="all">All orders</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option><option value="open">Open / unpaid</option>
              </select>
            </div>
          </div>
          {!ledgerLoaded ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">Totals above come from saved daily summaries. Load the individual orders to browse or search them.</p>
              <button onClick={ensureLedger} disabled={!orderCount || loadingLedger} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">
                {loadingLedger ? 'Loading…' : `Load ${orderCount} orders`}
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-200"><th className="py-2">Time</th><th>Order</th><th>Table</th><th className="text-right">Items</th><th className="text-right">Total</th><th>Payment</th><th>Staff</th><th>Status</th></tr></thead>
              <tbody>
                {ledger.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-slate-400">No orders match.</td></tr>}
                {ledger.slice(0, ledgerLimit).map(r => (
                  <React.Fragment key={r.id}>
                    <tr onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="border-b border-slate-100 cursor-pointer hover:bg-slate-50">
                      <td className="py-2 whitespace-nowrap text-slate-600">{period !== 'day' && <span className="text-slate-400">{r.businessDate.slice(5)} </span>}{r.time?.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</td>
                      <td className="font-semibold text-slate-800">{r.displayId}</td>
                      <td>{r.table}</td>
                      <td className="text-right">{r.itemCount}</td>
                      <td className={`text-right font-semibold ${r.state === 'cancelled' ? 'line-through text-slate-400' : ''}`}>{rupees(r.total)}</td>
                      <td>{r.paymentMethod}</td>
                      <td className="text-slate-600">{r.staff}</td>
                      <td><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${r.state === 'paid' ? 'bg-emerald-50 text-emerald-700' : r.state === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{r.state === 'open' ? 'open' : r.state}</span></td>
                    </tr>
                    {expanded === r.id && (
                      <tr className="bg-slate-50"><td colSpan={8} className="px-4 py-3">
                        {r.customer && <div className="text-xs text-slate-500 mb-1">Customer: {r.customer}</div>}
                        {r.timeline.length > 1 && (
                          <div className="text-xs text-slate-500 mb-2">
                            {r.timeline.map((t, i) => (
                              <span key={t.label}>{i > 0 && ' → '}{t.label} {t.time.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
                            ))}
                            {r.minutesToPay !== null && <span className="font-semibold text-slate-700"> ({r.minutesToPay} min to pay)</span>}
                          </div>
                        )}
                        {r.mergedRounds > 0 && <div className="text-xs text-slate-500 mb-2">Combined bill: includes {r.mergedRounds} earlier order round{r.mergedRounds > 1 ? 's' : ''}</div>}
                        {r.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-xs py-0.5">
                            <span><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: i.channel === 'retail' ? RETAIL : KITCHEN }} />{i.qty} × {i.name.trim()}</span>
                            <span className="font-semibold">{rupees(i.qty * i.price)}</span>
                          </div>
                        ))}
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          )}
          {ledgerLoaded && ledger.length > ledgerLimit && <button onClick={() => setLedgerLimit(l => l + 100)} className="mt-3 text-sm font-semibold text-slate-600 hover:text-slate-900">Show more ({ledger.length - ledgerLimit} left)</button>}
        </Card>
      </div>
    </div>
  );
}

function SplitTable({ rows, total }: { rows: { name: string; revenue: number; orders: number }[]; total: number }) {
  if (!rows.length) return <div className="text-slate-400 text-sm py-4">No data.</div>;
  return (
    <div className="space-y-3">
      {rows.map(r => (
        <div key={r.name}>
          <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{r.name}</span><span className="font-bold text-slate-900">{rupees(r.revenue)} <span className="text-xs text-slate-400 font-medium">· {r.orders} orders · {total ? ((r.revenue / total) * 100).toFixed(0) : 0}%</span></span></div>
          <div className="h-2 rounded-full bg-slate-100 mt-1"><div className="h-2 rounded-full bg-slate-700" style={{ width: `${total ? (r.revenue / total) * 100 : 0}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
