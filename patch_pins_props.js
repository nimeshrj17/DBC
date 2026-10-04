const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

// 1. Add tablePins to NewTableCard props
const cardTarget = `const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign, onMarkServed }: any) => {`;
const cardReplacement = `const NewTableCard = ({ table, orders, setSelectedTableId, onClearTable, setIsAddTableOpen, onQuickAssign, onMarkServed, tablePins = {} }: any) => {`;

code = code.replace(cardTarget, cardReplacement);

// 2. Pass tablePins when rendering NewTableCard
code = code.replaceAll(
  '<NewTableCard ',
  '<NewTableCard tablePins={tablePins} '
);

fs.writeFileSync('src/app/dashboard/page.tsx', code);
