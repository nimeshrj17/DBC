import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_customer_block = """                {selectedTable.status !== 'empty' && selectedTable.customerName && (
                  <div className="mt-3.5 flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-medium">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span>Customer: <strong className="font-bold">{selectedTable.customerName}</strong></span>
                    </div>
                  </div>
                )}"""

good_customer_block = """                {selectedTable.status !== 'empty' && (
                  <div className="mt-3.5 flex items-center gap-2">
                    <button onClick={() => setAssignCustomerModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 hover:bg-amber-100 hover:border-amber-300 text-amber-900 text-xs font-medium transition-colors">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span>
                        {selectedTable.customerName && selectedTable.customerName !== 'Assigned by Admin' ? (
                          <>Customer: <strong className="font-bold">{selectedTable.customerName}</strong> <span className="text-[10px] text-amber-600/70 ml-1">(Edit)</span></>
                        ) : (
                          <>+ Assign Customer Details</>
                        )}
                      </span>
                    </button>
                  </div>
                )}"""

content = content.replace(bad_customer_block, good_customer_block)

with open(filepath, "w") as f:
    f.write(content)

