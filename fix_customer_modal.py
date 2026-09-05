import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Replace form submission logic
find_submit = """            <form onSubmit={async (e) => {
              e.preventDefault();
              if (cName && cPhone) {
                try {
                  await addOrUpdateCustomer(cPhone, cName);
                  await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
                  // also update customer details in table
                  await runTransaction(db, async (t) => {
                    t.update(doc(db, 'tables', selectedTable.id), {
                      customerId: cPhone,
                      customerName: cName,
                      customerPhone: cPhone,
                      status: 'occupied'
                    });
                  });
                  setAssignCustomerModalOpen(false);
                  setCName('');
                  setCPhone('');
                } catch (err) {
                  console.error(err);
                }
              }
            }} className="space-y-4">"""

replace_submit = """            <form onSubmit={async (e) => {
              e.preventDefault();
              const finalName = cName.trim() || 'Assigned by Admin';
              const finalPhone = cPhone.trim() || '9999999999';
              try {
                await addOrUpdateCustomer(finalPhone, finalName);
                await updateTableStatus(selectedTable.id, 'occupied', selectedTable.activeOrderIds || []);
                // also update customer details in table
                await runTransaction(db, async (t) => {
                  t.update(doc(db, 'tables', selectedTable.id), {
                    customerId: finalPhone,
                    customerName: finalName,
                    customerPhone: finalPhone,
                    status: 'occupied'
                  });
                });
                setAssignCustomerModalOpen(false);
                setCName('');
                setCPhone('');
              } catch (err) {
                console.error(err);
              }
            }} className="space-y-4">"""

content = content.replace(find_submit, replace_submit)

# Remove 'required' from name input
find_name_input = """                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. John Doe"
                  required
                />"""
replace_name_input = """                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="E.g. John Doe (Optional)"
                />"""
content = content.replace(find_name_input, replace_name_input)

# Remove 'required' from phone input
find_phone_input = """                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="10-digit mobile number"
                  required
                />"""
replace_phone_input = """                  className="w-full border-2 border-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                  placeholder="10-digit mobile number (Optional)"
                />"""
content = content.replace(find_phone_input, replace_phone_input)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

