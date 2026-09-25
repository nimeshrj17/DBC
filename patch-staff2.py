import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useStaff.ts"
with open(filepath, "r") as f:
    content = f.read()

# Replace the interface
if "shiftStart?: string;" not in content:
    content = content.replace("  createdAt?: any;\n}", "  createdAt?: any;\n  shiftStart?: string;\n  shiftEnd?: string;\n  salary?: number;\n}")

if "export interface AttendanceLog" not in content:
    content = content.replace("export function useStaff() {", """export interface AttendanceLog {
  id?: string;
  date: string;
  staffId: string;
  staffName: string;
  arrivalTime: string;
  status: 'on-time' | 'late' | 'absent';
}

export function useStaff() {""")

with open(filepath, "w") as f:
    f.write(content)
