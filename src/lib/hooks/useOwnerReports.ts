import { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from './useOrders';
import { MenuItem } from './useMenu';
import { toast } from 'sonner';

export interface MonthlyExpenses {
  month: string; // YYYY-MM
  rent: number;
  electricity: number;
  other: number;
}

export function useOwnerReports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateMonthReport = async (year: number, monthIndex: number, menuItems: MenuItem[], staffCost: number) => {
    setLoading(true);
    try {
      const monthStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      
      // 1. Fetch fixed expenses
      let expenses: MonthlyExpenses = { month: monthStr, rent: 0, electricity: 0, other: 0 };
      const expDoc = await getDoc(doc(db, 'monthly_expenses', monthStr));
      if (expDoc.exists()) expenses = expDoc.data() as MonthlyExpenses;

      // 2. Fetch all orders for this month
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 0, 23, 59, 59);

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', start),
        where('createdAt', '<=', end)
      );
      
      const snap = await getDocs(q);
      
      let totalSales = 0;
      let totalCogs = 0;
      
      snap.docs.forEach(d => {
        const order = d.data() as Order;
        if (order.status === 'cancelled') return;
        
        // Ensure paid/billed
        if (order.status === 'billed' || order.status === 'completed' || order.paymentStatus === 'paid') {
          totalSales += order.total;
          
          // Compute theoretical COGS based on current menu item cost
          order.items.forEach(item => {
            const menuRef = menuItems.find(m => m.id === item.menuItemId);
            if (menuRef?.costing) {
              totalCogs += (menuRef.costing.totalCost * item.qty);
            } else {
               // Fallback: guess 35% COGS if uncosted
               totalCogs += (item.price * item.qty * 0.35);
            }
          });
        }
      });

      const operatingProfit = totalSales - totalCogs - staffCost - expenses.rent - expenses.electricity - expenses.other;
      
      setReportData({
        monthStr,
        totalSales,
        totalCogs,
        staffCost,
        expenses,
        operatingProfit,
        grossMargin: totalSales > 0 ? ((totalSales - totalCogs) / totalSales) * 100 : 0,
        netMargin: totalSales > 0 ? (operatingProfit / totalSales) * 100 : 0
      });

    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const saveExpenses = async (expenses: MonthlyExpenses) => {
    try {
      await setDoc(doc(db, 'monthly_expenses', expenses.month), expenses);
      toast.success("Expenses saved");
      return true;
    } catch (e) {
      toast.error("Failed to save expenses");
      return false;
    }
  };

  return { loading, reportData, generateMonthReport, saveExpenses };
}
