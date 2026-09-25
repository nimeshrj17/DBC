'use client';

import React, { useState, useMemo } from 'react';
import { useMenu, MenuItem, CostingData } from '@/lib/hooks/useMenu';
import { useMenuEngineering } from '@/lib/hooks/useMenuEngineering';
import { Settings2, Tag, TrendingUp, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuEngineeringPage() {
  const { menuItems } = useMenu();
  const { volumes, loading, updateItemCosting } = useMenuEngineering(7);
  
  const [activeTab, setActiveTab] = useState<'matrix' | 'list'>('matrix');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Quadrant Calcs
  const analyzedItems = useMemo(() => {
    return menuItems.filter(i => !i.archived).map(item => {
      const vol = volumes[item.id] || 0;
      const margin = item.costing?.margin || 0;
      const marginPct = item.costing?.marginPct || 0;
      return { ...item, vol, margin, marginPct };
    });
  }, [menuItems, volumes]);

  const avgVolume = useMemo(() => {
    if (analyzedItems.length === 0) return 0;
    return analyzedItems.reduce((acc, i) => acc + i.vol, 0) / analyzedItems.length;
  }, [analyzedItems]);

  const avgMargin = useMemo(() => {
    const costedItems = analyzedItems.filter(i => i.costing);
    if (costedItems.length === 0) return 0;
    return costedItems.reduce((acc, i) => acc + i.margin, 0) / costedItems.length;
  }, [analyzedItems]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Menu Engineering</h2>
          <p className="text-sm text-slate-500">Analyze item profitability and adjust pricing strategy.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'matrix' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            Quadrant Matrix
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            Costing List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : activeTab === 'matrix' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-indigo-500" /> BCG Menu Matrix
             </h3>
             <div className="relative w-full aspect-square max-w-2xl mx-auto bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden">
                {/* Quadrant Lines */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-300"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300"></div>
                
                {/* Quadrant Labels */}
                <div className="absolute top-4 right-4 text-emerald-600 font-black opacity-30 text-2xl tracking-widest">STARS</div>
                <div className="absolute top-4 left-4 text-amber-500 font-black opacity-30 text-2xl tracking-widest">PUZZLES</div>
                <div className="absolute bottom-4 right-4 text-blue-500 font-black opacity-30 text-2xl tracking-widest">WORKHORSES</div>
                <div className="absolute bottom-4 left-4 text-rose-500 font-black opacity-30 text-2xl tracking-widest">DOGS</div>
                
                {/* Plot points */}
                {analyzedItems.filter(i => i.costing).map(item => {
                   const xRaw = avgVolume > 0 ? (item.vol / (avgVolume * 2)) * 100 : 50;
                   const yRaw = avgMargin > 0 ? (item.margin / (avgMargin * 2)) * 100 : 50;
                   // clamp between 5 and 95
                   const x = Math.max(5, Math.min(95, xRaw));
                   const y = Math.max(5, Math.min(95, yRaw));
                   
                   return (
                     <div 
                       key={item.id} 
                       className="absolute w-4 h-4 bg-indigo-600 rounded-full shadow-md cursor-pointer group hover:z-10 transition-transform hover:scale-150"
                       style={{ left: `calc(${x}% - 8px)`, bottom: `calc(${y}% - 8px)` }}
                       onClick={() => setEditingItem(item)}
                     >
                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-xl z-20 font-bold">
                         {item.name}
                         <div className="text-slate-300 font-normal mt-0.5">Vol: {item.vol} | Margin: ₹{item.margin.toFixed(0)}</div>
                       </div>
                     </div>
                   )
                })}
                {analyzedItems.filter(i => i.costing).length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
                    No items have been costed yet.
                  </div>
                )}
             </div>
             <p className="text-center text-xs text-slate-500 mt-4">X-Axis: Sales Volume (Last 7 Days) | Y-Axis: Contribution Margin (₹)</p>
          </div>
          
          <div className="space-y-4">
             <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-rose-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" /> Low Margin Alert
                </h3>
                <p className="text-xs text-rose-600 mb-3">These items have a contribution margin below 40%.</p>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll pr-2">
                  {analyzedItems.filter(i => i.costing && i.marginPct < 40).map(item => (
                    <div key={item.id} onClick={() => setEditingItem(item)} className="bg-white p-2.5 rounded-xl text-sm border border-rose-100 flex justify-between items-center cursor-pointer hover:border-rose-300 transition-colors">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      <span className="font-bold text-rose-600">{item.marginPct.toFixed(0)}%</span>
                    </div>
                  ))}
                  {analyzedItems.filter(i => i.costing && i.marginPct < 40).length === 0 && (
                    <div className="text-xs text-emerald-600 font-bold">All costed items are above 40% margin.</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-6 py-4">Menu Item</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Ingredient Cost</th>
                <th className="px-6 py-4">Contr. Margin</th>
                <th className="px-6 py-4">Margin %</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analyzedItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-6 py-4">₹{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.costing ? `₹${item.costing.totalCost.toFixed(2)}` : <span className="text-slate-400 italic">Not Costed</span>}
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {item.costing ? `₹${item.costing.margin.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {item.costing ? (
                      <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${item.costing.marginPct >= 60 ? 'bg-emerald-100 text-emerald-700' : item.costing.marginPct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {item.costing.marginPct.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingItem(item)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-[13px] bg-indigo-50 px-3 py-1.5 rounded-lg">
                      {item.costing ? 'Edit' : 'Add Costing'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingItem && (
        <CostingEditorModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onSave={updateItemCosting}
        />
      )}
    </div>
  );
}

function CostingEditorModal({ item, onClose, onSave }: { item: MenuItem, onClose: () => void, onSave: any }) {
  const [ingredients, setIngredients] = useState(item.costing?.ingredients || []);
  
  const totalCost = ingredients.reduce((sum, i) => sum + i.lineCost, 0);
  const margin = item.price - totalCost;
  const marginPct = item.price > 0 ? (margin / item.price) * 100 : 0;

  const handleSave = async () => {
    const costing: CostingData = {
      ingredients,
      totalCost,
      margin,
      marginPct
    };
    await onSave(item.id, costing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Costing: {item.name}</h2>
            <p className="text-xs text-slate-500 font-medium">Selling Price: ₹{item.price}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-slate-800">Ingredients BOM</h3>
            <button 
              onClick={() => setIngredients([...ingredients, { name: '', qty: 1, unit: 'g', unitCost: 0, lineCost: 0 }])}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>
          
          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="Ingredient (e.g. Bun)" 
                  value={ing.name}
                  onChange={(e) => {
                    const newI = [...ingredients];
                    newI[idx].name = e.target.value;
                    setIngredients(newI);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" 
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={ing.qty === 0 ? '' : ing.qty}
                  onChange={(e) => {
                    const newI = [...ingredients];
                    newI[idx].qty = parseFloat(e.target.value) || 0;
                    newI[idx].lineCost = newI[idx].qty * newI[idx].unitCost;
                    setIngredients(newI);
                  }}
                  className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-indigo-500" 
                />
                <input 
                  type="text" 
                  placeholder="Unit" 
                  value={ing.unit}
                  onChange={(e) => {
                    const newI = [...ingredients];
                    newI[idx].unit = e.target.value;
                    setIngredients(newI);
                  }}
                  className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-indigo-500" 
                />
                <div className="flex items-center gap-1 w-24">
                  <span className="text-slate-400 text-sm">₹</span>
                  <input 
                    type="number" 
                    placeholder="Cost/Unit" 
                    value={ing.unitCost === 0 ? '' : ing.unitCost}
                    onChange={(e) => {
                      const newI = [...ingredients];
                      newI[idx].unitCost = parseFloat(e.target.value) || 0;
                      newI[idx].lineCost = newI[idx].qty * newI[idx].unitCost;
                      setIngredients(newI);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="w-16 text-right font-bold text-slate-700 text-sm">
                  ₹{ing.lineCost.toFixed(1)}
                </div>
                <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {ingredients.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                No ingredients added yet.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Cost</p>
              <p className="text-xl font-black text-slate-800">₹{totalCost.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider text-right">Margin</p>
              <p className={`text-xl font-black ${marginPct >= 40 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{margin.toFixed(2)} ({marginPct.toFixed(1)}%)
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors">Save Costing</button>
          </div>
        </div>
      </div>
    </div>
  );
}
