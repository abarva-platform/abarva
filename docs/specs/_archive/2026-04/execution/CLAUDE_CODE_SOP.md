# AbarVa — Claude Code Standard Operating Procedure
# Include this at the TOP of every Claude Code instruction
# Last updated: April 14, 2026

---

## HOW TO WORK ON ABARVA

### Before starting any task:
1. Read the spec file fully before writing a single line of code
2. List what you are about to build (confirm understanding)
3. Check what already exists — do not overwrite working code

### While building:
1. Build one component/route at a time
2. After each component: validate it works (see validation steps below)
3. If something fails: fix it before moving to the next component
4. Commit after each working component — not in bulk at the end

### Validation steps after EVERY route or component:

For any new page route (e.g. /engage/arcturus/pdlc):
  □ curl -s -o /dev/null -w "%{http_code}" [URL] → must return 200 not 404
  □ Route directory exists AND contains page.tsx
  □ page.tsx has valid JSX — no syntax errors
  □ Run: npx tsc --noEmit → 0 errors

For any auth-protected route:
  □ Logged out → correct redirect or overlay shown
  □ Wrong role → correct redirect
  □ Correct role → full page loads

For any API route:
  □ curl POST/GET → returns expected JSON
  □ Error cases handled (missing params, wrong auth)

For any database migration:
  □ Run migration in Supabase
  □ Verify tables exist: SELECT table_name FROM information_schema.tables
  □ Verify columns match spec
  □ Insert one test row and read it back

For any UI component:
  □ Renders without console errors
  □ Mobile viewport (375px) — no overflow
  □ Desktop viewport (1440px) — no dead space
  □ White text throughout — no grey (#8899AA etc.)
  □ Teal accent #2DD4C8 used correctly

### Commit convention:
  Each working, validated component gets its own commit:
  "feat: [route] — [what it does]"
  "fix: [what was broken] — [how fixed]"
  "migration: [table names] added to Supabase"

  Never commit broken code.
  Never bulk-commit 10 files at once without validating each.

### Push after every 2-3 commits:
  git push
  (Vercel auto-deploys — check live URL after push)

---

## END-OF-SESSION REPORT

At the end of every Claude Code session, output a report
in this exact format. Save it as SESSION_REPORT.md in repo root.

```
# AbarVa — Session Report
Date: [date]
Session duration: [time]

## WHAT WAS BUILT

| Component | Route/File | Status | Validated |
|-----------|-----------|--------|-----------|
| [name] | [path] | ✓ Complete | ✓ 200 OK |
| [name] | [path] | ✓ Complete | ✓ Tested |
| [name] | [path] | ⚠ Partial | ✗ Not tested |

## DATABASE

| Table | Status | Notes |
|-------|--------|-------|
| [table_name] | ✓ Created | [columns] |
| [table_name] | ✗ Not created | Blocked by: [reason] |

## ROUTES — LIVE STATUS

| Route | HTTP Status | Auth | Notes |
|-------|-------------|------|-------|
| /engage/arcturus/pdlc | 200 | ✓ | Working |
| /portal/pdlc | 404 | ✗ | page.tsx missing |

## WHAT IS WORKING
- [bullet list of confirmed working features]

## WHAT IS BROKEN OR INCOMPLETE
- [bullet list with specific reason for each]

## BLOCKERS
- [anything that stopped progress]

## NEXT SESSION — recommended order
1. [highest priority item]
2. [second priority]
3. [third priority]

## COMMITS THIS SESSION
[git log --oneline of commits made]
```

---

## ABARVA DESIGN SYSTEM — NON-NEGOTIABLE

Background:     #060A12
Card bg:        #0D1520
Featured bg:    #091828
Borders:        #1C2D45
Teal accent:    #2DD4C8
ALL body text:  #ffffff — NEVER grey, NEVER #8899AA, NEVER rgba opacity
Labels:         #2DD4C8, JetBrains Mono, uppercase, letter-spacing
Error/negative: #EF4444

TYPOGRAPHY:
  Headings: DM Sans, 800 weight
  Body: DM Sans, 400 weight, white
  Labels/eyebrows: JetBrains Mono, 9-10px, 700, uppercase, teal
  
LAYOUT:
  Max content width: 1400px, mx-auto, px-10
  Cards: border-radius 8px, border 1px solid #1C2D45
  No grey anywhere. No muted text. No opacity tricks on text.

---

## CREDENTIALS (for testing auth flows)

| Email | Role | Password |
|-------|------|----------|
| anand+clerk_test@abarva.com | admin | AbarVa2026! |
| investor+clerk_test@abarva.com | investor | Demo2026! |
| af@abarva.com | maestro | Demo2026! |
| mh+clerk_test@abarva.com | maestro | Demo2026! |

Verification code: 424242
Live URL: https://nexus-vert-kappa.vercel.app
Repo: github.com/anandsundaram-hash/abarva (private)

---

## CURRENT PRIORITY QUEUE (update as items complete)

P0 — Demo blockers (fix first, everything else waits):
  □ /engage/[clientId]/[solution] — Maestro Workspace page.tsx
  □ /portal/[solution] — Client Portal page.tsx
  □ Ask Anything (Tab 4) broken — ANTHROPIC_API_KEY in Vercel env
  □ Supabase migrations — verify all 15 tables exist

P1 — Important before demo:
  □ /investor page — build from INVESTOR_PAGE_SPEC.md
  □ Solutions pages logged-in state — wire to /engage
  □ Homepage: remove First Capital + Apex client cards
  □ "1 of 4" → "1 of 3" on solutions pages

P2 — Polish:
  □ Platform page layer diagram
  □ Admin page right sidebar
  □ Mobile layout audit
