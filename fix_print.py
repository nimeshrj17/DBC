import re

with open('src/components/PrintAgent.tsx', 'r') as f:
    content = f.read()

old_block = """          if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
            
            if (printingRef.current.has(order.id)) return;
            printingRef.current.add(order.id);

            try {
              console.log(`🖨️ Attempting to send Order ${order.id} to Local Agent at http://127.0.0.1:5050/print...`);
              
              // Using 127.0.0.1 instead of localhost avoids some strict browser CORS/Mixed-Content blocks
              const res = await fetch('http://127.0.0.1:5050/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order })
              });"""

new_block = """          if ((order.status === "pending" || order.status === "preparing") && !order.printedKOT) {
            
            // Check for Chai/Retail items that don't need KOT printing
            const isFrontCounterItem = (i: any) => i.isRetail || i.category === 'Retail' || i.category?.toLowerCase() === 'chai' || i.category?.toLowerCase() === 'chai ke sang';
            const kitchenItems = order.items.filter((i: any) => !isFrontCounterItem(i));
            
            if (kitchenItems.length === 0) {
              // Order ONLY contains front counter items. Skip printing, mark as printed.
              await updateDoc(doc(db, "orders", order.id), { printedKOT: true });
              return;
            }

            // Create a modified order object to send to the printer containing ONLY kitchen items
            const orderToPrint = { ...order, items: kitchenItems };

            if (printingRef.current.has(order.id)) return;
            printingRef.current.add(order.id);

            try {
              console.log(`🖨️ Attempting to send Order ${order.id} to Local Agent at http://127.0.0.1:5050/print...`);
              
              // Using 127.0.0.1 instead of localhost avoids some strict browser CORS/Mixed-Content blocks
              const res = await fetch('http://127.0.0.1:5050/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order: orderToPrint })
              });"""

content = content.replace(old_block, new_block)

with open('src/components/PrintAgent.tsx', 'w') as f:
    f.write(content)
