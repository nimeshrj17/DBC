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
  ChevronDown
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
    <div className="flex h-screen bg-background overflow-hidden font-sans">
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
            <h2 className="text-3xl font-bold text-foreground mb-1">Good morning, Bella! 👋</h2>
            <p className="text-muted-foreground">Here's what's happening at your cafe today.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-r border-border">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-muted-foreground font-medium">Today's Revenue</span>
                  <BarChart3 className="w-4 h-4 text-primary ml-4" />
                </div>
                <div className="font-bold text-xl">₹ {todayRevenue.toFixed(2)}</div>
                <div className="text-[10px] text-green-600 font-semibold mt-1">Today</div>
              </div>
              
              <div className="px-5 py-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-muted-foreground font-medium">Live Orders</span>
                  <Receipt className="w-4 h-4 text-secondary ml-4" />
                </div>
                <div className="font-bold text-xl">{liveOrdersCount}</div>
                <div className="text-[10px] text-muted-foreground flex items-center mt-1">
                  <span className="w-2 h-2 rounded-full bg-secondary mr-1.5"></span> Active orders
                </div>
              </div>
            </div>

            <button className="relative p-4 bg-card border border-border shadow-sm rounded-xl text-foreground hover:bg-muted/50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 bg-transparent z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
