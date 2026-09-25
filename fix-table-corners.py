import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Main NewTableCard outer div
bad_table_card_div = "className={`bg-white rounded-2xl ${borderColor} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[180px] md:min-h-[250px]`}"
good_table_card_div = "className={`bg-white rounded-none ${borderColor} shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition group cursor-pointer h-full min-h-[180px] md:min-h-[250px]`}"
content = content.replace(bad_table_card_div, good_table_card_div)

# 2. Quick Add Table Card outer div
bad_quick_add_div = "className=\"border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 md:p-6 text-center hover:border-[#B4D318] hover:bg-lime-50/20 transition cursor-pointer min-h-[160px] md:min-h-[250px] group\""
good_quick_add_div = "className=\"border-2 border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center p-4 md:p-6 text-center hover:border-[#B4D318] hover:bg-lime-50/20 transition cursor-pointer min-h-[160px] md:min-h-[250px] group\""
content = content.replace(bad_quick_add_div, good_quick_add_div)

# Optional: also make inner boxes sharp in NewTableCard
content = content.replace("className=\"my-5 py-4 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center", "className=\"my-5 py-4 border border-dashed border-slate-200 rounded-none flex flex-col items-center justify-center")
content = content.replace("className=\"mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200\"", "className=\"mt-4 p-3 bg-amber-50 rounded-none border border-amber-200\"")
content = content.replace("className=\"mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100/80\"", "className=\"mt-4 p-3 bg-blue-50/60 rounded-none border border-blue-100/80\"")

# Optional: Buttons inside NewTableCard
content = content.replace("className=\"w-full py-2 px-3 rounded-xl bg-[#B4D318]", "className=\"w-full py-2 px-3 rounded-none bg-[#B4D318]")
content = content.replace("className=\"w-full py-1.5 px-3 rounded-xl border border-slate-200", "className=\"w-full py-1.5 px-3 rounded-none border border-slate-200")
content = content.replace("className=\"w-full py-2 px-3 rounded-xl bg-amber-500", "className=\"w-full py-2 px-3 rounded-none bg-amber-500")
content = content.replace("className=\"w-full py-2 px-3 rounded-xl bg-blue-600", "className=\"w-full py-2 px-3 rounded-none bg-blue-600")

with open(filepath, "w") as f:
    f.write(content)
