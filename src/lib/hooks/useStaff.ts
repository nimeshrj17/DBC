import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export type Role = 'admin' | 'manager' | 'cashier' | 'kitchen';

export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: Role;
  isActive: boolean;
  canViewRevenue?: boolean;
  createdAt?: any;
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'staff');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[];
      setStaff(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addStaff = async (data: Omit<Staff, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'staff'), {
      ...data,
      createdAt: serverTimestamp()
    });
  };

  const updateStaff = async (id: string, data: Partial<Staff>) => {
    await updateDoc(doc(db, 'staff', id), data);
  };

  const deleteStaff = async (id: string) => {
    await deleteDoc(doc(db, 'staff', id));
  };

  return { staff, loading, addStaff, updateStaff, deleteStaff };
}
