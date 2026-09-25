'use client';

import React, { useState } from 'react';
import { useStaff, Staff } from '@/lib/hooks/useStaff';
import { useAttendance } from '@/lib/hooks/useAttendance';
import { Users, Clock, Edit2, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerStaffPage() {
  const { staff, loading: staffLoading, updateStaff } = useStaff();
  const { logs, loading: logsLoading } = useAttendance();
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance'>('roster');
  
  const totalSalary = staff.reduce((sum, s) => sum + (s.salary || 0), 0);

  if (staffLoading || logsLoading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Staff Management</h2>
          <p className="text-sm text-slate-500">Manage shifts, salaries, and track daily attendance.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'roster' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <Users className="w-4 h-4" /> Roster & Shifts
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
          >
            <Clock className="w-4 h-4" /> Attendance Logs
          </button>
        </div>
      </div>

      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Total Monthly Salary Cost</p>
              <h3 className="text-2xl font-black text-indigo-900">₹{totalSalary.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Active Staff Members</p>
              <h3 className="text-2xl font-black text-emerald-900">{staff.filter(s => s.isActive).length}</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800">Staff Details</h3>
               <span className="text-xs text-slate-500">Edit PINs & Roles from the main Settings page</span>
            </div>
            <StaffRosterTable staff={staff} onUpdate={updateStaff} />
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Recent Attendance Logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Arrival Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{log.staffName}</td>
                    <td className="px-6 py-4 text-slate-600">{log.arrivalTime}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${log.status === 'on-time' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No attendance logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffRosterTable({ staff, onUpdate }: { staff: Staff[], onUpdate: any }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Staff>>({});

  const handleEdit = (s: Staff) => {
    setEditingId(s.id);
    setFormData({ shiftStart: s.shiftStart || '', shiftEnd: s.shiftEnd || '', salary: s.salary || 0 });
  };

  const handleSave = async (id: string) => {
    try {
      await onUpdate(id, formData);
      toast.success("Staff updated");
      setEditingId(null);
    } catch (e) {
      toast.error("Failed to update staff");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
          <tr>
            <th className="px-6 py-4">Name & Role</th>
            <th className="px-6 py-4 text-center">Shift Start</th>
            <th className="px-6 py-4 text-center">Shift End</th>
            <th className="px-6 py-4 text-right">Monthly Salary (₹)</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {staff.map(s => (
            editingId === s.id ? (
              <tr key={s.id} className="bg-indigo-50/30">
                <td className="px-6 py-3">
                  <div className="font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{s.role}</div>
                </td>
                <td className="px-6 py-3">
                  <input type="time" value={formData.shiftStart} onChange={e => setFormData({...formData, shiftStart: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none text-center" />
                </td>
                <td className="px-6 py-3">
                  <input type="time" value={formData.shiftEnd} onChange={e => setFormData({...formData, shiftEnd: e.target.value})} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm outline-none text-center" />
                </td>
                <td className="px-6 py-3">
                  <input type="number" value={formData.salary === 0 ? '' : formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value) || 0})} className="w-32 ml-auto px-2 py-1.5 rounded border border-slate-300 text-sm outline-none text-right" placeholder="0" />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSave(s.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      {s.name} {!s.isActive && <span className="text-[9px] bg-rose-100 text-rose-600 px-1 rounded uppercase">Inactive</span>}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      {s.role === 'admin' && <ShieldCheck className="w-3 h-3 text-indigo-500" />} {s.role}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-medium text-slate-600">{s.shiftStart || '-'}</td>
                <td className="px-6 py-4 text-center font-medium text-slate-600">{s.shiftEnd || '-'}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">{s.salary ? `₹${s.salary.toLocaleString()}` : '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}
