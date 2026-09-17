const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Friendly status page for clients who accidentally visit the URL
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f0fdf4; font-family:sans-serif;">
                <div style="text-align:center; padding:40px; background:white; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <h1 style="color:#16a34a; margin-bottom:10px;">✅ CaféFlow Print Agent</h1>
                    <p style="color:#475569; font-size:18px;">The print agent is actively running in the background.</p>
                    <p style="color:#94a3b8; font-size:14px; mt-4">You can safely close this window.</p>
                </div>
            </body>
        </html>
    `);
});

app.post('/print', (req, res) => {
    const { order } = req.body;
    
    if (!order || !order.items) {
        return res.status(400).json({ success: false, error: 'Invalid order data' });
    }

    try {
        console.log(`\n🖨️  Received print request for Order #${order.displayId || order.id.substring(0, 6)}`);

        let kotText = `\n`;
        kotText += `   RAKHA BHAI KI CHAI & CAFE\n`;
        kotText += `================================\n`;
        kotText += `      KITCHEN ORDER TICKET\n`;
        kotText += `================================\n`;
        kotText += `Table: ${order.tableName || order.tableNumber}\n`;
        kotText += `Order #: ${order.displayId || order.id.substring(0, 6)}\n`;
        if (order.customerName) kotText += `Customer: ${order.customerName}\n`;
        
        const date = new Date();
        kotText += `Time: ${date.toLocaleTimeString()}\n`;
        kotText += `--------------------------------\n`;
        kotText += `QTY  ITEM\n`;
        kotText += `--------------------------------\n`;

        order.items.forEach(item => {
          kotText += ` ${item.qty}x  ${item.name}\n`;
          if (item.notes) {
            kotText += `      Note: ${item.notes}\n`;
          }
        });

        kotText += `================================\n`;
        kotText += `\n\n\n`;

        const filePath = `/tmp/kot_${order.id}.txt`;
        const textBuffer = Buffer.from(kotText, 'utf8');
        
        const initCmd = Buffer.from([0x1B, 0x40]); 
        const cutCmd = Buffer.from([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00]); 

        const finalBuffer = Buffer.concat([initCmd, textBuffer, cutCmd]);
        fs.writeFileSync(filePath, finalBuffer);

        exec(`lpr -P Kitchen ${filePath}`, (error) => {
            if (error) {
                console.error(`❌ Failed to print:`, error);
                return res.status(500).json({ success: false, error: error.message });
            }
            console.log(`✅ Printed Successfully!`);
            res.json({ success: true });
        });
    } catch (error) {
        console.error(`❌ Exception:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 5050;
app.listen(PORT, () => {
    console.log(`🚀 CaféFlow Print Agent running on http://localhost:${PORT}`);
    console.log(`📡 Waiting for print requests from the browser...`);
});
