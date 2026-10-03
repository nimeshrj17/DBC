const fs = require('fs');
let code = fs.readFileSync('src/app/api/tables/[id]/session/route.ts', 'utf8');

if (!code.includes('force-dynamic')) {
  code = "export const dynamic = 'force-dynamic';\n" + code;
  fs.writeFileSync('src/app/api/tables/[id]/session/route.ts', code);
}
