# Enterprise Semantic Question Layer Runtime Proof

Generated: 2026-06-24

## Progress

Status: 100% complete for local runtime wiring and VNet data-plane read proof.

## What changed

- Added a shared Azure/Postgres-backed semantic answer runtime:
  - `src/lib/enterprise-context/semantic-answer-runtime.ts`
- Added a platform API route for structured semantic answers:
  - `src/app/api/enterprise-semantic/ask/route.ts`
- Wired the existing Intelligence ask route to use the semantic layer for dataset, volumetric, readiness, operational evidence, process intelligence, friction, bottleneck, automation, value, and rate-card questions:
  - `src/app/api/intelligence/ask/route.ts`

## Runtime behavior

For matched semantic questions, the Intelligence/aVa stream now answers from:

- `tenant_data_volumetrics`
- `tenant_dimension_coverage`
- `tenant_question_readiness`

The streamed answer includes:

- direct answer
- deterministic basis
- readiness label
- confidence
- facts
- citations
- caveats
- client-to-complete actions

Normal strategy questions continue through the existing Intelligence/Sentinel flow.

## Live VNet proof

Execution: `job-abarva-private-operator-eus-kpby9nw`

Result: succeeded.

Operator job restore: confirmed restored to `/bin/true`.

Proof file:

- `vnet-semantic-read-probe-compact-proof.json`

Global live counts from Azure/Postgres:

- `semantic_dimensions`: 30
- `tenant_data_volumetrics`: 131
- `tenant_dimension_coverage`: 113
- `tenant_question_readiness`: 55

Tenant summaries:

| Tenant | Semantic records | Dimensions | Source tables | Inventory readiness | Process readiness | Business case readiness |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `morganstreet` | 14,127 | 13 | 14 | answerable | answerable | partially_answerable |
| `lakeshore` | 18,196 | 6 | 6 | answerable | not_answerable | not_answerable |
| `meridian-health` | 21,373 | 17 | 21 | answerable | not_answerable | partially_answerable |

## Gates run

- Focused ESLint: passed.
- Focused Jest: passed, 3 suites / 6 tests.
- Full TypeScript: passed.
- `npm run release:check`: passed.
- VNet Azure/Postgres semantic read proof: passed.

## Known boundary

- `npm run audit:control-plane-purity:check` failed because the broader dirty worktree is already above baseline for tenant strings. The semantic runtime/route changes are shared and do not add tenant-specific runtime branching.
- The new route and Intelligence semantic fast path are local code plus VNet data-plane proof. They have not been deployed to `app.abarva.ai` in this step, so browser-visible production proof is not claimed here.
- Direct laptop-to-Azure DB read failed with private DNS `ENOTFOUND`, so live data proof used the approved ACA/VNet operator job lane.

## Files

- API route proof: `src/app/api/enterprise-semantic/ask/route.ts`
- Intelligence/aVa fast path: `src/app/api/intelligence/ask/route.ts`
- Runtime service: `src/lib/enterprise-context/semantic-answer-runtime.ts`
- VNet proof payload: `vnet-semantic-read-probe-compact-proof.json`
- VNet proof log: `vnet-semantic-read-probe-compact-success.log`
- Failed first proof log, retained for honesty: `vnet-semantic-read-probe-failed.log`
