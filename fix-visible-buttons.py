import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_buttons = """                {currentDraftItems.length === 0 && selectedTable.status === 'served' && (
                  <button onClick={handleMarkAwaitingPayment} className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print Final Bill
                  </button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'awaiting_payment' && (
                  <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <Banknote className="w-4 h-4 text-[#D9F927]" />
                    Settle Bill / Payment
                  </button>
                )}"""

good_buttons = """                {currentDraftItems.length === 0 && (selectedTable.status === 'served' || selectedTable.status === 'awaiting_payment' || selectedTable.status === 'order_placed' || selectedTable.status === 'preparing') && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    <button 
                      onClick={() => {
                        const printStr = printBillString(selectedTable.id, true);
                        const newWin = window.open('', '_blank');
                        if (newWin) {
                          newWin.document.write(`<pre style="font-family: monospace;">${printStr}</pre>`);
                          newWin.document.close();
                          newWin.print();
                        }
                        // Optionally update status to awaiting payment in background if not already
                        if (selectedTable.status !== 'awaiting_payment') {
                          handleMarkAwaitingPayment();
                        }
                      }} 
                      className="w-full py-3.5 px-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      Print Final Bill
                    </button>
                    
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)} 
                      className="w-full py-4 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[15px] transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Banknote className="w-5 h-5 text-[#D9F927]" />
                      Settle Bill / Payment
                    </button>
                  </div>
                )}"""

content = content.replace(bad_buttons, good_buttons)

with open(filepath, "w") as f:
    f.write(content)

