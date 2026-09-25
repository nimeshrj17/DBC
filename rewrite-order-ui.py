import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add notes to CartItem interface
content = content.replace(
    "interface CartItem extends MenuItem {\n  qty: number;\n}",
    "interface CartItem extends MenuItem {\n  qty: number;\n  notes?: string;\n}"
)

# 2. Add Status Helper function right after component start
status_helper = """  const { settings } = useSettings();

  const getStatusText = (s: string) => {
    if (s === 'pending') return 'Order Received';
    if (s === 'preparing') return 'Preparing';
    if (s === 'prepared') return 'Ready';
    if (s === 'served') return 'Served';
    return s.toUpperCase();
  };"""
content = content.replace("  const { settings } = useSettings();", status_helper)

# 3. Fix status text in active orders
content = content.replace(
    """<p className="text-sm font-bold text-[#5a3829]">{order.status}</p>""",
    """<p className="text-sm font-bold text-[#5a3829] uppercase">{getStatusText(order.status)}</p>"""
)

# 4. Fix Table's Order -> Order ID
content = content.replace("Table's Order", "Order ID")

# 5. Fix Veg icon to include text
veg_icon_old = """<span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span>"""
veg_icon_new = """<span className="w-4 h-4 border border-emerald-600 rounded-[3px] flex items-center justify-center" title="Pure Vegetarian"><span className="w-2 h-2 rounded-full bg-emerald-600"></span></span><span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest ml-1">VEG</span>"""
content = content.replace(veg_icon_old, veg_icon_new)

# 6. Fix item description rendering (remove clamp, hide if "null")
desc_old = """<p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{item.description}</p>"""
desc_new = """{item.description && item.description !== 'null' && <p className="text-xs text-stone-500 leading-relaxed">{item.description}</p>}"""
content = content.replace(desc_old, desc_new)

# 7. Unify button colors
# View Orders button
view_orders_old = """<button onClick={() => setViewingOrders(true)} className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-3.5 px-6 rounded-full shadow-[0_8px_20px_rgba(234,88,12,0.3)] transition-transform active:scale-95 flex items-center gap-2 z-30">"""
view_orders_new = """<button onClick={() => setViewingOrders(true)} className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#2b1a13] hover:bg-[#1c110b] text-white font-bold py-3.5 px-6 rounded-full shadow-[0_8px_20px_rgba(43,26,19,0.3)] transition-transform active:scale-95 flex items-center gap-2 z-30 border border-stone-700/50">"""
content = content.replace(view_orders_old, view_orders_new)

# Place Order button
place_old = """<button disabled={isSubmitting || cart.length === 0} onClick={executePlaceOrder} className="w-full bg-[#9c4c2d] hover:bg-[#853e22] text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all">"""
# Changed to open confirmation modal instead!
place_new = """<button disabled={isSubmitting || cart.length === 0} onClick={() => setIsConfirmModalOpen(true)} className="w-full bg-[#2b1a13] hover:bg-[#1c110b] text-white py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg flex items-center justify-center gap-2.5 transition-all">"""
content = content.replace(place_old, place_new)

# 8. Add confirm modal state
content = content.replace("const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);", "const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);\n  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);")

# 9. Inject confirm modal UI right before the end of the return statement
confirm_modal = """
      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsConfirmModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-center text-stone-900 mb-2">Confirm Your Table</h3>
            <p className="text-center text-stone-500 text-sm mb-6 leading-relaxed">
              Please double check that you are seated at <strong className="text-stone-800">Table {table.number}</strong>. Orders cannot be easily canceled once sent to the kitchen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors">Cancel</button>
              <button onClick={() => { setIsConfirmModalOpen(false); executePlaceOrder(); }} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#2b1a13] hover:bg-[#1c110b] transition-colors shadow-md">Confirm Order</button>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", confirm_modal + "\n    </div>\n  );\n}")

# 10. Add Cart Item Special Instructions and handle "null" bug there too
# Finding the cart item map block:
cart_item_block_old = """<h2 className="font-bold text-[#2c1f17] text-base leading-tight">{item.name}</h2>
                      <p className="text-xs text-gray-500">Unit price: ₹{item.price.toFixed(2)}</p>
                      <p className="text-base font-extrabold text-[#9c4c2d] pt-0.5">₹{(item.price * item.qty).toFixed(2)}</p>"""

cart_item_block_new = """<h2 className="font-bold text-[#2c1f17] text-base leading-tight">{item.name}</h2>
                      {item.description && item.description !== 'null' && <p className="text-xs text-stone-500 leading-relaxed mb-1">{item.description}</p>}
                      <p className="text-xs text-gray-500">Unit price: ₹{item.price.toFixed(2)}</p>
                      <p className="text-base font-extrabold text-[#9c4c2d] pt-0.5">₹{(item.price * item.qty).toFixed(2)}</p>
                      <input type="text" placeholder="Add special instructions (e.g. less spicy)..." className="mt-2 w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-colors" value={item.notes || ''} onChange={(e) => {
                        setCart(prev => prev.map(i => i.id === item.id ? { ...i, notes: e.target.value } : i));
                      }} />"""
content = content.replace(cart_item_block_old, cart_item_block_new)

# 11. Add Cancel/Edit Order Note to Active Orders View
# Search for <div className="mt-4 text-center px-2"> added in previous step
note_block_old = """<span>Order More Items</span>
          </button>
          <div className="mt-4 text-center px-2">
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Pay at counter for final bill.<br/>Soft drinks, cigarettes, and biscuits can be purchased from the counter.
            </p>
          </div>"""
note_block_new = """<span>Order More Items</span>
          </button>
          <div className="mt-4 text-center px-2">
            <p className="text-xs text-stone-500 leading-relaxed font-medium mb-2">
              Need to modify or cancel? Please contact our staff.
            </p>
            <div className="w-full h-px bg-stone-200 my-3"></div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Pay at counter for final bill.<br/>Soft drinks, cigarettes, and biscuits can be purchased from the counter.
            </p>
          </div>"""
content = content.replace(note_block_old, note_block_new)

# 12. Add hint for horizontal scroll in categories
# old: <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-2">
# new: <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-2 pr-8 shadow-[inset_-20px_0_20px_-20px_rgba(0,0,0,0.1)] relative">
# wait, better to just let the user see it's scrolling by adding a fade or an arrow.
cat_old = """<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-2">"""
cat_new = """<div className="relative">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-2 pr-6">"""
# and close it properly. Actually, just adding `pr-6` implies there's more since the last item gets cut off visually.
# But let's just make sure the `item.notes` are saved to the backend order!
content = content.replace(
    "items: kitchenItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty }))",
    "items: kitchenItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty, notes: i.notes || '' }))"
)
content = content.replace(
    "items: retailItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty }))",
    "items: retailItems.map(i => ({ menuItemId: i.id, name: i.name, price: i.price, category: i.category, qty: i.qty, notes: i.notes || '' }))"
)

# And render `item.notes` in the active orders view so they know it went through!
active_old = """<span className="font-medium text-stone-800">{item.name}</span>
                  </div>
                  <span className="font-semibold text-stone-800">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}"""
active_new = """<div className="flex flex-col">
                      <span className="font-medium text-stone-800">{item.name}</span>
                      {item.notes && <span className="text-[10px] text-stone-500 italic mt-0.5 max-w-[200px] truncate">Note: {item.notes}</span>}
                    </div>
                  </div>
                  <span className="font-semibold text-stone-800">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}"""
content = content.replace(active_old, active_new)

with open(filepath, "w") as f:
    f.write(content)
