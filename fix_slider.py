import re

with open('src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# 1. Add import for SwipeToConfirm
content = content.replace(
    "import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';",
    "import { QuickSaleModal } from '@/components/dashboard/QuickSaleModal';\nimport { SwipeToConfirm } from '@/components/ui/SwipeToConfirm';"
)

# 2. Replace the Place Order button
old_button = """                    {currentDraftItems.length > 0 && (
                      <button 
                        onClick={handleSendToKitchen}
                        disabled={isSubmitting}
                        className="w-full py-4 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-[15px] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        {isSubmitting ? 'Sending...' : 'Place Order'}
                      </button>
                    )}"""

new_button = """                    {currentDraftItems.length > 0 && (
                      <div className="w-full">
                        <div className="md:hidden">
                          <SwipeToConfirm 
                            onConfirm={handleSendToKitchen}
                            isLoading={isSubmitting}
                            text="Slide to Place Order"
                          />
                        </div>
                        <div className="hidden md:block">
                          <button 
                            onClick={handleSendToKitchen}
                            disabled={isSubmitting}
                            className="w-full py-4 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-[15px] transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            {isSubmitting ? 'Sending...' : 'Place Order'}
                          </button>
                        </div>
                      </div>
                    )}"""

content = content.replace(old_button, new_button)

with open('src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)
