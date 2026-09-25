import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/MenuPickerModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Search placeholder
content = content.replace('placeholder="Search menu items or codes (#G1)..."', 'placeholder="Search menu items..."')

# 2. Sidebar active category styling
old_active_cat = "'font-bold bg-blue-50/50 text-blue-700 border-l-4 border-l-blue-600'"
new_active_cat = "'font-bold bg-slate-900 text-white border-l-4 border-l-[#D9F927]'"
content = content.replace(old_active_cat, new_active_cat)

# 3. Item Card fixes:
# - Remove item codes
code_pattern = r"\{item\.itemNumber && <span className=\"absolute top-3 right-3.*?</span>\}"
content = re.sub(code_pattern, "", content)

# - Reduce min-height and padding
content = content.replace("min-h-[110px]", "")
content = content.replace("p-3.5", "p-3")

# - Price color (emerald-600 -> slate-900)
content = content.replace("text-emerald-600", "text-slate-900")

# - Blue Plus Button -> Subtle Button
old_btn = "'bg-blue-600 text-white'"
new_btn = "'bg-slate-100 text-slate-500 hover:bg-slate-200'"
content = content.replace(old_btn, new_btn)

old_btn_wrap = "w-7 h-7 rounded-full"
new_btn_wrap = "w-6 h-6 rounded-md"
content = content.replace(old_btn_wrap, new_btn_wrap)

# 4. Remove Sticky Footer
footer_pattern = r"\{/\* Sticky Footer \*/\}.*?</div>\s*</div>\s*</div>\s*</div>\s*\);\s*\}"
new_end = "      </div>\n    </div>\n  );\n}"
content = re.sub(footer_pattern, new_end, content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)
