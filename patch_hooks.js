const fs = require('fs');
let code = fs.readFileSync('src/app/order/[tableId]/page.tsx', 'utf8');

// 1. Remove it from its current position
const hookTarget = `  const [isRequestingReset, setIsRequestingReset] = useState(false);\n`;
code = code.replace(hookTarget, '');

// 2. Insert it near the top
const insertTarget = `  const { settings } = useSettings();\n`;
const insertReplacement = `  const { settings } = useSettings();\n  const [isRequestingReset, setIsRequestingReset] = useState(false);\n`;

code = code.replace(insertTarget, insertReplacement);

fs.writeFileSync('src/app/order/[tableId]/page.tsx', code);
