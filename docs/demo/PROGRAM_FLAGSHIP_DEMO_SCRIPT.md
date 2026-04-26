# Program Flagship Demo Script — AbarVa

Status: Wave-18 / DEMO6
Authored: 2026-04-26
Audience: Founders, sponsor demos, customer pilots

This script gives a presenter a concrete plan to walk the AbarVa Program Flagship experience at three durations: 10 minutes, 20 minutes, and 45 minutes. Read it once end-to-end before presenting. Choose the duration that matches the audience. Do not improvise outside the boundaries marked "What NOT to claim."

---

## Why this page is the flagship

The Program detail page is the most important page in AbarVa. It shows the system's core operating model: a program in motion, with phases, gates, workshops, deliverables, evidence, and the four agents (Nexus / Sentinel / Atlas / Steward) collaborating on its progress.

Other pages — Tower, Intelligence, Source, Admin, Architecture — are essential. But the Program page is where the AbarVa thesis lives: programs are run honestly, agentically, and with the evidence laid bare. Every other surface either feeds this page or reads from it.

If a viewer leaves understanding ONE thing about AbarVa, it should be: "AbarVa makes program execution honest, agentic, and decision-ready."

Design canon to mention (in passing, never lectured):
- AbarVa wordmark, navy accent, off-white surface
- Honest deterministic-vs-live separation throughout
- No fake savings, no fake live decisions, no fake attendees

---

## Demo route

Primary route: `/tenant/apex-retail/programs/[programSlug]`
- Resolves to a full Program canvas anchored by Nexus
- Sections: executive brief → phase journey → workshop canvas → deliverables/evidence → action/mission strip
- All deterministic / seed-backed today
- Recommended seed scenario: Apex Retail · CDP Activation (Synthesis phase, pre-gate)

Supporting routes (referenced as needed during 45-minute deep dives):
- `/source/events/[eventId]` — commercial intelligence (Wave 14–17)
- `/platform/admin/architecture` — architecture canvas (Wave 17 ARCH5)
- `/platform/admin/production-readiness` — readiness decision flow (Wave 17 PROD8)

Deferred routes (do NOT show; mention only if asked):
- Live workshop runtime / live notes ingestion
- Live model gateway routing
- Live tenant-side Azure deploys

---

## Before you start (preflight)

- [ ] App is running (local or staging)
- [ ] Demo seed loaded — Apex Retail · CDP Activation
- [ ] Network/build is stable (no Vercel preview errors)
- [ ] Verify Program hub renders without console errors
- [ ] Open browser at full width (≥1280px)
- [ ] Have a backup screenshot deck ready in case of network issues
- [ ] Read the "What NOT to claim" section once before starting
- [ ] Confirm presenter has the right pilot-ask version printed for reference
- [ ] Mute notifications, close unrelated tabs, and clear the URL bar
- [ ] Practice the 30-second open at least twice; the rest of the demo flows from there

---

## What NOT to claim (universal guardrails)

These apply to every duration. If you find yourself about to say one of these, stop and rephrase.

- Do NOT say the system is connected to live program data
- Do NOT say the AI is generating recommendations in real time
- Do NOT promise persistence (writes, file uploads, live workflow)
- Do NOT say workshops or attendee confirmations are real
- Do NOT promise live ingestion of meeting notes
- Do NOT quote specific dates, attendees, or financials as real
- Do NOT promise "live Atlas" or "live Sentinel" runtime — these are deferred
- Do NOT say "the model decided" — say "the deterministic seed shows what Nexus would scope"
- Do NOT skip the deterministic caveat slide if asked about data origin
- Do NOT claim production deployments unless explicitly true and named
- Do NOT promise dates for deferred items unless they are in a published wave plan

If asked directly: "Is this live?" — the answer is "Today the canvas is deterministic and seeded. Live ingestion and runtime are scoped, sequenced, and named on our readiness page. We can show you that next."

---

## 10-minute walkthrough — "The shape of a program"

Audience: founder / first-time sponsor exposure
Style: high-energy, story-led
Goal: viewer leaves understanding what AbarVa is and why the Program page is honest

### Stations (10 min total, ~1 min per station)

**0:00–0:30 · Open the Program page**
- Open `/tenant/apex-retail/programs/[programSlug]`
- Read the program executive brief aloud (one breath)
- Talk track: "Apex Retail · CDP Activation. Discovery is complete. Synthesis is underway. The gate is pending. This is what AbarVa keeps in front of every program owner — what's true, what's missing, what's next."

**0:30–1:30 · Phase journey rail**
- Point at the 6-phase rail
- Talk track: "Six phases: Discovery, Synthesis, Design, Build, Activate, Operate. We're at Synthesis. The pill states tell you exactly where we are — done, in flight, blocked, not started."
- Stop on the Synthesis pill, hover the gate marker
- One-line aside: "These aren't decorative. Each phase has gates, deliverables, and named agents."

**1:30–3:00 · Current gate**
- Point at the gate card
- Talk track: "This is the Synthesis-to-Design gate. Status: pending. Owner: Steward. Four requirements. Two satisfied, two open."
- Read out the missing inputs: "Workshop 5 not held. Value hypothesis evidence trace incomplete."
- Drive home: "This is honest. It tells the executive what the gate needs — not a green checkmark hiding a half-finished synthesis."

**3:00–5:00 · Nexus workshop canvas**
- Scroll to workshop canvas
- Talk track: "Nexus has scoped the next workshop. Title, agenda, who needs to be in the room, what tensions to expect, what decisions are needed."
- Read 1-2 agenda items + 1-2 tensions
- Drive home: "This is workshop preparation, codified. The room walks in already aligned on what's contested."

**5:00–7:00 · Deliverables + evidence**
- Scroll to deliverables panel
- Talk track: "Fourteen deliverables across the six phases. Three approved. Three in review. Eight in draft."
- Click into the "current" deliverable (synthesis decision log)
- Read the evidence coverage line: "Evidence coverage 36%. Honest. We don't pretend the program is further than it is."
- Optional aside if time allows: "Each deliverable links back to its evidence. No hand-waving."

**7:00–9:00 · Action / mission strip**
- Scroll to action/mission strip
- Talk track: "Resume action: continue Synthesis workshop prep. Three top actions. Four agent missions — Nexus orchestrates, Sentinel validates, Atlas negotiates, Steward governs. One mission is blocked because of an upstream evidence gap."
- Pause on the blocked mission
- Drive home: "Most PMOs hide blockers. AbarVa surfaces them by default."

**9:00–10:00 · Pilot ask**
- Talk track: "AbarVa runs every program with this honesty. We'd like to apply it to your next major change program. We'll bring the seed scenario, you bring the real program. The first pilot is co-built."

### What to show
- Executive brief panel
- Phase rail with 6 phases
- Gate card with missing inputs
- Workshop canvas with agenda + tensions
- Deliverables grid with one drill-in
- Action / mission strip with the blocked mission

### What NOT to say in 10 min
- "Live data" / "real time" / "AI is thinking now"
- Specific dates as real ("Workshop 5 on May 14" is a seed, not a calendar event)
- Promises about features not yet built
- "We'll have live ingestion in 30 days"
- Anything about pricing — out of scope for the 10-min frame

### Pilot ask (5-min version)
"We'd like to run AbarVa alongside your next major change program. We'll seed the canvas. You bring the real program. We'll show you the same honesty we just showed you, on real work. Six weeks, co-built, deterministic-to-live progression. We name what's deferred up front."

---

## 20-minute walkthrough — "The full Program story"

Audience: sponsor + change lead + procurement
Style: deeper, with workshop and gate detail
Goal: viewer leaves understanding the agent collaboration and the gate model

### Stations (20 min total)

**0:00–2:00 · Open + executive brief**
- Same as 10-min open
- Spend more time on the eyebrow + brief
- Talk track: anchor on Nexus, name the 4 agents
- Drive home: "Nexus is the program orchestrator. Sentinel is the auditor. Atlas is the commercial brain. Steward is the governance keeper. They collaborate on this canvas."

**2:00–5:00 · Phase journey + history**
- Walk the 6 phases
- "Discovery" — what was found in the field
- "Synthesis" — what we're consolidating now
- "Design / Build / Activate / Operate" — out of scope today, but reachable from the rail
- Click each phase pill to demonstrate states
- Drive home: "The rail is the spine. Every other panel is anchored to it."

**5:00–9:00 · Gate detail + Steward role**
- Open the gate card
- Walk all 4 requirements one by one
- Steward implication — read aloud
- Approval caveat — say it once: "We are NOT performing an actual approval here; we're showing you the structure of a real approval."
- Connect: "This is what removes 'approval surprises' from programs. Everyone sees the same checklist, in the same place, at the same time."

**9:00–14:00 · Workshop canvas deep dive**
- Open the canvas
- Walk objective, agenda (item by item), attendees (with confirm states)
- Tensions section — explain why surfacing tensions reduces meeting risk
- Decisions needed — connect to the decision log deliverable
- Evidence to capture — connect to evidence trace
- Expected outputs — connect to deliverables panel
- Proposed updates placeholder — explain the meeting-notes integration is deferred
- Honest line: "Today the agenda is a deterministic seed. Live ingestion of notes back into deliverable drafts is wave-scope work."

**14:00–17:00 · Deliverables / evidence walk**
- Open the deliverables panel
- Walk all 6 phase groups briefly
- Stop on synthesis (current phase)
- Show the current deliverable highlight
- Read missing inputs aloud
- Drive home: "Every deliverable knows what it's missing. That's the unlock."

**17:00–19:00 · Action / mission strip + agent collaboration**
- Open the strip
- Resume action — what's next in plain English
- 3 top actions — Nexus / Sentinel / Atlas owners
- Agent missions — show Steward as blocked, explain the upstream dependency
- Connect: "This is what AbarVa exposes that traditional PMOs hide. The blockers, the dependencies, the agent owners. All in one place."

**19:00–20:00 · Pilot ask**
- Use the 10-minute pilot ask (paragraph form, below)

### What to show
- All 5 component sections with deep dive
- Demonstrate clicking into the current deliverable
- Demonstrate the gate's missing-input list
- Demonstrate the blocked agent mission and its upstream cause
- Demonstrate at least one cross-link (gate → deliverable, or workshop → deliverable)

### What NOT to say in 20 min
- "We'll have this live in 30 days"
- "The model is making this decision"
- "This is connected to your CRM today"
- "Steward signed off" — Steward CANNOT sign off in the demo; the gate is pending
- Any specific cost-savings figure as real

### Pilot ask (10-min version)

"We'd like to run AbarVa alongside your next major change program for six weeks. Here's how it works: we co-build the seed scenario together — same shape you just saw, but anchored to your real program. You'll see the phase rail, the gate, the workshop canvas, the deliverables, the agent missions, all populated with your context. We name up front what's live and what's deterministic. Live ingestion and runtime are sequenced — we'll show you the readiness page so you can see exactly when each piece moves from deterministic to live. The pricing is no-surprise: a fixed-fee pilot, all artifacts yours, no platform lock-in. The promise is simple: you'll see what's missing in your own program with the same honesty we just showed you. If that's useful, we go deeper. If not, you keep the artifacts and walk."

---

## 45-minute deep dive — "Architecture + Story + Pilot Plan"

Audience: enterprise customer evaluation team
Style: thorough; includes architecture + readiness; no sales spin
Goal: viewer leaves with a clear pilot plan and architectural confidence

### Structure (45 min total)
- 0:00–20:00 · 20-minute walkthrough above (verbatim)
- 20:00–25:00 · Architecture canvas tour (`/platform/admin/architecture`)
- 25:00–30:00 · Production readiness flow (`/platform/admin/production-readiness`)
- 30:00–35:00 · Source commercial cross-link (`/source/events/[eventId]`)
- 35:00–40:00 · Pilot plan
- 40:00–45:00 · Q&A buffer + close

### 20:00–25:00 · Architecture canvas tour
- Open `/platform/admin/architecture`
- Executive architecture brief (selective dark navy panel) — read aloud
- Talk track: "Nine architecture planes. Request → Context → Agent → Output flow. SaaS Control Plane on the left; Private Data Plane (Azure target) on the right."
- Walk built-now items briefly: deterministic surfaces, context bundle contracts, evidence ledger, mission queue, agent runtime contracts
- Walk deferred items briefly: live model gateway routing, live tenant Azure deploys, live signal ingestion
- Honest line: "Nothing on the screen pretends to be more than it is. The same surfaces show what's deferred."
- Connect back: "This is the architecture behind the Program page you just walked."

### 25:00–30:00 · Production readiness flow
- Open `/platform/admin/production-readiness`
- Walk the three-question flow:
  - "Can we demo? Yes."
  - "Can we pilot? Partial — explicit blockers listed."
  - "What blocks production? Five named items."
- Read the five named blockers aloud, briefly
- Honest line: "This is manifest-backed; not live monitoring. It tells the founder, the customer, and the team the same story."
- Drive home: "When this page says production_ready, it will mean it. Today it does not."

### 30:00–35:00 · Source commercial cross-link
- Open `/source/events/[eventId]` briefly
- Show the commercial workflow canvas
- Talk track: "Same architecture, same workflow canon, different domain. Source runs vendor-side commercial events with the same honesty: brief → pricing → comparison → risk → BAFO → readiness → missions → signals → decision."
- Connect: "When AbarVa runs your program AND your sourcing, the gate evidence and commercial decisions live in the same evidence ledger."
- Honest line: "Source is also deterministic today. Live signal ingestion is scoped on the readiness page."

### 35:00–40:00 · Pilot plan
- Talk track: "Here's the pilot, in concrete terms."
- Co-built scenario — week 1
- Phase rail and deliverables anchored to your real program — weeks 2–3
- Two seeded workshops with real attendees and real notes (manually entered for now) — weeks 3–4
- Agent missions running on deterministic seeds — week 4
- Readiness review and pilot retrospective — weeks 5–6
- Honest dates: "We can demo today. We can pilot in 6 weeks. Live runtime ingestion and tenant Azure deploys are sequenced, named, and dated on the readiness page — typically a 3-to-6 month horizon depending on tenancy posture."

### 40:00–45:00 · Q&A buffer + close
- Reserve at least three minutes for questions
- Close with the full pilot ask (below)
- Hand them the printed one-pager (story arc + pilot ask) on the way out

### What NOT to say in 45 min
- "We have customer X live in production" (unless true and named, with permission)
- "Our LLM gateway is in production" (it is deferred)
- "Live ingestion is days away" (it is wave-scope work, on the readiness page)
- "We sign customers in our standard MSA" — pilot terms are co-built, not standard
- Any architecture comparison that disparages a competitor by name

### Pilot ask (full written version, ~250 words)

"We'd like to propose a six-week paid pilot of AbarVa, anchored to your next major change program.

Here's how it works. In week one, we sit with your team and co-build the seed scenario: your phases, your gates, your workshop cadence, your deliverable structure, your agent ownership. You will recognize your program in our canvas by the end of that week.

In weeks two through four, we run two real workshops with real attendees, capture real notes (manually for now — live ingestion is on our readiness roadmap, not in scope for the pilot), and let the four agents — Nexus, Sentinel, Atlas, Steward — surface tensions, decisions, evidence gaps, and blockers in the format you saw today.

In weeks five and six, we run a readiness review with you. We show what's working, what's missing, and what would change if we extended. Every artifact stays with you. There is no platform lock-in.

The deliverable from the pilot is twofold: (1) a populated AbarVa program canvas you can keep using and (2) a written readiness assessment of your program as observed through the canvas.

We name what's deferred up front: live model gateway routing, tenant-side Azure private data plane, live signal ingestion. These are sequenced on our public readiness page; we will show you that page on day one.

The ask is small: a six-week engagement, fixed fee, co-built scope, no surprises. If it's useful, we go deeper. If not, you keep the artifacts and walk."

---

## Story arc (one-page summary)

Program opens → phase journey → current gate → Nexus workshop → meeting-notes → deliverables/evidence → agent missions → next step.

That's the entire AbarVa operating model in one page.

The Program page is the one screen a presenter should be able to walk in their sleep. Every other surface in AbarVa either feeds it or reads from it. If a viewer remembers nothing else, they should remember the shape of this page and the honesty of the gate.

---

## Deterministic caveat (use verbatim if asked)

"The Program canvas you saw is deterministic. The data is seeded for the demo, not pulled from a live system of record. The agents — Nexus, Sentinel, Atlas, Steward — are real architectural roles with real contracts; their runtime execution is sequenced on our readiness page and is partially deferred. We do not fake live data, fake savings, or fake decisions. When something is live, it will be labeled live. When something is deterministic, it is labeled deterministic. That separation is non-negotiable."

---

## Recovery playbook (when things break mid-demo)

- Page does not load → switch to backup screenshot deck without breaking eye contact
- Console error visible → close devtools, do not address on stage
- Network drops → segue to story arc summary; recover with screenshots
- Question you cannot answer → "Let me come back to that with the readiness page open"
- Audience challenges honesty of a number → agree; show the deterministic caveat; move on
- Audience asks about pricing → defer to follow-up; pilot is co-built, not menu-priced
- Audience asks about a competitor → "We focus on what AbarVa does. Happy to compare in a follow-up."

---

## Founder sign-off

- Reviewer name: ________________________
- Date: ________________________
- Demo length used: 10 / 20 / 45
- Audience reaction (one line): ________________________
- Follow-ups identified (bullets): ________________________
- Pilot scoped (Y/N): ________________________
- Honesty boundaries held (Y/N): ________________________

---

## Appendix A — Per-station word budgets

The 10-minute version is paced for ~120–150 words per minute. Keep each station to roughly:
- Open: 60 words
- Phase rail: 90 words
- Gate: 150 words
- Workshop canvas: 200 words
- Deliverables: 200 words
- Action / mission strip: 200 words
- Pilot ask: 100 words

If you find yourself over budget, cut adjectives, not content.

---

## Appendix B — Things the audience usually asks (and what to say)

- "Is this connected to our system?" → "Not today. Today the canvas is deterministic. Live ingestion is sequenced and named on our readiness page."
- "Where does the data come from?" → "Seed scenarios curated by our team. The canvas is populated from that seed."
- "Can we run it on our cloud?" → "The Private Data Plane lab targets Azure customer-tenant deploy. It's documented in our readiness page; live deploy is sequenced."
- "How does this compare to [PMO tool]?" → "We don't position against PMO tools in a demo. The shape of the Program page is the answer. Happy to take that offline."
- "What does the AI do?" → "Today: scopes workshops, surfaces tensions, drafts decisions, validates evidence, all from deterministic seeds. Tomorrow: same surfaces, live runtime."
- "When can we go live?" → "Pilot in six weeks. Live ingestion and runtime are sequenced on the readiness page, typically a 3-to-6 month horizon."
- "Who's running this in production today?" → "No customer is in production today. We will name them when there are. Today we have a pilot pipeline; we'd like you in it."

---

## Appendix C — Honesty checklist (post-demo)

Mark Y/N immediately after the session. If any answer is N, the demo went off-track and the script needs revisiting.

- [ ] I never said "live" about a deterministic surface
- [ ] I never quoted a fake date as real
- [ ] I never promised features not on the readiness page
- [ ] I named the four agents
- [ ] I showed the gate's missing inputs
- [ ] I showed at least one blocked mission
- [ ] I delivered the pilot ask in the version matching the duration
- [ ] I held the deterministic caveat verbatim if challenged
- [ ] I did not disparage a competitor
- [ ] I did not promise pricing on the spot
