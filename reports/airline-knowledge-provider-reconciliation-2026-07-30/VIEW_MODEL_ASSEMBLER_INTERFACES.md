# KnowledgeUiViewModelAssembler — interface spec (written before implementation)

Module location: `src/lib/knowledge/view-model/` (checked for collisions first — no existing
directory of that name under `src/lib/knowledge/`; `consumption-contracts`, `consumption-client`,
`consumption-server`, `fixtures`, `context-broker`, `tenant-data`, `private-data-plane`,
`operations-lens` are the only siblings).

The assembler sits strictly between `ConsumptionRuntime` (real, existing) and UI components (PR B's
scope, not touched here). It is pure view-model composition: no fetch/HTTP/pg of its own — every
data point it produces traces to a `ConsumptionEnvelope` field the runtime returned, or is explicitly
marked unavailable via the enum below. It never invents an ID, a count, or a quote.

## 1. `ComponentReadinessState` — the 11-value enum (replaces the duplicate's 5-value `ReadinessState`)

```ts
export const COMPONENT_READINESS_STATES = [
  "ENABLED_AND_PROVEN",
  "DATA_RECONCILED_BUT_UI_UNPROVEN",
  "SOURCE_INCOMPLETE",
  "PROJECTION_UNAVAILABLE",
  "CUBE_UNPROVEN",
  "WITHHELD",
  "RESTRICTED",
  "STALE",
  "DISPUTED",
  "NOT_MEASURED",
  "NOT_ASSESSED",
] as const;
export type ComponentReadinessState =
  (typeof COMPONENT_READINESS_STATES)[number];
```

This is a **UI/business concept**, not a re-export of any real contract enum (per the reconciliation
matrix's `ReadinessState` row: `UI_VIEW_MODEL_ONLY`). It is _derived_, deterministically, from the
real `AvailabilityState` / `AuthorityState` / `FreshnessState` / `ConsumptionWarning[]` a given
envelope carries — never assigned by hand, never inferred from absence of an error.

Derivation table (the assembler's single `deriveReadiness()` function is the only place this logic
lives — no component and no other assembler function re-implements it):

| Real signal                                                                                                                                                                                                                                    | `ComponentReadinessState`                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `availabilityState === "not_loaded"` and no projection exists for this tenant/baseline at all (warning code `not_loaded`, empty payload)                                                                                                       | `PROJECTION_UNAVAILABLE`                                                                                                                                                    |
| `availabilityState === "withheld"`                                                                                                                                                                                                             | `WITHHELD`                                                                                                                                                                  |
| `availabilityState === "withheld"` **and** the evidence descriptor's `accessRestriction === "restricted"`                                                                                                                                      | `RESTRICTED` (more specific than `WITHHELD`; checked first)                                                                                                                 |
| `availabilityState === "not_measured"`                                                                                                                                                                                                         | `NOT_MEASURED`                                                                                                                                                              |
| `availabilityState === "conflicting"`                                                                                                                                                                                                          | `DISPUTED`                                                                                                                                                                  |
| `availabilityState === "not_applicable"`                                                                                                                                                                                                       | `NOT_ASSESSED`                                                                                                                                                              |
| `availabilityState === "stale"` or `freshnessState === "stale"` (data present, aged)                                                                                                                                                           | `STALE`                                                                                                                                                                     |
| `availabilityState === "candidate"` (data present, unreviewed)                                                                                                                                                                                 | `DATA_RECONCILED_BUT_UI_UNPROVEN`                                                                                                                                           |
| Data present, `evidenceCoverage` present and non-zero, but the field is known-sparse per an explicit assembler allow-list (see §5, leadership content) even though `availabilityState === "available"`                                         | `SOURCE_INCOMPLETE` — the ONE state this PR computes from a fact outside the envelope (a known corpus-completeness fact), documented per field in §5, never invented ad hoc |
| `warnings` contains `code: "cube_unavailable"`                                                                                                                                                                                                 | `CUBE_UNPROVEN`                                                                                                                                                             |
| `availabilityState === "available"`, `authorityState` is `"accepted"` or `"published"`, `freshnessState === "fresh"`, and there is at least one end-to-end cite-render test proving this exact view model renders correctly (see TEST_PLAN.md) | `ENABLED_AND_PROVEN`                                                                                                                                                        |
| Same as above but no cite-render test yet exists for this specific view model                                                                                                                                                                  | `DATA_RECONCILED_BUT_UI_UNPROVEN`                                                                                                                                           |

Hard invariants this function enforces (lifted directly from the task brief and from the real
contract's own `states.ts` comments):

- missing/withheld/not_measured never becomes a rendered `0` — `deriveReadiness` is checked **before**
  any numeric field is read, never after.
- `candidate`/`proposed` never becomes `ENABLED_AND_PROVEN` — the derivation table above makes this
  structurally impossible (candidate is hard-routed to `DATA_RECONCILED_BUT_UI_UNPROVEN`).
- a `TargetV1` never gets attached to a "current" view-model field — `CurrentVsTargetViewModel` keeps
  `current` and `target` as two distinct, separately-readiness-tagged sub-objects, never merged.
- a `RelationshipEdgeV1` with `authorityState === "candidate"` never renders as an accepted edge —
  `RelationshipNeighborhoodViewModel.edges[].readiness` is computed per-edge with `proven: true`
  (an edge has no separate "UI cite-render proof" concept beyond its own governed authority state,
  unlike whole-page narrative content — see the implementation comment in `assembler.ts`), so a
  `candidate`-authority edge is routed to `DATA_RECONCILED_BUT_UI_UNPROVEN` before the `proven`
  flag is ever consulted, while an `accepted`/`published`+`available`+`fresh` edge reaches
  `ENABLED_AND_PROVEN`. The UI-facing "dashed vs solid" decision is simply
  `readiness === "ENABLED_AND_PROVEN"` (solid) vs everything else (dashed).

## 2. The nine airline lenses

The real `KnowledgeLens` (6 generic, cross-industry values: `none | cost_efficiency |
risk_resilience | growth_innovation | data_ai_readiness | vendor_consolidation`) is a re-ranking
filter, not a business-narrative taxonomy — confirmed by reading `queries.ts` directly. The airline
lens narrative (crew legality, IROPS, baggage, MRO, etc.) that PR #5772's design targets is an
assembler-layer concept, built as **industry content metadata** layered on top of the same 8
governed queries — it does not change which rows come back, only how the assembler labels/filters/
narrates them.

```ts
export interface AirlineLensDefinition {
  readonly lensId: AirlineLensId;
  readonly label: string;
  /** Which domainKey(s) this lens principally scopes Explore/Relationships to. */
  readonly primaryDomainKeys: readonly string[];
  /** The nearest real KnowledgeLens re-ranking filter to pass through to queries. */
  readonly nearestRealLens: KnowledgeLens;
}

export const AIRLINE_LENSES = [
  "understand",
  "irops_disruption_recovery",
  "crew",
  "baggage",
  "loyalty",
  "revenue",
  "mro",
  "network_scheduling",
  "safety_compliance",
] as const;
export type AirlineLensId = (typeof AIRLINE_LENSES)[number];
```

**Provenance note (important for whoever builds PR B):** the task brief names 7 of these 9 lenses
explicitly (`understand, irops/disruption-recovery, crew, baggage, loyalty, revenue, mro, and more`).
I was not able to read the approved HTML prototype it refers to (not present in this git history —
see `TENANT_ACTIVATION_DEPENDENCY.md` and `RISK_ASSESSMENT.md` for the missing-artifacts finding). I
constructed the remaining 2 (`network_scheduling`, `safety_compliance`) as the two next-most-obvious
airline operating lenses to reach 9, consistent with the 7 given. **PR B must confirm the full 9
against the actual approved prototype before shipping** — do not treat `network_scheduling`/
`safety_compliance` as validated names, only as reasonable placeholders.

`resolved` (per lens) is computed by the assembler, not hand-set: a lens is `resolved: true` only
when at least one of its `primaryDomainKeys` returns `availabilityState === "available"` data from
`exploreEntities` or `getEnterpriseBrief` for the active baseline.

## 3. View-model interfaces

Every view model wraps its payload in a thin readiness envelope so a component never has to
re-derive readiness itself:

```ts
export interface ViewModelEnvelope<T> {
  readonly readiness: ComponentReadinessState;
  /** Present only when readiness !== ENABLED_AND_PROVEN / DATA_RECONCILED_BUT_UI_UNPROVEN. */
  readonly unavailableReason: string | null;
  /** Null whenever readiness would make the data unsafe to render as fact. */
  readonly data: T | null;
  readonly evidenceRefs: readonly string[];
  readonly knownGapRefs: readonly string[];
  readonly asOf: string;
  readonly knowledgeBaselineRef: string;
}
```

| View model                          | Composed from (real queries)                                                    | Classification driving it (see matrix)                                                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EnterpriseBriefViewModel`          | `getEnterpriseBrief`                                                            | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `EnterpriseProfileViewModel`        | `getEnterpriseBrief().data.identity`                                            | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `StrategicContextViewModel`         | `getEnterpriseBrief().data.interpretation` (per active lens)                    | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `LeadershipAgendaViewModel`         | `getEnterpriseBrief().data.perspectives`                                        | DIRECTLY_SUPPORTED contract / **SOURCE_INCOMPLETE at runtime today** — see §5                                                                                                                  |
| `IndustryContextViewModel`          | `getEnterpriseBrief().data.benchmarks` (both contentClasses)                    | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `AbarVaViewViewModel`               | `getEnterpriseBrief().data.interpretation`                                      | DIRECTLY_SUPPORTED (singular; see matrix row `listAbarvaViews`)                                                                                                                                |
| `TopOpportunitiesViewModel`         | `getEnterpriseBrief().data.targets` + `.domains`                                | SUPPORTED_BY_COMPOSITION                                                                                                                                                                       |
| `TopUseCasesViewModel`              | `getEnterpriseBrief().data.benchmarks` (`industry_pattern`) + `exploreEntities` | SUPPORTED_BY_COMPOSITION                                                                                                                                                                       |
| `DecisionsWaitingViewModel`         | `getEvidenceAndGaps` + `getEnterpriseBrief().data.domains`                      | SUPPORTED_BY_COMPOSITION (readiness rollup; real contract has no native "decision" object — see matrix rows `listDecisionLanes`/`listDecisions`)                                               |
| `ExploreInventoryViewModel`         | `exploreEntities({domainKey})`                                                  | DIRECTLY_SUPPORTED for `applications`/`vendors`; MISSING_PROVIDER_QUERY for `dataProducts`/`infrastructure`; MISSING_CONSUMPTION_PROJECTION for `integrations`/`programs`/`risks` — see matrix |
| `RelationshipNeighborhoodViewModel` | `getRelationships`                                                              | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `EvidenceAndGapsViewModel`          | `getEvidenceAndGaps`                                                            | DIRECTLY_SUPPORTED                                                                                                                                                                             |
| `CurrentVsTargetViewModel`          | `getEnterpriseBrief().data.targets` + `getEntityDetail`                         | SUPPORTED_BY_COMPOSITION (Brief-level only today; see matrix)                                                                                                                                  |
| `DecisionReadinessViewModel`        | `getEnterpriseBrief` + `getEvidenceAndGaps` + `getRelationships`                | SUPPORTED_BY_COMPOSITION                                                                                                                                                                       |
| `AvaContextViewModel`               | `getSuggestedQuestions` + local `AvaContextRefs` (shell state, not fetched)     | DIRECTLY_SUPPORTED / composition per matrix `askAva`/`getModuleKnowledgePacket`                                                                                                                |

Representative signatures (full set follows this shape; not exhaustively reproduced here to keep
this spec readable — the implementation file is the source of truth once written):

```ts
export interface KnowledgeUiViewModelAssembler {
  getEnterpriseBrief(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EnterpriseBriefViewModel>>;
  getEnterpriseProfile(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EnterpriseProfileViewModel>>;
  getStrategicContext(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<StrategicContextViewModel>>;
  getLeadershipAgenda(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<LeadershipAgendaViewModel>>;
  getIndustryContext(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<IndustryContextViewModel>>;
  getAbarVaView(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<AbarVaViewViewModel>>;
  getTopOpportunities(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<TopOpportunitiesViewModel>>;
  getTopUseCases(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<TopUseCasesViewModel>>;
  getDecisionsWaiting(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<DecisionsWaitingViewModel>>;
  getExploreInventory(
    input: AssemblerQuery & { domainKey: string },
  ): Promise<ViewModelEnvelope<ExploreInventoryViewModel>>;
  getRelationshipNeighborhood(
    input: AssemblerQuery & { focalEntityRefs: string[]; hopDepth: 1 | 2 },
  ): Promise<ViewModelEnvelope<RelationshipNeighborhoodViewModel>>;
  getEvidenceAndGaps(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<EvidenceAndGapsViewModel>>;
  getCurrentVsTarget(
    input: AssemblerQuery & { entityRef?: string },
  ): Promise<ViewModelEnvelope<CurrentVsTargetViewModel>>;
  getDecisionReadiness(
    input: AssemblerQuery,
  ): Promise<ViewModelEnvelope<DecisionReadinessViewModel>>;
  getAvaContext(
    input: AssemblerQuery & { mode: KnowledgeMode },
  ): Promise<ViewModelEnvelope<AvaContextViewModel>>;
  listAirlineLenses(
    input: AssemblerQuery,
  ): Promise<readonly (AirlineLensDefinition & { resolved: boolean })[]>;
}

export interface AssemblerQuery {
  readonly runtime: ConsumptionRuntime;
  readonly tenantKey: string;
  readonly lens: AirlineLensId;
  readonly depth: DepthLevel;
  readonly currentTargetScope: "current" | "target" | "both";
}
```

## 4. Hard rules encoded in the implementation (from the task brief, restated as invariants)

- The assembler function signature never accepts a browser-trusted `tenantKey` as the sole identity
  input for a real (non-fixture) runtime — it always receives a `ConsumptionRuntime` that was already
  bound server-side (mirrors `_shared.ts`'s `requireTenancy()` pattern).
- No assembler function returns a bare value; every function returns `ViewModelEnvelope<T>`.
- No assembler function is allowed to call `Math.random`, `Date.now()`-seeded fabrication, or any
  other non-deterministic value generator. Every field is either read from an envelope or `null`.
- No assembler function is allowed to import `src/lib/knowledge/providers/**` or
  `src/components/knowledge/**` (non-vnext) — enforced by an eslint `no-restricted-imports` rule
  scoped to `src/lib/knowledge/view-model/**` (added by this PR — see the assembler's own test for a
  static-import-check regression).

## 5. `SOURCE_INCOMPLETE` — the specific fields this PR pins today, and why

Per the task brief and the foundation-closure evidence I found (see `SOURCE_INCOMPLETE_COMPONENTS.md`
for the full list and evidence), these fields resolve to `SOURCE_INCOMPLETE` for `airline-demo-new`
today regardless of `availabilityState`, because the assembler knows — from the corpus-completeness
fact the task brief states, corroborated by `consumption-server/shape.ts::shapeEnterpriseBrief`
hardcoding `perspectives: []` and `interpretation: null` unconditionally, and by the foundation-closure
record listing zero `executive_perspective_v1`/`strategic_interpretation_v1` rows at all — that the
underlying interview corpus cannot support a complete, non-templated answer yet:

- `LeadershipAgendaViewModel` (all of `EnterpriseBriefV1.perspectives`)
- C-suite Perspectives (same field, Brief-mode "Leadership against evidence" section)
- Leadership Disagreements (would require ≥2 conflicting perspectives per topic — cannot exist with
  the current corpus)
- Executive Commitments (would require perspective + linked target/decision — same dependency)
- Full aVa leadership reasoning (`AvaKnowledgePacket.executivePerspectiveRefs` — empty by construction
  when no perspectives exist to reference)

This list is a **fixed allow-list in the implementation**, not a runtime heuristic — the assembler
does not try to detect "is this sparse" from row counts at request time (that would be exactly the
kind of inferred-not-declared behavior AGENTS.md prohibits for identity, and the same principle
applies here: known corpus gaps are declared, not sniffed).
