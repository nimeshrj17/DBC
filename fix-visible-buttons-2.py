import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_buttons = """                    <button 
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
                    >"""

good_buttons = """                    <button 
                      onClick={() => handleMarkAwaitingPayment()} 
                      className="w-full py-3.5 px-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >"""

content = content.replace(bad_buttons, good_buttons)

with open(filepath, "w") as f:
    f.write(content)

