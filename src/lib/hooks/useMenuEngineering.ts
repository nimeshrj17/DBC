import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order } from './useOrders';
import { CostingData } from './useMenu';
import { toast } from 'sonner';

export function useMenuEngineering(daysBack = 7) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVolumes() {
      setLoading(true);
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        startDate.setHours(0, 0, 0, 0);

        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', startDate)
        );
        
        const snap = await getDocs(q);
        const volMap: Record<string, number> = {};
        
        snap.docs.forEach(doc => {
          const order = doc.data() as Order;
          if (order.status === 'cancelled') return;
          
          order.items.forEach(item => {
            if (!volMap[item.menuItemId]) volMap[item.menuItemId] = 0;
            volMap[item.menuItemId] += item.qty;
          });
        });
        
        setVolumes(volMap);
      } catch (err) {
        console.error("Failed to fetch menu engineering volumes:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVolumes();
  }, [daysBack]);

  const updateItemCosting = async (menuItemId: string, costing: CostingData, prepTime?: number) => {
    try {
      const updateData: any = { costing };
      if (prepTime !== undefined) updateData.prepTime = prepTime;
      
      await updateDoc(doc(db, 'menuItems', menuItemId), updateData);
      toast.success("Costing updated successfully");
      return true;
    } catch (err) {
      console.error(err);
      toast.error("Failed to update costing");
      return false;
    }
  };

  return { volumes, loading, updateItemCosting };
}
