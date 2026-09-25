import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/lib/hooks/useAnalytics.ts"
with open(filepath, "r") as f:
    content = f.read()

bad_export = """      menu: {
        topByQty: topItemsByQty,
        topByRevenue: topItemsByRevenue,
        categoryBreakdown: categoryData,
        attachRate
      },"""

good_export = """      menu: {
        topByQty: topItemsByQty,
        topByRevenue: topItemsByRevenue,
        categoryBreakdown: categoryData,
        attachRate,
        allItemPerformance: itemPerformance
      },"""

content = content.replace(bad_export, good_export)

with open(filepath, "w") as f:
    f.write(content)
