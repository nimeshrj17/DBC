import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add imports
content = content.replace("import { doc, runTransaction, increment } from 'firebase/firestore';", "import { doc, runTransaction, increment, setDoc, serverTimestamp } from 'firebase/firestore';")

# 2. Add ApprovalCard component before DashboardPage
approval_card = """
const ApprovalCard = ({ order, onAccept, onReject }: any) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      if (order.createdAt) {
        const ms = typeof order.createdAt.toMillis === 'function' 
            ? order.createdAt.toMillis() 
            : (typeof order.createdAt === 'number' ? order.createdAt : Date.now());
        setElapsed(Date.now() - ms);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  
  const isFlashing = elapsed > 60000 && elapsed <= 300000;
  const needsAttention = elapsed > 300000;
  
  return (
    <div className={`p-4 mb-4 rounded-xl shadow-lg border-2 flex items-center justify-between ${needsAttention ? 'bg-red-100 border-red-500' : isFlashing ? 'bg-red-50 border-red-400 animate-pulse' : 'bg-yellow-50 border-yellow-400'}`}>
      <div>
        <h4 className="font-bold text-lg text-slate-900">Table {order.tableNumber} - Order Needs Approval</h4>
        <p className="text-sm font-medium text-slate-700">
          {order.items.length} items • ₹{order.total.toFixed(2)}
        </p>
        <p className="text-xs font-bold mt-1 text-slate-600">
          Time elapsed: {mins}m {secs}s
          {needsAttention && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] uppercase">Needs Attention</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onReject(order.id)} className="px-4 py-2 bg-white text-red-600 font-bold border border-red-200 rounded-lg shadow-sm hover:bg-red-50">Reject</button>
        <button onClick={() => onAccept(order.id)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-sm">Accept</button>
      </div>
    </div>
  );
};

"""

content = content.replace("export default function DashboardPage() {", approval_card + "export default function DashboardPage() {")


# 3. Add handleAcceptOrder, handleRejectOrder, and heartbeat
hooks_and_funcs = """
  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setDoc(doc(db, 'settings', 'heartbeat'), { lastHeartbeat: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error("Heartbeat error", err);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Staff Actions
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/staff/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (!res.ok) throw new Error('Failed to accept');
      toast.success('Order accepted');
    } catch (err) {
      toast.error('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/staff/reject-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: 'Rejected by staff' })
      });
      if (!res.ok) throw new Error('Failed to reject');
      toast.success('Order rejected');
    } catch (err) {
      toast.error('Failed to reject order');
    }
  };
"""

content = content.replace("const handleTransferSubmit = async (e: React.FormEvent) => {", hooks_and_funcs + "\n  const handleTransferSubmit = async (e: React.FormEvent) => {")

# 4. Insert Approval cards before tables display
approval_cards_render = """
        {/* APPROVAL CARDS */}
        {orders.filter(o => o.status === 'needs_approval').map(order => (
          <ApprovalCard key={order.id} order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} />
        ))}
"""

content = content.replace("{/* Tables Display Section */}\n      <div className=\"px-5 md:px-8 pb-12 space-y-6 md:space-y-9 mt-2 md:mt-0\">", "{/* Tables Display Section */}\n      <div className=\"px-5 md:px-8 pb-12 space-y-6 md:space-y-9 mt-2 md:mt-0\">\n" + approval_cards_render)

with open('patched_page.tsx', 'w') as f:
    f.write(content)
