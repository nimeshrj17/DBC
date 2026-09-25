import React, { useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';
import { Table } from '@/lib/hooks/useTables';

export default function DownloadAllQRsButton({ tables }: { tables: Table[] }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210 x 297 mm
      const a4Width = 210;
      const a4Height = 297;
      
      // Calculate grid to fit all tables on exactly ONE page
      const count = tables.length || 1;
      let cols = Math.ceil(Math.sqrt(count * (a4Width / a4Height)));
      let rows = Math.ceil(count / cols);

      // Ensure decent aspect ratio (portrait)
      if (cols > rows) {
        cols = rows;
        rows = Math.ceil(count / cols);
      }

      const cellWidth = a4Width / cols;
      const cellHeight = a4Height / rows;

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dreambeancafe.com';

      // Sort tables by number
      const sortedTables = [...tables].sort((a, b) => a.number - b.number);

      for (let i = 0; i < sortedTables.length; i++) {
        const table = sortedTables[i];
        const orderUrl = `${baseUrl}/order/${table.id}`;
        
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = col * cellWidth;
        const y = row * cellHeight;

        // Generate QR data URL
        const qrDataUrl = await QRCode.toDataURL(orderUrl, {
          margin: 1,
          width: 400,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        // Determine spacing based on cell size
        const padding = cellWidth * 0.1;
        const contentWidth = cellWidth - (padding * 2);
        
        // Font sizing based on cell height
        const titleFontSize = Math.max(8, Math.min(14, cellHeight * 0.1));
        const subtitleFontSize = Math.max(10, Math.min(16, cellHeight * 0.12));
        
        // Text: "Scan to order"
        pdf.setFontSize(titleFontSize);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text("Scan to order", x + cellWidth / 2, y + (cellHeight * 0.15), { align: "center" });

        // QR Code Image
        const qrSize = Math.min(contentWidth, cellHeight * 0.55);
        const qrX = x + (cellWidth - qrSize) / 2;
        const qrY = y + (cellHeight * 0.2);
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Text: Table Number
        pdf.setFontSize(subtitleFontSize);
        pdf.text(`Table ${table.number}`, x + cellWidth / 2, qrY + qrSize + (cellHeight * 0.12), { align: "center" });
        
        // Draw a light border for cutting
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.1);
        pdf.rect(x, y, cellWidth, cellHeight);
      }

      pdf.save('All_Tables_QRs.pdf');
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={downloadPDF}
      disabled={isGenerating}
      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 whitespace-nowrap"
      title="Download all table QR codes in one PDF page"
    >
      {isGenerating ? (
        <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Download className="w-4 h-4" />
      )}
      {isGenerating ? 'Generating PDF...' : 'All QRs PDF'}
    </button>
  );
}
