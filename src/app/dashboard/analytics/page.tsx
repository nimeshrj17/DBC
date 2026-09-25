'use client';
import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Clock, 
  Users, CreditCard, Coffee, LayoutDashboard
} from 'lucide-react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useMenu } from '@/lib/hooks/useMenu';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const { analytics, loading, orders } = useAnalytics(30);
  const { menuItems } = useMenu();
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'customers' | 'splits' | 'history'>('overview');

  if (loading || !analytics) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { today, trends, menu, customers, splits } = analytics;

  return (
    <div className="flex flex-col w-full h-full pb-10 bg-slate-50 overflow-y-auto custom-scroll">
      {/* Header */}
      <div className="px-5 md:px-8 pt-5 md:pt-6 pb-4 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cafe Analytics</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Data from the last 30 days to drive daily decisions.</p>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl overflow-x-auto hide-scrollbar">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Overview & Trends</button>
            <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'menu' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Menu Performance</button>
            <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Customers</button>
            <button onClick={() => setActiveTab('splits')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'splits' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Payments & Types</button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Order History</button>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8 space-y-6">
        
        {/* 1. TOP-LEVEL SNAPSHOT (Always visible at top or in Overview) */}
        {(activeTab === 'overview') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold text-sm">
                <IndianRupee className="w-4 h-4" /> Today's Revenue
              </div>
              <div className="text-2xl font-black text-slate-900">₹ {today.revenue.toLocaleString()}</div>
              {today.revenueGrowth !== null && (
                <div className={`mt-auto pt-3 text-xs font-bold flex items-center gap-1 ${today.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {today.revenueGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {Math.abs(today.revenueGrowth).toFixed(1)}% vs same day last week
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold text-sm">
                <ShoppingBag className="w-4 h-4" /> Orders & AOV
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{today.orders}</span>
                <span className="text-sm font-medium text-slate-500">orders</span>
              </div>
              <div className="mt-auto pt-3 text-xs font-bold text-slate-600 border-t border-slate-100">
                ₹ {today.aov.toFixed(0)} Average Order Value
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold text-sm">
                <LayoutDashboard className="w-4 h-4" /> Live Operations
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600">{today.liveOrders}</span>
                <span className="text-sm font-medium text-slate-500">active orders</span>
              </div>
              <div className="mt-auto pt-3 text-xs font-bold text-slate-600 border-t border-slate-100">
                Currently in kitchen/queue
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold text-sm">
                <Clock className="w-4 h-4" /> 30-Day Peak Hour
              </div>
              <div className="text-2xl font-black text-amber-600">{today.peakHourString}</div>
              <div className="mt-auto pt-3 text-xs font-bold text-slate-600 border-t border-slate-100">
                Busiest time of day historically
              </div>
            </div>



          </div>
        )}

        {/* 2. SALES TRENDS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Revenue Over Time (30 Days)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.dailyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} stroke="#94a3b8" />
                    <YAxis tick={{fontSize: 12}} stroke="#94a3b8" width={60} tickFormatter={(value) => `₹${value}`} />
                    <RechartsTooltip 
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Day of Week Breakdown</h3>
                <p className="text-xs text-slate-500 mb-4">Average revenue per day to help with staffing</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.dayOfWeek} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{fontSize: 12}} stroke="#94a3b8" />
                      <YAxis tick={{fontSize: 12}} stroke="#94a3b8" width={60} tickFormatter={(value) => `₹${value}`} />
                      <RechartsTooltip formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Avg Revenue']} />
                      <Bar dataKey="avgRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-1">Hourly Heatmap</h3>
                <p className="text-xs text-slate-500 mb-4">Total orders processed per hour</p>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.hourly} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{fontSize: 10}} minTickGap={10} stroke="#94a3b8" />
                      <YAxis tick={{fontSize: 12}} stroke="#94a3b8" width={40} />
                      <RechartsTooltip formatter={(value: any) => [value, 'Orders']} />
                      <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>



          </div>
        )}

        {/* 3. MENU / ITEM PERFORMANCE */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-none border border-slate-200 shadow-xs md:col-span-2 flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-4">Category Revenue Split</h3>
                <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={menu.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {menu.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 h-48 md:h-64 overflow-y-auto custom-scroll pr-2">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white text-slate-500 pb-2">
                        <tr>
                          <th className="text-left font-semibold pb-2">Category</th>
                          <th className="text-right font-semibold pb-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {menu.categoryBreakdown.map((entry: any, index: number) => (
                          <tr key={index}>
                            <td className="py-2 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-none" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="font-medium text-slate-800">{entry.name}</span>
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900">₹{entry.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center">
                <h3 className="text-base font-bold text-slate-900 mb-2">Combo / Attach Rate</h3>
                <div className="text-4xl font-black text-brand-600 mb-2">{menu.attachRate.toFixed(1)}%</div>
                <p className="text-sm font-medium text-slate-500">
                  of orders contain multiple items. A higher rate means staff are successfully upselling (e.g., adding a pastry to a coffee).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Best Sellers (By Quantity)</h3>
                  <p className="text-xs text-slate-500">Items ordered most frequently</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {menu.topByQty.map((item, idx) => (
                    <li key={idx} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-slate-400 text-xs">{idx + 1}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg text-sm">{item.qty}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Top Revenue Drivers (By ₹)</h3>
                  <p className="text-xs text-slate-500">Items bringing in the most cash</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {menu.topByRevenue.map((item, idx) => (
                    <li key={idx} className="p-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-slate-400 text-xs">{idx + 1}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </div>
                      </div>
                      <div className="font-black text-emerald-600 text-sm">₹{item.revenue.toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* FULL MENU ASSESSMENT */}
            <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Complete Menu Assessment</h3>
                  <p className="text-sm text-slate-500">Dead stock and low-performing items highlighted</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96 custom-scroll">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-white sticky top-0 border-b border-slate-100 uppercase z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-bold">Item Name</th>
                      <th className="px-6 py-3 font-bold">Category</th>
                      <th className="px-6 py-3 font-bold text-center">Qty Sold</th>
                      <th className="px-6 py-3 font-bold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuItems.map(item => {
                      const stats = menu.allItemPerformance[item.id] || { qty: 0, revenue: 0 };
                      return { ...item, ...stats };
                    }).sort((a, b) => a.qty - b.qty).map((item, idx) => (
                      <tr key={idx} className={`transition-colors ${item.qty === 0 ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.qty === 0 && <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Never Ordered</span>}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-600">{item.category || 'N/A'}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-none font-bold ${item.qty === 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{item.qty}</span>
                        </td>
                        <td className={`px-6 py-3 text-right font-black ${item.qty === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>₹{item.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>




          </div>
        )}

        {/* 4. CUSTOMER BEHAVIOR */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tracked Customer Base</h3>
                <p className="text-sm text-slate-500">Unique phone numbers recorded in the last 30 days.</p>
              </div>
              <div className="text-3xl font-black text-slate-900">{customers.totalTracked}</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">Top Repeat Customers (Loyalty)</h3>
                <p className="text-xs text-slate-500">Customers with the highest lifetime spend in this period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/50 border-b border-slate-100 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-bold">Customer Name</th>
                      <th className="px-6 py-3 font-bold">Phone Number</th>
                      <th className="px-6 py-3 font-bold text-center">Orders</th>
                      <th className="px-6 py-3 font-bold text-right">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.top.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No customer data captured yet.</td></tr>
                    ) : (
                      customers.top.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{cust.name}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{cust.phone}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold">{cust.orderCount}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-emerald-600">₹{cust.totalSpend.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>



          </div>
        )}

        {/* 5. PAYMENTS & ORDER TYPES */}
        {activeTab === 'splits' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Payment Method Breakdown</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={splits.payment}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {splits.payment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">Order Type Split (Dine-in vs Takeaway)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={splits.orderType}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      dataKey="value"
                    >
                      {splits.orderType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8b5cf6', '#ec4899'][index % 2]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => [`${value} Orders`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>



          </div>
        )}


        {/* 5. ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">30-Day Order History</h3>
                <p className="text-sm text-slate-500">Raw ledger of all processed orders</p>
              </div>
              <div className="text-sm font-bold text-slate-700 bg-slate-200 px-3 py-1 rounded-none">
                {orders.length} Orders
              </div>
            </div>
            <div className="overflow-auto h-[calc(100vh-220px)] custom-scroll">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-white sticky top-0 border-b border-slate-100 uppercase z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 font-bold">Date & Time</th>
                    <th className="px-6 py-3 font-bold">Order ID</th>
                    <th className="px-6 py-3 font-bold">Type</th>
                    <th className="px-6 py-3 font-bold">Items</th>
                    <th className="px-6 py-3 font-bold">Total</th>
                    <th className="px-6 py-3 font-bold">Payment</th>
                    <th className="px-6 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order, idx) => {
                    const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());
                    const itemCount = order.items ? order.items.reduce((sum: number, i: any) => sum + (i.qty || 0), 0) : 0;
                    
                    return (
                      <tr key={order.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-900">{date.toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 font-medium uppercase">{date.toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-3 font-mono text-xs font-bold text-slate-600">
                          {order.displayId || order.id?.substring(0, 6)}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-600 capitalize">
                          {order.tableNumber === 999999 ? 'Takeaway' : 'Dine-in'}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-none text-xs">{itemCount}</span>
                        </td>
                        <td className="px-6 py-3 font-black text-emerald-600">
                          ₹{order.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentMethod || 'Unknown'} {order.paymentStatus === 'paid' ? '' : `(${order.paymentStatus})`}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
