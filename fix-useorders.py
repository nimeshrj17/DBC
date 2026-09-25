import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useOrders.ts"
with open(filepath, "r") as f:
    content = f.read()

old_func = """    const removeSentItemTransaction = async (orderId: string, menuItemId: string, taxPercentage: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get the order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        
        const orderData = orderSnap.data() as Order;
        
        // 2. Find the item
        const itemIndex = orderData.items.findIndex(i => i.menuItemId === menuItemId);"""

new_func = """    const removeSentItemTransaction = async (orderId: string, menuItemId: string, taxPercentage: number, notes?: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get the order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        
        const orderData = orderSnap.data() as Order;
        
        // 2. Find the item
        const itemIndex = orderData.items.findIndex(i => i.menuItemId === menuItemId && (i.notes || '') === (notes || ''));"""

content = content.replace(old_func, new_func)

with open(filepath, "w") as f:
    f.write(content)
