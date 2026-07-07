# Design Module Review — Source Module Redesign

**Reviewer:** Claude design module
**Date:** 2026-06-04
**Reviewing:** `docs/build/source-design/03-build-specs.html` (19 specs, draft v1)
**Against:** The bar (Part 2) · the locked tokens (Part 3) · and the **northstar agreed 2026-06-04 — Apple-grade ease and elegance, with the Moves module as the quality reference.**
**Companion artifact:** `06-strategy-screen.html` (corrected Strategy stage — proof-of-bar for Wave 2)

---

## Northstar (the lens every spec is judged through)

The Moves module set the bar. Four properties, non-negotiable, applied to every Source surface:

1. **One obvious next action per screen.** If a user has to hunt for what to do, the screen has failed.
2. **The answer leads; the machinery hides.** Page 1 states the decision or the next move. Reasoning, evidence, and history live below the fold or behind a click.
3. **Quiet hierarchy.** Serif headline carries the page. Mono eyebrows are used *once* per region, never stacked three deep. Status color is semantic, never decorative.
4. **Subtract before adding.** Every visible element must change what the user does next. The Strategy screenshot (five export buttons on a not-started memo) is the anti-pattern to design against.

The squint test (blur 50%, primary action still obvious) is the acceptance gate for every visual spec.

> **One caveat on tokens.** Moves uses Fraunces / `#0066CC`. Source keeps its **own locked tokens** (Georgia, accent `#1d4ed8`, paper `#F8F7F4`, per 2026-04-16). We match the *discipline and experience* of Moves, not its palette. Do not propose font/color changes — locked.

---

## Cross-spec questions — resolved (decide these before Wave 1)

These eight gate every downstream decision. Resolved with a bias toward the northstar.

### Q1 · Voice and tone → **Second-person directive. Hold it everywhere.**
"Draft your Strategy Memo" beats "Strategy memo awaiting draft." The directive voice *is* the next-action discipline — it names what the user does. Passive/system-narrator voice re-introduces the "where do I go?" problem we're closing. Reserve passive voice for *status* lines only ("Waiting on client"), never for *actions*.

### Q2 · Density philosophy → **Vary density by mental task. Do not lift uniformly.**
Bar principle #3 already says this. Portfolio/queue = high-density scan surfaces (executive triage). Canvas/intake = low-density focus surfaces (one task at a time). The Strategy redesign proves it: the empty drafting stage should be *calm*, leading with one Next Move card — not packed. Density is a tool, not a default.

### Q3 · Sentinel chat positioning → **Proportional (Spec 6 axis is right). Not modal.**
A persistent modal overlay competes with the document for the same screen and the same job. Proportional-collapse keeps Sentinel *present but subordinate* on decision stages. One refinement: on stages where the Next Move *is* "draft with Sentinel," the chat and the primary CTA must not duplicate the offer — the CTA owns it, the rail offers *variations* (levers, rigor). See Spec 6 revision.

### Q4 · Approval routing UX → **Collapse to one primary + a "More" menu. Four equal buttons is too much choice.**
Four equal-weight buttons (Approve / Co-approve / Request changes / Reject) violates "one obvious action." Recommended: **Approve** as the single primary; **Send to co-approver** as secondary; **Request changes** and **Reject** behind a quiet "Other decisions ▾" menu. Reject especially should never be a one-click primary on a high-stakes page (misclick risk). See Spec 3 revision.

### Q5 · "Gate" vs "Required to advance" → **Keep "Gate" in author/ops vocabulary; show "Required to advance" in production.**
"Gate" is real sourcing signal internally and in the audit log — keep it in the data model and author mode. But it leaks as jargon in production (the screenshot's red `GATE` badge). Production users see "Required to advance" or a simple unmet-state dot. This is consistent with bar principle #4 (taxonomy never leaks). Both can be true.

### Q6 · Dark header on Executive Decision → **Yes, but make it the *only* dark moment in the lifecycle.**
A single charcoal `#1f2937` header on the one make-or-break decision page is a *deliberate* signal — "this is the moment." It earns the contrast precisely because nothing else in the flow is dark. The risk is not that it's jarring; the risk is that it gets *copied* to other surfaces and becomes noise. Rule: **dark header appears on Executive Decision and nowhere else.** Use accent blue, not charcoal, anywhere a lesser surface wants emphasis. (Note: this is the inverse of the Moves decision — there we pulled dark *out*. Here one dark moment is load-bearing. The difference is intentional and defensible: Moves is a browsing home; Exec Decision is a singular verdict.)

### Q7 · Mobile → **Wave 5, separate exercise. Do not retrofit into every spec now.**
CXOs review on phones, but the lifecycle *work* (drafting, scoring, pricing) is desktop. Building responsive into all 19 specs now triples the surface area and slows Wave 1's load-bearing fixes. Better: ship desktop to the bar, then a focused Wave 5 that makes the *read* surfaces (Exec Decision page-1, CXO Report, Value board pack, Decision Queue) phone-excellent. Author/drafting stays desktop.

### Q8 · Empty states → **Author them now, for every surface. This is the redesign's biggest quick win.**
The screenshot proves empty states are where the product feels most broken ("No DB-backed documents yet"). They're not an afterthought — they're the *first* thing a new user sees on every stage. Every spec that renders a list or shelf must spec its empty state to the bar: lead with the Next Move, never apologize for an empty database. Add "empty state authored" to the acceptance checklist of Specs 1, 5, 7, 8, 9, 10, 11, 13, 16, 18.

---

## Per-spec review

Legend: **✅ Approved as-is** · **✏️ Approved with revisions** · **⛔ Needs rework before Codex**

---

### Spec 1 · Decision queue · triage bands — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Band cards ARE clickable (filter the list). Pure-summary cards waste a click target. Resolves the spec's own open Q.
//   - Do NOT subsplit DUE-THIS-QUARTER by month. Three bands is the scan limit; month sub-splits re-add density we're removing.
//   - Secondary CTAs ("Defer to Q4", "Snooze 30d") DO need a lightweight confirm — they mutate a deadline. Not a full approval flow, but a one-tap "Snooze to {date}?" confirm. No silent destructive-ish actions.
//   - Author the zero state to the bar: "Nothing needs you. {N} active in Portfolio →" — lead with the next place to go, not the absence.
//   - "$X.XM at stake" — keep absolute value for v1. NPV-of-delay is a Wave 3 enrichment, not a Wave 2 blocker.
// Open with Codex before ship: no
```

### Spec 2 · Intake completion footer — ✅ Approved with one note
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Collapse captured facts to a checklist at 5/5 (not expanded). The user just entered them; a tidy confirmation reads as "done," an expanded form reads as "still working."
//   - Keep the pilot-mode self-approval note OFF the intake footer; it belongs on the approval page where the decision actually happens. Surfacing it twice dilutes it.
//   - No 6th-fact escape hatch. 5 is the schema. An escape hatch invites scope creep into a deliberately bounded step.
// Open with Codex before ship: no
```

### Spec 3 · Approval page (NEW) — ✏️ Approved with revisions · LOAD-BEARING
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Action hierarchy (resolves cross-spec Q4): ONE primary "Approve", ONE secondary "Send to co-approver", and "Request changes" + "Reject" behind a quiet "Other decisions ▾". Four equal buttons fails "one obvious action."
//   - Intake chat trail: expand INLINE (collapsed by default), do not modal. Evidence-at-hand beats focus here — the approver is checking the facts against the conversation.
//   - "Request changes" routes back to /source/new with facts loaded (as specced) — but add an inline "annotate this fact" affordance for single-field nudges that DON'T need a full intake reopen.
//   - When current user is NOT an approver: show a read-only "Pending {sponsor}" version, do NOT 403. A viewer hitting a wall with no context is a dead end; a read-only view is honest and calm.
//   - Self-approval notice (amber) is correct and required. Keep it.
// Open with Codex before ship: yes  (action-hierarchy change touches the API redirect map)
```

### Spec 4 · Lifecycle routing guard — ✅ Approved
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Run the guard in MIDDLEWARE (proxy.ts), not the page component. No flash of canvas is worth the marginal cleanliness of in-component. The spec lists this as optional — make it required.
//   - Closed events → dedicated /summary page (NEW), not a read-only canvas. A summary is a different mental task (review a finished thing) than a canvas (work a live thing); reusing canvas chrome muddies both.
//   - Stale-tab on transition: silent reload is jarring mid-read. Use a non-blocking toast ("This event was just approved — refresh to continue") with a refresh action. Let the user choose the moment.
// Open with Codex before ship: no  (pure routing logic — design has no further input)
```

### Spec 5 · Stage Next-Move pattern — ✅ Approved · this is the spine
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Card is STICKY on scroll. It's the answer to "what do I do" — it must survive scrolling the evidence below it.
//   - Tone: keep directive ("Draft your Strategy Memo"). Not passive, not task-list checkboxes. (Resolves spec's open Q + cross-spec Q1.)
//   - Multi-task stages (Evaluation): ONE Next Move at a time, resolved by the most-blocking sub-task. A list of 3 re-creates the "which do I pick" problem. Sequence them.
//   - NO universal "Skip / I'll do it manually" secondary. Offer manual authoring only where it's real (drafting stages). On scoring/pricing stages there's nothing to "skip" — the secondary would be noise.
//   - See 06-strategy-screen.html for the built reference. Codex builds to that, not just to prose.
// Open with Codex before ship: yes  (the built mock is the contract — walk it together)
```

### Spec 6 · Sentinel chat sizing — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - On EMPTY drafting stages, go further than 40%: collapse Sentinel to the ~30% slim rail (see Strategy mock). 40% of an empty stage still lets the chat dominate. Width should track stage AND artifact-state, not stage alone.
//   - The rail must NOT duplicate the Next Move CTA. If Next Move = "Draft with Sentinel," the rail offers VARIATIONS (levers, rigor), never a second "draft" button. (Resolves cross-spec Q3.)
//   - Manual collapse/expand preference: persist PER-STAGE, not globally. A user who wants chat open on Strategy may want it gone on Exec Decision. Global persistence fights the per-stage policy.
//   - Width transition: instant snap on stage CHANGE (navigation should feel decisive); smooth only on manual toggle.
// Open with Codex before ship: no
```

### Spec 7 · Artifact tile humanization — ✏️ Approved · WIDEN SCOPE
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - SCOPE IS TOO NARROW. The screenshot shows jargon the file list misses: the empty-state headline "No DB-backed documents yet", the right-pane "AWAITING AUTHORING" strip, "STORED DOCUMENTS", and the "Template" sub-badges. Add these files/strings to the sweep.
//   - "Required to advance" as a muted TAG, not a colored dot alone. A bare red dot loses meaning without a label on first encounter; the tag teaches, the dot can follow once learned. (Resolves cross-spec Q5.)
//   - Author mode: ROLE-based (maestro sees codes), not env-based. Support staff debug in production; an env flag hides codes exactly where they're needed.
//   - Do NOT replace the tile shelf with a bare progress %. The shelf names what the stage PRODUCES (real user value); a % bar is machinery. Demote the shelf, don't delete it. (See Strategy mock: "What this stage produces.")
//   - NEW finding folded in here: export/download actions are HIDDEN until an artifact has a body. Five export buttons on a not-started memo is the canonical anti-pattern. Add to acceptance.
// Open with Codex before ship: yes  (scope expansion changes the file list)
```

### Spec 8 · Strategy refit — ✅ Approved · reference built
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Built reference: 06-strategy-screen.html. This IS the target. Codex matches it.
//   - Gate names: paraphrase for the CIO ("Sponsor sign-off", "Value target set", "Archetype confirmed") in production; keep full names in author mode + audit log. (Resolves spec's open Q.)
//   - Add to acceptance: "Export actions hidden until memo has a body" (the gating finding).
//   - Add to acceptance: "Empty stage leads with one Next Move card; Sentinel rail ≤30%; no internal taxonomy visible." (Locks the bar into the DoD.)
// Open with Codex before ship: yes
```

### Spec 9 · Scope + RFP — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Inventory ingestion: EXPLICIT (user-triggered "Pull from CMDB"), not silent. Silent auto-population on stage entry hides provenance — the user must know where the inventory came from to trust it.
//   - Dependency map: simple list with hover for v1. D3 graph is decision-useful but it's a Wave-later enrichment, not a Scope-stage blocker. Don't gate the stage on a viz.
//   - Eval rubric weights: SOFT warning, not hard enforcement, on the "must total 100" rule. Hard-blocking a sourcing lead mid-thought is a paper cut (bar principle #5). Warn amber, let them proceed, block only at sponsor sign-off.
// Open with Codex before ship: no
```

### Spec 10 · Responses + Evaluation — ✅ Approved
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Dissent capture: YES allow attachments (a dissenting reviewer's memo is first-class evidence, per the spec's own "NOT a footnote" framing).
//   - BATNA: explicitly NAMED by the sourcing lead, not auto-derived. Auto-deriving second place from the scorecard is a judgment the system shouldn't make silently — it's a human call the audit log should attribute.
//   - Completeness matrix is the right pattern. Keep the red/amber/green semantics tied to the locked status tokens (--bad/--warn/--good).
// Open with Codex before ship: no
```

### Spec 11 · Pricing + BAFO — ✏️ Approved with revisions · LOAD-BEARING
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Iceberg viz: STACKED BARS, not skeuomorphic iceberg. A literal iceberg is a novelty that costs legibility; the 30/70 visible/hidden split reads instantly as a labeled stacked bar. Information-dense beats cute on a load-bearing CXO surface.
//   - Sensitivity ribbon: PRE-RENDERED scenarios for v1 (volume ±20 / scope ±10 / FX ±5 as fixed cards). Interactive sliders are a Wave-later upgrade; don't block the load-bearing stage on slider state management.
//   - BAFO lever envelope: PER-VENDOR cards, not one grand table. A vendor × lever × open/target/walk-away grand table is unreadable at 3+ vendors. Cards keep each negotiation legible.
//   - This stage carries the CXO "exceed-bar." Hold it to the squint test hardest: the recommended-vendor TCO and the savings number must survive a 50% blur.
// Open with Codex before ship: yes  (viz decisions are load-bearing — confirm before build)
```

### Spec 12 · Executive Decision page-1 summary — ✏️ Approved with revisions · LOAD-BEARING
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Layout: 1+3, NOT 4-cell-equal. Recommendation is HUGE (the answer); Savings / Trade-off / Dissent stack smaller to its right. Four equal cells says "four equal things"; there is one answer and three supports. (Resolves spec's open Q.)
//   - Dark charcoal header: KEEP — but enforce "only dark moment in the lifecycle" (cross-spec Q6). Document this so it doesn't get copied.
//   - No dissent: replace the cell with "RISKS · {n} open" (a real KPI), not an empty "None recorded" cell. Never show an empty cell where a live signal could sit.
//   - "Deciding axis" sentence: HUMAN-authored, surfaced for edit (system drafts a suggestion). It's the single most scrutinized sentence in the whole deal — a human owns it.
//   - Squint test is the acceptance gate here above all. Build to preview-mock fidelity once I mock it (next).
// Open with Codex before ship: yes
```

### Spec 13 · Stage 10 Transition (NEW) — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - KT plan: MILESTONE LIST for v1 (Discovery / Shadow / Reverse Shadow / Cutover / Hypercare with status). Gantt is a Wave-later enrichment. A list ships the lifecycle gap now; a Gantt delays it.
//   - Readiness gate signers: FIXED schema (CIO + CDO + Vendor PM) for v1 with a config hook stubbed. Per-event configurability is real but not a launch blocker.
//   - Risk register: reuse the Evaluation dissent-panel PATTERN (same rated-row + owner + mitigation structure). Don't invent a distinct pattern — consistency is the northstar.
// Open with Codex before ship: no
```

### Spec 14 · Stage 11 Value extension — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - CFO attestation: REUSE the approval-page pattern (Spec 3), don't build a distinct lighter modal. One attestation pattern across the product = learnable once. A second pattern is drift.
//   - Locked baseline: "Locked" badge + signature trail line, not a padlock icon alone. A lone padlock is decorative; the badge + "Locked by {CFO}, {date}" is evidence.
//   - Variance threshold (8%): CONFIGURABLE per event, with 8% default. Different deals have different tolerance; hard-coding 8% will be wrong for someone immediately.
// Open with Codex before ship: no
```

### Spec 15 · Exports rewrites — ✅ Approved
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Page-1 Exec Summary in Deal Pack: LIGHT card (not dark). The dark header is reserved for the in-app Exec Decision surface (Q6 rule). A printed/exported pack reads better light; dark burns ink and breaks the paper aesthetic.
//   - Deal pack: require an explicit "Freeze & generate" action by the CIO. Auto-generating a board-facing artifact on every change risks shipping a half-baked pack. The CIO owns the moment it becomes real.
//   - Events before Stage 8: deal pack is GATED ("available once a decision is authored"). Rendering a deal pack with no decision is the export-of-nothing anti-pattern again.
//   - Branded filename change ({tenant}-{event}-deal-pack-{date}, no "abarva-" prefix): approved, ship it.
// Open with Codex before ship: no
```

### Spec 16 · Evidence drawer (NEW) — ✅ Approved
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - DRAWER, not modal (right-edge, ~28%). Evidence-at-hand is the whole point; a modal that forces focus defeats it. (Resolves spec's open Q.)
//   - Citation chip: superscript link style (cleaner inline), with the [E-001] id on hover/in the drawer. Bracket-ids inline are visually noisy in running prose.
//   - Make the drawer available on Portfolio too (spend-evidence), not canvas-only. Same pattern, broader reach — but Wave 4 is fine for the Portfolio extension.
// Open with Codex before ship: no
```

### Spec 17 · Audit log extension — ✅ Approved
```
// DESIGN MODULE REVIEW
// Approved as-is: Y
// Revisions:
//   - Action names: HUMANIZE in the UI ("AI draft generated", "Gate criterion met"); keep the raw enum in the exported audit packet (auditors want the canonical token). Both audiences served.
//   - Timestamp: browser-local in the UI with a UTC tooltip; UTC-only in the export. Humans read local; auditors read UTC.
//   - AI-action rows: subtle visual differentiation (a small "Sentinel" tag + faint tint), not a different background block. A different bg fragments the timeline; a tag keeps it scannable while marking provenance.
// Open with Codex before ship: no
```

### Spec 18 · Cross-event attention surface (NEW) — ✏️ Approved with revisions
```
// DESIGN MODULE REVIEW
// Approved as-is: N
// Revisions:
//   - Placement: top-nav BELL with count for the ambient signal, opening a panel — NOT a full /attention page for v1. A full page competes with the Decision Queue (which is already the "what needs me" surface). The bell is the lightweight cross-event layer; the queue is the deep one.
//   - Read/unread state: yes, with auto-mark-read on action. Don't auto-dismiss on timer — a missed renewal trigger shouldn't silently vanish.
//   - Email/push scope: only approval-requested + renewal-overdue trigger out-of-app comms for v1. Everything else is in-app. Over-emailing trains users to ignore the channel.
//   - Watch for overlap with the Decision Queue (Spec 1). If the bell and the queue show the same items, one is redundant. Define: queue = events needing a DECISION; bell = events needing your ATTENTION (co-approver waiting, BAFO closing). Keep them distinct or merge them.
// Open with Codex before ship: yes  (queue/bell overlap is a real architecture question)
```

### Spec 19 · Renewal auto-event — ✅ Approved (design) · ⚠️ ops-sensitive
```
// DESIGN MODULE REVIEW
// Approved as-is: Y  (from a design standpoint)
// Revisions:
//   - 180-day trigger: CONFIGURABLE per contract, 180 default. Contract term lengths vary wildly; a hard 180 is wrong for short and very long terms.
//   - Auto-loaded facts: PRE-FILL the 5 intake facts from contract data, but render them as "review these" (editable, flagged "auto-filled from {contract}"), NOT silently committed. Provenance + human confirmation, per the approval discipline.
//   - SRM scorecard: quarterly auto-refresh AND on-demand. It's a relationship-health surface; staleness undermines it.
//   - DESIGN NOTE: this is high-risk because it CREATES events autonomously. The created renewal MUST land in waiting_on_client (never active) so it passes through the same approval gate as any human-created event. No auto-event skips the human. Confirm this with the routing guard (Spec 4).
// Open with Codex before ship: yes  (autonomous creation + approval-gate interaction is load-bearing)
```

---

## Summary

| Verdict | Specs |
|---|---|
| ✅ Approved as-is | 2, 4, 5, 8, 10, 15, 16, 17, 19 (design) |
| ✏️ Approved with revisions | 1, 3, 6, 7, 9, 11, 12, 13, 14, 18 |
| ⛔ Needs rework | none — all are buildable; revisions are refinements, not rejections |

**Open-with-Codex-before-ship (8):** Specs 3, 5, 7, 8, 11, 12, 18, 19. These have either an action-hierarchy change, a load-bearing viz decision, a scope expansion, or an autonomy/approval interaction that benefits from a build-time conversation.

**Highest-leverage revisions:**
1. **Spec 7 scope expansion** — the humanization sweep misses the exact strings the screenshot exposes. Widen it or the most-visible jargon survives.
2. **Spec 3 + Q4 action hierarchy** — four equal decision buttons is the clearest "one obvious action" violation in the package.
3. **Spec 12 + Q6 dark-header rule** — keep the dark Exec Decision header, but document "only dark moment in the lifecycle" or it metastasizes.
4. **The export-gating finding** (folded into Specs 7 & 8 & 15) — "no export of nothing" is a one-line rule that kills a whole class of the screenshot's anti-patterns.

**Wave 1 is cleared to start.** Specs 4, 3, 2, 7 are all approved (3 and 7 with the revisions above). The Strategy redesign (`06-strategy-screen.html`) is the built proof-of-bar for the Wave 2 canvas work.

**Next from the design module:** mock the remaining load-bearing screens — **Executive Decision page-1** (Spec 12), the **Approval page** (Spec 3), and **Pricing/BAFO** (Spec 11) — so each high-risk spec has a target to build against, not just prose.

---

*Design module review · 2026-06-04 · Reviewed against the bar, the locked tokens, and the Moves-module northstar.*
