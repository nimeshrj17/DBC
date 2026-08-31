import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  archived?: boolean;
  isRetail?: boolean; // Flag to bypass kitchen routing
  linkedInventoryId?: string; // Legacy: used for 1-to-1 retail linkage
  linkedInventoryAmount?: number; // Legacy
  recipe?: { inventoryId: string, amount: number }[]; // BOM/Recipe array
}

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'menuItems'), orderBy('category', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items: MenuItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.archived) {
          items.push({ id: doc.id, ...data } as MenuItem);
        }
      });
      // Sort secondarily by name on the client to avoid Firestore composite index requirement
      items.sort((a, b) => {
        if (a.category === b.category) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
      setMenuItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching menu items:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'menuItems'), item);
      return docRef.id;
    } catch (error) {
      console.error("Error adding menu item:", error);
      throw error;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      // Soft delete: keep the record but hide it from active menus
      // This ensures past orders referencing this item ID don't break
      await updateDoc(doc(db, 'menuItems', id), { archived: true, available: false });
    } catch (error) {
      console.error("Error soft-deleting menu item:", error);
      throw error;
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<Omit<MenuItem, 'id'>>) => {
    try {
      await updateDoc(doc(db, 'menuItems', id), updates);
    } catch (error) {
      console.error("Error updating menu item:", error);
      throw error;
    }
  };

  return { menuItems, loading, addMenuItem, deleteMenuItem, updateMenuItem };
}
