const fs = require('fs');
let code = fs.readFileSync('src/app/order/[tableId]/page.tsx', 'utf8');

const target = `    try {
      const res = await fetch('/api/orders/submit-first', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderKey: crypto.randomUUID(),
          tableId: table.id,
          items: cart,
          customerName: table.customerName || custName || null,
          customerPhone: table.customerPhone || custPhone || null,
        })
      });

      if (!res.ok) throw new Error('Failed to place order');`;

const replacement = `    try {
      const isJoined = sessionData?.authenticated && ['occupied', 'served', 'needs_approval'].includes(sessionData?.status || '');
      const endpoint = isJoined ? '/api/orders/submit-joined' : '/api/orders/submit-first';
      
      const payload = isJoined ? {
        orderKey: crypto.randomUUID(),
        tableId: table.id,
        items: cart
      } : {
        orderKey: crypto.randomUUID(),
        tableId: table.id,
        items: cart,
        customerName: table.customerName || custName || null,
        customerPhone: table.customerPhone || custPhone || null,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to place order');`;

code = code.replace(target, replacement);

fs.writeFileSync('src/app/order/[tableId]/page.tsx', code);
