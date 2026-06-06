# Moves Deliverable Standard — the Northstar (board-grade, all clients)

Canonical, enforced definition of what every Strategic Move deliverable must
look like, by phase. This is a **global control-plane** standard: it applies
**identically to all clients/tenants**. Per-client variance is only (a) whether
the Move's function binds a curated Domain Function Pack, and (b) the client's
own loaded evidence (which never crosses the tenant wall).

Enforced by the **Deck Quality Gate**
(`src/lib/programs/expert-kernel/exports/board-grade/__tests__/deck-quality-gate.test.ts`).
Renderers live in `src/lib/programs/expert-kernel/exports/board-grade/`.

> Honesty is part of the bar: if no curated Domain Function Pack covers a Move's
> function, the deck renders the **honest UNBOUND** view — never a fabricated one.

## Layer 1 — Universal Standard (every deliverable obeys)

1. **Answer-first** — opens with a one-line decision/verdict (shape / fund / kill / advance), not a preamble.
2. **Headline economics** strip near the top — the single framing number.
3. **Section anatomy** (`MoveSectionAnatomy`) — every section carries: `takeaway` (action title), `decisionRole`, `evidence` strip (sources · as-of · confidence · gaps), `implication`, `owner`, `nextGate`. No empty/placeholder fields.
4. **Evidence-bound numbers only** — every figure traces to a loaded source or a **labelled planning-range** from the function pack. No asserted-as-fact benchmarks; no fabricated precision.
5. **Required exhibits** per deck (deterministic SVG from `svg-charts.ts` / `svg-architecture.ts`).
6. **Honest unbound** — unbound is a valid rendered outcome, never a crash, never fabricated.
7. **Two renditions** — self-contained HTML (read) + editable PPTX (edit), with measured autofit so no text overruns.
8. **Tenant integrity** — no cross-tenant content; tenant display name resolved; no raw internal IDs.

## Layer 2 — Template (repeating section spine)

Cover/Answer → Headline economics → Situation / Why-now → Baseline vs target →
The case (cost + value) → Sensitivity → Roadmap → Risks / controls →
Assumption ledger → Evidence & gaps → Recommendation / asks / signoff.

## Layer 3 — Deliverables by phase

P0 and P4 are **separate decks** (locked decision). Master Dossier is the
cross-phase assembled book that links every deck.

| Phase                          | Canonical deliverable key(s)                                                                  | Deck (renderer)                                                                                                                                                                         | Required exhibits (min)                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **P0 Originate**               | `originate_brief`                                                                             | Originate Brief (`renderMoveOriginateBriefHtml`) — net-new deck, NEXT BUILD INCREMENT (not yet shipped)                                                                                 | opportunity range; value-vs-effort; kill criteria                                      |
| **P1 Charter**                 | `charter`                                                                                     | Charter Skeleton (`renderMoveCharterSkeletonHtml`)                                                                                                                                      | value-vs-effort summary; sensitivity tornado; gap-closure queue                        |
| **P2 Discover & Diagnose**     | `discovery_report`, `root_cause_worksheet`                                                    | Discover Brief (`renderMoveDiscoverBriefHtml`)                                                                                                                                          | baseline coverage meter; opportunity range; gap-closure queue                          |
| **P3 Design Future State**     | `target_state_architecture`, `solution_design`, `operating_model_design`, `sourcing_strategy` | Solution Architecture Pack (`renderMoveSolutionArchitectureHtml`)                                                                                                                       | architecture context diagram; integration readiness map; architecture risk heatmap     |
| **P4 Roadmap & Business Case** | `execution_roadmap`, `business_case`, `financial_model`, `tower_metrics_plan`                 | **Costed Business-Case Pack** (`renderMoveCostedBusinessCaseHtml`) + **Estimate Model** (`renderMoveEstimateModelHtml`) + **CFO Pack** (`renderMoveCfoPackHtml`) — three separate decks | waterfall; gross-to-net value bridge; sensitivity tornado; payback range; risk heatmap |
| **P5 Mobilize & Handoff**      | `handoff_package`, `value_measurement_contract`                                               | Mobilize Packet (`renderMoveMobilizePacketHtml`)                                                                                                                                        | 30/60/90 plan; readiness heatmap; gap-closure queue                                    |
| **Cross-phase**                | assembled book                                                                                | Master Move Dossier (`renderMoveMasterDossierHtml`)                                                                                                                                     | links + waterfall + tornado + 30/60/90 + evidence matrix                               |

### Per-deck Table of Contents (anchored to the live decks)

**P0 Originate Brief** (new): Originate answer · Headline economics · Why this, why now · Opportunity range · Value-vs-effort summary · Kill criteria · Evidence asks · Decision to charter.

**P1 Charter Skeleton**: Charter answer · Headline economics · Value hypothesis · Baseline vs target · Initial cost/effort · Value-vs-effort summary · Assumption ledger · Sensitivity tornado · Kill criteria · Evidence asks · Gap-closure queue.

**P2 Discover Brief**: Decision snapshot · Headline economics · Current-state baseline · Baseline coverage meter · Pain & opportunity · Opportunity range · Evidence gaps · Gap-closure queue · Go/no-go gate · Appendix.

**P3 Solution Architecture**: Architecture decision · Option scorecard · Context view + diagram · Logical/layered architecture · Data flow · Integration readiness map · Build/buy/partner boundary · Human/agent accountability map · Controls + control overlay · Architecture risk heatmap · Open-decision queue.

**P4 Costed Business-Case**: Board answer · Headline economics · Why now · Baseline vs target · What we're funding · Investment case + waterfall + cost stack · Value case + gross-to-net bridge + adoption ramp · Payback & sensitivity (tornado + payback range) · Phased roadmap swimlane · Risk & control heatmap · Assumption ledger · Evidence appendix · Recommendation & asks.

**P4 Estimate Model**: Exec summary · Headline economics · Baseline/seed gaps · Workstream cost stack · Role mix by phase · Rate-card coverage matrix · Gross-to-net value bridge · Scenario range · Sensitivity tornado · Payback range cash-flow.

**P4 CFO Pack**: The answer · Headline economics · The case (value-vs-effort) · Assumptions · Sensitivity tornado · What would make it wrong · What not to fund yet · What Tower will measure · Evidence & gap matrix.

**P5 Mobilize Packet**: Go/no-go answer · Headline economics · 30/60/90 plan · Owners & decision rights · Adoption & change · Controls + readiness heatmap · Tower handoff · Open-action queue · Gap-closure queue · Signoff.

**Master Dossier**: Executive answer · Board memo · Decision timeline · Evidence & gap matrix · Solution & delivery model · Economics (waterfall/tornado/scenario/bridge) · Roadmap & 30/60/90 · Tower measurement · Downloads & signoff.

## Layer 4 — Format standard & per-deliverable Format Matrix

Format follows the deliverable's job, not a single default. Each deliverable has
a **primary** format (what the buyer receives) and optional **also** formats.

| Phase | Deliverable                | Primary           | Also           | Why                                                                         |
| ----- | -------------------------- | ----------------- | -------------- | --------------------------------------------------------------------------- |
| P0    | Originate Brief            | **PPTX**          | HTML           | board-facing decision-to-charter                                            |
| P1    | Charter                    | **DOCX**          | PPTX           | a signed narrative agreement, not slides                                    |
| P2    | Discover Brief             | **PPTX**          | HTML           | board read + HTML when they want the detail                                 |
| P3    | Solution Architecture      | **HTML**          | PPTX (summary) | depth, density, and clarity are best in HTML for engineers who want details |
| P4    | Costed Business Case       | **PPTX (always)** | —              | board artifact — always a deck                                              |
| P4    | Estimate / Financial Model | **XLSX**          | HTML           | it is a model — numbers must be editable/auditable                          |
| P4    | CFO Pack                   | **PPTX**          | XLSX           | CFO board read + the underlying model                                       |
| P5    | Mobilize Packet (plan)     | **DOCX**          | PPTX           | a mobilization plan is a document                                           |
| P5    | RACI / milestones          | **XLSX**          | —              | an editable matrix/grid                                                     |
| P5    | Value-Measurement Contract | **DOCX**          | XLSX           | a contract document + its metric grid                                       |
| X     | Master Move Dossier        | **PPTX**          | HTML           | the board book                                                              |

Format rules:

- **PPTX**: editable 16:9; native text objects + rasterized SVG exhibits;
  **shrink-to-fit autofit** (`fit: 'shrink'`) so no text overruns its box — a
  deck that drops autofit fails `pptx-autofit-gate`. Mandatory for board +
  business case + master dossier.
- **HTML**: self-contained (CSS inlined, exhibits inline SVG, no external
  assets); `?download=1` serves an attachment. Canonical for architecture (the
  density/detail surface) and the "also" detail view of any deck.
- **XLSX**: editable workbook with an Assumptions tab, driver build-up,
  scenario/sensitivity, and a Sources tab. Canonical for estimate/financial
  models and RACI/milestone grids.
- **DOCX**: structured narrative document (headings, action titles, tables).
  Canonical for the charter, the mobilization plan, and the value-measurement
  contract.
- **PDF**: via the HTML deck's print expansion (read-only share).

Build status: HTML exists for all 8 decks; PPTX exists for the Apex reference
business case and (this increment) the generic Move costed business case;
DOCX/XLSX generic-Move renderers and the remaining generic PPTX decks are
tracked build increments.

## Client applicability

`global-control-lane`. Same standard + renderers + gate for **all clients**.
Bound vs unbound depends on industry/function **pack coverage** (shared within an
industry); content is filled by each client's **own loaded evidence** (tenant-walled).

## Enforcement (the gate)

The Deck Quality Gate renders every deck for a representative **bound** Move and a
**deliberately unbound** Move and fails CI when a deck: is missing its required
exhibits; lacks an evidence/verdict cue; contains placeholder/fabrication tokens
(`lorem`, `TODO`, `TKTK`, `{{`, `undefined`, `NaN`); leaks cross-tenant terms or
raw internal IDs; (bound) renders as unbound; or (PPTX) overflows a text box.
