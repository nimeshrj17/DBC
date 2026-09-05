'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, MoreHorizontal, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMenu } from '@/lib/hooks/useMenu';
import { useInventory } from '@/lib/hooks/useInventory';


export default function MenuPage() {
  const { menuItems, loading, addMenuItem, deleteMenuItem, updateMenuItem } = useMenu();
  const { inventory: inventoryItems } = useInventory();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add/Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    isRetail: false,
    linkedInventoryId: '',
    linkedInventoryAmount: '',
    recipe: [] as { inventoryId: string, amount: number }[]
  });

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingItemId(null);
    setFormData({ name: '', description: '', price: '', category: '', available: true, isRetail: false, linkedInventoryId: '', linkedInventoryAmount: '', recipe: [] });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItemId(item.id);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      category: item.category || '',
      available: item.available ?? true,
      isRetail: item.isRetail || false,
      linkedInventoryId: item.linkedInventoryId || '',
      linkedInventoryAmount: item.linkedInventoryAmount?.toString() || '',
      recipe: item.recipe || []
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) return;
    
    setIsSubmitting(true);
    const itemData: any = {
      name: formData.name,
      description: formData.description || '',
      price: Number(formData.price),
      category: formData.category,
      available: formData.available,
      isRetail: formData.isRetail,
      recipe: formData.recipe
    };

    if (formData.linkedInventoryId && formData.linkedInventoryAmount) {
      itemData.linkedInventoryId = formData.linkedInventoryId;
      itemData.linkedInventoryAmount = Number(formData.linkedInventoryAmount);
    } else {
      itemData.linkedInventoryId = null;
      itemData.linkedInventoryAmount = null;
    }

    try {
      if (editingItemId) {
        await updateMenuItem(editingItemId, itemData);
      } else {
        await addMenuItem(itemData);
      }
      setIsAddModalOpen(false);
      toast.success(editingItemId ? "Menu item updated successfully" : "Menu item added successfully");
    } catch (error) {
      console.error(error);
      toast.error(editingItemId ? "Failed to update menu item" : "Failed to add menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Manage your cafe's offerings.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">

          <Button 
            variant="primary" 
            className="shadow-[0_0_15px_rgba(204,255,0,0.3)] whitespace-nowrap"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2 w-full md:w-auto">
          {categories.map(category => (
            <button 
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search menu items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredItems.map(item => (
          <Card key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center border-border shadow-sm group p-4 ${!item.available && 'opacity-70'}`}>
             <div className="flex items-center w-full sm:w-auto flex-1 min-w-0 pr-4 mb-4 sm:mb-0">
               <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mr-4 flex-shrink-0">
                 <span className="text-[10px] font-medium text-center leading-tight">{item.category.split(' ').map(w => w[0]).join('')}</span>
               </div>
               
               <div className="flex-1 min-w-0">
                 <div className="flex items-center flex-wrap gap-2 mb-1">
                   <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
                   {item.itemNumber && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">#{item.itemNumber}</span>}
                   {(!item.recipe || item.recipe.length === 0) && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                        No Recipe
                      </span>
                   )}
                 </div>
                 <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
               </div>
             </div>
             
             <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
               <div className="flex items-center gap-3">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {item.available ? 'Available' : 'Out of Stock'}
                 </span>
                 <div className="font-black text-xl w-24 text-right tabular-nums">₹{item.price}</div>
               </div>
               <div className="flex items-center gap-2">
                 <Button size="sm" variant="outline" className="h-9 w-9 rounded-lg" onClick={() => handleOpenEdit(item)} title="Edit item">
                   <Edit2 className="w-4 h-4" />
                 </Button>
                 <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this item?')) {
                        deleteMenuItem(item.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <X className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-2xl bg-card">
            <p className="text-muted-foreground mb-2">No menu items found.</p>
            <Button onClick={handleOpenAdd}>Add an item</Button>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-xl font-bold">{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-background">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Iced Latte"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Beverages"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
                  placeholder="Brief description of the item..."
                />
              </div>

              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Recipe / Bill of Materials</label>
                  <p className="text-xs text-muted-foreground">Link raw materials to automatically deduct stock when ordered.</p>
                </div>
                
                {formData.recipe.map((ingredient, index) => {
                  const invItem = inventoryItems?.find(i => i.id === ingredient.inventoryId);
                  return (
                    <div key={index} className="flex flex-col gap-3 bg-background p-3 rounded-lg border border-border shadow-sm">
                      <select
                        value={ingredient.inventoryId}
                        onChange={(e) => {
                          const newRecipe = [...formData.recipe];
                          newRecipe[index].inventoryId = e.target.value;
                          setFormData({...formData, recipe: newRecipe});
                        }}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select ingredient...</option>
                        {inventoryItems?.map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} ({inv.quantity} {inv.unit} in stock)
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex items-center justify-between gap-2 bg-muted/20 p-2 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap pl-1">Uses:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ingredient.amount || ''}
                            onChange={(e) => {
                              const newRecipe = [...formData.recipe];
                              newRecipe[index].amount = Number(e.target.value);
                              setFormData({...formData, recipe: newRecipe});
                            }}
                            className="w-24 px-3 py-1.5 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-medium"
                            placeholder="Qty"
                          />
                          <span className="text-sm font-medium text-foreground whitespace-nowrap pr-2">
                            {invItem?.unit || 'units'}
                          </span>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => {
                            const newRecipe = formData.recipe.filter((_, i) => i !== index);
                            setFormData({...formData, recipe: newRecipe});
                          }}
                          className="flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-100"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData, 
                      recipe: [...formData.recipe, { inventoryId: '', amount: 1 }]
                    });
                  }}
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Ingredient
                </Button>
              </div>
              
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                  />
                  <label htmlFor="available" className="text-sm font-medium cursor-pointer select-none">Currently Available (In Stock)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isRetail"
                    checked={formData.isRetail}
                    onChange={(e) => setFormData({...formData, isRetail: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
                  />
                  <label htmlFor="isRetail" className="text-sm font-medium cursor-pointer select-none text-orange-600">Retail Item (Bypasses Kitchen)</label>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingItemId ? 'Save Changes' : 'Add Item')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
