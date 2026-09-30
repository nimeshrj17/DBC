import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

old_filter = """      const retailItems = currentDraftItems.filter(i => i.isRetail || i.category === 'Retail');
      const kitchenItems = currentDraftItems.filter(i => !i.isRetail && i.category !== 'Retail');"""

new_filter = """      // Fallback: Chai is at the front counter, so treat it like retail (skip kitchen/KOT, mark as served immediately)
      const isFrontCounterItem = (i: any) => i.isRetail || i.category === 'Retail' || i.category?.toLowerCase() === 'chai' || i.category?.toLowerCase() === 'chai ke sang';
      const retailItems = currentDraftItems.filter(isFrontCounterItem);
      const kitchenItems = currentDraftItems.filter(i => !isFrontCounterItem(i));"""

content = content.replace(old_filter, new_filter)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
