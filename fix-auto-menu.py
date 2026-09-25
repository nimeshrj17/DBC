import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Remove Add items from menu button
add_items_button_pattern = r"                  \{selectedTable\.status !== 'awaiting_payment' && \(\n                    <button onClick=\{\(\) => setIsMenuOpen\(true\)\} className=\"w-full mt-4 py-3\.5 px-4 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-600 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 group shadow-xs\">\n                      <svg className=\"w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\.2\" viewBox=\"0 0 24 24\">\n                        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M12 4v16m8-8H4\"></path>\n                      </svg>\n                      Add items from menu\n                    </button>\n                  \)\}"

content = re.sub(add_items_button_pattern, "", content, flags=re.DOTALL)

# 2. Make NewTableCard open menu for active tables too
old_set = "setSelectedTableId={setSelectedTableId}"
new_set = "setSelectedTableId={(id: string) => { setSelectedTableId(id); setIsMenuOpen(true); }}"

content = content.replace(old_set, new_set)

with open(filepath, "w") as f:
    f.write(content)

