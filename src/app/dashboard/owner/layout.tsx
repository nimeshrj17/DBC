'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  if (!hasPermission('manage_staff')) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500">Only authorized owners can view this module.</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Live Dashboard', path: '/dashboard/owner' },
    { name: 'Menu Engineering', path: '/dashboard/owner/menu-engineering' },
    { name: 'Inventory & Wastage', path: '/dashboard/owner/inventory' },
    { name: 'Staff Management', path: '/dashboard/owner/staff' },
    { name: 'SOPs & Rules', path: '/dashboard/owner/sops' },
    { name: 'Monthly P&L', path: '/dashboard/owner/reports' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Owner Module Header / Subnav */}
      <div className="bg-white border-b border-slate-200 shadow-sm shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Control Center
            </h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Owner Module</p>
          </div>
        </div>
        <div className="px-6 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                pathname === item.path
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
