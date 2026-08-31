'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, LayoutGrid, List, X, Plus, Minus, QrCode, Banknote } from 'lucide-react';
import { useTables, Table } from '@/lib/hooks/useTables';
import { MenuPickerModal } from '@/components/dashboard/MenuPickerModal';
import { toast } from 'sonner';
import { MenuItem } from '@/lib/hooks/useMenu';
import { useOrders, OrderItem, Order } from '@/lib/hooks/useOrders';
import { useInventory } from '@/lib/hooks/useInventory';
import { useSettings } from '@/lib/hooks/useSettings';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { doc, runTransaction, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import QRCodeGenerator from '@/components/dashboard/QRCodeGenerator';
import PaymentModal from '@/components/dashboard/PaymentModal';

const getStatusColor = (status: string) => {
  switch(status) {
    case 'empty': return 'bg-gray-100 text-gray-600';
    case 'occupied': return 'bg-blue-100/50 text-blue-600';
    case 'order_placed': return 'bg-primary/20 text-green-700';
    case 'preparing': return 'bg-orange-100 text-orange-600';
    case 'served': return 'bg-green-100 text-green-600';
    case 'awaiting_payment': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    empty: 'Empty',
    occupied: 'Occupied',
    order_placed: 'Order Placed',
    preparing: 'Preparing',
    prepared: 'Prepared',
    served: 'Served',
    awaiting_payment: 'Waiting Pay',
    billed: 'Billed',
    completed: 'Completed',
    cancelled: 'Voided'
  };
  return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(status)}`}>{map[status] || status}</span>;
};

const getTopBorderClass = (status: string) => {
  switch(status) {
    case 'empty': return 'border-t-transparent';
    case 'occupied': return 'border-t-secondary';
    case 'order_placed': return 'border-t-primary';
    case 'preparing': return 'border-t-orange-500';
    case 'served': return 'border-t-green-500';
    case 'awaiting_payment': return 'border-t-red-500';
    default: return 'border-t-transparent';
  }
};

const getIconColorClass = (status: string) => {
  switch(status) {
    case 'empty': return 'text-gray-400';
    case 'occupied': return 'text-secondary';
    case 'order_placed': return 'text-primary';
    case 'preparing': return 'text-orange-500';
    case 'served': return 'text-green-500';
    case 'awaiting_payment': return 'text-red-500';
    default: return 'text-gray-400';
  }
};

export default function DashboardPage() {
  const { tables, loading, updateTableStatus, addTable } = useTables();
  const { orders, loading: ordersLoading, updateOrder, updateOrderStatus, createOrder } = useOrders();
  const { settings, loading: settingsLoading } = useSettings();
  const { addOrUpdateCustomer } = useCustomers();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const selectedTable = tables.find(t => t.id === selectedTableId) || null;
  const activeOrders = selectedTable?.activeOrderIds 
    ? orders.filter(o => selectedTable.activeOrderIds.includes(o.id)) 
    : [];
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [draftOrders, setDraftOrders] = useState<Record<string, OrderItem[]>>({});
  
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [newTableSeats, setNewTableSeats] = useState<string>('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  const [assignCustomerModalOpen, setAssignCustomerModalOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');

  useEffect(() => {
    if (selectedTable && activeOrders.length === 0 && !draftOrders[selectedTable.id]) {
      setDraftOrders(prev => ({ ...prev, [selectedTable.id]: [] }));
    }
  }, [selectedTable, activeOrders.length, draftOrders]);

  const currentDraftItems = selectedTable ? (draftOrders[selectedTable.id] || []) : [];
  const allOrderItems = activeOrders.flatMap(o => o.items).concat(currentDraftItems);
  
  // Combine duplicate items for display
  const combinedItemsMap = new Map<string, OrderItem & { isDraft: boolean }>();
  
  // Process sent items
  activeOrders.flatMap(o => o.items).forEach(item => {
    if (combinedItemsMap.has(item.menuItemId)) {
      const existing = combinedItemsMap.get(item.menuItemId)!;
      combinedItemsMap.set(item.menuItemId, { ...existing, qty: existing.qty + item.qty });
    } else {
      combinedItemsMap.set(item.menuItemId, { ...item, isDraft: false });
    }
  });

  // Process draft items
  currentDraftItems.forEach(item => {
    if (combinedItemsMap.has(item.menuItemId)) {
      const existing = combinedItemsMap.get(item.menuItemId)!;
      combinedItemsMap.set(item.menuItemId, { ...existing, qty: existing.qty + item.qty, isDraft: true });
    } else {
      combinedItemsMap.set(item.menuItemId, { ...item, isDraft: true });
    }
  });

  const displayItems = Array.from(combinedItemsMap.values());

  const activeSubtotal = activeOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const activeTax = activeOrders.reduce((sum, o) => sum + o.tax, 0);
  const activeTotal = activeOrders.reduce((sum, o) => sum + o.total, 0);

  const draftSubtotal = currentDraftItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const draftTax = settings.taxEnabled ? draftSubtotal * (settings.taxPercentage / 100) : 0;
  const draftTotal = draftSubtotal + draftTax;

  const totalSubtotal = activeSubtotal + draftSubtotal;
  const totalTax = activeTax + draftTax;
  const grandTotal = activeTotal + draftTotal;

  const handleAddItem = async (menuItem: MenuItem) => {
    if (!selectedTable) return;
    
    setDraftOrders(prev => {
      const tableDraft = prev[selectedTable.id] || [];
      const existingItem = tableDraft.find(i => i.menuItemId === menuItem.id);
      
      if (existingItem) {
        return {
          ...prev,
          [selectedTable.id]: tableDraft.map(i => 
            i.menuItemId === menuItem.id ? { ...i, qty: i.qty + 1 } : i
          )
        };
      } else {
        return {
          ...prev,
          [selectedTable.id]: [...tableDraft, {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            category: menuItem.category,
            qty: 1
          }]
        };
      }
    });
  };

  const updateDraftItemQty = (menuItemId: string, delta: number) => {
    if (!selectedTable) return;
    
    setDraftOrders(prev => {
      const tableDraft = prev[selectedTable.id] || [];
      const updated = tableDraft.map(i => {
        if (i.menuItemId === menuItemId) {
          const newQty = Math.max(0, i.qty + delta);
          return { ...i, qty: newQty };
        }
        return i;
      }).filter(i => i.qty > 0);
      
      return { ...prev, [selectedTable.id]: updated };
    });
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable || currentDraftItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const retailItems = currentDraftItems.filter(i => i.category === 'Retail');
      const kitchenItems = currentDraftItems.filter(i => i.category !== 'Retail');
      
      const newOrderIds = [];
      
      if (kitchenItems.length > 0) {
        const sub = kitchenItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const t = settings.taxEnabled ? sub * (settings.taxPercentage / 100) : 0;
        const orderId = await createOrder({
          tableId: selectedTable.id,
          tableNumber: selectedTable.number,
          customerPhone: null,
          items: kitchenItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'preparing',
          paymentMethod: null,
          paymentStatus: 'unpaid'
        });
        newOrderIds.push(orderId);
      }
      
      if (retailItems.length > 0) {
        const sub = retailItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const t = settings.taxEnabled ? sub * (settings.taxPercentage / 100) : 0;
        const orderId = await createOrder({
          tableId: selectedTable.id,
          tableNumber: selectedTable.number,
          customerPhone: null,
          items: retailItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'served',
          paymentMethod: null,
          paymentStatus: 'unpaid'
        });
        newOrderIds.push(orderId);
      }
      
      const newActiveOrderIds = [...(selectedTable.activeOrderIds || []), ...newOrderIds];
      
      const tableStatus = kitchenItems.length > 0 ? 'preparing' : 'served';
      await updateTableStatus(selectedTable.id, tableStatus, newActiveOrderIds);
      
      // Update any existing pending active orders to preparing (or served if retail)
      await Promise.all(activeOrders.map(o => {
        if (o.status === 'pending') {
          // Generally existing orders in dashboard shouldn't be pending, but just in case
          return updateOrder(o.id, { status: 'preparing' });
        }
      }));
      
      setDraftOrders(prev => {
        const next = { ...prev };
        delete next[selectedTable.id];
        return next;
      });
      
    } catch (error) {
      console.error("Failed to send order to kitchen", error);
      toast.error(error instanceof Error ? error.message : "Failed to send order to kitchen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkServed = async () => {
    if (!selectedTable || activeOrders.length === 0) return;
    try {
      await Promise.all(activeOrders.map(o => updateOrderStatus(o.id, 'served')));
      await updateTableStatus(selectedTable.id, 'served', selectedTable.activeOrderIds);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAwaitingPayment = async () => {
    if (!selectedTable || activeOrders.length === 0) return;
    try {
      await Promise.all(activeOrders.map(o => updateOrderStatus(o.id, 'billed')));
      await updateTableStatus(selectedTable.id, 'awaiting_payment', selectedTable.activeOrderIds);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckout = async (method: 'cash' | 'qr') => {
    if (!selectedTable || activeOrders.length === 0) return;
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, 'tables', selectedTable.id);
        const tableSnap = await transaction.get(tableRef);
        
        if (!tableSnap.exists()) throw new Error("Table not found");
        
        const tableData = tableSnap.data();
        const currentActiveIds = tableData.activeOrderIds || [];
        
        // Find which orders were just checked out
        const checkoutOrderIds = activeOrders.map(o => o.id);
        if (checkoutOrderIds.length === 0) return;
        
        const masterOrderId = checkoutOrderIds[0];
        const masterOrderRef = doc(db, 'orders', masterOrderId);
        
        let mergedItems: OrderItem[] = [];
        let mergedSubtotal = 0;
        let mergedTotal = 0;
        let mergedTax = 0;
        
        activeOrders.forEach(o => {
          mergedSubtotal += o.subtotal;
          mergedTotal += o.total;
          mergedTax += o.tax;
          o.items.forEach(item => {
            const existing = mergedItems.find(i => i.menuItemId === item.menuItemId);
            if (existing) {
              existing.qty += item.qty;
            } else {
              mergedItems.push({...item});
            }
          });
        });
        
        transaction.update(masterOrderRef, {
          items: mergedItems,
          subtotal: mergedSubtotal,
          total: mergedTotal,
          tax: mergedTax,
          paymentMethod: method,
          paymentStatus: 'paid',
          status: 'completed'
        });
        
        for (let i = 1; i < checkoutOrderIds.length; i++) {
          const orderRef = doc(db, 'orders', checkoutOrderIds[i]);
          transaction.delete(orderRef);
        }
        
        // Remove only the checked out orders from the table's active list
        // (preserves any new orders added concurrently)
        const newActiveIds = currentActiveIds.filter((id: string) => !checkoutOrderIds.includes(id));
        
        transaction.update(tableRef, {
          activeOrderIds: newActiveIds,
          status: newActiveIds.length === 0 ? 'empty' : tableData.status
        });
      });
      
      setSelectedTableId(null);
      toast.success(`Payment of ₹${grandTotal.toFixed(2)} received via ${method === 'cash' ? 'Cash' : 'QR/Card'}. Table cleared successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment");
    }
  };

  const handleClearTable = async () => {
    if (!selectedTable) return;
    const hasUnpaid = activeOrders.some(o => o.paymentStatus !== 'paid');
    
    if (hasUnpaid) {
      if (!window.confirm("There are unpaid orders. Are you sure you want to clear the table?")) return;
      await Promise.all(activeOrders.map(o => updateOrder(o.id, { status: 'cancelled' })));
    }
    
    await updateTableStatus(selectedTable.id, 'empty', []);
    setDraftOrders(prev => {
      const next = {...prev};
      delete next[selectedTable.id];
      return next;
    });
    setSelectedTableId(null);
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum || !newTableSeats) return;
    
    setIsSubmittingTable(true);
    try {
      await addTable(Number(newTableNum), Number(newTableSeats));
      setIsAddTableOpen(false);
      setNewTableNum('');
      setNewTableSeats('');
      toast.success("Table added successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add table");
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const awaitingConfirmationOrders = orders.filter(o => o.paymentStatus === 'awaiting_confirmation');
  const awaitingGroups = Object.entries(
    awaitingConfirmationOrders.reduce((acc, o) => {
      if (!acc[o.tableId]) acc[o.tableId] = [];
      acc[o.tableId].push(o);
      return acc;
    }, {} as Record<string, typeof orders>)
  );

  const handleConfirmCustomerPayment = async (tableId: string, groupOrders: typeof orders) => {
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, 'tables', tableId);
        const tableSnap = await transaction.get(tableRef);
        
        if (!tableSnap.exists()) throw new Error("Table not found");
        
        const tableData = tableSnap.data();
        const currentActiveIds = tableData.activeOrderIds || [];
        
        const checkoutOrderIds = groupOrders.map(o => o.id);
        if (checkoutOrderIds.length === 0) return;
        
        const masterOrderId = checkoutOrderIds[0];
        const masterOrderRef = doc(db, 'orders', masterOrderId);
        
        let mergedItems: OrderItem[] = [];
        let mergedSubtotal = 0;
        let mergedTotal = 0;
        let mergedTax = 0;
        
        groupOrders.forEach(o => {
          mergedSubtotal += o.subtotal;
          mergedTotal += o.total;
          mergedTax += o.tax;
          o.items.forEach(item => {
            const existing = mergedItems.find(i => i.menuItemId === item.menuItemId);
            if (existing) {
              existing.qty += item.qty;
            } else {
              mergedItems.push({...item});
            }
          });
        });
        
        transaction.update(masterOrderRef, {
          items: mergedItems,
          subtotal: mergedSubtotal,
          total: mergedTotal,
          tax: mergedTax,
          paymentStatus: 'paid',
          status: 'completed'
        });
        
        for (let i = 1; i < checkoutOrderIds.length; i++) {
          const orderRef = doc(db, 'orders', checkoutOrderIds[i]);
          transaction.delete(orderRef);
        }
        
        const newActiveIds = currentActiveIds.filter((id: string) => !checkoutOrderIds.includes(id));
        
        transaction.update(tableRef, {
          activeOrderIds: newActiveIds,
          status: newActiveIds.length === 0 ? 'empty' : tableData.status
        });
      });
      toast.success("Payment confirmed!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to confirm payment");
    }
  };

  const handleRejectCustomerPayment = async (groupOrders: typeof orders) => {
    try {
      await Promise.all(groupOrders.map(o => updateOrder(o.id, { paymentStatus: 'unpaid' })));
      toast.success("Payment rejected. Customer must try again.");
    } catch (error) {
      toast.error("Failed to reject payment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Table Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of all tables at a glance.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="primary" 
            className="shadow-[0_0_15px_rgba(204,255,0,0.3)]"
            onClick={() => setIsAddTableOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Table
          </Button>
          
          <div className="flex bg-card border border-border rounded-xl p-1 shadow-sm">
            <button className="p-2 bg-blue-50 text-secondary rounded-lg shadow-sm"><LayoutGrid className="w-4 h-4" /></button>
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg"><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {awaitingGroups.length > 0 && (
        <div className="space-y-3">
          {awaitingGroups.map(([tableId, groupOrders]) => {
            const tableNum = tables.find(t => t.id === tableId)?.number || '?';
            const total = groupOrders.reduce((sum, o) => sum + o.total, 0);
            return (
              <div key={tableId} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-yellow-800">Payment Confirmation Required</h3>
                  <p className="text-sm text-yellow-700">Table {tableNum} has marked their bill of ₹{total.toFixed(2)} as paid via QR.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100" onClick={() => handleRejectCustomerPayment(groupOrders)}>Reject</Button>
                  <Button variant="primary" onClick={() => handleConfirmCustomerPayment(tableId, groupOrders)}>Confirm Receipt</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 overflow-y-auto pb-10">
        {tables.map((table) => {
          const tableOrders = table.activeOrderIds 
            ? orders.filter(o => table.activeOrderIds.includes(o.id)) 
            : [];
          const tableTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);
          
          return (
            <Card 
              key={table.id} 
              onClick={() => setSelectedTableId(table.id)}
              className={`cursor-pointer transition-all hover:shadow-md border-t-[3px] rounded-2xl ${getTopBorderClass(table.status)}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5">
                <CardTitle className="text-lg font-bold">Table {table.number}</CardTitle>
                <Users className={`w-6 h-6 ${getIconColorClass(table.status)}`} />
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-6">
                  {table.seats} Seats
                  {tableOrders.length > 0 && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{tableOrders.length} tickets</span>}
                </div>
                <div className="flex justify-between items-end mt-2 h-8">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor(table.status)}`}>
                    {getStatusBadge(table.status)}
                  </span>
                  
                  {tableTotal > 0 && (
                    <span className="text-sm font-bold">₹ {tableTotal.toFixed(2)}</span>
                  )}
                </div>
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <QRCodeGenerator tableId={table.id} tableNumber={table.number} />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {tables.length === 0 && (
          <div className="col-span-full py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-auto text-xs font-medium bg-card border border-border py-4 px-6 rounded-2xl mx-auto w-fit shadow-sm sticky bottom-0">
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 mr-2"></span> Empty</div>
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-secondary mr-2"></span> Occupied</div>
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-primary mr-2"></span> Order Placed</div>
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2"></span> Preparing</div>
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span> Served</div>
        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span> Awaiting Payment</div>
      </div>

      {/* Side Panel overlay */}
      {selectedTable && (
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-card shadow-2xl border-l border-border flex flex-col transform transition-transform z-50">
          <div className="p-6 flex items-center justify-between border-b border-border">
            <div>
              <h2 className="text-xl font-bold">Table {selectedTable.number}</h2>
              <p className="text-sm text-muted-foreground">{selectedTable.seats} Seats</p>
              {selectedTable.customerName && (
                <p className="text-xs font-bold text-primary mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-full">
                  Customer: {selectedTable.customerName}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusColor(selectedTable.status)}`}>
                {getStatusBadge(selectedTable.status)}
              </span>
              <button onClick={() => setSelectedTableId(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto bg-background/50">
            {selectedTable.status === 'empty' ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-2">
                  <LayoutGrid className="w-8 h-8 opacity-50" />
                </div>
                <p>Table is currently empty.</p>
                <Button variant="primary" className="w-full max-w-[250px]" onClick={() => setAssignCustomerModalOpen(true)}>Mark Occupied & Add Customer</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold mb-4">Current Order</h3>
                  
                  {displayItems.map((item) => (
                    <div key={item.menuItemId} className={`flex items-center justify-between p-3 bg-card border rounded-xl ${item.isDraft ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.isDraft && <span className="text-[10px] bg-primary/20 text-primary-foreground font-bold px-1.5 rounded text-green-700">NEW</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">₹ {item.price}</p>
                      </div>
                      
                      {item.isDraft ? (
                        <div className="flex items-center space-x-3 bg-background rounded-lg p-1 border border-border shadow-sm">
                          <button onClick={() => updateDraftItemQty(item.menuItemId, -1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Minus className="w-3 h-3" /></button>
                          <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateDraftItemQty(item.menuItemId, 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className="font-medium text-sm px-3">{item.qty}</span>
                      )}
                      
                      <div className="font-bold text-sm w-12 text-right">₹ {item.price * item.qty}</div>
                    </div>
                  ))}

                  {displayItems.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                      No items added yet.
                    </div>
                  )}
                </div>

                {selectedTable.status !== 'awaiting_payment' && (
                  <Button variant="outline" fullWidth className="border-dashed py-6 flex flex-col items-center gap-2" onClick={() => setIsMenuOpen(true)}>
                    <Plus className="w-5 h-5 text-secondary" />
                    <span className="text-secondary font-medium">Add items from menu</span>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {selectedTable.status !== 'empty' && (
            <div className="p-6 border-t border-border bg-card shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹ {totalSubtotal.toFixed(2)}</span>
              </div>
                <div className="flex justify-between text-muted-foreground mb-3 font-medium">
                  <span>Tax {settings.taxEnabled ? `(${settings.taxPercentage}%)` : '(Disabled)'}</span>
                  <span>₹ {totalTax.toFixed(2)}</span>
                </div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold">Total Tab</span>
                <span className="font-bold text-xl">₹ {grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                {currentDraftItems.length > 0 && (
                  <Button 
                    variant="primary" 
                    className="col-span-2 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                    onClick={handleSendToKitchen}
                  >
                    Send New Ticket to Kitchen
                  </Button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'preparing' && (
                  <Button variant="primary" className="col-span-2" onClick={handleMarkServed}>
                    Mark All as Served
                  </Button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'served' && (
                  <Button variant="primary" className="col-span-2" onClick={handleMarkAwaitingPayment}>
                    Print Final Bill
                  </Button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'awaiting_payment' && (
                  <Button variant="primary" className="col-span-2 text-base h-12 flex items-center justify-center font-bold" onClick={() => setIsPaymentModalOpen(true)}>
                    <Banknote className="w-5 h-5 mr-2" /> Pay Bill
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                fullWidth 
                onClick={handleClearTable}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                Clear Table
              </Button>
            </div>
          )}
        </div>
      )}

      <MenuPickerModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onAddItem={handleAddItem} 
        currentDraftItems={currentDraftItems}
      />
      
      {isAddTableOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-xl font-bold">Add New Table</h2>
              <button onClick={() => setIsAddTableOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTableSubmit} className="p-6 space-y-4 bg-background">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Number</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. 13"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Seats</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newTableSeats}
                    onChange={(e) => setNewTableSeats(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. 4"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsAddTableOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmittingTable}>
                  {isSubmittingTable ? 'Adding...' : 'Add Table'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedTable && (
        <PaymentModal 
          orderId={selectedTable.id}
          displayId={`Table ${selectedTable.number}`}
          total={allOrderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={handleCheckout}
        />
      )}

      {/* Assign Customer Modal */}
      {assignCustomerModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Assign Customer</h3>
            <p className="text-sm text-muted-foreground mb-6">Enter details for Table {selectedTable.number}</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (cName && cPhone) {
                try {
                  await addOrUpdateCustomer(cPhone, cName);
                  await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
                  // also update customer details in table
                  await runTransaction(db, async (t) => {
                    t.update(doc(db, 'tables', selectedTable.id), {
                      customerId: cPhone,
                      customerName: cName,
                      customerPhone: cPhone,
                      status: 'occupied'
                    });
                  });
                  setAssignCustomerModalOpen(false);
                  setCName('');
                  setCPhone('');
                } catch (err) {
                  console.error(err);
                }
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input 
                  type="text" 
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={cPhone}
                  onChange={e => setCPhone(e.target.value)}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 py-6" onClick={() => setAssignCustomerModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" className="flex-1 py-6">Assign & Mark Occupied</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
