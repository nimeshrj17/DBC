const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/orders/page.tsx', 'utf8');

// The problematic code: <span className="md:block">{order.tableNumber}</span>
// Replace it with robust lookups
code = code.replace(
  '<span className="md:block">{order.tableNumber}</span>',
  '{(() => { const t = tables.find(t => t.id === order.tableId); const num = t?.number ?? order.tableNumber; return <span className="md:block" title={String(num)}>{String(num).length > 5 ? "TBL" : num}</span>; })()}'
);

fs.writeFileSync('src/app/dashboard/orders/page.tsx', code);
