# AbarVa — 20-Minute Boardroom Demo Script
**Version:** 1.0
**Date:** 2026-04-26
**Audience:** Fortune 500 CTO / CISO / VP Engineering
**Format:** Live platform walkthrough with talk track

---

## Pre-Demo Checklist (5 minutes before)
- [ ] Logged in as Apex Retail admin demo user (OTP: 424242)
- [ ] /home loaded and visible
- [ ] /tenant/apex-retail/programs loaded
- [ ] Azure architecture doc open in second tab
- [ ] Fallback: static screenshots in /docs/demo/ if live route fails

---

## Opening Narrative (2 minutes)
Talk track: "You're running 15 AI initiatives. Some are delivering, some are stalled, and you're not sure which is which. AbarVa is the operating system for enterprise AI programs — it gives you a command center, a governance layer, and an evidence trail, all in one platform. Let me show you."

---

## Route Sequence and Talk Track

### Stop 1 — Home / Executive Command Center (2 minutes)
**Route:** /home
**What to show:** Queue panel, program count, active alerts
**Talk track:** "This is the executive entry point. Every active AI program, recent alerts, and recommended actions in a single view. Your AI portfolio — at a glance."
**What to click:** AI Activity queue panel, any program card
**Expected signal:** Program cards visible, queue populated
**Fallback:** Navigate to /platform/admin if /home fails
**What NOT to claim:** Do not claim real-time sync — seed data shown

---

### Stop 2 — Apex Retail AI Program Portfolio (3 minutes)
**Route:** /tenant/apex-retail/programs
**What to show:** 4 program cards (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting)
**Talk track:** "Apex Retail has four active AI programs. Each has a phase, a health score, risks, and deliverables tracked. No spreadsheets. No status meetings to find out what's blocked."
**What to click:** Contact Center AI card
**Expected signal:** Program grid with phase indicators and status chips
**Fallback:** /programs
**What NOT to claim:** Do not claim real-time phase advancement without live DB

---

### Stop 3 — Program Deep Dive (3 minutes)
**Route:** /tenant/apex-retail/programs/contact-center-ai
**What to show:** Phase gate, milestones, deliverables, risk flags, sponsor commitment
**Talk track:** "Every program has a phase gate. You cannot advance to the next phase without evidence-backed sign-off. Milestones, risks, and sponsor commitment are all tracked here. This is what accountable AI delivery looks like."
**What to click:** Phase tab, any milestone, any deliverable
**Expected signal:** Phase detail with milestone list, risk section, deliverable cards
**Fallback:** /programs/[programId] with any seeded program
**What NOT to claim:** Do not claim the phase gate auto-advances — it requires human sign-off

---

### Stop 4 — AI Control Tower (3 minutes)
**Route:** /tenant/apex-retail/tower
**What to show:** Portfolio-level signals: cost, adoption, risk, governance
**Talk track:** "Atlas is the AI Control Tower. It surfaces cost consumption, adoption rates, risk exposure, and governance signals across your entire portfolio. Think of it as the CFO and CISO view of AI."
**What to click:** Any signal card or surface tab
**Expected signal:** Tower dashboard with Atlas signal cards
**Fallback:** /tower
**What NOT to claim:** Do not claim live cost data — seed data shown

---

### Stop 5 — Intelligence Library (2 minutes)
**Route:** /tenant/apex-retail/intelligence
**What to show:** Pattern library, market signals, evidence basis
**Talk track:** "Sentinel surfaces competitive and market intelligence — grounded in evidence. Every pattern has a confidence score and a recommended action. No hallucinations, no generic AI output."
**What to click:** Any intelligence pattern
**Expected signal:** Pattern cards with evidence section
**Fallback:** /intelligence
**What NOT to claim:** Do not claim real-time market data — deterministic seed patterns

---

### Stop 6 — Source / Procurement Intelligence (2 minutes)
**Route:** /source/events
**What to show:** RFP events, vendor response completeness, pricing comparability
**Talk track:** "Source tracks your vendor selection process. Response completeness, commercial traps, pricing normalization — all in one place. No more spreadsheet hell."
**What to click:** Any event card
**Expected signal:** Event list with vendor status chips
**Fallback:** /source
**What NOT to claim:** Do not claim live vendor API integration — seed events shown

---

### Stop 7 — Azure Private Data Plane Story (3 minutes)
**Route:** Architecture doc (second browser tab)
**What to show:** Two-plane diagram from AZLAB1 blueprint
**Talk track:** "The most common objection we hear from Fortune 500 IT is: 'We can't send our data to a SaaS platform.' Here is our answer. AbarVa runs a SaaS control plane that orchestrates. Your data stays in a private Azure data plane that you own and control. No raw data ever crosses the boundary. We send you a request for an evidence manifest. You approve what to share. That's it."
**What to click:** Open AZLAB1 architecture diagram, AZLAB4 evidence manifest types
**Expected signal:** Architecture diagram visible, evidence manifest structure shown
**Fallback:** Read the two-plane summary from AZLAB1 blueprint aloud
**What NOT to claim:** Do not claim this is in production — May 4 lab target

---

## Fortune 500 Data Trust Story (included in Stop 7 talk track above)
Key points:
- Client data never leaves client Azure tenant
- AbarVa only receives evidence manifests the client explicitly approves
- Every cross-boundary call is logged and audited (AZLAB2 boundary contract)
- Private data plane: client-owned Postgres, Blob, Key Vault, App Insights
- May 4 lab will demonstrate end-to-end boundary enforcement

---

## Pilot Ask (1 minute)
**Talk track:** "Here is our ask: a 90-day pilot. We embed AbarVa alongside your two highest-stakes AI programs. We instrument phase gates, track milestones, and surface risk signals. At the end of 90 days, you have a defensible audit trail and a clear picture of which programs are delivering value. The Azure private data plane lab will be ready by May 4 — we can walk through a live proof of concept before the pilot kicks off."

---

## Known Deterministic Caveats
- All data shown is seed/demo data unless explicitly noted
- Live DB required for real program state and phase advancement
- Live cost/adoption data requires enterprise integrations
- Azure private data plane is a planned lab (May 4 target), not yet in production
- Source events are deterministic seed — live vendor data requires client RFP upload
- Vercel/CI deployment status shown in production readiness page is a static manifest, not live poll

---

## Fallback Playbook
| If this fails | Do this instead |
|---------------|----------------|
| /home blank | Navigate to /platform/admin |
| /tenant/apex-retail/programs 404 | Use /programs directly |
| Program detail 404 | Use /programs/[programId] with seed ID |
| Tower blank | Use /tower with demo data |
| Intelligence blank | Use /intelligence |
| Source 404 | Show /source and explain event list |
| Azure diagram missing | Read AZLAB1 blueprint aloud from docs/ |

---

## Post-Demo Notes
- Leave the architecture doc and AZLAB4 evidence manifest open for follow-up questions
- Be prepared for: "What is the pricing?" / "How long does deployment take?" / "Who else is using this?"
- Do not answer pricing in the boardroom — schedule a follow-up
