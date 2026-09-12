'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, Search, Trash2, Edit, PlusCircle, Plus, X, Coffee, ShoppingBag, Store } from 'lucide-react';
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
  const { inventory, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const { menuItems, addMenuItem, updateMenuItem } = useMenu();
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

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');

  const handleEditClick = (item: InventoryItem) => {
    setEditingItemId(item.id);
    let linkedMenu = menuItems.find(m => m.linkedInventoryId === item.id);
    if (!linkedMenu && item.type === 'retail') {
      linkedMenu = menuItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
    }
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
  };

  const handleRestockClick = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty('');
    setRestockCost('');
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || !restockQty || isSubmitting) return;
    setIsSubmitting(true);
    
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
    } finally {
      setIsSubmitting(false);
      setRestockQty('');
      setRestockCost('');
    }
  };

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
    if (!formData.name || !formData.totalCost || isSubmitting) return;
    setIsSubmitting(true);
    
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
        
        // Sync the updated name, category, and selling price to the linked menu item if it's retail
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
              linkedInventoryAmount: 1,
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
    } catch (error) {
      console.error(error);
      toast.error("Failed to add inventory item.");
    } finally {
      setIsSubmitting(false);
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
    <div className="flex-1 w-full max-w-7xl mx-auto md:px-8 md:py-7 flex flex-col min-w-0 bg-slate-50 md:bg-transparent h-full">
      {/* Mobile-Only Shift KPI Cards */}
      <section className="md:hidden grid grid-cols-2 gap-3 px-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Low Stock</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900">{inventory.filter(i => i.quantity <= 10 && i.quantity > 0).length}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded">Items</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Valuation</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-gray-900">₹{inventory.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(0)}</span>
          </div>
        </div>
      </section>

      {/* Title & Global Actions (Desktop + Mobile Unified) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-0 py-2 md:pb-6 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Inventory Management</h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Track raw materials & retail products.</p>
          </div>
          <button 
            onClick={() => {
              setEditingItemId(null);
              setFormData(prev => ({ ...prev, type: activeTab }));
              setIsAddModalOpen(true);
            }}
            className="md:hidden bg-brand-lime hover:bg-[#b5de10] active:scale-95 transition-all text-black font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm border border-lime-400"
          >
            <Plus className="w-4 h-4" strokeWidth={2.8} />
            <span>Add Stock</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[260px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 md:w-4 md:h-4" strokeWidth={2.2} />
            </span>
            <input 
              type="text" 
              placeholder="Search item name, code #..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-xs md:text-sm font-semibold md:font-normal rounded-xl py-2.5 md:py-2 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime shadow-sm transition"
            />
          </div>
          
          <button className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <span>Filter</span>
          </button>
          
          <button 
            onClick={() => {
              setEditingItemId(null);
              setFormData(prev => ({ ...prev, type: activeTab }));
              setIsAddModalOpen(true);
            }}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-lime hover:bg-[#b5de10] text-slate-950 text-sm font-bold shadow-sm transition transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between px-4 md:px-0 shrink-0">
        <div className="flex items-center gap-6 md:gap-8 -mb-px text-sm font-bold">
          <button 
            onClick={() => setActiveTab('raw')}
            className={`flex items-center gap-2 md:gap-2.5 pb-2 md:pb-3 border-b-2 transition-all ${activeTab === 'raw' ? 'border-brand-lime md:border-slate-950 text-slate-900 md:text-slate-950 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'}`}
          >
            <Coffee className={`w-4 h-4 ${activeTab === 'raw' ? 'text-slate-700 md:text-slate-900' : 'text-slate-400'}`} strokeWidth={2} />
            <span>Raw Materials</span>
            <span className={`${activeTab === 'raw' ? 'bg-slate-100 md:bg-brand-lime text-slate-700 md:text-slate-950' : 'bg-slate-100 text-slate-400'} text-[11px] font-extrabold px-1.5 md:px-2 py-0.5 rounded-full`}>
              {rawMaterials.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('retail')}
            className={`flex items-center gap-2 md:gap-2.5 pb-2 md:pb-3 border-b-2 transition-all ${activeTab === 'retail' ? 'border-brand-lime md:border-slate-950 text-slate-900 md:text-slate-950 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'}`}
          >
            <ShoppingBag className={`w-4 h-4 ${activeTab === 'retail' ? 'text-slate-700 md:text-slate-900' : 'text-slate-400'}`} strokeWidth={2} />
            <span>Retail Products</span>
            <span className={`${activeTab === 'retail' ? 'bg-slate-100 md:bg-brand-lime text-slate-700 md:text-slate-950' : 'bg-slate-100 text-slate-400'} text-[11px] font-extrabold px-1.5 md:px-2 py-0.5 rounded-full`}>
              {retailProducts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Pills (Mobile Only) */}
      <section className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 shrink-0 px-4">
        <button className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-brand-lime text-black border border-lime-300 shadow-xs">
          All ({displayedInventory.length})
        </button>
        <button className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Low Stock ({displayedInventory.filter(i => i.quantity <= 10).length})
        </button>
      </section>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-1 mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                <th className="py-3.5 px-6" scope="col">Item Name & Details</th>
                <th className="py-3.5 px-6" scope="col">Category / Code</th>
                <th className="py-3.5 px-6" scope="col">Stock / Qty</th>
                <th className="py-3.5 px-6" scope="col">Status</th>
                <th className="py-3.5 px-6" scope="col">Unit Price</th>
                <th className="py-3.5 px-6" scope="col">Purchase Date</th>
                <th className="py-3.5 px-6 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayedInventory.map((item) => {
                const isLow = item.quantity > 0 && item.quantity <= 10;
                const isOut = item.quantity <= 0;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isOut ? 'bg-red-50 text-red-500 border-red-100' : 
                          isLow ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          <Package className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {item.itemNumber && <span className="text-xs font-semibold text-slate-400">#{item.itemNumber}</span>}
                            <span className="font-bold text-slate-900">{item.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">{item.company || (item.type === 'raw' ? 'In-house kitchen raw' : 'Retail Item')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {item.type === 'raw' ? 'Raw Material' : (item.retailCategory || 'Retail Product').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      <span className={`font-bold text-base ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-900'}`}>{item.quantity}</span> 
                      <span className={`text-xs font-semibold ml-1 ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-slate-500'}`}>{item.unit}</span>
                    </td>
                    <td className="py-4 px-6">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100/70 text-red-800 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100/70 text-amber-800 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-700">₹ {(item.totalCost / (item.quantity || 1)).toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs font-medium">{formatDate(item.purchaseDate).date || 'N/A'}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleRestockClick(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Quick Add Stock">
                          <PlusCircle className="w-5 h-5" strokeWidth={2} />
                        </button>
                        <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Item">
                          <Edit className="w-5 h-5" strokeWidth={2} />
                        </button>
                        <button onClick={() => deleteInventoryItem(item.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Delete Item">
                          <Trash2 className="w-5 h-5" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <section className="md:hidden flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-2.5 pt-2 custom-scroll">
        {displayedInventory.map((item) => {
          const isLow = item.quantity > 0 && item.quantity <= 10;
          const isOut = item.quantity <= 0;
          
          return (
            <article key={item.id} className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isOut ? 'bg-red-50 text-red-500 border-red-100' : 
                    isLow ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    <Package className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {item.itemNumber && <span className="text-xs font-extrabold text-gray-400">#{item.itemNumber}</span>}
                      <h3 className="font-bold text-sm text-gray-900 leading-snug truncate">{item.name}</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">Purchased: {formatDate(item.purchaseDate).date || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-1.5">
                    {isOut && <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase border border-red-100">Out</span>}
                    {isLow && <span className="bg-orange-50 text-orange-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase border border-orange-100">Low</span>}
                    <span className={`text-sm font-black ${isOut ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-slate-900'}`}>{item.quantity} <span className="text-[11px] font-semibold opacity-80">{item.unit}</span></span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5">Min 10</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`text-[11px] font-medium ${isOut || isLow ? 'text-rose-500' : 'text-gray-500'}`}>
                  {isOut ? 'Reorder immediately' : isLow ? 'Reorder needed' : 'Stock level OK'}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRestockClick(item)}
                    aria-label="Restock" 
                    className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 flex items-center gap-1 transition border border-emerald-200/70 font-bold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Restock</span>
                  </button>
                  <button onClick={() => handleEditClick(item)} aria-label="Edit item" className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-blue-600 flex items-center justify-center transition border border-slate-200/60">
                    <Edit className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                  <button onClick={() => deleteInventoryItem(item.id)} aria-label="Delete item" className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition border border-rose-100">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Add Stock Modal - Replace standard Card modal with simple modal or side sheet */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{editingItemId ? 'Edit Inventory Item' : 'Add New Item'}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{editingItemId ? 'Update stock details' : 'Register raw material or retail product'}</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Item Name *</label>
                    <input 
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                      placeholder="e.g. Milk, Parle-G"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Item Code / Number</label>
                    <input 
                      type="text" value={formData.itemNumber}
                      onChange={(e) => setFormData({...formData, itemNumber: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                      placeholder="e.g. MK-01"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Type *</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'raw'})}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'raw' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                    >
                      Raw Material
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'retail'})}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'retail' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                    >
                      Retail Product
                    </button>
                  </div>
                </div>

                {formData.type === 'retail' && (
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Category *</label>
                    <select 
                      value={formData.retailCategory}
                      onChange={(e) => setFormData({...formData, retailCategory: e.target.value as any})}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                    >
                      <option value="cigarettes">Cigarettes</option>
                      <option value="biscuits">Biscuits & Cookies</option>
                      <option value="soft_drinks">Cold Drinks / Beverages</option>
                      <option value="lighters">Lighters / Matches</option>
                      <option value="toffees">Toffees & Candies</option>
                      <option value="other">Other Retail</option>
                    </select>
                  </div>
                )}

                {formData.type === 'retail' && formData.retailCategory === 'cigarettes' ? (
                  <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Total Boxes</label>
                      <input 
                        type="number" required value={formData.boxes}
                        onChange={(e) => setFormData({...formData, boxes: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        placeholder="e.g. 5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Sticks per Box</label>
                      <input 
                        type="number" required value={formData.sticksPerBox}
                        onChange={(e) => setFormData({...formData, sticksPerBox: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        placeholder="e.g. 20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Quantity *</label>
                      <input 
                        type="number" step="0.01" required value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Unit *</label>
                      <input 
                        type="text" required value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                        placeholder="e.g. kg, pcs"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Total Purchase Cost (₹) *</label>
                  <input 
                    type="number" step="0.01" required value={formData.totalCost}
                    onChange={(e) => setFormData({...formData, totalCost: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                    placeholder="Total amount paid to supplier"
                  />
                </div>

                {formData.type === 'retail' && (
                  <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Publish to Point-of-Sale Menu</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Allow ordering from table and billing.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" className="sr-only peer"
                          checked={formData.publishToMenu}
                          onChange={(e) => setFormData({...formData, publishToMenu: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-lime"></div>
                      </label>
                    </div>
                    {formData.publishToMenu && (
                      <div className="pt-2">
                        <label className="text-[13px] font-bold text-slate-700">Customer Selling Price (₹) *</label>
                        <input 
                          type="number" required value={formData.sellingPrice}
                          onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                          className="w-full mt-1.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                          placeholder="Selling price to customers"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 bg-brand-lime hover:bg-[#b5de10] text-slate-950 font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Save Item
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {isRestockModalOpen && restockItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Restock Item</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{restockItem.name}</p>
              </div>
              <button 
                onClick={() => setIsRestockModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-4 md:p-6">
              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-500">Current Stock</span>
                  <span className="text-lg font-black text-slate-900">{restockItem.quantity} <span className="text-xs font-semibold text-slate-500">{restockItem.unit}</span></span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Add Quantity *</label>
                  <input 
                    type="number" step="0.01" required value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                    placeholder={`e.g. 50 ${restockItem.unit}`}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Cost Paid (₹) *</label>
                  <input 
                    type="number" step="0.01" required value={restockCost}
                    onChange={(e) => setRestockCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-lime focus:border-brand-lime"
                    placeholder="Total amount paid for this stock"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" onClick={() => setIsRestockModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                        Restock
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
