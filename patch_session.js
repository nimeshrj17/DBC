const fs = require('fs');
const file = 'src/app/api/tables/[id]/session/route.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `    let pin = null;
    let orders: any[] = [];
    
    if (session) {`;

const replacement = `    let pin = null;
    let orders: any[] = [];
    
    if (session) {
      if (status === 'empty') {
        const response = NextResponse.json({ 
          status, 
          number,
          authenticated: false,
          role: null,
          pin: null,
          orders: []
        });
        response.cookies.delete(\`__Host-tbl_\${tableId}\`);
        return response;
      }`;

code = code.replace(target, replacement);
fs.writeFileSync(file, code);
