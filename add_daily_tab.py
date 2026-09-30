import re

with open('src/app/dashboard/analytics/page.tsx', 'r') as f:
    content = f.read()

# 1. Update useState
content = content.replace(
    "useState<'overview' | 'menu' | 'customers' | 'splits' | 'history'>('overview')",
    "useState<'overview' | 'daily' | 'menu' | 'customers' | 'splits' | 'history'>('overview')"
)

# 2. Add Button
new_btn = """            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Overview & Trends</button>
            <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Daily Analysis</button>"""
content = content.replace(
    "            <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Overview & Trends</button>",
    new_btn
)

# 3. We need a state for the selected date inside the page. Let's add it right after activeTab.
state_line = "const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'menu' | 'customers' | 'splits' | 'history'>('overview');"
date_state = """const [selectedDate, setSelectedDate] = useState<string>('');"""
content = content.replace(state_line, state_line + '\n  ' + date_state)


# 4. Inject the daily tab logic right before the closing </div> of the tabs
daily_tab_content = """

        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-1">Last 30 Days Revenue</h3>
              <p className="text-xs text-slate-500 mb-4">Click a bar to see detailed performance for that day</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.dailyRevenue} margin={{ top: 5, right: 5, bottom: 5, left: 0 }} onClick={(data) => {
                      if (data && data.activePayload && data.activePayload.length > 0) {
                        setSelectedDate(data.activePayload[0].payload.date);
                      }
                    }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 10}} stroke="#94a3b8" tickFormatter={(val) => val.slice(5)} />
                    <YAxis tick={{fontSize: 12}} stroke="#94a3b8" width={60} tickFormatter={(value) => `₹${value}`} />
                    <RechartsTooltip formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Revenue']} labelFormatter={(label) => `Date: ${label}`} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {
                        trends.dailyRevenue.map((entry, index) => (
                          <Cell cursor="pointer" fill={entry.date === selectedDate ? '#059669' : '#10b981'} key={`cell-${index}`} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {(() => {
              const displayDate = selectedDate || (trends.dailyRevenue.length > 0 ? trends.dailyRevenue[trends.dailyRevenue.length - 1].date : '');
              if (!displayDate) return null;
              
              // Filter orders for this specific date
              const dayOrders = orders.filter((o: any) => {
                if (!o.createdAt || !o.createdAt.toDate) return false;
                const d = o.createdAt.toDate();
                const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                return dStr === displayDate;
              });

              const dayRev = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
              
              const itemCounts: Record<string, {name: string, qty: number, rev: number}> = {};
              dayOrders.forEach((o: any) => {
                if (o.status === 'cancelled') return;
                o.items?.forEach((item: any) => {
                  if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0, rev: 0 };
                  itemCounts[item.name].qty += item.qty;
                  itemCounts[item.name].rev += (item.qty * item.price);
                });
              });
              
              const topItems = Object.values(itemCounts).sort((a,b) => b.qty - a.qty).slice(0, 10);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-sm font-bold text-slate-500 mb-1">Date Selected</div>
                      <div className="text-2xl font-black text-slate-900">{displayDate}</div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                        <div>
                          <div className="text-xs text-slate-500">Orders</div>
                          <div className="text-lg font-bold text-slate-800">{dayOrders.length}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Revenue</div>
                          <div className="text-lg font-bold text-emerald-600">₹{dayRev.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Top Items on {displayDate}</h3>
                    {topItems.length === 0 ? (
                      <div className="text-center text-slate-400 py-6">No items sold on this date.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="pb-2 font-semibold">Item</th>
                              <th className="pb-2 font-semibold text-right">Quantity</th>
                              <th className="pb-2 font-semibold text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topItems.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-50 last:border-0">
                                <td className="py-3 font-medium text-slate-800">{item.name}</td>
                                <td className="py-3 text-right font-bold text-slate-600">{item.qty}</td>
                                <td className="py-3 text-right font-bold text-emerald-600">₹{item.rev.toFixed(0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}"""

content = content.replace("      </div>\n    </div>\n  );\n}", daily_tab_content + "\n      </div>\n    </div>\n  );\n}")

with open('src/app/dashboard/analytics/page.tsx', 'w') as f:
    f.write(content)

