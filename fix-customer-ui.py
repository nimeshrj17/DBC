import re

filepath = "/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/order/[tableId]/page.tsx"
with open(filepath, "r") as f:
    content = f.read()

# 1. Add useSettings import
if "useSettings" not in content:
    content = content.replace("import { useCustomers } from '@/lib/hooks/useCustomers';", "import { useCustomers } from '@/lib/hooks/useCustomers';\nimport { useSettings } from '@/lib/hooks/useSettings';")

# 2. Add settings hook inside the component
if "const { settings } = useSettings();" not in content:
    content = content.replace("const { createOrUpdateCustomer } = useCustomers();", "const { createOrUpdateCustomer } = useCustomers();\n  const { settings } = useSettings();")

# 3. Update upiLink logic
old_upi_link = "const upiLink = `upi://pay?pa=rakhabhai@icici&pn=Rakha%20Bhai%20Ki%20Chai&am=${grandTotal.toFixed(2)}&cu=INR`;"
new_upi_link = """const targetUpiId = settings?.upiId || 'rakhabhai@icici';
  const targetUpiName = encodeURIComponent(settings?.storeName || 'Rakha Bhai Ki Chai');
  const upiLink = `upi://pay?pa=${targetUpiId}&pn=${targetUpiName}&am=${grandTotal.toFixed(2)}&cu=INR`;"""
content = content.replace(old_upi_link, new_upi_link)

# 4. Replace hardcoded rakhabhai@icici in texts
content = content.replace("rakhabhai@icici", "{targetUpiId}")
# Wait, some places might be inside template literals, e.g. `gpay://upi/pay?pa=rakhabhai@icici...`
# Wait, if I replace `rakhabhai@icici` with `{targetUpiId}`:
# `gpay://upi/pay?pa=rakhabhai@icici&pn=...` -> `gpay://upi/pay?pa={targetUpiId}&pn=...` (Wait, this requires `${targetUpiId}` instead of `{targetUpiId}` in string literals!)
# Let's use regex for specific links:
content = content.replace("gpay://upi/pay?pa={targetUpiId}", "gpay://upi/pay?pa=${targetUpiId}")
content = content.replace("phonepe://pay?pa={targetUpiId}", "phonepe://pay?pa=${targetUpiId}")
content = content.replace("paytmmp://pay?pa={targetUpiId}", "paytmmp://pay?pa=${targetUpiId}")
# Fix the store name in those links as well
content = content.replace("&pn=Rakha%20Bhai%20Ki%20Chai", "&pn=${targetUpiName}")

# In the text display: <span className="font-mono text-stone-600 font-medium">{targetUpiId}</span>
# This is correct JSX syntax!

# 5. Remove "Pay Bill" buttons for now
# There are two buttons.
# First one in the view active orders section (around line 606):
# <button onClick={() => setIsPaymentModalOpen(true)} className="w-full py-3 px-4 rounded-xl border-2 border-[#5a3829]/30 text-[#5a3829] hover:bg-stone-50 font-bold text-sm tracking-wide active:scale-[0.98] transition-all flex items-center justify-center space-x-2">
#   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
#     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
#   </svg>
#   <span>Pay Bill • ₹{grandTotal.toFixed(2)}</span>
# </button>

# Second one in the sticky footer (around line 816):
# {!isAwaitingConfirmation && (
#   <button onClick={() => setIsPaymentModalOpen(true)} className="w-full mt-1 bg-[#26150e] hover:bg-[#382117] active:scale-[0.99] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition">
#     <span>Pay Bill • ₹{grandTotal.toFixed(2)}</span>
#   </button>
# )}

# I will replace these with empty fragments or just comment them out.
btn_1_pattern = r'<button onClick=\{\(\) => setIsPaymentModalOpen\(true\)\} className="w-full py-3 px-4 rounded-xl border-2 border-\[\#5a3829\]/30 text-\[\#5a3829\].*?>.*?<span>Pay Bill • ₹\{grandTotal\.toFixed\(2\)\}</span>\s*</button>'
content = re.sub(btn_1_pattern, '{/* Pay Bill Button Temporarily Removed */}', content, flags=re.DOTALL)

btn_2_pattern = r'\{!isAwaitingConfirmation && \(\s*<button onClick=\{\(\) => setIsPaymentModalOpen\(true\)\} className="w-full mt-1 bg-\[\#26150e\].*?>\s*<span>Pay Bill • ₹\{grandTotal\.toFixed\(2\)\}</span>\s*</button>\s*\)\}'
content = re.sub(btn_2_pattern, '{/* Pay Bill Button Temporarily Removed */}', content, flags=re.DOTALL)

with open(filepath, "w") as f:
    f.write(content)
