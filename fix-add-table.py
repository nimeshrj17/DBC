import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Update the section header
old_header = """              <div className="flex items-center justify-between mb-3 md:mb-4 mt-4">
                <div className="flex items-center gap-2 md:gap-2.5">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></span>
                  <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">{section}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {tables.filter(t => t.status === 'empty' && (t.section || 'Main Hall') === section).length} Available
                  </span>
                </div>
              </div>"""

new_header = """              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 mt-4">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></span>
                  <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">{section}</h4>
                </div>
                <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {tables.filter(t => t.status === 'empty' && (t.section || 'Main Hall') === section).length} Available
                </span>
                <button 
                  onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors border border-slate-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                  Add Table
                </button>
              </div>"""

content = content.replace(old_header, new_header)

# 2. Remove the Add New Table block at the end of the section
add_block_pattern = r"\{/\* Quick Add Table Card Prompt \*/\}.*?</div>\s*</div>"
# Wait, this will remove the closing `</div>` of the grid.
# The block looks exactly like:
#              {/* Quick Add Table Card Prompt */}
#              <div onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }} className="border border-dashed border-slate-300 bg-transparent hover:bg-slate-50/50 text-slate-400 hover:text-slate-600 rounded-none flex flex-col items-center justify-center gap-2 transition group opacity-70 hover:opacity-100 cursor-pointer min-h-[140px]">
#                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
#                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
#                </svg>
#                <span className="text-xs font-bold tracking-wide">Add New Table</span>
#              </div>
#            </div>

# Let's target exactly the `div` and leave the closing `</div>` of the grid wrapper intact.
add_block = """              {/* Quick Add Table Card Prompt */}
              <div onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }} className="border border-dashed border-slate-300 bg-transparent hover:bg-slate-50/50 text-slate-400 hover:text-slate-600 rounded-none flex flex-col items-center justify-center gap-2 transition group opacity-70 hover:opacity-100 cursor-pointer min-h-[140px]">
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-xs font-bold tracking-wide">Add New Table</span>
              </div>"""
content = content.replace(add_block, "")


with open(filepath, "w") as f:
    f.write(content)
