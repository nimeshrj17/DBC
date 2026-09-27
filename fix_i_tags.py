import re
import os

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove strokeWidth={...} from <i ...> tags
    content = re.sub(r'(<i[^>]*?)\s*strokeWidth=\{[^\}]+\}([^>]*?>)', r'\1\2', content)
    # Remove size={...} from <i ...> tags
    content = re.sub(r'(<i[^>]*?)\s*size=\{[^\}]+\}([^>]*?>)', r'\1\2', content)
    # Remove color={...} from <i ...> tags (if any)
    content = re.sub(r'(<i[^>]*?)\s*color=\{[^\}]+\}([^>]*?>)', r'\1\2', content)

    # In orders/page.tsx, fix the dynamic Icon assignment
    if "orders/page.tsx" in filepath:
        content = content.replace("let Icon = Clock;", "let Icon = 'la-clock';")
        content = content.replace("Icon = Clock;", "Icon = 'la-clock';")
        content = content.replace("Icon = ChefHat;", "Icon = 'la-utensils';")
        content = content.replace("Icon = CheckCircle2;", "Icon = 'la-check-circle';")
        content = content.replace("Icon = Check;", "Icon = 'la-check';")
        content = content.replace("Icon = Banknote;", "Icon = 'la-money-bill';")
        
        # Replace <Icon className="..." /> with <i className={`las ${Icon} ...`} />
        # It's at lines 282-something
        content = re.sub(r'<Icon className=(["\'])(.*?)\1(.*?)/>', r'<i className={`las ${Icon} \2`}\3></i>', content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

