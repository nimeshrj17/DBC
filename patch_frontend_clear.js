const fs = require('fs');
const file = 'src/app/order/[tableId]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    if (!tableId) return;`;

const replacement = `  useEffect(() => {
    if (table?.status === 'empty') {
      if (viewingOrders) setViewingOrders(false);
      if (justPaid) setJustPaid(false);
      if (sessionConfirmed) setSessionConfirmed(false);
      if (cart.length > 0) setCart([]);
    }
  }, [table?.status]);

  useEffect(() => {
    if (!tableId) return;`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
