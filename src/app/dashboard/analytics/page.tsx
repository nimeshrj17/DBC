'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useOrders } from '@/lib/hooks/useOrders';
import { useInventory } from '@/lib/hooks/useInventory';
import { BarChart3, TrendingUp, CheckCircle2, Receipt, Package, DollarSign, X } from 'lucide-react';
import { Order } from '@/lib/hooks/useOrders';

const formatDate = (timestamp: any) => {
  if (!timestamp) return { time: '', date: '' };
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  };
};

export default function AnalyticsPage() {
  const { orders, loading: ordersLoading } = useOrders();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Filter completed orders that have been paid
  const completedOrders = orders.filter(
    order => order.status === 'completed' && order.paymentStatus === 'paid'
  );

  // Calculate totals
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const totalExpenses = inventory.reduce((sum, item) => sum + item.totalCost, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  if (ordersLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto md:p-8 flex flex-col min-w-0 bg-slate-50 md:bg-transparent h-full pb-10 md:space-y-8">
      
      {/* --- DESKTOP HEADER & KPI --- */}
      <div className="hidden md:block space-y-8">
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Revenue & Analytics</h1>
            <p className="text-sm font-normal text-slate-500 mt-1">Track completed bills, inventory expenses, and cafe net profit.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg p-1 bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-600">
              <button className="px-3 py-1.5 rounded-md bg-white text-slate-900 shadow-sm font-bold">Today</button>
              <button className="px-3 py-1.5 rounded-md hover:text-slate-900 transition-colors">Yesterday</button>
              <button className="px-3 py-1.5 rounded-md hover:text-slate-900 transition-colors">This Week</button>
              <button className="px-3 py-1.5 rounded-md hover:text-slate-900 transition-colors">This Month</button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gross Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">₹ {totalRevenue.toFixed(2)}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} /> Today
              </span>
              <span className="text-[11px] text-slate-400">Real-time</span>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Expenses</span>
                <div className="text-2xl font-black text-rose-600 mt-2 tracking-tight">₹ {totalExpenses.toFixed(2)}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-100 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-slate-600 font-medium truncate">Inventory & Restock</span>
              <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">Cost</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-2xl p-5 border-2 border-lime-400/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group bg-gradient-to-b from-white to-lime-50/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Net Profit</span>
                  <span className="text-[10px] font-extrabold bg-lime-200 text-lime-900 px-2 py-0.5 rounded-full ring-1 ring-lime-400/40">
                    {netProfit >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% Margin
                  </span>
                </div>
                <div className={`text-2xl font-black mt-2 tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ₹ {netProfit.toFixed(2)}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-lime-300 text-slate-900 font-bold flex items-center justify-center ring-1 ring-lime-400 group-hover:scale-105 transition-transform">
                <span className="text-lg font-black">₹</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className={`${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'} font-bold flex items-center gap-1`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                {netProfit >= 0 ? 'Healthy Returns' : 'Loss'}
              </span>
              <span className="text-[11px] text-slate-400">Post deductions</span>
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Orders</span>
                <div className="text-2xl font-black text-blue-700 mt-2 tracking-tight">{completedOrders.length}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-100 group-hover:scale-105 transition-transform">
                <Receipt className="w-6 h-6" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-slate-600 font-medium">Successfully settled</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Paid</span>
            </div>
          </div>
        </section>

        {/* Desktop Table */}
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Settled Bills Ledger</h3>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6" scope="col">Order ID</th>
                  <th className="py-3.5 px-6" scope="col">Date & Time</th>
                  <th className="py-3.5 px-6" scope="col">Table / Source</th>
                  <th className="py-3.5 px-6" scope="col">Method</th>
                  <th className="py-3.5 px-6 text-right" scope="col">Total Paid</th>
                  <th className="py-3.5 px-6 text-center" scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {completedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No completed orders found.</td>
                  </tr>
                ) : (
                  completedOrders.map((order) => (
                    <tr key={order.id} onClick={() => setViewOrder(order)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <span className="group-hover:text-indigo-600 transition-colors">#{order.displayId || order.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 text-xs">{formatDate(order.createdAt).time}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{formatDate(order.createdAt).date}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {(order as any).tableName || `Table ${order.tableNumber}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider ${
                          order.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                          {(order.paymentMethod || 'UPI').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-extrabold text-emerald-600 text-base">₹ {order.total.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={(e) => { e.stopPropagation(); setViewOrder(order); }} className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>


      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex-1 px-4 pt-3 pb-8 flex flex-col gap-4">
        
        {/* Mobile Header / Filters */}
        <section className="flex flex-col gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Analytics</h1>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-brand-lime text-black border border-lime-300 shadow-sm whitespace-nowrap">Today</button>
            <button className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">Yesterday</button>
            <button className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">This Week</button>
          </div>
        </section>

        {/* Mobile KPI Grid */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue & Margin Stats</h3>
            <span className="text-[11px] font-semibold text-slate-500">{new Date().toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Gross Revenue */}
            <article className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Gross Revenue</span>
                <p className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">₹ {totalRevenue.toFixed(0)}<span className="text-xs font-medium text-slate-400">.{(totalRevenue % 1).toFixed(2).slice(2)}</span></p>
              </div>
            </article>

            {/* Net Profit */}
            <article className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-900 flex items-center justify-center font-bold text-sm">₹</div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md">
                  {netProfit >= 0 ? '+' : ''}{profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Net Profit</span>
                <p className="text-base font-extrabold text-emerald-600 tracking-tight mt-0.5">₹ {netProfit.toFixed(0)}<span className="text-xs font-medium text-emerald-500">.{(Math.abs(netProfit) % 1).toFixed(2).slice(2)}</span></p>
              </div>
            </article>

            {/* Expenses */}
            <article className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Package className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-medium text-slate-400">Inventory</span>
              </div>
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Expenses</span>
                <p className="text-base font-extrabold text-rose-600 tracking-tight mt-0.5">₹ {totalExpenses.toFixed(0)}<span className="text-xs font-medium text-rose-400">.{(totalExpenses % 1).toFixed(2).slice(2)}</span></p>
              </div>
            </article>

            {/* Settled Orders */}
            <article className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">Paid</span>
              </div>
              <div className="mt-2.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Settled Bills</span>
                <p className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">{completedOrders.length} <span className="text-xs font-semibold text-slate-400">orders</span></p>
              </div>
            </article>
          </div>
        </section>

        {/* Mobile Ledger List */}
        <section className="space-y-2.5 mt-2">
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Completed Bills Ledger</h3>
              <p className="text-[11px] text-slate-500">Real-time settled revenue list</p>
            </div>
          </div>
          
          <div className="space-y-2.5">
            {completedOrders.length === 0 ? (
              <p className="text-sm text-center text-slate-500 py-4 bg-white rounded-xl border border-slate-100">No completed orders</p>
            ) : (
              completedOrders.map(order => (
                <article key={order.id} onClick={() => setViewOrder(order)} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm active:scale-[0.99] transition cursor-pointer">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">#{order.displayId || order.id.slice(0,8)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        order.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-700 border-amber-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                      }`}>
                        {(order.paymentMethod || 'UPI').toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {(order as any).tableName || `Table ${order.tableNumber}`}
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600 tracking-tight">₹ {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50 mt-2">
                    <div className="flex items-center gap-2">
                      <span>{formatDate(order.createdAt).time} • {formatDate(order.createdAt).date}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setViewOrder(order); }} className="text-slate-400 hover:text-slate-700 flex items-center gap-0.5 font-medium" type="button">
                      Receipt
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>


      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Details</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">#{viewOrder.displayId || viewOrder.id.slice(0,8)} • {(viewOrder as any).tableName || `Table ${viewOrder.tableNumber}`}</p>
                {(viewOrder.customerName || viewOrder.customerPhone) && (
                  <p className="text-sm font-bold text-orange-600 mt-1">
                    {viewOrder.customerName} {viewOrder.customerPhone ? `(${viewOrder.customerPhone})` : ''}
                  </p>
                )}
              </div>
              <button onClick={() => setViewOrder(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</div>
                  <div className="mt-1">
                    <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Settled
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Settled At</div>
                  <div className="mt-1 font-bold text-slate-900">{formatDate(viewOrder.createdAt).time} - {formatDate(viewOrder.createdAt).date}</div>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-500">Order Items</div>
                <ul className="divide-y divide-slate-100">
                  {viewOrder.items.map((item, idx) => (
                    <li key={idx} className="p-4 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">{item.qty}x</span>
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">₹ {(item.price * item.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-slate-50/80 border-t border-slate-200">
                  <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
                    <span>Subtotal</span>
                    <span>₹ {viewOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-500 mb-3">
                    <span>Tax</span>
                    <span>₹ {viewOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg pt-3 border-t border-slate-200 text-slate-900">
                    <span>Total</span>
                    <span className="text-emerald-600">₹ {viewOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
