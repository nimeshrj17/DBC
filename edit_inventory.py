import re

with open('src/app/dashboard/inventory/page.tsx', 'r') as f:
    content = f.read()

# 1. Add state variables
state_vars = """  const [formData, setFormData] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  const handleEditClick = (item: InventoryItem) => {
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
  };

  const handleRestockClick = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty('');
    setRestockCost('');
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockQty) return;
    
    try {
      const addedQty = Number(restockQty);
      const addedCost = Number(restockCost) || 0;
      await updateInventoryItem(restockItem.id, {
        quantity: restockItem.quantity + addedQty,
        totalCost: restockItem.totalCost + addedCost,
        purchaseDate: Timestamp.now()
      });
      setIsRestockModalOpen(false);
      setRestockItem(null);
      toast.success("Stock added successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to restock");
    }
  };"""
content = content.replace("  const [formData, setFormData] = useState(initialForm);\n  const [searchQuery, setSearchQuery] = useState('');", state_vars)

# 2. Modify handleSubmit
handle_submit_find = """      if (formData.type === 'retail') {
        itemData.retailCategory = formData.retailCategory;
        if (formData.company) itemData.company = formData.company;
      }

      const docRef = await addInventoryItem(itemData);
      
      // The hook returns void currently! We need it to return the ID for linkage.
      // Wait, we need to update the useInventory hook to return docRef.id!
      // But assuming we will fix that next:
      if (formData.type === 'retail' && formData.publishToMenu && docRef) {
        await addMenuItem({
          name: formData.name,
          description: formData.company ? `Brand: ${formData.company}` : 'Retail product',
          price: Number(formData.sellingPrice) || 0,
          category: formData.retailCategory 
            ? formData.retailCategory.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
            : 'Retail',
          isRetail: true,
          available: true,
          linkedInventoryId: docRef,
          linkedInventoryAmount: 1,
          itemNumber: formData.itemNumber
        });
      }

      setIsAddModalOpen(false);
      setFormData({ ...initialForm, type: activeTab });
      toast.success("Inventory item added successfully");
"""

handle_submit_replace = """      if (formData.type === 'retail') {
        itemData.retailCategory = formData.retailCategory;
        if (formData.company) itemData.company = formData.company;
      }

      if (editingItemId) {
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
      } else {
        const docRef = await addInventoryItem(itemData);
        
        if (formData.type === 'retail' && formData.publishToMenu && docRef) {
          await addMenuItem({
            name: formData.name,
            description: formData.company ? `Brand: ${formData.company}` : 'Retail product',
            price: Number(formData.sellingPrice) || 0,
            category: formData.retailCategory 
              ? formData.retailCategory.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
              : 'Retail',
            isRetail: true,
            available: true,
            linkedInventoryId: docRef,
            linkedInventoryAmount: 1,
            itemNumber: formData.itemNumber
          });
        }
        toast.success("Inventory item added successfully");
      }

      setIsAddModalOpen(false);
      setEditingItemId(null);
      setFormData({ ...initialForm, type: activeTab });
"""

content = content.replace(handle_submit_find, handle_submit_replace)

# 3. Update Add Stock button
add_stock_btn_find = """          <Button 
            variant="primary" 
            className="shadow-[0_0_15px_rgba(204,255,0,0.3)] whitespace-nowrap"
            onClick={() => {
              setFormData(prev => ({ ...prev, type: activeTab }));
              setIsAddModalOpen(true);
            }}
          >"""
add_stock_btn_replace = """          <Button 
            variant="primary" 
            className="shadow-[0_0_15px_rgba(204,255,0,0.3)] whitespace-nowrap"
            onClick={() => {
              setEditingItemId(null);
              setFormData(prev => ({ ...prev, type: activeTab }));
              setIsAddModalOpen(true);
            }}
          >"""
content = content.replace(add_stock_btn_find, add_stock_btn_replace)

# 4. Update actions column
actions_col_find = """                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-1 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </td>"""
actions_col_replace = """                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right space-x-1">
                    <button 
                      onClick={() => handleRestockClick(item)}
                      className="text-green-600 hover:text-green-800 p-1 md:p-2 rounded-full hover:bg-green-50 transition-colors"
                      title="Add Stock (Restock)"
                    >
                      <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="text-blue-500 hover:text-blue-700 p-1 md:p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Edit Item Details"
                    >
                      <Edit className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-1 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </td>"""
content = content.replace(actions_col_find, actions_col_replace)

# 5. Add Restock Modal and change title
title_find = """<h2 className="text-xl font-bold">Add {formData.type === 'raw' ? 'Raw Material' : 'Retail Product'}</h2>"""
title_replace = """<h2 className="text-xl font-bold">{editingItemId ? 'Edit' : 'Add'} {formData.type === 'raw' ? 'Raw Material' : 'Retail Product'}</h2>"""
content = content.replace(title_find, title_replace)

restock_modal = """      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-xl font-bold">Restock {restockItem.name}</h2>
              <button onClick={() => setIsRestockModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4 bg-background">
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantity to Add ({restockItem.unit}) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="any"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-2"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Cost of New Stock (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-2"
                  placeholder="e.g. 500"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsRestockModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Add Stock</Button>
              </div>
            </form>
          </div>
        </div>
      )}"""

content = content.replace("    </div>\n  );\n}", f"    </div>\n{restock_modal}\n  );\n}}")

with open('src/app/dashboard/inventory/page.tsx', 'w') as f:
    f.write(content)

