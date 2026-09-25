import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# For Desktop Controls
desktop_btn_pattern = r'(<button onClick=\{\(\) => setIsAddTableOpen\(true\)\} className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition" type="button">)'
content = re.sub(desktop_btn_pattern, r'<DownloadAllQRsButton tables={tables} />\n            \1', content)

# For Mobile Controls
mobile_btn_pattern = r'(<button onClick=\{\(\) => setIsQuickSaleOpen\(true\)\} className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-2 rounded-xl text-xs shadow-sm mx-1" type="button">)'
content = re.sub(mobile_btn_pattern, r'<DownloadAllQRsButton tables={tables} />\n            \1', content)

with open(filepath, "w") as f:
    f.write(content)
