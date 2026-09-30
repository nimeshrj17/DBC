import re

with open('src/app/dashboard/kiosk/page.tsx', 'r') as f:
    content = f.read()

old_format = """      const formattedItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty
      }));

      await createOrder({
        tableId: `table-${tableNumber}`, // Virtual table binding
        tableNumber: parseInt(tableNumber) || 0,
        customerPhone: null,
        items: formattedItems,
        subtotal,
        tax,
        total,
        status: 'pending', // Goes straight to kitchen as new KOT
        paymentMethod: null,
        paymentStatus: 'unpaid'
      });"""

new_format = """      // Fallback: Separate front-counter items (Chai/Retail) from kitchen items
      const isFrontCounterItem = (i: any) => i.isRetail || i.category === 'Retail' || i.category?.toLowerCase() === 'chai' || i.category?.toLowerCase() === 'chai ke sang';
      
      const kitchenItems: any[] = [];
      const retailItems: any[] = [];
      
      cart.forEach(item => {
        const formatted = {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          category: item.category,
          isRetail: item.isRetail
        };
        if (isFrontCounterItem(item)) {
          retailItems.push(formatted);
        } else {
          kitchenItems.push(formatted);
        }
      });

      if (kitchenItems.length > 0) {
        const kSub = kitchenItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const kTax = settings.taxEnabled ? kSub * (settings.taxPercentage / 100) : 0;
        await createOrder({
          tableId: `table-${tableNumber}`,
          tableNumber: parseInt(tableNumber) || 0,
          customerPhone: null,
          items: kitchenItems,
          subtotal: kSub,
          tax: kTax,
          total: kSub + kTax,
          status: 'pending',
          paymentMethod: null,
          paymentStatus: 'unpaid'
        });
      }

      if (retailItems.length > 0) {
        const rSub = retailItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const rTax = settings.taxEnabled ? rSub * (settings.taxPercentage / 100) : 0;
        await createOrder({
          tableId: `table-${tableNumber}`,
          tableNumber: parseInt(tableNumber) || 0,
          customerPhone: null,
          items: retailItems,
          subtotal: rSub,
          tax: rTax,
          total: rSub + rTax,
          status: 'pending', // Keeps it active to ring the alarm
          paymentMethod: null,
          paymentStatus: 'unpaid'
        });
      }"""

content = content.replace(old_format, new_format)

with open('src/app/dashboard/kiosk/page.tsx', 'w') as f:
    f.write(content)
