import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { rupees } from '@/lib/analytics/revenue';

interface Props {
  monthKey: string; // YYYY-MM
  monthInProgress: boolean;
  revenue: number;
  /** Total making cost of what was sold, or null while some items have no cost. */
  cogs: number | null;
  itemsWithoutCost: number;
  staffCost: number;
}

/** Monthly profit and loss. Fixed costs are entered here; revenue and cost come from the same numbers as the rest of the page. */
export function MonthlyPnl({ monthKey, monthInProgress, revenue, cogs, itemsWithoutCost, staffCost }: Props) {
  const [form, setForm] = useState({ rent: '', electricity: '', other: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setForm({ rent: '', electricity: '', other: '' });
    getDoc(doc(db, 'monthly_expenses', monthKey))
      .then(snap => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        setForm({ rent: String(d.rent || ''), electricity: String(d.electricity || ''), other: String(d.other || '') });
      })
      .catch(e => console.warn('Monthly expenses unavailable', e));
    return () => { cancelled = true; };
  }, [monthKey]);

  const n = (v: string) => parseFloat(v) || 0;
  const fixed = n(form.rent) + n(form.electricity) + n(form.other) + staffCost;
  const afterFixed = revenue - fixed;
  const profit = cogs === null ? null : revenue - cogs - fixed;

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'monthly_expenses', monthKey), { month: monthKey, rent: n(form.rent), electricity: n(form.electricity), other: n(form.other) });
      toast.success('Expenses saved');
    } catch (e) {
      console.error(e);
      toast.error('Could not save expenses');
    } finally {
      setSaving(false);
    }
  };

  const Row = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
    <div className={`flex justify-between text-sm py-1 ${strong ? 'font-black text-base border-t-2 border-slate-800 pt-3 mt-2' : ''}`}><span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{value}</span></div>
  );
  const input = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <h3 className="text-base font-bold text-slate-900 mb-1">Monthly profit &amp; loss</h3>
      {monthInProgress && <p className="text-xs text-amber-600 mb-3">This month is not over, so fixed costs are shown in full against sales so far.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-3">
        <div className="lg:col-span-2">
          <Row label="Revenue" value={rupees(revenue)} />
          <Row label="Ingredient cost" value={cogs === null ? <span className="text-slate-400 font-medium">Not available ({itemsWithoutCost} items have no making cost)</span> : `− ${rupees(cogs)}`} />
          <Row label="Staff salaries" value={`− ${rupees(staffCost)}`} />
          <Row label="Rent" value={`− ${rupees(n(form.rent))}`} />
          <Row label="Electricity & utilities" value={`− ${rupees(n(form.electricity))}`} />
          <Row label="Other expenses" value={`− ${rupees(n(form.other))}`} />
          {profit === null ? (
            <>
              <Row strong label="After fixed costs, before ingredients" value={<span className={afterFixed >= 0 ? 'text-emerald-600' : 'text-red-600'}>{rupees(afterFixed)}</span>} />
              <p className="text-xs text-slate-500 mt-2">Operating profit cannot be resolved due to insufficient data: enter making cost for every item sold.</p>
            </>
          ) : (
            <>
              <Row strong label="Operating profit" value={<span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{rupees(profit)}</span>} />
              <p className="text-xs text-slate-500 mt-2">{revenue ? `${((profit / revenue) * 100).toFixed(1)}% of revenue` : ''}</p>
            </>
          )}
        </div>
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 block">Rent (₹)<input type="number" min="0" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-500 block">Electricity (₹)<input type="number" min="0" value={form.electricity} onChange={e => setForm({ ...form, electricity: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-500 block">Other overheads (₹)<input type="number" min="0" value={form.other} onChange={e => setForm({ ...form, other: e.target.value })} className={input} /></label>
          <button onClick={save} disabled={saving} className="w-full py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-lg disabled:opacity-40">{saving ? 'Saving…' : 'Save fixed costs'}</button>
        </div>
      </div>
    </div>
  );
}
