# Knowledge vNext backend — build status & convergence note

Branch `feat/knowledge-consumption-backend` off `origin/main`. Bucket A (net-new
code, flag off, no data-plane mutation, nothing activated).

## Critical mid-build discovery: the data layer already exists elsewhere

Discovery (5 agents + 2 follow-ups) found that the publication/consumption/
review-ledger **schema and accept logic already exist**, fully built, on branch
`codex/airline-review-decision-ledger` (tip `f7cb5815c`) as
`clients/shared/21-phase3c2e-executable-data-layer/sql/001_shared_knowledge_publication_consumption.sql`
— a 10-schema framework (`source_registry/evidence/working/knowledge/metrics/
governance/publication/consumption/audit/operations`) with:

- `governance.review_decision` — the review-decision ledger (accept/reject/deferred)
- `knowledge.entity / fact_assertion / relationship_assertion` — accepted canonical
- `consumption.*_v1` tables (columns `object_ref, display_name, executive_summary, payload jsonb`)
- `publication.knowledge_baseline` + `publication.activate_knowledge_baseline()` + RLS + contract manifest
- accept/apply promotion (`executor-framework.mjs applyReviewDecisions`)

**Consequence:** hand-authoring `publication.*`/`consumption.*` migrations here
would FORK the data model (my columns `object_id` vs their `object_ref`, etc.) —
a second, conflicting truth, exactly the divergence the audit warns about. The
two migrations drafted here were therefore **reverted**. We CONVERGE with
phase3c2e, we do not duplicate it.

## Re-scoped Bucket A (main-lineage, non-conflicting)

| Piece | Status |
|---|---|
| Activation guard — a canonical tenant can never resolve to fixtures (`assertFixtureNamespace`) | ✅ built + tested (38 tests green) |
| 8-gate activation checklist (`scripts/knowledge/consumption-activation-gates.mjs`) — read-only, blocks activation until all pass | ✅ built + verified |
| publication/consumption schema migrations | ❌ NOT ours — owned by phase3c2e (`codex/airline-review-decision-ledger`) |
| review-decision ledger + accept/apply | ❌ NOT ours — owned by phase3c2e |
| 8 consumption API routes + `/api/knowledge/ava` | ⏳ net-new, but read phase3c2e `consumption.*_v1` — pending its merge to avoid schema drift |
| HTTP provider switch to real endpoints | ⏳ depends on the routes |
| consumption projection BUILD job (accepted `knowledge.*` → `consumption.*_v1`) | ⏳ existence being confirmed — likely the true remaining backend gap |

## RESOLVED: schema is merged; two precise gaps remain

Merge status (verified): the phase3c2e **schema is on `origin/main`** (PR #5681)
and the **executor framework is on `origin/main`** (PR #5687, `9fb949713`). Only
the review-decision-ledger *runtime* (PR #5692) is still a draft. So the serving
layer can be built against the REAL merged schema — no drift risk.

### Gap 1 — projection-build coverage (5 of 14)
`scripts/knowledge/processing/executor-framework.mjs buildConsumptionProjections`
(merged) INSERTs only into: `enterprise_identity_v1`, `relationship_node_v1`,
`relationship_edge_v1`, `relationship_evidence_v1`, `search_document_v1`.
**Not populated:** `enterprise_brief_v1`, `executive_perspective_v1`,
`strategic_interpretation_v1`, `domain_summary_v1`, `application_inventory_v1`,
`vendor_contract_inventory_v1`, `metric_observation_v1`, `evidence_gap_v1`,
`module_knowledge_packet_v1`. (`metrics.*` and `governance.evidence_gap` are
never read.)

### Gap 2 — payload shape mismatch
Projected `payload` jsonb is RAW canonical (`knowledge.entity.canonical_payload`,
`fact_assertion.fact_value`), not the structured TS `V1` contract types
(`EnterpriseBriefV1`, `EntitySummaryV1`, …) the shell reads via the
HttpConsumptionApiProvider. `consumption.enterprise_brief_v1` is never written.

### Remaining Bucket-A build (converges with phase3c2e, no fork)
1. **Payload-shaping module** (`src/lib/knowledge/consumption-server/shape-*.ts`):
   the single source of truth mapping canonical `knowledge.*`/`metrics.*`/
   `governance.evidence_gap` rows → the `V1` payloads. Reusable by the build job.
2. **Projection-build extension**: call the shaping module for all 14 projections
   (a coordination change to the phase3c2e-owned executor, or a follow-on build
   stage). Writes V1-shaped `payload`.
3. **Serving layer** (`consumption-server/reader.ts` + 8 routes + `/api/knowledge/ava`):
   resolve `publication.active_knowledge_baseline`, read `consumption.*_v1`,
   return `ConsumptionEnvelope`; surface `availability_state: not_loaded` for any
   projection not yet built (honest partial-data). Then flip the HTTP provider on.

### Done this turn (committed, non-conflicting)
- Activation guard (`assertFixtureNamespace`) — a real tenant can never get fixtures.
- 8-gate activation checklist (`scripts/knowledge/consumption-activation-gates.mjs`).
- Reverted the two divergent migrations (schema is phase3c2e's).

## Reconciliation with the fixture layer
The fixture provider stays (contract tests, visual regression, partial/stale/
conflicting/outage scenarios). The activation guard guarantees it can never serve
a real tenant. Fixture and HTTP responses share the same `V1` payload shapes, so
the switch is drop-in once the real endpoints exist.
