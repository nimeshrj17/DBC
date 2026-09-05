with open('src/components/dashboard/MenuPickerModal.tsx', 'r') as f:
    content = f.read()

# 1. Update filter logic
filter_find = """  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });"""

filter_replace = """  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });"""
content = content.replace(filter_find, filter_replace)

# 2. Update rendering from grid to list view
render_find = """            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <div key={item.id} className={`bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow ${outOfStock ? 'opacity-70' : ''}`}>
                    <div className="h-24 bg-muted flex flex-col justify-end p-3 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100">
                        <span className="text-xs font-medium">{item.category}</span>
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm leading-tight mb-1">{item.name}</h3>
                      <div className="flex justify-between items-center mt-auto pt-2">
                        <span className="font-bold text-sm tabular-nums">₹ {item.price}</span>
                        <div className="flex items-center space-x-2">
                          {qty > 0 && (
                            <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-full">
                              {qty}
                            </span>
                          )}
                          <button 
                            onClick={() => onAddItem(item)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                              (!item.available || outOfStock) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            disabled={!item.available || outOfStock}
                            title={outOfStock ? 'Out of stock' : 'Add to order'}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  No items found.
                </div>
              )}
            </div>"""

render_replace = """            <div className="flex flex-col gap-2">
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
            </div>"""

content = content.replace(render_find, render_replace)

with open('src/components/dashboard/MenuPickerModal.tsx', 'w') as f:
    f.write(content)

