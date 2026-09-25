import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Unify headers (Menu Header)
menu_header_regex = r'<header className="bg-\[\#3e261c\].*?</header>'
unified_header = """<header className="bg-[#1c110b] px-4 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-md rounded-none border-b border-stone-800">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">राखा भाई की चाय</h1>
          </div>
          <div className="inline-flex items-center px-2.5 py-1 bg-white/10 border border-white/20 text-xs font-bold tracking-widest text-white uppercase rounded-none">
            TABLE {table.number}
          </div>
        </header>"""
content = re.sub(menu_header_regex, unified_header, content, count=1, flags=re.DOTALL)

# 2. Unify headers (Tracker Header)
tracker_header_regex = r'<header className="bg-\[\#2b1a13\].*?</header>'
content = re.sub(tracker_header_regex, unified_header, content, count=1, flags=re.DOTALL)

# 3. Corner Radii flattening (removing rounded borders)
rounded_classes = ['rounded-2xl', 'rounded-xl', 'rounded-lg', 'rounded-md', 'rounded-3xl', 'rounded-t-[32px]']
for r in rounded_classes:
    content = content.replace(r, "rounded-none")

# Force full rounding on buttons to none
content = content.replace("rounded-full shadow-[0_8px_20px_rgba", "rounded-none shadow-xl")
content = content.replace("rounded-full bg-[#2c1f17]", "rounded-none bg-[#2c1f17]")
content = content.replace("rounded-full bg-white", "rounded-none bg-white")
content = content.replace("rounded-full hover:bg-stone-200/80", "rounded-none hover:bg-stone-200/80")
content = content.replace("rounded-full bg-[#ea580c]", "rounded-none bg-[#1c110b]")
content = content.replace("rounded-full bg-[#2b1a13]", "rounded-none bg-[#2b1a13]")

# 4. Typography Casing and Weights
# Headings
content = content.replace('<h2 className="text-2xl font-black text-[#5a3829] tracking-tight mb-2">Order Sent to Kitchen!</h2>', '<h2 className="text-xl font-black text-stone-900 tracking-widest uppercase mb-3">Order Sent to Kitchen</h2>')
content = content.replace('<h2 className="text-2xl font-black text-stone-900 tracking-tight mb-4">Your Cart</h2>', '<h2 className="text-xl font-black text-stone-900 tracking-widest uppercase mb-4">Your Cart</h2>')

# Tracker Steps Casing
content = content.replace(">Order Received<", ">ORDER RECEIVED<")
content = content.replace(">Preparing in Kitchen<", ">PREPARING IN KITCHEN<")
content = content.replace(">Ready to Serve<", ">READY TO SERVE<")
content = content.replace(">Order ID<", ">ORDER ID<")
content = content.replace(">Table's Order<", ">ORDER ID<")
content = content.replace("text-[11px] uppercase tracking-wider font-semibold text-stone-400", "text-[10px] uppercase tracking-widest font-black text-stone-500")

# High Contrast Body Text
content = content.replace("text-stone-500", "text-stone-700")
content = content.replace("text-gray-500", "text-stone-700")

# 5. Tracker Icons Logic
step1_old = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep >= 1 ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>"""
step1_new = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep > 1 ? 'bg-emerald-100 text-emerald-700' : currentStep === 1 ? 'bg-[#1c110b] text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {currentStep > 1 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> : currentStep === 1 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> : <div className="w-2 h-2 rounded-none bg-stone-300"></div>}
                  </div>"""
content = content.replace(step1_old, step1_new)

step2_old = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep >= 2 ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>"""
step2_new = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep > 2 ? 'bg-emerald-100 text-emerald-700' : currentStep === 2 ? 'bg-[#1c110b] text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {currentStep > 2 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> : currentStep === 2 ? <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> : <div className="w-2 h-2 rounded-none bg-stone-300"></div>}
                  </div>"""
content = content.replace(step2_old, step2_new)

step3_old = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep >= 3 ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>"""
step3_new = """<div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${currentStep >= 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                    {currentStep >= 3 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> : <div className="w-2 h-2 rounded-none bg-stone-300"></div>}
                  </div>"""
content = content.replace(step3_old, step3_new)

# In Progress Pills - Make them consistent styling, not amber
in_prog_old = """<span className="text-[10px] bg-amber-100/70 text-amber-800 font-semibold px-2 py-0.5 rounded-none">In Progress</span>"""
in_prog_new = """<span className="text-[9px] bg-stone-200 text-stone-800 font-bold px-2 py-0.5 rounded-none uppercase tracking-widest border border-stone-300">Active</span>"""
content = content.replace(in_prog_old, in_prog_new)

# 6. Stepper buttons in cart
stepper_minus_old = """<button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-none bg-white flex items-center justify-center text-[#2c1f17] font-bold text-base shadow-sm hover:bg-stone-50 active:scale-90 transition-transform">−</button>"""
stepper_minus_new = """<button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-none bg-white border border-stone-300 flex items-center justify-center text-stone-600 font-bold text-base shadow-sm hover:bg-stone-50 hover:text-red-600 active:scale-90 transition-all">{item.qty === 1 ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> : "−"}</button>"""
content = content.replace(stepper_minus_old, stepper_minus_new)

with open(filepath, "w") as f:
    f.write(content)
