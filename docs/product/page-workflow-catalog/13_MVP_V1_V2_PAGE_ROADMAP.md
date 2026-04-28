# MVP / V1 / V2 Page Roadmap

Status: Canonical (CAT1)
Authored: 2026-04-25
Type: Cross-page roadmap. Documentation only — no application
code, no runtime modification, no migrations.

This document sequences the page surfaces in this catalog into
three release waves: **MVP** (the founder-demo target), **V1** (the
first paying-tenant target), and **V2** (the partner / scale
target). Every wave commits to the five product rules in
`00_PAGE_WORKFLOW_CATALOG_MASTER.md` — every page in scope must
answer a clear user question, be backed by a contract, expose
agent-knows / agent-missing / next-action, hide details behind
drill-down, and anchor on a single primary agent.

---

## A. Release wave definitions

### MVP — founder demo

The MVP is the founder demo target. Scope is the smallest surface
set that proves the agent-centered runtime end to end on a single
seeded tenant. Every MVP surface is deterministic — no live model
calls. Every MVP surface respects the visual canon and the data
contract standard.

MVP success looks like: a founder walks an exec through Programs →
Workshop Mode → Intelligence → Tower → Setup in under twelve
minutes and closes with a Steward gate signature.

### V1 — first paying tenant

V1 broadens the surface set to the level required for a paying
tenant to run real engagements. Source comes online. The Knowledge
Library comes online. Steward attestation queues come online.
External-basis pattern detection comes online. V1 surfaces may
still be deterministic for some sub-surfaces but the live runtime
is wired for the brief composition and pattern detection paths.

V1 success looks like: a tenant lands evidence into the platform
through Source, Steward signs it usable, Sentinel detects a
pattern over it, Nexus updates a program, Atlas refreshes the
Tower brief — all in a single business day.

### V2 — partner / scale

V2 introduces multi-tenant rollups, full vendor evaluation,
cross-tenant evidence sharing, live LLM composition for briefs and
pattern narratives, and connector sync engines. V2 is the
"AbarVa-as-platform" target.

V2 success looks like: a partner reads cross-tenant Atlas brief,
opens vendor evaluation, drills into a substitution candidate,
hands off to a tenant Steward — all without leaving the platform.

---

## B. MVP scope (founder demo)

| Page | Status | Surface scope |
| --- | --- | --- |
| Home / Executive Entry | MVP | Atlas brief, recommended action, operator queue link. |
| Setup / Admin | MVP | Steward brief, Zones A–E, ADM4 explorer, Agent Readiness Matrix. |
| Programs | MVP | Portfolio table, Nexus brief, JourneyRail, gate status, deliverable drawer, evidence chips, pattern cross-links. |
| Program Workshop Mode | MVP | Pre-workshop brief, center-canvas deliverable, journey rail, gate readiness rail, deterministic post-workshop synthesis. |
| Source | — | Out of scope for MVP. |
| Source · Artifacts/Reviews/Approvals | — | Out of scope for MVP. |
| Vendor Evaluation | — | Out of scope for MVP. |
| Intelligence | MVP | Sentinel brief, Active Patterns strip, DIC, evidence trail, recommended action + handoff chips, single-turn ask drawer. |
| AI Control Tower | MVP | Atlas dark-surface brief, ≤ 5 scorecards, lens, ≤ 3 pressure cards, single-turn ask drawer, five subsurfaces. |
| Data / Evidence / Knowledge | MVP | ADM3 / ADM4 inventory in Setup, evidence drawers across Programs / Tower / Intelligence with deterministic E-### ids, loaded ≥ available ≥ usable invariant. |

### MVP cross-cutting commitments

- Every brief is deterministic; no live model calls.
- Every E-### evidence id resolves to a deterministic source
  artifact in a drawer.
- Every gate cap renders honestly (`signed` / `missing_inputs` /
  `not_wired`).
- Every primary agent is named at the top of its page; secondary
  agents appear only as honest handoff chips.
- Every empty region renders an honest `EmptyInspector` caption.

---

## C. V1 scope (first paying tenant)

| Page | Delta over MVP |
| --- | --- |
| Home / Executive Entry | Adds delta line ("changed since yesterday") + recently-signed-gate links. |
| Setup / Admin | Adds attestation queue, retention policy preview, evidence-registry surface bindings. |
| Programs | Adds value-realized ledger column, cross-program recommendation rail, Steward-readiness inline on each row. |
| Program Workshop Mode | Adds SME recommendation rail, solution architecture draft surface (SOL1 / SOL2 binding), pattern-driven composition. |
| Source | **New surface.** Chronological event feed, deterministic attribution, context-quality classification, manual Steward routing. |
| Source · Artifacts/Reviews/Approvals | **New surface.** Artifact body, review state, single-step Steward approval, program binding suggestion, pattern cross-links. |
| Vendor Evaluation | — | Out of scope for V1 (one-line vendor posture in Tower brief only). |
| Intelligence | Adds topic / people / KPI clusters, content library cross-link, multi-pattern compare drawer. |
| AI Control Tower | Adds vendor lens (precursor), delta callouts, Steward attestation inline. |
| Data / Evidence / Knowledge | Adds Knowledge library route (Intelligence library), Steward attestation queue, evidence-id full-text rendering. |

### V1 cross-cutting commitments

- Source comes online — sponsor signal flows into the platform.
- Steward attestation queue comes online.
- Knowledge library comes online (deterministic in V1; live
  external feed deferred to V2).
- Live runtime wired for brief composition and pattern detection
  on at least one path.

---

## D. V2 scope (partner / scale)

| Page | Delta over V1 |
| --- | --- |
| Home / Executive Entry | Multi-tenant executive home for partners; live Atlas composition; per-stakeholder personalization. |
| Setup / Admin | Live connector sync, SSO expansion, SOC2 export, live Steward runtime authoring. |
| Programs | Live deliverable authoring, cross-tenant portfolio view, live Nexus runtime brief authoring. |
| Program Workshop Mode | Live transcript ingestion, live LLM-composed brief, live SME booking, full pattern graph traversal. |
| Source | Live multi-channel ingestion (email / SMS / Slack / sponsor portal), model-composed summarization, two-way reply. |
| Source · Artifacts/Reviews/Approvals | Live full-text rendering for non-text formats, multi-step approval, multi-approver delegation, live concurrent annotation. |
| Vendor Evaluation | **New surface.** Roster, concentration metric, contract risk, substitution candidates, Sentinel pattern cross-links, Steward attestation states. |
| Intelligence | Live external feed ingestion, live LLM pattern composition, cross-tenant rollups for partner accounts. |
| AI Control Tower | Live LLM-composed brief, live spend / throughput telemetry, cross-tenant Tower view, full Vendor Evaluation surface. |
| Data / Evidence / Knowledge | Live external research ingestion, live full-text search, cross-tenant evidence sharing, live evidence registry backend. |

### V2 cross-cutting commitments

- Multi-tenant rollups across Home / Programs / Tower / Vendors.
- Live LLM composition for briefs and pattern narratives across
  every primary agent surface.
- Connector sync engines online for Source channels.
- Live evidence registry backend online (replacing deterministic
  E-### ids).

---

## E. Slice trace

| Wave | Required slice contracts | Implementation slices (representative) |
| --- | --- | --- |
| MVP | S1 / S2 / S8 / S9 / S9B / S9C / S9D / S9E / S9F / S9G / I1 / I2 / I3 / I4 / ACT1 / ADM1 / ADM2 / ADM3 / ADM4 / PDEL / PF1 / DES1 / DES2 / MW1 / MW2 / PF2 / SOL1 / SOL2 | S9 series for Programs; ACT2–ACT10 for Tower; ADM2 / ADM4 for Setup; I2–I4 for Intelligence; SOL3+ for solution architecture. |
| V1 | Source review read model (to be defined); Knowledge library read model (to be defined); attestation queue read model (to be defined). | Source slices (to be defined); Library slices (to be defined); attestation slices (to be defined). |
| V2 | Vendor evaluation read model (to be defined); cross-tenant rollup contracts (to be defined); live evidence registry backend contract (to be defined). | Vendor surface slices; partner surface slices; live runtime slices. |

---

## F. Wave gate (when do we move?)

The catalog moves from one wave to the next only when:

1. Every in-scope page satisfies the data contract standard
   (`11_PAGE_DATA_CONTRACT_STANDARD.md`).
2. Every in-scope page satisfies the wireframe requirements
   (`12_WIREFRAME_REQUIREMENTS_BY_PAGE.md`).
3. Every in-scope page has an integration test exercising
   determinism, field-set, reconciliation, fallback, and module
   hygiene.
4. Founder review signs the wave acceptance criteria.

Until the gate is met, in-flight wave-N+1 work stays behind a
slice-level dependency on the wave-N gate.

---

## G. Out-of-catalog surfaces (acknowledged but not scoped)

The following surfaces exist in the application repo but are
**out of scope** for this catalog because they are either marketing,
demo, or pre-canon legacy:

- `/sign-in` — auth.
- `/auth-redirect` — auth.
- `/investor` / `/investors` — marketing.
- `/demo/*` — demo harness.
- `/maestro/*` (non-`(maestro)` group) — pre-canon legacy.

These surfaces are not subject to the five product rules and do
not appear in the page index. They may be retired or migrated
into the catalog in a later wave; that decision is out of scope
here.
