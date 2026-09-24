import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { useOrders } from '@/lib/hooks/useOrders';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

export function QuickSaleModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { menuItems } = useMenu();
  const { createOrder } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Phase 1: Select Item, Phase 2: Pay
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Show retail or popular quick sale items first
  const quickSaleKeywords = ['cigarette', 'lighter', 'water', 'biscuit', 'maggi', 'chai'];
  
  const filteredItems = menuItems.filter(item => {
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Default to quick sale items
    return quickSaleKeywords.some(kw => item.name.toLowerCase().includes(kw)) || item.category === 'Cigarettes';
  });

  const handleProcessPayment = async (method: 'cash' | 'upi') => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await createOrder({
        tableId: 'takeaway', 
        items: [{
           menuItemId: selectedItem.id,
           name: selectedItem.name,
           price: selectedItem.price,
           qty: 1,
           
           isRetail: selectedItem.isRetail
        }],
        total: selectedItem.price,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: method,
        customerName: 'Quick Sale',
        customerPhone: '9999999999',
        tableNumber: 0,
        subtotal: selectedItem.price,
        tax: 0
      });
      toast.success(`${selectedItem.name} sold via ${method}`);
      setSelectedItem(null);
      // We don't close the modal so they can do another quick sale immediately,
      // but they can close it if they want.
    } catch (e) {
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ⚡ Quick Retail Sale
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {selectedItem ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-6">
            <h3 className="text-2xl font-bold text-center text-gray-900">{selectedItem.name}</h3>
            <div className="text-4xl font-black text-emerald-600">₹{selectedItem.price}</div>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
              <button 
                disabled={isProcessing}
                onClick={() => handleProcessPayment('cash')}
                className="py-6 rounded-2xl font-bold text-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-2 border-emerald-200 shadow-sm transition-all"
              >
                {isProcessing ? '...' : '💵 Cash'}
              </button>
              <button 
                disabled={isProcessing}
                onClick={() => handleProcessPayment('upi')}
                className="py-6 rounded-2xl font-bold text-xl bg-purple-100 text-purple-800 hover:bg-purple-200 border-2 border-purple-200 shadow-sm transition-all"
              >
                {isProcessing ? '...' : '📱 UPI'}
              </button>
            </div>
            
            <button 
              disabled={isProcessing}
              onClick={() => setSelectedItem(null)} 
              className="mt-6 text-gray-500 font-medium hover:text-gray-900"
            >
              Cancel / Back
            </button>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search cigarettes, lighters, etc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-gray-50/50 flex-1">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-black/20 hover:shadow-md transition-all text-left flex flex-col justify-between h-28"
                >
                  <span className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight">{item.name}</span>
                  <span className="font-black text-emerald-600 mt-2">₹{item.price}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
