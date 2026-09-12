'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useOrders } from '@/lib/hooks/useOrders';
import { useTables } from '@/lib/hooks/useTables';
import { X, BellRing, Check, CreditCard, Receipt } from 'lucide-react';
import { playNotificationSound } from '@/lib/audio';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export function GlobalPaymentAlert() {
  const { orders } = useOrders();
  const { tables } = useTables();
  
  // Find all orders awaiting confirmation
  const awaitingOrders = orders.filter(o => o.paymentStatus === 'awaiting_confirmation');
  
  // Track dismissed notifications by order ID -> timestamp
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  
  // Current active alert order
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const lastAlarmTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (awaitingOrders.length === 0) {
      setActiveAlert(null);
      return;
    }
    
    const now = Date.now();
    
    // Find the first order that is NOT dismissed, OR whose dismissal expired (> 45s ago)
    let orderToShow = null;
    for (const order of awaitingOrders) {
      const dismissTime = dismissed[order.id];
      if (!dismissTime || (now - dismissTime > 45000)) {
        orderToShow = order;
        break;
      }
    }
    
    if (orderToShow) {
      setActiveAlert(orderToShow);
      
      // Play alarm sound if we haven't played it in the last 40 seconds for this order
      const lastAlarm = lastAlarmTimeRef.current[orderToShow.id] || 0;
      if (now - lastAlarm > 40000) {
        lastAlarmTimeRef.current[orderToShow.id] = now;
        playNotificationSound('payment');
      }
    } else {
      setActiveAlert(null);
    }
    
  }, [orders, dismissed]);
  
  // Timer to continuously re-check the 45s dismissed list and re-trigger
  useEffect(() => {
    const interval = setInterval(() => {
      // Force a re-render to check if any dismissed order has expired (45s)
      setDismissed(prev => ({ ...prev })); 
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!activeAlert) return null;

  const table = tables.find(t => t.id === activeAlert.tableId);
  const tableName = table?.name || `Table ${activeAlert.tableNumber}`;

  const handleDismiss = () => {
    setDismissed(prev => ({ ...prev, [activeAlert.id]: Date.now() }));
    setActiveAlert(null);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const orderRef = doc(db, 'orders', activeAlert.id);
      const tableRef = doc(db, 'tables', activeAlert.tableId);

      await runTransaction(db, async (transaction) => {
        const tableSnap = await transaction.get(tableRef);
        
        transaction.update(orderRef, {
          status: 'completed', 
          paymentStatus: 'paid'
        });

        if (tableSnap.exists()) {
          const tableData = tableSnap.data();
          const activeIds = tableData.activeOrderIds || [];
          const newActiveIds = activeIds.filter((id: string) => id !== activeAlert.id);
          
          if (newActiveIds.length === 0) {
            transaction.update(tableRef, {
              status: 'empty',
              activeOrderIds: [],
              occupancy: 0,
              customerName: null,
              customerPhone: null
            });
          } else {
            transaction.update(tableRef, {
              status: 'occupied',
              activeOrderIds: newActiveIds
            });
          }
        }
      });
      
      toast.success(`Payment confirmed for ${tableName}`);
      setActiveAlert(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to confirm payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl flex flex-col m-4 animate-in zoom-in-95 duration-300 ring-4 ring-rose-500/20">
        
        <div className="bg-rose-500 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-white text-rose-500 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
            <BellRing className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="text-white pt-1">
            <h2 className="text-lg font-black tracking-tight leading-tight">Payment Confirmation</h2>
            <p className="text-rose-100 text-sm font-medium mt-0.5">{tableName} wants to pay.</p>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50">
          <div className="flex flex-col items-center justify-center py-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Bill</div>
            <div className="text-4xl font-black text-slate-900">₹{activeAlert.total.toFixed(2)}</div>
            <div className="mt-3 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
              {activeAlert.paymentMethod === 'cash' ? <CreditCard className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
              {activeAlert.paymentMethod || 'UPI/QR'}
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleConfirm}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all text-white font-black text-lg shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-6 h-6" strokeWidth={3} />
                  Confirm Received
                </>
              )}
            </button>
            <button 
              onClick={handleDismiss}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 transition-all text-slate-500 font-bold text-sm shadow-sm"
            >
              Dismiss (Ask again in 45s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
