# AbarVa Programs · Test-Drive and Module Experience Specification

**How Programs feels when you actually use it.**

This document has two related purposes.

**Purpose 1 · Test-Drive Readiness.** Anand (or any user) should be able to sit down and create 10+ Programs across varied archetypes in one session, walking each through Nexus's phase modules, without hitting walls. Today, the product doesn't hold up to that test. This spec inventories every friction point and specifies the engineering work to remove it.

**Purpose 2 · Module Experience.** Nexus's phase modules need to feel like a senior consultant running the engagement with you. Not a stub that says "Phase 3 started" and waits for input. Each phase needs scaffolding, prompts, artifact templates, and Nexus behaviors that make the experience substantive. This spec details what each module should feel like.

Both purposes are the same work from different angles. Test-Drive Readiness tells Claude Code what to unblock. Module Experience tells Codex what to design and Claude Code what to build. The two tracks compose into a product that holds up to real use.

Reads alongside:
- `docs/specs/programs/design-spec.md` — surface-level design, phase structure, artifact inventory
- `docs/specs/platform/agent-architecture.md` — Nexus's tool belt, system prompt, refusal patterns
- `docs/specs/platform/design-system.md` — canonical tokens and components
- `docs/specs/platform/data-layer-future-state.md` — Genome lifecycle that backs Nexus's pattern surfacing
- `docs/specs/_meta/page-design-backlog.md` — page inventory where this spec's designs become concrete

## Document structure

Seven packets organized into two tracks.

**Track A · Test-Drive Readiness** (Packets 1-3)
1. The test-drive use case · why it matters · `test_drive_mode` architecture
2. Friction inventory · every wall a user hits when creating Program 1 through Program 10
3. Seed data requirements · what must exist in the database before test drive is possible

**Track B · Module Experience** (Packets 4-7)
4. Phase 1 · Ideation · the blank-canvas moment and how to make it not scary
5. Phases 2-3 · Validation and Charter · the commitment gates
6. Phases 4-5 · Diagnosis and Design · the content-heavy middle
7. Phases 6-7 · Build/Deploy and Verify · the shipping and attestation arc

Each packet locks decisions and closes with a checkpoint.

---

# PACKET 1 · The Test-Drive Use Case

## 1.1 Why test-drive matters as a specific concern

A product like AbarVa has three distinct user populations, each with different needs:

**Population 1 · Anand as founder-in-product.** The person who knows what AbarVa should be, who needs to validate whether what we're building matches that vision, who needs to catch UX issues before clients do. Creating 10+ programs across archetypes is how this validation happens. Without it, bugs and gaps surface during demos or client work — expensive.

**Population 2 · Prat (and future design partners).** First-time users who experience the product cold. If Program creation is slow or breaks mid-flow, the impression is "this is a prototype," not "this is a platform." Test-drive readiness is directly how the product feels to them.

**Population 3 · Eventual clients.** The day-to-day users — sponsors, owners, Maestros creating real engagements. If creating a Program takes 15 minutes of form-filling, adoption drops. If phase progression hits a dead-end in Phase 3 because the Diagnosis module isn't wired, the product gets abandoned.

All three populations have the same underlying need: **the Program creation and module experience needs to be frictionless and substantive.** Test-drive readiness is the compressed, worst-case version of that need. If we make the experience hold up for 10 programs in one founder session, we've implicitly made it hold up for the other two populations.

## 1.2 The test-drive promise

When Anand (or anyone) sits down to test-drive Programs, the following should be true:

**Promise 1 · Sub-2-minute creation.** From "I want to create a new program about [X]" to "I'm in Phase 1 looking at a pre-populated charter draft" takes under 2 minutes. No multi-page forms, no waiting for data lookups, no "please complete your profile first."

**Promise 2 · No dead ends.** Every phase module is enterable. Every artifact is editable. Every gate has a defined exit path even if criteria aren't fully met (with honest "we're unblocking this by hand" language, not silence).

**Promise 3 · Nexus has substance at every phase.** Nexus's opening message is specific to the phase and the program archetype. Nexus's suggestions reference real Genome patterns. Nexus's refusals route clearly. Test drive #7 doesn't feel like test drive #1.

**Promise 4 · State persists.** Close the tab, come back tomorrow, pick up exactly where you left off. Programs you create today are there next week. No "session expired" data loss.

**Promise 5 · Test programs don't pollute.** Programs created for test-drive don't show up in Apex's Tower aggregates as if they're real. Tower's $18.4M portfolio number doesn't inflate because Anand created 10 test programs in one evening.

**Promise 6 · Bulk operations.** Creating 10 programs doesn't require 10 disconnected flows. Authoring a program from an existing archetype, duplicating a program, bulk-deleting test programs — all first-class.

These six promises shape the rest of this document.

## 1.3 `test_drive_mode` architecture

The cleanest way to support test drives without building a separate tenant or sandbox is a flag on the Program entity that changes its behavior across the platform.

### Schema addition

```sql
ALTER TABLE engagements 
  ADD COLUMN IF NOT EXISTS test_drive_mode BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS engagements_test_drive_idx 
  ON engagements (client_id, test_drive_mode) 
  WHERE test_drive_mode = TRUE;
```

### Behavior implications

When `test_drive_mode = TRUE`:

**In Programs surface:**
- Program shows with a "TEST DRIVE" badge in the header (amber background, small)
- All normal Program functionality works identically
- Creator can bulk-delete all their test-drive Programs with one action
- Creator can "promote to real program" if a test drive turns into actual work

**In Tower surface:**
- Test-drive Programs do NOT appear in portfolio aggregates (the 34 use cases count excludes them)
- Test-drive Programs do NOT contribute to cohort benchmarks
- Test-drive Programs do NOT count toward Shadow AI or contradiction signal generation
- Test-drive Programs ARE visible in the "Use Cases" list with the badge, filterable via a "Hide test-drive" toggle (on by default)

**In Intelligence surface:**
- Threads originated from test-drive Programs get the same flag
- Test-drive threads don't contribute to Genome pattern observation counts
- Promoting a test-drive thread to a Program creates another test-drive Program unless explicitly promoted

**In Agent behavior:**
- Nexus opening message includes "Test drive mode — responses marked in telemetry"
- Atlas ignores test-drive Programs when asked about "my portfolio"
- Nexus/Sentinel message traces are tagged `source: test_drive` in telemetry so they're excluded from training data
- Responses are otherwise identical to real program responses

**In data layer:**
- Test-drive Program data never feeds Genome pattern candidates
- Test-drive observations never contribute to cohort benchmarks
- Test-drive attestations never contribute to trustworthiness score calibration
- But test-drive Programs DO exercise the full graph — they just carry a filter property

### The bulk-cleanup action

Programs surface needs a "Test drive" utility menu (only visible when user has `test_drive_mode` Programs):

```
Test Drive Utility
─────────────────────
You have 12 test-drive Programs across 2 clients.

▢ Apex Retail Group (8 programs)
▢ First Capital Financial (4 programs)

[Archive selected] [Delete selected] [Promote selected to real]
```

Deletion is hard delete. These are throwaway programs by design. No soft-delete tombstoning.

### Why this approach over alternatives

Considered and rejected:

**Alternative A · Separate test tenant.** Create a `test-drive` tenant and push all test programs there. Rejected because: the whole point of test-driving is experiencing the product as a real user at a real client would. A separate tenant feels different — different data, different scope — and doesn't validate the real experience.

**Alternative B · In-memory sandbox.** Programs exist only in browser state, never persist. Rejected because: state persistence is one of the six promises. A sandbox that loses state defeats the multi-session nature of real use.

**Alternative C · Role-based filtering.** Only Anand's user sees test-drive Programs. Rejected because: we want to let Prat or design partners test-drive too, and they aren't admins. Also, testing whether Atlas correctly excludes test-drive from aggregates requires the flag to be a property of the data, not the viewer.

The flag-on-entity approach is the cleanest.

## 1.4 The 10 test-drive archetypes

To make test-drive concrete, here are 10 program archetypes Anand would plausibly create across 1-2 sessions. Each exercises a different part of the product.

| # | Archetype | Client | Function | Objective | Phase to Test-Drive To |
|---|---|---|---|---|---|
| 1 | Contact Center AI | Apex Retail | Front Office | Optimize | Phase 5 Build/Deploy |
| 2 | Demand Forecasting | Apex Retail | Middle Office | Optimize | Phase 7 handoff ceremony |
| 3 | AI Supplier Consolidation | Apex Retail | Back Office | Protect | Phase 1 Ideation (via Path 3) |
| 4 | Dynamic Pricing | Apex Retail | Front Office | Grow | Phase 3 Charter |
| 5 | HR Resume Screening | Apex Retail | Back Office | Optimize | Phase 6 Build (then sunset flow) |
| 6 | Claims Denial Reduction | First Capital FS | Middle Office | Protect | Phase 4 Diagnosis |
| 7 | Wealth Advisor Copilot | First Capital FS | Front Office | Grow | Phase 2 Validation |
| 8 | KYC Automation | First Capital FS | Back Office | Optimize | Phase 5 Design |
| 9 | Trading Floor Research Assistant | First Capital FS | Front Office | Grow | Phase 1 Ideation |
| 10 | Risk Model Validation | First Capital FS | Middle Office | Protect | Phase 6 Verify |

Across these 10, every phase gets exercised. Both active industries (retail + FS) are tested. Every function (front/middle/back) is covered. All three objectives (grow/optimize/protect) are represented. Three lifecycle endings (steady-state, sunset, active) appear.

**The test-drive readiness bar:** Anand can create all 10 in a single 3-hour session without hitting a wall that requires Claude Code intervention. This is the acceptance criteria for "test-drive ready."

## 1.5 How this shapes what gets built

The test-drive promise implies concrete engineering work:

**Work item 1 · `test_drive_mode` flag architecture.** Migration, backfill, UI badges, exclusion logic in Tower aggregates, cleanup utility.

**Work item 2 · Fast Program creation flow.** Under 2 minutes from intent to Phase 1. Requires scaffolded charter drafts by archetype, default stakeholder assignments, skip-optional-fields workflows.

**Work item 3 · Phase module substance.** Every phase has enough substance that test drive #7 doesn't feel like test drive #1. Detailed in Track B of this spec.

**Work item 4 · Seed data for demos.** Genome patterns seeded by archetype so Nexus has real patterns to surface. Industry cohort data so Intelligence has real comparables. Detailed in Packet 3.

**Work item 5 · Bulk operations.** Template-based Program creation, duplication, bulk deletion.

**Work item 6 · State persistence and recovery.** Autosave at every step. Draft Programs survive session end. Unfinished Phase 3 Diagnosis pick up exactly where left off.

Each gets a detailed treatment in subsequent packets.

## 1.6 Decisions locked in Packet 1

| # | Decision | Rationale |
|---|---|---|
| 1.L1 | `test_drive_mode` is a BOOLEAN flag on engagements table, not a separate tenant | Realistic experience with production plumbing |
| 1.L2 | Test-drive Programs hide from Tower aggregates and cohort benchmarks | Don't pollute real portfolio metrics |
| 1.L3 | Test-drive data does NOT feed Genome pattern observation or cohort calibration | Protects data layer from throwaway data |
| 1.L4 | Bulk delete utility is first-class, not an admin action | Essential for iterative test-driving |
| 1.L5 | 10 canonical test-drive archetypes across 2 clients × 3 functions × 3 objectives | Exercises every phase and surface |
| 1.L6 | Test-drive acceptance criteria: 10 Programs created to target phase in one session without intervention | Clear, falsifiable bar |
| 1.L7 | Test-drive Programs get "TEST DRIVE" badge, visible everywhere they appear | User always knows data class |
| 1.L8 | Test-drive telemetry tagged `source: test_drive` for training data exclusion | Protects future model fine-tuning |

## 1.7 Open decisions for later packets

- Specific friction items inventory · Packet 2
- Seed data requirements · Packet 3
- Per-phase module experience · Packets 4-7

---

## Packet 1 · Checkpoint

**STATUS · Track A, Packet 1 of 7 complete**

Test-drive use case defined. `test_drive_mode` architecture specified. Six promises locked. Ten canonical archetypes listed as acceptance criteria. Ready for Packet 2 (friction inventory).

---

# PACKET 2 · Friction Inventory

Every wall a user hits when trying to create and progress through Programs. Categorized, severity-rated, and specified for remediation.

## 2.1 How friction was inventoried

The inventory is built from three sources:

1. **The user flow for test-drive archetype #1 (Contact Center AI)** walked step-by-step from "I want to create a new program" through Phase 5 Build/Deploy. Every click, every form field, every moment of "what do I do now?" logged.

2. **Cross-referencing against all 7 phases** for phase-specific friction. Phase 1 Ideation has different friction than Phase 6 Verify.

3. **The six test-drive promises in Packet 1.2** as acceptance criteria. Each friction item either blocks a promise or adds cost to fulfilling it.

## 2.2 Friction categories

Each friction item falls into one of six categories:

**Category A · Creation friction.** Walls between "I want to create" and "I'm in Phase 1 looking at a charter."

**Category B · Progression friction.** Walls when moving between phases or within a phase module.

**Category C · Content friction.** Emptiness or sparseness that makes phases feel hollow.

**Category D · Nexus friction.** Moments Nexus feels stub-like, repetitive, or unhelpful.

**Category E · State friction.** Data loss, session issues, persistence gaps.

**Category F · Meta friction.** Issues spanning multiple phases or surfaces — test-drive bulk operations, cross-program references, etc.

## 2.3 Severity rating

Each item rated:

- 🔴 **Blocker** — test drive fails without resolution. Must fix before test-drive acceptance.
- 🟡 **Serious** — test drive completes but experience is bad. Fix within first iteration cycle.
- 🟢 **Polish** — test drive works well; item is refinement. Fix over time.

## 2.4 Category A · Creation friction

### A-1 · "How do I even start?" 🔴

**Current state:** When a user navigates to `/programs`, they see the portfolio list. There's a "Create Program" button somewhere but what it does next is unclear — does it open a long form? A wizard? A blank charter?

**Friction:** The user has to discover the creation flow by trial. If the flow takes them to a multi-field form, they bail.

**Remediation:** The Programs portfolio page has a clear, prominent "Create Program" button. Click opens a single modal with three options:

1. **Start from a Genome archetype** (fastest — pre-populated charter from pattern library)
2. **Start from a related signal** (Path 3 — if Tower has active signals)
3. **Start blank** (slowest — empty charter)

Anand picks option 1 for test-drive speed. Client users pick option 1 or 2 most of the time. Option 3 is rare.

**Acceptance:** Creation flow starts in <5 seconds from "I want to create" to "choosing a path."

### A-2 · Archetype library is empty 🔴

**Current state:** Even if we offer "Start from a Genome archetype," the Genome library has maybe 1-2 seeded patterns. Selecting an archetype for "Contact Center AI" returns nothing useful.

**Friction:** The fastest path becomes dead. User is forced into blank charter, which takes 15+ minutes to author.

**Remediation:** Seed the Genome with 20 archetypes at launch — the 10 test-drive archetypes from Packet 1.4 plus 10 more common enterprise patterns (Customer Service AI, Code Generation Assistant, Document Intelligence, Fraud Detection, Inventory Optimization, Marketing Content Gen, Meeting Summarization, Sales Forecasting, Supply Chain Visibility, Workforce Analytics).

Each archetype includes:
- Typical problem statement
- Scope defaults (what's in, what's out)
- Standard success metrics for this archetype
- Typical phase durations
- Known risks (from failure-mode catalog)
- Suggested stakeholder roles (VP-level sponsor, Director-level owner, etc.)

Detailed in Packet 3.

**Acceptance:** 20 archetypes seeded. User picking "Contact Center AI" gets a pre-populated charter 80% complete in 10 seconds.

### A-3 · Required fields block save 🔴

**Current state:** Charter creation requires fields like Sponsor, Owner, Maestro before save. If the user doesn't know who these should be yet, they can't save a draft.

**Friction:** Test-drive user creating archetype #4 has no real sponsor in mind. Flow halts. They invent a fake name, or they abandon.

**Remediation:** Save as draft with NO required fields. A Program can exist with just a name. All other fields optional until Phase 3 Charter gate (where completeness becomes a real constraint).

For test-drive mode specifically: auto-fill sponsor/owner/maestro with plausible placeholders when missing ("[Sponsor: VP to be named]", "[Owner: Director to be named]", "[Maestro: Ava Chen]"). Real programs prompt the user to fill these in before progressing to Phase 2.

**Acceptance:** User creates a Program with only the name filled. Program appears in portfolio. User can progress to Phase 1 content immediately.

### A-4 · Client selection friction 🟡

**Current state:** A Program belongs to a client. If the user has multiple clients in their workspace, they have to pick. If they have one client, it should auto-select.

**Friction:** Default behavior unclear. Test-drive user creating 10 programs across 2 clients has to re-specify client each time.

**Remediation:** Remember last-used client in user preferences. Pre-fill on creation flow. User can change via dropdown.

**Acceptance:** 2nd through 10th Program creation defaults client correctly.

### A-5 · Naming friction 🟢

**Current state:** User must author a distinct program name. No suggestions. No name collision handling.

**Friction:** Minor. Test drive for "Contact Center AI" might conflict with an existing Program name.

**Remediation:** Name field suggests archetype-based defaults ("Contact Center AI Program", "Contact Center AI · Apex Retail"). Collision detection warns on save.

### A-6 · Source attribution friction 🟢

**Current state:** A Program originated from a Tower signal should show that lineage. Currently only tracked in a hidden metadata field.

**Friction:** Low. Nexus's opening message can't differentiate Path 3 origination from fresh creation.

**Remediation:** Visible "Originated from: Tower signal · Shadow AI" banner when applicable. Nexus opening message acknowledges it.

## 2.5 Category B · Progression friction

### B-1 · Phase gate criteria are unreadable 🔴

**Current state:** Closing Phase 1 to enter Phase 2 requires gate criteria to be met. Currently shown as a list of strings like "Charter draft complete" — but no visibility into what "complete" means or what's blocking.

**Friction:** User hits "Advance to Phase 2", gets an error, doesn't know why. Frustration and abandonment.

**Remediation:** Gate criteria component with explicit state per criterion:

```
Phase 1 · Ideation — Gate Criteria

✅ Problem statement articulated
✅ Hypothesized solution shape
🟡 Sponsor identified (currently: placeholder)
   └── Fill in real sponsor to clear this
⬜ Initial scope defined
   └── Add scope bullets to charter draft
```

Each criterion clickable to jump to the field. Gate button disabled with hover tooltip explaining what's blocking.

**Acceptance:** User can see exactly what's missing and resolve in-place.

### B-2 · "Advance to Phase N+1" loses context 🔴

**Current state:** Advancing phase transitions the page. The user loses sight of decisions they just locked, artifacts they just authored.

**Friction:** Phase transition feels jarring. User can't confirm they did the right thing before moving on.

**Remediation:** Phase transition shows a confirmation modal:

```
Close Phase 1 · Ideation and enter Phase 2 · Validation?

Phase 1 Summary (what you accomplished):
  ✓ Charter draft v1 authored
  ✓ 3 decisions logged
  ✓ Sponsor aligned
  
Phase 2 · Validation focuses on:
  • Feasibility assessment
  • Sponsor final sign-off
  • Stakeholder alignment

[Stay in Phase 1] [Close Phase 1 and advance]
```

**Acceptance:** User feels confident about phase transition. Can review before committing.

### B-3 · Phase 2, 4, 7 are under-developed 🔴

**Current state:** Phase 1 and Phase 5 have workable UI. Phases 2, 4, 7 are thin or placeholder.

**Friction:** Test-drive archetypes 6, 7, 8, 10 all need to reach phases that don't have content.

**Remediation:** Every phase has at least minimum viable module experience. Detailed in Packets 4-7.

**Acceptance:** Every phase has a landing, a primary artifact, gate criteria, and Nexus behavior specific to the phase.

### B-4 · Nothing happens when you enter a phase 🟡

**Current state:** User enters Phase 3 Diagnosis. Sees phase ribbon, sees empty artifact workspace. No guidance on what to do.

**Friction:** Blank-canvas paralysis. User sits there wondering how to start.

**Remediation:** On phase entry, Nexus proactively greets:

```
"Phase 3 · Diagnosis. Here's what we typically accomplish here:

1. Situation Intelligence — what's actually happening today?
2. Root-cause analysis — why is it happening?
3. Baseline metrics — where are we starting from?

Ready to run Situation Intelligence first? It pulls from our 
diagnostic frameworks and generates a baseline deck in about 
5 minutes."

[Run Situation Intelligence] [Show me the template] [I'll draft manually]
```

Every phase has a "here's what happens here, here's how to start" opener.

**Acceptance:** Phase landing always has a next-action suggestion.

### B-5 · Skip-phases scenario is unclear 🟢

**Current state:** A Program originated via Path 3 from a strong Tower signal might be legitimately skippable through Phase 1 and 2 (the signal IS the ideation and validation). But skip logic is unclear.

**Friction:** Low for test-drive. Higher for real Path 3 scenarios.

**Remediation:** Phase ribbon shows skipped phases with a "Skipped on [date] — reason: [origination context]" overlay. Allows going back if the skip was premature.

## 2.6 Category C · Content friction

### C-1 · Artifact workspace is a blank editor 🔴

**Current state:** Phase 1 charter is a blank rich-text field. Phase 3 diagnosis deck is a blank rich-text field. Phase 5 build plan is a blank rich-text field.

**Friction:** Every phase feels like homework. Test-drive user hits this 10 times and hates it.

**Remediation:** Every artifact has scaffolded structure. Charter has sections: Problem Statement, Hypothesis, Scope, Stakeholders, Success Metrics, Risks. Diagnosis Deck has sections: Current State, Root Causes, Evidence, Baseline Metrics, Path Forward. Build Plan has sections: Architecture, Team, Timeline, Milestones, Risks, Go-Live Criteria.

Each section has:
- Heading
- Prompt ("What problem does this solve? Be specific about the business pain.")
- Example content from the archetype library
- "Nexus suggestion" inline — Nexus offers a draft the user can accept/edit/reject

**Acceptance:** User arrives in a phase artifact and finds scaffolding + prompts + drafts, not emptiness.

### C-2 · Intelligence products don't wire in 🔴

**Current state:** Phase 3 Diagnosis should invoke Situation Intelligence. Phase 4 Design should invoke Technology Intelligence. The specs say this but the plumbing isn't built.

**Friction:** User clicks "Run Situation Intelligence" in Phase 3 and either nothing happens or they get a placeholder.

**Remediation:** Intelligence products are invocable from within Programs phases. Invocation creates a thread inline, pulls relevant context from the Program, returns a diagnostic deck that integrates with the phase's artifact.

**Acceptance:** From Phase 3, clicking "Run Situation Intelligence" opens a contextualized Sentinel thread, produces a deck, and the deck is visible within the Program.

### C-3 · Decision log is empty and boring 🟡

**Current state:** Right-rail decision log shows "No decisions logged yet." User has no sense of what decisions matter.

**Friction:** Low impact on flow, but contributes to the "hollow" feeling.

**Remediation:** Decision log includes:
- Phase entry events (auto-logged)
- Sponsor sign-offs (logged when user confirms)
- Scope changes (logged when charter edited)
- Genome pattern applications (logged when Nexus surfaces one)
- Gate closures (logged per phase)

Shows real activity, not just manual entries.

### C-4 · Team section is empty 🟡

**Current state:** Team roster shows sponsor, owner, maestro. For Programs with real teams of 8-12 people, that's insufficient.

**Friction:** Test-drive archetype #1 (Contact Center AI) has 12 team members. Entering all 12 is tedious.

**Remediation:** Team section supports roles beyond the core three: Engineering Lead, Data Lead, Product Lead, Security Reviewer, Change Manager, Training Lead, etc. Each role has "[Name TBD]" default. Bulk-import from CSV or paste-and-parse supported.

### C-5 · Phase-specific artifacts don't exist yet 🔴

**Current state:** Phase 4 should have a Solution Architecture artifact. Phase 6 should have a Verification Report. These artifacts don't exist — only a generic "phase workspace" does.

**Friction:** Every phase feels the same because the artifact is the same.

**Remediation:** Each phase has its canonical artifact type:

| Phase | Canonical Artifact |
|---|---|
| 1 · Ideation | Charter Draft |
| 2 · Validation | Feasibility Assessment |
| 3 · Charter | Charter (locked version) |
| 4 · Diagnosis | Diagnosis Deck |
| 5 · Design | Solution Architecture |
| 6 · Build/Deploy | Build Plan + Runbook |
| 7 · Verify | Verification Report + Baseline Lock |

Each is a distinct artifact with its own scaffolding and Nexus behaviors. Detailed in Packets 4-7.

## 2.7 Category D · Nexus friction

### D-1 · Nexus opens every Program the same way 🔴

**Current state:** Nexus says "I'm Nexus, focused on [name]." regardless of archetype, phase, or context.

**Friction:** Test drive #2 feels identical to test drive #1. Test drive #5 is tedious.

**Remediation:** Nexus's opening message varies by:

- **Archetype:** "Contact Center AI" gets customer-experience-flavored language; "AI Supplier Consolidation" gets procurement-flavored language
- **Phase:** Phase 1 opens with ideation framing; Phase 5 opens with build framing
- **Context:** Path 3 origination references the signal; blank-start doesn't
- **State:** Returning user gets "Picking up from [where we left off]" instead of full intro

Detailed in Packets 4-7 per phase.

**Acceptance:** 10 test-drive program openings feel distinct.

### D-2 · Nexus doesn't surface Genome patterns 🔴

**Current state:** Genome library is sparsely seeded (Packet 2.4 remediation addresses seeding). But even seeded, Nexus isn't wired to retrieve and surface patterns proactively.

**Friction:** User never sees the "here's a pattern from past engagements" moment that makes Nexus feel smart.

**Remediation:** Nexus proactively surfaces patterns at:

- Phase 1: "Here are 3 common archetypes that match your problem. Want to start from one?"
- Phase 3: "I'm seeing the root causes match a pattern we've seen in 5 past engagements. Want me to apply the pattern's diagnostic framework?"
- Phase 5: "Based on this archetype, the Genome suggests these two reference architectures. Want to compare?"
- Phase 6: "Common risks at this phase for this archetype include X, Y, Z. Want me to add them to the gate criteria?"

**Acceptance:** Across 10 test-drives, Nexus surfaces at least 3-4 patterns per Program, specific to the archetype.

### D-3 · Nexus doesn't remember context across phases 🟡

**Current state:** Nexus's responses in Phase 3 seem to forget what was decided in Phase 1.

**Friction:** User has to re-explain context at every phase. Makes Nexus feel amnesiac.

**Remediation:** Nexus's per-program memory includes all artifacts across completed phases + the decision log. Nexus explicitly references prior phase content when relevant.

Example, entering Phase 4:
```
"Picking up from Phase 3 Diagnosis — we established that root causes 
are fragmented tooling (3 tools), no single-sign-on, and overrides 
rate at 18%. Phase 4 Design is where we pick the solution shape. Three 
Genome patterns match this root cause profile. Want me to walk through 
them?"
```

**Acceptance:** Nexus in Phase N references decisions from Phase N-1 without user re-explaining.

### D-4 · Nexus doesn't celebrate progress 🟢

**Current state:** Advancing through phases feels transactional — no acknowledgment of what was accomplished.

**Friction:** Contributes to "hollow" feeling. Low severity, high polish opportunity.

**Remediation:** At each phase closure, Nexus acknowledges what was done: "Phase 3 wrapped. You locked 5 decisions, produced a diagnosis deck, and aligned with Priya. That's solid foundation for Phase 4."

Small, warm, specific. Not celebratory in an AI-cheerful way. Just acknowledging.

## 2.8 Category E · State friction

### E-1 · Draft programs don't persist 🔴

**Current state:** User starts creating a Program, navigates away before saving, loses everything.

**Friction:** Test-drive user abandons #3 mid-creation to answer an email. Comes back. #3 is gone.

**Remediation:** Autosave every 5 seconds during creation. Draft programs appear in portfolio with a "Draft" badge. Can resume from portfolio at any time.

**Acceptance:** Navigate-away-and-return always restores state.

### E-2 · Session expiration loses work 🔴

**Current state:** Auth session times out. User returns to see "session expired" and loses in-progress work.

**Friction:** Multi-day test-drive (realistic — you'll spread 10 programs across 2-3 sessions) hits this repeatedly.

**Remediation:** Work is saved before session expiry. On re-authentication, user lands back where they were.

**Acceptance:** 24-hour gap between sessions preserves all state.

### E-3 · Unsaved changes warnings 🟡

**Current state:** Navigating away from a Phase with unsaved edits shows no warning.

**Friction:** Accidental data loss.

**Remediation:** Browser `beforeunload` event warns on unsaved changes. In-app navigation shows "Unsaved changes — save first?" modal.

### E-4 · Draft vs published state is invisible 🟢

**Current state:** A charter draft and a published charter look identical.

**Friction:** User doesn't know which is which.

**Remediation:** Draft state shown with visual differentiation — subtle banner "Draft v3 · last saved 14s ago". Published state shows "Published v1 · locked on April 18".

## 2.9 Category F · Meta friction

### F-1 · Can't bulk-create test-drive programs 🔴

**Current state:** Creating 10 programs means 10 separate creation flows.

**Friction:** Test-drive velocity drops. After #5 you're tired.

**Remediation:** Bulk-create UI (admin/test-drive utility only):

```
Bulk-Create Test Programs

Client: [Apex Retail ▼]

Archetypes to create:
☑ Contact Center AI      → target phase: 5
☑ Demand Forecasting     → target phase: 7 (steady-state)
☑ AI Supplier Consolidation → target phase: 1
☑ Dynamic Pricing        → target phase: 3
☑ HR Resume Screening    → target phase: 6 (then sunset)

[Create 5 Programs]
```

Click creates 5 Programs pre-populated with archetype data, all flagged `test_drive_mode = TRUE`. User then navigates into each to test-drive the module experience.

**Acceptance:** 10 Programs created in <2 minutes.

### F-2 · Can't duplicate a program 🟡

**Current state:** No "Duplicate this Program" action.

**Friction:** Authoring archetype #7 that's similar to #3 means starting over.

**Remediation:** "Duplicate" action on Program detail view. Creates a copy with "(Copy)" suffix, clears signatures and attestations, preserves artifact structure.

### F-3 · Can't cross-reference between Programs 🟡

**Current state:** Program A might have decided something relevant to Program B. No way to link.

**Friction:** Test-drive scenarios where #4 Dynamic Pricing depends on #1 Contact Center AI's data decisions can't be modeled.

**Remediation:** Decision log entries can reference other Programs via link. Artifact content can embed "See: [Program Name] · [Phase] · [Decision]" references that resolve to live data.

### F-4 · Test-drive cleanup requires clicking into each program 🔴

**Current state:** Even if bulk-create exists, bulk-delete doesn't. Cleanup takes 10 clicks.

**Friction:** After test-drive, cleaning up is tedious. User leaves programs behind, polluting portfolio.

**Remediation:** "Clean up test drive" utility in portfolio — see Packet 1.3.

**Acceptance:** Delete all 10 test-drive programs in one confirmed action.

## 2.10 Summary · friction inventory by severity

| Category | 🔴 Blocker | 🟡 Serious | 🟢 Polish | Total |
|---|---|---|---|---|
| A · Creation | 3 | 1 | 2 | 6 |
| B · Progression | 3 | 1 | 1 | 5 |
| C · Content | 3 | 2 | 0 | 5 |
| D · Nexus | 2 | 1 | 1 | 4 |
| E · State | 2 | 1 | 1 | 4 |
| F · Meta | 2 | 2 | 0 | 4 |
| **Total** | **15** | **8** | **5** | **28** |

**Blockers to resolve before test-drive acceptance: 15 items.**  
**Serious items to resolve in first iteration: 8 items.**  
**Polish items to resolve over time: 5 items.**

## 2.11 Remediation work packages

The 15 blockers group into 5 implementable work packages:

**Package 1 · Creation flow rebuild** (A-1, A-2, A-3)
- Three-option creation modal
- Genome archetype library (20 seeded archetypes)
- Optional-fields-only save

Effort: 1 week of Claude Code + 1 Codex design pass.

**Package 2 · Phase progression UX** (B-1, B-2, B-3, B-4)
- Gate criteria component with in-place editing
- Phase transition confirmation modal
- Minimum viable module experience for Phases 2, 4, 7
- Phase entry greeting from Nexus

Effort: 2 weeks Claude Code + Codex design for phases 2, 4, 7.

**Package 3 · Artifact scaffolding + Intelligence wiring** (C-1, C-2, C-5)
- Scaffolded artifacts per phase (7 distinct artifact types)
- Intelligence product invocation from within phases
- Phase-specific workspace UI

Effort: 2-3 weeks combined.

**Package 4 · Nexus depth** (D-1, D-2)
- Archetype-aware opening messages (per-phase, per-archetype)
- Proactive Genome pattern surfacing at key moments

Effort: 1 week (system prompt work + Genome retrieval wiring).

**Package 5 · State + bulk operations** (E-1, E-2, F-1, F-4)
- Autosave and session recovery
- Bulk-create utility for test-drive
- Bulk-delete utility for test-drive cleanup

Effort: 1 week.

**Total engineering effort: 7-8 weeks of focused Claude Code work** to achieve test-drive readiness. This can run in parallel with design work (Codex).

## 2.12 Decisions locked in Packet 2

| # | Decision | Rationale |
|---|---|---|
| 2.L1 | 28-item friction inventory across 6 categories | Comprehensive, actionable |
| 2.L2 | Three-severity rating: blocker/serious/polish | Prioritization framework |
| 2.L3 | Test-drive acceptance gates on 15 blocker resolution | Clear acceptance |
| 2.L4 | Work grouped into 5 implementable packages | Parallelizable scope |
| 2.L5 | Creation flow is three-option modal, not blank form | Speed + guidance |
| 2.L6 | Every artifact has scaffolded structure, not blank editor | No blank-canvas paralysis |
| 2.L7 | Every phase entry has Nexus greeting with next-action suggestion | No emptiness |
| 2.L8 | Autosave every 5 seconds on all artifacts | Data loss prevention |
| 2.L9 | Bulk-create + bulk-delete first-class for test-drive | Velocity |

---

## Packet 2 · Checkpoint

**STATUS · Track A, Packet 2 of 7 complete**

28 friction items inventoried and prioritized. 5 remediation work packages defined with effort estimates. 7-8 weeks of Claude Code work quantified. Ready for Packet 3 (seed data requirements).

---

# PACKET 3 · Seed Data Requirements

Test-drive readiness depends on substantive seeded data. A user creating 10 Programs expects Nexus to surface real patterns, Intelligence products to return real analysis, and Genome archetypes to feel earned. This packet specifies what must exist in the database before test-drive is possible.

## 3.1 Seed data categories

Six categories of seed data are needed:

**Category 1 · Genome archetype library** — 20 archetypes that cover common AI program shapes
**Category 2 · Genome solution pattern library** — 30-40 solution patterns linked to archetypes
**Category 3 · Failure mode library** — 15-20 known failure patterns with remediation
**Category 4 · Reference architecture library** — 10-12 technical blueprints per common archetype
**Category 5 · Intelligence product fixtures** — canned outputs for Situation/Cost/Risk/etc when invoked on seed archetypes
**Category 6 · Industry cohort data** — anonymized peer data for retail + FS to make Tower cohort comparisons real

Each category specified below with schema, seeding method, and volume.

## 3.2 Category 1 · Genome archetype library

### Schema

```yaml
archetype:
  id: string
  name: string
  short_description: string  # one-line
  long_description: markdown  # 2-3 paragraphs
  function: enum(front_office, middle_office, back_office)
  objective: enum(grow, optimize, protect)
  industries_applicable: [string]  # ["retail", "financial_services", "healthcare", etc.]
  industries_primary: [string]  # strongest fit
  typical_problem_statement: markdown
  typical_hypothesis: markdown
  typical_scope_inclusions: [string]
  typical_scope_exclusions: [string]
  standard_success_metrics: [
    { metric_name, description, typical_target_range }
  ]
  typical_stakeholder_roles: [
    { role, seniority_level, expected_involvement }
  ]
  typical_phase_durations: {
    phase_1_days, phase_2_days, phase_3_days,
    phase_4_days, phase_5_days, phase_6_days, phase_7_days
  }
  typical_team_size_range: {min, max}
  typical_cost_range_usd: {
    build_phase: {min, max},
    operating_monthly: {min, max}
  }
  known_risks: [risk_id]  # links to failure_modes
  related_solution_patterns: [pattern_id]
  reference_architectures: [arch_id]
  confidence_tier: enum(strong, moderate, weak)  # per Data Layer spec Packet 5
  last_validated: date
  evidence_base: [
    { engagement_id, outcome_summary, published_reference? }
  ]
```

### The 20 seeded archetypes

Organized by function × objective:

**Front Office · Grow (5 archetypes)**
1. **Contact Center Intent Routing + Agent Assist** · retail, FS, healthcare
2. **Personalized Marketing Copy Generation** · retail, CPG, hospitality
3. **Sales Research Assistant / Prospect Intelligence** · FS, tech, professional services
4. **E-commerce Visual Search** · retail, consumer products
5. **Conversational Product Discovery** · retail, hospitality, travel

**Front Office · Optimize (3 archetypes)**
6. **Customer Service Deflection** · all industries
7. **Marketing Content A/B Testing with LLM Variants** · retail, consumer digital
8. **Sales Forecasting** · B2B enterprise, retail

**Middle Office · Optimize (4 archetypes)**
9. **Demand Forecasting** · retail, CPG, industrial
10. **Inventory Optimization + Rebalancing** · retail, industrial
11. **Supply Chain Visibility + Disruption Alerts** · retail, industrial, healthcare
12. **Workforce Scheduling Optimization** · retail, hospitality, healthcare

**Middle Office · Protect (2 archetypes)**
13. **Claims Denial Reduction** · FS (insurance), healthcare
14. **Risk Model Validation / Audit Automation** · FS, energy

**Back Office · Optimize (4 archetypes)**
15. **Document Processing / Vendor Invoices** · all industries
16. **KYC / Customer Onboarding Automation** · FS
17. **Code Generation + Developer Copilot** · tech-forward enterprises
18. **Meeting Summarization + Action Capture** · professional services, enterprise

**Back Office · Protect (2 archetypes)**
19. **Fraud Detection · Returns / Transactions** · retail, FS
20. **Policy + Compliance Monitoring** · FS, healthcare, regulated industries

### Seeding method

Archetypes are authored by Anand based on consulting experience (the foundational domain expertise). Each archetype takes ~30 minutes to fully spec. Total: 10-12 hours of Anand authoring, or delegated to Claude (Claude drafts, Anand reviews, Claude revises).

**Recommended approach:** Claude drafts all 20 archetypes in one focused session (4-5 hours) using the schema above. Anand reviews in one sitting (1-2 hours), provides corrections. Claude revises. Net: 6-8 hours to a production-ready library.

This is a follow-on task from this spec. Can happen this week.

### Storage

Archetypes live in a `genome_archetypes` table with JSONB columns for the complex nested fields. Retrieval is direct SQL query (no embedding search needed for archetype selection — user picks from the 20 directly).

Longer-term (per Data Layer spec), archetypes become nodes in the knowledge graph with typed relationships to solution patterns, reference architectures, and failure modes.

## 3.3 Category 2 · Solution pattern library

### Schema

```yaml
solution_pattern:
  id: string
  name: string
  short_description: string
  long_description: markdown
  applicable_archetype_ids: [string]
  problem_triggers: [string]  # what makes this pattern applicable
  approach_summary: markdown
  implementation_steps: [
    { step, description, typical_duration, artifacts_produced }
  ]
  when_to_use: markdown
  when_to_avoid: markdown
  alternative_patterns: [pattern_id]
  evidence_base: markdown
  confidence_tier: enum(strong, moderate, weak)
```

### The 30-40 seeded patterns

Each archetype has 1-3 associated solution patterns. Examples:

**For "Contact Center Intent Routing" archetype:**
- Pattern: Hybrid model routing (LLM for long-tail intents, classifier for top intents)
- Pattern: Supervised-then-autonomous rollout (human review for first 90 days)
- Pattern: Staged intent coverage expansion (launch with top 20 intents, expand quarterly)

**For "AI Supplier Consolidation" archetype:**
- Pattern: Phased vendor rationalization (identify, evaluate, consolidate, retire)
- Pattern: Governance-first consolidation (policy before procurement action)
- Pattern: Cost-optimization without coverage reduction (find redundant tools, retain best-fit)

**For "Demand Forecasting" archetype:**
- Pattern: Ensemble forecasting (multiple models, voting or weighting)
- Pattern: Gradual autonomy expansion (AI suggests, human approves, eventually AI autonomous for low-value SKUs)

Rough volume: 30-40 patterns covering the 20 archetypes, averaging 1.5-2 patterns per archetype.

### Seeding method

Same as archetypes — Claude drafts, Anand reviews. Can be done in parallel with archetype seeding. ~15 minutes per pattern × 35 patterns = 8-10 hours of authoring. Part of the same week-long seeding effort.

## 3.4 Category 3 · Failure mode library

### Schema

```yaml
failure_mode:
  id: string
  name: string
  short_description: string
  long_description: markdown
  applicable_phases: [enum(1..7)]
  applicable_archetype_ids: [string]
  symptoms: [string]  # how it manifests
  root_cause_categories: [enum(data_quality, sponsor_alignment, technical_complexity, change_management, vendor_risk, measurement_baseline, scope_creep)]
  prevention_strategy: markdown
  remediation_if_occurring: markdown
  real_world_examples: markdown  # anonymized
  frequency_tier: enum(common, occasional, rare)
  severity_tier: enum(program_killer, significant_delay, minor_setback)
```

### The 15-20 seeded failure modes

**General failure modes:**
1. Sponsor disengagement mid-program
2. Scope creep without gate reassessment
3. Measurement baseline never locked
4. Change management underfunded
5. Vendor selected on features, not fit
6. Data quality issues discovered too late
7. Stakeholder alignment never confirmed
8. Technical architecture chosen before diagnosis complete
9. Compliance review deferred to post-build
10. Rollout timing conflicts with business cycle

**Archetype-specific failure modes:**
11. Intent coverage gap (Contact Center AI) — launch with inadequate intent set, agents override constantly
12. Attestation-without-evidence (Demand Forecasting) — sponsor approves without locked baseline
13. Shadow AI re-emergence (Supplier Consolidation) — tools return after consolidation through different procurement paths
14. Premature handoff (all archetypes) — Phase 6 closed before sustained performance verified
15. Bias discovery post-production (HR Resume Screening, others) — fairness issue found after go-live
16. Data drift unnoticed (predictive archetypes) — model accuracy degrades silently
17. Cost escalation without value capture (Copilot deployments) — seats deployed, usage measured, value never tied
18. Integration debt (Contact Center AI, Claims) — initial integrations work, scaling breaks

### Seeding method

Same pattern — Claude drafts, Anand validates. ~20 min per failure mode × 18 = 6 hours. Part of the same week.

## 3.5 Category 4 · Reference architecture library

### Schema

```yaml
reference_architecture:
  id: string
  name: string
  applicable_archetype_ids: [string]
  year: integer  # when last validated
  short_description: string
  layer_breakdown: {
    data_layer: { technologies, rationale },
    model_layer: { technologies, rationale },
    application_layer: { technologies, rationale },
    integration_layer: { technologies, rationale }
  }
  stack_options: [
    { option_name, components, tradeoffs }
  ]
  typical_cost_profile: markdown
  typical_timeline: markdown
  reference_diagram_url: string  # could be markdown/mermaid
  alternatives: [arch_id]
```

### The 10-12 seeded architectures

**Contact Center AI stacks:**
- Google CCAI + Genesys stack
- Amazon Connect + Lex + Bedrock stack

**Demand Forecasting stacks:**
- Databricks + MLflow + cloud warehouse stack
- Snowflake + ML native stack

**Document Processing stacks:**
- Azure Form Recognizer + Document Intelligence stack
- Google Document AI + Vertex AI stack

**LLM Application stacks (cross-archetype):**
- Anthropic + RAG + vector DB stack (Claude-native)
- OpenAI + Azure + Pinecone stack

**Forecasting stacks:**
- Classical ML ensemble stack (XGBoost + LightGBM + Prophet)
- Transformer-based time series stack

### Seeding method

Claude drafts from public reference patterns + common enterprise stacks. Anand reviews for currency (these change fastest). Could be lighter — 10 minutes per architecture × 12 = 2 hours.

## 3.6 Category 5 · Intelligence product fixtures

When a user invokes Situation Intelligence from within Phase 3 Diagnosis for archetype "Contact Center AI," the product must return a believable, substantive output. Not a placeholder, not "loading forever."

For test-drive, full LLM-powered product outputs are infeasible before M4. Instead: **canned fixture outputs** for each archetype × product combination, returned deterministically.

### Schema

```yaml
intelligence_fixture:
  id: string
  archetype_id: string
  product_id: enum(situation, cost, risk, people, organization, market, technology, time, value)
  phase_invoked_from: enum(1..7)
  output_template: markdown  # scaffolded template
  output_variables: {  # filled in with archetype-specific data
    variable_name: typical_value
  }
  accompanying_diagram_mermaid: string?  # if applicable
  typical_duration_minutes: integer  # 3-8 typically
```

### Volume

For test-drive: at least Situation, Cost, Risk, Technology, Value products × 10 archetypes = 50 fixtures minimum. Remaining 4 products × 10 = 40 more desirable.

Total: 50 minimum, 90 ideal.

### Seeding method

Heavy lift — each fixture is a 1-2 page diagnostic output. Claude can draft templates (variable-filled) in bulk. ~20-30 minutes per fixture × 50 = 20-25 hours of drafting.

**Recommended phasing:**
- Phase 0 (pre-test-drive): 10 fixtures — Situation Intelligence × 10 archetypes. This is the most commonly-invoked product in Phase 3.
- Phase 1 (test-drive iteration 1): +15 fixtures — Cost + Risk × key archetypes
- Phase 2 (test-drive iteration 2): +25 fixtures — expand product coverage

The test-drive can proceed with 10 fixtures. The other 40 come during iteration.

## 3.7 Category 6 · Industry cohort data

### What this is

Anonymized peer data for retail + financial services clients. When Atlas says "retail peers · n=7 · median adoption 67%", the 7 peer records backing that claim have to exist in the database.

### Schema

Cohort peer records extend `clients` with:

```yaml
client_peer:
  id: string
  display_name: string  # "Retail Peer A", "Retail Peer B" etc. Never real names.
  industry: string
  sub_industry: string
  revenue_band: string
  workforce_size: integer_range
  regulatory_profile: [string]
  stack_profile: json
  use_case_inventory_summary: {
    total_use_cases: int,
    by_function: {front, middle, back},
    by_objective: {grow, optimize, protect},
    by_lifecycle: {active, steady, sunset, backlog}
  }
  portfolio_metrics: {
    total_ai_spend_annual_usd: range,
    avg_adoption_penetration_pct: range,
    avg_trustworthiness_score: range,
    shadow_ai_spend_estimate_usd: range
  }
  source: enum(synthetic_expert_composite, anonymized_client_data, industry_benchmark)
  cohort_data_confidence: enum(high, medium, low)
```

### Volume

For test-drive and demo:
- **Retail peers:** 7-10 synthetic composite records with believable portfolio profiles
- **Financial services peers:** 5-7 synthetic composite records
- **Healthcare peers:** 2-3 records (for future reference, not needed for test drive)

**Important:** These are labeled `synthetic_expert_composite` — composites built from Anand's consulting experience, not derived from real client data. Transparency requires this labeling in the UI so clients understand cohort source.

### Seeding method

Anand authors directly or validates Claude-drafted composites. ~45 min per peer × 15 peers = 10-12 hours.

This overlaps with the Data Layer Future State spec's Phase 0 recommendation (Packet 7.11) — extending Apex seed with synthetic peers for philosophically honest cohort comparisons.

## 3.8 Seeding effort summary

Total seeding work to reach test-drive readiness:

| Category | Volume | Effort |
|---|---|---|
| 1 · Archetypes | 20 | 10-12 hours |
| 2 · Solution patterns | 35 | 8-10 hours |
| 3 · Failure modes | 18 | 6 hours |
| 4 · Reference architectures | 12 | 2 hours |
| 5 · Intelligence fixtures (Phase 0) | 10 | 5 hours |
| 6 · Industry cohort peers | 15 | 10-12 hours |
| **Total for test-drive readiness** | — | **41-47 hours** |

**Phased approach:**
- Week 1: Categories 1-4 complete (26-30 hours) — Genome library usable
- Week 2: Categories 5-6 initial seed (15-17 hours) — cohort data and Intelligence fixtures live

Claude authors drafts, Anand reviews. Can parallelize if Anand reviews in batches.

**Claude Code work** in parallel:
- Migration for new genome tables
- Ingestion of JSONB archetypes/patterns/failure modes
- Fixture-serving logic for Intelligence products
- Cohort peer data inserts

## 3.9 Quality bar for seed data

Not all seeded data is equal. Quality criteria:

### Archetype quality

- Reads like it was written by a consultant who has run 5+ of these programs
- Specifies enough that Nexus has substantive context; not so much that it's prescriptive
- Includes honest range (cost, duration, team size) not point estimates
- Acknowledges when archetype might not be right fit ("consider alternative if X, Y, Z")

### Solution pattern quality

- Specific enough to be actionable, abstract enough to apply across 2-3 similar contexts
- Names trade-offs explicitly ("when to use" and "when to avoid")
- References evidence even if synthetic ("Observed across 3 retail engagements with outcomes of X-Y")

### Failure mode quality

- Symptoms describable in 1-2 sentences a user can recognize
- Prevention strategy is actionable, not generic ("involve sponsor early")
- Remediation assumes the failure is already occurring

### Intelligence fixture quality

- Output is 1-2 pages of substantive diagnostic content
- Frames analysis in consulting language (current state, root cause, implication, recommendation)
- References specific metrics or frameworks
- Doesn't feel generic — mentions the specific archetype repeatedly

### Cohort peer quality

- Portfolio profile is internally consistent (if company has 35 use cases, revenue is in $10B+ range — not $500M)
- Regulatory profile matches industry (retail = PCI + CCPA, FS = SOX + FINRA + OCC)
- Metrics fall in realistic ranges (adoption 40-80%, not 15% or 95%)

## 3.10 Anti-patterns to avoid

Common mistakes when seeding:

**Anti-pattern 1 · "Generic archetype."** Archetype reads like it could apply to any industry. Fails because specificity is what makes Genome feel earned. Remediate by forcing at least 1-2 industry-specific details per archetype.

**Anti-pattern 2 · "Consulting slop in fixtures."** Intelligence fixture outputs read like generic consulting deck templates. Phrases like "leverage synergies" or "drive operational excellence" trigger this. Remediate by writing in plain, specific language.

**Anti-pattern 3 · "Point estimates masquerading as ranges."** A cost range of "$100K - $110K" is really a point estimate with fake ranges. Real ranges are "$100K - $350K" with rationale for spread.

**Anti-pattern 4 · "Too-strong evidence claims."** Claiming a pattern is "proven across 50+ engagements" when we're seeding from first principles. Remediate by honest evidence tier — most seeded content is "weak" confidence at launch, earns "moderate" after validation, "strong" only with multi-client evidence.

**Anti-pattern 5 · "Peer data that's too clean."** Synthetic cohort peers with clean, uniform portfolios. Real portfolios are messy. At least one peer should have 2-3 signals active, one should have a failed program, one should have high shadow AI exposure. Variation makes cohort comparisons meaningful.

## 3.11 Decisions locked in Packet 3

| # | Decision | Rationale |
|---|---|---|
| 3.L1 | Six seed data categories: archetypes, patterns, failure modes, architectures, fixtures, cohort peers | Cover the full Genome + Intelligence + cohort surface |
| 3.L2 | 20 archetypes seeded at launch | Covers the 10 test-drive scenarios + 10 adjacent |
| 3.L3 | 30-40 solution patterns linked to archetypes | 1.5-2 per archetype average |
| 3.L4 | 18 failure modes (general + archetype-specific) | Common failure patterns covered |
| 3.L5 | 12 reference architectures | Covers top archetypes' technical stacks |
| 3.L6 | Intelligence fixtures seeded phased: 10 for test-drive, 40 more in iteration | Lower initial bar, faster ship |
| 3.L7 | 15 synthetic cohort peers across retail + FS + minimal healthcare | Realistic cohort comparisons |
| 3.L8 | All seed data authored by Claude-drafted, Anand-reviewed pattern | Leverages both speed and domain expertise |
| 3.L9 | Seed data labels source transparency (synthetic_expert_composite) | Honesty about n=1 reality |
| 3.L10 | Total seeding effort: 41-47 hours across 2 weeks | Plannable, parallelizable with Claude Code work |
| 3.L11 | Quality bar criteria per category | Ships substantive content, not templates |

---

## Packet 3 · Checkpoint

**STATUS · Track A, Packet 3 of 7 complete · Track A COMPLETE**

Seed data requirements specified across six categories. Total effort 41-47 hours, phased across 2 weeks. Quality bar and anti-patterns defined. Test-drive readiness now has a complete spec for what to build (Packet 2) and what to seed (Packet 3).

Ready for Track B (Module Experience).

---

# TRACK B · MODULE EXPERIENCE (Packets 4-7)

Track B specifies what each phase module should feel like when you're in it. Depth of product experience. This is what makes Nexus feel like a senior consultant running the engagement with you, not a stub that tracks phase state.

---

# PACKET 4 · Phase 1 · Ideation Module Experience

Phase 1 is the entry point. For Path 1 creation (blank start) it's the blank-canvas moment. For Path 2 creation (from archetype) it's the "let me verify this archetype fits" moment. For Path 3 origination from Tower it's the "here's the signal that triggered this — let's shape the response" moment.

Three distinct entry contexts, one module, shared scaffolding. This packet specifies all three entry experiences and what the user sees, does, and accomplishes before Phase 1 closes.

## 4.1 The strategic purpose of Phase 1

A consulting engagement doesn't succeed or fail at kickoff; it succeeds or fails at scoping. Programs where scope was never locked run over time, over budget, and deliver weak outcomes. Programs where scope was locked late (Phase 4 or 5) incur the same cost.

Phase 1 exists to get scope explicit, early, and aligned. Specifically:

- **Problem statement clarity.** What are we trying to solve? In specific enough language that a measurement framework could be derived from it.
- **Solution shape hypothesis.** What kind of thing are we building? AI agent? Predictive model? Content generation? Hybrid? This isn't architecture yet — it's just shape.
- **Scope inclusion and exclusion.** What's in, what's out, what's deferred. Written so the sponsor can read it in 90 seconds.
- **Stakeholder alignment.** Who sponsors? Who owns? Who consumes? Who blocks? The political map.
- **Success criteria at a directional level.** Not measurement frameworks yet — but a sense of "what would 'won' look like at Phase 7?"

Every subsequent phase depends on Phase 1's output being good. If Phase 1 produces a vague charter, Phase 3 Diagnosis diagnoses the wrong problem. If stakeholders weren't mapped, Phase 2 Validation discovers the sponsor was never aligned. If success criteria were hand-waved, Phase 7 Verify has nothing to verify against.

The module experience has to communicate this importance without burying the user in process.

## 4.2 Entry context variations

### Entry A · Blank start (Path 1)

User clicked "Create Program" → "Start blank." They have an idea but no archetype match, no signal origination, just intent.

**What they see on Phase 1 landing:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1 · Ideation                                                 │
│                                                                     │
│  CHARTER DRAFT · v1                                                 │
│  ─────────────────────────────────────                              │
│                                                                     │
│  [Empty charter template with six scaffolded sections]              │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Blank start — I'll help you shape this from scratch.              │
│                                                                     │
│   Start with the problem you're trying to solve. Not the            │
│   solution — the problem. Two or three sentences. I'll help         │
│   sharpen from there.                                               │
│                                                                     │
│   Or if you'd rather, describe the situation in your own words      │
│   and I'll draft the problem statement for you to react to."        │
│                                                                     │
│   [Type problem statement]  [Describe situation, you draft]         │
└─────────────────────────────────────────────────────────────────────┘
```

Blank start requires the most Nexus scaffolding because the user has the least structure. Nexus's job is to transform "I have a vague idea" into "I have a problem statement worth a Phase 2 feasibility check."

### Entry B · Archetype start (Path 2)

User clicked "Create Program" → "Start from a Genome archetype" → selected "Contact Center AI." Charter is pre-populated from the archetype's typical content.

**What they see on Phase 1 landing:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1 · Ideation                                                 │
│                                                                     │
│  CHARTER DRAFT · v1 · started from "Contact Center AI" archetype    │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Problem statement                                                  │
│  [Pre-filled with archetype's typical problem, editable:]           │
│  "Contact center agents handle [N] inbound inquiries monthly with   │
│  an average handle time of [X] minutes and first-contact            │
│  resolution of [Y%]. The mix of routine and complex inquiries      │
│  creates agent burnout, training cost, and inconsistent customer   │
│  experience."                                                       │
│                                                                     │
│  Hypothesized solution shape                                        │
│  [Pre-filled:] "Hybrid routing system that handles top-intent       │
│  queries with an LLM-based agent and routes complex or              │
│  exception cases to human agents with AI-generated suggested        │
│  responses."                                                        │
│                                                                     │
│  [Scope, Stakeholders, Success Criteria sections with archetype    │
│   defaults, editable]                                               │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Archetype start — the charter is 80% pre-populated. Walk          │
│   through each section, adjust for your specific context. Most      │
│   important: fill in the [N], [X], [Y%] placeholders with real      │
│   numbers. If you don't know them yet, Situation Intelligence       │
│   in Phase 3 will surface them.                                     │
│                                                                     │
│   Two things worth your attention first:                            │
│   1. Is the archetype's default scope right for you? The            │
│      archetype assumes inbound voice; if yours is chat+voice,       │
│      update scope.                                                  │
│   2. Is the hypothesized solution shape reasonable? This is         │
│      where archetype bias creeps in — we apply a 'hybrid            │
│      routing' pattern before you've diagnosed root causes."         │
│                                                                     │
│   [Walk me through section by section]  [I'll edit directly]        │
└─────────────────────────────────────────────────────────────────────┘
```

Archetype start requires less scaffolding but **more critical review**. The risk is the user accepts the archetype's defaults without validating against their specific context. Nexus's job is to flag which defaults are assumptions (solution shape) vs which are templates (structure).

### Entry C · Signal origination (Path 3)

User came from a Tower signal → "Originate program." Signal context is carried forward; Phase 1 isn't really about ideation so much as about shaping the response.

**What they see on Phase 1 landing:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1 · Ideation                                                 │
│                                                                     │
│  ORIGINATED FROM TOWER SIGNAL                                       │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Source signal: Shadow AI detected — $2.3M annualized               │
│  Signal evidence: Jasper $800K, Abridge $900K, Grammarly $600K      │
│  Signal age: 8 days                                                 │
│  Atlas recommendation: Originate AI Supplier Consolidation program  │
│                                                                     │
│  CHARTER DRAFT · v1 · originated from signal                        │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Problem statement                                                  │
│  [Pre-filled from signal context, editable:]                        │
│  "Three AI tools totaling $2.3M annualized spend operate outside    │
│  the governed inventory: Jasper (marketing), Abridge (specialty     │
│  retail health pilot), and Grammarly Business (workforce-wide).     │
│  Each entered the organization through a different procurement      │
│  path, predating or circumventing the 2025 AI governance policy.    │
│  Without consolidation, the pattern recurs every ~180 days as       │
│  departments adopt AI tools locally."                               │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Signal origination — the charter is drafted directly from the     │
│   Shadow AI evidence. Three things to confirm before advancing:     │
│                                                                     │
│   1. Is 'consolidation' the right response, or something broader?   │
│      Options: consolidate (one vendor, managed), distributed-       │
│      governed (multiple vendors, one governance policy), or full    │
│      platform rebuild (move off SaaS, build internally).            │
│   2. What's the sunset timeline for existing tools? Immediate       │
│      sunset forces user migration; gradual sunset bleeds cost.      │
│   3. Who sponsors? The CMO owns Jasper, Health CMO owns Abridge,    │
│      Digital VP owns Grammarly. Cross-functional sponsorship        │
│      required — probably CIO or COO."                                │
│                                                                     │
│   [Walk through the 3 confirmations]  [Edit charter directly]       │
└─────────────────────────────────────────────────────────────────────┘
```

Signal origination is the strongest Phase 1 entry. The charter is effectively authored; Phase 1 becomes about confirming approach and stakeholders, not generating content.

## 4.3 The Phase 1 charter artifact

### Structure (same across all three entry paths)

Six sections, each with scaffolding + Nexus prompts:

**Section 1 · Problem statement**

Prompt: "What specifically is broken, inefficient, or missing today? Be concrete about the business pain. Avoid solution language."

Good example (from Contact Center AI archetype):
> "The contact center handles 2.3M inbound voice inquiries annually with average handle time of 7.2 minutes. First-contact resolution sits at 58% vs retail peer median of 72%. Agent turnover is 34% annually, with new hire training averaging 6 weeks before independent capability. Customer CSAT on complex inquiries has declined 8 points over the last 12 months."

Weak example (what to push back on):
> "We need to improve our contact center with AI."

Nexus behavior: If user's problem statement is weak (< 50 words, no metrics, solution language present), Nexus offers:

> "Your problem statement is short. For Phase 3 to diagnose root causes effectively, we typically need: what's happening, how often, how much it costs, and what's changed. Want to walk through those one at a time?"

**Section 2 · Hypothesized solution shape**

Prompt: "At the shape level — not architecture — what kind of thing do you think this is? Examples: routing + agent assist, predictive model, content generation, hybrid automation, advisory tool."

This is explicitly labeled "hypothesized" because Phase 3 Diagnosis might invalidate it. The hypothesis is scaffolding, not commitment.

**Section 3 · Scope**

Two sub-sections:

*Scope inclusions (in scope):*
- Example: "Inbound voice inquiries from US customers"
- Example: "English-language inquiries only"
- Example: "Routing + agent assist; no autonomous resolution in year 1"

*Scope exclusions (out of scope, or deferred):*
- Example: "Outbound calls (out of scope)"
- Example: "Chat channel (deferred to year 2)"
- Example: "Spanish-language (deferred, requires localized model)"

Nexus behavior: Offers archetype-specific scope templates. Asks: "Anything about your context that makes the default scope not quite right?"

**Section 4 · Stakeholders**

Roles explicitly listed:

- Executive sponsor (named or placeholder)
- Business owner (named or placeholder)
- Technical lead (named or placeholder)
- Key stakeholders (list)
- Potential blockers (list — people whose concerns could kill this)

Nexus behavior: For Path 3 signal origination, Nexus surfaces stakeholders implied by the signal. ("This affects marketing, health division, and workforce — three different stakeholder groups.") For archetype starts, Nexus offers the archetype's typical stakeholder pattern. ("Contact Center AI engagements typically need VP Customer Experience as sponsor, Director of Contact Ops as owner.")

**Section 5 · Success criteria (directional)**

Prompt: "At a directional level — not measurement — what would 'success' look like when this program reaches Phase 7?"

Examples:
- "Handle time reduced by 20%+ for top-10 intents"
- "First-contact resolution improved 10 points"
- "Agent satisfaction up 15% on post-shift surveys"
- "Savings of $4M annualized by Q4 2027"

Nexus behavior: Offers archetype-specific success criteria. Flags when criteria are vague ("improve customer experience" → "measurable by what?").

**Section 6 · Known risks and open questions**

Prompt: "What are you worried about? What don't you know yet?"

Examples:
- "Customer tolerance for AI-first interactions"
- "Integration complexity with existing IVR"
- "Data quality for intent classification training"

Nexus behavior: Surfaces failure modes from the Genome library linked to this archetype. ("Common failure modes for Contact Center AI include intent coverage gaps and overrides rate. Want to add them to your watch list?")

### Charter states

The charter has three states:

1. **Draft** — actively editing. Yellow banner: "Draft v2 · last saved 8s ago."
2. **Review-ready** — all six sections have content, user marks ready. Blue banner: "Review-ready · waiting for sponsor approval."
3. **Locked (v1)** — sponsor approved. Green banner: "Locked charter v1 · signed Apr 22 by Priya Sethi."

A locked charter is what Phase 3 picks up as starting context. Any changes after lock require a new charter version with change log.

## 4.4 Nexus behavior in Phase 1

### Opening messages by entry context

Already specified in 4.2. Summarizing:

- Blank start: inviting, scaffolded, progressive disclosure
- Archetype start: critical review, flag assumptions, prompt validation
- Signal origination: confirm approach, surface stakeholder complexity

### Mid-phase behaviors

**When the user is stuck:**

User opens a section, types nothing for 30 seconds, then switches tabs. On return, Nexus offers:

> "You paused on the Stakeholders section. Two ways to make this easier: describe the org in a sentence and I'll infer a stakeholder map, or answer 'who would be unhappy if this program shipped?' — that surfaces the blockers first."

**When the user writes something weak:**

If the problem statement is < 40 words, has solution language, or lacks metrics:

> "Your problem statement would be stronger with concrete numbers. Do you know the monthly inquiry volume? If not, Situation Intelligence in Phase 3 can find out, but a rough estimate here helps scoping."

**When the user writes something strong:**

If the problem statement hits all four criteria (what/how often/cost/change), Nexus acknowledges briefly:

> "Strong problem statement — concrete and diagnosable. Moving on to solution shape."

Small acknowledgment, not effusive praise.

**When Genome patterns are relevant:**

As user types, Nexus retrieves matching patterns proactively. When a 0.85+ similarity match exists:

> "This closely matches the 'Intent Routing + Agent Assist' pattern we've observed across retail and financial services. Three common variations — want me to surface them before you finalize scope?"

Only offered when relevant. Not every section triggers a pattern surfacing.

### Closing Phase 1

When all six sections are marked review-ready, Nexus offers:

> "Charter is review-ready. Two suggested next steps:
>
> 1. Share with sponsor (Priya Sethi) for sign-off before Phase 2. I can draft a 2-paragraph summary email.
> 2. Keep iterating — if anything feels off, now's the cheap time to rework.
>
> When the sponsor signs off, I'll close Phase 1 and open Phase 2 Validation."

### Refusal patterns

Nexus does not:
- Pretend to know data it doesn't have (metrics invented to make charter look complete)
- Sign off on charter on behalf of sponsor
- Lock a charter with incomplete sections even if user asks
- Override archetype defaults without flagging

When user asks Nexus to do any of these, Nexus says:

> "I can't [specific action] — that's a decision for [sponsor/owner]. What I can do is [alternative]."

## 4.5 Gate criteria for Phase 1 → Phase 2

Concrete criteria, each clickable to jump to the field:

```
Phase 1 · Ideation — Gate Criteria

✅ Problem statement has concrete language (≥ 50 words, includes metrics)
✅ Hypothesized solution shape articulated
✅ Scope inclusions + exclusions listed (min 3 each)
✅ Sponsor identified (real name OR placeholder acknowledged)
🟡 Sponsor approval logged (optional for placeholder; required for real)
⬜ Success criteria written (at least 2 measurable)
⬜ Known risks listed (at least 3)

Criteria met: 5 of 7
[Advance to Phase 2]  ← disabled with tooltip until 7 of 7
```

Soft criteria (placeholder sponsor acceptable) allow test-drive flow without blocking. Hard criteria (content completeness) are always enforced.

## 4.6 State persistence in Phase 1

Autosave behavior:

- Every 5 seconds during active editing
- Immediately on tab blur
- Immediately on section transitions
- Immediately on Nexus interaction

Draft state visible as "Draft v2 · last saved 4s ago" banner.

Session recovery:

- User closes tab → data persists
- User logs out → data persists
- User comes back in 3 days → exact state restored, including Nexus conversation history

Conflict handling:

- If same user has Phase 1 open in two tabs, second tab shows read-only overlay: "This Program is being edited in another session. Close that session to edit here."

## 4.7 Design system patterns used in Phase 1

References to Design System spec components:

- Rich text editor with scaffolded sections → Design System Packet 2.11
- Nexus chat panel (agent chat) → Design System Packet 2.9
- Gate criteria component → Design System Packet 2.7
- Phase ribbon → Design System Packet 5.2
- Draft/review/locked banner → Design System Packet 2.8
- Autosave indicator → Design System Packet 2.12

No Phase 1-specific new components needed. Phase 1 is the canonical phase experience — other phases are variations.

## 4.8 Test-drive acceptance for Phase 1

When Anand test-drives 10 programs:

**Expected friction:**
- Archetype library selection feels fast (< 10 seconds from "archetype" click to Phase 1 charter)
- Charter pre-population feels rich, not empty
- Nexus opening message varies meaningfully by entry path
- Section scaffolding prompts feel useful, not formulaic
- Gate criteria make sense; no mystery blockers

**Unacceptable friction (must fix):**
- Charter saves reliably; no data loss
- Nexus responds within 3 seconds to direct questions
- Can close and re-open Program with no state loss
- Advancing to Phase 2 produces clear confirmation, not silent transition

**Test-drive success:**
10 Programs reach Phase 2 gate-ready state within cumulative 60 minutes of authoring (6 minutes average per Program with pre-populated archetypes).

## 4.9 Decisions locked in Packet 4

| # | Decision | Rationale |
|---|---|---|
| 4.L1 | Phase 1 has three distinct entry contexts with distinct Nexus openings | Path 1/2/3 experiences differ meaningfully |
| 4.L2 | Charter is six sections: problem, solution shape, scope (in/out), stakeholders, success criteria, risks | Covers scoping completeness without bloat |
| 4.L3 | Charter has three states: draft, review-ready, locked | Clear lifecycle |
| 4.L4 | Archetype start pre-populates 80%; user completes specifics | Speed + customization balance |
| 4.L5 | Signal origination pre-populates problem statement from evidence | Path 3 leverages signal context |
| 4.L6 | Nexus proactively surfaces Genome patterns at 0.85+ similarity | Smart but not intrusive |
| 4.L7 | Gate criteria: 7 criteria, 4 hard + 3 soft (placeholder sponsors acceptable) | Test-drive compatible |
| 4.L8 | Autosave every 5 seconds + on blur/transitions | Zero data loss |
| 4.L9 | Locked charter versions; subsequent changes require new version with change log | Commitment traceability |

---

## Packet 4 · Checkpoint

**STATUS · Track B, Packet 4 of 7 complete**

Phase 1 Ideation specified fully across three entry paths, six charter sections, Nexus behaviors, gate criteria, and test-drive acceptance. Ready for Packet 5 (Phases 2-3).

---

# PACKET 5 · Phases 2-3 · Validation and Charter Lock

Phases 2 and 3 are the commitment gates of a Program. Phase 2 validates that the charter survives contact with reality — is feasibility real, is the sponsor actually aligned, are there political blockers we missed. Phase 3 locks the charter formally and the Program becomes real in the organization.

These two phases are frequently compressed in practice — a good Phase 1 charter with strong sponsor alignment can move through Phase 2 in days and close Phase 3 in one sponsor meeting. But they must both happen; skipping them produces Programs that die in Phase 5 because scope was never verified against feasibility and stakeholders were never formally aligned.

## 5.1 Phase 2 · Validation purpose

Phase 2 answers three questions:

1. **Technical feasibility.** Is the hypothesized solution shape achievable given existing data, stack, vendor landscape, and regulatory context?
2. **Organizational feasibility.** Is the sponsor genuinely committed? Are the stakeholders named in Phase 1 real and reachable? Are there blockers nobody mentioned?
3. **Program fit.** Does this look like a Program (multi-phase, multi-quarter, attested) or something smaller (an experiment, a spike, a vendor evaluation)? Sometimes Phase 2 Validation concludes "this shouldn't be a Program" — a healthy outcome.

Phase 2 is fast when Path 3 origination carried the feasibility signal (Shadow AI spend is real; the validation is already done). Phase 2 is slower when Path 1 blank start generated an ambitious hypothesis that hasn't been pressure-tested.

## 5.2 Phase 2 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2 · Validation                                               │
│                                                                     │
│  FEASIBILITY ASSESSMENT                                             │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Charter from Phase 1                                               │
│  [Collapsed summary — click to expand full charter]                 │
│                                                                     │
│  Technical feasibility                 [Assess with Nexus]          │
│  ──────────────────                                                 │
│  ⬜ Data quality assessment                                         │
│  ⬜ Stack compatibility check                                       │
│  ⬜ Vendor landscape scan                                           │
│  ⬜ Regulatory/compliance review                                    │
│                                                                     │
│  Organizational feasibility            [Assess with Nexus]          │
│  ─────────────────────────                                          │
│  ⬜ Sponsor commitment confirmed                                    │
│  ⬜ Stakeholder map validated                                       │
│  ⬜ Blocker identification                                          │
│  ⬜ Political context noted                                         │
│                                                                     │
│  Program fit verdict                                                │
│  ──────────────────                                                 │
│  [Proceed as Program] [Downgrade to experiment] [Pause / rethink]   │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 2 is where we stress-test the charter. For Contact Center   │
│   AI at Apex, three specific things to verify:                      │
│                                                                     │
│   1. Is the agent telephony stack (Genesys Cloud, per IT            │
│      inventory) API-compatible with the routing layer you're        │
│      contemplating? I can run Technology Intelligence to check.     │
│   2. Does Priya Sethi's signature mean her team's committed, or     │
│      is it conditional on Jake Chen (Head of Contact Ops)           │
│      buying in? Phase 2 surfaces that distinction.                  │
│   3. FTC's recent guidance on AI-to-customer interaction            │
│      disclosure — has your legal team weighed in? If not, this      │
│      belongs in Phase 2, not Phase 5."                              │
│                                                                     │
│   [Run Technology Intelligence]  [Draft stakeholder outreach]       │
└─────────────────────────────────────────────────────────────────────┘
```

### The feasibility assessment artifact

Distinct from Phase 1's charter. A shorter, analytical document answering the three Phase 2 questions with evidence.

Structure:

**Technical feasibility section:**
- Data quality assessment: What data exists? What quality? What's missing?
- Stack compatibility: Does the existing tech stack support the hypothesized solution shape?
- Vendor landscape: Who sells this capability? What's the build-vs-buy?
- Regulatory/compliance: What frameworks apply? What must be cleared?

Each subsection is populated by:
- User input
- Nexus-drafted summary from Intelligence product invocations (Technology Intelligence, Risk Intelligence)
- Links to evidence (internal docs, vendor materials, regulatory references)

**Organizational feasibility section:**
- Sponsor commitment: Signed vs verbal vs "waiting on update"
- Stakeholder map: Full list with alignment status per stakeholder
- Blockers: People or factors that could kill this
- Political context: Dependencies on adjacent programs, reorgs, budget cycles

**Program fit verdict:**

Three outcomes:
1. **Proceed as Program** → advance to Phase 3
2. **Downgrade to experiment** → close this Program, create an Experiment (separate entity, faster lifecycle)
3. **Pause or rethink** → suspend Program, annotate reason, return when context changes

## 5.3 Nexus behavior in Phase 2

### Opening message

Varies by charter quality from Phase 1:

**Strong Phase 1 charter:**
> "Phase 2 · Validation. Charter is solid — specific problem, concrete metrics, sponsor named. Two stress-tests worth running first: Technology Intelligence to check stack compatibility, then a sponsor outreach draft. Want to start there?"

**Weak Phase 1 charter:**
> "Phase 2 · Validation. Before we validate, I want to flag: the charter is under-specified on [specific area]. Phase 2 could expose that this isn't really a Program yet — it might be an experiment or a discovery phase. Let's validate what we have, honestly, and see what the evidence says."

**Path 3 signal-originated:**
> "Phase 2 · Validation. This Program came from Shadow AI signal evidence — the technical feasibility is partially proven (we know the spend is real, the tools are identified). Focus Phase 2 on organizational: who sponsors the consolidation, how do the three tool owners feel about sunsetting their vendors."

### Mid-phase behaviors

**Proactive Intelligence product invocation:**

When user opens Phase 2, Nexus proactively offers to run relevant Intelligence products:
- Technology Intelligence → stack compatibility
- Risk Intelligence → regulatory review
- Cost Intelligence → budget feasibility
- Market Intelligence → vendor landscape

Nexus doesn't auto-run; it offers. User picks what's valuable.

**Sponsor outreach drafting:**

One of Phase 2's most valuable behaviors is Nexus drafting sponsor outreach. Example prompt:

> "Want me to draft a 2-paragraph update email to Priya Sethi asking for: (a) formal sign-off on the charter as-written, (b) her view on whether Jake Chen is aligned, and (c) any concerns from her leadership team? Takes 30 seconds; you edit before sending."

User hits "Draft" → Nexus produces editable email → user reviews and sends manually (via own email client, Nexus doesn't send).

**Downgrade recommendation:**

When evidence in Phase 2 suggests the Program shouldn't be a Program:

> "Three things from Phase 2 validation suggest this is smaller than a Program:
>
> 1. Scope narrowed from 'enterprise rollout' to 'one team's workflow'
> 2. Budget clarified as discretionary, not capital
> 3. Sponsor's language shifted from 'strategic' to 'let's try it'
>
> This fits better as an Experiment — 8 weeks, one team, single attestation, no Phase 3 charter lock. Want me to transition this? Your Phase 1 charter becomes the experiment brief, everything else carries forward."

Not every Phase 2 ends in "proceed." A healthy product surfaces downgrade as a first-class option.

## 5.4 Phase 2 gate criteria

```
Phase 2 · Validation — Gate Criteria

✅ Technical feasibility assessed (4 sub-checks)
✅ Organizational feasibility assessed (4 sub-checks)
✅ Program fit verdict reached
🟡 Sponsor commitment confirmed (signed, not verbal)
⬜ All Phase 1 open risks addressed or deferred

[Advance to Phase 3]  ← enabled when Program fit = "Proceed"
```

## 5.5 Phase 3 · Charter Lock purpose

Phase 3 is ceremony. The work of deciding scope, stakeholders, and success criteria happened in Phases 1-2. Phase 3 is where the organization formally commits.

This matters because without formal commitment, Programs drift. A scope that "felt aligned" in Phase 2 becomes "the sponsor wants to expand it" in Phase 5. A success criterion that "seemed reasonable" becomes "but we need to hit a higher number" in Phase 6. Locking the charter in Phase 3 with sponsor signature makes scope changes later an explicit renegotiation, not drift.

## 5.6 Phase 3 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 3 · Charter                                                  │
│                                                                     │
│  CHARTER · v1 · LOCKING                                             │
│  ─────────────────────────────────────                              │
│                                                                     │
│  [Full charter displayed — no longer editable, preview mode]        │
│                                                                     │
│  Signatures required                                                │
│  ──────────────────                                                 │
│  ✅ Owner signature · Dan Okonkwo · Apr 22, 9:14 AM                 │
│  ⬜ Sponsor signature · Priya Sethi · awaiting                      │
│                                                                     │
│  [Request sponsor signature]  [Revise charter (back to Phase 1)]    │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 3 is the commitment moment. The charter below is what       │
│   gets locked. Two things to check before requesting signatures:    │
│                                                                     │
│   1. Is this what you want your Program measured against in         │
│      Phase 7? Weak success criteria here mean weak verification     │
│      later.                                                         │
│   2. Are there any last-minute changes from Phase 2 validation      │
│      that didn't flow back into the charter? Quick review now       │
│      prevents rework.                                               │
│                                                                     │
│   If all looks good, I'll send the sign-off request to Priya        │
│   with a 3-paragraph summary."                                      │
│                                                                     │
│   [Review the full charter]  [Send sign-off request]                │
└─────────────────────────────────────────────────────────────────────┘
```

### Charter lock mechanism

Once both signatures (owner + sponsor) are captured:

- Charter version becomes v1.0 locked
- Charter fields become read-only (to preserve the signed version)
- Any subsequent changes create v1.1, v1.2, etc. with change log and require re-signature
- Locked charter is the reference artifact for Phase 7 Verify (what was promised?)

### Signature capture

Two modes:

**In-app signature:** Sponsor logs into AbarVa, reviews charter, clicks "Sign charter." Signature captured with timestamp + IP + user identity. Works for sponsors with AbarVa access.

**Proxy signature:** Owner captures sponsor approval via email forward or screenshot. Annotates in-app with "Sponsor approved via email [date], screenshot attached." Allowed for sponsors without AbarVa access (most common in year 1). Audit-logged with lower trust tier.

## 5.7 Nexus behavior in Phase 3

### Opening message

Varies by charter quality:

**Strong charter:**
> "Phase 3 · Charter. Everything from Phase 2 looks solid. Charter is measurable, sponsor is aligned, scope is defined. Want me to send the sign-off request to Priya with a summary? Standard practice is cc'ing Dan so he sees the final version too."

**Weak charter reaching Phase 3 (override of earlier gates):**
> "Phase 3 · Charter. Before we lock, I want to flag: success criteria section is still vague ('improve customer experience'). Phase 7 Verify will struggle to verify this. Worth 10 minutes of tightening before signature? If you lock as-is, it's harder to change later."

Nexus will not auto-advance a charter with weak criteria, but won't block the user either. The pushback is surfaced; the decision is the user's.

### Post-lock behavior

When both signatures captured:

> "Charter v1 locked. Signed by Priya and Dan. Phase 4 Diagnosis opens next — that's where we go deep on root causes and baseline metrics. For Contact Center AI, Situation Intelligence is the first product we'll run. Ready when you are."

Brief, ceremonial, forward-looking. Not effusive.

## 5.8 Phase 3 gate criteria

```
Phase 3 · Charter — Gate Criteria

✅ Charter reviewed in preview mode
✅ Owner signature captured
✅ Sponsor signature captured (in-app OR proxy)
✅ Change log empty (no edits post-signature)

[Close Phase 3 and advance to Phase 4]  ← enabled when all met
```

Once closed, charter becomes immutable reference.

## 5.9 Handling Phase 2/3 edge cases

### Sponsor delay

Sponsor doesn't sign within reasonable time (7+ days). Program stuck in Phase 3 awaiting signature.

Nexus behavior:
> "Phase 3 is stalled on Priya's signature (9 days). Three options:
>
> 1. Follow-up — I can draft a gentle reminder email.
> 2. Proxy signature — if she's approved verbally or via email, capture that here.
> 3. Pause — mark the Program as 'sponsor-blocked' and return when she re-engages.
>
> What's the situation?"

No auto-nagging. User decides the stance.

### Scope change post-lock

Phase 5 team realizes scope needs expansion. Charter is locked.

Triggered change process:
1. User clicks "Revise charter" from any post-Phase-3 view
2. New charter version starts as copy of v1.0
3. Changes tracked in change log with rationale
4. Sponsor re-signature required on v1.1
5. Program advances with v1.1 as new reference

Doesn't happen silently. Every version change is a formal renegotiation.

### Downgrade from Phase 2

Phase 2 concludes "this should be an experiment, not a Program." Handling:

1. Phase 2 Program fit verdict = "Downgrade to experiment"
2. System creates new Experiment entity with charter content as brief
3. Original Program marked "downgraded" with link to Experiment
4. Tower portfolio excludes downgraded Programs from Program count; includes Experiment count separately

Not a failure. Healthy product recognition.

## 5.10 Test-drive acceptance for Phases 2-3

**Expected experience:**
- Phase 2 feasibility assessment feels analytical, not formulaic
- Intelligence product invocations feel contextual
- Nexus drafts sponsor outreach usefully
- Downgrade recommendation surfaces when appropriate
- Phase 3 lock is clear ceremony, not arbitrary gate
- Charter versioning visible when changes occur

**Test-drive success:**
At least 2 of 10 test-drive programs should hit downgrade recommendation naturally (scope was too small for a Program). If 10/10 proceed to Phase 3, the downgrade logic is too lenient.

## 5.11 Decisions locked in Packet 5

| # | Decision | Rationale |
|---|---|---|
| 5.L1 | Phase 2 answers three questions: technical feasibility, organizational feasibility, Program fit | Clear scope |
| 5.L2 | Phase 2 artifact = Feasibility Assessment (distinct from charter) | Different purpose, different structure |
| 5.L3 | Program fit has three verdicts: proceed, downgrade to experiment, pause | Healthy alternatives to "proceed" |
| 5.L4 | Nexus proactively offers Intelligence product invocations in Phase 2 | Surfaces capabilities |
| 5.L5 | Sponsor outreach drafting is first-class Nexus behavior | High-value, repeatable task |
| 5.L6 | Phase 3 is ceremonial; work happened in Phases 1-2 | Lock, not rework |
| 5.L7 | Signatures: in-app or proxy (email/screenshot) | Realistic for year 1 sponsors without AbarVa access |
| 5.L8 | Locked charter is immutable reference for Phase 7 | Verifiable commitment |
| 5.L9 | Scope changes post-lock require new version + re-signature | Prevents drift |

---

## Packet 5 · Checkpoint

**STATUS · Track B, Packet 5 of 7 complete**

Phases 2-3 specified. Feasibility assessment structure, Nexus validation behaviors, charter lock ceremony, downgrade handling, edge cases. Ready for Packet 6 (Phases 4-5).

---

# PACKET 6 · Phases 4-5 · Diagnosis and Design

Phases 4 and 5 are the content-heavy middle of a Program. Phase 4 Diagnosis answers "what's really going on and why?" — deep baseline measurement, root-cause analysis, evidence gathering. Phase 5 Design answers "what's the specific solution we're building?" — architecture, vendor selection, implementation plan, operating model.

Both phases depend heavily on Intelligence products. Phase 4 is where Situation Intelligence produces diagnostic decks, Cost Intelligence profiles the economic dimensions, Risk Intelligence maps regulatory exposure. Phase 5 is where Technology Intelligence evaluates reference architectures, Market Intelligence compares vendors, Time Intelligence sequences implementation.

This is where the product becomes substantive. Phase 1-3 is scoping; Phase 4-5 is where the consulting actually happens. If Nexus feels shallow here, the product feels shallow overall.

## 6.1 Phase 4 · Diagnosis purpose

Three concrete outputs:

1. **Baseline metrics locked.** The measurable state of things today, captured with enough rigor that Phase 7 Verify can compare against it. "Handle time: 7.2 minutes. First-contact resolution: 58%. Agent turnover: 34%/year." Not estimates — captured from source systems with provenance.

2. **Root causes identified.** Why are those metrics where they are? Evidence-backed analysis, not guessing. "Handle time is 7.2 min because: 34% of calls require lookups in two separate systems, agents average 22 tool switches per call, training on complex intents averages 4.2 hours."

3. **Diagnostic deck produced.** A presentable artifact that tells the story. Current state → evidence → root causes → implications → path forward. Typical output of Situation Intelligence, refined by user + Nexus.

Phase 4 is the longest phase in most Programs. Duration varies: 2 weeks for well-scoped problems with available data, 8+ weeks for complex enterprise diagnostics.

## 6.2 Phase 4 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 4 · Diagnosis                                                │
│                                                                     │
│  DIAGNOSTIC DECK · v1                                               │
│  ─────────────────────────────────────                              │
│                                                                     │
│  [Scaffolded deck structure — 6 sections, each expandable]          │
│                                                                     │
│  Section 1: Current state                                           │
│    Baseline metrics · [Run Cost + Situation Intelligence]           │
│    Operating model · [Document existing workflow]                   │
│                                                                     │
│  Section 2: Evidence                                                │
│    Data sources · [Link to integrated systems]                      │
│    Sample traces · [Instrument specific workflows]                  │
│                                                                     │
│  Section 3: Root causes                                             │
│    Primary causes · [3-5 identified]                                │
│    Secondary factors · [contributing but not causal]                │
│                                                                     │
│  Section 4: Implications                                            │
│    Cost of status quo · [quantified]                                │
│    Risk if unchanged · [categorized]                                │
│                                                                     │
│  Section 5: Baseline lock                                           │
│    Metrics locked for Phase 7 comparison · [formal attestation]     │
│                                                                     │
│  Section 6: Path forward                                            │
│    Transition summary · [what Phase 5 Design must address]          │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 4 Diagnosis for Contact Center AI. Heavy lift but the       │
│   most important phase. Recommended sequence:                       │
│                                                                     │
│   1. Run Situation Intelligence to profile current state.           │
│      Produces a first draft of Sections 1-2 in ~8 minutes,          │
│      using integrated data (or placeholder data in test drive).     │
│   2. Run Cost Intelligence to quantify economic dimensions.         │
│      Feeds Section 4 implications.                                  │
│   3. Once baseline data is in, we work on root causes together.     │
│      This is where your consulting judgment matters most.           │
│                                                                     │
│   The Genome has 3 root-cause patterns for Contact Center AI at     │
│   retail scale. Want me to surface them as hypotheses to test?"     │
│                                                                     │
│   [Run Situation Intelligence]  [Show root-cause patterns]          │
└─────────────────────────────────────────────────────────────────────┘
```

### The diagnostic deck artifact

Structured like a consulting deliverable — because it should be presentable to the sponsor at Phase 4 review. Six sections, each with distinct content type:

**Section 1 · Current state**
- Baseline metrics table
- Operating model diagram (can be mermaid or image)
- Key stakeholders' perspectives (quotes or summaries)

**Section 2 · Evidence**
- Data sources cited (with provenance per Data Layer spec)
- Sample traces or instrumented workflows
- Benchmark comparisons (cohort peers from Tower data)

**Section 3 · Root causes**
- Primary root causes (3-5 typically)
- Evidence for each cause
- Secondary contributing factors

**Section 4 · Implications**
- Cost of status quo (quantified)
- Risk profile if unchanged (regulatory, competitive, operational)
- Opportunity size if addressed

**Section 5 · Baseline lock**
- Specific metrics locked for Phase 7 verification
- Measurement methodology documented
- Formal baseline attestation (signed)

**Section 6 · Path forward**
- What Phase 5 Design must address
- Constraints discovered in diagnosis
- Open questions deferred to Phase 5

## 6.3 Intelligence product integration in Phase 4

Phase 4 is where Intelligence products are most heavily used. Integration specifics:

### Situation Intelligence

Invoked from Phase 4. Returns a profile of the current state: baseline metrics, workflow decomposition, stakeholder perspectives, observed patterns.

Fixture output for Contact Center AI archetype (seeded per Packet 3):

```
SITUATION INTELLIGENCE · Contact Center AI · Apex Retail

CURRENT STATE

Volume & capacity
- Annual inquiry volume: 2.3M inbound voice
- Peak handle time: 9.4 min (holiday season)
- Average handle time: 7.2 min (6-month trailing)
- Agent capacity: 340 FTEs across 3 regional centers

Quality indicators
- First-contact resolution: 58% (industry median: 72%)
- CSAT on complex inquiries: 64/100, declining 8 points over 12 months
- Agent satisfaction: 58/100 on post-shift survey

Cost profile
- Agent cost: $34M annual fully-loaded
- Training cost: $2.8M annual (34% annual turnover)
- Technology cost: $4.1M annual (Genesys + legacy CRM)

OBSERVED PATTERNS

1. Tool fragmentation
Agents average 22 tool switches per call across 4 primary systems.
Root pattern match: fragmented tooling in retail contact centers.

2. Escalation accumulation
58% first-contact resolution is below peer median (72%).
Pattern suggests: top-intent coverage gap + insufficient agent tooling.

3. Turnover cost loop
34% annual turnover → $2.8M training cost → inexperienced agents
handle inquiries poorly → low satisfaction → turnover continues.

Three root-cause hypotheses for further investigation in Phase 4.
```

This is a 1-2 page output that feels like genuine diagnostic work. Not generic consulting slop.

### Cost Intelligence

Invoked from Phase 4 Section 4 (implications). Quantifies current cost structure, projects savings from solution shape.

### Risk Intelligence

Invoked when regulatory or compliance dimensions surface. Maps applicable frameworks, identifies gaps.

### People Intelligence

Invoked when workforce/change management is central. Surfaces skills gaps, training needs, organizational readiness.

### Time Intelligence

Invoked when sequencing is critical. Produces Gantt-style implementation sequences with dependencies.

All five can be invoked from Phase 4. Not all are relevant to every Program. Nexus recommends which to run based on archetype.

## 6.4 Nexus behavior in Phase 4

### Opening message

Varies by data integration status:

**Fully integrated (Tower connections live, real data flowing):**
> "Phase 4 Diagnosis. Integrated data is live — I can run Situation Intelligence against your actual telephony and CRM data. Expected runtime 8-12 minutes, produces a real diagnostic profile. Ready to start?"

**Partially integrated (some data, some gaps):**
> "Phase 4 Diagnosis. Integrated data covers telephony but not CRM — we can get 60% of the profile from real data, 40% will be gap-flagged. Acceptable for initial diagnosis; we can deepen later. Start?"

**No integration (test-drive mode):**
> "Phase 4 Diagnosis. Test-drive mode — I'll run Situation Intelligence against the Contact Center AI archetype fixture, which produces a realistic diagnostic profile based on typical retail patterns. Not your actual data, but representative. Good enough for walking through the module experience."

Honest about data source. Never pretends to have data it doesn't.

### Mid-phase behaviors

**Root-cause hypothesis surfacing:**

After Situation Intelligence runs, Nexus proactively offers Genome root-cause patterns:

> "Situation Intelligence surfaced three patterns that match Genome's retail contact center library:
>
> 1. **Tool fragmentation** — agents switching between 4+ systems per call. Observed across 7 retail engagements.
> 2. **Intent coverage gap** — top-intent routing incomplete, escalation rate high. Observed across 5 engagements.
> 3. **Training ROI decline** — high turnover erodes training investment. Observed across 4 engagements.
>
> These are hypotheses, not conclusions. Want to investigate one at a time, or run parallel tests?"

**Baseline lock workflow:**

When Section 5 approaches completion:

> "Baseline lock is a formal attestation. Once locked, these metrics become the Phase 7 comparison reference. Any drift in Phase 6-7 gets measured against this baseline.
>
> Draft baseline:
> - Handle time: 7.2 min (source: Genesys exports, 6-month trailing)
> - First-contact resolution: 58% (source: CRM close-codes, 6-month trailing)
> - Agent turnover: 34%/year (source: HRIS, trailing 12 months)
> - CSAT complex: 64 (source: post-call survey)
>
> Want to review methodology before locking, or lock as-is?"

Locking happens with sponsor or owner signature, similar to Phase 3 charter lock.

**Evidence quality flagging:**

When Nexus detects weak evidence:

> "Section 3 root cause 'tool fragmentation' is asserted but only supported by one data point (22 tool switches average). For Phase 5 to design against this cause confidently, we should instrument 20-30 real calls or pull timestamps from the agent tools. Want to add that as a Phase 4 task?"

Substantive. Treats Phase 4 as real diagnostic work, not template filling.

## 6.5 Phase 4 gate criteria

```
Phase 4 · Diagnosis — Gate Criteria

✅ Current state section complete (metrics + operating model)
✅ Evidence section has min 3 data sources + provenance
✅ Root causes identified (min 3 primary) with evidence backing
✅ Implications quantified (cost + risk)
✅ Baseline locked with attestation
⬜ Path forward summary written (what Phase 5 must address)

[Advance to Phase 5]  ← enabled when 6 of 6 met
```

Heavier gate criteria than Phase 1/2. Phase 4 outputs are referenced throughout the rest of the Program.

## 6.6 Phase 5 · Design purpose

Phase 5 answers "what exactly are we building and how?" Three outputs:

1. **Solution architecture.** Technical architecture, data architecture, integration points, model choices, infrastructure. Specific enough that engineering can estimate and build.

2. **Implementation plan.** Who does what, in what sequence, with what dependencies. Milestones defined. Timeline estimated.

3. **Operating model.** How does this run post-launch? Who owns it? What's the support structure? What does "healthy production" look like?

Phase 5 is where abstract diagnosis becomes concrete plan. It's also where the most consequential vendor/technology decisions get made.

## 6.7 Phase 5 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 5 · Design                                                   │
│                                                                     │
│  SOLUTION ARCHITECTURE · v1                                         │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Reference architectures (Genome)                                   │
│  ──────────────────                                                 │
│  Based on Phase 4 diagnosis, three Genome architectures match:      │
│                                                                     │
│  ○ Google CCAI + Genesys Cloud stack                                │
│    Pros: Mature CCAI, good telephony integration                    │
│    Cons: Higher per-minute cost, Google dependency                  │
│                                                                     │
│  ○ Amazon Connect + Lex + Bedrock stack                             │
│    Pros: Modular, can swap LLM layer, AWS-native                    │
│    Cons: More integration work, newer in enterprise contact center  │
│                                                                     │
│  ○ Anthropic + custom routing + Genesys retention                   │
│    Pros: Best LLM reasoning, flexible, retain existing telephony    │
│    Cons: Custom work, model cost less predictable                   │
│                                                                     │
│  [Compare side-by-side]  [Run Technology Intelligence]              │
│                                                                     │
│  Custom architecture (if none match)                                │
│  ──────────────────                                                 │
│  [Start from scratch with Nexus guidance]                           │
│                                                                     │
│  [...continues with Implementation Plan + Operating Model sections] │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 5 Design. Three reference architectures from the Genome     │
│   match your diagnosis. Worth comparing side-by-side before         │
│   committing. Key decision factors:                                 │
│                                                                     │
│   1. Telephony retention: do you want to keep Genesys Cloud or      │
│      replatform? Replatform adds 6+ months but removes a            │
│      constraint.                                                    │
│   2. Model flexibility: if Anthropic gets faster/cheaper, do you    │
│      want to swap? That favors the Bedrock or custom routing        │
│      architectures.                                                 │
│   3. Build-vs-buy weight: how much custom work are you willing      │
│      to take on vs vendor-managed?                                  │
│                                                                     │
│   Want me to walk through the three architectures, or go straight   │
│   to Technology Intelligence for deeper comparison?"                │
│                                                                     │
│   [Walk through architectures]  [Run Technology Intelligence]       │
└─────────────────────────────────────────────────────────────────────┘
```

### The solution architecture artifact

Four sub-sections:

**Technical architecture:**
- Diagram (mermaid or image)
- Component inventory (what runs where)
- Data flow (how data moves between components)
- Model/AI layer (what AI components, from what vendors)

**Integration architecture:**
- Source systems integrated
- API contracts
- Data refresh cadence
- Error handling patterns

**Implementation plan:**
- Workstreams (parallel tracks)
- Milestones with dates
- Dependencies mapped
- Team structure and allocation

**Operating model:**
- Production ownership (who runs this post-launch)
- Support structure (L1/L2/L3)
- Monitoring and alerting
- Iteration cadence (how often does the AI layer get updated)

## 6.8 Nexus behavior in Phase 5

### Opening message

Varies by Genome match strength:

**Strong archetype match:**
> "Phase 5 Design. Three reference architectures from the Genome match your diagnosis. Most Contact Center AI engagements pick one of these three and adapt. Let's compare."

**Weak archetype match (custom territory):**
> "Phase 5 Design. Your diagnosis surfaced unusual constraints — the Genome has no strong reference architecture match. This is custom territory. We'll work through architecture together, drawing from adjacent patterns where useful, but expect more authoring and less templating."

### Architecture comparison

When user asks to compare architectures:

> "Side-by-side comparison of the three candidates. Numbers are estimates based on Genome observations, not your specific context:
>
> | Dimension | CCAI + Genesys | Amazon Connect + Bedrock | Anthropic + Custom |
> |---|---|---|---|
> | Total cost yr 1 | $8.2M | $6.4M | $5.8M |
> | Time to production | 9 months | 12 months | 14 months |
> | Flexibility | Medium | High | Very high |
> | Vendor risk | Medium (Google) | Low (AWS-native) | Medium (custom) |
> | LLM performance | Good | Good | Best |
>
> Tradeoffs: CCAI ships faster but locks you into Google. Amazon Connect is AWS-native but adds integration work. Anthropic-custom is the most flexible but most authored.
>
> Which tradeoff matters most to you?"

Substantive comparison. Not hedge-everything.

### Implementation plan drafting

After architecture is chosen:

> "Architecture locked: Anthropic + custom routing + Genesys retention. Drafting implementation plan based on Genome's typical Phase 5 → Phase 6 sequences for this pattern:
>
> Workstreams:
> 1. Routing layer build (custom, 4 months)
> 2. Agent assist (Anthropic, 3 months, parallel)
> 3. Genesys integration (2 months, depends on workstream 1)
> 4. Training program (2 months, parallel)
> 5. Pilot launch (1 month, after workstreams 1-4)
>
> 8-10 month implementation. Draft timeline or adjust workstreams first?"

### Vendor selection support

When Phase 5 requires vendor selection (especially for Supplier Consolidation archetypes):

> "Vendor consolidation in scope. Current state: Jasper, Abridge, Grammarly (per Phase 1 charter). Target state: 1-2 consolidated vendors covering the consolidated use cases.
>
> Want me to run Market Intelligence to evaluate consolidated-vendor options? It produces a 3-5 vendor shortlist with evaluation criteria."

Intelligence product invocation is the main mechanism for substantive analysis.

## 6.9 Phase 5 gate criteria

```
Phase 5 · Design — Gate Criteria

✅ Technical architecture documented (diagram + components)
✅ Integration architecture documented
✅ Implementation plan with milestones
✅ Operating model defined
🟡 Budget estimate produced (can be range)
🟡 Technology Intelligence run (if Genome match was weak)
⬜ Sponsor review of design completed

[Advance to Phase 6]  ← enabled when hard criteria met
```

## 6.10 Nexus pattern continuity across Phases 4-5

One of the product's key value propositions is Nexus maintaining context across phases. Phase 5 should explicitly reference Phase 4 findings.

Example:

> "Your Phase 4 diagnosis identified tool fragmentation (22 tool switches per call) as a primary root cause. The architecture we're designing needs to solve that specifically. The Anthropic + custom routing option scores best on that dimension — single-agent interface, integrated routing. The CCAI stack scores lower — still requires 8-10 tool touches per call in production."

Anchors Phase 5 decisions in Phase 4 evidence. Prevents Phase 5 drift from diagnostic findings.

## 6.11 Test-drive acceptance for Phases 4-5

**Expected experience:**
- Situation Intelligence (or any Intelligence product) returns substantive output within 30 seconds in test-drive
- Genome root-cause patterns surface naturally, 2-3 per archetype
- Reference architectures appear with substantive pros/cons
- Baseline lock mechanism feels ceremonial, not arbitrary
- Nexus references Phase 4 diagnosis explicitly in Phase 5

**Test-drive success:**
At least 6 of 10 programs should reach Phase 5 Design with substantive architecture decisions. Programs where Phase 4 was rushed (test-drive speed) show visible "need more diagnosis" signals in Phase 5.

## 6.12 Decisions locked in Packet 6

| # | Decision | Rationale |
|---|---|---|
| 6.L1 | Phase 4 produces three outputs: baseline metrics, root causes, diagnostic deck | Verifiable, presentable, evidenced |
| 6.L2 | Diagnostic deck has six sections | Consulting-deliverable structure |
| 6.L3 | Intelligence products are heavily integrated in Phase 4 | Product capability becomes Phase 4 tooling |
| 6.L4 | Baseline lock is formal attestation with signature | Phase 7 verification anchor |
| 6.L5 | Nexus surfaces Genome root-cause patterns proactively | Smart Phase 4 behavior |
| 6.L6 | Phase 5 produces solution architecture + implementation plan + operating model | Full design scope |
| 6.L7 | Genome reference architectures offered when match; custom territory acknowledged when not | Honest capability surfacing |
| 6.L8 | Architecture comparison is substantive (side-by-side with tradeoffs) | Not hedge-everything consulting |
| 6.L9 | Nexus maintains Phase 4 → Phase 5 continuity explicitly | Context preservation value |

---

## Packet 6 · Checkpoint

**STATUS · Track B, Packet 6 of 7 complete**

Phases 4-5 specified. Diagnostic deck structure, Intelligence product integration, solution architecture generation, Genome reference architecture matching, implementation planning. Ready for final Packet 7 (Phases 6-7).

---

# PACKET 7 · Phases 6-7 · Build/Deploy and Verify

The closing arc of a Program. Phase 6 is execution — the team actually builds and deploys the solution designed in Phase 5. Phase 7 is attestation — formal verification that baseline metrics moved in promised directions, with sponsor sign-off that the Program delivered.

These phases close the loop that started with Phase 1's charter. The charter said "we'll do X to achieve Y." Phase 7 says "we did X and here's Y, verified against the baseline locked in Phase 4." If that traceability holds, AbarVa's outcome accountability value proposition is real. If it doesn't, Programs drift and outcomes are vibes.

## 7.1 Phase 6 · Build/Deploy purpose

Phase 6 is the longest phase by duration — often 3-9 months of actual engineering work. In terms of product experience, Phase 6 has two distinct sub-phases:

**Phase 6a · Build.** Engineering, integration, data preparation, model training/tuning, UAT. Months of work, mostly happening outside AbarVa. AbarVa's role: tracking milestones, surfacing blockers, maintaining status visibility for sponsor.

**Phase 6b · Deploy.** Pilot launch → staged rollout → full production. AbarVa's role becomes more active here — attestation workflows begin, early verification data flows in, rollback/adjustment decisions surface.

A well-run Phase 6 produces a system in production, instrumented for verification, with clear ownership and early indicators of whether Phase 7 will succeed.

## 7.2 Phase 6 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 6 · Build / Deploy                                           │
│                                                                     │
│  EXECUTION STATUS                                                   │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Current sub-phase: 6a · Build  [6a] [6b]                           │
│                                                                     │
│  Workstreams (from Phase 5 plan)                                    │
│  ──────────────────                                                 │
│                                                                     │
│  ✅ Routing layer · complete · 4.2 months (on plan)                 │
│  🟡 Agent assist · 2 months in · 1 month behind on integration      │
│  ⬜ Training program · starts in 3 weeks                            │
│  ⬜ Pilot launch · targeted for September 1                         │
│                                                                     │
│  Recent milestones                                                  │
│  ──────────────────                                                 │
│  • May 4: Routing layer code-complete                               │
│  • April 22: Agent assist alpha with 3 test users                   │
│  • March 18: Genesys API contract signed                            │
│                                                                     │
│  Blockers + risks                                                   │
│  ──────────────────                                                 │
│  🟡 Agent assist integration delayed — Genesys API rate limiting    │
│     discovered in testing. Workaround in progress.                  │
│  🟢 Legal review on customer notification — on track                │
│  🔴 Training content authoring behind plan — 3 weeks late           │
│                                                                     │
│  [Mark milestone complete]  [Log new blocker]  [Update timeline]    │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 6a build is progressing. Routing layer shipped on plan,     │
│   agent assist is slightly behind due to Genesys API constraints.   │
│   Two things worth your attention:                                  │
│                                                                     │
│   1. The training content delay (3 weeks) puts pilot launch at      │
│      risk. Worth raising with Priya at the next sync, or can we     │
│      parallelize training authoring?                                │
│   2. We're approaching the transition to 6b Deploy. Worth           │
│      pre-running Risk Intelligence to confirm compliance posture    │
│      before pilot. I can draft a pre-pilot checklist.               │
│                                                                     │
│   The Genome's Phase 6 common pattern for Contact Center AI         │
│   recommends 2-week pilot with explicit rollback criteria. Want     │
│   me to draft those now?"                                           │
│                                                                     │
│   [Draft pre-pilot checklist]  [Draft rollback criteria]            │
└─────────────────────────────────────────────────────────────────────┘
```

### The build plan artifact

Distinct from Phase 5's implementation plan. Phase 5 designed the plan; Phase 6 executes it. The Build Plan artifact tracks execution:

Structure:
- **Workstream status** — per workstream, % complete, on/off plan, blockers
- **Milestone log** — chronological record of what shipped when
- **Blocker register** — active blockers with owner and resolution path
- **Risk register** — updated from Phase 1-3 risks with current status
- **Timeline tracking** — original plan vs current forecast
- **Team activity** — weekly contributions and handoffs

### The runbook artifact

Produced in Phase 6b (deploy). Operational document for running the system in production:

- System architecture diagram
- Monitoring and alerting specification
- Common failure modes and responses
- On-call procedures
- Rollback procedures
- Upgrade procedures
- Data refresh procedures

Runbook is handed to the operating team at production launch. Referenced in Phase 7.

## 7.3 Phase 6 sub-phase transition

Phase 6a → Phase 6b transition requires explicit criteria:

```
Phase 6a · Build — Completion Criteria

✅ All workstreams code-complete
✅ Integration testing passed
✅ Security review passed
✅ UAT with representative users passed
✅ Runbook drafted
✅ Rollback plan defined
⬜ Pre-pilot sponsor sign-off

[Enter Phase 6b Deploy]  ← enabled when all met
```

This is a real gate. Pre-production systems that haven't been UAT'd shouldn't enter pilot. The product enforces this.

## 7.4 Phase 6 Nexus behaviors

### Opening message variations

**Phase 6a active, on plan:**
> "Phase 6a Build. Routing layer is complete, agent assist is in progress. Pilot launch targeted for September 1. Want to walk through workstream status, or focus on any specific risk?"

**Phase 6a with meaningful delays:**
> "Phase 6a Build. Two workstreams are behind plan — agent assist (1 month) and training content (3 weeks). Together, these put pilot launch at risk. Want to re-plan timeline, or push for parallelization?"

**Phase 6b active (pilot or rollout):**
> "Phase 6b Deploy. Pilot is live at three regional centers as of [date]. Early metrics: [summary]. 10-day checkpoint coming up. Want to walk through pilot data, or focus on rollout sequencing?"

### Mid-phase behaviors

**Blocker triage:**

When a blocker is logged:

> "New blocker logged: Genesys API rate limiting in agent assist. From Genome patterns, this is usually resolvable in 2-3 weeks via either rate limit increase (ask Genesys), caching layer (engineering work ~1 sprint), or scope narrowing (fewer agents in pilot).
>
> Recommendation: rate limit increase first (fastest), caching as backup. Want me to draft the Genesys request?"

Substantive problem-solving, drawing on Genome experience.

**Milestone forecasting:**

When timeline drift accumulates:

> "Three milestones slipped by an average of 11 days. If that rate continues, pilot launch shifts to Sep 22 instead of Sep 1. Worth discussing with Priya before drift becomes a surprise. Want me to draft the conversation framing?"

Proactive surfacing of timeline risk before it becomes crisis.

**Pre-pilot readiness:**

As Phase 6a completion approaches:

> "Pre-pilot readiness check. From Genome patterns, Contact Center AI pilots commonly underperform when one of these is skipped:
>
> 1. Agent training (30-60 min per agent minimum, not optional)
> 2. Fallback paths (human escalation rate must be clear upfront)
> 3. Monitoring dashboards (real-time visibility day 1, not day 14)
> 4. Customer communication (if customers interact with AI, they should know)
>
> Which of these is on plan vs at risk? I can draft checklists for any that need strengthening."

Drawing on pattern library to prevent common failures.

### Phase 6a → Phase 6b transition

Explicit ceremony when build completes:

> "Phase 6a Build complete. Sponsor sign-off captured from Priya. Moving to Phase 6b Deploy.
>
> Phase 6b begins with pilot launch September 1. Pilot parameters:
> - 3 regional centers
> - 10% of inbound voice traffic
> - 14-day duration before evaluation
> - Rollback criteria documented in runbook
>
> First 48 hours of pilot are the highest-signal window. I'll set up proactive monitoring to surface any anomalies. Anything else worth adding to the pre-launch checklist?"

### Production incident response

Post-launch, if incidents occur:

> "Production incident logged: 34% override rate spike in Region 2 (baseline: 18%). Compared to Genome patterns for Contact Center AI, this matches the 'intent coverage gap' pattern — usually means top-intent training set doesn't cover some regional vocabulary.
>
> Three options:
> 1. Rollback Region 2 to pre-AI workflow (safest, loses AI coverage)
> 2. Route around affected intents (preserves AI for unaffected intents, 2-day engineering work)
> 3. Add regional training data and retrain (best long-term, 2-3 week work)
>
> What's the severity from Jake's team's perspective?"

Substantive incident triage based on Genome knowledge.

## 7.5 Phase 6 gate criteria

```
Phase 6 · Build/Deploy — Gate Criteria (Phase → Phase 7)

✅ Phase 6a completed (pre-pilot sign-off captured)
✅ Phase 6b pilot launched and ran for minimum duration
✅ Pilot evaluation completed (decision: rollout, adjust, rollback)
✅ Full rollout completed (or decision made to limit scope)
✅ Runbook finalized and handed to operating team
✅ Production monitoring active with 30+ days of data
🟡 Early performance indicators directionally positive

[Advance to Phase 7]  ← enabled when hard criteria met
```

Notably: Phase 6 doesn't close just because pilot launched. Phase 6 closes when production is stable enough to evaluate against baseline. Typically 30-90 days post-launch.

## 7.6 Phase 7 · Verify purpose

Phase 7 is the moment of truth. The baseline metrics locked in Phase 4 are compared against current state. The charter promises from Phase 1-3 are evaluated. The sponsor attests — formally — that the Program delivered (or didn't).

This is where AbarVa's outcome-accountability value proposition becomes concrete. Fortune 50 CIOs demonstrably lack this today — most AI programs declare success based on activity (deployed, used) rather than outcome (verified against baseline). Phase 7 is AbarVa's answer to that gap.

Phase 7 has three outputs:

1. **Verification report.** Evidence-backed comparison of current vs baseline. What moved, what didn't, by how much, with confidence intervals.
2. **Sponsor attestation.** Formal sign-off with sponsor signature on the verification. Recorded with timestamp and supporting evidence.
3. **Handoff ceremony.** The Program transitions from active to steady-state. Ownership formally shifts to the operating team. Lessons learned captured for Genome contribution.

## 7.7 Phase 7 landing experience

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 7 · Verify                                                   │
│                                                                     │
│  VERIFICATION REPORT · v1 DRAFT                                     │
│  ─────────────────────────────────────                              │
│                                                                     │
│  Baseline vs current (locked Phase 4 → measured Phase 7)            │
│  ──────────────────                                                 │
│                                                                     │
│  | Metric                    | Baseline | Current | Δ      | Target |
│  |---------------------------|----------|---------|--------|--------|
│  | Handle time (avg min)     | 7.2      | 5.8     | -19%   | -20%   |
│  | First-contact resolution  | 58%      | 71%     | +13pp  | +10pp  |
│  | CSAT (complex inquiries)  | 64       | 72      | +8pts  | +5pts  |
│  | Agent turnover (annual)   | 34%      | 28%     | -6pp   | -8pp   |
│  | Cost per interaction      | $4.40    | $3.20   | -27%   | -25%   |
│                                                                     │
│  Verified improvements: 4 of 5 metrics at or above target           │
│  Under-target: handle time (at 19%, target was 20%)                 │
│                                                                     │
│  Financial impact                                                   │
│  ──────────────────                                                 │
│  Projected annualized savings: $8.4M (vs target $7M)                │
│  Evidence: [link to cost analysis with provenance]                  │
│                                                                     │
│  Qualitative outcomes                                               │
│  ──────────────────                                                 │
│  • Agent satisfaction up 15 pts (survey evidence)                   │
│  • Customer complaints down 22% (ticket system evidence)            │
│  • Regulatory posture maintained (audit trail complete)             │
│                                                                     │
│  Attestation                                                        │
│  ──────────────────                                                 │
│  Sponsor sign-off: [Request from Priya Sethi]                       │
│                                                                     │
│  NEXUS                                                              │
│  ─────                                                              │
│  "Phase 7 Verification. Strong results — 4 of 5 metrics at or       │
│   above target, financial impact 20% over target. One metric        │
│   (handle time) missed target by 1pp; verification report should    │
│   honestly disclose that.                                           │
│                                                                     │
│   Worth noting:                                                     │
│                                                                     │
│   1. Handle time shortfall is small but real. Root cause: holiday   │
│      season traffic mix skewed toward more complex calls. Worth a   │
│      footnote rather than a gap.                                    │
│   2. Cost savings came in higher than target — that's worth         │
│      celebrating, not just reporting. Want me to draft the          │
│      executive summary emphasis?                                    │
│   3. This Program just added to the Genome. Your baseline → target  │
│      → verified pattern is now evidence for future retail Contact   │
│      Center AI engagements.                                         │
│                                                                     │
│   Draft the sponsor attestation request?"                           │
│                                                                     │
│   [Draft attestation request]  [Review full report]                 │
└─────────────────────────────────────────────────────────────────────┘
```

### The verification report artifact

Structured as an executive-grade deliverable:

**Section 1 · Executive summary**
- Headline: Program delivered [X]% of targets
- Financial impact: $[Y] annualized
- Key outcome statements

**Section 2 · Baseline vs verified metrics**
- Full table with baseline, current, delta, target
- Provenance per metric (source system, measurement window)
- Confidence indicators

**Section 3 · Qualitative outcomes**
- Stakeholder perspectives (quotes, survey data)
- Observed second-order effects (positive and negative)
- Regulatory/compliance posture

**Section 4 · Financial verification**
- Cost structure before → after
- Savings calculation methodology
- Third-party audit readiness (for high-impact Programs)

**Section 5 · Lessons learned**
- What worked
- What we'd do differently
- What to add to the Genome

**Section 6 · Attestation**
- Sponsor signature
- Owner signature
- Verification date
- Next review cadence (typically annual re-verification)

## 7.8 Nexus behavior in Phase 7

### Opening message variations

**Strong verification (most metrics at target):**
> "Phase 7 Verification. Strong results across the board — 4 of 5 metrics at target, financial impact over-delivered. This is a clean verification. Want to draft the sponsor attestation, or walk through the report first?"

**Mixed verification (some targets missed):**
> "Phase 7 Verification. Mixed results — 3 of 5 metrics at target, 2 below. The financial impact still exceeds minimum threshold, but the verification report needs to honestly disclose the shortfalls. Worth walking through those before attestation — sponsor won't sign a report that overclaims."

**Weak verification (most targets missed):**
> "Phase 7 Verification. Results are below target on 4 of 5 metrics. This is a hard conversation. Before drafting attestation, worth asking: was the Phase 4 baseline accurate? Did the implementation match the Phase 5 design? Were external factors (market, regulatory) different than expected? Phase 7 that shows weak results deserves a real root-cause analysis, not a cosmetic report."

Nexus doesn't sugarcoat. Verification is verification.

### Mid-phase behaviors

**Evidence quality check:**

> "Before finalizing the verification, let me sanity-check the evidence base:
>
> - Handle time: source Genesys reports, 90-day trailing, confirmed methodology → STRONG
> - First-contact resolution: source CRM close codes, 90-day trailing → STRONG
> - CSAT: source post-call survey, 3-month rolling → MODERATE (survey response rate only 34%)
> - Cost per interaction: derived calculation, formula visible in audit log → STRONG
> - Turnover: source HRIS, trailing 12 months → STRONG
>
> One moderate-confidence metric. Worth disclosing methodology in the report footnotes."

Transparent about evidence strength. Sponsor attestation should carry earned confidence, not claimed confidence.

**Celebrating without over-claiming:**

When results are strong:

> "Two framings for the executive summary:
>
> Conservative: 'Program delivered $8.4M in verified annual savings, meeting or exceeding 4 of 5 targets. Handle time target missed by 1pp due to holiday traffic mix.'
>
> Stronger: 'Program delivered $8.4M in verified annual savings (20% above target). Four of five operational metrics hit or exceeded target. Customer satisfaction improved 8 points. Agent satisfaction improved 15 points.'
>
> Both are honest. Which tone matches Priya's expectation for the board readout?"

Offers choice rather than dictating.

**Sunset recommendation:**

When Phase 7 reveals the Program shouldn't continue at full scope:

> "Verification surfaces something worth flagging. Agent assist adoption plateaued at 42% — well below target of 80%. Root cause analysis suggests the tool saves time only on complex inquiries, not the simple majority. Cost model assumed 80% usage; at 42%, ROI is still positive but below originally-projected.
>
> Options:
>
> 1. Formally verify what was delivered, acknowledge the coverage gap, continue at current scope.
> 2. Narrow scope to complex inquiries explicitly, re-forecast ROI, attest to narrower Program.
> 3. Sunset the agent assist component, keep routing layer. Retain some value, eliminate underperforming part.
>
> This is a sponsor conversation. Want me to draft framing for it?"

Honest alternatives to "celebrate success."

### Genome contribution

After verification:

> "Phase 7 verified. Three things from this Program are candidates to contribute to the Genome:
>
> 1. The baseline methodology for contact handle time in multi-region retail — well-documented, reusable.
> 2. The Genesys API rate limit workaround — the caching pattern your team built is novel.
> 3. The 42% adoption plateau on agent assist — useful failure pattern to surface in future Genome retrievals.
>
> Want to flag these for Genome promotion? The Genome curator will review before accepting; you decide now whether to nominate."

Explicit loop back to the Data Layer spec's Genome promotion workflow.

## 7.9 Phase 7 gate criteria (Program closure)

```
Phase 7 · Verify — Gate Criteria (Program → Steady-state)

✅ Baseline metrics measured against current with ≥ 60 days data
✅ Verification report produced with all 6 sections
✅ Evidence provenance documented for all metrics
✅ Sponsor attestation signed
✅ Owner attestation signed  
🟡 Genome contribution candidates identified
⬜ Handoff ceremony completed (operating team acknowledged ownership)

[Close Program to Steady-state]  ← enabled when all hard criteria met
```

Post-closure:
- Program moves to "Steady-state" in Tower portfolio
- Annual re-verification scheduled
- Operating team takes ownership
- Decision log archived
- Nexus thread archived (retrievable but not active)

## 7.10 Handling unsuccessful Programs

Not every Program succeeds. Phase 7 handles this honestly.

### Failed Programs

When verification shows the Program didn't deliver:

**User action:** Select "Program sunsetting — outcomes not achieved"

**Resulting artifact: Sunset verification report**
- Section 1: Honest acknowledgment of miss
- Section 2: Baseline vs actual, even when actual is worse
- Section 3: Root cause analysis — why didn't it work?
- Section 4: What costs were incurred, what residual value exists
- Section 5: Lessons for Genome (often more valuable than success lessons)
- Section 6: Sunset approval from sponsor

Nexus behavior:

> "This verification shows the Program didn't deliver promised outcomes. Before attestation, worth a real root-cause analysis — was it execution, scope, external factors, or hypothesis error? Honest answers here become valuable Genome contributions. The 42% adoption story, well-analyzed, could save 3 future Programs from the same mistake."

Failures contribute disproportionately to Genome value. Nexus frames them as learning, not shame.

### Partial success

Most Programs land in partial territory — some metrics hit, others missed. Nexus handles this with graduated framing:

> "Verification is partial — 3 of 5 metrics at target, 2 below. Classifications:
>
> **Delivered:** first-contact resolution, CSAT, agent turnover — all at or above target
> **Missed:** handle time (19% vs 20%), cost per interaction (12% vs 25%)
>
> Framework for partial verification: report all results, claim credit for delivered, honestly disclose missed. Don't conflate 'delivered' with 'met all targets.' Sponsor should sign what's true, not what's aspirational."

## 7.11 Test-drive acceptance for Phases 6-7

**Expected experience:**
- Phase 6 build tracking feels realistic (milestones, blockers, timeline drift)
- Nexus surfaces Genome patterns for common Phase 6 failure modes
- Phase 6a → 6b transition is ceremonial
- Phase 7 verification report feels like a real deliverable
- Sunset handling is dignified, not shaming
- Genome contribution prompts appear naturally

**Test-drive success:**
At least 2 of 10 programs reach Phase 7 verification in test-drive. At least 1 should be a Program showing mixed or weak results (to exercise the honest-verification flow).

## 7.12 Decisions locked in Packet 7

| # | Decision | Rationale |
|---|---|---|
| 7.L1 | Phase 6 has two sub-phases: 6a Build (engineering), 6b Deploy (pilot → production) | Different product experiences |
| 7.L2 | Phase 6a → 6b transition is a real gate requiring sponsor sign-off | Prevents premature production |
| 7.L3 | Phase 6 artifacts: Build Plan (tracking) + Runbook (operational handoff) | Distinct purposes |
| 7.L4 | Nexus surfaces Genome Phase 6 failure patterns proactively | Prevents common failures |
| 7.L5 | Phase 7 produces Verification Report with 6 sections + Sponsor Attestation | Formal outcome accountability |
| 7.L6 | Verification report discloses evidence strength per metric | Earned confidence, not claimed |
| 7.L7 | Nexus handles mixed or weak verification honestly — no cosmetic reports | Integrity of outcome accountability |
| 7.L8 | Failed Programs get Sunset Verification Report — dignified closure, Genome contribution | Failures fund future learning |
| 7.L9 | Genome contribution is offered post-verification for candidate patterns | Completes the loop to Data Layer spec |
| 7.L10 | Program closes to Steady-state after Phase 7; annual re-verification scheduled | Long-tail outcome tracking |

---

## Packet 7 · Checkpoint

**STATUS · Track B, Packet 7 of 7 complete · TRACK B COMPLETE · DOCUMENT COMPLETE**

Phases 6-7 specified. Phase 6 build tracking and deploy sub-phases, Phase 7 verification report structure, sponsor attestation workflow, honest mixed-outcome handling, Genome contribution loop.

---

# DOCUMENT COMPLETE · Summary

## What was specified

**Track A · Test-Drive Readiness (Packets 1-3)**
- `test_drive_mode` flag architecture with behavior across Programs / Tower / Intelligence / agents
- Six test-drive promises serving as acceptance criteria
- 10 canonical test-drive archetypes across 2 clients × 3 functions × 3 objectives
- 28-item friction inventory organized in 6 categories with severity ratings
- 15 blockers to resolve before acceptance, grouped into 5 implementable work packages
- 6 seed data categories totaling 41-47 hours of authoring across 2 weeks
- Quality bars and anti-patterns for all seed content

**Track B · Module Experience (Packets 4-7)**
- Phase 1 Ideation: three entry paths (blank / archetype / signal origination), six-section charter, Nexus opening variations, gate criteria
- Phases 2-3 Validation and Charter: feasibility assessment, downgrade-to-experiment handling, formal lock ceremony, signature mechanisms
- Phases 4-5 Diagnosis and Design: six-section diagnostic deck, Intelligence product integration, Genome reference architecture matching, solution architecture + implementation plan + operating model
- Phases 6-7 Build/Deploy and Verify: execution tracking, pilot-to-production gates, honest verification with graduated framing for strong/mixed/weak outcomes, Sunset Verification for failed Programs, Genome contribution loop

## What unlocks what

Claude Code work list from this spec:
1. Migration for `test_drive_mode` flag + associated exclusion logic
2. Three-option creation modal + archetype library retrieval
3. Phase gate criteria component with click-to-jump
4. Scaffolded artifact templates for 7 phases (7 distinct artifact types)
5. Intelligence product invocation from within phase modules
6. Autosave + session recovery across all phases
7. Bulk-create and bulk-delete utilities for test-drive
8. Nexus system prompts per phase + per entry context
9. Genome pattern retrieval wiring

Seed data work list from this spec:
- 20 Genome archetypes (10-12 hours)
- 35 solution patterns (8-10 hours)
- 18 failure modes (6 hours)
- 12 reference architectures (2 hours)
- 10 Intelligence fixtures for Phase 0 (5 hours)
- 15 industry cohort peers (10-12 hours)

Codex design work list from this spec:
- Refined creation modal (3-option UX)
- Scaffolded charter editor with section prompts
- Gate criteria component (clickable, state-aware)
- Phase-specific artifact workspaces (7 distinct designs)
- Intelligence product invocation flow (in-panel, not side-navigated)
- Verification report presentation (executive-deliverable quality)

## Acceptance

Test-drive ready when: Anand creates 10 Programs across both clients in one 3-hour session, progresses them through varied target phases (Phase 1 through Phase 7), and produces at least one complete verification report. Without intervention, without data loss, without dead ends.

When that's true, the product is ready for design partners and for Prat.

---

**END OF DOCUMENT**
