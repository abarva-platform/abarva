# Intelligence Module Audit
**Wave I0 · April 28 2026 · Verified from live repo**

---

## §1 · Component inventory (`src/components/intelligence/`)

**Total files: 25** (backlog spec said 23 — drift of +2: `SentinelInteractionRail.tsx` and `EvidenceDatasetDrawer.tsx` added since the spec was written)

### Pattern primitive (8 components)

These components render Pattern entities — internal, distilled, reusable knowledge.

| Component | Wave | Shell type | Notes |
|-----------|------|-----------|-------|
| `PatternDetailPage.tsx` | I2 legacy | `'use client'` | Reading layout for a single pattern; **should be converted to server component per I3 model** |
| `DeprecatedPatternDetailPage.tsx` | pre-I3 | `'use client'` | Old reading layout; **scheduled for deletion in I1** |
| `SentinelActivePatterns.tsx` | I2 | Server | Active pattern detection grid + Sentinel brief |
| `SentinelPatternDetail.tsx` | I3 | Server | Deterministic pattern detail surface from I3 view helper |
| `SentinelPatternContentPanel.tsx` | I4 | Server | Sentinel-authored pattern content panel |
| `SentinelPatternRail.tsx` | I4 | `'use client'` | Sidebar rail for tenant pattern pages; context preloads from URL param |
| `IntelligenceCanvasModeTabs.tsx` | I5 | Server | Four-mode tab strip (URL-param-driven) for pattern canvas |
| `IntelligenceLensTabs.tsx` | INTEL4 | Server | Five-mode lens (Summary · Evidence · Programs · Actions · Signals) |

**Pattern coverage:** Good. Core reading surfaces exist. `PatternDetailPage.tsx` client/server split needs cleanup in I1.

---

### Signal primitive (0 dedicated components — GAP)

Signals are external, time-sensitive, marketplace-aware observations. No dedicated Signal components exist in `src/components/intelligence/`.

| Component | Relationship to Signal | Status |
|-----------|----------------------|--------|
| `CohortCard.tsx` | Renders "emergent" sources from `Source` type — adjacent to signal concept | Legacy; not Signal-typed |
| `SourcePill.tsx` | Renders a `Source` entity inline — similar to signal citation | Legacy; not Signal-typed |

**Gap:** INT-IDX-SIGNALS and INT-DTL-SIGNAL catalog entries have no corresponding components. Needed in I3 (depends on Setup connector).

---

### Solution primitive (1 component)

Solutions are composite, prescriptive, end-to-end recommendations.

| Component | Wave | Shell type | Notes |
|-----------|------|-----------|-------|
| `SolutionsIndexPage.tsx` | I5/INTEL4 | `'use client'` | INT-IDX-SOLUTIONS, solution archetype cards; should be server component |

**Gap:** INT-DTL-SOLUTION (solution detail page) is missing. Needed in I5.

---

### Contradiction primitive (1 component)

Contradictions are meta, conflict-aware, risk-tracking entities.

| Component | Wave | Shell type | Notes |
|-----------|------|-----------|-------|
| `ContradictionReviewQueue.tsx` | legacy | `'use client'` | Contradiction detection queue; imports from `jobs/` — coupling to job layer is architectural debt |

**Gap:** INT-DTL-CONTRADICTION (contradiction detail page) is missing. Needed in I5. The current component is a queue/list, not a detail view.

---

### Cross-cutting / multi-primitive (7 components)

Components that serve multiple primitives or the module's shared infrastructure.

| Component | Wave | Shell type | Notes |
|-----------|------|-----------|-------|
| `IntelligenceIndexPage.tsx` | I1/INTEL | `'use client'` | Main index; pattern library browsing; `useState` + `useSearchParams`; **should be converted to server-side URL filtering in I1** |
| `IntelligenceProvenanceRibbon.tsx` | I2/CMP | Server | Provenance ribbon; driven by `IntelligenceProvenanceRibbonView`; ready for reuse |
| `IntelligenceSourceBasisPanel.tsx` | I7/I2 | Server | Internal/external source basis panel; driven by `IntelligenceSourceBasisPanelView` |
| `IntelligenceWorkflowCanvas.tsx` | I6/INTEL | Server | Workflow canvas; driven by `IntelligenceWorkflowCanvasView` |
| `KnowledgeFabricHealthPanel.tsx` | INTEL | Server | Knowledge fabric health; driven by `buildKnowledgeFabricHealthPanelView` |
| `EvidenceDatasetDrawer.tsx` | I6 | Server | I6 evidence dataset drawer; imports I6 view helper |
| `SentinelEvidenceBrief.tsx` | I3/I2 | Server | Sentinel evidence brief; driven by `SentinelEvidenceBriefView` |

---

### Agent / synthesis (3 components)

Components that render agent outputs.

| Component | Wave | Shell type | Notes |
|-----------|------|-----------|-------|
| `NexusTurn.tsx` | legacy | `'use client'` | Nexus turn format renderer; imports from `@/lib/intelligence/types` |
| `SentinelInteractionRail.tsx` | I8 | Server | I8 Sentinel interaction rail; deterministic read model |
| `SynthesisOutput.tsx` | I6/atlas | `'use client'` | Atlas synthesis output; imports `AtlasSynthesisResult` from `atlas-synthesis.ts` |

---

### Shell / infrastructure (1 component — retiring)

| Component | Status | Notes |
|-----------|--------|-------|
| `IntelligenceRouteShell.tsx` | **Retiring in I1** | Old three-layer shell pattern; replaced by AppShell in all new pages |

---

### Formats sub-directory

`src/components/intelligence/formats/` — verified to contain format renderer helpers (`OneSentence`, `Matrix`, etc.) used by `NexusTurn.tsx`. These are presentation-only; no primitive mapping needed.

---

## §2 · Route coverage (`src/app/`)

| Route | Status | Component | Shell |
|-------|--------|-----------|-------|
| `/intelligence` | ✅ Exists | `IntelligenceIndexPage` | AppShell (via component) |
| `/intelligence/[patternId]` | ✅ Exists | `PatternDetailPage` | AppShell |
| `/intelligence/solutions` | ✅ Exists | `SolutionsIndexPage` | AppShell |
| `/tenant/[tenantSlug]/intelligence` | ✅ Exists | tenant intelligence page | AppShell |
| `/tenant/[tenantSlug]/intelligence/patterns/[patternKey]` | ✅ Exists | tenant pattern page | AppShell |
| INT-IDX-SIGNALS (signal stream) | ❌ Missing | — | — |
| INT-DTL-SIGNAL | ❌ Missing | — | — |
| INT-IDX-GRAPH (knowledge graph browser) | ❌ Missing | — | — |
| INT-DTL-CONTRADICTION (detail) | ❌ Missing | — | — |
| INT-DTL-SOLUTION (detail) | ❌ Missing | — | — |
| INT-FLW-SYNTHESIZE | ❌ Missing | — | — |
| INT-FLW-AUTHOR | ❌ Missing | — | — |

---

## §3 · Read model / lib coverage (`src/lib/intelligence/`)

Verified files present: `types.ts`, `atlas-synthesis.ts`, `citation-renderer.ts`, `contradiction-detector.ts`, `intelligence-provenance-ribbon-view.ts`, `intelligence-source-basis-panel-view.ts`, `intelligence-workflow-canvas-view.ts`, `knowledge-fabric-health-view.ts`, `sentinel-brief-evidence-view.ts` (plus I1–I8 view models as per build-slices.json).

**Assessment:** Read model layer is substantially complete per build-slices.json (I1–I8 entries, all code_complete). UI is the gap — components lag behind the view models.

---

## §4 · Gaps summary

| # | Gap | Blocking | Addressed by |
|---|-----|---------|--------------|
| G1 | `IntelligenceIndexPage.tsx` is a client component with `useState`/`useSearchParams` | No — but violates server-component principle | I1 |
| G2 | `PatternDetailPage.tsx` is a client component (old reading view) | No — `SentinelPatternDetail.tsx` is the server-component replacement | I1 (delete deprecated; rewire route to SentinelPatternDetail) |
| G3 | `DeprecatedPatternDetailPage.tsx` exists and is file-visible | No — not linked from current routes | I1 (delete) |
| G4 | `IntelligenceRouteShell.tsx` (old shell) not yet retired | No — no routes import it directly | I1 (delete) |
| G5 | Signal-specific components missing (INT-IDX-SIGNALS, INT-DTL-SIGNAL) | Yes — blocks I3 signal stream | I3 (depends on Setup connector) |
| G6 | Knowledge graph browser missing (INT-IDX-GRAPH) | Yes — blocks I4 | I4 (hard dep: ≥50 graph edges) |
| G7 | Solution detail page missing (INT-DTL-SOLUTION) | Partially — index exists | I5 |
| G8 | Contradiction detail page missing (INT-DTL-CONTRADICTION) | Partially — queue exists | I5 |
| G9 | Atlas synthesis flow missing (INT-FLW-SYNTHESIZE, INT-FLW-AUTHOR) | Yes — blocks I6 | I6 (needs Atlas runtime) |
| G10 | `ContradictionReviewQueue.tsx` imports from `jobs/` directly | Architectural debt | I5 (decouple via view model) |
| G11 | `SolutionsIndexPage.tsx` is a client component | Minor | I5 (convert to server) |

---

## §5 · Primitive-to-wave mapping

| Primitive | I1 | I2 | I3 | I4 | I5 | I6 | I7 |
|-----------|----|----|----|----|----|----|-----|
| Pattern | ✅ Foundation + cleanup | ✅ Active patterns | — | ✅ Authored content | — | — | — |
| Signal | — | — | ✅ Stream + detail | — | — | — | — |
| Solution | ✅ Index skeleton | — | — | — | ✅ Detail | — | — |
| Contradiction | — | — | — | — | ✅ Detail | — | — |
| Graph | — | — | — | ✅ Browser | — | — | — |
| Provenance | ✅ Ribbon foundation | — | — | — | — | — | ✅ Quality lens |
| Atlas synthesis | — | — | — | — | — | ✅ FLW-SYNTHESIZE | — |

---

## §6 · Wave skeleton plans (I1–I7)

### Wave I1 · Library foundation

**Purpose:** Replace `IntelligenceRouteShell`, convert `IntelligenceIndexPage` to server component, delete deprecated files, establish `INT-IDX-LIBRARY` skeleton.

**Files to delete:** `DeprecatedPatternDetailPage.tsx`, `IntelligenceRouteShell.tsx`

**Files to modify:** `IntelligenceIndexPage.tsx` (server component, URL-param filtering), route `page.tsx` entries to wire `SentinelPatternDetail` as the canonical detail

**Catalog entry:** INT-IDX-LIBRARY

**Estimate:** ~600 lines

**Test:** S-SMOKE-AMS equivalent smoke for Intelligence index render; no broken imports after deletions

---

### Wave I2 · Pattern detail + ProvenanceRibbon

**Purpose:** `SentinelPatternDetail` is the canonical pattern detail surface. `IntelligenceProvenanceRibbon` wraps it. This wave validates and polishes the reading layout, wires `PatternDetailPage` deprecation cleanly.

**Signature visual element:** ProvenanceRibbon below every pattern header — shows evidence chain and origin clearly.

**Catalog entry:** INT-DTL-PATTERN

**Estimate:** ~700 lines

**Test:** T3-H03 pattern detail renders with provenance ribbon and ≥2 evidence rows

---

### Wave I3 · Signal stream + Signal detail

**Purpose:** Introduce the Signal primitive into the UI for the first time. Build INT-IDX-SIGNALS (signal index with time axis) and INT-DTL-SIGNAL (individual signal detail with confidence, source, linked patterns).

**Hard dependency:** At least one ingestion connector live (Setup dependency — SET-S3 Microsoft Graph or equivalent). **Wave halts if no connector is live.**

**New components needed:** `SignalIndexPage.tsx`, `SignalDetailPage.tsx`, `SignalCard.tsx`, `SignalTimestamp.tsx`

**Catalog entries:** INT-IDX-SIGNALS, INT-DTL-SIGNAL

**Estimate:** ~500 lines

**Test:** Signal index renders ≥1 signal; detail renders confidence + provenance

---

### Wave I4 · Knowledge graph browser

**Purpose:** Make the graph visible. INT-IDX-GRAPH is a browsable view of the four-primitive graph — Patterns → Signals → Solutions → Contradictions — with relationship types, confidence, and provenance visible at a glance.

**Hard dependency:** ≥50 graph edges populated in the knowledge graph store. **Wave halts if edge count < 50.**

**New components needed:** `KnowledgeGraphBrowser.tsx`, `GraphNodeCard.tsx`, `GraphEdgeLabel.tsx`

**Catalog entry:** INT-IDX-GRAPH

**Estimate:** ~800 lines

**Test:** Graph browser renders ≥10 nodes; clicking a node routes to correct detail page

---

### Wave I5 · Solutions + Contradictions

**Purpose:** Close the Solution and Contradiction primitive gaps. Build INT-DTL-SOLUTION (solution detail with component patterns and calibrating signals) and INT-DTL-CONTRADICTION (contradiction detail with resolution status and evidence on both sides). Convert `SolutionsIndexPage.tsx` to server component.

**New components needed:** `SolutionDetailPage.tsx`, `ContradictionDetailPage.tsx`

**Modified:** `ContradictionReviewQueue.tsx` — decouple from `jobs/` import; wire to view model instead

**Catalog entries:** INT-IDX-SOLUTIONS (polish), INT-DTL-SOLUTION, INT-DTL-CONTRADICTION

**Estimate:** ~700 lines

**Test:** Solution detail renders linked patterns; contradiction detail renders resolution status and opposing evidence

---

### Wave I6 · Atlas synthesis + Authoring

**Purpose:** Build the active synthesis flow — how Atlas synthesizes a new pattern from evidence and how a human author reviews and publishes it. INT-FLW-SYNTHESIZE (Atlas-driven synthesis surface) and INT-FLW-AUTHOR (human review + publish surface).

**Hard dependency:** Atlas runtime via model gateway (MG3 contract). Without a live model call, this surface renders a stub/placeholder state only.

**New components needed:** `AtlasSynthesizeFlow.tsx`, `PatternAuthorReviewPanel.tsx`, `SynthesisDraftPanel.tsx`

**Catalog entries:** INT-FLW-SYNTHESIZE, INT-FLW-AUTHOR

**Estimate:** ~800 lines

**Test:** Synthesis stub renders with honest "model runtime deferred" disclaimer; author panel renders draft with approve/reject affordances

---

### Wave I7 · Quality lens + Cross-surface

**Purpose:** Close the module. INT-LNS-QUALITY surfaces the quality of the knowledge corpus (coverage gaps, stale signals, contradiction rate, pattern reuse score). Cross-surface auto-surfacing means any Programs or Source page that references a pattern shows the ProvenanceRibbon in situ.

**New components needed:** `QualityLensPanel.tsx`

**Modified:** `IntelligenceSourceBasisPanel.tsx` (already exists — wire into Programs and Source pages)

**Catalog entries:** INT-LNS-QUALITY, cross-surface wiring in Programs/Source/Tower

**Estimate:** ~500 lines

**Test:** Quality lens renders corpus health scores; Programs detail page shows at least one ProvenanceRibbon reference

---

## §7 · Build readiness

| Item | Ready to start? |
|------|----------------|
| I1 (Library foundation) | ✅ Unblocked — pure cleanup + shell work |
| I2 (Pattern detail) | ✅ Unblocked — SentinelPatternDetail server component already exists |
| I3 (Signal stream) | ❌ Blocked — needs Setup connector |
| I4 (Knowledge graph) | ❌ Blocked — needs ≥50 graph edges |
| I5 (Solutions + Contradictions) | ✅ Unblocked — read models code_complete |
| I6 (Atlas synthesis) | ❌ Blocked — needs Atlas runtime |
| I7 (Quality lens) | ✅ Unblocked — no external dependencies |

**Recommended next pick:** I1 (Library foundation) immediately; I2 and I5 in the same wave or serially.

---

## §8 · CI requirements for Intelligence waves

Per `INTELLIGENCE_DESIGN_SPEC.md §CI`:

- `@abarva/atlas-word-cap` — Atlas voice strings ≤ 150 words per occurrence; applied to all `SynthesisOutput` and Atlas agent column text
- `@abarva/no-orphan-data` — every data field rendered on an Intelligence surface must have a `provenance` chain or a `MissingInputChip` fallback
- Standard: `npx tsc --noEmit`, `npm run build`, `npx jest <wave-tests>`

I0 smoke test: `I-SMOKE-CDP` — T3-H03 pattern + APX-CDP-2026 instance + 5+ graph nodes + Atlas synthesis with citations. Status: **not yet executable** (graph and Atlas runtime not wired).
