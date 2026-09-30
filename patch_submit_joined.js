const fs = require('fs');
const file = 'src/app/api/orders/submit-joined/route.ts';
let code = fs.readFileSync(file, 'utf8');

const target = "t.set(orderRef, newOrderData);";
const replacement = `t.set(orderRef, newOrderData);
      
      if (orderStatus === 'pending') {
        const tableData = tableDoc.data();
        const currentActiveIds = tableData?.activeOrderIds || [];
        t.update(tableRef, {
          activeOrderIds: Array.from(new Set([...currentActiveIds, orderDocId]))
        });
      }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
