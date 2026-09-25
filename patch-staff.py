import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useStaff.ts"
with open(filepath, "r") as f:
    content = f.read()

old_interface = """export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen';
  isActive: boolean;
  canViewRevenue?: boolean;
  customPermissions?: Record<string, boolean>;
}"""

new_interface = """export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen';
  isActive: boolean;
  canViewRevenue?: boolean;
  customPermissions?: Record<string, boolean>;
  shiftStart?: string;
  shiftEnd?: string;
  salary?: number;
}

export interface AttendanceLog {
  id?: string;
  date: string;
  staffId: string;
  staffName: string;
  arrivalTime: string;
  status: 'on-time' | 'late' | 'absent';
}"""

content = content.replace(old_interface, new_interface)

with open(filepath, "w") as f:
    f.write(content)
