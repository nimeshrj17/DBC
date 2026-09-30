import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

old_func = """  const handleMarkTableServed = async (tableId: string, orderIds: string[]) => {
    if (!tableId || !orderIds || orderIds.length === 0) return;
    try {
      await Promise.all(orderIds.map(oId => updateOrderStatus(oId, 'served')));
      await updateTableStatus(tableId, 'served', orderIds);
      toast.success("Marked as served");"""

new_func = """  const handleMarkTableServed = async (tableId: string, orderIds: string[]) => {
    if (!tableId || !orderIds || orderIds.length === 0) return;
    try {
      await Promise.all(orderIds.map(oId => updateOrderStatus(oId, 'served')));
      
      // Determine what the table's overall status should be now
      const table = tables.find(t => t.id === tableId);
      if (table && table.activeOrderIds) {
        // Find all active orders for this table
        const tblOrders = orders.filter(o => table.activeOrderIds?.includes(o.id));
        // Check if any order is STILL pending/preparing (excluding the ones we just served)
        const hasPreparing = tblOrders.some(o => 
          !orderIds.includes(o.id) && (o.status === 'pending' || o.status === 'preparing')
        );
        const newStatus = hasPreparing ? 'preparing' : 'served';
        
        // CRITICAL FIX: Do NOT pass orderIds as the 3rd parameter.
        // It overwrites the table's activeOrderIds with just the subset, causing other orders to detach and disappear!
        await updateTableStatus(tableId, newStatus);
      }
      
      toast.success("Marked as served");"""

content = content.replace(old_func, new_func)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
