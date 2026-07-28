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

## Open decision (created by the discovery)

The serving layer (API routes + provider switch) reads the phase3c2e
`consumption.*_v1` schema, which is not yet on `main`. Building it now against an
unmerged schema risks drift. The pending agent confirms (a) whether a projection
BUILD job exists on phase3c2e or is the remaining gap, and (b) the merge/PR
status of phase3c2e. That answer decides: build the serving layer now against the
documented phase3c2e columns, or converge onto that branch first.

## Reconciliation with the fixture layer
The fixture provider stays (contract tests, visual regression, partial/stale/
conflicting/outage scenarios). The activation guard guarantees it can never serve
a real tenant. Fixture and HTTP responses share the same `V1` payload shapes, so
the switch is drop-in once the real endpoints exist.
