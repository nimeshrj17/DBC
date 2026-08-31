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
          const activeOrders = tableData.activeOrderIds || [];
          const newActiveOrders = activeOrders.filter((id: string) => id !== orderToPay.id);
          
          transaction.update(tableRef, {
            activeOrderIds: newActiveOrders,
            status: newActiveOrders.length === 0 ? 'empty' : tableData.status
          });
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
    
    const searchLower = searchQuery.toLowerCase();
    return order.displayId.toLowerCase().includes(searchLower) || 
           `Table ${order.tableNumber}`.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col w-full h-full pb-6">
      {/* Order Grid */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Orders</h1>
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by ID or table..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <select className="bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option>All</option>
              <option>Pending</option>
              <option>Preparing</option>
            </select>
          </div>
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
              {filteredOrders.map((order) => {
                const { time, date } = formatDate(order.createdAt);
                
                let isStale = false;
                if (order.status === 'prepared' && order.updatedAt) {
                  const updatedTime = typeof order.updatedAt?.toMillis === 'function' 
                    ? order.updatedAt.toMillis() 
                    : (order.updatedAt as any).seconds * 1000;
                  if (Date.now() - updatedTime > 10 * 60 * 1000) isStale = true;
                }

                return (
                  <Card 
                    key={order.id} 
                    className="p-4 rounded-2xl border border-border transition-all flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                          T{order.tableNumber}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">Table {order.tableNumber}</h3>
                          <p className="text-xs text-muted-foreground">{order.displayId}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(order.status)}
                        <span className="text-[10px] text-muted-foreground font-medium mt-1">{time}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-3">{date}</div>
                    
                    <div className="border-t border-border pt-3 mb-3 flex-1 flex flex-col">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2 text-xs font-semibold text-muted-foreground">
                        <span>Items</span>
                        <span className="px-2">Qty</span>
                        <span>Price</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto max-h-[150px] pr-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-2 text-sm items-center">
                            <span className="truncate pr-2 font-medium">{item.name}</span>
                            <span className="px-2 text-muted-foreground">{item.qty}</span>
                            <span className="font-medium">₹{(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border mb-4 mt-auto">
                      <span className="font-bold text-sm">Total</span>
                      <span className="font-bold text-base">₹{order.total.toFixed(2)}</span>
                    </div>
                    
                    <div>
                      {order.status === 'pending' && (
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'preparing') }} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                          Start Prep
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'prepared') }} className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                          Mark Prepared
                        </button>
                      )}
                      {order.status === 'prepared' && (
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'served') }} className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                          Serve
                        </button>
                      )}
                      {(order.status === 'served' || order.status === 'billed') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOrderToPay(order) }} 
                          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                          Pay Bill
                        </button>
                      )}
                      {order.status === 'cancelled' && (
                        <button disabled className="w-full py-2.5 bg-gray-200 text-gray-500 text-sm font-bold rounded-xl cursor-not-allowed">
                          Voided
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Selection Modal */}
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
