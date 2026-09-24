import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/components/dashboard/PaymentModal.tsx"
with open(filepath, "r") as f:
    content = f.read()

bad_buttons = """          {view === 'select' && (
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleConfirm('cash')}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Banknote className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-center leading-tight">Cash<br/>Payment</span>
              </button>
              <button 
                onClick={() => {
                  setView('qr');
                }}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-center leading-tight">UPI<br/>QR Code</span>
              </button>
              
              <button 
                onClick={handlePushToBox}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-2xl hover:border-[#00BAF2] hover:bg-[#00BAF2]/5 transition-all group disabled:opacity-50 relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-full bg-[#00BAF2]/10 text-[#00BAF2] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <span className="font-bold text-[11px] text-center leading-tight">Push to<br/>SmartBox</span>
              </button>
            </div>
          )}"""

good_buttons = """          {view === 'select' && (
            <div className="space-y-3">
              {/* Cash - Highlighted Primary Fast-Tap Option */}
              <button 
                onClick={() => handleConfirm('cash')}
                disabled={isProcessing}
                className="w-full flex items-center justify-between p-5 border-2 border-green-500 bg-green-50 hover:bg-green-100 rounded-2xl transition-all group disabled:opacity-50 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-xl text-green-900 leading-none mb-1">Cash Payment</div>
                    <div className="text-green-700 text-sm font-semibold">1-tap settle</div>
                  </div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setView('qr');
                  }}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-center leading-tight text-gray-700">UPI<br/>QR Code</span>
                </button>
                
                <button 
                  onClick={handlePushToBox}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-4 border-2 border-border rounded-2xl hover:border-[#00BAF2] hover:bg-[#00BAF2]/5 transition-all group disabled:opacity-50 relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00BAF2]/10 text-[#00BAF2] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                    </svg>
                  </div>
                  <span className="font-bold text-[13px] text-center leading-tight text-gray-700">Push to<br/>SmartBox</span>
                </button>
              </div>
            </div>
          )}"""

content = content.replace(bad_buttons, good_buttons)

with open(filepath, "w") as f:
    f.write(content)

