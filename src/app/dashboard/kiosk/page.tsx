'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { useOrders } from '@/lib/hooks/useOrders';
import { useSettings } from '@/lib/hooks/useSettings';
import { ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem extends MenuItem {
  qty: number;
}

export default function KioskPage() {
  const { menuItems, loading: menuLoading } = useMenu();
  const { createOrder } = useOrders();
  const { settings } = useSettings();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  const activeMenu = menuItems.filter(item => item.available && !item.archived);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const tax = settings.taxEnabled ? subtotal * (settings.taxPercentage / 100) : 0;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!tableNumber || cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const formattedItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty
      }));

      await createOrder({
        tableId: `table-${tableNumber}`, // Virtual table binding
        tableNumber: parseInt(tableNumber) || 0,
        customerPhone: null,
        items: formattedItems,
        subtotal,
        tax,
        total,
        status: 'pending', // Goes straight to kitchen as new KOT
        paymentMethod: null,
        paymentStatus: 'unpaid'
      });

      setCart([]);
      setTableNumber('');
      setIsCheckingOut(false);
      toast.success('Order placed successfully! Please take a seat.');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please ask a staff member for assistance.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (menuLoading) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Loading Kiosk...</p></div>;
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 pb-10 max-w-[1600px] mx-auto">
      
      {/* Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-card border border-border rounded-3xl shadow-sm">
        <div className="p-6 border-b border-border bg-muted/10 shrink-0">
          <h1 className="text-2xl font-bold">Self-Service Menu</h1>
          <p className="text-sm text-muted-foreground mt-1">Tap an item to add it to your order</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-background">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeMenu.map(item => (
              <button 
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex flex-col text-left p-4 border border-border rounded-2xl hover:border-primary hover:shadow-[0_0_15px_rgba(204,255,0,0.15)] transition-all bg-card group"
              >
                <div className="w-full aspect-square bg-muted rounded-xl mb-3 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                    {item.category === 'coffee' ? '☕' : item.category === 'pastry' ? '🥐' : '🥪'}
                  </div>
                </div>
                <h3 className="font-bold line-clamp-1">{item.name}</h3>
                <p className="text-primary font-bold mt-1">₹ {item.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full md:w-96 flex flex-col shrink-0">
        <Card className="rounded-3xl border-border shadow-sm flex flex-col h-full overflow-hidden bg-card">
          <div className="p-6 border-b border-border bg-primary/5 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2 text-primary" />
              Your Order
            </h2>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold">
              {cart.reduce((sum, i) => sum + i.qty, 0)} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <ShoppingBag className="w-16 h-16 mb-4" />
                <p>Your cart is empty</p>
                <p className="text-xs mt-2">Tap items on the left to add them</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-border rounded-2xl bg-background">
                  <div className="flex-1 truncate pr-2">
                    <div className="font-bold text-sm truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground">₹ {item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-border bg-background shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax {settings.taxEnabled ? `(${settings.taxPercentage}%)` : '(Disabled)'}</span>
                <span>₹ {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border mt-2">
                <span>Total</span>
                <span>₹ {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              disabled={cart.length === 0}
              onClick={() => setIsCheckingOut(true)}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center"
            >
              Checkout <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </Card>
      </div>

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Where are you sitting?</h2>
              <p className="text-muted-foreground">Please enter your table number so we can bring your order to you.</p>
            </div>
            
            <input 
              type="number"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Table Number (e.g. 4)"
              className="w-full text-center text-4xl p-6 bg-muted/30 border-2 border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 font-bold mb-8 transition-all"
              autoFocus
            />

            <div className="flex space-x-4">
              <button 
                onClick={() => setIsCheckingOut(false)}
                className="flex-1 py-4 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!tableNumber}
                onClick={handlePlaceOrder}
                className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all disabled:opacity-50 flex justify-center items-center"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
