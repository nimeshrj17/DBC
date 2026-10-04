const fs = require('fs');

// 1. Customer Order UI
let code = fs.readFileSync('src/app/order/[tableId]/page.tsx', 'utf8');
code = code.replace(
  '#{finalReceiptData?.ref || table.id.substring(0,6).toUpperCase()}',
  '#{finalReceiptData?.ref || table.number || "001"}'
);
code = code.replace(
  'setTable({ id: tableId, status: data.status, number: data.number ?? tableId } as any);',
  'setTable({ id: tableId, status: data.status, number: data.number ?? "Unknown" } as any);'
);
fs.writeFileSync('src/app/order/[tableId]/page.tsx', code);

// 2. Dashboard UI
code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
code = code.replace(
  '{table.name || `Table ${table.number || table.id.slice(-3)}`}',
  '{table.name || `Table ${table.number}`}'
);
fs.writeFileSync('src/app/dashboard/page.tsx', code);

