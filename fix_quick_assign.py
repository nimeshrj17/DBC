with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

find_fn = """  const handleRejectCustomerPayment = async (groupOrders: typeof orders) => {"""

replace_fn = """  const handleQuickAssign = async () => {
    if (!selectedTable) return;
    const finalName = 'Assigned by Admin';
    const finalPhone = '9999999999';
    try {
      await addOrUpdateCustomer(finalPhone, finalName);
      await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
      await runTransaction(db, async (t) => {
        t.update(doc(db, 'tables', selectedTable.id), {
          customerId: finalPhone,
          customerName: finalName,
          customerPhone: finalPhone,
          status: 'occupied'
        });
      });
      toast.success("Table marked as occupied");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign table");
    }
  };

  const handleRejectCustomerPayment = async (groupOrders: typeof orders) => {"""
content = content.replace(find_fn, replace_fn)

find_btn = """<p>Table is currently empty.</p>
                <Button variant="primary" className="w-full max-w-[250px]" onClick={() => setAssignCustomerModalOpen(true)}>Mark Occupied & Add Customer</Button>"""

replace_btn = """<p>Table is currently empty.</p>
                <div className="flex flex-col gap-3 w-full max-w-[250px]">
                  <Button variant="primary" className="w-full" onClick={handleQuickAssign}>Quick Assign (Skip Details)</Button>
                  <Button variant="outline" className="w-full" onClick={() => setAssignCustomerModalOpen(true)}>Add Customer Details</Button>
                </div>"""
content = content.replace(find_btn, replace_btn)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
