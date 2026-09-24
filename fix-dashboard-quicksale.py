import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Import QuickSaleModal
content = content.replace(
    "import { FloorMap } from '@/components/dashboard/FloorMap';",
    "import { FloorMap } from '@/components/dashboard/FloorMap';\nimport { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';"
)

# Add State
content = content.replace(
    "const [isAddTableOpen, setIsAddTableOpen] = useState(false);",
    "const [isAddTableOpen, setIsAddTableOpen] = useState(false);\n  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);"
)

# Add "⚡ Quick Sale" button to Desktop UI (near Add Table)
bad_add_table_btn = """              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">"""

good_add_table_btn = """              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <button onClick={() => setIsQuickSaleOpen(true)} className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-sm shadow-sm transition" type="button">
              <span>⚡ Quick Sale</span>
            </button>
            <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">"""

content = content.replace(bad_add_table_btn, good_add_table_btn, 1)

# Add to Mobile UI
bad_add_table_btn_mobile = """            <button onClick={() => setIsAddTableOpen(true)} className="bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">"""

good_add_table_btn_mobile = """            <button onClick={() => setIsQuickSaleOpen(true)} className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-2 rounded-xl text-xs shadow-sm mx-1" type="button">
              ⚡ Sale
            </button>
            <button onClick={() => setIsAddTableOpen(true)} className="bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[3]" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Add Table</span>
            </button>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">"""

content = content.replace(bad_add_table_btn_mobile, good_add_table_btn_mobile, 1)

# Merge Print and Settle Bill (Fix 5)
bad_settle_btns = """                  <button onClick={() => {
                    const printStr = printBillString(selectedTable.id, true);
                    const newWin = window.open('', '_blank');
                    if (newWin) {
                      newWin.document.write(`<pre style="font-family: monospace;">${printStr}</pre>`);
                      newWin.document.close();
                      newWin.print();
                    }
                  }} className="w-full py-3.5 px-5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    <span>Print Final Bill</span>
                  </button>
                  <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3.5 px-5 bg-[#111315] hover:bg-[#1f2226] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    <Banknote className="w-4 h-4" />
                    <span>Settle Bill / Payment</span>
                  </button>"""

good_settle_btns = """                  <button onClick={() => {
                    // Merge Print & Settle
                    const printStr = printBillString(selectedTable.id, true);
                    const newWin = window.open('', '_blank');
                    if (newWin) {
                      newWin.document.write(`<pre style="font-family: monospace;">${printStr}</pre>`);
                      newWin.document.close();
                      newWin.print();
                    }
                    setIsPaymentModalOpen(true);
                  }} className="w-full py-4 px-5 bg-[#111315] hover:bg-[#1f2226] text-white font-bold text-[15px] rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    <Banknote className="w-5 h-5 text-[#D9F927]" />
                    <span>Bill & Settle</span>
                  </button>"""

content = content.replace(bad_settle_btns, good_settle_btns)

# Mount QuickSaleModal
parts = content.rsplit("    </>\n  );\n}", 1)
modal_mount = "\n      <QuickSaleModal isOpen={isQuickSaleOpen} onClose={() => setIsQuickSaleOpen(false)} />\n"
content = parts[0] + modal_mount + "    </>\n  );\n}"

with open(filepath, "w") as f:
    f.write(content)

