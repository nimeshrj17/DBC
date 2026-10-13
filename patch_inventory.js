const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/inventory/page.tsx', 'utf8');

code = code
  .replace(
    `<option value="soft_drinks">Cold Drinks / Beverages</option>
                      <option value="lighters">Lighters / Matches</option>`,
    `<option value="soft_drinks">Cold Drinks / Soft Drinks</option>
                      <option value="water_bottles">Water Bottles</option>
                      <option value="chips_snacks">Chips &amp; Snacks</option>
                      <option value="lighters">Lighters / Matches</option>`
  )
  // Also update the TypeScript type to include new categories
  .replace(
    `retailCategory: 'cigarettes' as 'cigarettes' | 'biscuits' | 'soft_drinks' | 'lighters' | 'toffees' | 'other'`,
    `retailCategory: 'cigarettes' as 'cigarettes' | 'biscuits' | 'soft_drinks' | 'water_bottles' | 'chips_snacks' | 'lighters' | 'toffees' | 'other'`
  );

fs.writeFileSync('src/app/dashboard/inventory/page.tsx', code);
console.log('Done');
