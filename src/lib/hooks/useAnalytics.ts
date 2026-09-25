import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from './useOrders';

export function useAnalytics(daysToFetch = 30) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToFetch);
        startDate.setHours(0, 0, 0, 0);

        // Fetch orders from last N days
        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const fetchedOrders: Order[] = [];
        snapshot.forEach(doc => {
          fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [daysToFetch]);

  // --- AGGREGATIONS ---
  const analytics = useMemo(() => {
    if (!orders.length) return null;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 1);

    let todayRevenue = 0;
    let todayCount = 0;
    let lastWeekSameDayRevenue = 0;
    
    let liveOrdersCount = 0;

    const hourlyCounts = new Array(24).fill(0);
    const dayOfWeekRevenue = new Array(7).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    
    const dailyRevenueMap: Record<string, number> = {};

    const itemPerformance: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    const categoryRevenue: Record<string, number> = {};
    
    let cashTotal = 0;
    let upiTotal = 0;
    let qrTotal = 0;

    let dineInOrders = 0;
    let takeawayOrders = 0;

    const customerFrequency: Record<string, { phone: string; name: string; orderCount: number; totalSpend: number }> = {};
    
    let totalOrdersWithMultipleItems = 0;

    orders.forEach(order => {
      if (!order.createdAt) return;
      const orderDate = typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate() : new Date(order.createdAt);
      
      const isCompleted = order.status === 'completed';
      const isCancelled = order.status === 'cancelled';
      const isLive = !isCompleted && !isCancelled;

      if (isLive) liveOrdersCount++;

      // Only count completed orders for revenue/sales analytics
      if (!isCompleted) return;

      const orderTotal = order.total || 0;
      
      // Time-based checks
      if (orderDate >= todayStart) {
        todayRevenue += orderTotal;
        todayCount++;
      } else if (orderDate >= lastWeekStart && orderDate < lastWeekEnd) {
        lastWeekSameDayRevenue += orderTotal;
      }

      // Trends
      const hour = orderDate.getHours();
      hourlyCounts[hour]++;

      const day = orderDate.getDay();
      dayOfWeekRevenue[day] += orderTotal;
      dayOfWeekCounts[day]++;

      const dateString = orderDate.toISOString().split('T')[0];
      dailyRevenueMap[dateString] = (dailyRevenueMap[dateString] || 0) + orderTotal;

      // Payment Split
      if (order.paymentMethod === 'cash') cashTotal += orderTotal;
      else if (order.paymentMethod === 'upi') upiTotal += orderTotal;
      else if (order.paymentMethod === 'qr') qrTotal += orderTotal;

      // Order Type Split
      const hasRetailItems = order.items.some(i => i.isRetail);
      if (hasRetailItems || order.tableNumber === 999999) takeawayOrders++;
      else dineInOrders++;

      // Items & Categories
      if (order.items.length > 1) totalOrdersWithMultipleItems++;

      order.items.forEach(item => {
        const cat = item.category || 'Uncategorized';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.qty);

        if (!itemPerformance[item.menuItemId]) {
          itemPerformance[item.menuItemId] = { name: item.name, category: cat, qty: 0, revenue: 0 };
        }
        itemPerformance[item.menuItemId].qty += item.qty;
        itemPerformance[item.menuItemId].revenue += (item.price * item.qty);
      });

      // Customers
      if (order.customerPhone) {
        if (!customerFrequency[order.customerPhone]) {
          customerFrequency[order.customerPhone] = { 
            phone: order.customerPhone, 
            name: order.customerName || 'Unknown', 
            orderCount: 0, 
            totalSpend: 0 
          };
        }
        customerFrequency[order.customerPhone].orderCount++;
        customerFrequency[order.customerPhone].totalSpend += orderTotal;
      }
    });

    // Formatting for charts
    const dailyRevenueData = Object.entries(dailyRevenueMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, rev]) => ({ date, revenue: rev }));

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekData = days.map((day, i) => ({
      day,
      avgRevenue: dayOfWeekCounts[i] ? dayOfWeekRevenue[i] / dayOfWeekCounts[i] : 0,
      totalRevenue: dayOfWeekRevenue[i]
    }));

    const hourlyData = hourlyCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      orders: count
    }));

    const topItemsByQty = Object.values(itemPerformance).sort((a, b) => b.qty - a.qty).slice(0, 10);
    const topItemsByRevenue = Object.values(itemPerformance).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

    const topCustomers = Object.values(customerFrequency).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 10);

    const paymentData = [
      { name: 'Cash', value: cashTotal },
      { name: 'UPI', value: upiTotal },
      { name: 'QR', value: qrTotal }
    ].filter(d => d.value > 0);

    const orderTypeData = [
      { name: 'Dine-in', value: dineInOrders },
      { name: 'Takeaway', value: takeawayOrders }
    ].filter(d => d.value > 0);

    // Peak Hour logic
    let peakHour = 0;
    let maxOrders = 0;
    hourlyCounts.forEach((count, idx) => {
      if (count > maxOrders) {
        maxOrders = count;
        peakHour = idx;
      }
    });
    
    // Attach Rate
    const totalCompleted = orders.filter(o => o.status === 'completed').length;
    const attachRate = totalCompleted ? (totalOrdersWithMultipleItems / totalCompleted) * 100 : 0;

    return {
      today: {
        revenue: todayRevenue,
        orders: todayCount,
        aov: todayCount ? todayRevenue / todayCount : 0,
        lastWeekRevenue: lastWeekSameDayRevenue,
        revenueGrowth: lastWeekSameDayRevenue ? ((todayRevenue - lastWeekSameDayRevenue) / lastWeekSameDayRevenue) * 100 : null,
        liveOrders: liveOrdersCount,
        peakHourString: maxOrders > 0 ? `${peakHour}:00 - ${peakHour + 1}:00` : 'N/A'
      },
      trends: {
        dailyRevenue: dailyRevenueData,
        dayOfWeek: dayOfWeekData,
        hourly: hourlyData
      },
      menu: {
        topByQty: topItemsByQty,
        topByRevenue: topItemsByRevenue,
        categoryBreakdown: categoryData,
        attachRate
      },
      customers: {
        top: topCustomers,
        totalTracked: Object.keys(customerFrequency).length
      },
      splits: {
        payment: paymentData,
        orderType: orderTypeData
      }
    };
  }, [orders]);

  return { loading, analytics, orderCount: orders.length };
}
