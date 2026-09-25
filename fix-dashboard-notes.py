import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update combinedItemsMap grouping
old_map_logic = """  const combinedItemsMap = new Map<string, OrderItem & { isDraft: boolean }>();
  
  // Process sent items
  activeOrders.flatMap(o => o.items).forEach(item => {
    if (combinedItemsMap.has(item.menuItemId)) {
      const existing = combinedItemsMap.get(item.menuItemId)!;
      combinedItemsMap.set(item.menuItemId, { ...existing, qty: existing.qty + item.qty });
    } else {
      combinedItemsMap.set(item.menuItemId, { ...item, isDraft: false });
    }
  });

  // Process draft items
  currentDraftItems.forEach(item => {
    if (combinedItemsMap.has(item.menuItemId)) {
      const existing = combinedItemsMap.get(item.menuItemId)!;
      combinedItemsMap.set(item.menuItemId, { ...existing, qty: existing.qty + item.qty, isDraft: true });
    } else {
      combinedItemsMap.set(item.menuItemId, { ...item, isDraft: true });
    }
  });"""

new_map_logic = """  const combinedItemsMap = new Map<string, OrderItem & { isDraft: boolean, mapKey: string }>();
  
  // Process sent items
  activeOrders.flatMap(o => o.items).forEach(item => {
    const key = `${item.menuItemId}-${item.notes || ''}`;
    if (combinedItemsMap.has(key)) {
      const existing = combinedItemsMap.get(key)!;
      combinedItemsMap.set(key, { ...existing, qty: existing.qty + item.qty });
    } else {
      combinedItemsMap.set(key, { ...item, isDraft: false, mapKey: key });
    }
  });

  // Process draft items
  currentDraftItems.forEach(item => {
    const key = `${item.menuItemId}-${item.notes || ''}`;
    if (combinedItemsMap.has(key)) {
      const existing = combinedItemsMap.get(key)!;
      combinedItemsMap.set(key, { ...existing, qty: existing.qty + item.qty, isDraft: true });
    } else {
      combinedItemsMap.set(key, { ...item, isDraft: true, mapKey: key });
    }
  });"""

content = content.replace(old_map_logic, new_map_logic)

# 2. Update displayItems mapping key and render notes
old_render = """<div className="space-y-2">
                      {displayItems.map((item) => (
                        <div key={item.menuItemId} className={`flex items-center justify-between p-3 bg-white border rounded-xl shadow-xs transition-colors ${item.isDraft ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                              {item.isDraft && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">NEW</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">₹ {item.price}</p>
                          </div>"""

new_render = """<div className="space-y-2">
                      {displayItems.map((item) => (
                        <div key={item.mapKey} className={`flex items-center justify-between p-3 bg-white border rounded-xl shadow-xs transition-colors ${item.isDraft ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-sm text-slate-800">{item.name}</p>
                              {item.isDraft && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">NEW</span>}
                            </div>
                            {item.notes && <p className="text-[11px] text-amber-600 font-semibold italic mt-0.5 leading-snug break-words pr-2">Note: {item.notes}</p>}
                            <p className="text-xs text-slate-500 mt-0.5">₹ {item.price}</p>
                          </div>"""
content = content.replace(old_render, new_render)


# 3. Update removeSentItemTransaction arguments and use case in page.tsx
# In page.tsx:
# <button disabled={isRemoving} onClick={() => handleRemoveSentItem(item.menuItemId)}
old_remove = """<button disabled={isRemoving} onClick={() => handleRemoveSentItem(item.menuItemId)}"""
new_remove = """<button disabled={isRemoving} onClick={() => handleRemoveSentItem(item.menuItemId, item.notes)}"""
content = content.replace(old_remove, new_remove)

old_handle = """  const handleRemoveSentItem = async (menuItemId: string) => {
    if (!selectedTable || isRemoving) return;
    
    if (!hasPermission('edit_placed_orders')) {
        toast.error("You do not have permission to deduct placed items.");
        return;
    }
    
    // Find the order that has this item. Prefer newest orders first.
    const tblOrders = orders.filter(o => selectedTable.activeOrderIds?.includes(o.id)).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    const targetOrder = tblOrders.find(o => o.items.some(i => i.menuItemId === menuItemId));
    
    if (!targetOrder) return;
    
    setIsRemoving(true);
    try {
      await removeSentItemTransaction(targetOrder.id, menuItemId, settings.taxEnabled ? settings.taxPercentage : 0);"""

new_handle = """  const handleRemoveSentItem = async (menuItemId: string, notes?: string) => {
    if (!selectedTable || isRemoving) return;
    
    if (!hasPermission('edit_placed_orders')) {
        toast.error("You do not have permission to deduct placed items.");
        return;
    }
    
    // Find the order that has this item. Prefer newest orders first.
    const tblOrders = orders.filter(o => selectedTable.activeOrderIds?.includes(o.id)).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    const targetOrder = tblOrders.find(o => o.items.some(i => i.menuItemId === menuItemId && (i.notes || '') === (notes || '')));
    
    if (!targetOrder) return;
    
    setIsRemoving(true);
    try {
      await removeSentItemTransaction(targetOrder.id, menuItemId, settings.taxEnabled ? settings.taxPercentage : 0, notes);"""
content = content.replace(old_handle, new_handle)

with open(filepath, "w") as f:
    f.write(content)

