from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output" / "pdf" / "callblick-getting-started-guide.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor("#07162C")
BLUE = HexColor("#1D73B8")
LIGHT_BLUE = HexColor("#DCEEFF")
INK = HexColor("#13233A")
MUTED = HexColor("#5E7189")
LINE = HexColor("#D5E0EC")

styles = getSampleStyleSheet()
title = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=white, spaceAfter=5)
subtitle = ParagraphStyle("Subtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=HexColor("#C8E5FF"))
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=NAVY, spaceBefore=9, spaceAfter=4)
body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.9, leading=12, textColor=INK, spaceAfter=3)
step_title = ParagraphStyle("StepTitle", parent=body, fontName="Helvetica-Bold", fontSize=9.8, leading=12, textColor=NAVY, spaceAfter=1)
small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=12, textColor=MUTED)
footer = ParagraphStyle("Footer", parent=small, alignment=TA_LEFT, fontSize=8, textColor=HexColor("#6D819B"))

def step(number, heading, copy):
    badge = Table([[Paragraph(f"<b>{number}</b>", ParagraphStyle("Badge", parent=body, alignment=TA_LEFT, textColor=white, fontSize=11, leading=13))]], colWidths=[10 * mm], rowHeights=[10 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ROUNDEDCORNERS", [5]),
    ]))
    details = [Paragraph(heading, step_title), Paragraph(copy, body)]
    table = Table([[badge, details]], colWidths=[14 * mm, 158 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 4 * mm),
        ("LEFTPADDING", (1, 0), (1, 0), 0),
        ("RIGHTPADDING", (1, 0), (1, 0), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    return KeepTogether([table, Spacer(1, 1 * mm)])

def page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 13 * mm, 192 * mm, 13 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(HexColor("#6D819B"))
    canvas.drawString(18 * mm, 8 * mm, "CallBlick - Getting Started Guide")
    canvas.drawRightString(192 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=15 * mm, bottomMargin=20 * mm)
story = []

hero = Table([[[Paragraph("Getting Started with CallBlick", title), Spacer(1, 2 * mm), Paragraph("A quick guide for invited organization owners", subtitle)]]], colWidths=[174 * mm])
hero.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), NAVY),
    ("LEFTPADDING", (0, 0), (-1, -1), 11 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 11 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 9 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 9 * mm),
    ("ROUNDEDCORNERS", [9]),
]))
story += [hero, Spacer(1, 5 * mm)]
story.append(Paragraph("Welcome", h2))
story.append(Paragraph("A CallBlick administrator has invited you to use the platform. Once your account is ready, you can create and manage your own organization, invite your team, and analyze calls in one place.", body))

story.append(Paragraph("Set up your workspace", h2))
story.append(step("1", "Accept the invitation", "Open the CallBlick invitation email and select <b>Accept invitation</b>. This takes you to the CallBlick sign-up page."))
story.append(step("2", "Create your account", "Set a secure password and complete your profile with your first and last name. Use the invited email address to finish sign-up."))
story.append(step("3", "Create your organization", "After signing in, create your organization - normally your company, department, or team. You become the organization administrator and control its workspace."))

story.append(Paragraph("Bring in your team", h2))
story.append(step("4", "Invite users", "Open <b>Users</b> from the sidebar, select <b>Invite user</b>, and enter each colleague's email and name. They receive their own CallBlick invitation email."))
story.append(step("5", "Manage access", "Use the Users page to review your team and assign the appropriate roles. Keep administrator access limited to people who need to manage users and organization settings."))

story.append(Paragraph("Analyze calls", h2))
story.append(step("6", "Upload or add a call", "Add call recordings in CallBlick and choose the relevant questionnaire or scoring configuration when prompted. CallBlick processes the recording for analysis."))
story.append(step("7", "Review the result", "Open <b>Call Analytics</b> to review the call score, summary, question-level results, red flags, silence metrics, and opportunities for improvement."))
story.append(step("8", "Improve performance", "Use <b>Analytics</b> to identify trends across calls. Review low scores or repeated red flags, then update coaching, questionnaires, or scoring settings as your team improves."))

note = Table([[Paragraph("<b>Need help?</b><br/>If an invitation link has expired or cannot be opened, ask the CallBlick administrator who invited you to send a new invitation.", small)]], colWidths=[174 * mm])
note.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
    ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#B7D9F5")),
    ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
    ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
    ("ROUNDEDCORNERS", [6]),
]))
story += [Spacer(1, 2 * mm), note]

doc.build(story, onFirstPage=page, onLaterPages=page)
print(OUT)
