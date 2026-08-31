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

  const rawMaterials = inventory.filter(i => i.type === 'raw');
  const retailProducts = inventory.filter(i => i.type === 'retail');
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
        purchaseDate: Timestamp.now()
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
          category: 'Retail',
          available: true,
          linkedInventoryId: docRef,
          linkedInventoryAmount: 1
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
        
        <Button 
          variant="primary" 
          className="shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          onClick={() => {
            setFormData(prev => ({ ...prev, type: activeTab }));
            setIsAddModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Stock
        </Button>
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
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayedInventory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-foreground flex items-center justify-center mr-3">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{item.name}</span>
                        {item.company && <span className="text-[10px] text-muted-foreground">{item.company}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-sm">{item.quantity} {item.unit}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-sm text-red-600">₹ {item.totalCost.toFixed(2)}</span>
                    <div className="text-[10px] text-muted-foreground">₹ {(item.totalCost / item.quantity).toFixed(2)} / {item.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
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
