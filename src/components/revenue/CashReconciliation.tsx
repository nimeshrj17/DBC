import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { rupees } from '@/lib/analytics/revenue';

interface Props {
  dateKey: string;
  cashSales: number;
  who?: { id: string; name: string };
  onVariance: (variance: number | null) => void;
}

/** End-of-day cash check: cash sales plus opening float is what the drawer should hold. */
export function CashReconciliation({ dateKey, cashSales, who, onVariance }: Props) {
  const [float, setFloat] = useState('');
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<{ by?: string; at?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFloat(''); setCounted(''); setNote(''); setSaved(null);
    getDoc(doc(db, 'cash_counts', dateKey))
      .then(snap => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        setFloat(String(d.openingFloat ?? '')); setCounted(String(d.counted ?? '')); setNote(d.note ?? '');
        setSaved({ by: d.by?.name, at: d.at });
      })
      .catch(e => console.warn('Cash count unavailable', e));
    return () => { cancelled = true; };
  }, [dateKey]);

  const expected = cashSales + (parseFloat(float) || 0);
  const hasCount = counted.trim() !== '' && !isNaN(parseFloat(counted));
  const variance = hasCount ? parseFloat(counted) - expected : null;

  useEffect(() => { onVariance(variance); }, [variance, onVariance]);

  const save = async () => {
    if (!hasCount) return;
    setSaving(true);
    try {
      const record = { date: dateKey, openingFloat: parseFloat(float) || 0, counted: parseFloat(counted), expectedCashSales: cashSales, note: note.trim(), by: who ?? null, at: new Date().toISOString() };
      await setDoc(doc(db, 'cash_counts', dateKey), JSON.parse(JSON.stringify(record)));
      setSaved({ by: who?.name, at: record.at });
      toast.success('Cash count saved');
    } catch (e) {
      console.error(e);
      toast.error('Could not save the cash count');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm';
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <h3 className="text-base font-bold text-slate-900 mb-1">Cash reconciliation</h3>
      <p className="text-xs text-slate-500 mb-4">Count the drawer at close and compare with the day&apos;s cash sales.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-semibold text-slate-500">Opening float (₹)<input type="number" min="0" value={float} onChange={e => setFloat(e.target.value)} className={input} /></label>
        <label className="text-xs font-semibold text-slate-500">Cash counted (₹)<input type="number" min="0" value={counted} onChange={e => setCounted(e.target.value)} className={input} /></label>
        <label className="text-xs font-semibold text-slate-500">Note<input value={note} onChange={e => setNote(e.target.value)} className={input} placeholder="optional" /></label>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm">
        <span className="text-slate-600">Cash sales <b>{rupees(cashSales)}</b></span>
        <span className="text-slate-600">Expected in drawer <b>{rupees(expected)}</b></span>
        {variance !== null && (
          <span className={`font-bold ${Math.abs(variance) < 1 ? 'text-emerald-600' : 'text-red-600'}`}>
            {Math.abs(variance) < 1 ? 'Matches' : variance > 0 ? `Over by ${rupees(variance)}` : `Short by ${rupees(-variance)}`}
          </span>
        )}
        <button onClick={save} disabled={!hasCount || saving} className="ml-auto px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-40">{saving ? 'Saving…' : 'Save count'}</button>
      </div>
      {saved?.at && <div className="text-xs text-slate-400 mt-2">Saved{saved.by ? ` by ${saved.by}` : ''} {new Date(saved.at).toLocaleString('en-IN')}</div>}
    </div>
  );
}
