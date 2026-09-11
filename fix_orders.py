with open('src/lib/hooks/useOrders.ts', 'r') as f:
    content = f.read()

new_function = """  const removeSentItemTransaction = async (orderId: string, menuItemId: string, taxPercentage: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get the order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        
        const orderData = orderSnap.data() as Order;
        
        // 2. Find the item
        const itemIndex = orderData.items.findIndex(i => i.menuItemId === menuItemId);
        if (itemIndex === -1) throw new Error("Item not in order");
        
        const itemToRemove = orderData.items[itemIndex];
        
        // 3. Get the menu item to find inventory links
        const menuRef = doc(db, 'menuItems', menuItemId);
        const menuSnap = await transaction.get(menuRef);
        
        // 4. Update the order
        const newItems = [...orderData.items];
        if (itemToRemove.qty > 1) {
          newItems[itemIndex] = { ...itemToRemove, qty: itemToRemove.qty - 1 };
        } else {
          newItems.splice(itemIndex, 1);
        }
        
        const newSubtotal = newItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
        const newTax = taxPercentage > 0 ? newSubtotal * (taxPercentage / 100) : 0;
        const newTotal = newSubtotal + newTax;
        
        transaction.update(orderRef, {
          items: newItems,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          updatedAt: serverTimestamp()
        });
        
        // 5. Restore inventory if linked
        if (menuSnap.exists()) {
          const menuData = menuSnap.data();
          const inventoryAdditions: Record<string, number> = {};
          
          if (menuData.linkedInventoryId && menuData.linkedInventoryAmount) {
            inventoryAdditions[menuData.linkedInventoryId] = menuData.linkedInventoryAmount; // Restore 1 unit qty's worth
          }
          if (menuData.recipe && Array.isArray(menuData.recipe)) {
            menuData.recipe.forEach((ing: any) => {
              if (inventoryAdditions[ing.inventoryId]) {
                inventoryAdditions[ing.inventoryId] += ing.amount;
              } else {
                inventoryAdditions[ing.inventoryId] = ing.amount;
              }
            });
          }
          
          // PRE-READ ALL
          const invKeys = Object.keys(inventoryAdditions);
          if (invKeys.length > 0) {
            const invRefs = invKeys.map(k => doc(db, 'inventory', k));
            const invSnaps = await Promise.all(invRefs.map(r => transaction.get(r)));
            
            invSnaps.forEach((invSnap, idx) => {
              if (invSnap.exists()) {
                const k = invKeys[idx];
                const currentQty = invSnap.data().quantity || 0;
                const toRestore = inventoryAdditions[k];
                transaction.update(invSnap.ref, { quantity: currentQty + toRestore });
                
                // If it was 0 or negative and now positive, maybe set available: true
                if (currentQty <= 0 && currentQty + toRestore > 0) {
                   // Optional: flip menu item availability. We'll skip for safety as another transaction might be needed
                   transaction.update(menuRef, { available: true });
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error("Error removing sent item:", error);
      throw error;
    }
  };

"""

# Insert it right before "return { orders, loading, createOrder"
content = content.replace("return { orders, loading, createOrder,", new_function + "  return { orders, loading, createOrder, removeSentItemTransaction,")

with open('src/lib/hooks/useOrders.ts', 'w') as f:
    f.write(content)
