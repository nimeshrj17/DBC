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
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex md:items-center items-end justify-center z-[60] md:p-4 transition-opacity">
      <div className="bg-white md:rounded-2xl rounded-t-3xl w-full max-w-4xl h-[94vh] md:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 md:animate-none">
        
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
        
        {/* Search & Categories */}
        <div className="px-5 pt-3 pb-2.5 space-y-3 flex-shrink-0 border-b border-gray-100 bg-white">
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
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full pb-1">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs transition-all ${
                  activeCategory === category 
                    ? 'font-semibold bg-[#D2F801] text-gray-900 shadow-xs border border-lime-400' 
                    : 'font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
          {menuLoading || invLoading ? (
            <div className="flex justify-center items-center h-full text-gray-500">Loading menu...</div>
          ) : (
            <div className="flex flex-col gap-3">
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
                
                return (
                  <article key={item.id} className={`flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-xs hover:border-gray-200 transition-colors ${outOfStock ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm flex-shrink-0 uppercase">
                        {item.name.substring(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-gray-900 leading-tight">{item.name}</h2>
                          {item.itemNumber && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">#{item.itemNumber}</span>}
                          {(!item.available || outOfStock) && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">OOS</span>}
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-1">₹ {item.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {qty > 0 && (
                        <span className="text-xs font-bold bg-[#D2F801]/30 text-gray-900 px-2 py-1 rounded-full">
                          {qty}
                        </span>
                      )}
                      <button 
                        onClick={() => onAddItem(item)}
                        disabled={!item.available || outOfStock}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                          (!item.available || outOfStock) ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 active:bg-blue-700 text-white shadow-sm shadow-blue-200 active:scale-90'
                        }`}
                      >
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
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
    </div>
  );
}
