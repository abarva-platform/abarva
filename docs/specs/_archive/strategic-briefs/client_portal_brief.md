# ABARVA CLIENT PORTAL — COMPLETE DESIGN & BUILD BRIEF
# Execute fully. No approval pauses. Commit after each section.

════════════════════════════════════════════════════════════════
OVERVIEW
════════════════════════════════════════════════════════════════

The Client Portal is what Arcturus/Meridian CXO sees when they 
log in. Design philosophy: PURE DECISION SURFACE.

No chat. No workspace. No clutter.
Just: where are we, what did AbarVa find, what do I approve next.

File: src/app/portal/[solution]/page.tsx
Route: /portal/[solution]?client=[clientId]

════════════════════════════════════════════════════════════════
TASK 1 — PAGE LAYOUT & STRUCTURE
════════════════════════════════════════════════════════════════

OVERALL LAYOUT:
- Background: #060A12
- Full viewport width, no max-width constraint
- Font: DM Sans body, JetBrains Mono for labels/codes
- Zero grey text — white and teal only (same rules as design system)

TOP BAR (full width, 56px height):
  Left: AbarVa wordmark (Georgia serif, Abar white 17px 800, Va teal 23px 900)
  Center: Client name — DM Sans 14px 600 white
  Right: User name — DM Sans 13px rgba(255,255,255,0.75) + logout link teal
  Background: rgba(6,10,18,0.95), backdrop-blur
  Border-bottom: 1px solid rgba(45,212,200,0.12)
  Position: sticky top

HERO STATUS CARD (full width, below top bar):
  Background: rgba(13,20,32,0.80)
  Border-bottom: 1px solid rgba(45,212,200,0.15)
  Padding: 28px 5vw
  
  Row 1: 
    Left: Intelligence type label — JetBrains Mono 10px #2DD4C8 uppercase
    e.g. "MARGIN INTELLIGENCE · ARCTURUS FINANCIAL GROUP"
  
  Row 2:
    Left: Solution name — DM Sans 28px 700 white
    Right: Phase badge — "PHASE 1 · IN PROGRESS" teal border white text
  
  Row 3:
    Progress bar — full width
    Teal fill for completed %, rgba(255,255,255,0.10) for remaining
    Label: "Phase 1 of 4 · 40% complete" — mono 10px rgba white
  
  Row 4:
    "Started: Apr 9 · Last update: 2 hours ago · Maestro: Anand Sundaram"
    JetBrains Mono 10px rgba(255,255,255,0.50)

THREE-COLUMN BODY (below hero, padding: 32px 5vw):
  Left column: 28% width
  Center column: 44% width  
  Right column: 26% width (sticky on scroll)
  Gap: 24px

MOBILE (below 768px):
  Single column, stacked:
  1. Hero (keep)
  2. Action Required (right column comes FIRST on mobile)
  3. Latest Intelligence
  4. Phase Timeline
  5. Outputs Library

════════════════════════════════════════════════════════════════
TASK 2 — LEFT COLUMN: PHASE TIMELINE
════════════════════════════════════════════════════════════════

Section header: "ENGAGEMENT PHASES" — JetBrains Mono 9px #2DD4C8

Each phase as a card:

COMPLETED PHASE:
  Left: green checkmark circle (#22C55E)
  Phase label: "Phase 0" — mono 9px rgba white
  Phase name: DM Sans 13px white
  Sublabel: "Approved by you · [date]" — mono 9px #2DD4C8
  Background: rgba(34,197,94,0.04)
  Border-left: 2px solid rgba(34,197,94,0.30)

CURRENT PHASE:
  Left: teal pulsing dot
  Phase label: "Phase 1" — mono 9px teal
  Phase name: DM Sans 14px white 700
  Sublabel: "In progress · 3 of 5 workstreams active" — mono 9px teal
  Background: rgba(45,212,200,0.06)
  Border-left: 3px solid #2DD4C8
  Border: 1px solid rgba(45,212,200,0.20)

PENDING PHASE (awaiting current approval):
  Left: amber clock icon (#F59E0B)
  Phase name: DM Sans 13px rgba(255,255,255,0.60)
  Sublabel: "Awaiting Phase 1 approval" — mono 9px rgba(255,255,255,0.40)
  Background: transparent
  Border-left: 2px solid rgba(245,158,11,0.20)

LOCKED PHASE:
  Left: padlock icon rgba(255,255,255,0.20)
  Phase name: DM Sans 13px rgba(255,255,255,0.30)
  Sublabel: "Locked" — mono 9px rgba(255,255,255,0.25)
  Background: transparent
  Border-left: 2px solid rgba(255,255,255,0.08)

Connecting line between phases:
  2px solid rgba(255,255,255,0.08) vertical line
  Teal for completed segments

BELOW PHASE TIMELINE:

Fee Status card:
  Background: rgba(45,212,200,0.04)
  Border: 1px solid rgba(45,212,200,0.15)
  Border-radius: 10px
  Padding: 16px
  
  Label: "FEE STATUS" — mono 9px teal
  Verified savings: "—" or "$X.XM" — 24px bold teal
  Fee earned: "$0" or "$X.XM" — 14px white
  Next trigger: "Fee triggered at $10M verified savings" 
               — mono 10px rgba white
  Progress bar to next trigger (teal fill)

════════════════════════════════════════════════════════════════
TASK 3 — CENTER COLUMN: LATEST INTELLIGENCE
════════════════════════════════════════════════════════════════

Section header: 
  Left: "LATEST INTELLIGENCE" — mono 9px teal
  Right: "View all [N] findings →" — mono 9px teal link

Show maximum 3 most recent findings, each as a card:

FINDING CARD:
  Background: #0D1420
  Border: 1px solid rgba(45,212,200,0.10)
  Border-radius: 10px
  Padding: 18px 20px
  Margin-bottom: 12px
  
  Top row:
    Left: Severity badge
      CRITICAL: #EF4444 text, rgba(239,68,68,0.12) bg
      HIGH: #F97316 text, rgba(249,115,22,0.12) bg
      MEDIUM: #F59E0B text, rgba(245,158,11,0.12) bg
    Right: Genome pattern tag
      e.g. "F008" — JetBrains Mono 10px teal, teal border, dark bg
    Right: "CONFIRMED" badge — teal
  
  Finding title: DM Sans 14px 600 white, margin-top 10px
  Finding body: DM Sans 13px rgba(255,255,255,0.78) line-height 1.6
  
  Bottom row:
    Left: Workstream — mono 9px rgba(255,255,255,0.45)
    Right: "View full finding →" — mono 9px teal link
  
  Hover: border-color rgba(45,212,200,0.25), slight bg lift

BELOW FINDINGS:

Published Outputs section:
  Header: "PUBLISHED OUTPUTS" — mono 9px teal
  
  Each output as a row:
    Phase badge: small, colored by phase
    Output name: DM Sans 13px white
    Date: mono 9px rgba white
    [View] button: teal border, teal text, small
    [Download] button: rgba border, white text, small
  
  If no outputs yet:
    "AbarVa will publish outputs as each phase is completed."
    mono 11px rgba(255,255,255,0.40) italic

════════════════════════════════════════════════════════════════
TASK 4 — RIGHT COLUMN: ACTION REQUIRED (sticky)
════════════════════════════════════════════════════════════════

This column is sticky — stays in view as user scrolls.
Position: sticky, top: 80px (below top bar)

ACTION CARD (primary — changes based on engagement state):

STATE A — Phase ready for approval:
  Background: rgba(45,212,200,0.06)
  Border: 1px solid rgba(45,212,200,0.30)
  Border-radius: 12px
  Padding: 24px
  
  Top: "YOUR ACTION" — mono 9px teal uppercase
  
  Phase name: DM Sans 16px 700 white
  e.g. "Phase 1 is ready for your review"
  
  Summary: DM Sans 13px rgba(255,255,255,0.80) line-height 1.6
  e.g. "AbarVa has identified 5 margin levers totalling 
  $167M in addressable gap. Review the findings before approving."
  
  Findings count: mono 11px teal
  "5 findings · 3 CRITICAL · 2 HIGH"
  
  Primary CTA:
    Button: full width, background #2DD4C8, color #060A12
    DM Sans 14px 700
    "Approve Phase 1 →"
    Border-radius: 8px, padding: 14px
    Hover: background #1AA89F
  
  Secondary CTA:
    Button: full width, background transparent
    Border: 1px solid rgba(255,255,255,0.20)
    Color: rgba(255,255,255,0.75)
    DM Sans 13px
    "Request a briefing from Maestro"
    Margin-top: 10px

STATE B — Phase in progress (no action needed):
  Background: rgba(13,20,32,0.80)
  Border: 1px solid rgba(255,255,255,0.08)
  
  Top: "IN PROGRESS" — mono 9px rgba white
  Message: "AbarVa is working on Phase 1.
  You will be notified when it is ready for your review."
  DM Sans 13px rgba(255,255,255,0.70)
  
  "Last activity: 2 hours ago" — mono 10px rgba white

STATE C — Engagement complete:
  Background: rgba(34,197,94,0.06)
  Border: 1px solid rgba(34,197,94,0.25)
  
  "ENGAGEMENT COMPLETE" — mono 9px green
  Verified savings: large teal number
  Fee earned: white
  "Download Final Report →" — full width teal button

BELOW ACTION CARD:

MAESTRO CONTACT CARD:
  Background: rgba(13,20,32,0.60)
  Border: 1px solid rgba(255,255,255,0.08)
  Border-radius: 10px
  Padding: 16px
  
  "YOUR MAESTRO" — mono 9px rgba white
  Name: DM Sans 14px white 600
  "Anand Sundaram"
  Role: mono 10px teal "AbarVa Lead"
  
  "Send a message →" — mono 10px teal link
  (links to a simple message modal — not full chat)

════════════════════════════════════════════════════════════════
TASK 5 — BELOW FOLD: OUTPUTS LIBRARY + GENOME SUMMARY
════════════════════════════════════════════════════════════════

OUTPUTS LIBRARY (full width, below three columns):
  Header: "ENGAGEMENT OUTPUTS" — mono 9px teal
  
  Table layout:
    Columns: Phase | Output Name | Published | Status | Actions
    Header row: mono 10px teal
    Data rows: DM Sans 13px white, alternating bg
    Status: "Published" (green), "In Progress" (teal), "Pending" (rgba)
    Actions: [View] [Download] — small teal links

GENOME SUMMARY (full width, below outputs):
  Header: "GENOME PATTERN SUMMARY" — mono 9px teal
  Subtitle: "Patterns matched against your engagement data"
  DM Sans 12px rgba(255,255,255,0.60)
  
  Pattern cards in a 3-column grid:
    Each card: dark surface, teal top border
    Pattern ID: JetBrains Mono large teal (F001, F008 etc)
    Confidence bar: teal fill
    Title: white 13px bold
    Description: rgba white 12px
    Status: CONFIRMED (teal) or PENDING (rgba)

FOOTER:
  "AbarVa · Intelligence. Now act on it."
  mono 10px rgba(255,255,255,0.30) centered
  "Confidential — for [Client Name] only"

════════════════════════════════════════════════════════════════
TASK 6 — APPROVE PHASE FLOW
════════════════════════════════════════════════════════════════

When CXO clicks "Approve Phase X →":

1. Confirmation modal appears:
   Background: rgba(6,10,18,0.95) overlay
   Modal: #0D1420, teal border, border-radius 14px, padding 32px
   
   Title: "Approve Phase [N] — [Phase Name]"
   DM Sans 20px 700 white
   
   Summary: "By approving, you confirm that AbarVa may proceed 
   to Phase [N+1]. This approval is logged with your name, 
   role, and timestamp."
   DM Sans 14px rgba(255,255,255,0.80)
   
   What you're approving (bullet list):
   · [Finding 1 title]
   · [Finding 2 title]  
   · [Finding 3 title]
   + "[N] additional findings"
   
   Confirm button: teal full width "Confirm Approval →"
   Cancel: text link rgba white "Cancel"

2. On confirmation:
   - POST to /api/engage/[clientId]/[solution]/phase/[phaseId]/approve
   - Show success state:
     Green checkmark animation
     "Phase [N] approved. AbarVa will begin Phase [N+1]."
   - Page refreshes after 2 seconds
   - Phase timeline updates
   - Action card switches to STATE B (in progress)

3. Logging:
   - approved_by: user name
   - approved_by_role: from Clerk metadata
   - approved_at: timestamp
   - Visible in engagement workspace Activity tab

════════════════════════════════════════════════════════════════
TASK 7 — DATA WIRING
════════════════════════════════════════════════════════════════

The portal reads from existing API:
GET /api/engage/[clientId]/[solution]
  → engagement data, phases, current_phase, status

GET /api/engage/phase/[phaseId]/findings
  → latest findings for center column (max 3)

GET /api/engage/phase/[phaseId]/outputs
  → published outputs for library

For the approval action:
POST /api/engage/phase/[phaseId]/approve
  → body: { approvedBy, approvedByRole }
  → updates phase status to 'approved'
  → triggers next phase creation

Fee status:
Read from engagement.metadata.verified_savings (if exists)
Show "—" if no verified savings yet

Client routing:
The portal reads clientId from query param: ?client=[clientId]
If no clientId, read from Clerk publicMetadata.clientId
If no match, redirect to /sign-in

════════════════════════════════════════════════════════════════
COMMIT SEQUENCE:
════════════════════════════════════════════════════════════════
1. "feat: client portal — layout, hero, three-column structure"
2. "feat: client portal — phase timeline + fee status"  
3. "feat: client portal — latest intelligence + outputs"
4. "feat: client portal — action required column (sticky)"
5. "feat: client portal — outputs library + genome summary"
6. "feat: client portal — approve phase flow + confirmation modal"
7. "feat: client portal — data wiring + API connections"

Push after each commit. No approval pauses. No grey text.
