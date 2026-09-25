import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from './useOrders';

export interface DailyMetrics {
  totalSales: number;
  totalBills: number;
  avgBill: number;
  paymentSplit: { cash: number; upi: number; other: number };
  hourlySales: { hour: string; amount: number; bills: number }[];
  itemSales: { name: string; qty: number; revenue: number }[];
}

export function useOwnerMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Highly optimized read: Only fetch today's orders
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startOfToday)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalSales = 0;
      let totalBills = 0;
      const paymentSplit = { cash: 0, upi: 0, other: 0 };
      const hourlyMap = new Map<number, { amount: number; bills: number }>();
      const itemMap = new Map<string, { qty: number; revenue: number }>();

      // Initialize hourly buckets (12 PM to 12 AM)
      for (let i = 12; i < 24; i++) {
        hourlyMap.set(i, { amount: 0, bills: 0 });
      }

      snapshot.docs.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as Order;
        
        // Only count billed or completed orders for revenue metrics
        if (order.status === 'billed' || order.status === 'completed' || order.paymentStatus === 'paid') {
          totalSales += order.total;
          totalBills += 1;

          if (order.paymentMethod === 'cash') paymentSplit.cash += order.total;
          else if (order.paymentMethod === 'upi') paymentSplit.upi += order.total;
          else paymentSplit.other += order.total;

          // Hourly mapping
          const hour = order.createdAt?.toDate().getHours() || new Date().getHours();
          if (hourlyMap.has(hour)) {
            const h = hourlyMap.get(hour)!;
            h.amount += order.total;
            h.bills += 1;
          }

          // Item aggregation
          order.items.forEach(item => {
            const existing = itemMap.get(item.name) || { qty: 0, revenue: 0 };
            itemMap.set(item.name, {
              qty: existing.qty + item.qty,
              revenue: existing.revenue + (item.price * item.qty)
            });
          });
        }
      });

      const hourlySales = Array.from(hourlyMap.entries()).map(([hour, data]) => {
        const hourLabel = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        return { hour: hourLabel, ...data };
      });

      const itemSales = Array.from(itemMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.qty - a.qty);

      setMetrics({
        totalSales,
        totalBills,
        avgBill: totalBills > 0 ? totalSales / totalBills : 0,
        paymentSplit,
        hourlySales,
        itemSales
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { metrics, loading };
}
