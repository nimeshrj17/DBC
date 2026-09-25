'use client';

import React, { useState, useMemo } from 'react';
import { useOwnerInventory, InventoryItem } from '@/lib/hooks/useOwnerInventory';
import { AlertCircle, Plus, Edit2, CheckCircle2, TrendingDown, ClipboardList, Database, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryOwnerPage() {
  const { items, movements, loading, addOrUpdateItem, deleteItem, recordDailyMovement } = useOwnerInventory();
  
  const [activeTab, setActiveTab] = useState<'master' | 'movement' | 'variance'>('master');
  
  const alerts = useMemo(() => {
    return items.filter(i => i.currentStock <= i.minPar);
  }, [items]);

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Inventory & PAR Tracking</h2>
          <p className="text-sm text-slate-500">Manage stock levels, record daily consumption, and track wastage.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('master')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'master' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <Database className="w-4 h-4" /> Master List
          </button>
          <button 
            onClick={() => setActiveTab('movement')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'movement' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <ClipboardList className="w-4 h-4" /> Daily Entry
          </button>
          <button 
            onClick={() => setActiveTab('variance')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'variance' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <TrendingDown className="w-4 h-4" /> Variance Report
          </button>
        </div>
      </div>

      {alerts.length > 0 && activeTab === 'master' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" /> Low Stock Alerts ({alerts.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {alerts.map(item => (
              <div key={item.id} className="bg-white border border-rose-100 rounded-lg px-4 py-2.5 text-sm shadow-sm flex items-center gap-3">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold text-xs">
                  {item.currentStock} {item.unit} left
                </span>
                <span className="text-xs text-slate-400 font-medium">Min: {item.minPar}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'master' && (
        <MasterListTab items={items} onSave={addOrUpdateItem} onDelete={deleteItem} />
      )}
      
      {activeTab === 'movement' && (
        <DailyEntryTab items={items} onRecord={recordDailyMovement} />
      )}

      {activeTab === 'variance' && (
        <VarianceReportTab movements={movements} />
      )}
    </div>
  );
}

function MasterListTab({ items, onSave, onDelete }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  
  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData(item);
  };
  
  const handleNew = () => {
    setEditingId('new');
    setFormData({ name: '', unit: 'kg', minPar: 0, normalPar: 0, maxPar: 0, currentStock: 0 });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit) {
      toast.error("Name and unit are required");
      return;
    }
    await onSave(formData);
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Inventory Items ({items.length})</h3>
        <button onClick={handleNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-6 py-4">Item Name</th>
              <th className="px-4 py-4">Unit</th>
              <th className="px-4 py-4 text-center">Current Stock</th>
              <th className="px-4 py-4 text-center">Min PAR</th>
              <th className="px-4 py-4 text-center">Normal PAR</th>
              <th className="px-4 py-4 text-center">Max PAR</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {editingId === 'new' && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-3">
                  <input type="text" placeholder="Item Name" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </td>
                <td className="px-4 py-3">
                  <input type="text" placeholder="Unit" className="w-16 px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" placeholder="Current" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.currentStock === undefined ? '' : formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" placeholder="Min" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.minPar === undefined ? '' : formData.minPar} onChange={e => setFormData({...formData, minPar: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" placeholder="Normal" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.normalPar === undefined ? '' : formData.normalPar} onChange={e => setFormData({...formData, normalPar: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-4 py-3">
                  <input type="number" placeholder="Max" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.maxPar === undefined ? '' : formData.maxPar} onChange={e => setFormData({...formData, maxPar: parseFloat(e.target.value) || 0})} />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={handleSave} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            )}
            
            {items.map((item: InventoryItem) => (
              editingId === item.id ? (
                <tr key={item.id} className="bg-indigo-50/50">
                  <td className="px-6 py-3">
                    <input type="text" className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" className="w-16 px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.currentStock === undefined ? '' : formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.minPar === undefined ? '' : formData.minPar} onChange={e => setFormData({...formData, minPar: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.normalPar === undefined ? '' : formData.normalPar} onChange={e => setFormData({...formData, normalPar: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" className="w-20 mx-auto block px-3 py-1.5 rounded-lg border border-slate-300 text-sm outline-none text-center" value={formData.maxPar === undefined ? '' : formData.maxPar} onChange={e => setFormData({...formData, maxPar: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSave} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"><CheckCircle2 className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-4 py-4 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded font-bold text-xs ${item.currentStock <= item.minPar ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium">{item.minPar}</td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium">{item.normalPar}</td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium">{item.maxPar}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if(confirm('Are you sure?')) onDelete(item.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            {items.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No inventory items found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyEntryTab({ items, onRecord }: any) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [purchasedQty, setPurchasedQty] = useState<number>(0);
  const [closingStock, setClosingStock] = useState<number>(0);
  const [expectedConsumption, setExpectedConsumption] = useState<number>(0);

  const selectedItem = items.find((i: any) => i.id === selectedItemId);

  const handleRecord = async () => {
    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }
    const consumption = selectedItem.currentStock + purchasedQty - closingStock;
    const variance = consumption - expectedConsumption;
    const varianceFlag = Math.abs(variance) > (expectedConsumption * 0.1); // 10% tolerance

    await onRecord({
      date: new Date().toISOString().split('T')[0],
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      openingStock: selectedItem.currentStock,
      purchasedQty,
      closingStock,
      actualConsumption: consumption,
      expectedConsumption,
      variance,
      varianceFlag
    });
    
    setSelectedItemId('');
    setPurchasedQty(0);
    setClosingStock(0);
    setExpectedConsumption(0);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-2xl">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Daily Closing Entry</h3>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Ingredient</label>
          <select 
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
          >
            <option value="">-- Select an item --</option>
            {items.map((i: any) => (
              <option key={i.id} value={i.id}>{i.name} (Opening: {i.currentStock} {i.unit})</option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="grid grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purchases Today ({selectedItem.unit})</label>
              <input 
                type="number" 
                value={purchasedQty === 0 ? '' : purchasedQty}
                onChange={e => setPurchasedQty(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-900" 
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Closing Stock ({selectedItem.unit})</label>
              <input 
                type="number" 
                value={closingStock === 0 ? '' : closingStock}
                onChange={e => setClosingStock(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-900 font-bold" 
                placeholder="Count at day end"
              />
            </div>
            
            <div className="col-span-2 pt-2 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Expected Consumption ({selectedItem.unit}) 
                <span className="text-xs text-slate-400 font-normal ml-2">(Auto-calc coming in next phase)</span>
              </label>
              <input 
                type="number" 
                value={expectedConsumption === 0 ? '' : expectedConsumption}
                onChange={e => setExpectedConsumption(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-900" 
                placeholder="E.g. from recipe calculator"
              />
            </div>

            <div className="col-span-2 pt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">Calculated Actual Consumption:</span>
              <span className="font-black text-slate-900 text-lg">
                {(selectedItem.currentStock + purchasedQty - closingStock).toFixed(1)} {selectedItem.unit}
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={handleRecord}
          disabled={!selectedItem}
          className="w-full py-3 bg-indigo-600 disabled:bg-slate-300 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" /> Record Movement & Update Stock
        </button>
      </div>
    </div>
  );
}

function VarianceReportTab({ movements }: any) {
  // Group movements by date, sorted desc
  const sorted = [...movements].sort((a, b) => b.date.localeCompare(a.date));
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50">
         <h3 className="font-bold text-slate-800">Wastage / Variance Report (30 Days)</h3>
         <p className="text-xs text-slate-500 mt-1">Comparing actual consumption against expected usage. High variance is flagged in red.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Ingredient</th>
              <th className="px-4 py-4 text-center">Actual Consumed</th>
              <th className="px-4 py-4 text-center">Expected Consumed</th>
              <th className="px-6 py-4 text-right">Variance (Wastage)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-600">{m.date}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{m.itemName}</td>
                <td className="px-4 py-4 text-center font-medium">{m.actualConsumption.toFixed(1)}</td>
                <td className="px-4 py-4 text-center font-medium text-slate-500">{m.expectedConsumption.toFixed(1)}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${m.varianceFlag ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {m.variance > 0 ? '+' : ''}{m.variance.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No daily movements recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
