import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  qty: number;
  notes?: string;
  category?: string;
  isRetail?: boolean;
}

export interface Order {
  id: string;
  displayId: string;
  tableId: string;
  tableNumber: number;
  customerPhone: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'preparing' | 'prepared' | 'served' | 'billed' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'upi' | 'qr' | null;
  paymentStatus: 'unpaid' | 'awaiting_confirmation' | 'paid';
  createdAt: any;
  updatedAt: any;
  customerId?: string; // To track who made the order
}
export const createOrderTransaction = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'displayId'> & { displayIdPrefix?: string, idempotencyKey?: string }) => {
  try {
    const prefix = orderData.displayIdPrefix || 'KOT';
    const displayId = `#${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { idempotencyKey, displayIdPrefix, ...dataToSave } = orderData;
    
    let newOrderId = '';
    
    await runTransaction(db, async (transaction) => {
      // 1. Gather all menu items to find linked inventory
      const menuRefs = dataToSave.items.map(item => doc(db, 'menuItems', item.menuItemId));
      const menuSnaps = await Promise.all(menuRefs.map(ref => transaction.get(ref)));
      
      // 2. Map inventory requirements
      const inventoryDeductions: Record<string, { deduct: number, name: string }> = {};
      
      dataToSave.items.forEach((orderItem, index) => {
        const menuSnap = menuSnaps[index];
        if (menuSnap.exists()) {
          const menuData = menuSnap.data();
          
          // Legacy 1-to-1 linkage
          if (menuData.linkedInventoryId && menuData.linkedInventoryAmount) {
            const amount = menuData.linkedInventoryAmount * orderItem.qty;
            if (inventoryDeductions[menuData.linkedInventoryId]) {
              inventoryDeductions[menuData.linkedInventoryId].deduct += amount;
            } else {
              inventoryDeductions[menuData.linkedInventoryId] = { deduct: amount, name: menuData.name };
            }
          }
          
          // New Recipe BOM linkage
          if (menuData.recipe && Array.isArray(menuData.recipe)) {
            menuData.recipe.forEach((ingredient: any) => {
              const amount = ingredient.amount * orderItem.qty;
              if (inventoryDeductions[ingredient.inventoryId]) {
                inventoryDeductions[ingredient.inventoryId].deduct += amount;
              } else {
                inventoryDeductions[ingredient.inventoryId] = { deduct: amount, name: `${menuData.name} Ingredient` };
              }
            });
          }
        }
      });
      
      // 3. Verify and deduct inventory
      const inventoryKeys = Object.keys(inventoryDeductions);
      for (const invId of inventoryKeys) {
        const invRef = doc(db, 'inventory', invId);
        const invSnap = await transaction.get(invRef);
        if (invSnap.exists()) {
          const currentQty = invSnap.data().quantity || 0;
          const required = inventoryDeductions[invId].deduct;
          
          if (currentQty < required) {
            throw new Error(`Insufficient stock for ${inventoryDeductions[invId].name}`);
          }
          
          // Deduct stock
          transaction.update(invRef, { quantity: currentQty - required });
          
          // Auto-flip menu availability if stock hits zero
          if (currentQty - required <= 0) {
            // Find all menu items linked to this inventory and set available: false
            menuSnaps.forEach(mSnap => {
              if (mSnap.exists() && mSnap.data().linkedInventoryId === invId) {
                transaction.update(mSnap.ref, { available: false });
              }
            });
          }
          
          // Log it
          const logRef = doc(collection(db, 'inventoryLog'));
          transaction.set(logRef, {
            inventoryId: invId,
            change: -required,
            reason: 'sale',
            orderId: idempotencyKey || 'new_order',
            timestamp: serverTimestamp()
          });
        }
      }
      
      // 4. Create the Order
      let orderRef;
      if (idempotencyKey) {
        orderRef = doc(db, 'orders', idempotencyKey);
      } else {
        orderRef = doc(collection(db, 'orders'));
      }
      
      transaction.set(orderRef, {
        ...dataToSave,
        displayId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      newOrderId = orderRef.id;
    });
    
    return newOrderId;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'displayId'> & { idempotencyKey?: string }) => {
    return createOrderTransaction(orderData);
  };

  const updateOrder = async (orderId: string, updates: Partial<Omit<Order, 'id'>>) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updates);
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  };
  
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return { orders, loading, createOrder, updateOrder, updateOrderStatus };
}
