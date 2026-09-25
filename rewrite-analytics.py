import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Define the exact block string we want to find and remove
start_marker = "            {/* FULL MENU ASSESSMENT */}"
end_marker = "            </div>"

# We know the block ends right before the `\n          </div>\n        )}`
# Let's use regex to remove ALL occurrences of the FULL MENU ASSESSMENT block
pattern = r"\s*\{/\* FULL MENU ASSESSMENT \*/\}.*?<tbody>.*?</tbody>\s*</table>\s*</div>\s*</div>"
content_clean = re.sub(pattern, "", content, flags=re.DOTALL)

# Now, we need to inject ONE copy exactly at the end of the `activeTab === 'menu'` block.
# We will find the end of the menu block.
# Look for:
#                 </ul>
#               </div>
#             </div>
#           </div>
#         )}
# 
#         {/* 4. CUSTOMER BEHAVIOR */}

insert_marker = """                </ul>
              </div>
            </div>"""

menu_assessment_block = """
            {/* FULL MENU ASSESSMENT */}
            <div className="bg-white rounded-none border border-slate-200 shadow-xs overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Complete Menu Assessment</h3>
                  <p className="text-sm text-slate-500">Dead stock and low-performing items highlighted</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96 custom-scroll">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-white sticky top-0 border-b border-slate-100 uppercase z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 font-bold">Item Name</th>
                      <th className="px-6 py-3 font-bold">Category</th>
                      <th className="px-6 py-3 font-bold text-center">Qty Sold</th>
                      <th className="px-6 py-3 font-bold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {menuItems.map(item => {
                      const stats = menu.allItemPerformance[item.id] || { qty: 0, revenue: 0 };
                      return { ...item, ...stats };
                    }).sort((a, b) => a.qty - b.qty).map((item, idx) => (
                      <tr key={idx} className={`transition-colors ${item.qty === 0 ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.qty === 0 && <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Never Ordered</span>}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-600">{item.category || 'N/A'}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-none font-bold ${item.qty === 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{item.qty}</span>
                        </td>
                        <td className={`px-6 py-3 text-right font-black ${item.qty === 0 ? 'text-slate-400' : 'text-emerald-600'}`}>₹{item.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>"""

if insert_marker in content_clean:
    content_clean = content_clean.replace(insert_marker, insert_marker + menu_assessment_block, 1)

with open(filepath, "w") as f:
    f.write(content_clean)
