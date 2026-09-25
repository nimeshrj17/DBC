'use client';

import React, { useState } from 'react';
import { useChecklists, ChecklistTemplate } from '@/lib/hooks/useChecklists';
import { CheckSquare, ListTodo, ShieldAlert, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function StaffChecklistPage() {
  const { templates, rules, submitChecklist } = useChecklists();
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const handleToggle = (label: string) => {
    setChecks(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleSubmit = async () => {
    if (!activeTemplate) return;
    
    const uncompleted = activeTemplate.items.filter(i => i.required && !checks[i.label]);
    if (uncompleted.length > 0) {
      alert(`You still have ${uncompleted.length} required items to complete!`);
      return;
    }

    const itemsStatus = activeTemplate.items.map(i => ({
      label: i.label,
      checked: !!checks[i.label],
      checkedAt: checks[i.label] ? Date.now() : undefined
    }));

    const success = await submitChecklist({
      templateId: activeTemplate.id,
      templateName: activeTemplate.name,
      date: new Date().toISOString().split('T')[0],
      shift: new Date().getHours() < 16 ? 'Morning' : 'Evening',
      itemsStatus
    });

    if (success) {
      setActiveTemplate(null);
      setChecks({});
    }
  };

  if (activeTemplate) {
    const progress = Math.round((Object.values(checks).filter(Boolean).length / activeTemplate.items.length) * 100);
    
    return (
      <div className="p-4 max-w-3xl mx-auto space-y-4 pb-24">
        <button onClick={() => setActiveTemplate(null)} className="flex items-center gap-2 text-slate-500 font-semibold mb-4 px-2 py-1 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Back to Checklists
        </button>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-indigo-50">
            <h2 className="text-xl font-black text-indigo-900">{activeTemplate.name}</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs font-bold text-indigo-800 w-10 text-right">{progress}%</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {activeTemplate.items.map((item, idx) => (
              <label key={idx} className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50 ${checks[item.label] ? 'bg-slate-50 opacity-60' : ''}`}>
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all"
                  checked={checks[item.label] || false}
                  onChange={() => handleToggle(item.label)}
                />
                <span className={`flex-1 text-sm font-semibold ${checks[item.label] ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {item.label}
                </span>
                {item.required && !checks[item.label] && (
                  <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider bg-rose-50 px-2 py-1 rounded">Required</span>
                )}
              </label>
            ))}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={handleSubmit}
              disabled={progress < 100}
              className="w-full py-3.5 bg-indigo-600 disabled:bg-slate-300 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" /> Submit Checklist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24">
      <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ListTodo className="w-6 h-6 text-indigo-600" /> Daily Checklists
        </h2>
        <p className="text-sm text-slate-500 mt-1">Select a checklist to begin your shift duties.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {templates.map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTemplate(t)}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col items-start gap-4"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.items.length} tasks to verify</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-rose-50 border border-rose-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-rose-200 bg-rose-100 flex items-center gap-2 text-rose-900">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-black">12 Non-Negotiable Rules</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {rules.map((rule, i) => (
            <div key={i} className="text-sm font-semibold text-rose-900/80">
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
