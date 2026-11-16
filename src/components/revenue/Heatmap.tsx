import React from 'react';
import { BUSINESS_DAY_START_HOUR, rupees } from '@/lib/analytics/revenue';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const label = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`;

/** Revenue by weekday and hour. Darker means more revenue; hours follow the business day from 2 AM. */
export function Heatmap({ data }: { data: number[][] }) {
  const hours = Array.from({ length: 24 }, (_, i) => (BUSINESS_DAY_START_HOUR + i) % 24);
  const max = Math.max(1, ...data.flat());
  const used = hours.filter(h => data.some(row => row[h] > 0));
  const shown = used.length ? hours.slice(hours.indexOf(used[0]), hours.indexOf(used[used.length - 1]) + 1) : hours;

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `3rem repeat(${shown.length}, minmax(1.75rem, 1fr))` }}>
        <div />
        {shown.map(h => <div key={h} className="text-[10px] text-center text-slate-400">{label(h)}</div>)}
        {DAYS.map((d, di) => (
          <React.Fragment key={d}>
            <div className="text-xs font-semibold text-slate-500 self-center">{d}</div>
            {shown.map(h => {
              const v = data[di][h];
              return (
                <div
                  key={h}
                  title={`${d} ${label(h)}: ${rupees(v)}`}
                  className="h-7 rounded-sm border border-slate-100"
                  style={{ background: v > 0 ? `rgba(16,185,129,${0.12 + 0.88 * (v / max)})` : '#f8fafc' }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
