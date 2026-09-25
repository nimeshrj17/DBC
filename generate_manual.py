import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm, inch
from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph, PageBreak, BaseDocTemplate, PageTemplate, Frame, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

output_path = "/Users/nimeshranjan/DBC/dream-bean-cafe/Rakha_Bhai_Cafe_Operations_Manual_Revised.pdf"
font_path = "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc"

try:
    pdfmetrics.registerFont(TTFont('Hindi', font_path, subfontIndex=0))
except Exception as e:
    print(f"Error registering font: {e}")

try:
    pdfmetrics.registerFont(TTFont('Hindi-Bold', font_path, subfontIndex=1))
except Exception:
    pdfmetrics.registerFont(TTFont('Hindi-Bold', font_path, subfontIndex=0))

# Colors
brown = colors.HexColor("#4A2C2A")
light_brown = colors.HexColor("#F5EBE6")
off_white = colors.HexColor("#FAFAFA")
dark_grey = colors.HexColor("#333333")

styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    name='TitleStyle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=26,
    alignment=TA_CENTER,
    textColor=brown,
    spaceAfter=20
)

style_subtitle = ParagraphStyle(
    name='SubtitleStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=dark_grey,
    spaceAfter=10
)

style_hindi_subtitle = ParagraphStyle(
    name='HindiSubtitleStyle',
    parent=styles['Normal'],
    fontName='Hindi',
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=dark_grey,
    spaceAfter=20
)

style_heading = ParagraphStyle(
    name='HeadingStyle',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=16,
    leading=20,
    textColor=brown,
    spaceAfter=12,
    spaceBefore=12
)

style_body = ParagraphStyle(
    name='BodyStyle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=colors.black,
    spaceAfter=6
)

style_body_hindi = ParagraphStyle(
    name='BodyHindiStyle',
    parent=styles['Normal'],
    fontName='Hindi',
    fontSize=10,
    leading=14,
    textColor=colors.black,
    spaceAfter=6
)

style_table_header = ParagraphStyle(
    name='TableHeaderStyle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=10,
    alignment=TA_CENTER,
    textColor=colors.white
)

style_table_cell = ParagraphStyle(
    name='TableCellStyle',
    parent=styles['Normal'],
    fontName='Hindi',
    fontSize=9,
    leading=11,
    alignment=TA_LEFT,
    textColor=colors.black
)

style_table_cell_center = ParagraphStyle(
    name='TableCellCenter',
    parent=style_table_cell,
    alignment=TA_CENTER
)

page_width, page_height = A4
margin = 40

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(dark_grey)
    canvas.drawString(margin, margin/2, "Rakha Bhai Cafe — Operations Manual")
    canvas.drawRightString(page_width - margin, margin/2, f"Page {doc.page}")
    canvas.restoreState()

doc = BaseDocTemplate(output_path, pagesize=A4, rightMargin=margin, leftMargin=margin, topMargin=margin, bottomMargin=margin)
frame = Frame(margin, margin, page_width - 2*margin, page_height - 2*margin, id='normal')
template = PageTemplate(id='test', frames=frame, onPage=add_page_number)
doc.addPageTemplates([template])

elements = []

# --- PAGE 1: Cover Page ---
elements.append(Spacer(1, 100))
elements.append(Paragraph("RAKHA BHAI CAFE", style_title))
elements.append(Paragraph("राखा भाई की चाय & Cafe", ParagraphStyle(name='TitleHindi', parent=style_title, fontName='Hindi-Bold')))
elements.append(Spacer(1, 40))
elements.append(Paragraph("OPERATIONS MANUAL & DAILY FORMS", style_subtitle))
elements.append(Paragraph("मालिक · शेफ · स्टाफ · एसओपी · राजस्व · इन्वेंटरी · KPI · ग्राहक फीडबैक", style_hindi_subtitle))
elements.append(PageBreak())

# --- PAGE 2: Table of Contents ---
elements.append(Paragraph("Table of Contents / विषय सूची", style_heading))
toc_items = [
    ("Owner Daily Checklist", 3),
    ("Chef Daily Checklist", 4),
    ("Staff Guidelines", 5),
    ("Chef Guidelines", 6),
    ("Owner Guidelines", 7),
    ("Inventory Sheet - Daily", 8),
    ("Wastage Record Sheet", 9),
    ("Daily Revenue Report", 10),
    ("Weekly Revenue Report", 11),
    ("Monthly Revenue Report", 12),
    ("Staff Mistakes / Incident Log", 13),
    ("Customer Feedback Log", 14),
    ("End of Day Cafe Feedback Form", 15),
    ("Item Contribution Margin", 16),
    ("Staff Performance Sheet", 17),
    ("Monthly KPI Dashboard", 18),
    ("SOPs (Staff & Kitchen)", 19),
    ("SOPs (Owner)", 20),
    ("Staff Rules & Penalties", 21),
    ("Peak Hour Deployment Plan", 22),
    ("Floor Plan", 23),
]
for item, page in toc_items:
    p = Paragraph(f"{item} ............................................................................ Page {page}", style_body)
    elements.append(p)
elements.append(PageBreak())

# --- PAGE 3: Owner Daily Checklist ---
elements.append(Paragraph("Owner Daily Checklist / मालिक दैनिक चेकलिस्ट", style_heading))
owner_tasks = [
    ("11:00", "Walk-through: entrance, tables, chairs, floor, glasses clean\nप्रवेश, टेबल, कुर्सियां, फर्श, ग्लास साफ"),
    ("11:05", "Washroom checked\nवॉशरूम साफ"),
    ("11:10", "Counter, kitchen, dustbins, menu board\nकाउंटर, किचन, डस्टबिन, मेन्यू बोर्ड"),
    ("11:15", "Staff attendance verified\nस्टाफ उपस्थिति"),
    ("11:20", "Ingredient stock & quality check\nसामग्री स्टॉक व क्वालिटी जांच"),
    ("11:30", "Equipment & gas check\nउपकरण व गैस जांच"),
    ("11:35", "Billing system/KOT check\nबिलिंग व KOT जांच"),
    ("11:45", "Shift briefing\nशिफ्ट ब्रीफिंग"),
    ("15:00", "3-5 PM: Review prev day sales\nपिछले दिन की बिक्री रिव्यू"),
    ("17:45", "Peak prep verified with chef\nपीक प्रेप शेफ से वेरीफाई"),
    ("19:00", "7 PM: Floor management begins\nफ्लोर मैनेजमेंट शुरू"),
    ("00:00", "Closing: Cash/UPI/Card verified\nकैश/UPI/कार्ड वेरीफाई"),
    ("00:15", "Daily Revenue Report completed\nदैनिक राजस्व रिपोर्ट पूरी"),
    ("00:20", "Wastage recorded\nवेस्टेज रिकॉर्ड"),
    ("00:30", "Kitchen & premises locked\nकिचन व परिसर लॉक")
]
data = [["Done ☐", "Time", "Checklist Item (EN + HI)", "Initials"]]
for time, task in owner_tasks:
    data.append(["", Paragraph(time, style_table_cell_center), Paragraph(task, style_table_cell), ""])
# Fill remaining rows to stretch to full page roughly
while len(data) < 20:
    data.append(["", "", "", ""])

t = Table(data, colWidths=[50, 50, page_width - 2*margin - 160, 60], rowHeights=[25] + [35]*(len(data)-1))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0,0), (-1,0), 6),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 4: Chef Daily Checklist ---
elements.append(Paragraph("Chef Daily Checklist / शेफ दैनिक चेकलिस्ट", style_heading))
chef_tasks = [
    ("11:15", "Vegetables checked, washed, prepped, portioned / सब्जियां जांचकर तैयार"),
    ("11:20", "Paneer & cheese checked/portioned / पनीर-चीज़ जांच"),
    ("11:25", "Bread/buns/pizza bases checked / ब्रेड/बन/पिज़्ज़ा बेस"),
    ("11:30", "Momos prep started / मोमोज़ तैयारी"),
    ("11:40", "All sauces/chutneys ready / सभी सॉस/चटनी तैयार"),
    ("11:45", "Frying oil checked / तलने का तेल जांच"),
    ("11:50", "Chai/tea ingredients ready / चाय सामग्री तैयार"),
    ("11:55", "Milk quantity verified / दूध मात्रा"),
    ("12:00", "Coffee/cold beverages ready / कॉफी/ठंडे पेय"),
    ("12:05", "Ice stock checked / बर्फ स्टॉक"),
    ("12:10", "Packaging material ready / पैकेजिंग सामग्री"),
    ("12:15", "Kitchen sanitized / किचन सैनिटाइज़"),
    ("12:20", "Equipment tested (grills, fryers) / उपकरण जांच"),
    ("12:25", "Maggi/instant items stocked / मैगी/इंस्टेंट आइटम"),
    ("18:00", "6 PM peak prep complete / 6 बजे पीक प्रेप"),
    ("00:00", "Closing: all food stored correctly / बंद: खाना सही से स्टोर"),
    ("00:05", "Fryer oil condition noted / फ्रायर तेल स्थिति"),
    ("00:15", "Kitchen deep cleaned / किचन डीप क्लीन"),
    ("00:20", "Gas turned off / गैस बंद"),
    ("00:25", "Raw materials covered / कच्चा माल ढका")
]
data = [["Done ☐", "Time", "Checklist Item (EN + HI)", "Init."]]
# Using slightly smaller style for chef table to ensure fit
chef_cell_style = ParagraphStyle(name='ChefCell', parent=style_table_cell, fontSize=8, leading=10)
for time, task in chef_tasks:
    data.append(["", Paragraph(time, style_table_cell_center), Paragraph(task, chef_cell_style), ""])

t = Table(data, colWidths=[40, 40, page_width - 2*margin - 130, 50], rowHeights=[20] + [25]*len(chef_tasks))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('BOTTOMPADDING', (0,0), (-1,0), 4),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())

# --- PAGE 5: Staff Guidelines ---
elements.append(Paragraph("Staff Guidelines / स्टाफ दिशानिर्देश", style_heading))
staff_guidelines = [
    ("<b>Order/Billing Captain:</b> Greet → order → KOT → billing → upsell one item → payment confirm.<br/>ग्राहक स्वागत, ऑर्डर, बिलिंग, KOT शुद्धता, टेबल अलॉटमेंट, एक उचित अपसेल।"),
    ("<b>Floor/Service:</b> Run food, clear tables, water refill, check 'everything okay', keep station clean.<br/>खाना पहुंचाना, टेबल साफ, पानी, फीडबैक, स्टेशन साफ।"),
    ("<b>Kitchen Helper:</b> Prep, wash, portion, maintain fridge/storage, alert chef on low stock.<br/>प्रेप, धोना, पोर्शन, फ्रिज, कम स्टॉक की सूचना।"),
    ("<b>General rules for ALL staff:</b> No phone during service, no arguing, no free food, no unrecorded wastage, leave station clean.<br/>सर्विस में फोन नहीं, बहस नहीं, मुफ्त खाना नहीं, वेस्टेज रिकॉर्ड, स्टेशन साफ छोड़ें।"),
    ("<b>Attendance:</b> On time = respect. 3 late marks in 30 days = written warning.<br/>समय पर आना = सम्मान।")
]
for g in staff_guidelines:
    elements.append(Paragraph(g, style_body_hindi))
    elements.append(Spacer(1, 15))
elements.append(PageBreak())

# --- PAGE 6: Chef Guidelines ---
elements.append(Paragraph("Chef Guidelines / शेफ दिशानिर्देश", style_heading))
chef_gl = [
    ("<b>Recipe discipline:</b> Follow tested recipe cards exactly. No 'thoda sauce/paneer/cheese'.<br/>रेसिपी कार्ड के अनुसार। अपनी तरफ से मात्रा न बदलें।"),
    ("<b>KOT flow:</b> READ → ACCEPT → PREPARE → CHECK → PASS. KOT is single source of truth."),
    ("<b>Portion control:</b> Every ingredient is weighed/measured, no guessing.<br/>हर सामग्री तौलकर/नापकर।"),
    ("<b>Mise en place:</b> Complete before service, refill during lulls.<br/>सर्विस से पहले पूरा, खाली समय में भरें।"),
    ("<b>Quality gate:</b> Self-check item, quantity, presentation before pass.<br/>पास से पहले खुद जांचें।"),
    ("<b>Wastage recording:</b> Every drop, every piece logged immediately.<br/>हर बूंद, हर टुकड़ा तुरंत लिखें।"),
    ("<b>Peak hour focus:</b> 7-10 PM, zero distractions, speed + quality.<br/>7-10 बजे, शून्य ध्यान भटकाव।"),
    ("<b>Closing duties:</b> Store food correctly, deep clean, gas off, cover materials.<br/>खाना सही से रखें, सफाई, गैस बंद।")
]
for g in chef_gl:
    elements.append(Paragraph(g, style_body_hindi))
    elements.append(Spacer(1, 15))
elements.append(PageBreak())


# --- PAGE 7: Owner Guidelines ---
elements.append(Paragraph("Owner Guidelines / मालिक दिशानिर्देश", style_heading))
owner_gl = [
    ("<b>Run by numbers:</b> Revenue, profitability, menu contribution, inventory, staff, customer experience, SOP.<br/>राजस्व, लाभ, मेन्यू, इन्वेंटरी, स्टाफ, ग्राहक अनुभव, SOP।"),
    ("<b>Structure the day:</b> Opening (11-12) → Operations (12-3) → Business Numbers (3-5) → Peak Prep (5-6) → Peak (7-10) → Closing (10-12).<br/>दिन की संरचना।"),
    ("<b>Delegate, don't rescue:</b> Build systems so cafe runs without constant owner intervention.<br/>सिस्टम बनाओ, बचाव नहीं।"),
    ("<b>Weekly review:</b> Compare revenue, identify trends, plan improvements.<br/>साप्ताहिक समीक्षा।"),
    ("<b>Monthly review:</b> P&L, food cost %, staff cost %, wastage %, KPIs.<br/>मासिक समीक्षा।"),
    ("<b>Menu engineering:</b> Monitor Stars/Puzzles/Workhorses/Dogs quarterly.<br/>मेन्यू इंजीनियरिंग।"),
    ("<b>Staff development:</b> Train regularly, document mistakes, reward performance.<br/>स्टाफ विकास।"),
    ("<b>Customer focus:</b> Complaints = improvement opportunities.<br/>शिकायत = सुधार का मौका।")
]
for g in owner_gl:
    elements.append(Paragraph(g, style_body_hindi))
    elements.append(Spacer(1, 15))
elements.append(PageBreak())

# --- PAGE 8: Inventory Sheet - Daily ---
elements.append(Paragraph("Inventory Sheet - Daily / दैनिक इन्वेंटरी शीट", style_heading))
data = [["Ingredient/सामग्री", "Unit/इकाई", "Opening/ओपनिंग", "Purchased/खरीदा", "Closing/क्लोज़िंग", "Consumption/खपत", "Min PAR", "Reorder Y/N"]]
for _ in range(28):
    data.append(["", "", "", "", "", "", "", ""])
t = Table(data, colWidths=[page_width - 2*margin - 350, 40, 50, 50, 50, 60, 50, 50], rowHeights=[25] + [22]*28)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1,10))
elements.append(Paragraph("<i>Note: Consumption = Opening + Purchased − Closing. If closing ≤ Min PAR, mark Reorder = Y.</i>", style_body))
elements.append(PageBreak())


# --- PAGE 9: Wastage Record Sheet ---
elements.append(Paragraph("Wastage Record Sheet / वेस्टेज रिकॉर्ड शीट", style_heading))
data = [["Date/तारीख", "Item/Ingredient", "Qty", "Reason/कारण", "Cost ₹", "Stage/चरण", "Approved By"]]
for _ in range(28):
    data.append(["", "", "", "", "", "", ""])
t = Table(data, colWidths=[60, page_width - 2*margin - 330, 40, 100, 40, 50, 60], rowHeights=[25] + [22]*28)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1,10))
elements.append(Paragraph("<i>Reasons: spoiled/over-prepped/dropped/wrong order/expired/quality rejection.</i>", style_body))
elements.append(PageBreak())


# --- PAGE 10: Daily Revenue Report ---
elements.append(Paragraph("Daily Revenue Report / दैनिक राजस्व रिपोर्ट", style_heading))
data = [
    ["Sales & Billing / बिक्री व बिलिंग", ""],
    ["Total Sales / कुल बिक्री", ""],
    ["Number of Bills / बिलों की संख्या", ""],
    ["Average Bill / औसत बिल", ""],
    ["Cash / नकद", ""],
    ["UPI", ""],
    ["Card / कार्ड", ""],
    ["Other Payments / अन्य भुगतान", ""],
    ["Discounts/Complimentary / छूट", ""],
    ["Cancelled Bills (count + ₹) / रद्द बिल", ""],
    ["Net Revenue / शुद्ध राजस्व", ""],
    ["Expenses / खर्च", ""],
    ["Purchases / खरीद", ""],
    ["Staff wages / स्टाफ वेतन", ""],
    ["Utilities / उपयोगिता", ""],
    ["Other / अन्य", ""],
    ["Profit Summary / लाभ सारांश", ""],
    ["Gross Revenue / कुल राजस्व", ""],
    ["Total Expenses / कुल खर्च", ""],
    ["Operating Profit / ऑपरेटिंग लाभ", ""],
    ["Profit Margin % / लाभ मार्जिन %", ""]
]
t_data = []
for row in data:
    if " / " not in row[0] and row[0] not in ["UPI"]:
        # Section header
        t_data.append([Paragraph(f"<b>{row[0]}</b>", style_table_cell), ""])
    else:
        t_data.append([Paragraph(row[0], style_table_cell), ""])
        
t = Table(t_data, colWidths=[200, page_width - 2*margin - 200], rowHeights=[25]*len(t_data))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), light_brown),
    ('BACKGROUND', (0,11), (-1,11), light_brown),
    ('BACKGROUND', (0,16), (-1,16), light_brown),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1,20))
elements.append(Paragraph("<b>Key Observations / मुख्य टिप्पणियां</b>", style_body_hindi))
for _ in range(4):
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
elements.append(PageBreak())

# --- PAGE 11: Weekly Revenue Report ---
elements.append(Paragraph("Weekly Revenue Report / साप्ताहिक राजस्व रिपोर्ट", style_heading))
data = [["Day", "Sales ₹", "Bills", "Avg Bill", "Wastage ₹", "Complaints", "Key Note"]]
for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "TOTAL"]:
    data.append([day, "", "", "", "", "", ""])

t = Table(data, colWidths=[50, 60, 40, 50, 60, 60, page_width - 2*margin - 320], rowHeights=[25] + [30]*8)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('BACKGROUND', (0,-1), (-1,-1), light_brown),
    ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1,20))

elements.append(Paragraph("<b>Weekly Analysis / साप्ताहिक विश्लेषण</b>", style_body_hindi))
t2_data = [
    ["Best Day / सबसे अच्छा दिन", ""],
    ["Worst Day / सबसे खराब दिन", ""],
    ["Avg Daily Sales / औसत दैनिक बिक्री", ""],
    ["Week-over-Week change / सप्ताह दर सप्ताह परिवर्तन", ""],
    ["Top issues / मुख्य समस्याएं", ""]
]
t2 = Table(t2_data, colWidths=[200, page_width - 2*margin - 200], rowHeights=[25]*5)
t2.setStyle(TableStyle([
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t2)
elements.append(Spacer(1,20))

elements.append(Paragraph("<b>Action items for next week / अगले सप्ताह के लिए कार्य</b>", style_body_hindi))
for _ in range(4):
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
elements.append(PageBreak())


# --- PAGE 12: Monthly Revenue Report ---
elements.append(Paragraph("Monthly Revenue Report / मासिक राजस्व रिपोर्ट", style_heading))
data = [["Week", "Sales ₹", "Bills", "Avg Bill", "Wastage ₹"]]
for i in range(1, 6):
    data.append([f"Week {i}", "", "", "", ""])
data.append(["TOTAL", "", "", "", ""])

t = Table(data, colWidths=[80, 80, 60, 80, 80], rowHeights=[25] + [30]*6)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('BACKGROUND', (0,-1), (-1,-1), light_brown),
    ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1,20))

elements.append(Paragraph("<b>Monthly P&L / मासिक लाभ-हानि</b>", style_body_hindi))
pl_data = [
    ["Total Sales / कुल बिक्री", ""],
    ["COGS (Cost of Goods Sold)", ""],
    ["Gross Profit / सकल लाभ", ""],
    ["Staff Cost / स्टाफ लागत", ""],
    ["Rent / किराया", ""],
    ["Utilities / उपयोगिता", ""],
    ["Other / अन्य", ""],
    ["Net Operating Profit / शुद्ध लाभ", ""],
    ["Profit Margin % / लाभ मार्जिन %", ""]
]
t2 = Table(pl_data, colWidths=[200, page_width - 2*margin - 200], rowHeights=[25]*9)
t2.setStyle(TableStyle([
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t2)
elements.append(Spacer(1,20))

elements.append(Paragraph("<b>Key achievements / areas of concern (मुख्य उपलब्धियां / चिंता के क्षेत्र)</b>", style_body_hindi))
for _ in range(4):
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
elements.append(PageBreak())

# --- PAGE 13: Staff Mistakes / Incident Log ---
elements.append(Paragraph("Staff Mistakes / Incident Log", style_heading))
elements.append(Paragraph("स्टाफ गलतियां / घटना लॉग", style_hindi_subtitle))
data = [["Date", "Staff Name", "Role", "Mistake Description", "Action Taken", "Reviewed By"]]
for _ in range(25):
    data.append(["", "", "", "", "", ""])
t = Table(data, colWidths=[60, 80, 60, page_width - 2*margin - 330, 70, 60], rowHeights=[25] + [24]*25)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())

# --- PAGE 14: Customer Feedback Log ---
elements.append(Paragraph("Customer Feedback Log", style_heading))
elements.append(Paragraph("ग्राहक फीडबैक लॉग", style_hindi_subtitle))
data = [["Date", "Customer Name", "Type (C/C)", "Details", "Action Taken", "Resolved By"]]
for _ in range(25):
    data.append(["", "", "", "", "", ""])
t = Table(data, colWidths=[60, 80, 60, page_width - 2*margin - 330, 70, 60], rowHeights=[25] + [24]*25)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 15: End of Day Cafe Feedback Form ---
elements.append(Paragraph("End of Day Cafe Feedback Form", style_heading))
def add_feedback_form():
    elements.append(Paragraph("Date: _______________  Shift: _______________  Filled By: _______________", style_body))
    elements.append(Spacer(1,10))
    ratings = [["Category", "Rating (1-5)"], 
               ["Cleanliness / सफाई", ""], 
               ["Food Quality / खाने की गुणवत्ता", ""], 
               ["Service Speed / सेवा की गति", ""], 
               ["Staff Behavior / स्टाफ का व्यवहार", ""]]
    t = Table(ratings, colWidths=[200, 100], rowHeights=[25]*5)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), light_brown),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t)
    elements.append(Spacer(1,15))
    elements.append(Paragraph("Best moment today / आज का सबसे अच्छा पल:", style_body_hindi))
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1,15))
    elements.append(Paragraph("Worst issue today / आज की सबसे बड़ी समस्या:", style_body_hindi))
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1,15))
    elements.append(Paragraph("Suggestion / सुझाव:", style_body_hindi))
    elements.append(Spacer(1,20))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    elements.append(Spacer(1,20))

add_feedback_form()
elements.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=20, spaceAfter=20, dash=[3,3]))
add_feedback_form()
elements.append(PageBreak())


# --- PAGE 16: Item Contribution Margin ---
elements.append(Paragraph("Item Contribution Margin", style_heading))
data = [["Item Name/आइटम", "Selling Price ₹", "Ingredient Cost ₹", "Contribution Margin ₹", "Margin %", "Category", "Action"]]
for _ in range(27):
    data.append(["", "", "", "", "", "", ""])
t = Table(data, colWidths=[120, 60, 70, 90, 50, 60, page_width - 2*margin - 450], rowHeights=[25] + [23]*27)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 17: Staff Performance Sheet ---
elements.append(Paragraph("Staff Performance Sheet", style_heading))
elements.append(Paragraph("<i>Enter one record per review date</i>", style_body))
data = [["Date", "Staff Name", "Role", "Mistakes", "Compliments", "Upsell Success", "Service", "Notes"]]
for _ in range(27):
    data.append(["", "", "", "", "", "", "", ""])
t = Table(data, colWidths=[50, 70, 50, 50, 60, 60, 50, page_width - 2*margin - 390], rowHeights=[25] + [23]*27)
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 18: Monthly KPI Dashboard ---
elements.append(Paragraph("Monthly KPI Dashboard", style_heading))
kpis = [
    ("Total Sales ₹", "कुल बिक्री"),
    ("Total Bills", "कुल बिल"),
    ("Average Bill ₹", "औसत बिल"),
    ("Actual Operating Profit ₹", "वास्तविक ऑपरेटिंग लाभ"),
    ("Profit Margin %", "लाभ मार्जिन"),
    ("Food Cost %", "फूड कॉस्ट"),
    ("Staff Cost %", "स्टाफ कॉस्ट"),
    ("Total Wastage ₹", "कुल वेस्टेज"),
    ("Wastage % of Sales", "बिक्री में वेस्टेज %"),
    ("Top-Selling Item", "टॉप सेलिंग आइटम"),
    ("Highest-Contribution Item", "सबसे अधिक योगदान"),
    ("Items <40% Contribution", "40% से कम योगदान"),
    ("Average Prep Time", "औसत प्रेप समय"),
    ("KOT Error Count", "KOT त्रुटियां"),
    ("Stockout Incidents", "स्टॉक आउट घटनाएं"),
    ("Inventory Variance Flags", "इन्वेंटरी अंतर"),
    ("Purchase Variance ₹", "खरीद अंतर"),
    ("Customer Complaints", "ग्राहक शिकायतें"),
    ("Customer Compliments", "ग्राहक तारीफ"),
    ("Repeat Customer Rate %", "रिपीट ग्राहक दर"),
    ("Checklist Compliance %", "चेकलिस्ट अनुपालन"),
    ("Staff Late Count", "स्टाफ देरी"),
    ("Staff Incident Count", "स्टाफ घटनाएं"),
    ("Avg Customer Rating", "औसत ग्राहक रेटिंग")
]
data = [["KPI", "Hindi / हिंदी", "Target", "Actual", "Variance", "Notes/Action"]]
for en, hi in kpis:
    data.append([Paragraph(en, style_table_cell), Paragraph(hi, style_table_cell), "", "", "", ""])

t = Table(data, colWidths=[110, 110, 50, 50, 50, page_width - 2*margin - 370], rowHeights=[25] + [24]*len(kpis))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 19: SOPs (Staff & Kitchen) ---
elements.append(Paragraph("SOPs: Staff & Kitchen / एसओपी: स्टाफ और किचन", style_heading))
sops_1 = [
    ("<b>Opening SOP:</b> Arrive 15 mins before shift. Complete cleaning checklist before equipment turn-on.<br/>शिफ्ट से 15 मिनट पहले आएं। उपकरण चालू करने से पहले सफाई पूरी करें।"),
    ("<b>Attendance:</b> Punch in uniform. Late arrivals must notify manager 1 hour prior.<br/>वर्दी में उपस्थिति दर्ज करें। देरी होने पर 1 घंटे पहले बताएं।"),
    ("<b>Service Staff SOP:</b> Approach table within 2 mins of seating. Confirm order twice. Serve drinks first.<br/>बैठने के 2 मिनट के भीतर टेबल पर जाएं। ऑर्डर दो बार कन्फर्म करें।"),
    ("<b>Kitchen Staff SOP:</b> Follow recipe weights exactly. Keep raw and cooked food separate.<br/>रेसिपी वजन का सख्ती से पालन करें। कच्चा और पका खाना अलग रखें।"),
    ("<b>Food Preparation:</b> FIFO (First In First Out) for all ingredients. Date label all prepped items.<br/>सभी सामग्री के लिए FIFO। तैयार आइटम पर तारीख लगाएं।"),
    ("<b>Serving:</b> Check plate rims are clean. Serve hot food hot, cold food cold.<br/>प्लेट के किनारे साफ होने चाहिए। गर्म खाना गर्म परोसें।"),
    ("<b>Complaint Handling:</b> Listen → Apologize → Solve immediately. Inform manager for free replacements.<br/>सुनें → माफ़ी मांगें → तुरंत हल करें। रिप्लेसमेंट के लिए मैनेजर को बताएं।")
]
for s in sops_1:
    elements.append(Paragraph(s, style_body_hindi))
    elements.append(Spacer(1, 15))
elements.append(PageBreak())


# --- PAGE 20: SOPs (Owner) ---
elements.append(Paragraph("SOPs: Owner / एसओपी: मालिक", style_heading))
sops_2 = [
    ("<b>Daily Routine:</b> Opening (inspect) → Operations (flow) → Business Time (data) → Peak Prep (check) → Peak (manage) → Closing (cash/lock).<br/>दैनिक कार्य: ओपनिंग → संचालन → बिज़नेस समय → पीक प्रेप → पीक → क्लोजिंग।"),
    ("<b>Weekly Review:</b> Use Weekly Revenue Report as agenda. Compare week-over-week. Identify what caused variations.<br/>साप्ताहिक समीक्षा: साप्ताहिक राजस्व रिपोर्ट का उपयोग करें।"),
    ("<b>Monthly Review:</b> P&L deep dive, menu engineering (evaluate item margins), inventory variance analysis, staff performance evaluation.<br/>मासिक समीक्षा: P&L, मेन्यू इंजीनियरिंग, स्टाफ मूल्यांकन।"),
    ("<b>Weekly Meetings:</b> Combine with Shift Briefing on Mondays. Discuss past week metrics and set target for current week.<br/>साप्ताहिक मीटिंग: सोमवार को शिफ्ट ब्रीफिंग के साथ मिलाएं।")
]
for s in sops_2:
    elements.append(Paragraph(s, style_body_hindi))
    elements.append(Spacer(1, 15))
elements.append(PageBreak())


# --- PAGE 21: Staff Rules & Penalties ---
elements.append(Paragraph("Staff Rules & Penalties", style_heading))

rules_text = """<b>12 Non-Negotiable Rules:</b><br/>
1. On time arrival / समय पर आना<br/>
2. Full uniform & hygiene / पूरी वर्दी और स्वच्छता<br/>
3. No phone during service / सर्विस के दौरान फोन नहीं<br/>
4. No arguing with customers / ग्राहकों से बहस नहीं<br/>
5. Zero unrecorded wastage / बिना रिकॉर्ड किए वेस्टेज नहीं<br/>
6. No unauthorized free food/discount / बिना अनुमति मुफ्त खाना नहीं<br/>
7. Exact recipe & portion compliance / सटीक रेसिपी और मात्रा का पालन<br/>
8. Never leave station dirty / स्टेशन गंदा न छोड़ें<br/>
9. Strictly follow KOT flow / KOT प्रक्रिया का पालन<br/>
10. Inform manager of low stock early / कम स्टॉक की सूचना पहले दें<br/>
11. Respect all team members / सभी साथियों का सम्मान<br/>
12. Complete daily checklists / दैनिक चेकलिस्ट पूरी करें"""
elements.append(Paragraph(rules_text, style_body_hindi))
elements.append(Spacer(1, 15))

data = [["Violation/उल्लंघन", "1st Time/पहली बार", "2nd Time/दूसरी बार", "3rd Time/तीसरी बार"]]
violations = [
    "Late arrival / देरी से आना",
    "Phone use / फोन का उपयोग",
    "Arguing with customer / ग्राहक से बहस",
    "Unrecorded wastage / बिना रिकॉर्ड वेस्टेज",
    "Free food/discount / मुफ्त खाना/छूट",
    "Recipe/portion change / रेसिपी/मात्रा बदलाव",
    "Station left dirty / स्टेशन गंदा छोड़ना",
    "KOT violation / KOT उल्लंघन"
]
for v in violations:
    data.append([Paragraph(v, style_table_cell), "Verbal Warning", "Written Warning", "Final Action / Dismissal"])

t = Table(data, colWidths=[150, 100, 100, page_width - 2*margin - 350], rowHeights=[25] + [30]*len(violations))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(PageBreak())


# --- PAGE 22: Peak Hour Deployment Plan ---
elements.append(Paragraph("Peak Hour Deployment Plan (7-10 PM)", style_heading))
elements.append(Paragraph("<b>Objective:</b> During 7-10 PM every person becomes service-focused.<br/>7-10 बजे के दौरान हर व्यक्ति सेवा-केंद्रित हो जाता है।", style_body_hindi))
elements.append(Spacer(1, 10))

data = [["Role/भूमिका", "Default Station/मुख्य स्टेशन", "If Bottleneck Elsewhere/रुकावट पर", "Control Point/मुख्य जिम्मेदारी"]]
roles = [
    ["Order/Billing Captain", "POS / Counter", "Do NOT leave. Manager helps.", "Accurate KOT, Cash"],
    ["Floor/Service", "Dining Area", "Run food / Help clean tables", "Table turnaround"],
    ["Kitchen Chef", "Main Cooking Range", "Guide helper, do not leave prep", "Quality & Speed"],
    ["Kitchen Helper", "Prep / Wash Area", "Assist plating or fetch items", "Support Chef"],
    ["Owner/Floor Manager", "Float (Everywhere)", "Fill whichever role is weakest", "Overall flow"]
]
for r in roles:
    data.append([Paragraph(r[0], style_table_cell), Paragraph(r[1], style_table_cell), Paragraph(r[2], style_table_cell), Paragraph(r[3], style_table_cell)])

t = Table(data, colWidths=[100, 100, 150, page_width - 2*margin - 350], rowHeights=[25] + [35]*len(roles))
t.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), brown),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('ALIGN', (0,0), (-1,0), 'CENTER'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
]))
elements.append(t)
elements.append(Spacer(1, 15))

protocol = """<b>Bottleneck Response Protocol:</b><br/>
1. Identify the bottleneck (order taking? kitchen? food running? billing?)<br/>
2. Move the NEAREST idle person to bottleneck.<br/>
3. Never leave billing unattended.<br/>
4. Owner acts as float - fills whatever role is weakest.<br/><br/>
<b>Communication rules:</b> Call out orders loudly, use KOT system, no verbal orders.<br/>
<b>Escalation:</b> If wait time > 15 mins, owner personally updates customer."""
elements.append(Paragraph(protocol, style_body))
elements.append(PageBreak())


# --- PAGE 23: Floor Plan ---
elements.append(Paragraph("FLOOR PLAN / फ्लोर प्लान", style_title))
elements.append(Paragraph("Draw the final layout: seating, counter, kitchen entry/exit, billing station, service path, washroom and safe movement paths.", style_subtitle))
elements.append(Paragraph("बैठने की व्यवस्था, काउंटर, किचन, बिलिंग, सर्विस रास्ता और वॉशरूम का लेआउट बनाएं।", style_hindi_subtitle))
elements.append(Spacer(1, 20))

# Empty rectangle for drawing
t = Table([[ "" ]], colWidths=[page_width - 2*margin], rowHeights=[page_height - 300])
t.setStyle(TableStyle([
    ('GRID', (0,0), (-1,-1), 1, brown),
]))
elements.append(t)

# Build PDF
doc.build(elements)
print("PDF Generated successfully!")
