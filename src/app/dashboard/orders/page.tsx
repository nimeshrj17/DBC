'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Search, Filter, MoreHorizontal, CheckCircle2, Clock, Check, ChefHat, QrCode, Banknote, X } from 'lucide-react';
import { useOrders, Order } from '@/lib/hooks/useOrders';
import { useTables } from '@/lib/hooks/useTables';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

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
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

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

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading orders...</p></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Orders History</h1>
          <p className="text-sm text-muted-foreground">Manage and view all recent orders.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search order ID or table..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden border border-border shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                const { time, date } = formatDate(order.createdAt);
                const itemsStr = order.items.map(i => `${i.qty}x ${i.name}`).join(', ');
                
                let isStale = false;
                if (order.status === 'prepared' && order.updatedAt) {
                  const updatedTime = typeof order.updatedAt?.toMillis === 'function' 
                    ? order.updatedAt.toMillis() 
                    : (order.updatedAt as any).seconds * 1000;
                  
                  if (Date.now() - updatedTime > 10 * 60 * 1000) {
                    isStale = true;
                  }
                }
                
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => setViewOrder(order)}
                    className={`transition-colors group cursor-pointer ${isStale ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-muted/30'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isStale ? 'text-red-700' : ''}`}>{order.displayId}</span>
                        {isStale && <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" title="Stale Order (>10m)"></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{time}</div>
                      <div className="text-xs text-muted-foreground">{date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-foreground">
                        Table {order.tableNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground max-w-xs truncate" title={itemsStr}>
                        {itemsStr}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-sm tabular-nums">₹ {order.total}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        {order.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'preparing') }} className="text-xs font-semibold px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors">Start Prep</button>
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'cancelled' as any) }} className="text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">Void</button>
                          </div>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'prepared') }} className="text-xs font-semibold px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">Mark Prepared</button>
                        )}
                        {order.status === 'prepared' && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(order, 'served') }} className="text-xs font-semibold px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">Mark Served</button>
                        )}
                        {order.status === 'served' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOrderToPay(order) }} 
                            className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {order.status === 'billed' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOrderToPay(order) }} 
                            className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-500 rounded-lg">Voided</span>
                        )}
                        <button className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors" title="More options">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Selection Modal */}
      {orderToPay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setOrderToPay(null)}>
          <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-xl font-bold">Select Payment Method</h2>
                <p className="text-sm text-muted-foreground mt-1">Order {orderToPay.displayId}</p>
              </div>
              <button onClick={() => setOrderToPay(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center p-6 bg-card border border-border rounded-2xl shadow-sm mb-6">
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Amount Due</p>
                <div className="text-4xl font-bold text-foreground tracking-tight">₹ {orderToPay.total.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleMarkPaid('cash')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <span className="font-bold">Cash</span>
                </button>
                <button 
                  onClick={() => handleMarkPaid('qr')}
                  className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="font-bold">QR / Online</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewOrder(null)}>
          <div className="bg-background rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
              <div>
                <h2 className="text-xl font-bold">Order Details</h2>
                <p className="text-sm text-muted-foreground mt-1">{viewOrder.displayId} • Table {viewOrder.tableNumber}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(viewOrder.status)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Order Time</div>
                  <div className="mt-1 font-medium">{formatDate(viewOrder.createdAt).time} - {formatDate(viewOrder.createdAt).date}</div>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border font-medium text-sm">Order Items</div>
                <ul className="divide-y divide-border">
                  {viewOrder.items.map((item, idx) => (
                    <li key={idx} className="p-4 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{item.qty}x</span>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">₹ {(item.price * item.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-muted/10 border-t border-border">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Subtotal</span>
                    <span>₹ {viewOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-3">
                    <span>Tax</span>
                    <span>₹ {viewOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                    <span>Total</span>
                    <span>₹ {viewOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
