with open('src/lib/hooks/useTables.ts', 'r') as f:
    content = f.read()

transfer_fn = """  const transferTable = async (fromTableId: string, toTableId: string, activeOrderIds: string[]) => {
    try {
      // We will do a batch update for atomicity
      const batch = writeBatch(db);
      
      const fromTableRef = doc(db, 'tables', fromTableId);
      const toTableRef = doc(db, 'tables', toTableId);
      
      const fromTable = tables.find(t => t.id === fromTableId);
      if (!fromTable) throw new Error("Source table not found");
      
      // Update new table
      batch.update(toTableRef, {
        status: fromTable.status,
        activeOrderIds: fromTable.activeOrderIds,
        customerName: fromTable.customerName || null,
        customerPhone: fromTable.customerPhone || null,
        customerId: fromTable.customerId || null,
        currentSessionId: fromTable.currentSessionId || null,
      });
      
      // Clear old table
      batch.update(fromTableRef, {
        status: 'empty',
        activeOrderIds: [],
        customerName: null,
        customerPhone: null,
        customerId: null,
        currentSessionId: null
      });
      
      // Update tableId in all active orders
      activeOrderIds.forEach(orderId => {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { tableId: toTableId });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error transferring table:", error);
      throw error;
    }
  };
"""

content = content.replace("const updateTableStatus = async", transfer_fn + "\n  const updateTableStatus = async")
content = content.replace("return { tables, loading, addTable, updateTableStatus, assignCustomer };", "return { tables, loading, addTable, updateTableStatus, assignCustomer, transferTable };")

# Need to import writeBatch
if "writeBatch" not in content:
    content = content.replace("updateDoc", "updateDoc, writeBatch")

with open('src/lib/hooks/useTables.ts', 'w') as f:
    f.write(content)
