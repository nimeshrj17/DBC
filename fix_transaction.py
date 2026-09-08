with open('src/lib/hooks/useOrders.ts', 'r') as f:
    content = f.read()

find_block = """      // 3. Verify and deduct inventory
      const inventoryKeys = Object.keys(inventoryDeductions);
      for (const invId of inventoryKeys) {
        const invRef = doc(db, 'inventory', invId);
        const invSnap = await transaction.get(invRef);
        if (invSnap.exists()) {"""

replace_block = """      // 3. Verify and deduct inventory
      const inventoryKeys = Object.keys(inventoryDeductions);
      
      // READ PHASE: Fetch all required inventory docs FIRST (Firestore rule: all reads before any writes)
      const invRefs = inventoryKeys.map(invId => doc(db, 'inventory', invId));
      const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));
      
      // WRITE PHASE
      invSnaps.forEach((invSnap, index) => {
        const invId = inventoryKeys[index];
        const invRef = invRefs[index];
        if (invSnap.exists()) {"""

content = content.replace(find_block, replace_block)

# Since we replaced a 'for' loop with a 'forEach', we need to change 'continue' or 'break' if any, but looking closely there are none. Wait! We need to change the closing brace of the for loop.
find_close = """            orderId: idempotencyKey || 'new_order',
            timestamp: serverTimestamp()
          });
        }
      }
      
      // 4. Create the Order"""

replace_close = """            orderId: idempotencyKey || 'new_order',
            timestamp: serverTimestamp()
          });
        }
      });
      
      // 4. Create the Order"""

content = content.replace(find_close, replace_close)

with open('src/lib/hooks/useOrders.ts', 'w') as f:
    f.write(content)

