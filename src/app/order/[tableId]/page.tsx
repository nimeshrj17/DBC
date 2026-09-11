'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { Table } from '@/lib/hooks/useTables';
import { Order, createOrderTransaction } from '@/lib/hooks/useOrders';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, Timestamp, onSnapshot, query, where, runTransaction } from 'firebase/firestore';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  qty: number;
}

export default function CustomerOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;

  const { menuItems: rawMenuItems, loading: menuLoading } = useMenu();
  const menuItems = rawMenuItems.filter(i => !i.isRetail && i.category !== 'Retail');
  
  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  const [table, setTable] = useState<Table | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'cash'>('upi_qr');
  const [viewingOrders, setViewingOrders] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const prevAwaitingRef = useRef(false);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let stored = localStorage.getItem('deviceId');
    if (!stored) {
      stored = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('deviceId', stored);
    }
    setDeviceId(stored);
  }, []);

  useEffect(() => {
    const isAwaiting = tableOrders.some(o => o.paymentStatus === 'awaiting_confirmation');
    if (prevAwaitingRef.current && !isAwaiting && tableOrders.length === 0) {
      setJustPaid(true);
    }
    prevAwaitingRef.current = isAwaiting;
  }, [tableOrders]);

  useEffect(() => {
    let unsubscribeTable: () => void;
    let unsubscribeOrders: () => void;
    
    const setupListeners = () => {
      try {
        const tableRef = doc(db, 'tables', tableId);
        unsubscribeTable = onSnapshot(tableRef, (docSnap) => {
          if (docSnap.exists()) {
            setTable({ id: docSnap.id, ...docSnap.data() } as Table);
          } else {
            setTable(null);
          }
          setTableLoading(false);
        });
        
        const q = query(collection(db, 'orders'), where('tableId', '==', tableId));
        unsubscribeOrders = onSnapshot(q, (snapshot) => {
          const ordersData: Order[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as Omit<Order, 'id'>;
            if (data.status !== 'completed' && data.status !== 'cancelled' && data.paymentStatus !== 'paid') {
              ordersData.push({ id: doc.id, ...data } as Order);
            }
          });
          ordersData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setTableOrders(ordersData);
        });
      } catch (err) {
        console.error(err);
        setTableLoading(false);
      }
    };
    setupListeners();
    return () => {
      if (unsubscribeTable) unsubscribeTable();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [tableId]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, qty: Math.max(0, i.qty + delta) };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal;
  const grandTotal = tableOrders.reduce((sum, order) => sum + order.total, 0);

  const executePlaceOrder = async () => {
    if (!table || cart.length === 0 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const retailItems = cart.filter(i => i.isRetail || i.category === 'Retail');
      const kitchenItems = cart.filter(i => !i.isRetail && i.category !== 'Retail');
      const newOrderIds = [];
      const finalCustomerName = table.customerName || null;
      const finalCustomerPhone = table.customerPhone || null;
      
      if (kitchenItems.length > 0) {
        const sub = kitchenItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const orderId = await createOrderTransaction({
          tableId: table.id,
          tableNumber: table.number,
          customerPhone: finalCustomerPhone,
          customerName: finalCustomerName,
          displayIdPrefix: 'QR',
          items: kitchenItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty })),
          subtotal: sub, tax: 0, total: sub, status: 'pending', paymentMethod: null, paymentStatus: 'unpaid'
        });
        newOrderIds.push(orderId);
      }
      
      if (retailItems.length > 0) {
        const sub = retailItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const orderId = await createOrderTransaction({
          tableId: table.id,
          tableNumber: table.number,
          customerPhone: finalCustomerPhone,
          customerName: finalCustomerName,
          displayIdPrefix: 'QR',
          items: retailItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty })),
          subtotal: sub, tax: 0, total: sub, status: 'served', paymentMethod: null, paymentStatus: 'unpaid'
        });
        newOrderIds.push(orderId);
      }

      const newActiveIds = [...(table.activeOrderIds || []), ...newOrderIds];
      const tableStatus = kitchenItems.length > 0 ? (table.status === 'empty' || table.status === 'occupied' ? 'order_placed' : table.status) : table.status;
      
      await updateDoc(doc(db, 'tables', table.id), {
        activeOrderIds: newActiveIds,
        status: tableStatus,
        updatedAt: Timestamp.now(),
        ...(table.status === 'empty' ? { currentSessionId: deviceId } : {})
      });
      setCart([]);
      setIsCartOpen(false);
      setViewingOrders(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCustomerCheckout = async () => {
    if (tableOrders.length === 0 || !table) return;
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, 'tables', table.id);
        const tableSnap = await transaction.get(tableRef);
        if (!tableSnap.exists()) throw new Error("Table not found");
        const checkoutOrderIds = tableOrders.map(o => o.id);
        for (const orderId of checkoutOrderIds) {
          const orderRef = doc(db, 'orders', orderId);
          transaction.update(orderRef, { paymentMethod, paymentStatus: 'awaiting_confirmation' });
        }
        transaction.update(tableRef, { status: 'awaiting_payment' });
      });
      toast.success(`Waiting for cafe confirmation...`);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment");
    }
  };

  const isAwaitingConfirmation = tableOrders.some(o => o.paymentStatus === 'awaiting_confirmation');

  if (tableLoading || menuLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFAFA]">
      <div className="w-8 h-8 border-4 border-[#2A1A14] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!table) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid QR Code</h1>
      <p className="text-gray-600">This table does not exist or the link is invalid.</p>
    </div>
  );

  if (table.currentSessionId && table.currentSessionId !== deviceId && table.status !== 'empty') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
      <h1 className="text-2xl font-bold text-[#A04010] mb-2">Table In Use</h1>
      <p className="text-gray-600 font-medium">This table is currently locked to another device.</p>
    </div>
  );

  if (justPaid) return (
    <div className="w-full max-w-md mx-auto flex-1 min-h-screen bg-[#FAF7F2] flex flex-col justify-between px-5 pt-8 pb-7">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EFE4D8] text-[#9c4c2d] text-sm"><svg className="w-7 h-7 text-[#2e1c14] tea-steam-anim" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
<path d="M6 2v2m4-2v2m4-2v2" strokeLinecap="round" strokeLinejoin="round" />
</svg></span>
          <span className="text-xs tracking-wider uppercase font-bold text-gray-500">राखा भाई की चाय</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Paid & Closed</span>
        </div>
      </header>
      <section className="flex flex-col items-center text-center mt-2 mb-5">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-400 shadow-sm relative z-10">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2c1f17] tracking-tight leading-snug">Thank You for Visiting!</h1>
        <p className="text-base text-[#9c4c2d] font-medium mt-0.5">राखा भाई की चाय AND CAFÉ</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-[280px] leading-relaxed">Payment successful. We hope you enjoyed your time at <span className="font-semibold text-[#2c1f17]">{table.name || `Table ${table.number}`}</span>.</p>
      </section>
      <div className="space-y-3">
        <button onClick={() => window.location.reload()} className="w-full py-3.5 px-6 rounded-2xl bg-[#2c1f17] text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all">Start New Session</button>
      </div>
    </div>
  );

  if (isSubmitting) return (
    <div className="max-w-md mx-auto relative bg-[#FAF7F2] min-h-screen shadow-2xl flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#2A1A14] border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold text-[#2A1A14]">Saving to Firebase...</h2>
      <p className="text-gray-500 text-sm mt-2">Please wait while we place your order.</p>
    </div>
  );

  if (viewingOrders && tableOrders.length > 0) return (
    <div className="max-w-md mx-auto relative bg-[#FAF7F2] min-h-screen shadow-2xl flex flex-col">
      <header className="bg-[#5a3829] text-white pt-6 pb-5 px-5 rounded-b-[2rem] shadow-lg sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-amber-200"><svg className="w-7 h-7 text-[#2e1c14] tea-steam-anim" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round" />
<path d="M6 2v2m4-2v2m4-2v2" strokeLinecap="round" strokeLinejoin="round" />
</svg></div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-snug">राखा भाई की चाय</h1>
              <p className="text-[11px] font-medium tracking-wider text-amber-200/80 uppercase">AND CAFÉ</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{table.name || `Table ${table.number}`}</span>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6 w-full flex-1 space-y-6">
        <section className="text-center pt-2">
          <div className="relative mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/25">
              <svg className="h-10 w-10 text-white stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#5a3829] tracking-tight mb-2">Order Sent to Kitchen!</h2>
          <p className="text-sm font-medium text-stone-600 px-4 leading-relaxed max-w-xs mx-auto">We're preparing your freshly made food and will deliver it right to <span className="font-bold text-[#2A1A14]">{table.name || `Table ${table.number}`}</span>.</p>
        </section>
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/70">
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span>
              <h3 className="text-xs font-bold tracking-wider uppercase text-stone-700">Live Kitchen Tracker</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">Est. ~8-12 mins</span>
          </div>
          {(() => {
            const hasPending = tableOrders.some(o => o.status === 'pending');
            const hasPreparing = tableOrders.some(o => o.status === 'preparing');
            const hasPrepared = tableOrders.some(o => o.status === 'prepared');
            const hasServed = tableOrders.every(o => o.status === 'served');
            
            let currentStep = 1;
            if (hasServed) currentStep = 4;
            else if (hasPrepared) currentStep = 3;
            else if (hasPreparing) currentStep = 2;
            else if (hasPending) currentStep = 1;

            return (
            <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              <div className="relative flex items-start">
                <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center ring-4 shadow-sm ${currentStep >= 1 ? (currentStep === 1 ? 'bg-amber-500 ring-amber-100 animate-pulse' : 'bg-emerald-500 ring-emerald-100') : 'bg-stone-300 ring-stone-50'}`}>
                  {currentStep > 1 ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                </div>
                <div className="ml-1">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-bold ${currentStep >= 1 ? 'text-stone-800' : 'text-stone-400'}`}>Order Received</p>
                    {currentStep === 1 && <span className="text-[10px] bg-amber-100/70 text-amber-800 font-semibold px-2 py-0.5 rounded-full">In Progress</span>}
                  </div>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center ring-4 shadow-sm ${currentStep >= 2 ? (currentStep === 2 ? 'bg-amber-500 ring-amber-100 animate-pulse' : 'bg-emerald-500 ring-emerald-100') : 'bg-stone-300 ring-stone-50'}`}>
                  {currentStep > 2 ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                </div>
                <div className="ml-1">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-bold ${currentStep >= 2 ? 'text-amber-800' : 'text-stone-400'}`}>Preparing in Kitchen</p>
                    {currentStep === 2 && <span className="text-[10px] bg-amber-100/70 text-amber-800 font-semibold px-2 py-0.5 rounded-full">In Progress</span>}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">Chef is preparing your fresh order</p>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center ring-4 shadow-sm ${currentStep >= 3 ? (currentStep === 3 ? 'bg-amber-500 ring-amber-100 animate-pulse' : 'bg-emerald-500 ring-emerald-100') : 'bg-stone-300 ring-stone-50'}`}>
                  {currentStep > 3 ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>}
                </div>
                <div className="ml-1">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-bold ${currentStep >= 3 ? 'text-stone-800' : 'text-stone-400'}`}>Ready to Serve</p>
                    {currentStep === 3 && <span className="text-[10px] bg-amber-100/70 text-amber-800 font-semibold px-2 py-0.5 rounded-full">In Progress</span>}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </section>
        {tableOrders.map(order => (
          <section key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/70">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Order ID</span>
                <p className="text-base font-extrabold text-stone-800">{order.displayId || `#${order.id.slice(0,6)}`}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">Status</span>
                <p className="text-sm font-bold text-[#5a3829]">{order.status}</p>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 flex items-center justify-center bg-stone-100 rounded text-xs font-bold text-stone-700">{item.qty}×</span>
                    <span className="font-medium text-stone-800">{item.name}</span>
                  </div>
                  <span className="font-semibold text-stone-800">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="bg-white border-t border-stone-200/80 px-4 pt-3 pb-6 sticky bottom-0 z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto space-y-2.5">
          <button onClick={() => setViewingOrders(false)} className="w-full py-3.5 px-4 rounded-xl bg-[#5a3829] hover:bg-[#382117] text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
</svg>
<span>Order More Items</span>
          </button>
          {!isAwaitingConfirmation && (
            <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3 px-4 rounded-xl border-2 border-[#5a3829]/30 text-[#5a3829] hover:bg-stone-50 font-bold text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
</svg>
<span>Pay Bill • ₹{grandTotal.toFixed(2)}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto bg-[#faf7f2] min-h-screen relative flex flex-col shadow-2xl overflow-x-hidden pb-24">
      <header className="relative bg-[#26150e] text-amber-50 px-5 pt-7 pb-6 rounded-b-[2.5rem] shadow-xl overflow-hidden" data-purpose="brand-header">
<div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border-[10px] border-white/5 pointer-events-none"></div>
<div className="absolute -right-4 top-10 w-28 h-28 rounded-2xl border-4 border-white/5 rotate-12 pointer-events-none"></div>
<div className="flex items-center justify-between gap-2 mb-4 relative z-10">
<div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide">
<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
<span>{table.name || `Table ${table.number}`}</span>
</div>
<div className="text-[11px] text-amber-200/80 tracking-wider uppercase font-semibold">
          Digital QR Order
        </div>
</div>
<div className="flex items-center gap-3.5 mb-4 relative z-10">
<div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-[#f5dbca] flex items-center justify-center text-[#26150e] shadow-md shadow-black/20 flex-shrink-0 border border-amber-200/50">
<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
<path d="M4 19h14a2 2 0 0 0 2-2v-1h1.5A3.5 3.5 0 0 0 25 12.5v-1A3.5 3.5 0 0 0 21.5 8H20V5H4v14zm16-9h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H20v-4zM6 7h12v10H6V7z"></path>
<path d="M7 2h2v3H7zm4-1h2v4h-2zm4 1h2v3h-2z" opacity="0.75"></path>
</svg>
</div>
<div>
<h1 className="text-2xl font-extrabold tracking-tight text-white font-['Mukta'] leading-tight">राखा भाई की चाय</h1>
<p className="text-xs uppercase tracking-[0.25em] font-bold text-amber-200/90 flex items-center gap-1.5">
<span>And Café</span>
<span className="inline-block w-1 h-1 rounded-full bg-amber-400"></span>
<span className="text-[10px] text-amber-300 font-normal">Authentic Sips</span>
</p>
</div>
</div>
<div className="bg-black/25 border border-white/10 backdrop-blur-sm rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-100/90 leading-relaxed relative z-10" data-purpose="table-instructions">
<svg className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
</svg>
<span>Please remain seated at this designated table to ensure smooth service and avoid order mix-ups.</span>
</div>
</header>

      {tableOrders.length > 0 && !viewingOrders && (
        <section className="px-4 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-amber-900/10 transition hover:shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400">Table's Order</span>
                <span className="text-sm font-bold text-stone-900 tracking-tight">{tableOrders.length === 1 ? tableOrders[0].displayId || 'Pending' : `${tableOrders.length} Orders`}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                {isAwaitingConfirmation ? 'AWAITING PAYMENT' : 'KITCHEN PREPARING'}
              </span>
            </div>
            <div className="py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium text-stone-700">
                <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-bold">{tableOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0)}×</span>
                <span>{tableOrders.length === 1 ? (tableOrders[0].items[0]?.name + (tableOrders[0].items.length > 1 ? ` +${tableOrders[0].items.length - 1} more` : '')) : 'Items ordered'}</span>
              </div>
              <span className="font-bold text-stone-900">₹{grandTotal.toFixed(2)}</span>
            </div>
            {!isAwaitingConfirmation && (
              <button onClick={() => setIsPaymentModalOpen(true)} className="w-full mt-1 bg-[#26150e] hover:bg-[#382117] active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition">
                <span>Pay Bill • ₹{grandTotal.toFixed(2)}</span>
              </button>
            )}
          </div>
        </section>
      )}

      <nav className="pt-5 pb-2">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar px-4">
          <button onClick={() => setActiveCategory('All')} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${activeCategory === 'All' ? 'bg-[#26150e] text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>All</button>
          {categories.map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(cat as string)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-xs ${activeCategory === cat ? 'bg-[#26150e] text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>{cat as string}</button>
          ))}
        </div>
      </nav>

      <main className="px-4 pt-3 flex-1 flex flex-col gap-4">
        <div className="relative w-full mb-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white text-stone-800 placeholder-stone-400 text-sm rounded-2xl py-3 px-4 border border-stone-200 shadow-xs focus:ring-2 outline-none" placeholder="Search by name..." type="text"/>
        </div>
        <section className="flex flex-col gap-3.5">
          {menuItems.filter(i => {
            if (!i.available) return false;
            if (activeCategory !== 'All' && i.category !== activeCategory) return false;
            if (searchQuery) return i.name.toLowerCase().includes(searchQuery.toLowerCase());
            return true;
          }).map(item => {
            const cartItem = cart.find(i => i.id === item.id);
            return (
              <article key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex justify-between gap-3 relative transition hover:shadow-md">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base leading-snug">{item.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>
                  <div className="pt-1"><span className="text-base font-extrabold text-stone-900">₹{item.price}</span></div>
                </div>
                <div className="flex flex-col justify-end items-end">
                  {cartItem ? (
                    <div className="flex items-center bg-[#26150e] text-white rounded-xl shadow-md overflow-hidden">
                      <button onClick={() => updateQty(item.id, -1)} className="px-2.5 py-1.5 text-amber-200 hover:bg-black/30 font-bold active:scale-95">−</button>
                      <span className="px-2 py-1 text-xs font-bold">{cartItem.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="px-2.5 py-1.5 text-amber-200 hover:bg-black/30 font-bold active:scale-95">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="bg-[#26150e] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#3c2217] active:scale-95 shadow transition">+ Add</button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {cart.length === 0 && tableOrders.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-30 px-4 pb-4">
          <div className="w-full max-w-md pointer-events-auto">
            <aside className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 pl-1.5">
                <div>
                  <p className="text-xs font-semibold text-stone-200">No items selected</p>
                  <p className="text-[11px] text-stone-400">Tap 'Add' on items to start your order</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-30">
          <div className="bg-[#1c110b] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-500/20 backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm">{cart.reduce((s,i)=>s+i.qty,0)}</div>
              <div>
                <p className="text-xs text-stone-300 font-medium">Cart Total</p>
                <p className="text-base font-extrabold text-white">₹{total.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => setIsCartOpen(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5">
              <span>View Cart</span>
            </button>
          </div>
        </div>
      )}

      {tableOrders.length > 0 && cart.length === 0 && !isCartOpen && (
        <div className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-4 z-30">
          <div className="bg-[#1c110b] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-500/20 backdrop-blur-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-sm">{tableOrders.length}</div>
              <div>
                <p className="text-xs text-stone-300 font-medium">Table Bill Total</p>
                <p className="text-base font-extrabold text-white">₹{grandTotal.toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => setViewingOrders(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-extrabold text-xs rounded-xl shadow transition flex items-center gap-1.5">
              <span>View Orders</span>
            </button>
          </div>
        </div>
      )}

      {isCartOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/45 backdrop-blur-[2px] transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <main className="fixed bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-md bg-[#FAF7F2] rounded-t-[32px] shadow-sheet border-t border-[#f0e4d7] flex flex-col max-h-[88vh] transition-transform">
            <header className="pt-3 px-6 pb-4 shrink-0">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1.5 rounded-full bg-[#D6CDC5] cursor-grab" onClick={() => setIsCartOpen(false)}></div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFE4D8] text-[#9c4c2d] border border-[#e1d2c2]">
                    <svg className="w-3 h-3 text-[#9c4c2d]" fill="currentColor" viewBox="0 0 20 20">
<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
</svg>
                    {table.name || `Table ${table.number}`}
                  </span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="w-7 h-7 rounded-full bg-stone-200/70 hover:bg-stone-300/80 active:scale-95 flex items-center justify-center text-stone-600 transition-all">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
</svg>
</button>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#2c1f17]">Your Cart</h1>
                <span className="text-xs font-bold text-gray-500 bg-stone-200/60 px-2 py-0.5 rounded-md">{cart.reduce((s,i)=>s+i.qty,0)} items</span>
              </div>
            </header>
            <div className="overflow-y-auto px-6 space-y-4 pb-4 flex-1">
              {cart.map(item => (
                <section key={item.id} className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <h2 className="font-bold text-[#2c1f17] text-base leading-tight">{item.name}</h2>
                      <p className="text-xs text-gray-500">Unit price: ₹{item.price.toFixed(2)}</p>
                      <p className="text-base font-extrabold text-[#9c4c2d] pt-0.5">₹{(item.price * item.qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center bg-[#F3ECE5] rounded-full p-1 border border-[#e5dcd2]">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#2c1f17] font-bold text-base shadow-sm hover:bg-stone-50 active:scale-90 transition-transform">−</button>
                      <span className="w-8 text-center font-bold text-[#2c1f17] text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-[#2c1f17] flex items-center justify-center text-white font-bold text-base shadow-sm hover:bg-black active:scale-90 transition-transform">+</button>
                    </div>
                  </div>
                </section>
              ))}
              <section className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-1 border-b border-stone-100">Bill Breakdown</h3>
                <div className="flex justify-between items-center text-sm font-medium text-gray-500"><span>Subtotal</span><span className="text-[#2c1f17] font-semibold">₹{subtotal.toFixed(2)}</span></div>
                <div className="pt-2 border-t border-stone-200/80 flex justify-between items-baseline">
                  <div><span className="text-base font-extrabold text-[#2c1f17]">Total</span></div>
                  <div className="text-xl font-black text-[#2c1f17] tracking-tight">₹{total.toFixed(2)}</div>
                </div>
              </section>
            </div>
            <footer className="p-5 pt-3 bg-white border-t border-stone-200/80 shrink-0 space-y-2">
              <button disabled={isSubmitting || cart.length === 0} onClick={executePlaceOrder} className="w-full bg-[#9c4c2d] hover:bg-[#853e22] text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all">
                {isSubmitting ? (
                  <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Sending to Kitchen...</span>
        </>
                ) : (
                  <>
                  <span>Place Order to Kitchen</span>
<svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
</svg>
</>

                )}
              </button>
            </footer>
            <div className="pb-5 bg-white shrink-0">
            <p className="text-center text-[11px] font-medium text-stone-500 flex items-center justify-center gap-1.5 pb-2">
<svg className="w-3.5 h-3.5 text-amber-700 inline" fill="currentColor" viewBox="0 0 20 20">
<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
</svg>
        Kitchen prepares immediately upon order confirmation
      </p>
      </div>
          </main>
        </>
      )}

      {isPaymentModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsPaymentModalOpen(false)}></div>
          <main className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-[#FAF7F2] rounded-t-[32px] shadow-2xl flex flex-col max-h-[92vh]">
            <div className="w-full flex justify-center pt-3 pb-1"><div className="w-12 h-1.5 bg-stone-300 rounded-full" onClick={() => setIsPaymentModalOpen(false)}></div></div>
            <header className="px-6 pt-2 pb-3 flex items-start justify-between border-b border-stone-200">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#2c1f17] leading-tight">राखा भाई की चाय</h1>
                <p className="text-xs text-gray-500">Payment for {table.name || `Table ${table.number}`}</p>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 rounded-full hover:bg-stone-200">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
</svg>
</button>
            </header>
            <section className="overflow-y-auto px-6 py-4 space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-semibold text-stone-500 uppercase">Total Amount Due</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#2c1f17]">₹</span>
                  <span className="text-4xl font-extrabold text-[#2c1f17] tracking-tight">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">Select Payment Method</h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <label onClick={() => setPaymentMethod('upi_qr')} className={`cursor-pointer flex flex-col items-center p-3.5 bg-white border-2 rounded-2xl text-center transition ${paymentMethod === 'upi_qr' ? 'border-[#5a3829]' : 'border-stone-200'}`}>
                    <span className="text-xs font-bold text-[#2c1f17] mt-1">UPI / QR</span>
                  </label>
                  <label onClick={() => setPaymentMethod('cash')} className={`cursor-pointer flex flex-col items-center p-3.5 bg-white border-2 rounded-2xl text-center transition ${paymentMethod === 'cash' ? 'border-[#5a3829]' : 'border-stone-200'}`}>
                    <span className="text-xs font-bold text-[#2c1f17] mt-1">Cash Payment</span>
                  </label>
                </div>
              </div>
            </section>
            <footer className="p-5 bg-white border-t border-stone-200 flex gap-2.5">
              <button onClick={() => setIsPaymentModalOpen(false)} className="w-1/3 py-3.5 px-4 rounded-xl border border-stone-300 font-semibold text-stone-700 text-sm hover:bg-stone-50">Back</button>
              <button onClick={handleCustomerCheckout} className="w-2/3 py-3.5 px-4 bg-[#2c1f17] hover:bg-black text-white rounded-xl font-bold text-sm tracking-wide shadow-md">I Have Paid</button>
            </footer>
            <div className="pb-5 bg-white shrink-0">
            <p className="text-center text-[11px] font-medium text-stone-500 flex items-center justify-center gap-1.5 pb-2">
<svg className="w-3.5 h-3.5 text-amber-700 inline" fill="currentColor" viewBox="0 0 20 20">
<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
</svg>
        Kitchen prepares immediately upon order confirmation
      </p>
      </div>
          </main>
        </>
      )}
    </div>
  );
}
