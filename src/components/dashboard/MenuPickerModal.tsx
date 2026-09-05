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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-xl font-bold">Add Item to Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search & Categories */}
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search menu items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-2 w-full">
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-muted-foreground border border-border hover:bg-muted'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {menuLoading || invLoading ? (
            <div className="flex justify-center items-center h-full text-muted-foreground">Loading menu...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredItems.map(item => {
                const draftItem = currentDraftItems.find(d => d.menuItemId === item.id);
                const qty = draftItem ? draftItem.qty : 0;
                
                // Determine stock limits
                let outOfStock = false;
                let availableStock = Infinity;
                
                // Check legacy link
                if (item.linkedInventoryId) {
                  const invItem = inventory.find(i => i.id === item.linkedInventoryId);
                  if (invItem) {
                    const requiredPerUnit = item.linkedInventoryAmount || 1;
                    const stockForThis = Math.floor(invItem.quantity / requiredPerUnit);
                    availableStock = Math.min(availableStock, stockForThis);
                  }
                }
                
                // Check BOM recipe
                if (item.recipe && Array.isArray(item.recipe)) {
                  item.recipe.forEach((ingredient: any) => {
                    const invItem = inventory.find(i => i.id === ingredient.inventoryId);
                    if (invItem) {
                      const stockForThis = Math.floor(invItem.quantity / ingredient.amount);
                      availableStock = Math.min(availableStock, stockForThis);
                    } else {
                      // If ingredient doesn't exist, technically it's out of stock
                      availableStock = 0;
                    }
                  });
                }
                
                if (qty >= availableStock) {
                  outOfStock = true;
                }
                
                return (
                  <div key={item.id} className={`bg-card border border-border rounded-xl overflow-hidden flex flex-row items-center p-3 hover:shadow-md transition-shadow ${outOfStock ? 'opacity-70' : ''}`}>
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mr-3 flex-shrink-0">
                      <span className="text-[9px] font-medium text-center leading-tight">{item.category.split(' ').map(w => w[0]).join('')}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-sm leading-tight truncate">{item.name}</h3>
                        {item.itemNumber && <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-md">#{item.itemNumber}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tabular-nums">₹ {item.price}</span>
                        {(!item.available || outOfStock) && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Out of Stock</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      {qty > 0 && (
                        <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {qty}
                        </span>
                      )}
                      <button 
                        onClick={() => onAddItem(item)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                          (!item.available || outOfStock) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        disabled={!item.available || outOfStock}
                        title={outOfStock ? 'Out of stock' : 'Add to order'}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
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
