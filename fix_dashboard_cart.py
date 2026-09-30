import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Fix onClose in MenuPickerModal
old_modal = """      <MenuPickerModal 
        isOpen={isMenuOpen} 
        onClose={() => { setIsMenuOpen(false); setSelectedTableId(null); }} 
        onAddItem={handleAddItem} 
        currentDraftItems={currentDraftItems}
      />"""

new_modal = """      <MenuPickerModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onAddItem={handleAddItem} 
        currentDraftItems={currentDraftItems}
      />"""
content = content.replace(old_modal, new_modal)

# 2. Add 'Add Items' button in the cart sidebar
old_cart_header = """                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Current Order</h4>
                    <span className="text-xs text-slate-400">Order ID: #{selectedTable.activeOrderIds?.[0]?.slice(-6) || 'New'}</span>
                  </div>"""

new_cart_header = """                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Current Order</h4>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setIsMenuOpen(true)} className="text-xs font-bold text-[#10B981] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200">
                        + Add Items
                      </button>
                      <span className="text-xs text-slate-400">#{selectedTable.activeOrderIds?.[0]?.slice(-6) || 'New'}</span>
                    </div>
                  </div>"""
content = content.replace(old_cart_header, new_cart_header)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
