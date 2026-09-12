'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Search, Filter, MoreHorizontal, CheckCircle2, Clock, Check, ChefHat, QrCode, Banknote, X } from 'lucide-react';
import { useOrders, Order } from '@/lib/hooks/useOrders';
import { useTables } from '@/lib/hooks/useTables';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import PaymentModal from '@/components/dashboard/PaymentModal';

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'pending': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"><Clock className="w-3 h-3 mr-1" />Pending</span>;
    case 'preparing': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700"><ChefHat className="w-3 h-3 mr-1" />Preparing</span>;
    case 'prepared': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><CheckCircle2 className="w-3 h-3 mr-1" />Prepared</span>;
    case 'served': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Check className="w-3 h-3 mr-1" />Served</span>;
    case 'billed': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><Banknote className="w-3 h-3 mr-1" />Billed</span>;
    case 'completed': 
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" />Completed</span>;
    case 'cancelled':
      return <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><X className="w-3 h-3 mr-1" />Voided</span>;
    default: 
      return <span className="px-2.5 py-1 rounded-full w-fit text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return { time: '', date: '' };
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  };
};

export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, updateOrder } = useOrders();
  const { tables, updateTableStatus } = useTables();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);

  const handleStatusChange = async (order: Order, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(order.id, newStatus);
      
      const table = tables.find(t => t.id === order.tableId);
      if (!table || !table.activeOrderIds || table.activeOrderIds.length === 0) return;
      
      const activeOrdersForTable = orders
        .filter(o => table.activeOrderIds!.includes(o.id))
        .map(o => o.id === order.id ? { ...o, status: newStatus } : o);
        
      let newTableStatus = table.status;
      
      if (activeOrdersForTable.some(o => o.status === 'preparing' || o.status === 'prepared')) {
        newTableStatus = 'preparing';
      } else if (activeOrdersForTable.every(o => o.status === 'served')) {
        newTableStatus = 'served';
      } else if (activeOrdersForTable.every(o => o.status === 'billed')) {
        newTableStatus = 'awaiting_payment';
      } else if (activeOrdersForTable.some(o => o.status === 'pending')) {
        newTableStatus = 'order_placed';
      }
      
      if (newTableStatus !== table.status) {
        await updateTableStatus(table.id, newTableStatus, table.activeOrderIds);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // Tick every minute to update staleness highlights
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkPaid = async (method: 'cash' | 'qr') => {
    if (!orderToPay) return;
    try {
      const orderRef = doc(db, 'orders', orderToPay.id);
      const tableRef = doc(db, 'tables', orderToPay.tableId);

      await runTransaction(db, async (transaction) => {
        const tableSnap = await transaction.get(tableRef);
        
        // 1. Update order
        transaction.update(orderRef, {
          status: 'completed', 
          paymentStatus: 'paid', 
          paymentMethod: method 
        });

        // 2. Update table
        if (tableSnap.exists()) {
          const tableData = tableSnap.data();
          const activeIds = tableData.activeOrderIds || [];
          // Assume the table is ready to be cleared if there's only 1 active order left, OR we can just clear it.
          // Wait, we need to check if there are other unpaid active orders on this table.
          // Since we are in a transaction and don't have all orders, we can safely just remove this order from activeOrderIds.
          const newActiveIds = activeIds.filter((id: string) => id !== orderToPay.id);
          if (newActiveIds.length === 0) {
            transaction.update(tableRef, {
              status: 'empty',
              activeOrderIds: [],
              occupancy: 0,
              customerName: null,
              customerPhone: null
            });
          } else {
            transaction.update(tableRef, {
              status: 'occupied',
              activeOrderIds: newActiveIds
            });
          }
        }
      });
      setOrderToPay(null);
      toast.success("Order marked as paid successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment. Please try again.");
    }
  };

  const activeOrders = orders.filter(o => {
    return true; 
  }).sort((a, b) => {
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });

  const filteredOrders = activeOrders.filter(order => {
    if (order.status === 'completed' || order.status === 'cancelled') return false;
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (order.displayId || '').toLowerCase().includes(searchLower) || 
           (tables.find(t => t.id === order.tableId)?.name || '').toLowerCase().includes(searchLower) ||
           `Table ${order.tableNumber}`.toLowerCase().includes(searchLower);
  });
  
  const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
  const prepCount = activeOrders.filter(o => o.status === 'preparing').length;
  const readyCount = activeOrders.filter(o => o.status === 'prepared').length;
  const servedCount = activeOrders.filter(o => o.status === 'served').length;
  const billedCount = activeOrders.filter(o => o.status === 'billed').length;


  return (
    <div className="flex flex-col w-full h-full pb-6">
      {/* Orders Filter & Operations Control Bar */}
      <div className="px-5 md:px-8 pt-4 md:pt-5 pb-3 shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-sm z-10 sticky top-0">
        <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Orders</h2>
            <p className="text-xs text-slate-500 font-medium md:hidden">Live kitchen orders & billing</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {filteredOrders.length} Visible
          </span>
          
          {/* Order Stage Filter Tabs (Desktop) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl ml-4 border border-slate-200/80 text-xs font-semibold overflow-x-auto hide-scrollbar">
            <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>All ({activeOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length})</button>
            <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Waiting ({pendingCount})</button>
            <button onClick={() => setStatusFilter('preparing')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'preparing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Preparing ({prepCount})</button>
            <button onClick={() => setStatusFilter('prepared')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'prepared' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Prepared ({readyCount})</button>
            <button onClick={() => setStatusFilter('served')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'served' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Served ({servedCount})</button>
            <button onClick={() => setStatusFilter('billed')} className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${statusFilter === 'billed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Billed ({billedCount})</button>
          </div>
        </div>
        
        {/* Controls: Search, Zone, New Order */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full lg:w-auto mt-2 lg:mt-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] md:min-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search by ID, table..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 md:py-2 text-xs bg-white border border-slate-200 md:border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-slate-800 placeholder-slate-400 font-medium shadow-2xs md:shadow-none" 
            />
          </div>
          {/* Filter Dropdown (Mobile) */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:hidden py-1.5 md:py-2 pl-3 pr-8 text-xs font-semibold bg-white border border-slate-200 md:border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-2xs md:shadow-none">
            <option value="all">All Statuses</option>
            <option value="pending">Waiting ({pendingCount})</option>
            <option value="preparing">Preparing ({prepCount})</option>
            <option value="prepared">Prepared ({readyCount})</option>
            <option value="served">Served ({servedCount})</option>
            <option value="billed">Billed ({billedCount})</option>
          </select>
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-4 pb-12 bg-slate-50 custom-scroll">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 font-medium">No orders found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filteredOrders.map((order) => {
              const { time, date } = formatDate(order.createdAt);
              
              let isStale = false;
              if (order.status === 'pending' && order.createdAt) {
                const createdTime = typeof order.createdAt?.toMillis === 'function' 
                  ? order.createdAt.toMillis() 
                  : (order.createdAt as any).seconds * 1000;
                if (Date.now() - createdTime > 10 * 60 * 1000) isStale = true;
              }

              // Card Status Styling mappings
              let statusBg = 'bg-slate-50';
              let statusText = 'text-slate-700';
              let statusBorder = 'border-slate-200';
              let Icon = Clock;
              
              if (order.status === 'pending') {
                statusBg = isStale ? 'bg-red-50' : 'bg-orange-50';
                statusText = isStale ? 'text-red-700' : 'text-amber-700';
                statusBorder = isStale ? 'border-red-200' : 'border-amber-200';
                Icon = Clock;
              } else if (order.status === 'preparing') {
                statusBg = 'bg-blue-50';
                statusText = 'text-blue-700';
                statusBorder = 'border-blue-200';
                Icon = ChefHat;
              } else if (order.status === 'prepared') {
                statusBg = 'bg-emerald-50';
                statusText = 'text-emerald-700';
                statusBorder = 'border-emerald-200';
                Icon = CheckCircle2;
              } else if (order.status === 'served') {
                statusBg = 'bg-emerald-50';
                statusText = 'text-emerald-700';
                statusBorder = 'border-emerald-100';
                Icon = Check;
              } else if (order.status === 'billed') {
                statusBg = 'bg-purple-50';
                statusText = 'text-purple-700';
                statusBorder = 'border-purple-200';
                Icon = Banknote;
              }

              return (
                <article 
                  key={order.id} 
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden h-full"
                >
                  <div className="flex flex-col h-full">
                    {/* Card Header EXACTLY like desktop.html */}
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl ${statusBg} border ${statusBorder} flex flex-col md:flex-row items-center justify-center font-extrabold ${statusText} text-sm shrink-0`}>
                          <span className="text-[10px] md:hidden leading-none mb-0.5 uppercase tracking-wide opacity-80 block">TBL</span>
                          <span className="md:block">{order.tableNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm leading-tight truncate max-w-[120px]">
                              {(tables.find(t => t.id === order.tableId)?.name || `Table ${order.tableNumber}`)}
                            </h3>
                            <span className="text-xs text-slate-400 font-medium truncate max-w-[80px]">
                              #{order.displayId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                            {order.customerName || 'Walk-in'} {order.customerPhone && `(${order.customerPhone})`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBg} ${statusText} border ${statusBorder}`}>
                          <Icon className="w-3 h-3" strokeWidth={2.5} />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-medium mt-1">{time}</span>
                      </div>
                    </div>

                    {/* Items Table List EXACTLY like desktop.html */}
                    <div className="p-4 flex-1 flex flex-col min-h-[160px]">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-400 pb-2 border-b border-slate-100">
                        <span className="">Ordered Item</span>
                        <div className="flex gap-4">
                          <span className="w-6 text-center">Qty</span>
                          <span className="w-14 text-right">Price</span>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scroll divide-y divide-slate-100 text-xs flex-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between font-medium">
                            <span className="text-slate-800 truncate pr-2">{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="w-6 text-center text-slate-500 bg-slate-100 rounded text-[11px] font-semibold">{item.qty}</span>
                              <span className="w-14 text-right tabular-nums text-slate-900 font-semibold">₹{(item.price * item.qty).toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Kitchen Notes */}
                      {order.kitchenNotes && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2">
                          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                          <p className="text-xs font-semibold text-amber-800 leading-snug">{order.kitchenNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer with Total & CTA EXACTLY like desktop.html */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-2xl mt-auto shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500">Total Billable</span>
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">₹ {order.total.toFixed(0)}</span>
                      </div>
                      
                      {/* Action Buttons (Restored to correct classes based on state) */}
                      <div className="grid grid-cols-1 gap-2">
                        {order.status === 'pending' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'preparing') }} className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            Accept & Start Prep
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'prepared') }} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            Mark Prepared
                          </button>
                        )}
                        {order.status === 'prepared' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'served') }} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            Mark Served
                          </button>
                        )}
                        {order.status === 'served' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'billed') }} className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            Generate Bill
                          </button>
                        )}
                        {order.status === 'billed' && (
                          <button onClick={(e) => { e.stopPropagation(); setOrderToPay(order) }} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95">
                            <Banknote className="w-4 h-4" />
                            Pay Bill / Settle
                          </button>
                        )}
                        {(order.status === 'pending' || order.status === 'preparing') && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'cancelled') }} className="w-full py-1.5 px-4 bg-transparent text-slate-400 hover:text-red-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {orderToPay && (
        <PaymentModal 
          orderId={orderToPay.id}
          displayId={orderToPay.displayId}
          total={orderToPay.total}
          onClose={() => setOrderToPay(null)}
          onConfirmPayment={async (method) => {
            await handleMarkPaid(method);
          }}
        />
      )}
    </div>
  );
}
