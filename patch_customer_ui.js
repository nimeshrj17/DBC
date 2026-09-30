const fs = require('fs');
const file = 'src/app/order/[tableId]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Delete the sessionDenied block (it's unused and obsolete)
code = code.replace(/if \(sessionDenied\) return \([\s\S]*?\n  \);\n/, '');

// 2. Change the PIN block condition
const oldPinCondition = "if (sessionData?.status === 'active' && !sessionData?.authenticated) {";
const newPinCondition = "if (sessionData && ['occupied', 'served', 'billed'].includes(sessionData.status) && !sessionData.authenticated) {";
code = code.replace(oldPinCondition, newPinCondition);

// 3. Replace the legacy "Yes, this is my order" block with the "Table Occupied - Please wait" screen
const legacyBlockRegex = /\/\/ Show order confirmation screen if table is active and this device doesn't own the session\n  if \(table\?\.status !== 'empty' && !sessionConfirmed && sessionData\?\.role !== 'owner' && sessionData\?\.role !== 'joined'\) \{[\s\S]*?No, this isn't mine\n            <\/button>\n          <\/div>\n        <\/div>\n      <\/div>\n    \);\n  \}/;

const newOccupiedWaitScreen = `// Show "Please wait" if table is in needs_approval and they are not authenticated
  if (table?.status === 'needs_approval' && !sessionData?.authenticated && !isSubmittingRef.current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAFA] text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-[#A04010] mb-2">Table Occupied</h1>
        <p className="text-gray-600 font-medium">This table is currently being served.<br/>Please ask the staff for the PIN if you are joining this table.</p>
      </div>
    );
  }`;

code = code.replace(legacyBlockRegex, newOccupiedWaitScreen);

fs.writeFileSync(file, code);
