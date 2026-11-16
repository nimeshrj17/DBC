const express = require('express');
const cors = require('cors');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Where the printer is.
// printer.json (next to this file) or PRINTER_HOST / PRINTER_PORT env vars.
// With a host set, slips go straight to the printer over the network (port 9100),
// so a stale Mac print queue can never swallow them. Without one, the old
// "lpr -P Kitchen" route is used.
// ---------------------------------------------------------------------------
function loadPrinterConfig() {
    let cfg = {};
    try { cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'printer.json'), 'utf8')); } catch (e) { /* optional */ }
    return {
        host: process.env.PRINTER_HOST || cfg.host || '',
        port: Number(process.env.PRINTER_PORT || cfg.port || 9100),
    };
}
const printer = loadPrinterConfig();

const CONNECT_TIMEOUT_MS = 6000;
const ESC_INIT = Buffer.from([0x1B, 0x40]);
const CUT = Buffer.from([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00]);

const log = (...a) => console.log(new Date().toLocaleTimeString(), ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- talking to the printer ----------
// Network receipt printers usually accept ONE connection at a time and, on Wi-Fi, often ignore the
// first connection after being idle. So: one connection per job, always closed, never in parallel,
// and failed connections are retried.

function connect() {
    return new Promise((resolve, reject) => {
        const socket = net.connect({ host: printer.host, port: printer.port });
        const fail = e => { socket.destroy(); reject(new Error(`Cannot reach printer ${printer.host}:${printer.port} (${e.code || e.message})`)); };
        socket.setTimeout(CONNECT_TIMEOUT_MS, () => fail(new Error('timed out')));
        socket.once('error', fail);
        socket.once('connect', () => { socket.setTimeout(0); socket.removeListener('error', fail); socket.on('error', () => {}); resolve(socket); });
    });
}

/** Wait for the printer to answer a status request; null if it stays silent. */
function readReply(socket, ms) {
    return new Promise(resolve => {
        const t = setTimeout(() => { socket.removeListener('data', on); resolve(null); }, ms);
        const on = d => { clearTimeout(t); resolve(d); };
        socket.once('data', on);
    });
}

/** Send the bytes and wait until they have been written out and the connection is closed. */
function sendAndClose(socket, bytes) {
    return new Promise((resolve, reject) => {
        socket.once('error', reject);
        socket.once('close', resolve);
        socket.end(bytes);
    });
}

/**
 * ESC/POS real-time status (paper, cover, errors). Printers that do not answer are treated as unknown,
 * never as a failure, so an unusual model cannot block printing.
 */
async function checkPrinterStatus(socket) {
    socket.write(Buffer.from([0x10, 0x04, 0x02])); // offline-cause status
    const offline = await readReply(socket, 500);
    if (!offline) return null; // no answer: do not ask again
    const b = offline[0];
    if (b & 0x04) return 'The printer cover is open';
    if (b & 0x20) return 'The printer is out of paper';
    if (b & 0x40) return 'The printer has an error';
    socket.write(Buffer.from([0x10, 0x04, 0x04])); // paper sensor status
    const paper = await readReply(socket, 500);
    if (paper && (paper[0] & 0x60)) return 'The printer is out of paper';
    return null;
}

// One job at a time on the printer, including status probes.
let queue = Promise.resolve();
const enqueue = job => { const run = queue.then(job, job); queue = run.catch(() => {}); return run; };

async function printDirect(buffer) {
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const socket = await connect();
            const problem = attempt === 1 ? await checkPrinterStatus(socket).catch(() => null) : null;
            if (problem) { socket.destroy(); const e = new Error(problem); e.final = true; throw e; }
            await sendAndClose(socket, buffer);
            return;
        } catch (e) {
            if (e.final) throw e;
            lastErr = e;
            log(`Print attempt ${attempt} failed: ${e.message}`);
            await sleep(1000);
        }
    }
    throw lastErr;
}

let probeCache = { at: 0, value: null };
/** Can a connection be opened right now? Cached for a few seconds and queued behind real print jobs. */
async function printerReachable() {
    if (!printer.host) return { configured: false, reachable: null };
    if (probeCache.value && Date.now() - probeCache.at < 4000) return probeCache.value;
    const value = await enqueue(async () => {
        try { const s = await connect(); s.destroy(); return { configured: true, reachable: true }; }
        catch (e) { return { configured: true, reachable: false, error: e.message }; }
    });
    probeCache = { at: Date.now(), value };
    return value;
}

/** The old route through the Mac print queue. Success only means the queue accepted the job. */
function printViaCups(orderId, buffer) {
    return new Promise((resolve, reject) => {
        const filePath = `/tmp/kot_${orderId}.txt`;
        fs.writeFileSync(filePath, buffer);
        exec('lpstat -p', (statErr, stdout) => {
            const useKitchen = !statErr && stdout && stdout.includes('printer Kitchen');
            const cmd = useKitchen ? `lpr -P Kitchen ${filePath}` : `lpr ${filePath}`;
            log(`Executing: ${cmd}`);
            exec(cmd, error => (error ? reject(error) : resolve()));
        });
    });
}

// ---------- slip layout ----------

function buildSlip(order) {
    const lines = [];
    lines.push('');
    lines.push('   RAKHA BHAI KI CHAI & CAFE');
    lines.push('================================');
    lines.push('      KITCHEN ORDER TICKET');
    lines.push('================================');
    lines.push(`Table: ${order.tableName || order.tableNumber}`);
    lines.push(`Order #: ${order.displayId || String(order.id).substring(0, 6)}`);
    if (order.customerName) lines.push(`Customer: ${order.customerName}`);
    lines.push(`Time: ${new Date().toLocaleTimeString()}`);
    lines.push('--------------------------------');
    lines.push('QTY  ITEM');
    lines.push('--------------------------------');
    order.items.forEach(item => {
        lines.push(` ${item.qty}x  ${item.name}`);
        if (item.notes) lines.push(`      Note: ${item.notes}`);
    });
    lines.push('================================');
    lines.push('', '', '');
    return Buffer.concat([ESC_INIT, Buffer.from(lines.join('\n'), 'utf8'), CUT]);
}

// ---------- routes ----------

app.get('/', (req, res) => {
    res.send(`
        <html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f0fdf4;font-family:sans-serif;">
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                <h1 style="color:#16a34a;margin-bottom:10px;">✅ CaféFlow Print Agent</h1>
                <p style="color:#475569;font-size:18px;">The print agent is running.</p>
                <p style="color:#94a3b8;font-size:14px;">Printer: ${printer.host ? `${printer.host}:${printer.port}` : 'Mac print queue'}. You can safely close this window.</p>
            </div>
        </body></html>`);
});

/** Agent plus real printer state, so the dashboard can say "printer offline" when it truly is. */
app.get('/status', async (req, res) => {
    const p = await printerReachable();
    res.json({ agent: true, mode: printer.host ? 'network' : 'cups', printer: { host: printer.host || null, port: printer.port, ...p } });
});

const recentlyPrinted = new Map(); // order id -> time, to ignore a repeat request for the same slip
const REPEAT_WINDOW_MS = 2 * 60 * 1000;

app.post('/print', async (req, res) => {
    const { order, force } = req.body || {};
    if (!order || !Array.isArray(order.items) || !order.id) {
        return res.status(400).json({ success: false, error: 'Invalid order data' });
    }

    const last = recentlyPrinted.get(order.id);
    if (!force && last && Date.now() - last < REPEAT_WINDOW_MS) {
        log(`Order ${order.id} was printed ${Math.round((Date.now() - last) / 1000)}s ago, not printing it twice`);
        return res.json({ success: true, duplicate: true });
    }

    const label = order.displayId || String(order.id).substring(0, 6);
    log(`Print request for order ${label}`);
    const buffer = buildSlip(order);

    try {
        if (printer.host) await enqueue(() => printDirect(buffer));
        else await enqueue(() => printViaCups(order.id, buffer));
        recentlyPrinted.set(order.id, Date.now());
        log(`Printed order ${label}`);
        res.json({ success: true, via: printer.host ? 'network' : 'cups' });
    } catch (error) {
        log(`FAILED order ${label}: ${error.message}`);
        res.status(502).json({ success: false, error: error.message });
    }
});

const PORT = 5050;
app.listen(PORT, async () => {
    log(`CaféFlow Print Agent running on http://localhost:${PORT}`);
    if (printer.host) {
        const p = await printerReachable();
        log(p.reachable ? `Printer ${printer.host}:${printer.port} is reachable` : `WARNING: printer ${printer.host}:${printer.port} is NOT reachable (${p.error})`);
    } else {
        log('No printer.json found: printing through the Mac print queue (Kitchen or default printer)');
    }
});
