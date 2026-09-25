import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/analytics/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# Add useMenu import
if "useMenu" not in content:
    content = content.replace("import { useAnalytics } from '@/lib/hooks/useAnalytics';", "import { useAnalytics } from '@/lib/hooks/useAnalytics';\nimport { useMenu } from '@/lib/hooks/useMenu';")

# Add useMenu hook
if "const { menuItems } = useMenu();" not in content:
    content = content.replace("const [activeTab, setActiveTab] = useState", "const { menuItems } = useMenu();\n  const [activeTab, setActiveTab] = useState")

# Replace PieChart block to fix legend
bad_pie_chart = """              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
                <h3 className="text-base font-bold text-slate-900 mb-4">Category Revenue Split</h3>
                <div className="h-72 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={menu.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {menu.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>"""

good_pie_chart = """              <div className="bg-white p-5 rounded-none border border-slate-200 shadow-xs md:col-span-2 flex flex-col">
                <h3 className="text-base font-bold text-slate-900 mb-4">Category Revenue Split</h3>
                <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={menu.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {menu.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 h-48 md:h-64 overflow-y-auto custom-scroll pr-2">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white text-slate-500 pb-2">
                        <tr>
                          <th className="text-left font-semibold pb-2">Category</th>
                          <th className="text-right font-semibold pb-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {menu.categoryBreakdown.map((entry: any, index: number) => (
                          <tr key={index}>
                            <td className="py-2 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-none" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="font-medium text-slate-800">{entry.name}</span>
                            </td>
                            <td className="py-2 text-right font-bold text-slate-900">₹{entry.value.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>"""
content = content.replace(bad_pie_chart, good_pie_chart)

# Add Full Menu Assessment
bad_menu_end = """              </div>
            </div>
          </div>
        )}"""

full_menu_assessment = """              </div>
            </div>

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
            </div>

          </div>
        )}"""
content = content.replace(bad_menu_end, full_menu_assessment)

with open(filepath, "w") as f:
    f.write(content)
