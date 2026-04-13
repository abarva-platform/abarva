# Abarva — Output Standards & Generation Specification
*Version 1.0 — April 11, 2026*
*Simple. Excellent. Fast. No half-built features.*

---

## THE PRINCIPLE

Every output Abarva generates must be something a CXO is proud to share
with their board. Not "good for AI-generated." Just good.

If we cannot make it excellent — we do not ship it.
Four formats. Built properly. Nothing else until post-funding.

---

## THE FOUR FORMATS

### Format 1: HTML Intelligence Report ← Primary format. Use for everything.
### Format 2: PDF via HTML Print ← Zero new libraries. Print CSS only.
### Format 3: Excel Workbook ← Financial models and benchmark trackers.
### Format 4: Word Document ← Templates clients will edit (RFP, contract, data guide).

---

## FORMAT 1: HTML INTELLIGENCE REPORT

### When to use
- Current state assessment
- AI Strategy findings
- Contradiction map / intelligence brief
- Executive brief (also the /brief mobile page)
- Board presentation (NOT PowerPoint — HTML that presents like a deck)
- Competitive analysis
- Vendor evaluation report
- Any "deliverable" that will be read, not edited

### Why HTML is the right choice
- Renders instantly in any browser — no software required
- Printable to PDF via browser print (Cmd+P) — produces beautiful output
- Interactive — expandable sections, tabs, charts
- Branded — full control over typography, color, layout
- Shareable — a URL or a single .html file attached to an email
- Claude produces excellent HTML — this is where quality is highest

### Design standard for HTML reports

**Typography:**
Use Google Fonts — load via CDN in the <head>.
Primary: A distinctive serif or display font for headers (Playfair Display, DM Serif Display, Fraunces)
Body: A clean, highly readable sans-serif (DM Sans, Plus Jakarta Sans, Outfit)
Monospace: For metrics, codes, data (JetBrains Mono, IBM Plex Mono)

**Color system — two modes:**
Executive dark (default for board-level reports):
  Background: #0D1117
  Surface: #161B22
  Border: #21262D
  Text primary: #F0F6FF
  Text secondary: #8B949E
  Accent teal: #2DD4C8
  Accent blue: #4DA3FF

Executive light (for data-heavy reports):
  Background: #FAFAFA
  Surface: #FFFFFF
  Border: #E5E7EB
  Text primary: #111827
  Text secondary: #6B7280
  Accent: #1B4FD8

**Layout:**
- Max content width: 900px centered
- Left margin: 64px minimum on desktop
- Section spacing: 48-64px
- No more than 3 columns anywhere — 2 columns is safer
- Every section has a clear heading with a subtle separator

**Data display:**
- Large metric callouts: 48-64px number, 12px label below
- Comparison tables: clean borders, alternating rows, sticky header
- Status indicators: colored dots (●) not icons — simpler, cleaner
- Progress bars: thin (4px), branded color, percentage label

**Charts (inline SVG — no libraries needed):**
For simple data: build inline SVG bar charts or line charts
Keep it minimal — one chart per insight, never decorative
If the data is complex: a clean table beats a mediocre chart every time

**Print optimization (CSS):**
Always include:
```css
@media print {
  body { background: white; color: black; }
  .no-print { display: none; }
  .page-break { page-break-before: always; }
  a { color: inherit; text-decoration: none; }
  /* Hide nav, buttons, interactive elements */
}
```

**The one thing that makes it excellent:**
A well-designed cover section. Client name, engagement title, date, Abarva wordmark.
First impressions determine whether this gets forwarded to the board or filed away.

### HTML Report Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Client] — [Report Type] — Abarva</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    /* CSS variables, print styles, all styles inline — no external CSS files */
  </style>
</head>
<body>
  <!-- COVER -->
  <section class="cover">
    <div class="cover-client">[Client Name]</div>
    <h1 class="cover-title">[Report Title]</h1>
    <div class="cover-meta">[Date] · Prepared with Abarva · Confidential</div>
  </section>

  <!-- EXECUTIVE SUMMARY — always first, always short -->
  <section class="exec-summary">
    <h2>Executive Summary</h2>
    <p>[3-4 sentences. The most important finding. The recommended action. The financial impact.]</p>
    <div class="metric-row">
      <!-- 3 large metric callouts -->
    </div>
  </section>

  <!-- MAIN SECTIONS — vary by report type -->

  <!-- FOOTER -->
  <footer class="no-print">
    <button onclick="window.print()">Download PDF</button>
    <span>Prepared with Abarva · abarva.ai · Confidential</span>
  </footer>
</body>
</html>
```

### Quality bar
Would a McKinsey partner be comfortable handing this to a Fortune 500 board?
If yes: ship it.
If no: redesign it.

---

## FORMAT 2: PDF (via HTML Print)

### How it works
No PDF generation libraries. No pdfmake. No jspdf. No puppeteer.

The HTML report IS the PDF. Add a "Download PDF" button that calls `window.print()`.
The print CSS handles the rest:
- Hides interactive elements (nav, buttons)
- Sets page margins and breaks
- Adjusts typography for print
- Switches to light background if using dark mode

The output looks indistinguishable from a professionally designed PDF.
It works in Chrome, Safari, and Edge. Test in all three before shipping.

### When PDF is appropriate
When the client specifically needs a file they can email as an attachment.
When the report will be printed and brought to a physical board meeting.
When the client's email system blocks HTML attachments.

### Implementation in Abarva
Every HTML report page has a "Download PDF" button in the top-right.
Keyboard shortcut: Cmd+P (standard browser print).
Print dialog tip shown on first use: "Select 'Save as PDF' in the print dialog."

### Quality bar for PDF output
Test by actually printing to PDF in Chrome.
Check: margins, page breaks, no content cut off, cover page is full-page.
If anything looks wrong: fix the print CSS, not the HTML.

---

## FORMAT 3: EXCEL WORKBOOK

### When to use
- Business case financial model (3-scenario NPV/IRR/payback)
- IT budget analysis and benchmark comparison
- AI portfolio inventory tracker (Control Tower)
- Vendor cost comparison model
- Outcome baseline tracking template
- Data collection templates (pre-formatted for upload back to Abarva)

### Why Excel specifically
CFOs live in Excel. When you produce a financial model as an HTML page,
they want to download it and change the assumptions. Excel lets them do that.
The Excel output is not the polished deliverable — it's the working tool.

### Implementation
Use SheetJS (xlsx library) in the browser — already available as a CDN import.
Or generate a CSV that opens cleanly in Excel (simpler, more reliable).

For simple models: CSV is enough. Always prefer CSV over complex XLSX unless
the client specifically needs multiple sheets, formulas, or formatting.

For financial models: XLSX with:
- Sheet 1: Executive summary (key outputs, no formulas visible)
- Sheet 2: Assumptions (all inputs in yellow cells, clearly labeled)
- Sheet 3: Model (full calculation, blue cells = formulas, yellow = inputs)
- Sheet 4: Scenarios (conservative/base/aggressive side by side)

### Design standard for Excel output
Yellow cells = inputs the client can change
Blue cells = calculated outputs (locked or formula-protected)
Header rows: dark background (#0F172A), white text, bold
Section headers: light gray background
Numbers: formatted with $ and commas, consistent decimal places
No merged cells — they break when clients sort or filter
Footer row: "Prepared with Abarva · abarva.ai · [Date]"

### The three Excel files to build first
1. Business_Case_Model.xlsx — for AI Strategy Step 7
   Inputs: investment by phase, savings by category, discount rate, tax rate
   Outputs: NPV, IRR, payback period, 3-year cumulative value
   Scenarios: conservative (70% of base), base, optimistic (130% of base)

2. AI_Portfolio_Tracker.xlsx — for Control Tower
   Columns: Initiative, Owner, Platform, Stage, Monthly Cost, MAU, Override Rate,
   Hours Saved/Month, $Saved/Month, Risk Tier, Bias Assessed, Last Review Date
   Pre-populated with Meridian's 42 AI initiatives for demo

3. Vendor_Comparison_Model.xlsx — for Select/Marketplace
   Rows: evaluation criteria (weighted)
   Columns: each vendor being compared
   Auto-calculates weighted composite score
   Inputs: weights and scores per criterion

### Code pattern for CSV download
```typescript
function downloadCSV(data: string[][], filename: string) {
  const csv = data.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### Code pattern for XLSX download (SheetJS via CDN)
```typescript
// Import at top of component:
// import * as XLSX from 'https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs'

function downloadXLSX(sheets: Record<string, any[][]>, filename: string) {
  const wb = XLSX.utils.book_new()
  Object.entries(sheets).forEach(([name, data]) => {
    const ws = XLSX.utils.aoa_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, name)
  })
  XLSX.writeFile(wb, filename)
}
```

---

## FORMAT 4: WORD DOCUMENT

### When to use
- RFP/RFI template (clients must edit this — Word is the right format)
- Contract templates (MSA, Outcome Baseline Agreement, DPA)
- Data collection guides (how to export from Epic, how to pull from ServiceNow)
- Meeting agenda and pre-read documents
- Interview guides for leadership intake sessions

### What Word is NOT for
Not for final deliverables. Not for board presentations. Not for anything
the client is meant to read as-is. Word is for documents they edit.

### Implementation
Two approaches — choose based on complexity:

**Simple (recommended for pre-funding):**
Generate clean HTML → tell user to copy-paste into Word.
Or: generate a .txt file with clear structure that pastes cleanly.
This sounds crude but works for 80% of use cases.

**Proper DOCX (when structure matters):**
Use the docx SKILL.md approach — python-docx in the container.
Worth doing for RFP templates and contract documents where formatting matters.

### Design standard for Word output
Use Word styles (Heading 1, Heading 2, Normal) — not manual formatting.
This allows clients to restyle the document with their own template.
Page size: Letter (US) or A4 (international) — make it a setting.
Margins: 1 inch all sides — standard, professional.
Footer: "Prepared with Abarva · abarva.ai · [Date] · Confidential"
Font: Calibri 11pt body, Calibri 14pt headings — universally readable in Word.

### The three Word files to build first
1. RFP_Template.docx — for Vendor/Select Path 4
   Pre-populated with: scope, evaluation criteria, scoring rubric, timeline
   Client replaces [bracketed fields] with their specifics
   Exported from Abarva with client context already filled in

2. Outcome_Baseline_Agreement.docx — for new client onboarding
   Pre-populated with org name, engagement date, standard metrics for vertical
   Client and Maestro review, adjust targets, sign

3. Data_Collection_Guide.docx — for Maestro Playbook
   System-specific export instructions (Epic, ServiceNow, Workday, SAP)
   Templates for each data category
   "What good looks like" examples

---

## WHAT NOT TO BUILD (Pre-Funding)

### PowerPoint / PPTX — Do not expose to clients yet
Claude's PPTX output is not good enough. It does not meet the quality bar.
The board presentation lives as a beautiful HTML page.
When a client needs a PPTX, a Maestro converts the HTML to PowerPoint manually
using the HTML as a design reference. 20 minutes of Maestro time vs.
a mediocre AI-generated deck.

Post-funding: Evaluate whether Gamma-quality PPTX generation is achievable.
If not: partner with Gamma or Beautiful.ai for the PPTX use case.

### Complex charts and visualizations — Keep simple for now
Bar charts and line charts in inline SVG: yes.
Complex interactive dashboards with D3: no.
Recharts or Chart.js for simple charts in React: yes, if already in the codebase.
Anything requiring a dedicated visualization library: defer to Series A.

### Email templates — Simple HTML only
The notification emails (regulatory alerts, outcome milestones) are plain HTML
with inline styles. They render correctly in Gmail and Outlook.
No drag-and-drop email builder. No Mailchimp. Simple inline-styled HTML.

---

## THE OUTPUT BUTTON PATTERN

Every product workflow ends with the same pattern:

```
┌────────────────────────────────────────────────────────────────┐
│  GENERATE YOUR DELIVERABLES                                    │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ 📄 Intelligence │  │ 📊 Financial    │  │ 📋 RFP        │ │
│  │    Report       │  │    Model        │  │    Template   │ │
│  │                 │  │                 │  │               │ │
│  │ Board-ready     │  │ 3-scenario NPV  │  │ Pre-populated │ │
│  │ HTML/PDF        │  │ Excel workbook  │  │ Word document │ │
│  │                 │  │                 │  │               │ │
│  │ [Generate →]   │  │ [Download →]    │  │ [Download →]  │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📧 Send Executive Brief to [CXO name]  [Send →]        │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

Not every product has all four. Only offer what's genuinely useful:

| Product | HTML Report | Excel | Word | Brief |
|---|---|---|---|---|
| AI Strategy | ✓ (full report) | ✓ (business case) | ✗ | ✓ |
| Diagnose | ✓ (findings report) | ✗ | ✗ | ✓ |
| Select/Vendor | ✓ (comparison report) | ✓ (scoring model) | ✓ (RFP) | ✗ |
| Justify | ✓ (business case report) | ✓ (3-scenario model) | ✗ | ✓ |
| Control Tower | ✓ (portfolio report) | ✓ (portfolio tracker) | ✗ | ✓ |
| AI-PDLC | ✓ (transformation report) | ✓ (tool comparison) | ✗ | ✗ |
| Future of Work | ✓ (playbook report) | ✓ (value model) | ✗ | ✗ |
| Analytics Mod | ✓ (estate report) | ✓ (platform comparison) | ✗ | ✗ |
| Maestro Admin | ✗ | ✗ | ✓ (baseline agreement) | ✓ |

---

## REPORT TYPES AND WHAT GOES IN EACH

### 1. Intelligence Report (HTML → PDF)
The flagship output. Every major product generates one.

Structure (always in this order):
1. Cover: Client name, report type, date, Abarva wordmark
2. Executive Summary: 3-4 sentences + 3 metric callouts
3. Key Findings: 3-5 findings with supporting data
4. Detailed Analysis: The full product output
5. Recommendations: Numbered, prioritized, actionable
6. Next Steps: The 3 things that should happen in the next 30 days
7. Appendix: Supporting data, benchmarks, methodology notes

Length: 8-15 pages when printed. No filler. No padding. Every page earns its place.

Design: Executive dark theme. Playfair Display headers. Large metric callouts.
Client name on every page footer. "Prepared with Abarva" on every page.

### 2. Business Case Report (HTML → PDF + Excel)
Produced by: AI Strategy Step 7, Justify product

The HTML version: narrative business case — written for a board presentation
The Excel version: the model the CFO wants to stress-test

HTML structure:
1. The investment (what it costs, phased by year)
2. The return (what it generates, phased by year)
3. The scenarios (conservative/base/optimistic — side by side)
4. Key assumptions (explicit, auditable)
5. Risk factors (what has to be true for this to work)
6. Recommendation (with confidence level)

### 3. Portfolio Intelligence Brief (HTML → PDF)
Produced by: Control Tower, AI Strategy Step 1

One page when printed. Dense but readable.
Used for: board meetings, quarterly reviews, investor updates.

Structure:
- Header: client name, date, prepared by Maestro
- Portfolio health (score + trend)
- Top 3 risks (red items)
- Top 3 opportunities (green items)
- Value delivered (key metrics)
- Next milestone

### 4. Vendor Evaluation Report (HTML → PDF + Excel)
Produced by: Select product, Marketplace

HTML: The narrative recommendation — why Vendor A, why not B or C,
negotiation playbook, contract terms to demand.
Excel: The scoring matrix — weighted criteria, all vendors, composite scores.

---

## NAMING CONVENTION FOR DOWNLOADS

Always use this pattern:
`[ClientName]_[ReportType]_[Date].pdf`
`[ClientName]_[ReportType]_[Date].xlsx`

Examples:
`Meridian_AI_Strategy_2026-04-14.pdf`
`FirstCapital_Business_Case_2026-04-14.xlsx`
`ApexRetail_Vendor_Comparison_2026-04-14.xlsx`
`Meridian_AI_Portfolio_Brief_2026-04-14.pdf`

---

## THE PRINT BUTTON IMPLEMENTATION

Every HTML report page:

```typescript
// In the page component
export default function IntelligenceReport({ client, data }) {
  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .cover { background: #0F172A !important; -webkit-print-color-adjust: exact; }
          .page-break { page-break-before: always; }
          @page { margin: 0.75in; }
        }
      `}</style>

      {/* Print/Download button — top right, hidden when printing */}
      <div className="no-print" style={{
        position: 'fixed', top: 24, right: 24, zIndex: 100,
        display: 'flex', gap: 8
      }}>
        <button onClick={() => window.print()} style={{
          background: '#2563EB', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          fontSize: 14, fontWeight: 600
        }}>
          Download PDF
        </button>
        <button onClick={() => handleShare()} style={{
          background: '#F1F5F9', color: '#374151', border: '1px solid #E2E8F0',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          fontSize: 14, fontWeight: 600
        }}>
          Share Link
        </button>
      </div>

      {/* Report content */}
      <div className="report-content">
        {/* ... */}
      </div>
    </>
  )
}
```

---

## QUALITY CHECKLIST FOR EVERY OUTPUT

Before any output format is shipped, verify:

**Content:**
- [ ] Every metric is real (from org data files — not estimated or hardcoded display)
- [ ] Client name appears correctly throughout
- [ ] Date is current (not hardcoded)
- [ ] No placeholder text visible ("[INSERT]", "TBD", "Lorem ipsum")
- [ ] No forbidden client references (Accenture, CADE, Presbyterian, MDA)
- [ ] "Prepared with Abarva · abarva.ai" in footer

**HTML/PDF:**
- [ ] Renders cleanly in Chrome (primary target)
- [ ] Renders acceptably in Safari and Edge
- [ ] Print to PDF: cover page is full-page and correct
- [ ] Print to PDF: no content cut off at page boundaries
- [ ] Print to PDF: all charts/tables visible (no overflow clipping)
- [ ] Download button triggers print dialog correctly
- [ ] Page is readable at 100% zoom without horizontal scroll

**Excel:**
- [ ] Opens in Excel without errors
- [ ] Input cells are clearly marked (yellow background)
- [ ] Formulas calculate correctly
- [ ] Numbers are formatted consistently ($, commas, decimals)
- [ ] Filename follows naming convention

**Word:**
- [ ] Opens in Word without errors
- [ ] Styles are applied (Heading 1, Heading 2, Normal — not manual formatting)
- [ ] [Bracketed fields] are clearly marked for client completion
- [ ] Footer present on every page

---

## WHAT TO ADD TO BUILD.md

**Phase 1 addition — Output component:**
Create src/components/OutputPanel.tsx
The standard "Generate your deliverables" panel used across all products.
Props: availableOutputs (array of output types), clientId, productId, data.
Each output button triggers the appropriate generation function.

**Per-product output generation (add to each product phase):**

AI Strategy outputs:
- generateHTMLReport(strategyData) → opens /strategy/report?client=X in new tab
- generateBusinessCaseXLSX(businessCaseData) → CSV/XLSX download
- generateExecutiveBrief(strategyData) → /brief?client=X link for sharing

Control Tower outputs:
- generatePortfolioReport(controlTowerData) → HTML report
- generatePortfolioTrackerXLSX(portfolioData) → XLSX with all 42 initiatives
- generateExecutiveBrief(controlTowerData) → /brief?client=X

Select/Vendor outputs:
- generateVendorReport(vendorData) → HTML comparison report
- generateScorecardXLSX(vendorData) → scoring matrix XLSX
- generateRFPDocument(rfpData) → Word-compatible structured HTML

**Shared output routes:**
/report/[type]?client=[id] — renders any report type as full-page HTML
/brief?client=[id] — Executive Brief (already in Phase 2)

**Print CSS standard:**
Create src/styles/print.css imported by all report pages.
Include: page margins, page breaks, color adjustments, no-print class rules.

---

## POST-FUNDING: WHAT GETS ADDED

When Series A is closed, revisit:

**PPTX generation:**
Evaluate: can we hit Gamma quality via API integration?
Options: Gamma API (if available), Beautiful.ai API, custom template engine.
Do not ship PPTX until quality matches HTML output. It is better to not offer
the format than to offer a mediocre version.

**Interactive dashboards:**
Consider D3.js or Observable Plot for more sophisticated visualizations in reports.
The Control Tower and Analytics Modernization products especially benefit from this.

**Automated report delivery:**
Scheduled HTML reports delivered via email on a cadence (weekly, monthly, quarterly).
PDF generation server-side using Puppeteer on a Lambda (for email attachment use cases).

**White-labeling:**
Allow clients to upload their logo and brand colors.
Report outputs render in client branding (subtle — Abarva attribution remains in footer).

---

*Four formats. Built excellently. Nothing else until post-funding.*
*The output quality is the product quality. A poorly formatted deliverable*
*undermines everything Abarva produced to generate it.*
