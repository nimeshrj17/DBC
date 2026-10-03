const fs = require('fs');
let code = fs.readFileSync('src/lib/hooks/useTables.ts', 'utf8');

code = code.replace(
  '        updates.customerPhone = null;',
  '        updates.customerPhone = null;\n        updates.resetRequested = false;'
);

fs.writeFileSync('src/lib/hooks/useTables.ts', code);
