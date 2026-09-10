with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

find_handle_edit = """  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    const linkedMenu = menuItems.find(m => m.linkedInventoryId === item.id);
    setFormData({"""

replace_handle_edit = """  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    let linkedMenu = menuItems.find(m => m.linkedInventoryId === item.id);
    if (!linkedMenu && item.type === 'retail') {
      linkedMenu = menuItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
    }
    setFormData({"""

content = content.replace(find_handle_edit, replace_handle_edit)

find_submit = """        // Sync the updated name, category, and selling price to the linked menu item if it's retail
        if (itemData.type === 'retail') {
          const linkedMenu = menuItems.find(m => m.linkedInventoryId === editingItemId);
          if (linkedMenu) {
            await updateMenuItem(linkedMenu.id, {"""

replace_submit = """        // Sync the updated name, category, and selling price to the linked menu item if it's retail
        if (itemData.type === 'retail') {
          let linkedMenu = menuItems.find(m => m.linkedInventoryId === editingItemId);
          if (!linkedMenu) {
            const originalItem = inventory.find(i => i.id === editingItemId);
            if (originalItem) {
              linkedMenu = menuItems.find(m => m.name.toLowerCase() === originalItem.name.toLowerCase());
            }
          }
          if (linkedMenu) {
            await updateMenuItem(linkedMenu.id, {
              linkedInventoryId: editingItemId,
              linkedInventoryAmount: 1,"""

content = content.replace(find_submit, replace_submit)

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)

