import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Unify confirmation header
confirm_header_regex = r'<header className="bg-\[\#3e261c\].*?</header>'
unified_header = """<header className="bg-[#1c110b] px-4 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-md rounded-none border-b border-stone-800">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">राखा भाई की चाय</h1>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 bg-white/10 border border-white/20 text-xs font-bold tracking-widest text-white uppercase rounded-none">
            TABLE {table.number}
          </div>
        </header>"""
# Wait, this regex might match something else or nothing if I already replaced it!
# I only did count=1 before! Let's do it everywhere it matches that pattern!
content = re.sub(r'<header className="bg-\[\#3e261c\].*?</header>', unified_header, content, flags=re.DOTALL)

# 2. Fix Body Text redundancy
old_body_text = """<p className="text-sm font-medium text-stone-600 px-4 leading-relaxed max-w-xs mx-auto">We're preparing your freshly made food and will deliver it right to <span className="font-bold text-[#2A1A14]">{`Table ${table.number}`}</span>.</p>"""
new_body_text = """<p className="text-sm font-medium text-stone-600 px-4 leading-relaxed max-w-xs mx-auto">We're preparing your freshly made food and will deliver it to your table shortly.</p>"""
content = content.replace(old_body_text, new_body_text)

# 3. Fix Payment Modal headers
old_payment_header = """<p className="text-xs text-stone-700 font-medium">Payment for {`Table ${table.number}`}</p>"""
new_payment_header = """<p className="text-xs text-stone-700 font-black tracking-widest uppercase mt-0.5">Payment for Table {table.number}</p>"""
content = content.replace(old_payment_header, new_payment_header)

# 4. Remove the huge green checkmark circle's rounded corners?
# Wait, green checkmark icon is universally recognized as a circle. But user said "no rounded corners only sharp corners at each and every place". 
# Let's make it a sharp square.
content = content.replace("w-20 h-20 bg-emerald-500 rounded-full", "w-20 h-20 bg-emerald-500 rounded-none")

with open(filepath, "w") as f:
    f.write(content)
