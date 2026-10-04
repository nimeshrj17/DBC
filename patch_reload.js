const fs = require('fs');
let code = fs.readFileSync('src/app/order/[tableId]/page.tsx', 'utf8');

const target = `      if (res.ok) {
        toast.success('Joined table successfully');
        window.location.reload();
      }`;

const replacement = `      if (res.ok) {
        toast.success('Joined table successfully');
        try {
          const sessionRes = await fetch(\`/api/tables/\${tableId}/session?_t=\${Date.now()}\`, { cache: "no-store" });
          const data = await sessionRes.json();
          setSessionData(data);
        } catch (e) {
          window.location.reload(); // fallback
        }
      }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/app/order/[tableId]/page.tsx', code);
