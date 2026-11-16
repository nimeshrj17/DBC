import React from 'react';
import type { Insight } from '@/lib/analytics/revenue';

export function InsightsPanel({ items }: { items: Insight[] }) {
  if (!items.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      <h3 className="text-base font-bold text-slate-900 mb-3">Needs your attention</h3>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.title} className={`rounded-xl border px-4 py-3 ${i.level === 'warn' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-sm font-bold ${i.level === 'warn' ? 'text-amber-800' : 'text-slate-800'}`}>{i.title}</div>
            <div className="text-xs text-slate-600 mt-0.5">{i.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
