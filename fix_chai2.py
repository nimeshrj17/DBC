import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

old_filter = """      const retailItems = currentDraftItems.filter(i => i.isRetail || i.category === 'Retail');
      const kitchenItems = currentDraftItems.filter(i => !i.isRetail && i.category !== 'Retail');"""

new_filter = """      // Split Chai items into a separate order so they can be managed/marked served independently at the front counter
      const isFrontCounterItem = (i: any) => i.isRetail || i.category === 'Retail' || i.category?.toLowerCase() === 'chai' || i.category?.toLowerCase() === 'chai ke sang';
      const retailItems = currentDraftItems.filter(isFrontCounterItem);
      const kitchenItems = currentDraftItems.filter(i => !isFrontCounterItem(i));"""

content = content.replace(old_filter, new_filter)

# For retail items, the status is hardcoded to 'served' previously. I need to change it to 'preparing' (or 'pending').
old_retail_status = """          items: retailItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'served',
          paymentMethod: null,"""

new_retail_status = """          items: retailItems,
          subtotal: sub,
          tax: t,
          total: sub + t,
          status: 'preparing', // Keeps it active for the front counter to serve
          paymentMethod: null,"""

content = content.replace(old_retail_status, new_retail_status)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
