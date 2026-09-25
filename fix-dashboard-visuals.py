import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update NewTableCard style logic
old_card_logic = """  let borderColor = 'border-slate-200';
  if (isAwaitingPayment) borderColor = 'border-amber-400 border-2';
  else if (!isVacant) borderColor = 'border-blue-500 border-2';

  return (
    <div onClick={() => {
      setSelectedTableId(table.id);
      if (isVacant && onQuickAssign) {
        onQuickAssign(table.id);
      }
    }} className={`bg-white rounded-none ${borderColor} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[140px]`}>"""

new_card_logic = """  let cardStyle = '';
  if (isAwaitingPayment) {
    cardStyle = 'bg-amber-50/40 border-amber-200 border-l-[6px] border-l-amber-500';
  } else if (!isVacant) {
    cardStyle = 'bg-blue-50/40 border-blue-200 border-l-[6px] border-l-blue-500';
  } else {
    cardStyle = 'bg-emerald-50/20 border-slate-200 border-l-[6px] border-l-emerald-400';
  }

  return (
    <div onClick={() => {
      setSelectedTableId(table.id);
      if (isVacant && onQuickAssign) {
        onQuickAssign(table.id);
      }
    }} className={`rounded-none border ${cardStyle} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[140px]`}>"""

content = content.replace(old_card_logic, new_card_logic)

# 2. Update Seat count badge
old_seat_badge = """<div className="flex items-center gap-1 text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-none text-[10px] font-bold">"""
new_seat_badge = """<div className="flex items-center gap-1 text-slate-700 bg-slate-200/70 border-none px-2 py-1 rounded-none text-[10px] font-bold">"""
content = content.replace(old_seat_badge, new_seat_badge)

# 3. Update "Open Table" button
old_open_table = """<button onClick={(e) => { e.stopPropagation(); onQuickAssign(table.id); }} className="flex-1 py-2 text-xs font-bold text-slate-700 hover:bg-[#D9F927] transition-colors flex items-center justify-center gap-1.5">"""
new_open_table = """<button onClick={(e) => { e.stopPropagation(); onQuickAssign(table.id); }} className="flex-1 py-2.5 text-xs font-bold text-slate-900 bg-[#D9F927] hover:bg-[#c9e81f] transition-colors flex items-center justify-center gap-1.5 shadow-inner">"""
content = content.replace(old_open_table, new_open_table)

# 4. Update "Add New Table" placeholder
# The placeholder is near the end, let's find it.
old_add_table = """<button onClick={() => setIsAddTableOpen(true)} className="min-h-[250px] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 rounded-none flex flex-col items-center justify-center gap-2 transition group">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </div>
                <span className="text-sm font-bold text-slate-600">Add New Table</span>
              </button>"""
# Wait, I might have changed the min-h earlier. Let's do a regex replacement.
add_table_pattern = r"<button onClick=\{\(\) => setIsAddTableOpen\(true\)\} className=\"min-h-\[\d+px\] border.*?Add New Table</span>\s*</button>"
new_add_table = """<button onClick={() => setIsAddTableOpen(true)} className="min-h-[140px] border border-dashed border-slate-300 bg-transparent hover:bg-slate-50/50 text-slate-400 hover:text-slate-600 rounded-none flex flex-col items-center justify-center gap-2 transition group opacity-70 hover:opacity-100">
                <Plus className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
                <span className="text-xs font-bold tracking-wide">Add New Table</span>
              </button>"""
content = re.sub(add_table_pattern, new_add_table, content, flags=re.DOTALL)

# 5. Zone Tabs color coding
# We need to insert a color array and modify the map.
# Find the header section: `<div className="flex flex-wrap items-center gap-6">`
# Let's replace the button mapping.
old_zone_map = """{Array.from(new Set(tables.map(t => String(t.section || 'Main Hall')))).map(z => (
              <button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-1.5 rounded-none transition ${activeZone === z ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{z} ({tables.filter(t => (t.section || 'Main Hall') === z).length})</button>
            ))}"""
new_zone_map = """{Array.from(new Set(tables.map(t => String(t.section || 'Main Hall')))).map((z, idx) => {
              const colors = ['bg-indigo-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400', 'bg-purple-400', 'bg-cyan-400'];
              const dotColor = colors[idx % colors.length];
              return (
                <button key={z} onClick={() => setActiveZone(z)} className={`px-4 py-1.5 rounded-none transition flex items-center gap-1.5 ${activeZone === z ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                  {z} ({tables.filter(t => (t.section || 'Main Hall') === z).length})
                </button>
              );
            })}"""
content = content.replace(old_zone_map, new_zone_map)

with open(filepath, "w") as f:
    f.write(content)
