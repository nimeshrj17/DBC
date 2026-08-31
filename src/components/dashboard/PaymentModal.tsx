import React, { useState } from 'react';
import { X, Banknote, QrCode, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '@/lib/hooks/useSettings';

interface PaymentModalProps {
  orderId: string;
  displayId: string;
  total: number;
  onClose: () => void;
  onConfirmPayment: (method: 'cash' | 'qr') => Promise<void>;
}

export default function PaymentModal({ orderId, displayId, total, onClose, onConfirmPayment }: PaymentModalProps) {
  const { settings } = useSettings();
  const [view, setView] = useState<'select' | 'qr'>('select');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (method: 'cash' | 'qr') => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(method);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate UPI URI
  // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tr=ORDER_ID
  const upiUri = settings.upiId 
    ? `upi://pay?pa=${settings.upiId}&pn=DreamBeanCafe&am=${total.toFixed(2)}&cu=INR&tr=${orderId}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-xl font-bold">{view === 'select' ? 'Select Payment Method' : 'Scan to Pay'}</h2>
            <p className="text-sm text-muted-foreground mt-1">Order {displayId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center p-6 bg-card border border-border rounded-2xl shadow-sm mb-6">
            <p className="text-sm text-muted-foreground font-medium mb-1">Total Amount Due</p>
            <div className="text-4xl font-bold text-foreground tracking-tight">₹ {total.toFixed(2)}</div>
          </div>

          {view === 'select' && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleConfirm('cash')}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Banknote className="w-6 h-6" />
                </div>
                <span className="font-bold">Cash</span>
              </button>
              <button 
                onClick={() => {
                  if (settings.upiId) {
                    setView('qr');
                  } else {
                    handleConfirm('qr'); // Fallback if no UPI ID is set
                  }
                }}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="font-bold">QR / Online</span>
              </button>
            </div>
          )}

          {view === 'qr' && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-border mb-4">
                <QRCodeSVG 
                  value={upiUri}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="Q"
                />
              </div>
              
              <a 
                href={upiUri}
                className="w-full bg-[#A04010] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 mb-4 shadow-md hover:bg-[#8A3000] transition-colors"
              >
                Open UPI App to Pay
              </a>
              
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Scan with any UPI app (GPay, PhonePe, Paytm, etc.) or tap the button above to pay ₹{total.toFixed(2)}.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setView('select')}
                  className="flex-1 py-3 px-4 rounded-xl border border-border font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => handleConfirm('qr')}
                  disabled={isProcessing}
                  className="flex-2 flex items-center justify-center py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  style={{ flex: 2 }}
                >
                  {isProcessing ? 'Processing...' : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Confirm Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
