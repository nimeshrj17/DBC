import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Update NewTableCard props and click logic
bad_card_def = "const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen }: any) => {"
good_card_def = "const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign }: any) => {"
content = content.replace(bad_card_def, good_card_def)

bad_card_click = "    <div onClick={() => setSelectedTableId(table.id)} className={`bg-white rounded-2xl ${borderColor}"
good_card_click = """    <div onClick={() => {
      setSelectedTableId(table.id);
      if (isVacant && onQuickAssign) {
        onQuickAssign(table.id);
      }
    }} className={`bg-white rounded-2xl ${borderColor}"""
content = content.replace(bad_card_click, good_card_click)

# Pass onQuickAssign when rendering NewTableCard
bad_card_render_1 = """                  <NewTableCard 
                    key={table.id} 
                    table={table} 
                    orders={orders} 
                    setSelectedTableId={setSelectedTableId} 
                    onClearTable={handleClearTable}
                    setIsAddTableOpen={setIsAddTableOpen}
                  />"""
good_card_render_1 = """                  <NewTableCard 
                    key={table.id} 
                    table={table} 
                    orders={orders} 
                    setSelectedTableId={setSelectedTableId} 
                    onClearTable={handleClearTable}
                    setIsAddTableOpen={setIsAddTableOpen}
                    onQuickAssign={handleQuickAssignAndMenu}
                  />"""
content = content.replace(bad_card_render_1, good_card_render_1)

bad_card_render_2 = """                <NewTableCard 
                  key={table.id} 
                  table={table} 
                  orders={orders} 
                  setSelectedTableId={setSelectedTableId} 
                  onClearTable={handleClearTable}
                  setIsAddTableOpen={setIsAddTableOpen}
                />"""
good_card_render_2 = """                <NewTableCard 
                  key={table.id} 
                  table={table} 
                  orders={orders} 
                  setSelectedTableId={setSelectedTableId} 
                  onClearTable={handleClearTable}
                  setIsAddTableOpen={setIsAddTableOpen}
                  onQuickAssign={handleQuickAssignAndMenu}
                />"""
content = content.replace(bad_card_render_2, good_card_render_2)

# Define handleQuickAssignAndMenu inside DashboardPage
# Find where handleQuickAssign is defined
quick_assign_regex = r"(const handleQuickAssign = async \(\) => \{.*?\n  \};)"

new_methods = """  const handleQuickAssignAndMenu = async (tid: string) => {
    setIsAssigning(true);
    const finalName = 'Assigned by Admin';
    const finalPhone = '9999999999';
    try {
      await addOrUpdateCustomer(finalPhone, finalName);
      const targetTable = tables.find(t => t.id === tid);
      if (targetTable) {
         await updateTableStatus(tid, 'occupied', targetTable.activeOrderIds || []);
         await runTransaction(db, async (t) => {
           t.update(doc(db, 'tables', tid), {
             customerId: finalPhone,
             customerName: finalName
           });
         });
      }
      setIsMenuOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleQuickAssign = async () => {
    setIsAssigning(true);
    if (!selectedTable) return;
    const finalName = 'Assigned by Admin';
    const finalPhone = '9999999999';
    try {
      await addOrUpdateCustomer(finalPhone, finalName);
      await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
      await runTransaction(db, async (t) => {
        t.update(doc(db, 'tables', selectedTable.id), {
          customerId: finalPhone,
          customerName: finalName
        });
      });
      setIsMenuOpen(true); // Open menu directly
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    } finally {
      setIsAssigning(false);
    }
  };"""

content = re.sub(quick_assign_regex, new_methods, content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)

