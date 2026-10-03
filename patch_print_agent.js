const fs = require('fs');
let code = fs.readFileSync('src/components/PrintAgent.tsx', 'utf8');

if (!code.includes('useTables')) {
  code = code.replace("import { toast } from 'sonner';", "import { toast } from 'sonner';\nimport { useTables } from '@/lib/hooks/useTables';");
}

code = code.replace(
  'const printingRef = useRef<Set<string>>(new Set());',
  'const printingRef = useRef<Set<string>>(new Set());\n  const { tables } = useTables();'
);

// We need to use `tablesRef.current` inside the useEffect to get the latest tables without adding `tables` to the dependency array (which would re-trigger the snapshot listener constantly).
// Actually, easier: just fetch the table doc directly from firestore before sending, since printing is a one-time async action anyway.

code = fs.readFileSync('src/components/PrintAgent.tsx', 'utf8');

code = code.replace(
  "import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';",
  "import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';"
);

const replaceTarget = `const orderToPrint = { ...order, items: kitchenItems };`;
const replaceWith = `
            // Fetch real table name to fix legacy tableNumber bugs
            let realTableName = order.tableNumber;
            try {
              const tDoc = await getDoc(doc(db, 'tables', order.tableId));
              if (tDoc.exists()) {
                const tData = tDoc.data();
                realTableName = tData.name || tData.number || order.tableNumber;
              }
            } catch (e) {}

            const orderToPrint = { ...order, items: kitchenItems, tableNumber: realTableName, tableName: realTableName };`;

code = code.replace(replaceTarget, replaceWith);

fs.writeFileSync('src/components/PrintAgent.tsx', code);
