import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Remove table name from the UI
content = content.replace("table.name || `Table ${table.number}`", "`Table ${table.number}`")

# 2. Add text below "Order More Items"
old_button = """<button onClick={() => setViewingOrders(false)} className="w-full py-3.5 px-4 rounded-xl bg-[#5a3829] hover:bg-[#382117] text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
</svg>
<span>Order More Items</span>
          </button>"""

new_button = """<button onClick={() => setViewingOrders(false)} className="w-full py-3.5 px-4 rounded-xl bg-[#5a3829] hover:bg-[#382117] text-white font-bold text-sm tracking-wide shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
</svg>
<span>Order More Items</span>
          </button>
          <div className="mt-4 text-center px-2">
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Pay at counter for final bill.<br/>Soft drinks, cigarettes, and biscuits can be purchased from the counter.
            </p>
          </div>"""

content = content.replace(old_button, new_button)

with open(filepath, "w") as f:
    f.write(content)
