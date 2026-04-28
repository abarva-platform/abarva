# AbarVa Eight-Hour / Three-Day / Pilot Roadmap

Date: 2026-04-26
Owner lens: Atlas
Planning basis:
- `docs/planning/abarva-master-backlog/backlog-registry.json`
- `docs/planning/abarva-master-backlog/MASTER_PRODUCT_READINESS_MAP.md`
- `docs/build/production-readiness.json`
- `docs/backlog/BACKLOG_STATUS_SUMMARY.md`

## Purpose

This roadmap translates the current merged product state into an execution sequence the team can actually run. It is intentionally practical. It is not a feature wishlist, and it is not a promise that all pending backlog items should be executed in one uninterrupted burst.

The roadmap answers three questions:

1. What should happen in the next eight hours of Codex-supervised execution?
2. What should happen in the next three days if we want a materially better founder demo and a cleaner product control plane?
3. What must be true before any serious pilot-readiness claim can be made?

## Core sequencing rules

The current product state makes the sequencing logic clear:

- Source remains the flagship workflow and should keep receiving the most disciplined execution attention.
- Demo coherence matters before deeper runtime expansion, because a scattered demo narrative wastes founder review time and causes unnecessary rework.
- Production-readiness blockers must be treated as their own workstream, not as background assumptions.
- Docs-only planning and QA artifacts can move quickly, but runtime behavior, tenant safety, evidence ingestion, and live agent behavior must stay gated.

The backlog should therefore be executed in this order:

1. Finish the current docs-only executive summary wave so the orchestration layer becomes founder-readable.
2. Tighten visual QA and demo-storyline proof on the routes that already exist.
3. Deepen Source and Programs only where the next slice makes the flagship path more coherent.
4. Plan and contract the missing production foundations: evidence, parsing, audit, gateway, tenant, deployment.
5. Only then consider live-runtime or pilot-hardening implementation slices.

## Current planning posture

### What is safe to accelerate now

- Docs-only wave closeout
- Authenticated visual QA planning and screenshot review
- Demo storyline tightening
- Deterministic Source workflow polish
- Program-to-Source narrative cohesion
- Validation and route-level review artifacts

### What must remain gated

- Any live model call path
- Any production upload/parsing runtime
- Any persistence or migration work without an explicit slice
- Any auth, tenant-isolation, or deployment change without a named approval path
- Any workflow or approval engine behavior

## The next eight hours

The next eight hours should not try to "finish the product." They should create a much sharper operating posture around what already exists and what can credibly be shown.

### Outcome target

At the end of the next eight hours, the team should have:

- WAVE-21 fully closed with honest executive-summary docs
- a founder-usable roadmap and risk register
- clearer visual-QA and demo-storyline sequencing
- a clean next-wave handoff into bounded Source and demo-strengthening work

### Recommended execution blocks

#### Block 1: Close WAVE-21 docs properly

Priority: immediate

Items:
- `ROAD2` Eight-hour / three-day / pilot roadmap
- `ROAD3` Open risk and dependency register

Why now:
- These are the final low-risk items in the currently active wave.
- They reduce ambiguity for every later autonomous run.
- They make the backlog safer to execute without founder micro-coordination.

Expected output:
- planning docs merged
- registry statuses updated
- backlog checkpoint updated

#### Block 2: Run the visual proof plan before new polish work

Priority: immediate after WAVE-21

Items:
- `VIS2` Authenticated visual QA pass
- supporting review capture on:
  - `/source`
  - `/source/events/evt-source-data-ai-si-selection`
  - `/platform/admin/experience-gallery`
  - `/platform/admin/production-readiness`

Why now:
- The product already has many visually important surfaces.
- More UI implementation without authenticated route review increases rework.
- Experience Gallery and Source event routes are now central founder-review surfaces.

Expected output:
- screenshot-backed pass/fail notes
- route-level design canon findings
- confirmed list of what is presentation-ready versus still rough

#### Block 3: Demo-storyline tightening

Priority: same day if visual QA is clean

Items:
- `DEMO1` Apex Retail demo storyline catalog
- `DEMO2` Apex Program + Source link visual QA

Why now:
- Demo credibility is currently one of the highest-value near-term gains.
- The product already has enough seeded narrative material to justify a disciplined walkthrough script.
- This work strengthens founder communication without pretending pilot readiness.

Expected output:
- a route-by-route walkthrough script
- honest caveats
- a clearer explanation of what is seeded, what is inferred, and what is real

### Eight-hour parallelization guidance

Safe parallel lanes:
- one docs lane for `ROAD2`
- one docs lane for `ROAD3`
- one review lane for `VIS2` only if it does not touch the same tracker files

Do not parallelize:
- state/checkpoint tracker updates across multiple branches
- any work that touches the same planning wave file or registry entries

### Eight-hour stop conditions

Stop and escalate if:
- visual QA exposes active routes still rendering the wrong shell/nav
- CI fails on unrelated runtime files and requires a broader repair
- authenticated route review reveals tenant leakage or auth confusion
- route-level demo credibility is substantially weaker than the backlog assumes

## The next three days

The three-day window should shift from backlog control-plane cleanup into product-strengthening work that materially improves the founder demo and prepares the product for pilot-hardening planning.

### Three-day objective

By the end of day three, the product should be:

- easier to demo end-to-end,
- more honest about what is seeded versus live,
- visually more consistent on flagship routes,
- and much clearer about the production blockers that remain.

### Day 1: Close control-plane and review debt

Primary goals:
- finish `ROAD2` and `ROAD3`
- complete `VIS2`
- capture the first clean round of authenticated route evidence

Secondary goals:
- update backlog checkpoint and registry cleanly
- confirm which blocked items remain truly blocked (`VIS4`, `DESIGN1`)

Success criteria:
- the founder can read the planning folder and understand what is complete, what is next, and what is blocked
- authenticated route review exists for the highest-value surfaces

### Day 2: Strengthen the flagship demo path

Primary goals:
- `DEMO1` Apex Retail demo storyline catalog
- `DEMO2` Apex Program + Source link visual QA
- begin `WAVE-22` Source workflow depth only if visual QA does not reveal major route-shell issues

Best first WAVE-22 candidates:
- `SRC42` Commercial active canvas tab consolidation
- `SRC43` Pricing completeness drilldown

Why these first:
- they improve the Source event route without introducing new runtime categories
- they deepen the most important demo surface
- they keep the product story centered on the Source workflow spine

Keep deferred for later:
- `SRC45` future-only transition-readiness work is less valuable than current-stage clarity and could invite overclaiming if shown too early

Success criteria:
- the Source route feels more complete in the most important commercial-review steps
- the Program-to-Source narrative is stronger and easier to tell

### Day 3: Prepare pilot-hardening work, do not fake it

Primary goals:
- start the planning slices that define pilot blockers cleanly
- prioritize wave-24 and wave-25 items that turn vague blockers into actionable contracts

Best candidates:
- `ADM10` Admin-to-Source readiness backing plan
- `EVID1` Evidence ledger MVP plan
- `EVID2` Upload/parsing pipeline MVP plan
- `PROD6` Live persona walk protocol
- `AGRT1` Model Gateway contract plan

Why these matter:
- they connect the current deterministic demo system to the real foundation gaps preventing production claims
- they avoid the trap of adding more seeded UI while core runtime controls remain undefined

Success criteria:
- the team leaves day three with a credible hardening sequence, not just more polished demo surfaces

## Parallel versus sequential rules for the next three days

### Can run in parallel

- docs-only planning slices that touch different output files
- screenshot/review artifacts that do not modify runtime code
- Source deterministic read-model deepening and demo-storyline docs, if file scopes do not overlap

### Must remain sequential

- slices that touch `backlog-registry.json`
- slices that touch `BACKLOG_CURRENT_STATE.md`
- multiple slices that modify the same Source event-canvas component
- anything that touches `production-readiness.json`

### Practical grouping

Good grouping:
- one planning/control lane
- one Source workflow lane
- one demo/review lane

Bad grouping:
- several lanes all touching state trackers or active Source shell files

## Pilot-oriented roadmap

Pilot readiness is not the next eight hours and not the next three days. It is the next disciplined phase after demo coherence and foundational planning are in place.

### What pilot readiness means here

For AbarVa, pilot readiness means:

- a bounded route set can be used safely by real users
- agent guidance is context-aware and not generic
- tenant isolation is understood and tested
- uploads/evidence are governed
- audit and review controls exist
- production deployment truth is observable

### Pilot-readiness prerequisite tracks

#### 1. Evidence and ingestion foundation

Must have:
- evidence ledger contract elevated from planning to executable implementation work
- upload/parsing pipeline plan approved
- attachment metadata and evidence confidence rules defined

Reason:
- without evidence, agent output and decision support cannot be trusted in a pilot

#### 2. Admin-to-Source operating contract

Must have:
- a clear backing plan for dataset readiness and Source consumption
- a route-safe handoff between Admin setup and Source readiness

Reason:
- Source cannot safely become "real" while setup and evidence ownership remain fuzzy

#### 3. Agent runtime and gateway discipline

Must have:
- model gateway contract
- tool registry contract
- no-fabrication harness
- mission queue/runtime planning

Reason:
- AbarVa should never ship agent behavior that bypasses the controls it already says are mandatory

#### 4. Validation and deployment hardening

Must have:
- authenticated route smoke
- persona-walk protocol
- security and tenant-readiness checklist
- deployment verification discipline

Reason:
- pilot claims require route truth, not just merged code

### Pilot-readiness sequence recommendation

Phase A:
- complete evidence/upload planning
- complete gateway/runtime planning

Phase B:
- implement the smallest safe evidence and readiness backbone
- verify tenant and route behavior on the flagship surfaces

Phase C:
- run founder/persona walkthroughs with recorded outcomes
- assess whether a narrow internal or friendly pilot is credible

## Recommended wave order after WAVE-21

### Recommended order

1. Finish WAVE-21 docs closeout
2. Execute the highest-value visual and demo proof work from WAVE-21 and WAVE-27
3. Start WAVE-22 Source commercial-depth slices
4. Start WAVE-24 readiness/evidence/admin planning
5. Start WAVE-25 agent runtime / model gateway planning
6. Move into WAVE-28 QA and pilot hardening once the above are no longer abstract

### Why not jump directly to later waves

It would be a mistake to jump straight into:
- production deployment work,
- live model behavior,
- or complex pilot language

before:
- Source visual proof is captured,
- the Apex demo path is tightened,
- and the evidence/gateway/admin contracts are concretely planned.

That would create impressive-looking motion while increasing operational ambiguity.

## Founder operating guidance

If the founder wants the highest-value near-term path, the answer is not "build everything at once." The correct near-term strategy is:

- stabilize the planning control plane,
- prove the flagship routes visually and narratively,
- deepen the Source workflow where it already has momentum,
- and define the missing production control systems before trying to act as if they already exist.

This keeps AbarVa differentiated without overstating what is actually ready.

## Final recommendation

For the next eight hours:
- finish WAVE-21 docs
- run authenticated visual QA
- tighten the Apex walkthrough

For the next three days:
- deepen Source selectively
- improve Program-to-Source continuity
- convert evidence, readiness, and gateway blockers into executable plans

For the pilot path:
- do not chase more seeded breadth
- chase trust, evidence, tenant safety, audit, and deployment truth

That is the shortest honest path from an increasingly strong demo product to a credible pilot candidate.
