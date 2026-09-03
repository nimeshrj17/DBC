'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Receipt, 
  Coffee, 
  Package, 
  BarChart3, 
  Printer, 
  Settings,
  Bell,
  ChevronDown,
  Users
} from 'lucide-react';
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
    if (pin === '1234') { // Default PIN
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const getLinkClass = (path: string) => {
    // If the path exactly matches, or it's a sub-path (except for exactly /dashboard)
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    
    if (isActive) {
      return "flex items-center space-x-4 px-4 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-[0_0_15px_rgba(204,255,0,0.3)]";
    }
    return "flex items-center space-x-4 px-4 py-3.5 text-gray-400 hover:text-white transition-colors";
  };

  if (isChecking) return <div className="h-screen bg-[#2A1A14]" />; // simple blank background while checking

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#2A1A14] flex items-center justify-center p-4 text-[#D4C1B3] font-sans">
        <div className="bg-[#3D261C] p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95">
          <Coffee className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h1 className="text-2xl font-bold mb-2 text-white">Admin Dashboard</h1>
          <p className="text-[#D4C1B3]/70 mb-8 text-sm">Enter the 4-digit PIN to access</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setError(false);
              }}
              className={`w-full bg-[#2A1A14] border-2 ${error ? 'border-red-500' : 'border-[#D4C1B3]/20'} rounded-xl py-4 px-6 text-3xl text-center tracking-[1em] font-bold focus:outline-none focus:border-primary transition-colors text-white placeholder-gray-600`}
              placeholder="••••"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-3">Incorrect PIN. Please try again.</p>}
            
            <button 
              type="submit"
              disabled={pin.length < 4}
              onClick={() => {
                import('@/lib/audio').then(({ initAudio }) => initAudio());
              }}
              className="w-full mt-6 bg-primary text-primary-foreground py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all text-lg"
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
      className="flex h-screen bg-background overflow-hidden font-sans"
      onClick={() => {
        import('@/lib/audio').then(({ initAudio }) => initAudio());
      }}
    >
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-bg text-sidebar-fg flex flex-col justify-between hidden md:flex border-r border-sidebar-bg/10">
        <div>
          <div className="p-8 flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded border-2 border-primary flex items-center justify-center">
              <Coffee className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dream Bean Cafe</span>
          </div>
          
          <nav className="mt-2 px-4 space-y-2">
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard (Tables)</span>
            </Link>
            <Link href="/dashboard/orders" className={getLinkClass('/dashboard/orders')}>
              <Receipt className="h-5 w-5" />
              <span>Orders</span>
            </Link>
            <Link href="/dashboard/customers" className={getLinkClass('/dashboard/customers')}>
              <Users className="h-5 w-5" />
              <span>Customers</span>
            </Link>
            <Link href="/dashboard/menu" className={getLinkClass('/dashboard/menu')}>
              <Coffee className="h-5 w-5" />
              <span>Menu</span>
            </Link>
            <Link href="/dashboard/inventory" className={getLinkClass('/dashboard/inventory')}>
              <Package className="h-5 w-5" />
              <span>Inventory</span>
            </Link>
            <Link href="/dashboard/analytics" className={getLinkClass('/dashboard/analytics')}>
              <BarChart3 className="h-5 w-5" />
              <span>Revenue / Analytics</span>
            </Link>
            <Link href="/dashboard/kiosk" className={getLinkClass('/dashboard/kiosk')}>
              <Printer className="h-5 w-5" />
              <span>Kiosk / Print Queue</span>
            </Link>
            <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                B
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-tight">Bella</p>
                <p className="text-xs text-gray-400">Owner</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full border-[10px] border-primary/20 -z-10 -mt-10"></div>
        <div className="absolute top-10 right-1/3 w-8 h-8 rounded-full bg-primary/40 -z-10"></div>

        <header className="pt-8 pb-6 bg-transparent flex flex-col md:flex-row md:items-center justify-between px-8 z-10 border-b border-border/50">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-foreground mb-1">Good morning, Bella!</h2>
            <p className="text-muted-foreground">Here's what's happening at your cafe today.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-3 py-2 md:px-5 md:py-3 border-r border-border">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Today's Revenue</span>
                  <BarChart3 className="w-3 h-3 md:w-4 md:h-4 text-primary ml-2 md:ml-4" />
                </div>
                <div className="font-bold text-base md:text-xl truncate max-w-[90px] md:max-w-none">₹ {todayRevenue.toFixed(0)}</div>
                <div className="text-[9px] md:text-[10px] text-green-600 font-semibold mt-1">Today</div>
              </div>
              
              <div className="px-3 py-2 md:px-5 md:py-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Live Orders</span>
                  <Receipt className="w-3 h-3 md:w-4 md:h-4 text-secondary ml-2 md:ml-4" />
                </div>
                <div className="font-bold text-base md:text-xl">{liveOrdersCount}</div>
                <div className="text-[9px] md:text-[10px] text-muted-foreground flex items-center mt-1">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-secondary mr-1 md:mr-1.5"></span> Active
                </div>
              </div>
            </div>


          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-transparent z-10 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-3 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50">
        <Link href="/dashboard/customers" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/dashboard/customers') ? 'text-[#2A1A14]' : 'text-gray-400'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">Customers</span>
        </Link>
        <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-[#2A1A14]' : 'text-gray-400'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link href="/dashboard/orders" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/dashboard/orders') ? 'text-[#2A1A14]' : 'text-gray-400'}`}>
          <Receipt className="w-6 h-6" />
          <span className="text-[10px] font-medium">Orders</span>
        </Link>
        <Link href="/dashboard/inventory" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/dashboard/inventory') ? 'text-[#2A1A14]' : 'text-gray-400'}`}>
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-medium">Inventory</span>
        </Link>
        <Link href="/dashboard/analytics" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/dashboard/analytics') ? 'text-[#2A1A14]' : 'text-gray-400'}`}>
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium">Revenue</span>
        </Link>
      </div>
    </div>
  );
}
