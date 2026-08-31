import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface Customer {
  id: string; // phone number usually
  name: string;
  phone: string;
  totalOrders: number;
  totalRevenue: number;
  lastVisit: any;
  createdAt: any;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('lastVisit', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addOrUpdateCustomer = async (phone: string, name: string) => {
    try {
      const customerRef = doc(db, 'customers', phone);
      const snap = await getDoc(customerRef);
      
      if (snap.exists()) {
        // Customer exists, just update name if it changed
        await updateDoc(customerRef, {
          name,
          lastVisit: serverTimestamp()
        });
      } else {
        // New customer
        await setDoc(customerRef, {
          name,
          phone,
          totalOrders: 0,
          totalRevenue: 0,
          lastVisit: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }
      return phone; // phone is used as ID
    } catch (error) {
      console.error("Error adding/updating customer:", error);
      throw error;
    }
  };

  return { customers, loading, addOrUpdateCustomer };
}
