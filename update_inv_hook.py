with open('src/lib/hooks/useInventory.ts', 'r') as f:
    content = f.read()

find_fn = """  const updateInventoryItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'inventory', id), updates);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  };"""

replace_fn = """  const updateInventoryItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'inventory', id), updates);
      
      // If quantity is being updated, auto-sync menu availability for 1-to-1 linked items
      if (updates.quantity !== undefined) {
        const q = query(collection(db, 'menuItems'), where('linkedInventoryId', '==', id));
        const snapshot = await getDocs(q);
        const isAvailable = updates.quantity > 0;
        
        const updatePromises = snapshot.docs.map(docSnap => 
          updateDoc(docSnap.ref, { available: isAvailable })
        );
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  };"""

content = content.replace(find_fn, replace_fn)

with open('src/lib/hooks/useInventory.ts', 'w') as f:
    f.write(content)
