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
  const getUpiUri = (appId: 'gpay' | 'phonepe' | 'paytm' | 'generic') => {
    if (!settings.upiId) return '';
    const baseParams = `pa=${settings.upiId}&pn=DreamBeanCafe&am=${total.toFixed(2)}&cu=INR&tr=${orderId}`;
    
    // Check if Android
    const isAndroid = typeof window !== 'undefined' && /android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      if (appId === 'gpay') return `intent://pay?${baseParams}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end;`;
      if (appId === 'phonepe') return `intent://pay?${baseParams}#Intent;scheme=upi;package=com.phonepe.app;end;`;
      if (appId === 'paytm') return `intent://pay?${baseParams}#Intent;scheme=upi;package=net.one97.paytm;end;`;
      return `upi://pay?${baseParams}`; // generic
    }
    
    // iOS / Default
    if (appId === 'gpay') return `tez://upi/pay?${baseParams}`;
    if (appId === 'phonepe') return `phonepe://pay?${baseParams}`;
    if (appId === 'paytm') return `paytmmp://pay?${baseParams}`;
    
    return `upi://pay?${baseParams}`;
  };
  const upiUri = getUpiUri('generic');

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
                  setView('qr');
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
              {!settings.upiId ? (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl mb-4 text-center w-full">
                  <p className="font-bold mb-1">UPI ID Not Configured</p>
                  <p className="text-sm">Please ask the cafe owner to configure their UPI ID in the Admin Settings to enable online payments.</p>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-border mb-4">
                  <QRCodeSVG 
                    value={upiUri}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="Q"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 w-full mb-4">
                <a 
                  href={getUpiUri('gpay')}
                  className="bg-white border border-gray-200 text-gray-800 py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors text-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/Google_Pay_Logo_%282020%29.svg" alt="GPay" className="h-4" />
                </a>
                <a 
                  href={getUpiUri('phonepe')}
                  className="bg-white border border-gray-200 text-gray-800 py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors text-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4" />
                </a>
                <a 
                  href={getUpiUri('paytm')}
                  className="bg-white border border-gray-200 text-gray-800 py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors text-sm"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" className="h-3" />
                </a>
                <a 
                  href={getUpiUri('generic')}
                  className="bg-[#A04010] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center shadow-md hover:bg-[#8A3000] transition-colors text-sm"
                >
                  More Apps
                </a>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Scan with any UPI app or tap a button above to pay ₹{total.toFixed(2)}.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setView('select')}
                  className="flex-1 border-2 border-border text-foreground font-bold py-3 rounded-full hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => handleConfirm('qr')}
                  disabled={isProcessing}
                  className="flex-1 bg-[#2A1A14] text-[#D4C1B3] font-bold py-3 rounded-full shadow-md hover:bg-[#3A2A24] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  I have paid
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
