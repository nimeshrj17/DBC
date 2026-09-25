'use client';

import React from 'react';
import { useOwnerMetrics } from '@/lib/hooks/useOwnerMetrics';
import { TrendingUp, Receipt, Users, Clock, AlertCircle } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { metrics, loading } = useOwnerMetrics();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Today's Sales</p>
            <h2 className="text-3xl font-black text-slate-900">₹ {metrics.totalSales.toFixed(0)}</h2>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
            <TrendingUp strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Bills</p>
            <h2 className="text-3xl font-black text-slate-900">{metrics.totalBills}</h2>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
            <Receipt strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Average Bill</p>
            <h2 className="text-3xl font-black text-slate-900">₹ {metrics.avgBill.toFixed(0)}</h2>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
            <Users strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Hourly Chart */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Hourly Sales Heatmap
          </h3>
          <div className="flex items-end gap-2 h-48">
            {metrics.hourlySales.map((h, idx) => {
              const maxSales = Math.max(...metrics.hourlySales.map(x => x.amount), 1);
              const height = (h.amount / maxSales) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none">
                    ₹{h.amount} ({h.bills} bills)
                  </div>
                  <div 
                    className="w-full bg-indigo-100 group-hover:bg-indigo-300 rounded-t-md transition-all relative overflow-hidden"
                    style={{ height: `${height}%`, minHeight: h.amount > 0 ? '4px' : '0' }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-indigo-500" style={{ height: '100%', opacity: 0.8 }}></div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-medium">{h.hour.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Split & Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Payment Split</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-600">UPI / QR</span>
                  <span className="text-slate-900">₹ {metrics.paymentSplit.upi.toFixed(0)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.paymentSplit.upi / metrics.totalSales) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-600">Cash</span>
                  <span className="text-slate-900">₹ {metrics.paymentSplit.cash.toFixed(0)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${metrics.totalSales > 0 ? (metrics.paymentSplit.cash / metrics.totalSales) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-2xl border border-rose-100 p-6">
            <h3 className="text-lg font-bold text-rose-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Pending Actions
            </h3>
            <p className="text-sm text-rose-600 mb-4">You have not generated the End of Day Report for today.</p>
            <button className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors">
              Start End of Day Report
            </button>
          </div>
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Top Moving Items Today</h3>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="text-xs text-slate-500 uppercase bg-slate-50">
               <tr>
                 <th className="px-4 py-3 rounded-l-lg">Item Name</th>
                 <th className="px-4 py-3 text-right">Qty Sold</th>
                 <th className="px-4 py-3 text-right rounded-r-lg">Revenue Generated</th>
               </tr>
             </thead>
             <tbody>
               {metrics.itemSales.slice(0, 5).map((item, idx) => (
                 <tr key={idx} className="border-b border-slate-50 last:border-0">
                   <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                   <td className="px-4 py-3 text-right text-slate-600">{item.qty}</td>
                   <td className="px-4 py-3 text-right font-bold text-slate-900">₹ {item.revenue.toFixed(0)}</td>
                 </tr>
               ))}
               {metrics.itemSales.length === 0 && (
                 <tr>
                   <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No items sold yet today.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

    </div>
  );
}
