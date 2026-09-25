import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Rewrite NewTableCard completely
old_card_start = "const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign }: any) => {"
# Find the end of the NewTableCard function (before `export default function Dashboard`)
old_card_end = "export default function Dashboard"
card_match = re.search(r"const NewTableCard = .*?(?=export default function Dashboard)", content, flags=re.DOTALL)

if card_match:
    new_card = """const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign }: any) => {
  const tableOrders = table.activeOrderIds 
    ? orders.filter((o: any) => table.activeOrderIds.includes(o.id)) 
    : [];
  const tableTotal = tableOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const itemsCount = tableOrders.reduce((sum: number, o: any) => sum + o.items.length, 0);
  const firstItems = tableOrders.flatMap((o: any) => o.items).slice(0, 3).map((i: any) => `${i.qty}x ${i.name}`).join(', ');

  const isVacant = table.status === 'empty';
  const isAwaitingPayment = table.status === 'awaiting_payment';
  
  let borderColor = 'border-slate-200';
  if (isAwaitingPayment) borderColor = 'border-amber-400 border-2';
  else if (!isVacant) borderColor = 'border-blue-500 border-2';

  return (
    <div onClick={() => {
      setSelectedTableId(table.id);
      if (isVacant && onQuickAssign) {
        onQuickAssign(table.id);
      }
    }} className={`bg-white rounded-none ${borderColor} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[140px]`}>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-bold text-slate-900 leading-none">{table.name || `Table ${table.number}`}</h4>
            <div className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-none text-[10px] font-bold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>{table.seats}</span>
            </div>
          </div>
          {isVacant ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-bold text-slate-500 text-[10px] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> Available
            </span>
          ) : isAwaitingPayment ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-bold text-amber-700 text-[10px] uppercase tracking-wider bg-amber-50">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Bill Req
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 font-bold text-blue-700 text-[10px] uppercase tracking-wider bg-blue-50">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Occupied
            </span>
          )}
        </div>

        {!isVacant && (
          <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{itemsCount > 0 ? `${itemsCount} items` : 'No items yet'}</span>
              <span className="font-black text-slate-900">₹ {tableTotal.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{firstItems || '...'}</p>
          </div>
        )}
      </div>

      {/* Card Actions (Simplified) */}
      <div className="flex bg-slate-50 border-t border-slate-100">
        {!isVacant && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }} className="flex-1 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors border-r border-slate-200">
              Add Item
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClearTable(table); }} className="flex-1 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
              Clear Table
            </button>
          </>
        )}
        {isVacant && (
          <button onClick={(e) => { e.stopPropagation(); onQuickAssign(table.id); }} className="flex-1 py-2 text-xs font-bold text-slate-700 hover:bg-[#D9F927] transition-colors flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
            Open Table
          </button>
        )}
      </div>
    </div>
  );
};

"""
    content = content[:card_match.start()] + new_card + content[card_match.end():]


# 2. Fix Header / Controls Area
# Find `<section className="hidden md:block px-8 py-6 space-y-5">` up to `</section>`
header_pattern = r"<section className=\"hidden md:block px-8 py-6 space-y-5\">.*?</section>"
header_match = re.search(header_pattern, content, flags=re.DOTALL)

if header_match:
    new_header = """<section className="hidden md:block px-6 py-5 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold font-display text-slate-900 tracking-tight">Table Dashboard</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <input className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-none placeholder-slate-400 focus:ring-2 focus:ring-[#D9F927] focus:border-[#D9F927] outline-none" placeholder="Search tables..." type="text"/>
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <button onClick={() => setIsAddTableOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition" type="button">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <button onClick={() => setIsQuickSaleOpen(true)} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-none bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition" type="button">
              <span>Quick Sale</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="inline-flex gap-1 p-1 bg-slate-100/80 rounded-none text-xs font-bold">
            <button onClick={() => setActiveZone('All')} className={`px-4 py-1.5 rounded-none transition ${activeZone === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>All Zones ({tables.length})</button>
            {Array.from(new Set(tables.map(t => String(t.section || 'Main Hall')))).map(z => (
              <button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-1.5 rounded-none transition ${activeZone === z ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{z} ({tables.filter(t => (t.section || 'Main Hall') === z).length})</button>
            ))}
          </div>
          
          <div className="h-4 w-px bg-slate-200"></div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className={`inline-flex items-center gap-1.5 ${tables.filter(t => t.status !== 'empty' && t.status !== 'awaiting_payment').length === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${tables.filter(t => t.status !== 'empty' && t.status !== 'awaiting_payment').length === 0 ? 'bg-slate-300' : 'bg-blue-500'}`}></span> Occupied ({tables.filter(t => t.status !== 'empty' && t.status !== 'awaiting_payment').length})
            </span>
            <span className={`inline-flex items-center gap-1.5 ${tables.filter(t => t.status === 'awaiting_payment').length === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${tables.filter(t => t.status === 'awaiting_payment').length === 0 ? 'bg-slate-300' : 'bg-amber-500'}`}></span> Bill Requested ({tables.filter(t => t.status === 'awaiting_payment').length})
            </span>
            <span className={`inline-flex items-center gap-1.5 ${tables.filter(t => t.status === 'empty').length === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${tables.filter(t => t.status === 'empty').length === 0 ? 'bg-slate-300' : 'bg-slate-400'}`}></span> Available ({tables.filter(t => t.status === 'empty').length})
            </span>
          </div>
        </div>
      </section>"""
    
    content = content[:header_match.start()] + new_header + content[header_match.end():]

# Write back
with open(filepath, "w") as f:
    f.write(content)
