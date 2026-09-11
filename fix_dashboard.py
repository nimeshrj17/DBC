with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Add removeSentItemTransaction to useOrders hook destructuring
content = content.replace(
    "const { orders, loading: ordersLoading, createOrder, updateOrder, updateOrderStatus } = useOrders();",
    "const { orders, loading: ordersLoading, createOrder, updateOrder, updateOrderStatus, removeSentItemTransaction } = useOrders();"
)

# Add isRemoving state
content = content.replace(
    "const [isClearing, setIsClearing] = useState(false);",
    "const [isClearing, setIsClearing] = useState(false);\n  const [isRemoving, setIsRemoving] = useState(false);"
)

# Add handleRemoveSentItem function
handle_func = """
  const handleRemoveSentItem = async (menuItemId: string) => {
    if (!selectedTable || isRemoving) return;
    
    // Find the order that has this item. Prefer newest orders first.
    const tblOrders = orders.filter(o => selectedTable.activeOrderIds?.includes(o.id)).sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    const targetOrder = tblOrders.find(o => o.items.some(i => i.menuItemId === menuItemId));
    
    if (!targetOrder) return;
    
    setIsRemoving(true);
    try {
      await removeSentItemTransaction(targetOrder.id, menuItemId, settings.taxEnabled ? settings.taxPercentage : 0);
      toast.success("Item quantity reduced");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reduce item quantity");
    } finally {
      setIsRemoving(false);
    }
  };
"""

content = content.replace("const currentDraftItems = selectedTable ?", handle_func + "\n  const currentDraftItems = selectedTable ?")

# Replace rendering
find_render = """                      {item.isDraft ? (
                        <div className="flex items-center space-x-3 bg-background rounded-lg p-1 border border-border shadow-sm">
                          <button onClick={() => updateDraftItemQty(item.menuItemId, -1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Minus className="w-3 h-3" /></button>
                          <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateDraftItemQty(item.menuItemId, 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <span className="font-medium text-sm px-3">{item.qty}</span>
                      )}"""

replace_render = """                      {item.isDraft ? (
                        <div className="flex items-center space-x-3 bg-background rounded-lg p-1 border border-border shadow-sm">
                          <button onClick={() => updateDraftItemQty(item.menuItemId, -1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Minus className="w-3 h-3" /></button>
                          <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateDraftItemQty(item.menuItemId, 1)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-muted rounded"><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 bg-background rounded-lg p-1 border border-border shadow-sm opacity-80">
                          <button disabled={isRemoving} onClick={() => handleRemoveSentItem(item.menuItemId)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded disabled:opacity-50"><Minus className="w-3 h-3" /></button>
                          <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                          <div className="w-6 h-6"></div> {/* Empty space to keep alignment */}
                        </div>
                      )}"""

content = content.replace(find_render, replace_render)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

