'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, LayoutGrid, Trash2, List, X, Plus, Minus, QrCode, Banknote } from 'lucide-react';
import { useTables, Table } from '@/lib/hooks/useTables';
import { MenuPickerModal } from '@/components/dashboard/MenuPickerModal';
import { toast } from 'sonner';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
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


const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen }: any) => {
  const tableOrders = table.activeOrderIds 
    ? orders.filter((o: any) => table.activeOrderIds.includes(o.id)) 
    : [];
  const tableTotal = tableOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const itemsCount = tableOrders.reduce((sum: number, o: any) => sum + o.items.length, 0);
  const firstItems = tableOrders.flatMap((o: any) => o.items).slice(0, 3).map((i: any) => `${i.qty}x ${i.name}`).join(', ');

  const isVacant = table.status === 'empty';
  const isAwaitingPayment = table.status === 'awaiting_payment';
  
  let borderColor = 'border-slate-200/90';
  if (isAwaitingPayment) borderColor = 'border-amber-400 border-2';
  else if (!isVacant) borderColor = 'border-blue-500 border-2';

  return (
    <div onClick={() => setSelectedTableId(table.id)} className={`bg-white rounded-2xl ${borderColor} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[180px] md:min-h-[250px]`}>
      <div className="p-3.5 md:p-5 md:pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base md:text-lg font-black md:font-bold text-slate-900 leading-none md:leading-normal">{table.name || `Table ${table.number}`}</h4>
              <span className="px-2 py-0.5 text-[10px] md:text-[11px] font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase md:normal-case">Table {table.number}</span>
            </div>
            <span className="text-[11px] md:text-xs font-semibold md:font-medium text-slate-600 md:text-slate-400 mt-1 bg-slate-100 md:bg-transparent px-2 py-0.5 md:p-0 rounded-md md:rounded-none inline-block md:block">Zone: {table.section || 'Main'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>{table.seats} Seats</span>
          </div>
        </div>

        {isVacant ? (
          <div className="my-5 py-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center bg-slate-50/50">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Empty / Ready
            </span>
            <p className="text-xs text-slate-400">Ready for walk-in or booking</p>
          </div>
        ) : isAwaitingPayment ? (
          <>
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-amber-900">Bill Requested</span>
                <span className="font-extrabold text-amber-950 text-sm">₹ {tableTotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-amber-700 truncate">Payment Pending</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Settle Payment
              </span>
              <span className="text-slate-400 font-medium">Occupied</span>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-blue-900">{itemsCount > 0 ? `${itemsCount} items` : 'No items yet'}</span>
                <span className="font-bold text-blue-700">₹ {tableTotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-blue-600/90 truncate">{firstItems || '...'}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> {getStatusBadge(table.status)}
              </span>
              <span className="text-slate-400 font-medium">Occupied</span>
            </div>
          </>
        )}
      </div>

      <div className="p-3.5 md:p-4 pt-0 space-y-2 mt-auto">
        {isVacant ? (
          <>
            <button className="w-full py-2 px-3 rounded-xl bg-[#B4D318] hover:bg-[#9FBD10] text-[#111315] font-bold text-xs tracking-wide shadow-sm transition" type="button" onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}>
              + Assign Guests / Order
            </button>
            <QRCodeGenerator 
              tableId={table.id} 
              tableNumber={table.number} 
              tableName={table.name}
              buttonClassName="w-full py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              buttonContent={
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>Download QR PDF</span>
                </>
              }
            />
          </>
        ) : isAwaitingPayment ? (
          <>
            <button className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#111315] font-bold text-xs tracking-wide shadow-sm transition" type="button" onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}>
              Settle &amp; Print Invoice
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition" type="button" onClick={(e) => { e.stopPropagation(); onClearTable(table.id); }}>
                Clear Table
              </button>
              <button className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition" type="button" onClick={(e) => e.stopPropagation()}>
                QR Code
              </button>
            </div>
          </>
        ) : (
          <>
            <QRCodeGenerator 
              tableId={table.id} 
              tableNumber={table.number} 
              tableName={table.name}
              buttonClassName="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              buttonContent={
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>Download QR PDF</span>
                </>
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <button className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition" type="button" onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }}>
                Add Item
              </button>
              <button className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs border border-rose-200/50 transition" type="button" onClick={(e) => { e.stopPropagation(); onClearTable(table.id); }}>
                Clear Table
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default function DashboardPage() {
  const { menuItems } = useMenu();
  const { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable } = useTables();
  const { orders, loading: ordersLoading, updateOrder, updateOrderStatus, createOrder, removeSentItemTransaction } = useOrders();
  const { settings, loading: settingsLoading } = useSettings();
  const { addOrUpdateCustomer, customers } = useCustomers();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [ticketNote, setTicketNote] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clearTablePrompt, setClearTablePrompt] = useState<{tableId: string, hasUnpaid: boolean} | null>(null);
  
  const selectedTable = tables.find(t => t.id === selectedTableId) || null;
  const activeOrders = selectedTable?.activeOrderIds 
    ? orders.filter(o => selectedTable.activeOrderIds.includes(o.id)) 
    : [];
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [draftOrders, setDraftOrders] = useState<Record<string, OrderItem[]>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeSection, setActiveSection] = useState('tables');
  const [activeZone, setActiveZone] = useState('All');
  
  const [newTableNum, setNewTableNum] = useState<string>('');
  const [newTableName, setNewTableName] = useState<string>('');
  const [newTableSection, setNewTableSection] = useState<string>('Inner Hall');
  const [newTableSeats, setNewTableSeats] = useState<string>('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  const [assignCustomerModalOpen, setAssignCustomerModalOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');


  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !transferTargetId || isTransferring) return;
    
    setIsTransferring(true);
    try {
      await transferTable(selectedTable.id, transferTargetId, selectedTable.activeOrderIds || []);
      toast.success("Table transferred successfully");
      setIsTransferModalOpen(false);
      setSelectedTableId(transferTargetId);
      setTransferTargetId('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to transfer table");
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (selectedTable && activeOrders.length === 0 && !draftOrders[selectedTable.id]) {
      setDraftOrders(prev => ({ ...prev, [selectedTable.id]: [] }));
    }
  }, [selectedTable, activeOrders.length, draftOrders]);

  
  const handleRemoveSentItem = async (menuItemId: string) => {
    if (!selectedTable || isRemoving) return;
    
    // Find the order that has this item. Prefer newest orders first.
    const tblOrders = orders.filter(o => selectedTable.activeOrderIds?.includes(o.id)).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    const targetOrder = tblOrders.find(o => o.items.some(i => i.menuItemId === menuItemId));
    
    if (!targetOrder) return;
    
    setIsRemoving(true);
    try {
      await removeSentItemTransaction(targetOrder.id, menuItemId, settings.taxEnabled ? settings.taxPercentage : 0);
      toast.success("Item quantity reduced");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reduce item quantity");
    } finally {
      setIsRemoving(false);
    }
  };

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
            isRetail: menuItem.isRetail || false,
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
      const retailItems = currentDraftItems.filter(i => i.isRetail || i.category === 'Retail');
      const kitchenItems = currentDraftItems.filter(i => !i.isRetail && i.category !== 'Retail');
      
      const newOrderIds = [];
      
      if (kitchenItems.length > 0) {
        const sub = kitchenItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const t = settings.taxEnabled ? sub * (settings.taxPercentage / 100) : 0;
        const orderId = await createOrder({
          tableId: selectedTable.id,
          tableNumber: selectedTable.number,
          customerPhone: selectedTable.customerPhone || null,
          customerName: selectedTable.customerName || null,
          items: kitchenItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'preparing',
          paymentMethod: null,
          paymentStatus: 'unpaid',
          kitchenNotes: ticketNote || undefined
        });
        newOrderIds.push(orderId);
      }
      
      if (retailItems.length > 0) {
        const sub = retailItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const t = settings.taxEnabled ? sub * (settings.taxPercentage / 100) : 0;
        const orderId = await createOrder({
          tableId: selectedTable.id,
          tableNumber: selectedTable.number,
          customerPhone: selectedTable.customerPhone || null,
          customerName: selectedTable.customerName || null,
          items: retailItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'served',
          paymentMethod: null,
          paymentStatus: 'unpaid',
          kitchenNotes: ticketNote || undefined
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
          paymentMethod: method || 'cash',
          paymentStatus: 'paid',
          status: 'completed'
        });
        
        for (let i = 1; i < checkoutOrderIds.length; i++) {
          const orderRef = doc(db, 'orders', checkoutOrderIds[i]);
          transaction.delete(orderRef);
        }
        
        // Replace checked out orders with the single consolidated master order
        const newActiveIds = currentActiveIds.filter((id: string) => !checkoutOrderIds.includes(id));
        // Do NOT add masterOrderId to newActiveIds since it's fully paid and completed.
        
        // Update customer if exists
        if (tableData.customerId) {
          const customerRef = doc(db, 'customers', tableData.customerId);
          transaction.update(customerRef, {
            totalOrders: increment(1),
            totalRevenue: increment(mergedTotal)
          });
        }
        
        const isTableEmpty = newActiveIds.length === 0;
        
        transaction.update(tableRef, {
          activeOrderIds: newActiveIds,
          status: isTableEmpty ? 'empty' : 'occupied',
          ...(isTableEmpty ? {
            customerId: null,
            customerName: null,
            customerPhone: null,
            currentSessionId: null
          } : {})
        });
      });
      
      setSelectedTableId(null);
      toast.success(`Payment of ₹${grandTotal.toFixed(2)} received via ${method === 'cash' ? 'Cash' : 'QR/Card'}. Table cleared successfully!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment");
    }
  };

  const handleClearTable = (targetTableId?: string) => {
    const tid = typeof targetTableId === 'string' ? targetTableId : (selectedTable?.id);
    if (!tid) return;
    
    // Check if the table has unpaid orders
    const targetTbl = tables.find(t => t.id === tid);
    let hasUnpaid = false;
    if (targetTbl && targetTbl.activeOrderIds) {
      const tblOrders = orders.filter(o => targetTbl.activeOrderIds.includes(o.id));
      hasUnpaid = tblOrders.some(o => o.paymentStatus !== 'paid');
    }
    
    setClearTablePrompt({ tableId: tid, hasUnpaid });
  };

  const confirmClearTable = async (forceClear: boolean = false) => {
    setIsClearing(true);
    try {
    if (!clearTablePrompt) return;
    const { tableId, hasUnpaid } = clearTablePrompt;
    
    if (hasUnpaid && forceClear) {
      const targetTbl = tables.find(t => t.id === tableId);
      if (targetTbl && targetTbl.activeOrderIds) {
        const tblOrders = orders.filter(o => targetTbl.activeOrderIds.includes(o.id));
        await Promise.all(tblOrders.map(o => updateOrder(o.id, { status: 'cancelled' })));
      }
    }
    
    await updateTableStatus(tableId, 'empty', []);
    setDraftOrders(prev => {
      const next = {...prev};
      delete next[tableId];
      return next;
    });
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
    setClearTablePrompt(null);
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum || !newTableSeats) return;
    
    setIsSubmittingTable(true);
    try {
      if (editingTableId) {
        await updateTableDetails(editingTableId, newTableName, newTableSection, Number(newTableNum), Number(newTableSeats));
        toast.success("Table updated successfully");
      } else {
        await addTable(Number(newTableNum), Number(newTableSeats), newTableName, newTableSection);
        toast.success("Table added successfully");
      }
      setIsAddTableOpen(false);
      setEditingTableId(null);
      setNewTableNum('');
      setNewTableName('');
      setNewTableSection('Inner Hall');
      setNewTableSeats('');
    } catch (error) {
      console.error(error);
      toast.error(editingTableId ? "Failed to update table" : "Failed to add table");
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
        newActiveIds.push(masterOrderId);
        
        // Update customer if exists
        if (tableData.customerId) {
          const customerRef = doc(db, 'customers', tableData.customerId);
          transaction.update(customerRef, {
            totalOrders: increment(1),
            totalRevenue: increment(mergedTotal)
          });
        }
        
        transaction.update(tableRef, {
          activeOrderIds: newActiveIds,
          status: 'occupied'
        });
      });
      toast.success("Payment confirmed!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to confirm payment");
    }
  };

  const handleQuickAssign = async () => {
    setIsAssigning(true);
    if (!selectedTable) return;
    const finalName = 'Assigned by Admin';
    const finalPhone = '9999999999';
    try {
      await addOrUpdateCustomer(finalPhone, finalName);
      await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
      await runTransaction(db, async (t) => {
        t.update(doc(db, 'tables', selectedTable.id), {
          customerId: finalPhone,
          customerName: finalName,
          customerPhone: finalPhone,
          status: 'occupied'
        });
      });
      toast.success("Table marked as occupied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    } finally {
      setIsAssigning(false);
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
    <>
      {/* Desktop Controls */}
      <section className="hidden md:block px-8 py-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Table Dashboard</h3>
            <p className="text-xs text-slate-500">Real-time occupancy, guest count, and instant billing controls.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <input className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:ring-2 focus:ring-[#D9F927] focus:border-[#D9F927] outline-none" placeholder="Search table # or guest..." type="text"/>
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button onClick={() => setIsAddTableOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold text-sm shadow-sm transition" type="button">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`} title="Grid View" type="button">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`} title="List View" type="button">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="inline-flex gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            <button onClick={() => setActiveZone('All')} className={`px-3.5 py-1.5 rounded-lg transition ${activeZone === 'All' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>All Zones ({tables.length})</button>
            {Array.from(new Set(tables.map(t => String(t.section || 'Main Hall')))).map(z => (
              <button key={z} onClick={() => setActiveZone(z)} className={`px-3.5 py-1.5 rounded-lg transition ${activeZone === z ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{z} ({tables.filter(t => (t.section || 'Main Hall') === z).length})</button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Occupied ({tables.filter(t => t.status !== 'empty' && t.status !== 'awaiting_payment').length})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Bill Requested ({tables.filter(t => t.status === 'awaiting_payment').length})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available ({tables.filter(t => t.status === 'empty').length})
            </span>
          </div>
        </div>
      </section>

      {/* Mobile Controls (from mobile_dashboard.html) */}
      <section className="md:hidden px-5 pt-5 pb-2" data-purpose="section-action-header">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Table Dashboard</h2>
            <p className="text-xs text-slate-400 font-medium">Overview of all dining tables at a glance</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsAddTableOpen(true)} className="bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-white text-slate-900 rounded-lg shadow-xs' : 'text-slate-400 hover:text-slate-600 rounded-lg'}`} title="Grid View">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z"></path>
                </svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 ${viewMode === 'list' ? 'bg-white text-slate-900 rounded-lg shadow-xs' : 'text-slate-400 hover:text-slate-600 rounded-lg'}`} title="List View">
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 -mx-5 px-5" data-purpose="zone-filters">
          <button onClick={() => setActiveZone('All')} className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap shadow-xs transition-colors ${activeZone === 'All' ? 'font-semibold bg-slate-900 text-white' : 'font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All ({tables.length})
          </button>
          <button onClick={() => setActiveZone('Active')} className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap shadow-xs transition-colors flex items-center space-x-1.5 ${activeZone === 'Active' ? 'font-semibold bg-slate-900 text-white' : 'font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Active ({tables.filter(t => t.status !== 'empty').length})</span>
          </button>
          {Array.from(new Set(tables.map(t => String(t.section || 'Main Hall')))).map(z => (
            <button key={z} onClick={() => setActiveZone(z)} className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap shadow-xs transition-colors ${activeZone === z ? 'font-semibold bg-slate-900 text-white' : 'font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {z} ({tables.filter(t => (t.section || 'Main Hall') === z).length})
            </button>
          ))}
        </div>
      </section>

      {/* Tables Display Section */}
      <div className="px-5 md:px-8 pb-12 space-y-6 md:space-y-9 mt-2 md:mt-0">
        {(() => {
          const activeTables = tables.filter(t => t.status !== 'empty' && (activeZone === 'All' || activeZone === 'Active' || (t.section || 'Main Hall') === activeZone)).sort((a, b) => {
            const getPriority = (status: string) => {
              switch(status) {
                case 'awaiting_payment': return 1;
                case 'order_placed': return 2;
                case 'preparing': return 3;
                case 'served': return 4;
                case 'occupied': return 5;
                default: return 6;
              }
            };
            return getPriority(a.status) - getPriority(b.status) || (a.number - b.number);
          });
          
          if (activeTables.length === 0) return null;
          return (
            <section>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
                <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">Active &amp; Dining Tables</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">{activeTables.length} In Service</span>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 md:gap-6" : "flex flex-col gap-3 md:gap-4"}>
                {activeTables.map((table) => (
                  <NewTableCard 
                    key={table.id} 
                    table={table} 
                    orders={orders} 
                    setSelectedTableId={setSelectedTableId} 
                    onClearTable={handleClearTable}
                    setIsAddTableOpen={setIsAddTableOpen}
                  />
                ))}
              </div>
            </section>
          );
        })()}

        {Array.from(new Set(tables.filter(t => t.status === 'empty' && (activeZone === 'All' || activeZone === 'Active' || (t.section || 'Main Hall') === activeZone)).map(t => String(t.section || 'Main Hall')))).map(section => (
          <section key={section}>
            <div className="flex items-center justify-between mb-3 md:mb-4 mt-6 md:mt-8">
              <div className="flex items-center gap-2 md:gap-2.5">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></span>
                <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">{section}</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {tables.filter(t => t.status === 'empty' && (t.section || 'Main Hall') === section).length} Available
                </span>
              </div>
            </div>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 md:gap-6" : "flex flex-col gap-3 md:gap-4"}>
              {tables
                .filter(t => t.status === 'empty' && (t.section || 'Main Hall') === section)
                .sort((a, b) => a.number - b.number)
                .map((table) => (
                <NewTableCard 
                  key={table.id} 
                  table={table} 
                  orders={orders} 
                  setSelectedTableId={setSelectedTableId} 
                  onClearTable={handleClearTable}
                  setIsAddTableOpen={setIsAddTableOpen}
                />
              ))}
              {/* Quick Add Table Card Prompt */}
              <div onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 md:p-6 text-center hover:border-[#B4D318] hover:bg-lime-50/20 transition cursor-pointer min-h-[160px] md:min-h-[250px] group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-100 group-hover:bg-[#B4D318] flex items-center justify-center text-slate-500 group-hover:text-[#111315] transition shadow-sm mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <h5 className="text-[11px] md:text-sm font-bold text-slate-800">Add New Table</h5>
              </div>
            </div>
          </section>
        ))}
        {tables.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-muted-foreground mb-4">No tables found.</p>
            <Button onClick={() => setIsAddTableOpen(true)}>Create your first table</Button>
          </div>
        )}
      </div>

      {/* Side Panel overlay */}

      {selectedTable && (
        <>
          {/* Mobile Backdrop */}
          <div className="md:hidden fixed inset-0 bg-black/40 z-[40] backdrop-blur-[2px]" onClick={() => setSelectedTableId(null)}></div>
          
          <aside className="fixed md:absolute inset-x-0 bottom-0 md:inset-y-0 md:right-0 h-[85vh] md:h-full w-full md:w-[430px] max-w-full flex-shrink-0 bg-white md:border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 z-[50] slideover-shadow rounded-t-[28px] md:rounded-none" data-purpose="table-detail-drawer">
            {/* Drag Handle for Mobile */}
            <div className="md:hidden w-full flex justify-center pt-2.5 pb-1 cursor-grab">
              <div className="w-10 h-1.5 rounded-full bg-slate-300"></div>
            </div>
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedTable.name || `Table ${selectedTable.number}`}</h3>
                  <button 
                    onClick={() => {
                      setEditingTableId(selectedTable.id);
                      setNewTableNum(selectedTable.number.toString());
                      setNewTableSeats(selectedTable.seats.toString());
                      setNewTableName(selectedTable.name || '');
                      setNewTableSection(selectedTable.section || 'Inner Hall');
                      setIsAddTableOpen(true);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100" title="Edit Table Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{selectedTable.seats} Seats • Zone {selectedTable.section || 'Main Hall'}</p>
                {selectedTable.status !== 'empty' && selectedTable.customerName && (
                  <div className="mt-3.5 flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-medium">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span>Customer: <strong className="font-bold">{selectedTable.customerName}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedTable.status)}`}>
                {getStatusBadge(selectedTable.status)}
              </span>
              <button onClick={() => setSelectedTableId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Close Drawer">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedTable.status === 'empty' ? (
              <div className="h-full flex flex-col justify-between">
                {/* Drawer Body: Empty State Illustration & Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  {/* Empty State Visual Icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <LayoutGrid className="w-10 h-10" />
                    </div>
                  </div>
                  {/* Empty State Text */}
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">Table is currently empty.</h4>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">
                    No guests seated or active tab assigned to this table right now.
                  </p>
                  
                  {/* Quick Summary Mini-box */}
                  <div className="w-full mt-8 bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Assigned Server</span>
                      <span className="text-slate-700 font-semibold">Unassigned</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Last Cleaned</span>
                      <span className="text-slate-700 font-semibold">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">QR Menu Code</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> Active
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
                  {/* Primary Action CTA */}
                  <button disabled={isAssigning} onClick={handleQuickAssign} className="w-full py-3.5 px-5 bg-[#D9F927] hover:bg-[#c9e81f] text-neutral-900 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256"><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7L45.79,130.17a8,8,0,0,0,5,13.66l57.6,21.61L93.75,238.76a8,8,0,0,0,13.69,7l108.35-119.6A8,8,0,0,0,215.79,118.17Z"></path></svg>
                    <span>{isAssigning ? 'Assigning...' : 'Quick Assign (Skip Details)'}</span>
                  </button>
                  {/* Secondary Action CTA */}
                  <button disabled={isAssigning} onClick={() => setAssignCustomerModalOpen(true)} className="w-full py-3.5 px-5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Add Customer Details</span>
                  </button>
                  
                  {/* Auxiliary Action Links */}
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <QRCodeGenerator 
                      tableId={selectedTable.id} 
                      tableNumber={selectedTable.number} 
                      tableName={selectedTable.name}
                      buttonClassName="hover:text-slate-900 flex items-center gap-1 transition-colors disabled:opacity-50"
                      buttonContent={
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                          <span>Print QR Card</span>
                        </>
                      }
                    />
                    <button className="hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                      <span>Reserve Table</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Current Order Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Current Order</h4>
                    <span className="text-xs text-slate-400">Order ID: #{selectedTable.activeOrderIds?.[0]?.slice(-6) || 'New'}</span>
                  </div>

                  {displayItems.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No items added yet.</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[220px]">Select chai, snacks, or bakery specials to begin this order.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayItems.map((item) => (
                        <div key={item.menuItemId} className={`flex items-center justify-between p-3 bg-white border rounded-xl shadow-xs transition-colors ${item.isDraft ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                              {item.isDraft && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">NEW</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">₹ {item.price}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {item.isDraft ? (
                              <div className="flex items-center space-x-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                <button onClick={() => updateDraftItemQty(item.menuItemId, -1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-md transition-colors"><Minus className="w-3 h-3" strokeWidth={3} /></button>
                                <span className="font-bold text-sm w-4 text-center text-slate-800">{item.qty}</span>
                                <button onClick={() => updateDraftItemQty(item.menuItemId, 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-md transition-colors"><Plus className="w-3 h-3" strokeWidth={3} /></button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 bg-slate-50/50 rounded-lg p-1 border border-slate-200/60 opacity-90">
                                <button disabled={isRemoving} onClick={() => handleRemoveSentItem(item.menuItemId)} className="w-6 h-6 flex items-center justify-center text-rose-500 hover:bg-rose-100 rounded-md transition-colors disabled:opacity-50"><Minus className="w-3 h-3" strokeWidth={3} /></button>
                                <span className="font-bold text-sm w-4 text-center text-slate-700">{item.qty}</span>
                                <div className="w-6 h-6"></div>
                              </div>
                            )}
                            
                            <div className="font-bold text-sm w-12 text-right text-slate-900">₹ {item.price * item.qty}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTable.status !== 'awaiting_payment' && (
                    <button onClick={() => setIsMenuOpen(true)} className="w-full mt-4 py-3.5 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-600 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 group shadow-xs">
                      <svg className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Add items from menu
                    </button>
                  )}
                </div>

                {/* Quick Suggestions block */}
                {selectedTable.status !== 'awaiting_payment' && (
                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Suggestions</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {menuItems.filter((i: MenuItem) => i.available !== false).slice(0, 4).map((suggested: MenuItem) => (
                        <button key={suggested.id} onClick={() => handleAddItem(suggested)} className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-left transition flex items-center justify-between group shadow-sm">
                          <div>
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{suggested.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">₹ {suggested.price}</p>
                          </div>
                          <span className="text-sm text-blue-600 font-black group-hover:scale-125 transition-transform">+</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes / Instructions Pill */}
                {currentDraftItems.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between text-xs mt-2">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Kitchen Notes
                        </span>
                        <button onClick={() => {
                          const note = window.prompt("Add a note for the kitchen (e.g. Less spicy):", ticketNote);
                          if (note !== null) setTicketNote(note);
                        }} className="text-blue-600 font-semibold hover:underline">
                          {ticketNote ? 'Edit Note' : 'Add Note'}
                        </button>
                      </div>
                      {ticketNote && (
                        <p className="text-slate-700 italic font-medium mt-1 ml-5">"{ticketNote}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {selectedTable.status !== 'empty' && (
            <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 space-y-4">
              {/* Subtotal & Tax Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-slate-800 font-semibold">₹ {totalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    Tax {settings.taxEnabled ? `(${settings.taxPercentage}%)` : '(Disabled)'}
                  </span>
                  <span className="text-slate-800 font-semibold">₹ {totalTax.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-slate-900">Total Tab</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">₹ {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-xs">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                  Transfer Table
                </button>
                <button onClick={() => handleClearTable()} className="py-3 px-4 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs tracking-wide transition flex items-center justify-center gap-1.5 shadow-xs">
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Clear Table
                </button>
              </div>

              {/* Settle Tab / KOT Order Flow CTA */}
              <div className="pt-1">
                {currentDraftItems.length > 0 && (
                  <button 
                    onClick={handleSendToKitchen}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <svg className="w-4 h-4 text-[#D9F927]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    {isSubmitting ? 'Sending...' : 'Send Ticket to Kitchen'}
                  </button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'preparing' && (
                  <button onClick={handleMarkServed} className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    Mark All as Served
                  </button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'served' && (
                  <button onClick={handleMarkAwaitingPayment} className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print Final Bill
                  </button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'awaiting_payment' && (
                  <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <Banknote className="w-4 h-4 text-[#D9F927]" />
                    Settle Bill / Payment
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
        </>
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
              <h2 className="text-xl font-bold">{editingTableId ? 'Edit Table' : 'Add New Table'}</h2>
              <button onClick={() => {
                setIsAddTableOpen(false);
                setEditingTableId(null);
                setNewTableNum('');
                setNewTableName('');
                setNewTableSection('Inner Hall');
                setNewTableSeats('');
              }} className="p-2 hover:bg-muted rounded-full transition-colors">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Table Name</label>
                  <input 
                    type="text" 
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. VIP Table (Optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <input
                    type="text"
                    required
                    value={newTableSection}
                    onChange={(e) => setNewTableSection(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Inner Hall, Shed"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center space-x-3">
                <div>
                  {editingTableId && (
                    <Button type="button" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this table?")) {
                        try {
                          await deleteTable(editingTableId);
                          toast.success("Table deleted successfully");
                          setIsAddTableOpen(false);
                          setEditingTableId(null);
                          setSelectedTableId(null);
                        } catch (e) {
                          toast.error("Failed to delete table");
                        }
                      }
                    }}>Delete Table</Button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddTableOpen(false);
                    setEditingTableId(null);
                    setNewTableNum('');
                    setNewTableName('');
                    setNewTableSection('Inner Hall');
                    setNewTableSeats('');
                  }}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={isSubmittingTable}>
                    {isSubmittingTable ? (editingTableId ? 'Updating...' : 'Adding...') : (editingTableId ? 'Save Changes' : 'Add Table')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedTable && (
        <PaymentModal 
          orderId={selectedTable.id}
          displayId={selectedTable.name || `Table ${selectedTable.number}`}
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
            <p className="text-sm text-muted-foreground mb-6">Enter details for {selectedTable.name || `Table ${selectedTable.number}`}</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAssigning(true);
              const finalName = cName.trim() || 'Assigned by Admin';
              const finalPhone = cPhone.trim() || '9999999999';
              try {
                await addOrUpdateCustomer(finalPhone, finalName);
                await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
                // also update customer details in table
                await runTransaction(db, async (t) => {
                  t.update(doc(db, 'tables', selectedTable.id), {
                    customerId: finalPhone,
                    customerName: finalName,
                    customerPhone: finalPhone,
                    status: 'occupied'
                  });
                });
                setAssignCustomerModalOpen(false);
                setCName('');
                setCPhone('');
              } catch (err) {
                console.error(err);
              } finally {
                setIsAssigning(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input 
                  type="text" 
                  list="customer-names"
                  value={cName}
                  onChange={e => {
                    const val = e.target.value;
                    setCName(val);
                    const found = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (found && found.phone) setCPhone(found.phone);
                  }}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. John Doe (Optional)"
                />
                <datalist id="customer-names">
                  {customers.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={cPhone}
                  onChange={e => setCPhone(e.target.value)}
                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="10-digit mobile number (Optional)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 py-6" onClick={() => setAssignCustomerModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isAssigning} className="flex-1 py-6">{isAssigning ? 'Assigning...' : 'Assign & Mark Occupied'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Transfer Table Modal */}
      {isTransferModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
              <h2 className="text-xl font-bold">Transfer Table</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Move all active orders and customer details from <strong className="text-foreground">Table {selectedTable.number} {selectedTable.name ? `(${selectedTable.name})` : ''}</strong> to a new empty table.
              </p>
              
              <div>
                <label className="block text-sm font-medium mb-1">Select Destination Table</label>
                <select 
                  required
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="" disabled>-- Select Empty Table --</option>
                  {tables.filter(t => t.status === 'empty' && t.id !== selectedTable.id).map(t => (
                    <option key={t.id} value={t.id}>
                      Table {t.number} {t.name ? `(${t.name})` : ''} - {t.section || 'Main'}
                    </option>
                  ))}
                </select>
                {tables.filter(t => t.status === 'empty' && t.id !== selectedTable.id).length === 0 && (
                  <p className="text-red-500 text-xs mt-2">No empty tables available to transfer to.</p>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4 mt-6 border-t border-border/50">
                <Button variant="outline" type="button" className="flex-1 py-6" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isTransferring || !transferTargetId} className="flex-1 py-6">{isTransferring ? 'Transferring...' : 'Transfer Now'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Clear Table Dialog */}
      {clearTablePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-background w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-foreground">Clear Table?</h3>
              {clearTablePrompt.hasUnpaid ? (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  This table still has <strong className="text-red-500">unpaid orders</strong>. Clearing it will cancel those orders. What would you like to do?
                </p>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  Are you sure you want to completely clear this table and make it available?
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {clearTablePrompt.hasUnpaid ? (
                <>
                  <Button 
                    variant="primary" 
                    className="w-full py-6 text-base shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                    onClick={() => {
                      if (clearTablePrompt.tableId !== selectedTableId) {
                        setSelectedTableId(clearTablePrompt.tableId);
                      }
                      setClearTablePrompt(null);
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    Take Payment Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full py-6 text-base text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => confirmClearTable(true)}
                    disabled={isClearing}
                  >
                    {isClearing ? 'Clearing...' : 'Force Clear (Cancel Orders)'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full py-6 text-base shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                  onClick={() => confirmClearTable(false)}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Yes, Clear Table'}
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setClearTablePrompt(null)}
                disabled={isClearing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    
    </>
  );
}
