const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Update ApprovalCard definition
code = code.replace(
  'const ApprovalCard = ({ order, onAccept, onReject }: any) => {',
  'const ApprovalCard = ({ order, onAccept, onReject, tableName }: any) => {'
);

// 2. Update Table name display inside ApprovalCard
code = code.replace(
  '<h4 className="font-bold text-lg text-slate-900">Table {order.tableNumber} - Order Needs Approval</h4>',
  '<h4 className="font-bold text-lg text-slate-900">{tableName || `Table ${order.tableNumber}`} - Order Needs Approval</h4>'
);

// 3. Update ApprovalCard rendering to pass tableName
code = code.replace(
  '<ApprovalCard key={order.id} order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} />',
  '<ApprovalCard key={order.id} order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} tableName={tables.find(t => t.id === order.tableId)?.name} />'
);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
