'use client';

import React, { useState } from 'react';
import { useOwnerReports, MonthlyExpenses } from '@/lib/hooks/useOwnerReports';
import { useMenu } from '@/lib/hooks/useMenu';
import { useStaff } from '@/lib/hooks/useStaff';
import { Calculator, Save, Download, FileText, PieChart, TrendingUp, TrendingDown } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function OwnerReportsPage() {
  const { menuItems, loading: menuLoading } = useMenu();
  const { staff, loading: staffLoading } = useStaff();
  const { loading, reportData, generateMonthReport, saveExpenses } = useOwnerReports();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [expensesForm, setExpensesForm] = useState({ rent: 0, electricity: 0, other: 0 });

  const handleGenerate = () => {
    const totalStaffSalary = staff.reduce((sum, s) => sum + (s.salary || 0), 0);
    generateMonthReport(selectedYear, selectedMonth, menuItems, totalStaffSalary);
  };

  const handleSaveExpenses = async () => {
    if (!reportData) return;
    const success = await saveExpenses({
      month: reportData.monthStr,
      rent: expensesForm.rent,
      electricity: expensesForm.electricity,
      other: expensesForm.other
    });
    if (success) {
      handleGenerate(); // Recalculate
    }
  };

  // Sync form when report data loads
  React.useEffect(() => {
    if (reportData?.expenses) {
      setExpensesForm({
        rent: reportData.expenses.rent,
        electricity: reportData.expenses.electricity,
        other: reportData.expenses.other
      });
    }
  }, [reportData]);

  const isReady = !menuLoading && !staffLoading;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Monthly P&L Review</h2>
          <p className="text-sm text-slate-500">Calculate actual operating profit and control fixed expenses.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-bold text-slate-700 mb-2">Select Month</label>
          <div className="flex gap-2">
            <select 
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-semibold text-slate-800"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-semibold text-slate-800"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={!isReady || loading}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Calculator className="w-5 h-5" />}
          Generate Report
        </button>
      </div>

      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* P&L Statement */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5" /> Profit & Loss Statement</h3>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{MONTHS[selectedMonth]} {selectedYear}</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-slate-700">Gross Revenue (Total Sales)</span>
                  <span className="text-emerald-600">₹{reportData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                
                <div className="border-t border-dashed border-slate-200 pt-4 space-y-3 pl-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-600">Raw Material Cost (Theoretical COGS)</span>
                     <span className="font-semibold text-rose-600">- ₹{reportData.totalCogs.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-600">Staff Salary & Wages</span>
                     <span className="font-semibold text-rose-600">- ₹{reportData.staffCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-600">Rent</span>
                     <span className="font-semibold text-rose-600">- ₹{reportData.expenses.rent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-600">Electricity & Utilities</span>
                     <span className="font-semibold text-rose-600">- ₹{reportData.expenses.electricity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-600">Other Expenses</span>
                     <span className="font-semibold text-rose-600">- ₹{reportData.expenses.other.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center text-xl font-black">
                  <span className="text-slate-900">Actual Operating Profit</span>
                  <span className={reportData.operatingProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                    ₹{reportData.operatingProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                 <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Gross Margin</p>
                 <div className="flex items-end gap-2">
                   <h3 className="text-3xl font-black text-indigo-900">{reportData.grossMargin.toFixed(1)}%</h3>
                   <TrendingUp className="w-5 h-5 text-indigo-500 mb-1" />
                 </div>
                 <p className="text-xs text-indigo-600/70 mt-1">Sales minus Raw Materials</p>
               </div>
               <div className={`${reportData.netMargin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} border p-5 rounded-2xl`}>
                 <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${reportData.netMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Net Operating Margin</p>
                 <div className="flex items-end gap-2">
                   <h3 className={`text-3xl font-black ${reportData.netMargin >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>{reportData.netMargin.toFixed(1)}%</h3>
                   {reportData.netMargin >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" /> : <TrendingDown className="w-5 h-5 text-rose-500 mb-1" />}
                 </div>
                 <p className={`text-xs mt-1 ${reportData.netMargin >= 0 ? 'text-emerald-600/70' : 'text-rose-600/70'}`}>After all fixed costs</p>
               </div>
            </div>
          </div>

          <div className="md:col-span-1 space-y-6">
             {/* Expense Editor */}
             <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" /> Monthly Fixed Costs</h3>
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rent (₹)</label>
                   <input 
                     type="number" 
                     value={expensesForm.rent === 0 ? '' : expensesForm.rent} 
                     onChange={e => setExpensesForm({...expensesForm, rent: parseFloat(e.target.value) || 0})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm font-semibold"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Electricity (₹)</label>
                   <input 
                     type="number" 
                     value={expensesForm.electricity === 0 ? '' : expensesForm.electricity} 
                     onChange={e => setExpensesForm({...expensesForm, electricity: parseFloat(e.target.value) || 0})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm font-semibold"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Other Overheads (₹)</label>
                   <input 
                     type="number" 
                     value={expensesForm.other === 0 ? '' : expensesForm.other} 
                     onChange={e => setExpensesForm({...expensesForm, other: parseFloat(e.target.value) || 0})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-sm font-semibold"
                   />
                 </div>
                 <button onClick={handleSaveExpenses} className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors">
                   <Save className="w-4 h-4" /> Save & Recalculate
                 </button>
               </div>
             </div>

             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 text-center">
               <Download className="w-6 h-6 text-slate-400 mx-auto mb-2" />
               <h4 className="font-bold text-slate-700 text-sm">Export Report</h4>
               <p className="text-xs text-slate-500 mt-1 mb-3">Download this P&L statement as a PDF for your records.</p>
               <button className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors w-full">
                 Download PDF
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
