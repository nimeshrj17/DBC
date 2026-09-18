'use client';
import React, { useState, useRef } from 'react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { createOrderTransaction } from '@/lib/hooks/useOrders';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  qty: number;
}

export default function TakeawayPage() {
  const { menuItems: rawMenuItems, loading: menuLoading } = useMenu();
  const menuItems = rawMenuItems.filter(i => !i.isRetail && i.category !== 'Retail');
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

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
  const tax = subtotal * 0.05; // 5% GST
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
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to place order: ' + error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Left Menu Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Takeaway POS</h1>
            <p className="text-sm text-slate-500">Quick parcel orders</p>
          </div>
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D9F927] focus:border-[#D9F927] outline-none text-sm w-64 bg-slate-50"
            />
          </div>
        </header>

        {/* Categories */}
        <div className="px-6 py-4 overflow-x-auto whitespace-nowrap shrink-0 border-b border-slate-100 flex gap-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-slate-900 text-[#D9F927] shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {menuLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-[#D9F927] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-full"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight group-hover:text-slate-900 line-clamp-2">{item.name}</h3>
                    {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <span className="font-bold text-slate-900">₹{item.price}</span>
                    <button className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold group-hover:bg-[#D9F927] group-hover:text-slate-900 transition-colors">
                      +
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-500">
                  No items found in this category.
                </div>
              )}
            </div>
          )}
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
            <input
              type="text"
              placeholder="e.g. Rahul"
              value={custName}
              onChange={e => setCustName(e.target.value)}
              className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="9999999999"
              value={custPhone}
              onChange={e => setCustPhone(e.target.value)}
              className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <svg className="w-12 h-12 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
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
                <div className="w-16 text-right font-bold text-slate-900">
                  ₹{item.price * item.qty}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-700">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (5%)</span>
              <span className="font-semibold text-slate-700">₹{tax.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-lg font-black text-slate-900">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isSubmitting}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2 ${
              cart.length === 0 || isSubmitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#D9F927] text-slate-900 hover:bg-[#c9e815] hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Place Parcel Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
