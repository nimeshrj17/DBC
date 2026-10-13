import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_pdf():
    pdf_path = "NextGen_POS_Case_Study.pdf"
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        name='MainTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        spaceAfter=20,
        textColor=colors.HexColor('#0F172A'),
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        name='SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=14,
        leading=18,
        spaceAfter=40,
        textColor=colors.HexColor('#475569'),
        alignment=TA_CENTER
    )
    
    h1_style = ParagraphStyle(
        name='Heading1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        spaceBefore=20,
        spaceAfter=15,
        textColor=colors.HexColor('#1E3A8A'),
        borderPadding=5
    )
    
    h2_style = ParagraphStyle(
        name='Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        spaceBefore=15,
        spaceAfter=10,
        textColor=colors.HexColor('#334155')
    )
    
    body_style = ParagraphStyle(
        name='BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        textColor=colors.HexColor('#1E293B')
    )
    
    bullet_style = ParagraphStyle(
        name='BulletText',
        parent=body_style,
        leftIndent=20,
        bulletIndent=10,
        spaceAfter=5
    )

    # --- CONTENT ---
    
    # COVER PAGE
    story.append(Spacer(1, 100))
    story.append(Paragraph("ARCHITECTING THE FUTURE OF HOSPITALITY", title_style))
    story.append(Paragraph("A Comprehensive Case Study on Modern Cloud-Native Point of Sale Systems", subtitle_style))
    story.append(Spacer(1, 50))
    story.append(Paragraph("<b>Prepared for:</b> Forward-Thinking Enterprises & Potential Investors", body_style))
    story.append(Paragraph("<b>Focus:</b> Real-time synchronization, edge-computing, and frictionless UX in F&B operations", body_style))
    story.append(PageBreak())
    
    # SECTION 1
    story.append(Paragraph("1. Executive Abstract", h1_style))
    story.append(Paragraph("Modern food and beverage (F&B) businesses suffer from systemic inefficiencies stemming from legacy, siloed Point of Sale (POS) infrastructure. The latency between customer intent, front-of-house (FOH) ordering, and back-of-house (BOH) kitchen execution creates severe bottlenecks, directly impacting revenue and customer satisfaction.", body_style))
    story.append(Paragraph("This case study examines a bespoke, next-generation Cloud POS system engineered to eliminate these bottlenecks. By leveraging real-time websocket connections, distributed database architecture, and edge-level local print agents, the software transforms traditional cafes into hyper-efficient, data-driven operational machines. It is not merely a billing tool; it is an autonomous operational nervous system.", body_style))
    
    # SECTION 2
    story.append(Paragraph("2. Technical Specifications & Architecture", h1_style))
    story.append(Paragraph("The software represents a paradigm shift in architectural design, moving away from monolithic local servers to a highly available serverless infrastructure.", body_style))
    story.append(Paragraph("<b>Core Technology Stack:</b>", h2_style))
    story.append(Paragraph("• <b>Frontend:</b> Next.js (React) utilizing Server-Side Rendering (SSR) and Client-Side state management for instant UX.", bullet_style))
    story.append(Paragraph("• <b>Backend & Real-Time Sync:</b> Firebase Firestore. Utilizes document-level snapshot listeners for sub-100ms bidirectional synchronization between customer devices and staff dashboards.", bullet_style))
    story.append(Paragraph("• <b>Edge-Computing Print Agent:</b> A lightweight, autonomous Python daemon operating on local hardware that polls a local proxy network to instantly route Kitchen Order Tickets (KOT) to thermal printers, bypassing browser CORS restrictions and cloud-to-local firewall barriers.", bullet_style))
    story.append(Paragraph("• <b>Authentication & Security:</b> Ephemeral, cookie-based JWT sessions bound to specific table IDs and encrypted PINs, ensuring zero-trust network access even on public QR codes.", bullet_style))
    
    # SECTION 3
    story.append(Paragraph("3. Analytical Deep-Dive: Overcoming Systemic Challenges", h1_style))
    story.append(Paragraph("<b>A. The Concurrency Problem (Race Conditions)</b>", h2_style))
    story.append(Paragraph("In a high-volume environment, multiple users at a single table might submit orders simultaneously. The system implements strict ACID transactions via Firebase runTransaction routines. It binds an anonymous session ID to incoming payloads, ensuring total idempotency. If a race condition occurs, the system elegantly rejects secondary writes, preventing duplicate billing or ghost orders.", body_style))
    
    story.append(Paragraph("<b>B. The 'Phantom Session' Loophole</b>", h2_style))
    story.append(Paragraph("A common flaw in QR-based ordering is state desynchronization when a customer leaves and a new one arrives. This architecture utilizes a deterministic 'Table Locking' algorithm. Tables transition strictly through discrete states (Empty -> Claimed -> Needs Approval -> Occupied -> Served -> Billed). Browser caching is aggressively defeated via force-dynamic server routes and manual timestamp cache-busting, ensuring zero crossover of customer sessions.", body_style))

    story.append(PageBreak())

    # SECTION 4
    story.append(Paragraph("4. Core Features & Operational Mechanics", h1_style))
    story.append(Paragraph("<b>Frictionless Customer UX (No-App Download):</b>", h2_style))
    story.append(Paragraph("Customers scan a table-specific QR code and are instantly placed into an interactive menu. The UI is designed for high conversion, bypassing the massive drop-off rates associated with mandatory app downloads.", bullet_style))
    story.append(Paragraph("<b>Live Dashboard & KOT Engine:</b>", h2_style))
    story.append(Paragraph("The owner dashboard acts as the command center. Incoming orders trigger visual alerts and bypass browser autoplay policies through a globally unlocked Web Audio API module, ensuring staff never miss an incoming QR order. Once accepted, KOTs are instantly dispatched to the kitchen.", bullet_style))
    story.append(Paragraph("<b>Dynamic Floor Management:</b>", h2_style))
    story.append(Paragraph("Tables map dynamically to the database. Real-time visual indicators show table occupancy, pending payments, and unserved items.", bullet_style))

    # SECTION 5
    story.append(Paragraph("5. Business Upgrade Potential (The ROI)", h1_style))
    story.append(Paragraph("Implementing this software fundamentally upgrades a business's operational capacity:", body_style))
    story.append(Paragraph("• <b>Maximized Table Turnover:</b> By decentralizing order placement to the customer's device, waitstaff time is freed. Average order-to-kitchen time is reduced from 5 minutes to 30 seconds.", bullet_style))
    story.append(Paragraph("• <b>Zero Revenue Leakage:</b> The strict table state machine ensures no customer can bypass the billing phase. Integrated UPI QR generation per bill enforces exact-amount payments.", bullet_style))
    story.append(Paragraph("• <b>Scalability:</b> Because the heavy lifting is handled by cloud serverless functions (Vercel/Firebase), the system scales infinitely. Whether the business has 5 tables or 500, the infrastructure requires zero additional on-premise servers.", bullet_style))
    story.append(Paragraph("• <b>Data-Driven Expansion:</b> The digital-first nature allows the capture of high-resolution metadata (peak ordering times, item conversion rates), enabling owners to optimize menus and staffing mathematically rather than intuitively.", bullet_style))

    # SECTION 6
    story.append(Paragraph("6. Conclusion", h1_style))
    story.append(Paragraph("This software is not an iterative improvement over existing POS systems; it is a fundamental architectural redesign of how a hospitality business operates. By bridging the gap between cloud scalability and edge-device hardware (printers), and by enforcing rigorous, mathematically sound state management, this platform transforms chaos into predictable, scalable revenue streams. It is an enterprise-grade engine designed to power the next generation of hospitality.", body_style))

    doc.build(story)
    print(f"PDF successfully generated at {os.path.abspath(pdf_path)}")

if __name__ == "__main__":
    generate_pdf()
