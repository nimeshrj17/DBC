'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GlobalPaymentAlert } from '@/components/dashboard/GlobalPaymentAlert';
import { useOrders } from '@/lib/hooks/useOrders';
import { businessDateKey, currentBusinessDateKey, isCounted, toDate } from '@/lib/analytics/revenue';
import { useAuth } from '@/lib/context/AuthContext';
import PrintAgent from '@/components/PrintAgent';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading: authLoading, login, logout, hasPermission } = useAuth();
  const { orders } = useOrders();
  const prevApprovalCountRef = useRef(0);
  
  useEffect(() => {
    const currentApprovalCount = orders.filter(o => o.status === 'needs_approval').length;
    if (currentApprovalCount > prevApprovalCountRef.current) {
      import('@/lib/audio').then(({ playNotificationSound }) => { playNotificationSound('order'); });
    }
    prevApprovalCountRef.current = currentApprovalCount;
  }, [orders]);


  // Calculate live orders (not completed, not cancelled)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const liveOrdersCount = orders.filter(o => {
    if (o.status === 'completed' || o.status === 'cancelled') return false;
    if (!o.createdAt) return false;
    const createdTime = typeof o.createdAt.toMillis === 'function' ? o.createdAt.toMillis() : (o.createdAt.seconds * 1000);
    return createdTime >= todayStart.getTime();
  }).length;

  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Same rule as the Revenue page: paid, not cancelled, within today's business day (2 AM to 2 AM)
  const businessToday = currentBusinessDateKey();
  const todayRevenue = orders
    .filter(o => {
      if (!isCounted(o)) return false;
      const orderDate = toDate(o.createdAt);
      return !!orderDate && businessDateKey(orderDate) === businessToday;
    })
    .reduce((sum, order) => sum + order.total, 0);

  const prevOrdersRef = React.useRef<typeof orders>([]);
  
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (prevOrdersRef.current.length > 0) {
      // Find completely new orders (not in prevOrders)
      const newOrders = orders.filter(o => 
        (o.status === 'pending' || o.status === 'preparing') && 
        !prevOrdersRef.current.some(po => po.id === o.id)
      );
      
      if (newOrders.length > 0) {
        import('@/lib/audio').then(({ playNotificationSound }) => {
          playNotificationSound('order');
        });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Order Received!', {
            body: `Table ${newOrders[0].tableNumber} placed an order (${newOrders[0].displayId})`,
            icon: '/coffee.png'
          });
        }
      }

      // Find orders that transitioned to awaiting_confirmation
      const newPayments = orders.filter(o => 
        o.paymentStatus === 'awaiting_confirmation' && 
        prevOrdersRef.current.some(po => po.id === o.id && po.paymentStatus !== 'awaiting_confirmation')
      );

      if (newPayments.length > 0) {
        import('@/lib/audio').then(({ playNotificationSound }) => {
          playNotificationSound('order');
        });
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Payment Pending!', {
            body: `Table ${newPayments[0].tableNumber} is ready to pay ${newPayments[0].paymentMethod}`,
            icon: '/coffee.png'
          });
        }
      }
    }
    
    prevOrdersRef.current = orders;
  }, [orders]);

      const [pin, setPin] = useState('');
  // Desktop sidebar replaced by top nav
  const [error, setError] = useState(false);



  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [printAgentOnline, setPrintAgentOnline] = useState<boolean | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "More" sheet whenever the page changes
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    const checkPrintAgent = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5050/', { method: 'GET', signal: AbortSignal.timeout(2000) });
        setPrintAgentOnline(res.ok);
      } catch {
        setPrintAgentOnline(false);
      }
    };
    checkPrintAgent();
    const interval = setInterval(checkPrintAgent, 10000);
    return () => clearInterval(interval);
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const success = await login(pin);
    if (!success) {
      setError(true);
      setPin('');
    } else {
      setError(false);
    }
    setIsLoggingIn(false);
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    if (isActive) {
      return "flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#10B981] text-white font-bold shadow-md shadow-[#10B981]/15 transition-all";
    }
    return "flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium transition-all group";
  };

  // Bottom bar: only what is used constantly. Everything else lives in the More sheet.
  const primaryLinks = [
    { href: '/dashboard', label: 'Tables', icon: 'la-th-large' },
    { href: '/dashboard/orders', label: 'Orders', icon: 'la-receipt' },
    ...(hasPermission('takeaway_billing') ? [{ href: '/dashboard/takeaway', label: 'Takeaway', icon: 'la-shopping-bag' }] : []),
    ...(hasPermission('view_revenue') ? [{ href: '/dashboard/revenue', label: 'Revenue', icon: 'la-chart-bar' }] : []),
  ];
  const moreLinks = [
    ...(hasPermission('takeaway_billing') ? [{ href: '/dashboard/customers', label: 'Customers', icon: 'la-users' }] : []),
    ...(hasPermission('manage_menu') ? [{ href: '/dashboard/menu', label: 'Menu', icon: 'la-utensils' }] : []),
    ...(hasPermission('manage_inventory') ? [{ href: '/dashboard/inventory', label: 'Inventory', icon: 'la-boxes' }] : []),
    { href: '/dashboard/attendance', label: 'Attendance', icon: 'la-user-check' },
    { href: '/dashboard/checklists', label: 'Checklists', icon: 'la-clipboard-list' },
    ...(hasPermission('manage_staff') ? [
      { href: '/dashboard/owner', label: 'Owner', icon: 'la-user-shield' },
      { href: '/dashboard/staff', label: 'Staff', icon: 'la-id-badge' },
      { href: '/dashboard/settings', label: 'Settings', icon: 'la-cog' },
    ] : []),
  ];

  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    if (isActive) {
      return "flex flex-col items-center space-y-1 text-slate-950 font-bold relative";
    }
    return "flex flex-col items-center space-y-1 hover:text-slate-900 transition-colors text-slate-500";
  };

  if (authLoading) return <div className="h-dvh bg-slate-900" />;

  if (!user) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
          <i className="w-16 h-16 mx-auto mb-6 text-[#10B981] las la-coffee"></i>
          <h1 className="text-2xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mb-8 text-sm">Enter the 4-digit PIN to access</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(false);
              }}
              className={`w-full bg-slate-900 border-2 ${error ? 'border-red-500' : 'border-slate-700'} rounded-xl py-4 px-6 text-3xl text-center tracking-[1em] font-bold focus:outline-none focus:border-[#10B981] transition-colors text-white placeholder-slate-600`}
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-3">Incorrect PIN. Please try again.</p>}
            
            <button 
              type="submit"
              disabled={pin.length < 4 || isLoggingIn}
              onClick={() => {
                import('@/lib/audio').then(({ initAudio }) => initAudio());
              }}
              className="w-full mt-6 bg-[#10B981] text-white py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all text-lg"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-dvh bg-[#F8FAFC] overflow-hidden font-sans"
      onClick={() => {
        import('@/lib/audio').then(({ initAudio }) => initAudio());
      }}
    >
      {/* Desktop Top Navigation Bar */}
      <header className="hidden md:flex px-6 h-16 border-b border-slate-200 bg-white sticky top-0 z-50 items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-none bg-slate-900 text-[#10B981] flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                <line x1="6" x2="6" y1="2" y2="4"></line>
                <line x1="10" x2="10" y1="2" y2="4"></line>
                <line x1="14" x2="14" y1="2" y2="4"></line>
              </svg>
            </div>
            <div className="leading-tight flex flex-col">
              <span className="font-bold text-slate-900 text-sm tracking-tight font-display">राखा भाई की चाय</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">POS System</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Dashboard
            </Link>
            <Link href="/dashboard/attendance" className={pathname.startsWith('/dashboard/attendance') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Attendance
            </Link>
            <Link href="/dashboard/checklists" className={pathname.startsWith('/dashboard/checklists') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Checklists
            </Link>
            <Link href="/dashboard/orders" className={pathname.startsWith('/dashboard/orders') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Live Orders
              {liveOrdersCount > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{liveOrdersCount}</span>}
            </Link>
            <Link href="/dashboard/takeaway" className={pathname.startsWith('/dashboard/takeaway') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Takeaway
            </Link>
            {hasPermission('view_revenue') && (
              <Link href="/dashboard/revenue" className={pathname.startsWith('/dashboard/revenue') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Revenue
              </Link>
            )}
            {hasPermission('manage_menu') && (
              <Link href="/dashboard/menu" className={pathname.startsWith('/dashboard/menu') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Menu
              </Link>
            )}
            {hasPermission('manage_inventory') && (
              <Link href="/dashboard/inventory" className={pathname.startsWith('/dashboard/inventory') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Inventory
              </Link>
            )}
            {hasPermission('manage_staff') && (
              <>
                <Link href="/dashboard/owner" className={pathname.startsWith('/dashboard/owner') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Owner
                </Link>
                <Link href="/dashboard/staff" className={pathname.startsWith('/dashboard/staff') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Staff
                </Link>
                <Link href="/dashboard/settings" className={pathname.startsWith('/dashboard/settings') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                  Settings
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Printer Status Pill */}
          <div 
            title={printAgentOnline ? "Print Agent Connected" : "Print Agent Offline on this Mac"}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
              printAgentOnline === true 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : printAgentOnline === false 
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${printAgentOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>🖨️ {printAgentOnline ? 'Printer Online' : 'Printer Offline'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{user?.name}</span>
            <span className="px-1.5 py-0.5 bg-slate-200/50 text-slate-600 text-[9px] font-bold tracking-widest uppercase rounded-none border border-slate-300/50">{user?.role}</span>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <button 
            onClick={() => window.confirm("Are you sure you want to log out?") && logout()}
            className="text-slate-400 hover:text-slate-800 transition-colors rounded-none"
            title="Log Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
        {/* Mobile Header: one slim row, so the page content starts near the top of the screen */}
        <section className="md:hidden px-4 pb-3 bg-white border-b border-slate-100 safe-top" data-purpose="greeting-kpis">
          <div className="pt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">Hi, {user?.name}!</h1>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{user?.role}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasPermission('view_revenue') && (
                <Link href="/dashboard/revenue" className="flex flex-col items-end px-3 py-1.5 bg-emerald-50 border border-emerald-100 min-h-[44px] justify-center">
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide leading-none">Today</span>
                  <span className="text-base font-black text-slate-900 leading-tight">₹{todayRevenue.toFixed(0)}</span>
                </Link>
              )}
              <Link href="/dashboard/orders" className="flex flex-col items-end px-3 py-1.5 bg-blue-50 border border-blue-100 min-h-[44px] justify-center">
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide leading-none">Live</span>
                <span className="text-base font-black text-slate-900 leading-tight">{liveOrdersCount}</span>
              </Link>
            </div>
          </div>
        </section>

        {children}
        <GlobalPaymentAlert />
        <PrintAgent />

        {/* Space so the last content is never hidden behind the bottom nav */}
        <div className="md:hidden shrink-0" style={{ height: 'calc(4.75rem + env(safe-area-inset-bottom))' }}></div>
      </main>

      {/* Mobile "More" sheet: everything that does not fit in the bottom bar */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="More">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)}></div>
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[24px] shadow-2xl max-h-[80dvh] overflow-y-auto" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
            <div className="flex justify-center pt-2.5 pb-1"><div className="w-10 h-1.5 rounded-full bg-slate-300"></div></div>
            <div className="grid grid-cols-3 gap-2 px-4 pt-2">
              {moreLinks.map(l => (
                <Link key={l.href} href={l.href} className={`flex flex-col items-center justify-center gap-1.5 min-h-[84px] rounded-2xl border text-xs font-semibold ${pathname.startsWith(l.href) ? 'bg-slate-900 text-[#10B981] border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 active:bg-slate-100'}`}>
                  <i className={`las ${l.icon} text-2xl`}></i>
                  <span>{l.label}</span>
                </Link>
              ))}
            </div>
            <div className="px-4 pt-4 flex items-center justify-between gap-3">
              <span className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border ${printAgentOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                <span className={`w-2 h-2 rounded-full ${printAgentOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {printAgentOnline ? 'Printer online' : 'Printer offline'}
              </span>
              <button
                onClick={() => { if (window.confirm('Are you sure you want to log out?')) logout(); }}
                className="px-4 min-h-[44px] bg-rose-50 text-rose-600 text-sm font-bold border border-rose-100"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation: the four screens used all day, plus More */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pt-1.5 z-40 grid text-[11px] font-semibold text-slate-500" style={{ gridTemplateColumns: `repeat(${primaryLinks.length + 1}, minmax(0, 1fr))`, paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        {primaryLinks.map(l => {
          const active = l.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] ${active ? 'text-slate-950 font-bold' : 'text-slate-500 active:text-slate-900'}`}>
              <span className={`relative px-4 py-0.5 ${active ? 'bg-slate-900 text-[#10B981]' : ''}`}>
                <i className={`las ${l.icon} text-2xl leading-none`}></i>
                {l.href === '/dashboard/orders' && liveOrdersCount > 0 && <span className="absolute -top-1 -right-0.5 bg-rose-500 text-white font-bold text-[10px] min-w-4 h-4 px-1 flex items-center justify-center">{liveOrdersCount}</span>}
              </span>
              <span>{l.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen} className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] ${moreOpen ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
          <span className={`px-4 py-0.5 ${moreOpen ? 'bg-slate-900 text-[#10B981]' : ''}`}><i className="las la-ellipsis-h text-2xl leading-none"></i></span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
