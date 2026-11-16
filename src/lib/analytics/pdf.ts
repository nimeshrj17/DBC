import type { RevenueSummary, RevenueRange } from './revenue';

// The built-in PDF font has no rupee sign, so amounts are written as "Rs."
const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-IN')}`;

interface Options {
  range: RevenueRange;
  s: Omit<RevenueSummary, 'ledger'>;
  prev: Omit<RevenueSummary, 'ledger'>;
  compLabel: string;
}

/** One-page-ish revenue summary for the owner's records. jsPDF is loaded only when this is called. */
export async function downloadRevenuePdf({ range, s, prev, compLabel }: Options) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, M = 14;
  let y = 18;

  const ensure = (h: number) => { if (y + h > 285) { pdf.addPage(); y = 18; } };
  const h1 = (t: string) => { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.text(t, M, y); y += 8; };
  const h2 = (t: string) => { ensure(14); y += 3; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(t, M, y); y += 2; pdf.setDrawColor(200); pdf.line(M, y, W - M, y); y += 5; };
  const row = (cols: string[], widths: number[], bold = false) => {
    ensure(6);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(9);
    cols.forEach((c, i) => {
      if (i === 0) pdf.text(c.length > 38 ? `${c.slice(0, 36)}..` : c, M, y);
      else pdf.text(c, M + widths[i], y, { align: 'right' });
    });
    y += 5.5;
  };

  h1('Rakha Bhai Ki Chai & Cafe - Revenue Report');
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text(`${range.label}   (business day 2 AM to 2 AM)`, M, y); y += 6;
  pdf.text(`Generated ${new Date().toLocaleString('en-IN')}`, M, y); y += 4;

  h2('Summary');
  const change = prev.revenue ? ((s.revenue - prev.revenue) / prev.revenue) * 100 : null;
  const w2 = [0, 182 - M];
  row(['Revenue (paid orders, cancelled excluded)', rs(s.revenue)], w2, true);
  row([`vs ${compLabel}`, change === null ? 'no data' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%  (${rs(prev.revenue)})`], w2);
  row(['Paid orders', String(s.orders)], w2);
  row(['Average order value', rs(s.aov)], w2);
  row(['Items sold', String(s.itemsSold)], w2);
  row(['Cancelled orders', `${s.cancelled.count}  (${rs(s.cancelled.value)})`], w2);
  row(['Profit margin', s.profit.available ? `${s.profit.marginPct.toFixed(1)}%  (gross profit ${rs(s.profit.grossProfit)})` : 'Cannot be resolved: making cost missing for items sold'], w2);

  h2('Kitchen vs retail');
  for (const k of ['kitchen', 'retail'] as const) {
    const c = s.channels[k];
    row([k === 'kitchen' ? 'Kitchen items' : 'Retail items (cigarettes, water, cold drinks)', `${rs(c.revenue)}  ${c.share.toFixed(1)}%`], w2);
  }

  h2('Payment method');
  s.paymentSplit.forEach(p => row([p.method, `${rs(p.revenue)}  (${p.orders} orders)`], w2));

  if (s.daily.length > 1) {
    h2('By day');
    const w = [0, 100, 140, 182 - M];
    row(['Date', 'Orders', 'Kitchen', 'Retail / Total'], w, true);
    s.daily.forEach(d => row([d.key, String(d.orders), rs(d.kitchen), `${rs(d.retail)} / ${rs(d.kitchen + d.retail)}`], w));
  }

  h2('Staff');
  const ws = [0, 110, 150, 182 - M];
  row(['Name', 'Orders', 'Cancelled', 'Revenue'], ws, true);
  s.staff.forEach(r => row([r.name, String(r.orders), String(r.cancelled), rs(r.revenue)], ws));

  h2('Top items');
  const wi = [0, 130, 182 - M];
  row(['Item', 'Qty', 'Revenue'], wi, true);
  s.items.slice(0, 20).forEach(i => row([i.name, String(i.qty), rs(i.revenue)], wi));

  pdf.save(`revenue_${range.startKey}_to_${range.endKey}.pdf`);
}
