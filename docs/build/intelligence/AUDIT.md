# Intelligence Module Audit · I0

**Date:** April 28 2026
**Scope:** `src/components/intelligence/**`, `src/lib/intelligence/**`, design-spec alignment, north-star delta
**Status:** Drafted in Session 1 branch · not yet merged

This audit is the Intelligence equivalent of Source S0. It does not redesign the module from scratch. It names what already exists, what maps cleanly to the v1.0 Intelligence design spec, and what is legacy carry-over from earlier directions.

---

## Executive read

### Inventory summary

- `ls src/components/intelligence/ | wc -l` → **20**
- `find src/components/intelligence -name "*.tsx" | wc -l` → **27**
- `grep -r "ProvenanceRibbon\\|provenance" src/components/intelligence --include="*.tsx" -l` → **no matches**
- `grep -r "atlasNote\\|atlasQuote" src/lib/intelligence --include="*.ts" -l` → **no matches**
- `src/lib/intelligence/queries.ts` → **does not exist**

### What is already here

The module is not empty. It already has:

- a shell-era library page
- multiple pattern-detail implementations
- a solutions index
- an evidence dataset drawer
- deterministic pattern-view builders
- graph validation and pattern-to-program linkage utilities
- a legacy ask/synthesis response-rendering stack

### What is still missing

The design-spec pages that do not yet exist as first-class canonical surfaces are:

- signal stream index
- signal detail page
- contradiction detail page
- graph browser UI
- authoring flow
- synthesis flow formalized as a canonical page
- quality lens
- visible provenance ribbon system

### Primitive-model read

The four-primitive model is only partially expressed today:

- **Pattern:** strong coverage
- **Solution:** partial but real
- **Signal:** implicit and fragmented
- **Contradiction:** mostly modal/supporting logic elsewhere, not first-class Intelligence surface

The ask-oriented components are the biggest source of model drift. They render generic answer formats rather than the four canonical Intelligence primitives.

---

## Graph and data-layer status

### Graph validation status

Current graph validation summary from `validatePatternGraph()`:

| Metric | Value |
|---|---|
| patternCount | 17 |
| tenantCount | 4 |
| programCount | 19 |
| deliverableCount | 457 |
| RELATED_TO edges | 76 |
| APPLIED_IN edges | 14 |
| APPLICABLE_TO_TENANT edges | 44 |
| SOURCED_FROM edges | 334 |
| errors | 0 |
| warnings | 0 |

This is enough graph content to justify I4 planning, but not enough by itself to claim the full graph-browser experience is shipped.

### Query surface status

There is no single `src/lib/intelligence/queries.ts`. The current surface is distributed:

- `library.ts`
- `pattern-deliverable-query.ts`
- `pattern-graph-validation.ts`
- `ask/retrievers/*`
- `retrieval/*`
- `db/*`

That is workable but not ideal. I1-I3 should keep read-model composition explicit so the module does not grow a second, competing query layer by accident.

### Atlas voice status

There are **no `atlasNote` or `atlasQuote` strings** under `src/lib/intelligence/`. That means the 150-word Atlas cap is not currently an active library-level enforcement concern inside Intelligence itself. When I6 introduces synthesis/authoring surfaces, the cap needs to be enforced there from day one rather than retrofitted later.

### Provenance status

No component currently renders a provenance ribbon. The closest surface is `EvidenceDatasetDrawer.tsx`, which exposes evidence detail, freshness, and usability, but not the signature always-visible provenance treatment prescribed in the design spec.

---

## North-star delta

The older [intelligence-layer-north-star-spec.md](/Users/anand/Projects/nexus/docs/specs/platform/intelligence-layer-north-star-spec.md) remains a useful architecture reference, but only parts of it have shipped.

**Shipped or partially shipped from the north-star direction:**

- pattern-library concept
- pattern-detail concept
- solution-archetype concept
- graph-linked pattern/program/deliverable validation
- tenant-scoped deterministic pattern evidence structures

**Not shipped from the north-star direction:**

- true external signal ingestion
- operational telemetry ingestion
- dual-scope disclosure plumbing rendered as a first-class UI convention
- graph browser UI
- contradiction as a first-class Intelligence detail page
- KPI/quality-lens surfaces

This is the core I0 conclusion: Intelligence has meaningful assets, but they are unevenly distributed across two design directions. I1-I7 should consolidate onto the current build-ready design spec rather than keep both ideas alive indefinitely.

---

## Component-by-component audit

| File | Lines | Current purpose | Catalog mapping | Primitive mapping | I1+ recommendation | Legacy notes |
|---|---:|---|---|---|---|---|
| `src/components/intelligence/CohortCard.tsx` | 27 | emergent cohort chip block for ask answers | INT-FLW-SYNTHESIZE (future) | Signal / free-form | refactor | tied to ask-answer format system |
| `src/components/intelligence/DeprecatedPatternDetailPage.tsx` | 343 | shell-era deprecated pattern reading page | INT-DTL-DEPRECATED | Pattern | retain | valid catalog mapping |
| `src/components/intelligence/EvidenceDatasetDrawer.tsx` | 557 | deterministic evidence drawer for pattern detail | INT-DTL-VALIDATED support | Pattern evidence | retain | strongest provenance-adjacent surface in module |
| `src/components/intelligence/IntelligenceCanvasModeTabs.tsx` | 297 | multi-mode pattern detail body tabs | INT-DTL-VALIDATED | Pattern | retain | good bridge to canonical detail surface |
| `src/components/intelligence/IntelligenceIndexPage.tsx` | 617 | shell-era pattern library page + submit modal | INT-IDX-DEFAULT, filter variants, INT-MOD-SUBMIT | Pattern | retain | important canonical base |
| `src/components/intelligence/IntelligenceLensTabs.tsx` | 1033 | five-mode lens/tabs surface for pattern detail | INT-DTL-VALIDATED / future quality shaping | Pattern + Signal | refactor | powerful but broader than current page catalog |
| `src/components/intelligence/IntelligenceRouteShell.tsx` | 88 | pre-AppShell route wrapper | legacy index/detail shell | free-form | delete | explicit legacy shell |
| `src/components/intelligence/IntelligenceWorkflowCanvas.tsx` | 85 | deterministic workflow canvas summary | legacy workflow support | Signal + Pattern | refactor | small reusable pane candidate |
| `src/components/intelligence/NexusTurn.tsx` | 132 | generic ask-answer renderer | INT-FLW-SYNTHESIZE (future) | free-form | quarantine | belongs to older ask UI direction |
| `src/components/intelligence/PatternDetailPage.tsx` | 579 | validated pattern detail reading page | INT-DTL-VALIDATED | Pattern | retain | strong canonical base |
| `src/components/intelligence/PersonaLensChip.tsx` | 22 | persona toggle chip for ask flow | INT-FLW-SYNTHESIZE (future) | free-form | refactor | legacy ask control |
| `src/components/intelligence/SentinelActivePatterns.tsx` | 800 | tenant intelligence overview + detections grid | INT-IDX-DEFAULT / quality bridge | Pattern | retain | useful I1 source but needs convergence |
| `src/components/intelligence/SentinelEvidenceBrief.tsx` | 52 | condensed evidence summary | INT-DTL-* support | Pattern evidence | retain | compact support primitive |
| `src/components/intelligence/SentinelInteractionRail.tsx` | 397 | interaction rail for signals/actions/confidence | INT-DTL-PATTERN, INT-FLW-SYNTHESIZE support | Pattern + Signal | retain | likely reusable on multiple Intelligence pages |
| `src/components/intelligence/SentinelPatternContentPanel.tsx` | 353 | authored content panel for canonical patterns | INT-DTL-PATTERN | Pattern | retain | useful for I2 |
| `src/components/intelligence/SentinelPatternDetail.tsx` | 503 | server-side canonical pattern detail surface | INT-DTL-PATTERN | Pattern | retain | best current canonical detail implementation |
| `src/components/intelligence/SentinelPatternRail.tsx` | 120 | tenant-scoped client rail for pattern pages | legacy tenant pattern detail | Pattern | delete | older tenant route family |
| `src/components/intelligence/SolutionsIndexPage.tsx` | 264 | shell-era solutions archetype index | INT-IDX-SOLUTIONS | Solution | retain | clean I5 starting point |
| `src/components/intelligence/SourcePill.tsx` | 22 | source-link pill for ask answers | INT-FLW-SYNTHESIZE support | Signal / source reference | refactor | generic answer UI primitive |
| `src/components/intelligence/formats/Artifact.tsx` | 65 | artifact response format renderer | INT-FLW-SYNTHESIZE | free-form | refactor | legacy response-format system |
| `src/components/intelligence/formats/Clarification.tsx` | 27 | clarification response renderer | INT-FLW-SYNTHESIZE | free-form | refactor | legacy response-format system |
| `src/components/intelligence/formats/CounterPair.tsx` | 24 | counter-argument response renderer | INT-FLW-SYNTHESIZE / contradiction-adjacent | Contradiction / free-form | refactor | could inform future contradiction detail |
| `src/components/intelligence/formats/Crux.tsx` | 28 | crux response renderer | INT-FLW-SYNTHESIZE | free-form | refactor | useful only if synthesis flow persists |
| `src/components/intelligence/formats/IDontKnow.tsx` | 14 | uncertainty renderer | INT-FLW-SYNTHESIZE | free-form | retain lightly | honest-boundary behavior still useful |
| `src/components/intelligence/formats/Matrix.tsx` | 43 | matrix response renderer | INT-FLW-SYNTHESIZE | free-form | refactor | generic reasoning format |
| `src/components/intelligence/formats/OneSentence.tsx` | 12 | single-answer renderer | INT-FLW-SYNTHESIZE | free-form | refactor | generic reasoning format |
| `src/components/intelligence/formats/RankedList.tsx` | 22 | ranked-list renderer | INT-FLW-SYNTHESIZE | free-form | refactor | generic reasoning format |

---

## Audit conclusions by wave

### I1 Library foundation

I1 should build around:

- `IntelligenceIndexPage.tsx`
- `SentinelActivePatterns.tsx`
- `shell-intelligence-fixture.ts`

The goal is not to invent a new library surface. It is to converge the current pattern index variants into the catalog-defined library view.

### I2 Pattern detail + provenance

I2 has a strong base:

- `SentinelPatternDetail.tsx`
- `PatternDetailPage.tsx`
- `SentinelPatternContentPanel.tsx`
- `EvidenceDatasetDrawer.tsx`

The missing signature is the visible provenance treatment.

### I3 Signals

Signals are present conceptually but not as a first-class surface. Existing rails, evidence summaries, and ask components can help, but I3 needs a dedicated index/detail pair rather than another generic answer page.

### I4 Graph browser

The data-side graph validation is materially ahead of the UI. I4 should treat the graph browser as a new UI wave backed by already meaningful edge data, not as a greenfield data project.

### I5 Solutions + contradictions

Solutions already have a landing page. Contradictions do not. I5 should keep those as two different tasks inside one wave, not pretend both start from the same maturity level.

### I6 Synthesis + authoring

The legacy ask stack is the raw material here. It should be converged, not duplicated.

### I7 Quality lens + cross-surface

Nothing in the current component tree is the quality lens yet. I7 remains a true build wave, not a reskin.
