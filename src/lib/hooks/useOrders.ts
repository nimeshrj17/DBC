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
  customerName?: string | null;
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
  kitchenNotes?: string;
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
      
      // READ PHASE: Fetch all required inventory docs FIRST (Firestore rule: all reads before any writes)
      const invRefs = inventoryKeys.map(invId => doc(db, 'inventory', invId));
      const invSnaps = await Promise.all(invRefs.map(ref => transaction.get(ref)));
      
      // WRITE PHASE
      invSnaps.forEach((invSnap, index) => {
        const invId = inventoryKeys[index];
        const invRef = invRefs[index];
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
      });
      
      // 4. Create the Order
      let orderRef;
      if (idempotencyKey) {
        orderRef = doc(db, 'orders', idempotencyKey);
      } else {
        orderRef = doc(collection(db, 'orders'));
      }
      
      // Remove any undefined properties recursively to prevent Firestore crashes
      const cleanDataToSave = JSON.parse(JSON.stringify(dataToSave));
      
      transaction.set(orderRef, {
        ...cleanDataToSave,
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

    const removeSentItemTransaction = async (orderId: string, menuItemId: string, taxPercentage: number) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get the order
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        
        const orderData = orderSnap.data() as Order;
        
        // 2. Find the item
        const itemIndex = orderData.items.findIndex(i => i.menuItemId === menuItemId);
        if (itemIndex === -1) throw new Error("Item not in order");
        
        const itemToRemove = orderData.items[itemIndex];
        
        // 3. Get the menu item to find inventory links
        const menuRef = doc(db, 'menuItems', menuItemId);
        const menuSnap = await transaction.get(menuRef);
        
        // 4. Update the order
        const newItems = [...orderData.items];
        if (itemToRemove.qty > 1) {
          newItems[itemIndex] = { ...itemToRemove, qty: itemToRemove.qty - 1 };
        } else {
          newItems.splice(itemIndex, 1);
        }
        
        const newSubtotal = newItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
        const newTax = taxPercentage > 0 ? newSubtotal * (taxPercentage / 100) : 0;
        const newTotal = newSubtotal + newTax;
        
        transaction.update(orderRef, {
          items: newItems,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          updatedAt: serverTimestamp()
        });
        
        // 5. Restore inventory if linked
        if (menuSnap.exists()) {
          const menuData = menuSnap.data();
          const inventoryAdditions: Record<string, number> = {};
          
          if (menuData.linkedInventoryId && menuData.linkedInventoryAmount) {
            inventoryAdditions[menuData.linkedInventoryId] = menuData.linkedInventoryAmount; // Restore 1 unit qty's worth
          }
          if (menuData.recipe && Array.isArray(menuData.recipe)) {
            menuData.recipe.forEach((ing: any) => {
              if (inventoryAdditions[ing.inventoryId]) {
                inventoryAdditions[ing.inventoryId] += ing.amount;
              } else {
                inventoryAdditions[ing.inventoryId] = ing.amount;
              }
            });
          }
          
          // PRE-READ ALL
          const invKeys = Object.keys(inventoryAdditions);
          if (invKeys.length > 0) {
            const invRefs = invKeys.map(k => doc(db, 'inventory', k));
            const invSnaps = await Promise.all(invRefs.map(r => transaction.get(r)));
            
            invSnaps.forEach((invSnap, idx) => {
              if (invSnap.exists()) {
                const k = invKeys[idx];
                const currentQty = invSnap.data().quantity || 0;
                const toRestore = inventoryAdditions[k];
                transaction.update(invSnap.ref, { quantity: currentQty + toRestore });
                
                // If it was 0 or negative and now positive, maybe set available: true
                if (currentQty <= 0 && currentQty + toRestore > 0) {
                   // Optional: flip menu item availability. We'll skip for safety as another transaction might be needed
                   transaction.update(menuRef, { available: true });
                }
              }
            });
          }
        }
      });
    } catch (error) {
      console.error("Error removing sent item:", error);
      throw error;
    }
  };

  return { orders, loading, createOrder, removeSentItemTransaction, updateOrder, updateOrderStatus };
}
