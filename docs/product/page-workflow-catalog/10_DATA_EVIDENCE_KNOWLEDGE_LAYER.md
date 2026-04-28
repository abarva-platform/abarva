# Page · Data, Evidence, Knowledge Layer

Status: Canonical (CAT1)
Authored: 2026-04-25

## Page purpose

The Data / Evidence / Knowledge Layer is **the substrate every other
page reads from** — the unified surface where dataset domains,
evidence rows, and knowledge artifacts (patterns, libraries,
authored content) become visible to the operator. The layer is not
a single dashboard page but a set of cross-page surfaces: the
ADM3 / ADM4 inventory inside Setup, the Intelligence library, the
evidence drawers across Programs / Source / Tower. This catalog
file defines the **layer semantics** and the canonical surfaces that
expose it. The operator's question — "where does this claim come
from, and is the source usable?" — must resolve in one click from
any agent statement to its underlying evidence row.

## Primary user question

"Where does the agent's claim come from, and is the source usable?"

## Primary agent

Steward (with Nexus retrieval composing knowledge into Context
Bundles; Sentinel reads the layer for pattern evidence; Atlas reads
the layer for the readiness line in the Tower brief).

## Route(s)

- `/(maestro)/platform/data` — canonical Data layer landing.
- `/(maestro)/intelligence/library` — Knowledge library (industry
  references, prior cases, authored content).
- Evidence drawers inside Programs / Source / Tower — same-canvas
  drill-ins from any E-### id.

## Required data contract / read model

- ADM3 · Dataset Domain Inventory Read Model (12 canonical domains).
- ADM4 · Dataset Explorer UI binding.
- I1 / I2 / I3 · Sentinel pattern + evidence trail contracts.
- PDEL · Program Deliverables / Artifacts Read Model (deliverable
  bodies that become evidence).
- The canonical evidence lifecycle (loaded → parseable →
  discoverable → indexed → cited → quality_checked →
  usable_as_evidence + partial / blocked) — implemented across the
  above contracts.
- Knowledge layer read model — **to be defined** for the
  Intelligence library content surface (industry references, prior
  case excerpts, authored long-form).

## What the page knows

- 12 canonical dataset domains and their loaded / available /
  usable counts (Strategy, KPI, Architecture, App Portfolio, AI
  Portfolio, Risk / Compliance, Evidence, Org, plus four
  not-yet-seeded domains).
- Per-row dataset metadata: source type, parse status, freshness,
  evidence usability, agent-use permission.
- Evidence registry: every E-### id with its source artifact,
  quality-check state, and citing pages / patterns / deliverables.
- Knowledge library: authored references with provenance,
  publication date, and basis label (internal authored / external
  research).
- Per-agent × per-domain readiness (matrix in Setup Zone D / E).

## What the page is missing

- Live evidence registry backend — evidence ids are deterministic
  in v2.
- Live full-text search across the knowledge library — search is
  deferred.
- Live external research feed ingestion (academic, vendor docs) —
  external knowledge is seeded in v2.
- Cross-tenant evidence sharing — evidence is per-tenant.

## Key user actions

- Open the Setup Data zone to read dataset domain rollups.
- Click a domain card → ADM4 DatasetExplorerPanel for the domain.
- Click an E-### id anywhere in the platform → opens evidence
  drawer with source artifact and quality-check state.
- Open the Intelligence library to browse authored knowledge.
- Click a knowledge item → opens the item drawer with provenance.
- Use the Steward attestation queue (Setup) to advance evidence
  state from `partial` to `usable_as_evidence`.

## Agent actions

- **Steward** owns the evidence lifecycle, signs quality checks,
  advances rows to `usable_as_evidence`.
- **Nexus** composes evidence into Context Bundles for programs;
  retrieval is deterministic in v2.
- **Sentinel** cites evidence ids in pattern detail; basis label
  is enforced.
- **Atlas** cites the readiness posture line in the Tower brief.

## Empty / degraded states

- Domain in `not_started` state → render rollup card with MUTED
  tone and `0 / 0 / 0` counts.
- Evidence id with no source artifact → render evidence drawer
  with `EmptyInspector` caption "Source artifact pending —
  Steward seeds via Setup."
- Knowledge library empty → render `EmptyInspector` with caption
  "No authored knowledge seeded for this tenant. Steward seeds
  via Setup library zone."
- Loaded ≥ available ≥ usable invariant violated → render with
  RED chip and Steward escalation banner. (Should never happen
  in a healthy seed.)

## Navigation / drill-down behavior

- The layer surfaces are cross-page. Any E-### id click anywhere
  in the platform opens the evidence drawer on that surface — no
  navigation away from the calling page.
- Setup Data zone → ADM4 DatasetExplorerPanel for the domain.
- Intelligence library → knowledge item drawer (right side).
- Evidence drawer footer always names the deterministic basis
  (e.g., "ADM3 deterministic seed", "I1 deterministic pattern
  read-model").

## MVP / V1 / V2 scope

- **MVP** — ADM3 / ADM4 dataset inventory in Setup, evidence
  drawers across Programs / Tower / Intelligence with deterministic
  E-### ids, loaded ≥ available ≥ usable invariant enforcement.
- **V1** — adds Knowledge library (Intelligence library route),
  Steward attestation queue, evidence-id full-text rendering.
- **V2** — adds live external research ingestion, live full-text
  search, cross-tenant evidence sharing for partner accounts,
  live evidence registry backend.

## Visual blueprint reference

- Setup data zone inherits
  [`docs/design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md`](../../design/pages/ADMIN_SETUP_PAGE_BLUEPRINT.md)
  Zone D + Zone E.
- Intelligence library inherits
  [`docs/design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md`](../../design/pages/INTELLIGENCE_PAGE_BLUEPRINT.md)
  drawer + card chrome.
- A dedicated Knowledge Library blueprint is **to be defined** as
  part of the V1 Intelligence roadmap.
- Visual canon: [`docs/design/ABARVA_VISUAL_CANON.md`](../../design/ABARVA_VISUAL_CANON.md).
