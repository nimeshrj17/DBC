const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const hookTarget = `const [clearTablePrompt, setClearTablePrompt] = useState<{tableId: string, hasUnpaid: boolean} | null>(null);`;
const hookReplacement = hookTarget + `\n  const [tablePins, setTablePins] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const res = await fetch('/api/staff/table-pins');
        if (res.ok) {
          const data = await res.json();
          setTablePins(data.pins || {});
        }
      } catch (e) {}
    };
    fetchPins();
    const interval = setInterval(fetchPins, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);`;

code = code.replace(hookTarget, hookReplacement);

const acceptTarget = `      toast.success(\`Order accepted! Table PIN: \${data.pin}\`, { duration: 15000 });`;
const acceptReplacement = `      toast.success(\`Order accepted! Table PIN: \${data.pin}\`, { duration: 15000 });\n      setTablePins(prev => ({ ...prev, [tableId]: data.pin }));`;

code = code.replace(acceptTarget, acceptReplacement);

// Now, render the PIN inside the TableCard.
// The table card starts with: <div className={`relative bg-white rounded-[20px] p-4 flex flex-col justify-between h-full border-2 transition-all ${getBorderColor(table)} ${table.status === 'occupied' ? 'shadow-md ring-2 ring-indigo-50 hover:border-indigo-300' : 'hover:border-slate-300 shadow-sm'}`}>
// The table name header: <h3 className="font-bold text-slate-900 flex items-center justify-between text-base mb-1">

const cardHeaderTarget = `<h3 className="font-bold text-slate-900 flex items-center justify-between text-base mb-1">
            <span className="truncate pr-2">{table.name || \`Table \${table.number}\`}</span>`;
const cardHeaderReplacement = `<h3 className="font-bold text-slate-900 flex items-center justify-between text-base mb-1">
            <span className="truncate pr-2 flex items-center gap-2">
              {table.name || \`Table \${table.number}\`}
              {tablePins[table.id] && (
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                  PIN: {tablePins[table.id]}
                </span>
              )}
            </span>`;

code = code.replace(cardHeaderTarget, cardHeaderReplacement);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
