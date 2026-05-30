# 2026-05-30 · Atlas initiative deep-retrieval layer

## Release ID
`2026-05-30-atlas-initiative-deep-retrieval`

## Status
candidate

## Plain-English Summary
Atlas, the Tower agent that answers CIO/CFO questions, can today answer broad portfolio questions ("show lagging programs") but cannot answer DEEP questions about a single named initiative. A CIO asking "tell me about AR-02 Copilot" should get: code, name, archetype, owner, status, baseline metrics, business-case skeleton (from the kernel), gates passed and upcoming, value attestation, peer-position-within-the-tenant's-portfolio, open signals affecting this initiative, and evidence anchors.

This release ships ONE retrieval function — `getInitiativeDeepView(initiativeId, tenancy)` — that Atlas's composition layer (Wave 3) will call. Pure retrieval; no LLM, no composition. The function joins the AI initiatives registry, Tower-ingested operating metrics, the kernel business-case skeleton, gates passed/upcoming, signals affecting the initiative, and a within-tenant portfolio percentile. Every join is tenant-scoped (`client_id`), and the shape is honest by design — `null` for the kernel skeleton when it can't compute, empty arrays where a join misses, planning ranges (not invented point estimates) for projected value.

The composition agent at Wave 3 will join this with the IAC archetype detail (sibling Wave 1 lane) to assemble the "tell me about AR-02" response.

## Layer Impact
- `architecture-lane`: new module `src/lib/atlas/initiative-deep/` containing the public retrieval entry point (`getInitiativeDeepView`), the seven per-source join helpers, and the canonical `InitiativeDeepView` shape. No existing code touched.
- `runtime-app-lane`: none — no route changes, no agent runtime changes. Wave 3 will wire `getInitiativeDeepView` into Atlas's composition layer in a follow-up PR.
- `qa-validation-lane`: 3 new test files / 17 cases covering happy-path retrieval, the P0 tenant-scoping invariant (Apex/Meridian fixtures + grep invariant), and the kernel `null`-skeleton fallback.
- `data-plane-lane`: none — reads existing tables (`ai_initiatives`, `ai_initiative_kpis`, `clients`, `tower_ai_tool_usage`, `tower_dora_metrics`, `engagements`, `engagement_phases`, `phase_approvals`, `signal_firings`). No schema or migration changes.

## Client Applicability
- All clients: yes — when Atlas composition (Wave 3) lands, the deep-retrieval call works for every tenant. Tenant scope is a P0 invariant on the function itself.
- Specific clients: none preferentially.
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/initiative-deep/types.ts` — canonical `InitiativeDeepView` shape + helper types (`PlanningRange`, `ConfidenceTier`, `InitiativeBaselineMetric`, `InitiativeBusinessCaseSkeleton`, `InitiativeGates`, `InitiativeSignal`, `InitiativePortfolioPosition`, `InitiativeEvidenceAnchor`).
- `src/lib/atlas/initiative-deep/retrieve.ts` — public entry point `getInitiativeDeepView(initiativeId, tenancy, client?)`. Orchestrates the joins in parallel; returns the deep view or honest `null` when the initiative does not belong to the caller's tenant.
- `src/lib/atlas/initiative-deep/joins/ai-initiatives.ts` — tenant-scoped `loadInitiativeRow` + `loadInitiativeKpis`, plus the baseline-metric roll-up that picks the latest reading per KPI.
- `src/lib/atlas/initiative-deep/joins/tower-metrics.ts` — `loadTowerToolUsage` + `loadTowerDoraMetrics` for the operating-metric stream; returns empty when Tower ingest is absent.
- `src/lib/atlas/initiative-deep/joins/value-attestation.ts` — computes attestation from `ai_initiatives.measured_value_usd` vs committed columns; downgrades the confidence tier honestly when measured or committed data is missing.
- `src/lib/atlas/initiative-deep/joins/business-case.ts` — wraps `buildMoveBusinessCase` from the expert kernel. Reads `clients.industry_code` for pack binding. Returns honest `null` when the kernel cannot resolve a Function Pack.
- `src/lib/atlas/initiative-deep/joins/gates.ts` — best-effort engagement linkage via `engagements.metadata->>'initiative_id'`; surfaces passed-gate approvals and the next upcoming gate from `phase_approvals` + `engagement_phases`. Empty when no engagement is linked.
- `src/lib/atlas/initiative-deep/joins/signals.ts` — engagement-linked signals plus a small portfolio-level backfill, all tenant-scoped.
- `src/lib/atlas/initiative-deep/joins/portfolio-position.ts` — within-tenant value-attainment percentile; honest `null` for too-small samples and a confidence tier sized to the peer count.
- `src/lib/atlas/initiative-deep/_test-mock-client.ts` — fake `PostgresCompatClient` keyed by table name; honors `.eq`/`.neq`/`.in`/`.order`/`.limit` filter chains so the tenant-scoping invariant can be verified with real fixtures.
- `src/lib/atlas/initiative-deep/__tests__/retrieve.test.ts` — 7 happy-path cases (core fields, baseline-metric roll-up, value attestation, gates/signals empty when no engagement is linked, portfolio percentile, evidence anchors, null for unknown initiative).
- `src/lib/atlas/initiative-deep/__tests__/tenant-scoping.test.ts` — 6 P0 invariant cases: Meridian payload contains no Apex tokens, Apex payload contains no Meridian tokens, cross-tenant id lookups return `null`, cross-tenant peers do not contaminate the percentile, and a file-grep invariant rejecting hardcoded tenant keys (`apexretail` / `meridian` / `arcturus`) anywhere in `src/lib/atlas/initiative-deep/`.
- `src/lib/atlas/initiative-deep/__tests__/business-case-fallback.test.ts` — 4 cases proving the deep view is honest when the kernel can't compute (skeleton `null`, projected range `null`, attainment `null`, portfolio position `null`).

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest --testPathPatterns="atlas/initiative-deep"` — 3 suites / 17 tests pass.
- `npm run test:behaviors` — pre-existing tenant-onboarding failures on main confirmed unrelated (same precedent as the Atlas P0 cross-tenant leak release record).
- New invariants:
  - tenant scope is enforced on every join (`client_id` filter precedes any row read);
  - cross-tenant initiative id + tenancy returns `null` (no row crossing);
  - cross-tenant peer initiatives do not contribute to the within-tenant percentile;
  - no hardcoded tenant key string appears in `src/lib/atlas/initiative-deep/`.
- Honesty discipline: kernel `null` is surfaced for `businessCaseSkeleton` when the Move binding fails; `valueAttestation.projectedRange` is `null` in the same case; `attainmentPct` is `null` when measured-vs-committed cannot be computed; portfolio percentile is `null` when fewer than 2 peers carry attainment data.

## Rollout Plan
- Merge this PR to main.
- No deploy hook needed — the module is not yet wired into a runtime path. Wave 3 will land the composition agent that calls `getInitiativeDeepView()` alongside the IAC's `getArchetype()`; that PR is the first to surface the deep view to end-users.
- No flag needed.

## Rollback Plan
- Revert the single feature commit. The retrieval module is freestanding — no other code imports it yet — so the revert is byte-clean.

## Audit Evidence
- Mission brief (Wave 2 spec) defines the `InitiativeDeepView` shape and the seven join sources verbatim; this PR implements it 1:1.
- Tenant-scoping invariant follows the precedent set by the Atlas synthesis-route Fix A (`docs/releases/records/2026-05-30-atlas-p0-cross-tenant-leak.md`).

## Known Gaps
- The IAC archetype-key alignment (`archetypeKey: string; // matches IAC archetype key when known`) currently surfaces the `ai_initiatives.primary_category_id` (e.g. `CAT-01`). The IAC, in its sibling Wave 1 lane, will publish its own archetype-key namespace; a small mapping helper will land alongside the Wave 3 composition agent so the composer joins IAC archetype detail with the deep view by key, not by guess.
- Gates and signals depend on an engagement being linked to the initiative via `engagements.metadata->>'initiative_id'`. Registry initiatives that have not been originated as a Move surface empty gates / no engagement-scoped signals — the honest "this AI initiative is not (yet) a Move" state. When a future migration adds a first-class `ai_initiatives.engagement_id` column, the gates and signals join will pick that up immediately (no change required at this seam).
