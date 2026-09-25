import re

def process_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Remove the pushToPaytmBox function definition
    pattern = r"  const pushToPaytmBox = async \([^)]*\) => \{.*?(?:^\s{2}\};\n)"
    content = re.sub(pattern, "", content, flags=re.DOTALL | re.MULTILINE)

    # Remove the Push Paytm button
    button_pattern = r'<button[^>]*onClick=\{\(\) => pushToPaytmBox\([^)]*\)\}[^>]*>.*?</button>'
    content = re.sub(button_pattern, "", content, flags=re.DOTALL)

    with open(filepath, "w") as f:
        f.write(content)

process_file("/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/orders/page.tsx")
process_file("/Users/nimeshranjan/DBC/dream-bean-cafe/src/app/dashboard/takeaway/page.tsx")

