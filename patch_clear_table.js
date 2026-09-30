const fs = require('fs');
const file = 'src/app/dashboard/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `    if (hasUnpaid && forceClear) {
      const targetTbl = tables.find(t => t.id === tableId);
      if (targetTbl && targetTbl.activeOrderIds) {
        const tblOrders = orders.filter(o => targetTbl.activeOrderIds.includes(o.id));
        await Promise.all(tblOrders.map(o => updateOrder(o.id, { status: 'cancelled' })));
      }
    }`;

const replacement = `    const targetTbl = tables.find(t => t.id === tableId);
    if (targetTbl && targetTbl.activeOrderIds) {
      const tblOrders = orders.filter(o => targetTbl.activeOrderIds.includes(o.id));
      if (hasUnpaid && forceClear) {
        await Promise.all(tblOrders.map(o => updateOrder(o.id, { status: 'cancelled' })));
      } else if (!hasUnpaid) {
        await Promise.all(tblOrders.map(o => updateOrder(o.id, { status: 'completed' })));
      }
    }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
