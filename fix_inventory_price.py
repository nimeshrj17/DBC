with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

# 1. Import updateMenuItem and menuItems
content = content.replace("const { addMenuItem } = useMenu();", "const { menuItems, addMenuItem, updateMenuItem } = useMenu();")

# 2. Update handleEditClick
find_handle_edit = """  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormData({
      ...initialForm,
      name: item.name,
      itemNumber: item.itemNumber || '',
      type: item.type,
      quantity: item.quantity.toString(),
      unit: item.unit,
      totalCost: item.totalCost.toString(),
      company: item.company || '',
      retailCategory: item.retailCategory || 'other',
    });
    setIsAddModalOpen(true);
  };"""

replace_handle_edit = """  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    const linkedMenu = menuItems.find(m => m.linkedInventoryId === item.id);
    setFormData({
      ...initialForm,
      name: item.name,
      itemNumber: item.itemNumber || '',
      type: item.type,
      quantity: item.quantity.toString(),
      unit: item.unit,
      totalCost: item.totalCost.toString(),
      company: item.company || '',
      retailCategory: item.retailCategory || 'other',
      sellingPrice: linkedMenu ? linkedMenu.price.toString() : ''
    });
    setIsAddModalOpen(true);
  };"""

content = content.replace(find_handle_edit, replace_handle_edit)

# 3. Update handleSubmit
find_submit = """      if (editingItemId) {
        await updateInventoryItem(editingItemId, {
          name: itemData.name,
          type: itemData.type,
          quantity: itemData.quantity,
          unit: itemData.unit,
          totalCost: itemData.totalCost,
          itemNumber: itemData.itemNumber,
          retailCategory: itemData.retailCategory,
          company: itemData.company,
        });
        toast.success("Inventory item updated successfully");
      } else {"""

replace_submit = """      if (editingItemId) {
        await updateInventoryItem(editingItemId, {
          name: itemData.name,
          type: itemData.type,
          quantity: itemData.quantity,
          unit: itemData.unit,
          totalCost: itemData.totalCost,
          itemNumber: itemData.itemNumber,
          retailCategory: itemData.retailCategory,
          company: itemData.company,
        });
        
        // Sync the updated name, category, and selling price to the linked menu item if it's retail
        if (itemData.type === 'retail') {
          const linkedMenu = menuItems.find(m => m.linkedInventoryId === editingItemId);
          if (linkedMenu) {
            await updateMenuItem(linkedMenu.id, {
              name: itemData.name,
              price: Number(formData.sellingPrice) || 0,
              description: itemData.company ? `Brand: ${itemData.company}` : 'Retail product',
              category: itemData.retailCategory 
                ? itemData.retailCategory.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
                : 'Other'
            });
          }
        }
        
        toast.success("Inventory item updated successfully");
      } else {"""

content = content.replace(find_submit, replace_submit)

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)
