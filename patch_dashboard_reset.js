const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

const resetRequestCard = `
const ResetRequestCard = ({ table, onClear }: any) => {
  return (
    <div className="p-4 mb-4 rounded-xl shadow-lg border-2 bg-rose-50 border-rose-400 animate-pulse flex items-center justify-between">
      <div>
        <h4 className="font-bold text-lg text-rose-900">{table.name || \`Table \${table.number}\`} - Reset Requested!</h4>
        <p className="text-sm font-medium text-rose-700">
          A new customer has scanned the QR code but the table is still locked.
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onClear(table.id, true)} className="px-5 py-2.5 bg-rose-600 text-white font-black border border-rose-700 rounded-lg shadow-sm hover:bg-rose-700 active:scale-95 transition-all">
          Clear Table
        </button>
      </div>
    </div>
  );
};
`;

code = code.replace('export default function DashboardPage() {', resetRequestCard + '\nexport default function DashboardPage() {');

// 2. Render it below ApprovalCard
const renderTarget = `        {orders.filter(o => (o.status as string) === 'needs_approval').map(order => (
          <ApprovalCard key={order.id} order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} tableName={tables.find(t => t.id === order.tableId)?.name} />
        ))}`;
        
const renderReplacement = `        {orders.filter(o => (o.status as string) === 'needs_approval').map(order => (
          <ApprovalCard key={order.id} order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} tableName={tables.find(t => t.id === order.tableId)?.name} />
        ))}
        {tables.filter(t => t.resetRequested).map(table => (
          <ResetRequestCard 
            key={table.id} 
            table={table} 
            onClear={(id: string, hasUnpaid: boolean) => setClearTablePrompt({tableId: id, hasUnpaid})} 
          />
        ))}`;

code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
