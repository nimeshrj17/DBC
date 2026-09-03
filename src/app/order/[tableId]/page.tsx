'use client';
import React, { useState, useEffect, use, useRef } from 'react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { Table } from '@/lib/hooks/useTables';
import { Order, createOrderTransaction } from '@/lib/hooks/useOrders';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp, getDoc, onSnapshot, query, where, runTransaction } from 'firebase/firestore';
import { Coffee, ShoppingBag, Plus, Minus, ChevronRight, Check, Clock, ChefHat, CheckCircle2, Banknote, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import PaymentModal from '@/components/dashboard/PaymentModal';

interface CartItem extends MenuItem {
  qty: number;
}

export default function CustomerOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;

  const { menuItems, loading: menuLoading } = useMenu();
  const [table, setTable] = useState<Table | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const { addOrUpdateCustomer } = useCustomers();
  const [justPaid, setJustPaid] = useState(false);
  const prevAwaitingRef = React.useRef(false);
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
    let unsubscribeOrders: () => void;
    
    const fetchTable = async () => {
      try {
        const tableDoc = await getDoc(doc(db, 'tables', tableId));
        if (tableDoc.exists()) {
          setTable({ id: tableDoc.id, ...tableDoc.data() } as Table);
          
          // Listen to orders for this table that aren't completed/cancelled
          const q = query(
            collection(db, 'orders'),
            where('tableId', '==', tableId)
          );
          
          unsubscribeOrders = onSnapshot(q, (snapshot) => {
            const ordersData: Order[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as Omit<Order, 'id'>;
              if (data.status !== 'completed' && data.status !== 'cancelled' && data.paymentStatus !== 'paid') {
                ordersData.push({ id: doc.id, ...data } as Order);
              }
            });
            // Sort by created at
            ordersData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setTableOrders(ordersData);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTableLoading(false);
      }
    };
    fetchTable();
    
    return () => {
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
    toast.success(`Added ${item.name} to cart`, { duration: 1500 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0; // Assuming no tax for now or can fetch settings if needed
  const total = subtotal + tax;

  const handleCheckoutClick = () => {
    if (table?.currentSessionId && table.currentSessionId !== deviceId && table.status !== 'empty') {
      toast.error("This table is currently being used by another device.");
      return;
    }
    
    if (!table?.customerId && !sessionStorage.getItem('skippedCustomerPrompt')) {
      setShowCustomerModal(true);
    } else {
      executePlaceOrder();
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cName && cPhone && table) {
      try {
        await addOrUpdateCustomer(cPhone, cName);
        await updateDoc(doc(db, 'tables', table.id), {
          customerId: cPhone,
          customerName: cName,
          customerPhone: cPhone,
          currentSessionId: deviceId
        });
        setTable(prev => prev ? {...prev, customerId: cPhone, customerName: cName, customerPhone: cPhone, currentSessionId: deviceId} : prev);
      } catch (err) {
        console.error(err);
      }
    } else {
      sessionStorage.setItem('skippedCustomerPrompt', 'true');
    }
    setShowCustomerModal(false);
    executePlaceOrder({ cName, cPhone });
  };

  const executePlaceOrder = async (customerOverrides?: { cName: string, cPhone: string }) => {
    if (!table || cart.length === 0 || isSubmittingRef.current) return;
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const retailItems = cart.filter(i => i.isRetail || i.category === 'Retail');
      const kitchenItems = cart.filter(i => !i.isRetail && i.category !== 'Retail');
      
      const newOrderIds = [];
      const finalCustomerName = customerOverrides?.cName || table.customerName || null;
      const finalCustomerPhone = customerOverrides?.cPhone || table.customerPhone || null;
      
      if (kitchenItems.length > 0) {
        const sub = kitchenItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        // tax logic if any
        const orderId = await createOrderTransaction({
          tableId: table.id,
          tableNumber: table.number,
          customerPhone: finalCustomerPhone,
          customerName: finalCustomerName,
          displayIdPrefix: 'QR',
          items: kitchenItems.map(i => ({
            menuItemId: i.id,
            name: i.name,
            price: i.price,
            category: i.category,
            qty: i.qty
          })),
          subtotal: sub,
          tax: 0,
          total: sub,
          status: 'pending',
          paymentMethod: null,
          paymentStatus: 'unpaid'
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
          items: retailItems.map(i => ({
            menuItemId: i.id,
            name: i.name,
            price: i.price,
            category: i.category,
            qty: i.qty
          })),
          subtotal: sub,
          tax: 0,
          total: sub,
          status: 'served',
          paymentMethod: null,
          paymentStatus: 'unpaid'
        });
        newOrderIds.push(orderId);
      }

      // 2. Update table active orders
      const newActiveIds = [...(table.activeOrderIds || []), ...newOrderIds];
      const tableStatus = kitchenItems.length > 0 ? (table.status === 'empty' || table.status === 'occupied' ? 'order_placed' : table.status) : table.status;
      
      await updateDoc(doc(db, 'tables', table.id), {
        activeOrderIds: newActiveIds,
        status: tableStatus,
        updatedAt: Timestamp.now(),
        ...(table.status === 'empty' ? { currentSessionId: deviceId } : {})
      });

      setOrderPlaced(true);
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      console.error('Failed to place order', error);
      toast.error('Failed to place order. Please try again or contact staff.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const grandTotal = tableOrders.reduce((sum, order) => sum + order.total, 0);

  const handleCustomerCheckout = async (method: 'cash' | 'qr') => {
    if (tableOrders.length === 0 || !table) return;
    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, 'tables', table.id);
        const tableSnap = await transaction.get(tableRef);
        
        if (!tableSnap.exists()) throw new Error("Table not found");
        
        const checkoutOrderIds = tableOrders.map(o => o.id);
        
        for (const orderId of checkoutOrderIds) {
          const orderRef = doc(db, 'orders', orderId);
          transaction.update(orderRef, {
            paymentMethod: method,
            paymentStatus: 'awaiting_confirmation',
          });
        }
        
        transaction.update(tableRef, {
          status: 'awaiting_payment'
        });
      });
      
      toast.success(`Waiting for cafe confirmation...`);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to process payment");
    }
  };

  if (tableLoading || menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFAFA]">
        <div className="w-8 h-8 border-4 border-[#2A1A14] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid QR Code</h1>
        <p className="text-gray-600">This table does not exist or the link is invalid. Please ask staff for assistance.</p>
      </div>
    );
  }

  if (table.currentSessionId && table.currentSessionId !== deviceId && table.status !== 'empty') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
        <h1 className="text-2xl font-bold text-[#A04010] mb-2">Table In Use</h1>
        <p className="text-gray-600 font-medium">This table is currently locked to another device.</p>
        <p className="text-gray-500 text-sm mt-2">To prevent duplicate orders, only the person who scanned the QR code first can place orders or view the bill for this table.</p>
        <p className="text-gray-400 text-sm mt-6 font-medium italic">Please ask your table host to place your order.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(menuItems.map(i => i.category)));

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#2A1A14] mb-2 tracking-tight">Order Placed!</h1>
        <p className="text-gray-600 mb-8 text-lg">Your order has been sent to the kitchen. We'll bring it right out to {table.name || `Table ${table.number}`}.</p>
        <button 
          onClick={() => setOrderPlaced(false)}
          className="bg-[#2A1A14] text-[#D4C1B3] px-8 py-3 rounded-full font-bold shadow-lg w-full max-w-[280px]"
        >
          Order More Items
        </button>
        <button 
          onClick={() => {
            setOrderPlaced(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="mt-4 bg-transparent border-2 border-[#2A1A14] text-[#2A1A14] px-8 py-3 rounded-full font-bold w-full max-w-[280px]"
        >
          Continue to Current Order
        </button>
      </div>
    );
  }

  if (justPaid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#2A1A14] mb-2 tracking-tight">Payment Confirmed!</h1>
        <p className="text-gray-600 mb-8 text-lg">Thank you for visiting Dream Bean Café. Have a great day!</p>
        <button 
          onClick={() => setJustPaid(false)}
          className="bg-[#2A1A14] text-[#D4C1B3] px-8 py-3 rounded-full font-bold shadow-lg"
        >
          Return to Menu
        </button>
      </div>
    );
  }
  const isAwaitingConfirmation = tableOrders.some(o => o.paymentStatus === 'awaiting_confirmation');

  return (
    <div className="min-h-screen bg-[#FCFAFA] pb-24 font-sans text-[#2A1A14]">
      {/* Header */}
      <div className="bg-[#2A1A14] text-[#D4C1B3] pt-12 pb-8 px-6 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Coffee className="w-64 h-64 -mt-10 -mr-10 transform rotate-12" />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#D4C1B3] rounded-full flex items-center justify-center">
              <Coffee className="text-[#2A1A14] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none text-white">Dream Bean</h1>
              <p className="text-sm font-medium opacity-80 tracking-widest uppercase mt-1">Café</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-white font-bold shadow-sm text-sm">
            {table.name || `Table ${table.number}`}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="px-4 mt-6">
        <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 -mx-4 px-4 snap-x">
          <div 
            onClick={() => setActiveCategory('All')}
            className={`cursor-pointer snap-start shrink-0 border shadow-sm px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === 'All' ? 'bg-[#2A1A14] text-white border-[#2A1A14]' : 'bg-white border-[#EBE2DC] text-[#2A1A14]'}`}
          >
            All
          </div>
          {categories.map((cat, i) => (
            <div 
              key={i} 
              onClick={() => setActiveCategory(cat || '')}
              className={`cursor-pointer snap-start shrink-0 border shadow-sm px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-[#2A1A14] text-white border-[#2A1A14]' : 'bg-white border-[#EBE2DC] text-[#2A1A14]'}`}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Active Orders for Table */}
      {tableOrders.length > 0 && (
        <div className="px-4 mt-6 space-y-3">
          <h2 className="font-bold text-[#2A1A14] text-lg px-1">Your Table's Orders</h2>
          {tableOrders.map(order => (
            <div key={order.id} className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-[#EBE2DC] flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm text-[#2A1A14]">{order.displayId}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  order.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                  order.status === 'preparing' ? 'bg-orange-100 text-orange-600' :
                  order.status === 'prepared' ? 'bg-yellow-100 text-yellow-600' :
                  order.status === 'served' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {order.status === 'pending' ? 'Received' : order.status}
                </span>
              </div>
              <div className="space-y-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                    <span>{item.qty}x {item.name}</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {isAwaitingConfirmation ? (
            <button
              disabled
              className="w-full mt-4 bg-[#EBE2DC] text-gray-500 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Clock className="w-5 h-5 animate-pulse" />
              Waiting for Cafe Confirmation...
            </button>
          ) : (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full mt-4 bg-[#2A1A14] text-[#D4C1B3] py-4 rounded-3xl font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Banknote className="w-5 h-5" />
              Pay Bill (₹{grandTotal.toFixed(2)})
            </button>
          )}
        </div>
      )}      {/* Menu Items */}
      <div className="px-4 mt-6 space-y-4">
        <h2 className="font-bold text-[#2A1A14] text-lg px-1">Menu</h2>
        {menuItems.filter(i => i.available && (activeCategory === 'All' || i.category === activeCategory)).map(item => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div key={item.id} className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBE2DC]/50 flex gap-4 overflow-hidden relative">
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-[17px] text-[#2A1A14] leading-tight mb-1">{item.name}</h3>
                {item.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed pr-2">{item.description}</p>}
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-extrabold text-[17px] text-[#A04010]">₹{item.price}</span>
                  
                  {cartItem ? (
                    <div className="flex items-center bg-[#F5EFEA] rounded-full p-1 border border-[#EBE2DC]">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#2A1A14]">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-[#2A1A14]">{cartItem.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-[#2A1A14] rounded-full shadow-sm text-white">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-[#2A1A14] text-white px-5 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform active:scale-95"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Floating Button */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#2A1A14] text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between group hover:bg-black transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold relative overflow-hidden">
                <ShoppingBag className="w-5 h-5 absolute group-hover:-translate-y-10 transition-transform duration-300" />
                <span className="absolute translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                  {cart.reduce((sum, i) => sum + i.qty, 0)}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm text-white/70">View Cart</span>
                <span className="font-black text-[17px]">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-[#D4C1B3] text-[#2A1A14] px-5 py-2.5 rounded-2xl font-bold flex items-center gap-1 shadow-inner">
              Checkout
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Bottom Sheet */}
      {isCartOpen && (
        <>
          <div 
            className="fixed inset-0 bg-[#2A1A14]/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setIsCartOpen(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-50 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <h2 className="text-2xl font-black text-[#2A1A14] mb-6">Your Order</h2>
            
            <div className="flex-1 overflow-y-auto mb-6 -mx-2 px-2 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#2A1A14]">{item.name}</h4>
                    <span className="text-[#A04010] font-bold text-sm">₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center bg-[#F5EFEA] rounded-full p-1 border border-[#EBE2DC]">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#2A1A14]">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-[#2A1A14]">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-[#2A1A14] rounded-full shadow-sm text-white">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-4">Your cart is empty.</p>
              )}
            </div>
            
            <div className="bg-[#FCFAFA] p-5 rounded-3xl border border-[#EBE2DC] mb-6">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xl text-[#2A1A14] pt-3 border-t border-[#EBE2DC]">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckoutClick}
              disabled={isSubmitting || cart.length === 0}
              className="w-full bg-[#A04010] text-white py-4 rounded-full font-black text-lg shadow-xl shadow-[#A04010]/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </>
      )}

      {isPaymentModalOpen && table && (
        <PaymentModal
          orderId={table.id} // using tableId as a ref for multiple orders
          displayId={table.name || `Table ${table.number}`}
          total={grandTotal}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={handleCustomerCheckout}
        />
      )}

      {/* Global hide scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      {/* Customer Info Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-2 text-[#2A1A14]">Join our Family! ☕</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your details to receive exclusive offers and personalized recommendations.</p>
            
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#A04010] transition-colors"
                  placeholder="Aapka shubh naam?"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={cPhone}
                  onChange={e => setCPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#A04010] transition-colors"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-[#2A1A14] text-white py-3 px-6 font-bold rounded-xl shadow-md hover:bg-black transition-colors"
                >
                  Save & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
