import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Fix 1: Remove "Quick Suggestions" block
quick_sugg_pattern = r"\{/\* Quick Suggestions block \*/\}.*?\{/\* Notes / Instructions Pill \*/\}"
content = re.sub(quick_sugg_pattern, "{/* Notes / Instructions Pill */}", content, flags=re.DOTALL)

# Fix 2: Simplify Empty State Box
old_empty_state = """<div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-500">No items added yet.</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[220px]">Select chai, snacks, or bakery specials to begin this order.</p>
                    </div>"""
new_empty_state = """<div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-500">No items added yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Select items from the menu to begin this order.</p>
                    </div>"""
content = content.replace(old_empty_state, new_empty_state)

# Fix 3: Action Buttons Row & Settle Tab / KOT CTA
# We need to rewrite the entire sticky footer block inside the non-empty branch.
# Let's find: `              {/* Action Buttons Row */}`
# down to:    `              </div>\n            </div>\n          )}`
# Wait, let's just use string replacement on the exact block.
old_footer = """{/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide transition flex items-center justify-center gap-2 shadow-xs">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                  Transfer Table
                </button>
                <button onClick={() => handleClearTable()} className="py-3 px-4 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs tracking-wide transition flex items-center justify-center gap-1.5 shadow-xs">
                  <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Clear Table
                </button>
              </div>

              {/* Settle Tab / KOT Order Flow CTA */}
              <div className="pt-1">
                {currentDraftItems.length > 0 && (
                  <button 
                    onClick={handleSendToKitchen}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <svg className="w-4 h-4 text-[#D9F927]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    {isSubmitting ? 'Sending...' : 'Send Ticket to Kitchen'}
                  </button>
                )}

                {currentDraftItems.length === 0 && selectedTable.status === 'preparing' && (
                  <button onClick={handleMarkServed} className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    Mark All as Served
                  </button>
                )}

                {currentDraftItems.length === 0 && (selectedTable.status === 'served' || selectedTable.status === 'awaiting_payment' || selectedTable.status === 'order_placed' || selectedTable.status === 'preparing') && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    <button 
                      onClick={() => handleMarkAwaitingPayment()} 
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
                )}
              </div>"""
              
new_footer = """{/* Settle Tab / KOT Order Flow CTA */}
              <div className="pt-2 flex flex-col gap-2">
                {displayItems.length === 0 ? (
                  <button disabled className="w-full py-4 px-4 rounded-xl bg-slate-100 text-slate-400 font-bold text-[15px] transition shadow-sm flex items-center justify-center gap-2">
                    Select Items to Begin Order
                  </button>
                ) : (
                  <>
                    {currentDraftItems.length > 0 && (
                      <button 
                        onClick={handleSendToKitchen}
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 rounded-xl bg-[#D9F927] hover:bg-[#c9e81f] text-slate-950 font-bold text-[15px] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        {isSubmitting ? 'Sending...' : 'Place Order'}
                      </button>
                    )}

                    {currentDraftItems.length === 0 && selectedTable.status === 'preparing' && (
                      <button onClick={handleMarkServed} className="w-full py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] transition shadow-md flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        Mark All as Served
                      </button>
                    )}

                    {currentDraftItems.length === 0 && (selectedTable.status === 'served' || selectedTable.status === 'awaiting_payment' || selectedTable.status === 'order_placed' || selectedTable.status === 'preparing') && (
                      <div className="flex flex-col gap-2.5">
                        <button 
                          onClick={() => handleMarkAwaitingPayment()} 
                          className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
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
                    )}
                    
                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-2 gap-3 pt-4 mt-2 border-t border-slate-100">
                      <button onClick={() => setIsTransferModalOpen(true)} className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm border border-slate-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        Transfer
                      </button>
                      <button onClick={() => handleClearTable()} className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm border border-slate-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>"""
content = content.replace(old_footer, new_footer)

with open(filepath, "w") as f:
    f.write(content)
