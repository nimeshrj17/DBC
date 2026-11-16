import React, { useState } from 'react';

interface PaymentModalProps {
  orderId: string;
  displayId: string;
  total: number;
  tableId?: string;
  onClose: () => void;
  onConfirmPayment: (method: 'cash' | 'upi') => Promise<void>;
}

export default function PaymentModal({ displayId, total, onClose, onConfirmPayment }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Online payments are confirmed by the physical sound box, so staff just record the method.
  const handleConfirm = async (method: 'cash' | 'upi') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirmPayment(method);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-xl font-bold">Select Payment Method</h2>
            <p className="text-sm text-muted-foreground mt-1">Order {displayId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <i className="w-5 h-5 las la-times"></i>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center p-6 bg-card border border-border rounded-2xl shadow-sm mb-6">
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Amount Due</p>
            <div className="text-4xl font-bold text-foreground tracking-tight">₹ {total.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleConfirm('cash')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center p-5 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <i className="w-6 h-6 las la-banknote"></i>
              </div>
              <span className="font-bold text-sm text-center leading-tight">Cash<br/>Payment</span>
            </button>
            <button
              onClick={() => handleConfirm('upi')}
              disabled={isProcessing}
              className="flex flex-col items-center justify-center p-5 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <i className="w-6 h-6 las la-qrcode"></i>
              </div>
              <span className="font-bold text-sm text-center leading-tight">Online<br/>Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
