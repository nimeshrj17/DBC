import os
import re

MAPPING = {
    "Trash": "la-trash",
    "Trash2": "la-trash-alt",
    "ChevronRight": "la-angle-right",
    "ChevronLeft": "la-angle-left",
    "ChevronDown": "la-angle-down",
    "ChevronUp": "la-angle-up",
    "Search": "la-search",
    "Plus": "la-plus",
    "PlusCircle": "la-plus-circle",
    "Menu": "la-bars",
    "X": "la-times",
    "XCircle": "la-times-circle",
    "ShoppingCart": "la-shopping-cart",
    "Coffee": "la-coffee",
    "User": "la-user",
    "Users": "la-users",
    "Settings": "la-cog",
    "LogOut": "la-sign-out-alt",
    "ArrowRight": "la-arrow-right",
    "ArrowLeft": "la-arrow-left",
    "Edit": "la-edit",
    "Edit2": "la-edit",
    "Edit3": "la-edit",
    "Save": "la-save",
    "Check": "la-check",
    "CheckCircle": "la-check-circle",
    "CheckCircle2": "la-check-circle",
    "AlertCircle": "la-exclamation-circle",
    "AlertTriangle": "la-exclamation-triangle",
    "Clock": "la-clock",
    "Calendar": "la-calendar",
    "BarChart": "la-chart-bar",
    "BarChart2": "la-chart-bar",
    "BarChart3": "la-chart-bar",
    "TrendingUp": "la-chart-line",
    "TrendingDown": "la-chart-line",
    "DollarSign": "la-rupee-sign", # Localizing to INR if possible, else la-money-bill
    "FileText": "la-file-alt",
    "Printer": "la-print",
    "Download": "la-download",
    "Eye": "la-eye",
    "EyeOff": "la-eye-slash",
    "Package": "la-box",
    "Truck": "la-truck",
    "CreditCard": "la-credit-card",
    "MoreHorizontal": "la-ellipsis-h",
    "MoreVertical": "la-ellipsis-v",
    "Activity": "la-chart-line",
    "RefreshCcw": "la-sync",
    "RefreshCw": "la-sync",
    "MapPin": "la-map-marker",
    "Phone": "la-phone",
    "Mail": "la-envelope",
    "Home": "la-home",
    "LayoutDashboard": "la-tachometer-alt",
    "ClipboardList": "la-clipboard-list",
    "ListChecks": "la-tasks",
    "ChefHat": "la-utensils",
    "Flame": "la-fire",
    "Store": "la-store",
    "Image": "la-image",
    "Filter": "la-filter",
    "Bell": "la-bell",
    "BookOpen": "la-book-open",
    "Scale": "la-balance-scale",
    "Tags": "la-tags",
    "Tag": "la-tag",
    "Calculator": "la-calculator",
    "Shield": "la-shield-alt",
    "ShieldAlert": "la-shield-alt",
    "ShieldCheck": "la-shield-alt",
    "Unlock": "la-unlock",
    "Lock": "la-lock",
    "HelpCircle": "la-question-circle",
    "Info": "la-info-circle",
    "Play": "la-play",
    "Pause": "la-pause",
    "StopCircle": "la-stop-circle",
    "Upload": "la-upload",
    "Link": "la-link",
    "ExternalLink": "la-external-link-alt",
    "Copy": "la-copy",
    "Layers": "la-layer-group",
    "Grid": "la-th",
    "PieChart": "la-chart-pie",
    "History": "la-history",
    "MessageSquare": "la-comment",
    "PenTool": "la-pen-nib",
    "Maximize2": "la-expand",
    "Minimize2": "la-compress",
    "ArrowUpRight": "la-arrow-up",
    "ArrowDownRight": "la-arrow-down",
    "QrCode": "la-qrcode",
    "File": "la-file",
    "Pointer": "la-mouse-pointer",
    "Move": "la-arrows-alt",
    "Zap": "la-bolt",
    "Monitor": "la-desktop",
    "Smartphone": "la-mobile",
    "FileSpreadsheet": "la-file-excel",
    "Minus": "la-minus"
}

def convert_icon_name(lucide_name):
    if lucide_name in MAPPING:
        return MAPPING[lucide_name]
    # Fallback to kebab case
    return "la-" + re.sub(r'(?<!^)(?=[A-Z])', '-', lucide_name).lower()

files = [
    "src/app/dashboard/attendance/page.tsx",
    "src/app/dashboard/customers/page.tsx",
    "src/app/dashboard/settings/page.tsx",
    "src/app/dashboard/owner/menu-engineering/page.tsx",
    "src/app/dashboard/owner/inventory/page.tsx",
    "src/app/dashboard/owner/staff/page.tsx",
    "src/app/dashboard/owner/sops/page.tsx",
    "src/app/dashboard/owner/page.tsx",
    "src/app/dashboard/owner/reports/page.tsx",
    "src/app/dashboard/checklists/page.tsx",
    "src/app/dashboard/inventory/page.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/dashboard/menu/page.tsx",
    "src/app/dashboard/kiosk/page.tsx",
    "src/app/dashboard/staff/page.tsx",
    "src/app/dashboard/orders/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/analytics/page.tsx",
    "src/components/dashboard/QuickSaleModal.tsx",
    "src/components/dashboard/DownloadAllQRsButton.tsx",
    "src/components/dashboard/GlobalPaymentAlert.tsx",
    "src/components/dashboard/FloorMap.tsx",
    "src/components/dashboard/QRCodeGenerator.tsx",
    "src/components/dashboard/MenuPickerModal.tsx",
    "src/components/dashboard/PaymentModal.tsx"
]

import os

for filepath in files:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the import { ... } from 'lucide-react'
    import_match = re.search(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];?", content)
    if not import_match:
        continue

    # Remove the import line
    content = content[:import_match.start()] + content[import_match.end():]

    # Extract components
    components = [c.strip() for c in import_match.group(1).split(',')]
    components = [c for c in components if c]

    # Replace each component in the file
    for comp in components:
        la_class = convert_icon_name(comp)
        
        # Regex to match <IconName ... /> or <IconName>...</IconName>
        # Need to handle className injection
        # Standard: <Trash2 className="w-4 h-4 text-red-500" />
        # Becomes: <i className="las la-trash-alt text-red-500" style={{ fontSize: '1.2em' }}></i>
        # Lucide 'w-4 h-4' sizing doesn't perfectly translate to font-icons without size classes, 
        # so we merge existing className with las la-xxx and keep w-x h-x (which might behave slightly differently but usually ok for flex/inline-flex items).
        # Better: keep existing classes and just add `las la-...`.
        
        def replacer(match):
            attrs = match.group(1) or ""
            # If it has a className, inject our classes
            if 'className=' in attrs:
                # Need to handle quotes carefully
                # Find className="something" or className={'something'}
                # Simple replacement for string classNames:
                attrs = re.sub(r'className=["\'](.*?)["\']', r'className="\1 las ' + la_class + '"', attrs)
                # For template literals / expressions, it's harder, but usually it's simple strings for icons.
                if 'className={`' in attrs:
                    attrs = attrs.replace('className={`', f'className={{`las {la_class} ')
                elif 'className={' in attrs and '`' not in attrs:
                    # e.g. className={dynamicClass}
                    attrs = attrs.replace('className={', f'className={{`las {la_class} ` + ')
            else:
                attrs += f' className="las {la_class}"'
                
            return f'<i{attrs}></i>'

        # Self-closing tag
        content = re.sub(fr'<{comp}(.*?)\s*/>', replacer, content)
        # Opening tag with children (less common for icons)
        content = re.sub(fr'<{comp}(.*?)>(.*?)</{comp}>', lambda m: f'<i{m.group(1)}>{m.group(2)}</i>', content)

    with open(filepath, 'w') as f:
        f.write(content)

