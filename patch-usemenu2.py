import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useMenu.ts"
with open(filepath, "r") as f:
    content = f.read()

# Add the interfaces if not exists
interfaces = """export interface IngredientCost {
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  lineCost: number;
}

export interface CostingData {
  ingredients: IngredientCost[];
  totalCost: number;
  margin: number;
  marginPct: number;
}

export interface MenuItem {"""

if "export interface CostingData" not in content:
    content = content.replace("export interface MenuItem {", interfaces)

if "costing?: CostingData;" not in content:
    content = content.replace("  isRetail?: boolean;", "  isRetail?: boolean;\n  costing?: CostingData;\n  prepTime?: number;\n  menuVersion?: 'current' | 'new-launch';")

with open(filepath, "w") as f:
    f.write(content)
