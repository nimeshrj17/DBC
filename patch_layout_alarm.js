const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/layout.tsx', 'utf8');

const regex = /const playAlarm = \(\) => \{[\s\S]*?\}\n\n/;
code = code.replace(regex, '');

fs.writeFileSync('src/app/dashboard/layout.tsx', code);
