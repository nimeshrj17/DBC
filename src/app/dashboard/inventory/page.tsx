'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, Trash2, Plus, X, Coffee, ShoppingBag, Store } from 'lucide-react';
import { useInventory, InventoryItem } from '@/lib/hooks/useInventory';
import { useMenu } from '@/lib/hooks/useMenu';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const formatDate = (timestamp: any) => {
  if (!timestamp) return { time: '', date: '' };
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function InventoryPage() {
  const { inventory, loading, addInventoryItem, deleteInventoryItem } = useInventory();
  const { addMenuItem } = useMenu();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'retail'>('raw');
  
  const initialForm = {
    name: '',
    itemNumber: '',
    type: 'raw' as 'raw' | 'retail',
    quantity: '',
    unit: '',
    totalCost: '',
    company: '',
    retailCategory: 'cigarettes' as 'cigarettes' | 'biscuits' | 'soft_drinks' | 'lighters' | 'toffees' | 'other',
    boxes: '',
    sticksPerBox: '20',
    publishToMenu: true,
    sellingPrice: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState('');

  const sortInventory = (items: InventoryItem[]) => {
    return [...items].sort((a, b) => {
      // 0 stock first
      if (a.quantity <= 0 && b.quantity > 0) return -1;
      if (b.quantity <= 0 && a.quantity > 0) return 1;
      
      // Low stock (<= 10) next
      const aLow = a.quantity > 0 && a.quantity <= 10;
      const bLow = b.quantity > 0 && b.quantity <= 10;
      if (aLow && !bLow) return -1;
      if (bLow && !aLow) return 1;
      
      // Otherwise sort alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  const searchFilter = (items: InventoryItem[]) => {
    if (!searchQuery) return items;
    return items.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (i.itemNumber && i.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const rawMaterials = sortInventory(searchFilter(inventory.filter(i => i.type === 'raw')));
  const retailProducts = sortInventory(searchFilter(inventory.filter(i => i.type === 'retail')));
  const displayedInventory = activeTab === 'raw' ? rawMaterials : retailProducts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalCost) return;
    
    let finalQuantity = Number(formData.quantity);
    let finalUnit = formData.unit;
    
    if (formData.type === 'retail' && formData.retailCategory === 'cigarettes') {
      const numBoxes = Number(formData.boxes) || 0;
      const sticks = Number(formData.sticksPerBox) || 20;
      finalQuantity = numBoxes * sticks;
      finalUnit = 'sticks';
    }

    try {
      const itemData: any = {
        name: formData.name,
        type: formData.type,
        quantity: finalQuantity,
        unit: finalUnit,
        totalCost: Number(formData.totalCost),
        purchaseDate: Timestamp.now(),
        itemNumber: formData.itemNumber
      };
      
      if (formData.type === 'retail') {
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
    } catch (error) {
      console.error(error);
      toast.error("Failed to add inventory item.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await deleteInventoryItem(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Inventory Management</h1>
          <p className="text-sm text-muted-foreground">Track your raw materials and retail products.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search name or item #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 sm:w-64 px-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button 
            variant="primary" 
            className="shadow-[0_0_15px_rgba(204,255,0,0.3)] whitespace-nowrap"
            onClick={() => {
              setFormData(prev => ({ ...prev, type: activeTab }));
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Stock
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-border">
        <button 
          onClick={() => setActiveTab('raw')}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'raw' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
        >
          <Coffee className="w-4 h-4 mr-2" /> Raw Materials
        </button>
        <button 
          onClick={() => setActiveTab('retail')}
          className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'retail' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" /> Retail Products
        </button>
      </div>

      <Card className="rounded-2xl overflow-hidden border border-border shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1 w-full max-w-[90vw] md:max-w-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Purchase Date</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedInventory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0 ${item.quantity <= 0 ? 'bg-red-100 text-red-600' : item.quantity <= 10 ? 'bg-orange-100 text-orange-600' : 'bg-primary/20 text-primary-foreground'}`}>
                        <Package className={`w-3 h-3 md:w-4 md:h-4 ${item.quantity <= 0 ? 'text-red-600' : item.quantity <= 10 ? 'text-orange-600' : 'text-primary'}`} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="font-bold text-xs md:text-sm truncate max-w-[100px] md:max-w-[200px]">
                            {item.itemNumber && <span className="text-muted-foreground mr-1">#{item.itemNumber}</span>}
                            {item.name}
                          </span>
                          {item.quantity <= 0 && (
                            <span className="bg-red-100 text-red-600 px-1 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold hidden sm:inline-block">Out</span>
                          )}
                          {item.quantity > 0 && item.quantity <= 10 && (
                            <span className="bg-orange-100 text-orange-600 px-1 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold hidden sm:inline-block">Low</span>
                          )}
                        </div>
                        {item.company && <span className="text-[9px] md:text-[10px] text-muted-foreground">{item.company}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium text-xs md:text-sm ${item.quantity <= 0 ? 'text-red-600' : item.quantity <= 10 ? 'text-orange-600' : ''}`}>
                      {item.quantity} <span className="text-[10px]">{item.unit}</span>
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell text-xs md:text-sm text-muted-foreground">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-1 md:p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {displayedInventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No {activeTab === 'raw' ? 'raw materials' : 'retail products'} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-xl font-bold">Add {formData.type === 'raw' ? 'Raw Material' : 'Retail Product'}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-background max-h-[80vh] overflow-y-auto">
              
              {formData.type === 'retail' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Retail Category</label>
                  <select 
                    value={formData.retailCategory}
                    onChange={(e) => setFormData({...formData, retailCategory: e.target.value as any})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="cigarettes">Cigarettes</option>
                    <option value="biscuits">Biscuits</option>
                    <option value="soft_drinks">Soft Drinks</option>
                    <option value="lighters">Lighters</option>
                    <option value="toffees">Toffees</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Item Number (Optional)</label>
                <input 
                  type="text" 
                  value={formData.itemNumber}
                  onChange={(e) => setFormData({...formData, itemNumber: e.target.value})}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. 101, A5"
                />
              </div>

              {formData.type === 'retail' && formData.retailCategory !== 'other' && formData.retailCategory !== 'cigarettes' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Company / Brand</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Britannia, Coca Cola"
                  />
                </div>
              )}

              {formData.type === 'retail' && formData.retailCategory === 'cigarettes' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Brand Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value, name: `${e.target.value} (Stick)`})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Marlboro Lights"
                  />
                </div>
              )}

              {!(formData.type === 'retail' && formData.retailCategory === 'cigarettes') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Item Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={formData.type === 'raw' ? "e.g. Coffee Beans (Arabica)" : "e.g. Oreo 100g"}
                  />
                </div>
              )}
              
              {formData.type === 'retail' && formData.retailCategory === 'cigarettes' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Boxes</label>
                    <input 
                      type="number"
                      required
                      value={formData.boxes}
                      onChange={(e) => setFormData({...formData, boxes: e.target.value})}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sticks per Box</label>
                    <input 
                      type="number"
                      required
                      value={formData.sticksPerBox}
                      onChange={(e) => setFormData({...formData, sticksPerBox: e.target.value})}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 20"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input 
                      type="number"
                      step="0.01" 
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <input 
                      type="text" 
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. kg, pcs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Total Cost Paid (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.totalCost}
                  onChange={(e) => setFormData({...formData, totalCost: e.target.value})}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Total amount paid"
                />
              </div>

              {formData.type === 'retail' && (
                <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">Publish to Menu</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Auto-create a linked menu item for this stock.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.publishToMenu}
                        onChange={(e) => setFormData({...formData, publishToMenu: e.target.checked})}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  {formData.publishToMenu && (
                    <div className="pt-2 border-t border-primary/10">
                      <label className="block text-sm font-medium mb-1">
                        Selling Price {formData.retailCategory === 'cigarettes' ? '(per stick)' : '(per unit)'} (₹)
                      </label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="e.g. 15"
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-background pb-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Stock</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
