'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee } from 'lucide-react';
import { GlobalPaymentAlert } from '@/components/dashboard/GlobalPaymentAlert';
import { useOrders } from '@/lib/hooks/useOrders';
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

      const [pin, setPin] = useState('');
  // Desktop sidebar replaced by top nav
  const [error, setError] = useState(false);



  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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

  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    if (isActive) {
      return "flex flex-col items-center space-y-1 text-slate-950 font-bold relative";
    }
    return "flex flex-col items-center space-y-1 hover:text-slate-900 transition-colors text-slate-500";
  };

  if (authLoading) return <div className="h-screen bg-slate-900" />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
          <Coffee className="w-16 h-16 mx-auto mb-6 text-[#10B981]" />
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
      className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden font-sans"
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
            <Link href="/dashboard/orders" className={pathname.startsWith('/dashboard/orders') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Live Orders
              {liveOrdersCount > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-none text-[10px] font-bold">{liveOrdersCount}</span>}
            </Link>
            <Link href="/dashboard/takeaway" className={pathname.startsWith('/dashboard/takeaway') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
              Takeaway
            </Link>
            {hasPermission('view_revenue') && (
              <Link href="/dashboard/analytics" className={pathname.startsWith('/dashboard/analytics') ? 'flex items-center gap-2 px-3 py-2 bg-slate-900 text-[#10B981] font-bold text-sm transition-colors rounded-none' : 'flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-sm transition-colors rounded-none'}>
                Analytics
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

        <div className="flex items-center gap-4">
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
        {/* Mobile Header */}
        <section className="md:hidden px-5 pt-3 pb-5 bg-white border-b border-slate-100" data-purpose="greeting-kpis">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hi, {user?.name}!</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wider">{user?.role}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission('manage_staff') && (
                <Link 
                  href="/dashboard/settings"
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-none text-xs font-bold border border-slate-200"
                >
                  Settings
                </Link>
              )}
              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    logout();
                  }
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-none text-xs font-bold border border-rose-100"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3" data-purpose="quick-metrics">
            <div className="bg-white border border-slate-150 rounded-none p-3.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Today's Revenue</span>
                <span className="p-1 rounded-none bg-emerald-50 text-emerald-600">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M23 6l-9.5 9.5-5-5L1 18"></path>
                    <path d="M17 6h6v6"></path>
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-slate-900">₹{todayRevenue.toFixed(0)}</span>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-none p-3.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Live Orders</span>
                <span className="p-1 rounded-none bg-blue-50 text-blue-600">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black text-slate-900">{liveOrdersCount}</span>
              </div>
            </div>
          </div>
        </section>

        {children}
        <GlobalPaymentAlert />
        <PrintAgent />

        {/* Mobile padding for bottom nav */}
        <div className="h-20 md:hidden block"></div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 pt-2.5 pb-[env(safe-area-inset-bottom,24px)] z-40 flex justify-around items-center text-[10px] font-medium text-slate-500">
        {hasPermission('takeaway_billing') && (
        <Link href="/dashboard/customers" className={getMobileLinkClass('/dashboard/customers')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Customers</span>
        </Link>
        )}
        <Link href="/dashboard" className={getMobileLinkClass('/dashboard')}>
          <span className={pathname === '/dashboard' ? "p-1 rounded-none bg-slate-100 text-slate-950" : "p-1"}>
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
            {liveOrdersCount > 0 && <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-none flex items-center justify-center">{liveOrdersCount}</span>}
          </div>
          <span>Orders</span>
        </Link>

        {hasPermission('takeaway_billing') && (
        <Link href="/dashboard/takeaway" className={getMobileLinkClass('/dashboard/takeaway')}>
          <div className="relative">
            <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <span>Takeaway</span>
        </Link>
        )}
        
        {hasPermission('manage_menu') && (
        <Link href="/dashboard/menu" className={getMobileLinkClass('/dashboard/menu')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Menu</span>
        </Link>
        )}
        {hasPermission('manage_inventory') && (
        <Link href="/dashboard/inventory" className={getMobileLinkClass('/dashboard/inventory')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Inventory</span>
        </Link>
        )}
        {hasPermission('view_revenue') && (
        <Link href="/dashboard/analytics" className={getMobileLinkClass('/dashboard/analytics')}>
          <svg className="w-5 h-5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Revenue</span>
        </Link>
        )}
      </nav>
    </div>
  );
}
