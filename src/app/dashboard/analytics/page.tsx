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
    <div className="space-y-6 max-w-7xl mx-auto pb-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Revenue & Analytics</h1>
          <p className="text-sm text-muted-foreground">Track completed bills, inventory expenses, and net profit.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-green-700">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Gross Revenue</p>
              <h2 className="text-2xl font-bold text-foreground">₹ {totalRevenue.toFixed(2)}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses (Inventory)</p>
              <h2 className="text-2xl font-bold text-red-600">₹ {totalExpenses.toFixed(2)}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${netProfit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {netProfit >= 0 ? '+' : ''}{profitMargin.toFixed(1)}% Margin
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Net Profit</p>
              <h2 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹ {netProfit.toFixed(2)}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-6 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Completed Orders</p>
              <h2 className="text-2xl font-bold">{completedOrders.length}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Orders Table */}
      <Card className="rounded-2xl border border-border shadow-sm mt-6 mb-12">
        <div className="p-6 border-b border-border bg-muted/20">
          <h3 className="font-bold text-lg">Completed Bills Ledger</h3>
          <p className="text-sm text-muted-foreground">A detailed list of all paid orders contributing to gross revenue.</p>
        </div>
        <div className="w-full">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-muted/95 backdrop-blur z-10 shadow-sm">
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtotal</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tax (5%)</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedOrders.map((order) => {
                const { time, date } = formatDate(order.createdAt);
                
                return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setViewOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-sm">{order.displayId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{time}</div>
                      <div className="text-xs text-muted-foreground">{date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 uppercase">
                        {order.paymentMethod || 'Paid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                      ₹ {order.subtotal?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                      ₹ {order.tax?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-sm text-green-700">₹ {order.total.toFixed(2)}</span>
                    </td>
                  </tr>
                );
              })}
              {completedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No completed bills yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                  <div className="mt-1">
                    <span className="flex items-center w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Completed
                    </span>
                  </div>
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
