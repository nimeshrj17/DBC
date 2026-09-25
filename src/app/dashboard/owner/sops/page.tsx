'use client';

import React, { useState } from 'react';
import { useChecklists, ChecklistRun } from '@/lib/hooks/useChecklists';
import { FileText, ClipboardCheck, BookOpen, AlertCircle } from 'lucide-react';

export default function SOPsOwnerPage() {
  const { runs, loading, rules } = useChecklists();
  const [activeTab, setActiveTab] = useState<'runs' | 'sops'>('runs');

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">SOPs & Checklists</h2>
          <p className="text-sm text-slate-500">Monitor staff checklist completions and manage standard operating procedures.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('runs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'runs' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <ClipboardCheck className="w-4 h-4" /> Checklist Logs
          </button>
          <button 
            onClick={() => setActiveTab('sops')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sops' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <BookOpen className="w-4 h-4" /> SOP Documents
          </button>
        </div>
      </div>

      {activeTab === 'runs' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Recent Completions</h3>
             <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">Last 20 Runs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Checklist</th>
                  <th className="px-6 py-4">Shift</th>
                  <th className="px-6 py-4">Completed By</th>
                  <th className="px-6 py-4 text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((run: ChecklistRun) => {
                  const total = run.itemsStatus.length;
                  const checked = run.itemsStatus.filter(i => i.checked).length;
                  const pct = Math.round((checked / total) * 100);
                  
                  return (
                    <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(run.completedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{run.templateName}</td>
                      <td className="px-6 py-4 text-slate-600">{run.shift}</td>
                      <td className="px-6 py-4 font-semibold text-indigo-600">{run.completedBy}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {runs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No checklists have been completed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-rose-200 bg-rose-100 flex items-center gap-2 text-rose-900">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-black">12 Non-Negotiable Rules</h3>
            </div>
            <div className="p-5 space-y-3">
              {rules.map((rule, i) => (
                <div key={i} className="text-sm font-semibold text-rose-900/90 pb-2 border-b border-rose-100 last:border-0 last:pb-0">
                  {rule}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Upselling SOP</h3>
                <p className="text-xs text-slate-500 mt-1">Scripts for combo pairing and beverage suggestions.</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Customer Complaint Handling</h3>
                <p className="text-xs text-slate-500 mt-1">Step-by-step resolution flow for food/service issues.</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
              <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                + Add New SOP Document
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
