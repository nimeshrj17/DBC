'use client';

import React, { useState } from 'react';
import { useStaff, Staff } from '@/lib/hooks/useStaff';
import { useAuth } from '@/lib/context/AuthContext';
import { Plus, X, Edit2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffPage() {
  const { staff, loading, addStaff, updateStaff, deleteStaff } = useStaff();
  const { hasPermission } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    role: 'cashier',
    isActive: true,
    canViewRevenue: false,
    customPermissions: {
      manage_menu: false,
      manage_inventory: false,
      deduct_inventory: false,
      view_revenue: false,
      takeaway_billing: false,
      edit_placed_orders: false
    }
  });

  if (loading) {
    return <div className="p-8 text-slate-500">Loading staff...</div>;
  }

  if (!hasPermission('manage_staff')) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', pin: '', role: 'cashier', isActive: true, canViewRevenue: false,
    customPermissions: {
      manage_menu: false,
      manage_inventory: false,
      deduct_inventory: false,
      view_revenue: false,
      takeaway_billing: false,
      edit_placed_orders: false
    } });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: Staff) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      pin: member.pin,
      role: member.role,
      isActive: member.isActive,
      canViewRevenue: member.canViewRevenue || false,
      customPermissions: {
        manage_menu: member.customPermissions?.manage_menu ?? (member.role === 'manager'),
        manage_inventory: member.customPermissions?.manage_inventory ?? (member.role === 'manager'),
        deduct_inventory: member.customPermissions?.deduct_inventory ?? false,
        view_revenue: member.customPermissions?.view_revenue ?? (member.role === 'manager' && !!member.canViewRevenue),
        takeaway_billing: member.customPermissions?.takeaway_billing ?? (member.role === 'manager' || member.role === 'cashier'),
        edit_placed_orders: member.customPermissions?.edit_placed_orders ?? false
      }
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.pin || formData.pin.length < 4) {
      toast.error('Name and a 4+ digit PIN are required.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateStaff(editingId, formData as any);
        toast.success('Staff member updated');
      } else {
        // Ensure PIN doesn't conflict
        const exists = staff.find(s => s.pin === formData.pin);
        if (exists) {
          toast.error('This PIN is already in use by another staff member.');
          setIsSubmitting(false);
          return;
        }
        await addStaff(formData as any);
        toast.success('Staff member added');
      }
      setIsModalOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full pb-6">
      <div className="px-5 md:px-8 pt-4 md:pt-5 pb-3 shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 bg-white/70 backdrop-blur-sm z-10 sticky top-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Staff Management</h2>
          <p className="text-xs text-slate-500 font-medium">Manage employees, roles, and PIN codes.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="p-5 md:p-8 flex-1 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">PIN</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{member.name}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {member.role}
                    </span>
                    {member.role === 'manager' && member.canViewRevenue && (
                       <span className="ml-2 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                       + Revenue
                     </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {member.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-sm text-slate-500">
                    ****
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    No staff found. Please add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Login PIN</label>
                <input 
                  type="text" 
                  value={formData.pin}
                  onChange={e => setFormData({...formData, pin: e.target.value.replace(/[^0-9]/g, '')})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  placeholder="e.g. 1234"
                  minLength={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={e => {
                    const newRole = e.target.value;
                    const defaultPerms = {
                      manage_menu: newRole === 'manager',
                      manage_inventory: newRole === 'manager',
                      deduct_inventory: false,
                      view_revenue: newRole === 'manager',
                      takeaway_billing: newRole === 'manager' || newRole === 'cashier',
                      edit_placed_orders: false
                    };
                    setFormData({...formData, role: newRole, customPermissions: defaultPerms});
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="admin">Admin / Owner (Full Access)</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen Staff</option>
                </select>
              </div>

              {formData.role !== 'admin' && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-2">Custom Permissions</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {[
                      { id: 'view_revenue', label: 'View Revenue & Analytics' },
                      { id: 'manage_menu', label: 'Add/Edit Menu Items' },
                      { id: 'manage_inventory', label: 'Add Inventory Stock' },
                      { id: 'deduct_inventory', label: 'Deduct Inventory Stock' },
                      { id: 'takeaway_billing', label: 'Process Takeaway Billing' },
                      { id: 'edit_placed_orders', label: 'Delete Placed Order Items' }
                    ].map(perm => (
                      <div key={perm.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={`perm-${perm.id}`}
                          checked={formData.customPermissions[perm.id as keyof typeof formData.customPermissions] || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData, 
                              customPermissions: {
                                ...formData.customPermissions,
                                [perm.id]: e.target.checked
                              }
                            });
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <label htmlFor={`perm-${perm.id}`} className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                          {perm.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Account is Active
                </label>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-sm disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
