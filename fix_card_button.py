import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add hasPendingChai logic to NewTableCard
old_vars = """  const isVacant = table.status === 'empty';
  const isAwaitingPayment = table.status === 'awaiting_payment';"""

new_vars = """  const isVacant = table.status === 'empty';
  const isAwaitingPayment = table.status === 'awaiting_payment';
  
  const pendingChaiOrders = tableOrders.filter((o: any) => 
    o.status !== 'served' && o.status !== 'billed' && o.status !== 'completed' &&
    o.items.some((i: any) => i.category?.toLowerCase() === 'chai' || i.category?.toLowerCase() === 'chai ke sang')
  );
  const hasPendingChai = pendingChaiOrders.length > 0;"""

content = content.replace(old_vars, new_vars)


# 2. Add badge to the top right of the card
old_badge = """          {isVacant ? (
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
          )}"""

new_badge = """          <div className="flex flex-col items-end gap-1">
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
            {hasPendingChai && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 font-bold text-amber-900 text-[10px] uppercase tracking-wider bg-amber-100 rounded-md border border-amber-300 animate-pulse shadow-sm">
                ☕ Chai Order
              </span>
            )}
          </div>"""

content = content.replace(old_badge, new_badge)

# 3. Add 'Serve Chai' button to card actions
old_actions = """        {!isVacant && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200">
              Add Item
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMarkServed(table.id, table.activeOrderIds || []); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200">
              Served
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClearTable(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
              Clear
            </button>
          </>
        )}"""

new_actions = """        {!isVacant && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200">
              Add Item
            </button>
            {hasPendingChai ? (
              <button onClick={(e) => { e.stopPropagation(); onMarkServed(table.id, pendingChaiOrders.map((o: any) => o.id)); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200 bg-amber-50">
                Serve Chai
              </button>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onMarkServed(table.id, table.activeOrderIds || []); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200">
                Served
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClearTable(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
              Clear
            </button>
          </>
        )}"""

content = content.replace(old_actions, new_actions)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
