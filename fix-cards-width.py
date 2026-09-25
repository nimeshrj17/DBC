import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update grid classes for narrower cards
old_grid = "grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 md:gap-6"
new_grid = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 md:gap-5"
content = content.replace(old_grid, new_grid)

# 2. Fix the Add New Table placeholder (it's a div, not a button, and has md:min-h-[250px])
old_add_table = """<div onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }} className="border-2 border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center p-4 md:p-6 text-center hover:border-[#B4D318] hover:bg-lime-50/20 transition cursor-pointer min-h-[160px] md:min-h-[250px] group">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-100 group-hover:bg-[#B4D318] flex items-center justify-center text-slate-500 group-hover:text-[#111315] transition shadow-sm mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <h5 className="text-[11px] md:text-sm font-bold text-slate-800">Add New Table</h5>
              </div>"""

new_add_table = """<div onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }} className="border border-dashed border-slate-300 bg-transparent hover:bg-slate-50/50 text-slate-400 hover:text-slate-600 rounded-none flex flex-col items-center justify-center gap-2 transition group opacity-70 hover:opacity-100 cursor-pointer min-h-[140px]">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-xs font-bold tracking-wide">Add New Table</span>
              </div>"""
content = content.replace(old_add_table, new_add_table)

with open(filepath, "w") as f:
    f.write(content)
