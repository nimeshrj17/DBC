import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Coffee, Pointer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QRCodeGeneratorProps {
  tableId: string;
  tableNumber: number;
  tableName?: string;
  buttonClassName?: string;
  buttonContent?: React.ReactNode;
}

export default function QRCodeGenerator({ tableId, tableNumber, tableName, buttonClassName, buttonContent }: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!printRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Temporarily make the hidden element visible for capture
      printRef.current.style.display = 'flex';
      
      const canvas = await html2canvas(printRef.current, {
        scale: 4, // High resolution
        useCORS: true,
        backgroundColor: '#FCFAFA' // The slight off-white background
      });
      
      printRef.current.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      
      // A6 size is 105 x 148 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a6'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Table_${tableNumber}_QR_Menu.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      printRef.current.style.display = 'none';
    } finally {
      setIsGenerating(false);
    }
  };

  // URL that the QR code will point to
  // Assuming the app is deployed, we use window.location.origin, otherwise a placeholder
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dreambeancafe.com';
  const orderUrl = `${baseUrl}/order/${tableId}`;

  return (
    <>
      <button 
        onClick={downloadPDF}
        disabled={isGenerating}
        className={buttonClassName || "text-xs px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 w-full mt-3 font-semibold"}
      >
        {isGenerating ? (
          <span className="flex items-center gap-1.5 justify-center">
            <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </span>
        ) : (
          buttonContent || 'Download QR PDF'
        )}
      </button>

      {/* Hidden container for PDF generation */}
      <div 
        ref={printRef} 
        style={{ 
          display: 'none', 
          width: '400px', 
          height: '565px', // Aspect ratio roughly matching A6 (1:1.414)
          backgroundColor: '#FCFAFA',
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {/* Top decorative shapes */}
        <div style={{ position: 'relative', width: '100%', height: '90px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '70px', backgroundColor: '#F5EFEA', borderBottomRightRadius: '100px' }}></div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '70px', backgroundColor: '#F5EFEA', borderBottomLeftRadius: '100px' }}></div>
          
          {/* Logo Circle */}
          <div style={{ 
            marginTop: '20px', 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            backgroundColor: '#2A1A14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}>
            <Coffee style={{ color: '#D4C1B3', width: '24px', height: '24px' }} />
          </div>
        </div>

        {/* Cafe Name */}
        <h1 style={{ 
          fontSize: '22px', 
          fontWeight: 800, 
          color: '#000000', 
          textAlign: 'center',
          marginTop: '10px',
          marginBottom: '10px',
          lineHeight: '1.2'
        }}>
          राखा भाई की चाय<br />and Café
        </h1>

        {/* Scan to Order Text */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#A04010', margin: 0 }}>Scan to Order</h2>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>No app required</p>
        </div>

        {/* QR Code Container */}
        <div style={{
          position: 'relative',
          padding: '12px',
          backgroundColor: '#EBE2DC',
          borderRadius: '16px',
          marginBottom: '15px'
        }}>
          {/* Decorative Corners */}
          <div style={{ position: 'absolute', top: '8px', left: '8px', width: '20px', height: '20px', borderTop: '4px solid #A04010', borderLeft: '4px solid #A04010', borderTopLeftRadius: '8px' }}></div>
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderTop: '4px solid #A04010', borderRight: '4px solid #A04010', borderTopRightRadius: '8px' }}></div>
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '20px', height: '20px', borderBottom: '4px solid #A04010', borderLeft: '4px solid #A04010', borderBottomLeftRadius: '8px' }}></div>
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '20px', height: '20px', borderBottom: '4px solid #A04010', borderRight: '4px solid #A04010', borderBottomRightRadius: '8px' }}></div>
          
          <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px' }}>
            <QRCodeSVG 
              value={orderUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#2A1A14"
              level="M"
            />
          </div>
        </div>

        {/* Bottom Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'auto' }}>
          <Pointer style={{ width: '16px', height: '16px', color: '#2A1A14' }} />
          <p style={{ fontSize: '13px', color: '#2A1A14', fontWeight: 500, margin: 0 }}>
            Browse menu, order, and pay seamlessly.
          </p>
        </div>

        {/* Table Number Pill */}
        <div style={{
          marginTop: '15px',
          marginBottom: '20px',
          backgroundColor: '#160B08',
          color: 'white',
          padding: '12px 32px',
          borderRadius: '9999px',
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          Table {tableNumber}
        </div>
      </div>
    </>
  );
}
