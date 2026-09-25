import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  minPar: number;
  normalPar: number;
  maxPar: number;
  currentStock: number;
  lastUpdated: number;
}

export interface InventoryMovement {
  id?: string;
  date: string;
  itemId: string;
  itemName: string;
  openingStock: number;
  purchasedQty: number;
  closingStock: number;
  actualConsumption: number;
  expectedConsumption: number;
  variance: number;
  varianceFlag: boolean;
}

export function useOwnerInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeItems = onSnapshot(collection(db, 'inventory_items'), (snap) => {
      const parsedItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      // Sort alphabetically
      parsedItems.sort((a, b) => a.name.localeCompare(b.name));
      setItems(parsedItems);
      setLoading(false);
    });
    
    // Limit movements to the last 30 days to save reads
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const qMove = query(collection(db, 'inventory_movements'), where('date', '>=', dateStr));
    const unsubscribeMovements = onSnapshot(qMove, (snap) => {
      setMovements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryMovement)));
    });

    return () => {
      unsubscribeItems();
      unsubscribeMovements();
    };
  }, []);

  const addOrUpdateItem = async (item: Partial<InventoryItem>) => {
    try {
      const data = { ...item, lastUpdated: Date.now() };
      if (item.id) {
        await updateDoc(doc(db, 'inventory_items', item.id), data);
        toast.success("Item updated");
      } else {
        await addDoc(collection(db, 'inventory_items'), data);
        toast.success("Item created");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save item");
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory_items', id));
      toast.success("Item deleted");
    } catch (e) {
      toast.error("Failed to delete item");
    }
  };

  const recordDailyMovement = async (movement: Omit<InventoryMovement, 'id'>) => {
    try {
      // 1. Record the movement
      await addDoc(collection(db, 'inventory_movements'), movement);
      
      // 2. Update the master item's current stock
      await updateDoc(doc(db, 'inventory_items', movement.itemId), {
        currentStock: movement.closingStock,
        lastUpdated: Date.now()
      });
      
      toast.success(`Movement recorded for ${movement.itemName}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to record movement");
    }
  };

  return { items, movements, loading, addOrUpdateItem, deleteItem, recordDailyMovement };
}
