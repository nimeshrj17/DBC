'use client';
import React, { useState, useRef } from 'react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { useOrders } from '@/lib/hooks/useOrders';
import { createOrderTransaction } from '@/lib/hooks/useOrders';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  qty: number;
}

export default function TakeawayPage() {
  const { menuItems, loading: menuLoading } = useMenu();
  const { orders, loading: ordersLoading } = useOrders();
  
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const [activeTab, setActiveTab] = useState<'new' | 'active'>('new');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Customer Details
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeTakeawayOrders = orders.filter(o => o.tableId === 'takeaway' && o.status !== 'completed' && o.status !== 'cancelled');

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = 0;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (isSubmittingRef.current) return;
    
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    const toastId = toast.loading('Placing takeaway order...');

    try {
      await createOrderTransaction({
        tableId: 'takeaway',
        tableNumber: 0,
        customerName: custName.trim() || 'Guest',
        customerPhone: custPhone.trim() || '',
        displayIdPrefix: 'PARCEL',
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          qty: item.qty
        })),
        subtotal,
        tax,
        total,
        status: 'preparing',
        paymentMethod: null,
        paymentStatus: 'unpaid',
        tableName: 'Takeaway'
      } as any);

      toast.success('Takeaway Order Placed! Sending to kitchen...', { id: toastId });
      setCart([]);
      setCustName('');
      setCustPhone('');
      setActiveTab('active');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to place order: ' + error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  
  const pushToPaytmBox = async (orderId: string, amount: number) => {
    try {
      const toastId = toast.loading('Pushing to Paytm Smart Box...');
      const res = await fetch('/api/paytm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          tableId: 'takeaway'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Amount pushed to Smart Box!', { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error('Failed to connect to Paytm: ' + e.message);
    }
  };

const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status');
    }
  };

  const handlePayment = async (orderId: string, method: 'cash' | 'upi') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'completed', 
        paymentStatus: 'paid',
        paymentMethod: method
      });
      toast.success(`Payment collected via ${method.toUpperCase()}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to process payment');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-900">
      
      {/* Header & Tabs */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Takeaway POS</h1>
          <p className="text-sm text-slate-500">Manage parcel orders</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('new')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Parcel
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active Parcels
            {activeTakeawayOrders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{activeTakeawayOrders.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'new' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Menu Section (List View) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
               <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pr-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? 'bg-slate-900 text-[#D9F927]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-full focus:ring-2 focus:ring-[#D9F927] focus:border-[#D9F927] outline-none text-sm w-48 bg-slate-50"
                />
              </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="flex flex-col gap-3 max-w-4xl mx-auto pb-20">
                {menuLoading ? (
                  [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"></div>)
                ) : (
                  filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => addToCart(item)}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#D9F927] hover:shadow-md transition-all cursor-pointer p-4 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                         <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                           <span className="text-xs font-bold uppercase">{item.category.substring(0, 3)}</span>
                         </div>
                         <div>
                           <h3 className="font-bold text-slate-900">{item.name}</h3>
                           <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 pl-4">
                        <span className="font-black text-lg text-slate-900">₹{item.price}</span>
                        <button className="bg-slate-100 text-slate-600 w-10 h-10 rounded-full flex items-center justify-center font-bold group-hover:bg-[#D9F927] group-hover:text-slate-900 transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {filteredItems.length === 0 && (
                  <div className="py-20 text-center text-slate-500 font-medium">No items found.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Cart Section */}
          <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col shadow-xl shrink-0 z-10">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D9F927]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                Current Parcel
              </h2>
              <span className="bg-[#D9F927] text-slate-900 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {cart.reduce((s, i) => s + i.qty, 0)} Items
              </span>
            </div>

            {/* Customer Info Form */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Customer Name (Optional)</label>
                <input type="text" placeholder="e.g. Rahul" value={custName} onChange={e => setCustName(e.target.value)} className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number (Optional)</label>
                <input type="tel" placeholder="9999999999" value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                      <div className="text-slate-500 text-xs mt-1 font-medium">₹{item.price}</div>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-md font-bold transition-colors">−</button>
                      <span className="font-bold w-4 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-md font-bold transition-colors">+</button>
                    </div>
                    <div className="w-16 text-right font-bold text-slate-900">₹{item.price * item.qty}</div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Footer */}
            <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-700">₹{subtotal.toFixed(2)}</span></div>
                
                <div className="pt-2 border-t border-slate-100 flex justify-between text-lg font-black text-slate-900"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || isSubmitting}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2 ${cart.length === 0 || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#D9F927] text-slate-900 hover:bg-[#c9e815] hover:shadow-lg'}`}
              >
                Place Parcel Order
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active Parcels Tab */
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-4">
            {ordersLoading ? (
               <div className="text-center text-slate-500 py-10">Loading active parcels...</div>
            ) : activeTakeawayOrders.length === 0 ? (
               <div className="text-center text-slate-500 py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                 <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                 <h2 className="text-lg font-bold text-slate-700">No active parcel orders</h2>
                 <p className="text-sm text-slate-500 mt-1">When you place a takeaway order, it will appear here.</p>
                 <button onClick={() => setActiveTab('new')} className="mt-6 bg-[#D9F927] text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-[#c9e815] transition-colors">Start New Order</button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {activeTakeawayOrders.map(order => (
                   <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
                     <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                       <div>
                         <h3 className="font-black text-lg text-slate-900 leading-none mb-1">{order.displayId}</h3>
                         <p className="text-sm font-medium text-slate-500">{order.customerName || 'Walk-in'} {order.customerPhone && `(${order.customerPhone})`}</p>
                       </div>
                       <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                         order.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                         order.status === 'prepared' ? 'bg-emerald-100 text-emerald-700' :
                         order.status === 'billed' ? 'bg-blue-100 text-blue-700' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {order.status}
                       </span>
                     </div>
                     
                     <div className="flex-1 mb-4 overflow-y-auto pr-2 space-y-2">
                       {order.items.map((item, idx) => (
                         <div key={idx} className="flex justify-between text-sm">
                           <span className="font-medium text-slate-700"><span className="text-slate-400 mr-2">{item.qty}x</span>{item.name}</span>
                           <span className="font-bold text-slate-900">₹{item.price * item.qty}</span>
                         </div>
                       ))}
                     </div>
                     
                     <div className="border-t border-slate-100 pt-4 mb-4 flex justify-between items-center">
                       <span className="text-slate-500 text-sm font-medium">Total Bill</span>
                       <span className="text-xl font-black text-slate-900">₹{order.total.toFixed(2)}</span>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="grid grid-cols-2 gap-2 mt-auto">
                       {(order.status === 'pending' || order.status === 'preparing') ? (
                         <button onClick={() => handleStatusUpdate(order.id, 'prepared')} className="col-span-2 bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition-colors shadow-sm">Mark Prepared</button>
                       ) : (order.status === 'prepared' || order.status === 'served') ? (
                         <>
                           <button onClick={() => handlePayment(order.id, 'cash')} className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">Collect Cash</button>
                           <button onClick={() => pushToPaytmBox(order.id, order.total)} className="bg-sky-50 text-sky-700 border border-sky-200 font-bold py-2.5 rounded-xl hover:bg-sky-100 transition-colors">Push Paytm</button>
                           <button onClick={() => handlePayment(order.id, 'upi')} className="col-span-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors">Manual UPI Success</button>
                         </>
                       ) : (
                         <button className="col-span-2 bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl cursor-not-allowed">Waiting for customer...</button>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
