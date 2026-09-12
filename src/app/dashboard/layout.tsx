'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee } from 'lucide-react';
import { GlobalPaymentAlert } from '@/components/dashboard/GlobalPaymentAlert';
import { useOrders } from '@/lib/hooks/useOrders';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { orders } = useOrders();

  // Calculate live orders (not completed, not cancelled)
  const liveOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayRevenue = orders
    .filter(o => {
      if (o.status !== 'completed' || o.paymentStatus !== 'paid') return false;
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return orderDate >= today;
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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '895518') { // Default PIN
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    if (isActive) {
      return "flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#D9F927] text-slate-900 font-bold shadow-md shadow-[#D9F927]/15 transition-all";
    }
    return "flex items-center justify-between px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium transition-all group";
  };

  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    if (isActive) {
      return "flex flex-col items-center space-y-1 text-slate-950 font-bold relative";
    }
    return "flex flex-col items-center space-y-1 hover:text-slate-900 transition-colors text-slate-500";
  };

  if (isChecking) return <div className="h-screen bg-slate-900" />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
          <Coffee className="w-16 h-16 mx-auto mb-6 text-[#D9F927]" />
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
              className={`w-full bg-slate-900 border-2 ${error ? 'border-red-500' : 'border-slate-700'} rounded-xl py-4 px-6 text-3xl text-center tracking-[1em] font-bold focus:outline-none focus:border-[#D9F927] transition-colors text-white placeholder-slate-600`}
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-3">Incorrect PIN. Please try again.</p>}
            
            <button 
              type="submit"
              disabled={pin.length < 6}
              onClick={() => {
                import('@/lib/audio').then(({ initAudio }) => initAudio());
              }}
              className="w-full mt-6 bg-[#D9F927] text-slate-950 py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all text-lg"
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
      className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans"
      onClick={() => {
        import('@/lib/audio').then(({ initAudio }) => initAudio());
      }}
    >
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-72 bg-[#0F172A] text-slate-300 flex-col justify-between shrink-0 border-r border-slate-800/80 select-none">
        <div className="flex flex-col">
          <div className="h-20 flex items-center px-6 gap-3.5 border-b border-slate-800/60">
            <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-[#D9F927]/30 flex items-center justify-center text-[#D9F927] shadow-inner shadow-[#D9F927]/10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                <line x1="6" x2="6" y1="2" y2="4"></line>
                <line x1="10" x2="10" y1="2" y2="4"></line>
                <line x1="14" x2="14" y1="2" y2="4"></line>
              </svg>
            </div>
            <div className="leading-tight">
              <h1 className="text-white font-bold text-base tracking-tight font-display">राखा भाई की चाय</h1>
              <p className="text-xs text-[#D9F927] font-medium tracking-wide">and Cafe • POS</p>
            </div>
          </div>
          <nav aria-label="Sidebar Navigation" className="p-4 space-y-1.5">
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <rect height="7" rx="1.5" width="7" x="3" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="3"></rect>
                  <rect height="7" rx="1.5" width="7" x="14" y="14"></rect>
                  <rect height="7" rx="1.5" width="7" x="3" y="14"></rect>
                </svg>
                <span className="text-sm">Dashboard (Tables)</span>
              </div>
            </Link>
            <Link href="/dashboard/orders" className={getLinkClass('/dashboard/orders')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Orders</span>
              </div>
              {liveOrdersCount > 0 && <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">{liveOrdersCount}</span>}
            </Link>
            <Link href="/dashboard/customers" className={getLinkClass('/dashboard/customers')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Customers</span>
              </div>
            </Link>
            <Link href="/dashboard/menu" className={getLinkClass('/dashboard/menu')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Menu</span>
              </div>
            </Link>
            <Link href="/dashboard/inventory" className={getLinkClass('/dashboard/inventory')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Inventory</span>
              </div>
            </Link>
            <Link href="/dashboard/analytics" className={getLinkClass('/dashboard/analytics')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Revenue / Analytics</span>
              </div>
            </Link>
            <Link href="/dashboard/kiosk" className={getLinkClass('/dashboard/kiosk')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span className="text-sm">Kiosk / Print Queue</span>
              </div>
            </Link>
            <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
              <div className="flex items-center gap-3.5">
                <svg className="w-5 h-5 group-hover:text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span className="text-sm">Settings</span>
              </div>
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#D9F927] text-slate-900 font-extrabold flex items-center justify-center text-base shadow-sm">
                  B
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white tracking-wide">Bella</h4>
                <p className="text-xs text-slate-400 font-medium">Store Owner</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#F8FAFC]">
        {/* Desktop Header */}
        <header className="hidden md:flex px-8 pt-8 pb-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Good morning, Bella!</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Morning Shift
              </span>
            </div>
            <p className="text-sm text-slate-500">Here's what's happening at your cafe today.</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-sm hover:shadow transition-shadow flex items-center gap-4 min-w-[210px]">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
                ₹
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Today's Revenue</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">₹ {todayRevenue.toFixed(0)}</span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                    ↑ 12%
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl px-5 py-3.5 shadow-sm hover:shadow transition-shadow flex items-center gap-4 min-w-[200px]">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Live Orders</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">{liveOrdersCount} Active</span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header (from mobile_dashboard.html) */}
        <section className="md:hidden px-5 pt-3 pb-5 bg-white border-b border-slate-100" data-purpose="greeting-kpis">
          <div className="mb-4">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Good morning, Bella!</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Here's what's happening at your cafe today.</p>
          </div>
          <div className="grid grid-cols-2 gap-3" data-purpose="quick-metrics">
            <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Today's Revenue</span>
                <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M23 6l-9.5 9.5-5-5L1 18"></path>
                    <path d="M17 6h6v6"></path>
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-slate-900">₹{todayRevenue.toFixed(0)}</span>
              </div>
              <div className="flex items-center mt-1 text-[11px] font-semibold text-emerald-600">
                <span>+12.4%</span>
                <span className="text-slate-400 font-normal ml-1">vs yesterday</span>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Live Orders</span>
                <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-slate-900">{liveOrdersCount}</span>
              </div>
              <div className="flex items-center mt-1 text-[11px] font-medium text-emerald-600 space-x-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-emerald-700">Active right now</span>
              </div>
            </div>
          </div>
        </section>

        {children}

        {/* Mobile padding for bottom nav */}
        <div className="h-20 md:hidden block"></div>
      </main>

      {/* Mobile Bottom Navigation (from mobile_dashboard.html) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-2.5 pb-[env(safe-area-inset-bottom,24px)] z-40 flex justify-around items-center text-[10px] font-medium text-slate-500">
        <Link href="/dashboard/customers" className={getMobileLinkClass('/dashboard/customers')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Customers</span>
        </Link>
        <Link href="/dashboard" className={getMobileLinkClass('/dashboard')}>
          <span className={pathname === '/dashboard' ? "p-1 rounded-xl bg-slate-100 text-slate-950" : "p-1"}>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z"></path>
            </svg>
          </span>
          <span>Dashboard</span>
        </Link>
        <Link href="/dashboard/orders" className={getMobileLinkClass('/dashboard/orders')}>
          <div className="relative">
            <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            {liveOrdersCount > 0 && <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{liveOrdersCount}</span>}
          </div>
          <span>Orders</span>
        </Link>
        <Link href="/dashboard/inventory" className={getMobileLinkClass('/dashboard/inventory')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Inventory</span>
        </Link>
        <Link href="/dashboard/analytics" className={getMobileLinkClass('/dashboard/analytics')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Revenue</span>
        </Link>
      </nav>
    </div>
  );
}
