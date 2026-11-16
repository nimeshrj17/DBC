import { useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from './useOrders';
import { MenuItem } from './useMenu';
import { isCounted } from '@/lib/analytics/revenue';
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
      const uncosted = new Set<string>();

      snap.docs.forEach(d => {
        const order = d.data() as Order;
        // Same definition as every other revenue screen: paid and not cancelled
        if (!isCounted(order)) return;
        totalSales += order.total;

        order.items.forEach(item => {
          const cost = item.unitCost ?? menuItems.find(m => m.id === item.menuItemId)?.costing?.totalCost;
          if (cost && cost > 0) totalCogs += cost * item.qty;
          else uncosted.add(item.menuItemId || item.name);
        });
      });

      // Never guess cost: without making cost for every item sold, profit cannot be resolved
      const costResolved = uncosted.size === 0 && totalSales > 0;
      const operatingProfit = costResolved
        ? totalSales - totalCogs - staffCost - expenses.rent - expenses.electricity - expenses.other
        : null;

      setReportData({
        monthStr,
        totalSales,
        totalCogs,
        costResolved,
        itemsWithoutCost: uncosted.size,
        staffCost,
        expenses,
        operatingProfit,
        grossMargin: costResolved ? ((totalSales - totalCogs) / totalSales) * 100 : null,
        netMargin: costResolved && operatingProfit !== null ? (operatingProfit / totalSales) * 100 : null
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
