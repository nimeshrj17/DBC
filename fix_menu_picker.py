import re

with open('src/components/dashboard/MenuPickerModal.tsx', 'r') as f:
    content = f.read()

# Add the sticky bottom cart bar for mobile
bottom_bar = """
        {/* Mobile Sticky Cart Bar */}
        <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between z-10 rounded-b-3xl">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{totalItemsCount} items</span>
            <span className="text-lg font-black text-slate-900 leading-tight">₹{totalCost.toFixed(2)}</span>
          </div>
          <button onClick={onClose} className="px-6 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-md transition flex items-center gap-2">
            Review Order
            <i className="w-5 h-5 las la-arrow-right"></i>
          </button>
        </div>
        
      </div>
    </div>
  );
}
"""

content = content.replace('      </div>\n    </div>\n  );\n}\n', bottom_bar)

with open('src/components/dashboard/MenuPickerModal.tsx', 'w') as f:
    f.write(content)

