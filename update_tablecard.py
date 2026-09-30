import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add handleMarkTableServed before handleClearTable
new_func = """
  const handleMarkTableServed = async (tableId: string, orderIds: string[]) => {
    if (!tableId || !orderIds || orderIds.length === 0) return;
    try {
      await Promise.all(orderIds.map(oId => updateOrderStatus(oId, 'served')));
      await updateTableStatus(tableId, 'served', orderIds);
      toast.success("Marked as served");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark served");
    }
  };

  const handleClearTable"""

content = content.replace("  const handleClearTable", new_func)

# 2. Add onMarkServed to NewTableCard signature
content = content.replace(
    "const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign }: any) => {",
    "const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign, onMarkServed }: any) => {"
)

# 3. Add the Mark Served button to the Card Actions
old_card_actions = """        {!isVacant && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors border-b xl:border-b-0 xl:border-r border-slate-200">
              Add Item
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClearTable(table.id); }} className="flex-1 py-2 text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors">
              Clear Table
            </button>
          </>
        )}"""

new_card_actions = """        {!isVacant && (
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
content = content.replace(old_card_actions, new_card_actions)


# 4. Pass onMarkServed to NewTableCard everywhere it is used
content = content.replace("onClearTable={handleClearTable}", "onClearTable={handleClearTable}\n                    onMarkServed={handleMarkTableServed}")

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

