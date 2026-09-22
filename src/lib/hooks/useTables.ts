import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export interface Table {
  id: string;
  number: number;
  name?: string;
  section?: string;
  seats: number;
  x?: number;
  y?: number;
  status: 'empty' | 'occupied' | 'order_placed' | 'preparing' | 'prepared' | 'served' | 'awaiting_payment';
  activeOrderIds: string[];
  time?: string;
  price?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  currentSessionId?: string;
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

    const transferTable = async (fromTableId: string, toTableId: string, activeOrderIds: string[]) => {
    try {
      // We will do a batch update for atomicity
      const batch = writeBatch(db);
      
      const fromTableRef = doc(db, 'tables', fromTableId);
      const toTableRef = doc(db, 'tables', toTableId);
      
      const fromTable = tables.find(t => t.id === fromTableId);
      if (!fromTable) throw new Error("Source table not found");
      
      // Update new table
      batch.update(toTableRef, {
        status: fromTable.status,
        activeOrderIds: fromTable.activeOrderIds,
        customerName: fromTable.customerName || null,
        customerPhone: fromTable.customerPhone || null,
        customerId: fromTable.customerId || null,
        currentSessionId: fromTable.currentSessionId || null,
      });
      
      // Clear old table
      batch.update(fromTableRef, {
        status: 'empty',
        activeOrderIds: [],
        customerName: null,
        customerPhone: null,
        customerId: null,
        currentSessionId: null
      });
      
      // Update tableId in all active orders
      activeOrderIds.forEach(orderId => {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { tableId: toTableId });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error transferring table:", error);
      throw error;
    }
  };

  const updateTableStatus = async (tableId: string, status: Table['status'], activeOrderIds?: string[]) => {
    try {
      const tableRef = doc(db, 'tables', tableId);
      const updates: any = { status };
      if (activeOrderIds !== undefined) {
        updates.activeOrderIds = activeOrderIds;
      }
      if (status === 'empty') {
        updates.customerId = null;
        updates.customerName = null;
        updates.customerPhone = null;
        updates.currentSessionId = null;
      }
      await updateDoc(tableRef, updates);
    } catch (error) {
      console.error("Error updating table status:", error);
    }
  };

  const addTable = async (number: number, seats: number, name?: string, section?: string) => {
    try {
      const exists = tables.some(t => t.number === number);
      if (exists) {
        throw new Error(`Table number ${number} already exists. Please choose a unique number.`);
      }
      const docRef = await addDoc(collection(db, 'tables'), {
        number,
        name: name || `Table ${number}`,
        section: section || 'Main Hall',
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

  const updateTableDetails = async (id: string, name: string, section: string, number: number, seats: number, x?: number, y?: number) => {
    try {
      const exists = tables.some(t => t.id !== id && t.number === number);
      if (exists) {
        throw new Error(`Table number ${number} already exists. Please choose a unique number.`);
      }
      const updateData: any = { name, section, number, seats };
      if (x !== undefined) updateData.x = x;
      if (y !== undefined) updateData.y = y;
      await updateDoc(doc(db, 'tables', id), updateData);
    } catch (error) {
      console.error("Error updating table details:", error);
      throw error;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (error) {
      console.error("Error deleting table:", error);
      throw error;
    }
  };

    const updateTablePosition = async (id: string, x: number, y: number) => {
    try {
      await updateDoc(doc(db, 'tables', id), { x, y });
    } catch (error) {
      console.error("Error updating position:", error);
    }
  };

  return { tables, loading, updateTableStatus, addTable, updateTableDetails, deleteTable, transferTable, updateTablePosition };
}
