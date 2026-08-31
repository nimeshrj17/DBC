import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface Table {
  id: string;
  number: number;
  seats: number;
  status: 'empty' | 'occupied' | 'order_placed' | 'preparing' | 'served' | 'awaiting_payment';
  activeOrderIds: string[];
  time?: string;
  price?: string;
}

export function useTables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tables'), orderBy('number', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData: Table[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let activeOrderIds = data.activeOrderIds || [];
        if (data.currentOrderId && activeOrderIds.length === 0) {
          activeOrderIds = [data.currentOrderId];
        }
        tablesData.push({ id: doc.id, ...data, activeOrderIds } as Table);
      });
      setTables(tablesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tables:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateTableStatus = async (tableId: string, status: Table['status'], activeOrderIds?: string[]) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updates: any = { status };
      if (activeOrderIds !== undefined) {
        updates.activeOrderIds = activeOrderIds;
      }
      await updateDoc(tableRef, updates);
    } catch (error) {
      console.error("Error updating table status:", error);
    }
  };

  const addTable = async (number: number, seats: number) => {
    try {
      const docRef = await addDoc(collection(db, 'tables'), {
        number,
        seats,
        status: 'empty',
        activeOrderIds: []
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding table:", error);
      throw error;
    }
  };

  return { tables, loading, updateTableStatus, addTable };
}
