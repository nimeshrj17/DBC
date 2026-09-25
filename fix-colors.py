import os
import glob

replacements = [
    # 1. Backgrounds + Text Color Adjustments for Contrast
    ("bg-[#D9F927] text-slate-900", "bg-[#10B981] text-white"),
    ("bg-[#D9F927] text-slate-950", "bg-[#10B981] text-white"),
    ("bg-[#D9F927] text-neutral-900", "bg-[#10B981] text-white"),
    ("text-slate-900 bg-[#D9F927]", "text-white bg-[#10B981]"),
    ("text-slate-950 bg-[#D9F927]", "text-white bg-[#10B981]"),
    ("text-neutral-900 bg-[#D9F927]", "text-white bg-[#10B981]"),
    
    # 2. Hovers
    ("hover:bg-[#c9e81f]", "hover:bg-[#059669]"),
    ("hover:bg-[#c9e815]", "hover:bg-[#059669]"),
    
    # 3. Direct Hex Replacements (for borders, rings, raw hex uses)
    ("#D9F927", "#10B981"),
    ("#CCFF00", "#10B981"),
    
    # 4. Any leftover bad text contrast on the new green (just in case)
    ("text-slate-900 bg-[#10B981]", "text-white bg-[#10B981]"),
    ("bg-[#10B981] text-slate-900", "bg-[#10B981] text-white")
]

files = glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.css", recursive=True)

for filepath in files:
    with open(filepath, "r") as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, "w") as f:
            f.write(new_content)
            print(f"Updated {filepath}")
