import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Target the exact header to replace
header_pattern = r'<div className="flex items-center justify-between mb-3 md:mb-4 mt-4">\s*<div className="flex items-center gap-2 md:gap-2\.5">\s*<span className="w-2\.5 h-2\.5 md:w-3 md:h-3 rounded-full bg-slate-300"></span>\s*<h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">\{section\}</h4>\s*<span className="text-xs font-semibold px-2 py-0\.5 rounded-full bg-slate-200/80 text-slate-700">\s*\{tables\.filter\(t => t\.status === \'empty\' && \(t\.section \|\| \'Main Hall\'\) === section\)\.length\} Available\s*</span>\s*</div>\s*</div>'

new_header = """<div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-slate-300"></span>
                <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">{section}</h4>
              </div>
              <span className="text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                {tables.filter(t => t.status === 'empty' && (t.section || 'Main Hall') === section).length} Available
              </span>
              <button 
                onClick={() => { setNewTableSection(section); setIsAddTableOpen(true); }}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors border border-slate-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                Add Table
              </button>
            </div>"""

content = re.sub(header_pattern, new_header, content)

# 2. Add inline-block w-full to the section to fix CSS masonry vertical alignment
old_section = '<section key={section} className="break-inside-avoid mb-8">'
new_section = '<section key={section} className="break-inside-avoid inline-block w-full mb-8">'
content = content.replace(old_section, new_section)

# 3. Target the "Add New Table" block to remove
# We will use regex to find the exact comment and the div following it up to its closing tag.
add_block_pattern = r'\{\/\* Quick Add Table Card Prompt \*\/\}\s*<div onClick=\{[^}]+\} className="border border-dashed border-slate-300 bg-transparent hover:bg-slate-50/50 text-slate-400 hover:text-slate-600 rounded-none flex flex-col items-center justify-center gap-2 transition group opacity-70 hover:opacity-100 cursor-pointer min-h-\[140px\]">\s*<svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2\.5" viewBox="0 0 24 24">\s*<path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>\s*</svg>\s*<span className="text-xs font-bold tracking-wide">Add New Table</span>\s*</div>'

content = re.sub(add_block_pattern, "", content)

# 4. Remove mt-4 from the header container (handled by replacing in step 1, where `mb-3 md:mb-4 mt-4` -> `mb-3 md:mb-4`)
# But let's also add mt-4 to the masonry container if we need spacing above it.
old_masonry = '<div className="columns-1 xl:columns-2 gap-x-6 gap-y-0">'
new_masonry = '<div className="columns-1 xl:columns-2 gap-x-6 gap-y-0 mt-4">'
content = content.replace(old_masonry, new_masonry)

with open(filepath, "w") as f:
    f.write(content)
