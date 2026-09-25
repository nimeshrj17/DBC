import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Wrap the sections in a CSS columns block
old_mapping_start = """        {Array.from(new Set(tables.filter(t => t.status === 'empty' && (activeZone === 'All' || activeZone === 'Active' || (t.section || 'Main Hall') === activeZone)).map(t => String(t.section || 'Main Hall')))).map(section => (
          <section key={section}>
            <div className="flex items-center justify-between mb-3 md:mb-4 mt-6 md:mt-8">"""

new_mapping_start = """        <div className="columns-1 xl:columns-2 gap-x-6 gap-y-0">
          {Array.from(new Set(tables.filter(t => t.status === 'empty' && (activeZone === 'All' || activeZone === 'Active' || (t.section || 'Main Hall') === activeZone)).map(t => String(t.section || 'Main Hall')))).map(section => (
            <section key={section} className="break-inside-avoid mb-8">
              <div className="flex items-center justify-between mb-3 md:mb-4 mt-4">"""
content = content.replace(old_mapping_start, new_mapping_start)

# 2. Close the columns wrapper
old_mapping_end = """              </div>
            </div>
          </section>
        ))}
        {tables.length === 0 && ("""

new_mapping_end = """              </div>
            </div>
          </section>
        ))}
        </div>
        {tables.length === 0 && ("""
content = content.replace(old_mapping_end, new_mapping_end)

# 3. Fix inner grids. Use double quotes around a string that contains a string.
old_inner_grid = '"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 md:gap-5"'

parts = content.split(old_inner_grid)
if len(parts) == 3:
    active_tables_grid = '"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3.5 md:gap-5"'
    inner_tables_grid = '"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5 md:gap-5"'
    content = parts[0] + active_tables_grid + parts[1] + inner_tables_grid + parts[2]
else:
    print(f"Error: Found {len(parts)-1} instances.")

with open(filepath, "w") as f:
    f.write(content)
