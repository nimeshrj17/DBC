import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, Timestamp, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'raw' | 'retail';
  quantity: number;
  unit: string;
  totalCost: number;
  purchaseDate: any; // Firestore timestamp
  company?: string;
  retailCategory?: 'cigarettes' | 'biscuits' | 'soft_drinks' | 'lighters' | 'toffees' | 'other';
  itemNumber?: string;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('purchaseDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setInventory(inventoryData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'purchaseDate'> & { purchaseDate?: any }) => {
    try {
      const docRef = await addDoc(collection(db, 'inventory'), {
        ...item,
        purchaseDate: item.purchaseDate || Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding inventory item:", error);
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'inventory', id), updates);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      
      // Also archive any linked menu items to keep the menu in sync
      const q = query(collection(db, 'menuItems'), where('linkedInventoryId', '==', id));
      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(docSnap => 
        updateDoc(docSnap.ref, { archived: true, available: false })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw error;
    }
  };

  return { inventory, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem };
}
