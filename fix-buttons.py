import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix Cart Stepper Container and Buttons
content = content.replace('bg-[#F3ECE5] rounded-none p-1 border border-[#e5dcd2]', 'bg-[#F3ECE5] rounded-full p-1 border border-[#e5dcd2]')
content = content.replace('w-8 h-8 rounded-none bg-white border border-stone-300', 'w-8 h-8 rounded-full bg-white border border-stone-300')
content = content.replace('w-8 h-8 rounded-none bg-[#2c1f17]', 'w-8 h-8 rounded-full bg-[#2c1f17]')

# Fix + Add button
content = content.replace('px-5 py-2 rounded-none text-xs font-bold hover:bg-[#3c2217]', 'px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#3c2217]')

# Fix Place Order and other big primary buttons
content = content.replace('w-full bg-[#2b1a13] hover:bg-[#1c110b] text-white py-3.5 px-6 rounded-none', 'w-full bg-[#2b1a13] hover:bg-[#1c110b] text-white py-3.5 px-6 rounded-2xl')

# Fix Order More Items
content = content.replace('w-full py-3.5 px-4 rounded-none bg-[#5a3829] hover:bg-[#382117]', 'w-full py-3.5 px-4 rounded-2xl bg-[#5a3829] hover:bg-[#382117]')

# Fix small floating View Orders / View Cart button (Wait, I thought I made them dark brown? Why does grep show bg-amber-500? I guess I missed those!)
content = content.replace('px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-extrabold text-xs rounded-none', 'px-5 py-3 bg-[#2b1a13] hover:bg-[#1c110b] active:scale-95 text-white font-bold text-sm rounded-full shadow-[0_8px_20px_rgba(43,26,19,0.3)]')

# Fix Modal Action Buttons (Cancel / Confirm / Back / I Have Paid)
content = content.replace('py-3 bg-stone-200 hover:bg-stone-300 rounded-none', 'py-3 bg-stone-200 hover:bg-stone-300 rounded-xl')
content = content.replace('py-3 px-4 rounded-none font-bold text-stone-600 bg-stone-100', 'py-3 px-4 rounded-xl font-bold text-stone-600 bg-stone-100')
content = content.replace('py-3 px-4 rounded-none font-bold text-white bg-[#2b1a13]', 'py-3 px-4 rounded-xl font-bold text-white bg-[#2b1a13]')
content = content.replace('py-3.5 px-4 rounded-none border border-stone-300', 'py-3.5 px-4 rounded-xl border border-stone-300')
content = content.replace('py-3.5 px-4 bg-[#2b1a13] hover:bg-[#1c110b] active:scale-[0.98] text-white rounded-none', 'py-3.5 px-4 bg-[#2b1a13] hover:bg-[#1c110b] active:scale-[0.98] text-white rounded-xl')

# Fix Close Buttons (X icons)
content = content.replace('p-2 rounded-none hover:bg-stone-200/80', 'p-2 rounded-full hover:bg-stone-200/80')

# Fix Input fields (Search, Notes)
content = content.replace('rounded-none py-3 px-4 border border-stone-200', 'rounded-xl py-3 px-4 border border-stone-200')
content = content.replace('rounded-none focus:outline-none', 'rounded-lg focus:outline-none') # If any

# Ensure the notes field is rounded-lg (wait, looking at previous code, it had `rounded-lg` but maybe I replaced it globally)
# Let's just do a quick re-insert if needed.
# Let's fix Tip button/Payment buttons
content = content.replace('bg-[#FAF7F2] hover:bg-[#F3ECE5] text-[#2b1a13] text-xs font-bold transition-colors py-2 px-3 rounded-none', 'bg-[#FAF7F2] hover:bg-[#F3ECE5] text-[#2b1a13] text-xs font-bold transition-colors py-2 px-3 rounded-xl')
content = content.replace('rounded-none bg-[#FAF7F2] hover:bg-[#F3ECE5]', 'rounded-xl bg-[#FAF7F2] hover:bg-[#F3ECE5]')

with open(filepath, "w") as f:
    f.write(content)
