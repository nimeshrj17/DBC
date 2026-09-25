import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useMenu.ts"
with open(filepath, "r") as f:
    content = f.read()

old_interface = """export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  archived?: boolean;
  isRetail?: boolean; // Flag to bypass kitchen routing
  linkedInventoryId?: string; // Legacy: used for 1-to-1 retail linkage
}"""

new_interface = """export interface IngredientCost {
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

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
  archived?: boolean;
  isRetail?: boolean;
  linkedInventoryId?: string;
  costing?: CostingData;
  prepTime?: number;
  menuVersion?: 'current' | 'new-launch';
}"""

content = content.replace(old_interface, new_interface)

with open(filepath, "w") as f:
    f.write(content)
