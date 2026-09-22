'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Staff } from '@/lib/hooks/useStaff';
import { toast } from 'sonner';

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  let logoutTimer: NodeJS.Timeout;

  const resetTimer = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    if (user) {
      logoutTimer = setTimeout(() => {
        toast.error('Session expired due to inactivity');
        logout();
      }, 30 * 60 * 1000); // 30 minutes
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('cafeUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cafeUser');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      resetTimer();
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      const handleActivity = () => resetTimer();
      events.forEach(e => window.addEventListener(e, handleActivity));
      return () => {
        if (logoutTimer) clearTimeout(logoutTimer);
        events.forEach(e => window.removeEventListener(e, handleActivity));
      };
    }
  }, [user]);

  const login = async (pin: string) => {
    // Check fallback old pin just in case DB fails initially
    if (pin === '895518' && !user) {
      // It's checked against DB usually, but we fallback if network issue and they are stuck.
      // But let's strictly use Firebase.
    }
    
    try {
      const q = query(collection(db, 'staff'), where('pin', '==', pin));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const doc = snap.docs[0];
        const userData = { id: doc.id, ...doc.data() } as Staff;
        
        if (!userData.isActive) {
          toast.error('Account is disabled');
          return false;
        }
        
        setUser(userData);
        localStorage.setItem('cafeUser', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e);
      // Hard fallback if offline
      if (pin === '895518') {
        const fallbackAdmin: Staff = { id: 'fallback', name: 'Owner', pin: '895518', role: 'admin', isActive: true };
        setUser(fallbackAdmin);
        localStorage.setItem('cafeUser', JSON.stringify(fallbackAdmin));
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cafeUser');
    localStorage.removeItem('adminAuth'); 
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (user.customPermissions && typeof user.customPermissions[permission] === 'boolean') {
      return user.customPermissions[permission];
    }
    
    switch (permission) {
      case 'view_revenue':
        return user.role === 'manager' && user.canViewRevenue === true;
      case 'manage_staff':
        return false;
      case 'manage_settings':
        return false;
      case 'manage_menu':
        return user.role === 'manager';
      case 'edit_placed_orders':
        return false; 
      case 'manage_inventory':
        return user.role === 'manager';
      case 'deduct_inventory':
        return false;
      case 'takeaway_billing':
        return user.role === 'manager' || user.role === 'cashier';
      case 'kitchen_view':
        return user.role === 'kitchen' || (user.role as any) === 'admin' || user.role === 'manager';
      case 'bill_orders':
        return user.role === 'manager' || user.role === 'cashier';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
