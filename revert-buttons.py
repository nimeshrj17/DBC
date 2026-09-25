import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_merged_button = """                  <button onClick={() => {
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

good_split_buttons = """                  <button onClick={() => {
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

if bad_merged_button in content:
    content = content.replace(bad_merged_button, good_split_buttons)
else:
    print("Could not find the exact merged button block. Doing regex search.")
    # fallback regex if exact match fails due to indentation
    pattern = r"<button onClick=\{\(\) => \{[^}]*// Merge Print & Settle[^<]*</button>"
    content = re.sub(pattern, good_split_buttons, content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)

