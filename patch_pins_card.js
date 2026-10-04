const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const target = `{table.name && table.number ? <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{table.number}</span> : null}`;
const replacement = `{table.name && table.number ? <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{table.number}</span> : null}
            {tablePins[table.id] && (
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded tracking-widest">
                PIN:{tablePins[table.id]}
              </span>
            )}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
