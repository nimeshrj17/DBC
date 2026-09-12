import re

with open("src/app/dashboard/page.tsx", "r") as f:
    content = f.read()

# We want to replace from:
#       {/* Side Panel Overlay */}
#       {selectedTable && (
# down to the line before:
#             ) : (
#               <div className="space-y-6">

pattern = re.compile(
    r'\{\/\*\s*Side Panel Overlay\s*\*\/\}.*?\{selectedTable\.status === \'empty\' \? \([\s\S]*?\) \: \(',
    re.MULTILINE | re.DOTALL
)

new_block = """{/* Side Panel Overlay */}
      {selectedTable && (
        <aside className="fixed right-0 top-0 h-full w-[430px] max-w-full flex-shrink-0 bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 z-50 slideover-shadow" data-purpose="table-detail-drawer">
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedTable.name || `Table ${selectedTable.number}`}</h3>
                  <button 
                    onClick={() => {
                      setEditingTableId(selectedTable.id);
                      setNewTableNum(selectedTable.number.toString());
                      setNewTableSeats(selectedTable.seats.toString());
                      setNewTableName(selectedTable.name || '');
                      setNewTableSection(selectedTable.section || 'Inner Hall');
                      setIsAddTableOpen(true);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100" title="Edit Table Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{selectedTable.seats} Seats • Zone {selectedTable.section || 'Main Hall'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(selectedTable.status)}`}>
                {getStatusBadge(selectedTable.status)}
              </span>
              <button onClick={() => setSelectedTableId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Close Drawer">
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {selectedTable.status === 'empty' ? (
              <div className="h-full flex flex-col justify-between">
                {/* Drawer Body: Empty State Illustration & Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  {/* Empty State Visual Icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <LayoutGrid className="w-10 h-10" />
                    </div>
                  </div>
                  {/* Empty State Text */}
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">Table is currently empty.</h4>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1.5 leading-relaxed">
                    No guests seated or active tab assigned to this table right now.
                  </p>
                  
                  {/* Quick Summary Mini-box */}
                  <div className="w-full mt-8 bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Assigned Server</span>
                      <span className="text-slate-700 font-semibold">Unassigned</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Last Cleaned</span>
                      <span className="text-slate-700 font-semibold">Ready</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">QR Menu Code</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> Active
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Drawer Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
                  {/* Primary Action CTA */}
                  <button disabled={isAssigning} onClick={handleQuickAssign} className="w-full py-3.5 px-5 bg-[#D9F927] hover:bg-[#c9e81f] text-neutral-900 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 256 256"><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7L45.79,130.17a8,8,0,0,0,5,13.66l57.6,21.61L93.75,238.76a8,8,0,0,0,13.69,7l108.35-119.6A8,8,0,0,0,215.79,118.17Z"></path></svg>
                    <span>{isAssigning ? 'Assigning...' : 'Quick Assign (Skip Details)'}</span>
                  </button>
                  {/* Secondary Action CTA */}
                  <button disabled={isAssigning} onClick={() => setAssignCustomerModalOpen(true)} className="w-full py-3.5 px-5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Add Customer Details</span>
                  </button>
                  
                  {/* Auxiliary Action Links */}
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <button onClick={() => downloadQRPDF(selectedTable.id)} className="hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      <span>Print QR Card</span>
                    </button>
                    <button className="hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                      <span>Reserve Table</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : ("""

content = pattern.sub(new_block, content)

# Also fix the closing div tag of the side panel overlay
# because the old one used `</div>` and the new one uses `<aside>`
old_end_pattern = re.compile(
    r'\s*</div>\s*</div>\s*</div>\s*\)\}\s*\{\/\* Transfer Table Modal \*\/\}',
    re.MULTILINE | re.DOTALL
)
# Wait, let's just do a simpler search and replace for the closing tags.
# Before:
#                     </div>
#                   </div>
#                 </div>
#               </div>
#             )}
#           </div>
#         </div>
#       )}

# Let's inspect the end of the side panel accurately.
