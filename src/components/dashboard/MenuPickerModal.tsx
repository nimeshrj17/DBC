import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useMenu, MenuItem } from '@/lib/hooks/useMenu';
import { useInventory } from '@/lib/hooks/useInventory';
import { Button } from '@/components/ui/Button';

interface MenuPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: MenuItem) => void;
  currentDraftItems?: { menuItemId: string, qty: number }[];
}

export function MenuPickerModal({ isOpen, onClose, onAddItem, currentDraftItems = [] }: MenuPickerModalProps) {
  const { menuItems, loading: menuLoading } = useMenu();
  const { inventory, loading: invLoading } = useInventory();
  const [activeCategory, setActiveCategory] = useState<string>('Popular');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  
  const rawCats = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean);
  
  // Custom sort: Put high-frequency categories first
  const priorityOrder = ['Chai', 'Cold Coffee', 'Hot Coffee', 'Biscuits', 'Burger', 'Fast Food', 'Chai Ke Sang'];
  rawCats.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  
  const categories = ['Popular', ...rawCats];



  const popularItemKeywords = ['chai', 'cappuccino', 'cold coffee', 'oreo', 'good day', 'crack jack', 'coconut', 'burger', 'maggi'];
  
  const filteredItems = menuItems.filter(item => {
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (activeCategory === 'Popular') {
       // Show high frequency items in Popular tab
       return popularItemKeywords.some(kw => item.name.toLowerCase().includes(kw));
    }
    
    return item.category === activeCategory;
  });



  const totalCost = currentDraftItems.reduce((sum, draftItem) => {
    const mItem = menuItems.find(m => m.id === draftItem.menuItemId);
    return sum + (mItem ? mItem.price * draftItem.qty : 0);
  }, 0);
  const totalItemsCount = currentDraftItems.reduce((sum, d) => sum + d.qty, 0);

  return (
    <div className="fixed md:absolute inset-0 md:inset-y-0 md:left-0 md:right-[430px] bg-black/60 md:bg-[#F8FAFC] md:backdrop-blur-none backdrop-blur-xs flex md:items-stretch items-end justify-center z-[60] md:z-[45] md:p-0 transition-opacity">
      <div className="bg-white rounded-t-3xl md:rounded-none w-full md:max-w-none h-[94vh] md:h-full flex flex-col shadow-2xl md:shadow-none overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left md:border-r border-slate-200 duration-300">
        
        {/* Drag Handle Indicator for iOS bottom sheet feel */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" data-purpose="sheet-handle">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-start bg-white flex-shrink-0">
          <h2 className="text-xl font-bold">Add Item to Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search Header */}
        <div className="px-5 pt-3 pb-3 flex-shrink-0 border-b border-gray-100 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="search" 
              placeholder="Search menu items or codes (#G1)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Menu Layout */}
        <div className="flex flex-1 overflow-hidden bg-gray-50/50">
          
          {/* Left Sidebar - Categories */}
          <div className="w-[110px] md:w-[140px] bg-white border-r border-gray-200 overflow-y-auto hide-scrollbar flex-shrink-0">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-3 py-3.5 border-b border-gray-100 text-xs md:text-sm transition-all ${
                  activeCategory === category 
                    ? 'font-bold bg-blue-50/50 text-blue-700 border-l-4 border-l-blue-600' 
                    : 'font-medium text-gray-600 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Right Area - Grid View */}
          <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4 md:py-4">
            {menuLoading || invLoading ? (
              <div className="flex justify-center items-center h-full text-gray-500">Loading menu...</div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map(item => {
                const draftItem = currentDraftItems.find(d => d.menuItemId === item.id);
                const qty = draftItem ? draftItem.qty : 0;
                
                let outOfStock = false;
                let availableStock = Infinity;
                
                if (item.linkedInventoryId) {
                  const invItem = inventory.find(i => i.id === item.linkedInventoryId);
                  if (invItem) {
                    const requiredPerUnit = item.linkedInventoryAmount || 1;
                    const stockForThis = Math.floor(invItem.quantity / requiredPerUnit);
                    availableStock = Math.min(availableStock, stockForThis);
                  }
                }
                
                if (item.recipe && Array.isArray(item.recipe)) {
                  item.recipe.forEach((ingredient: any) => {
                    const invItem = inventory.find(i => i.id === ingredient.inventoryId);
                    if (invItem) {
                      const stockForThis = Math.floor(invItem.quantity / ingredient.amount);
                      availableStock = Math.min(availableStock, stockForThis);
                    } else {
                      availableStock = 0;
                    }
                  });
                }
                
                if (qty >= availableStock) {
                  outOfStock = true;
                }
                
              
  const totalCost = currentDraftItems.reduce((sum, draftItem) => {
    const mItem = menuItems.find(m => m.id === draftItem.menuItemId);
    return sum + (mItem ? mItem.price * draftItem.qty : 0);
  }, 0);
  const totalItemsCount = currentDraftItems.reduce((sum, d) => sum + d.qty, 0);

  return (
                  <article 
                    key={item.id} 
                    onClick={() => { if(item.available && !outOfStock) onAddItem(item); }}
                    className={`flex flex-col justify-between p-3.5 bg-white rounded-2xl border ${qty > 0 ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-200' : 'border-gray-200'} shadow-sm hover:shadow-md hover:border-black/20 transition-all cursor-pointer ${outOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''} min-h-[110px] relative`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h2 className="text-sm md:text-[15px] font-bold text-gray-900 leading-tight line-clamp-2 pr-6">{item.name}</h2>
                        {item.itemNumber && <span className="absolute top-3 right-3 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200 flex-shrink-0">#{item.itemNumber}</span>}
                      </div>
                      {(!item.available || outOfStock) && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 inline-block mt-1.5">OOS</span>}
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <p className="text-base md:text-lg font-black text-emerald-600 leading-none">₹{item.price}</p>
                      
                      <div className="flex items-center">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1.5 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                            <span className="text-xs font-bold text-blue-800">{qty} in cart</span>
                          </div>
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                            (!item.available || outOfStock) ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'
                          }`}>
                            <Plus className="w-4 h-4" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                  No items found.
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-white border-t border-gray-200 p-3 flex justify-between items-center shrink-0">
          <div>
            <span className="text-gray-500 text-sm font-medium">{totalItemsCount} items</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-900 font-bold text-lg">₹{totalCost.toFixed(2)}</span>
          </div>
          <Button onClick={onClose} className="px-8 font-bold bg-[#D2F801] text-black hover:bg-[#c2e600]">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
