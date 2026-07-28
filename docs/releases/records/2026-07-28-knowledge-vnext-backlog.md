# 2026-07-28-knowledge-vnext-backlog — Knowledge vNext backlog: audited aVa, metric parity, gates

## Release ID

`2026-07-28-knowledge-vnext-backlog`

## Status

`candidate`

## Plain-English Summary

Advances the Knowledge vNext backend backlog on the code side. aVa now runs
through the repository's audited Anthropic egress path (tenant-policy gated,
usage-capped, audit-logged), with the deterministic provider kept strictly as
the unavailable/test fallback and a visible-answer-contract guard before display.
Adds a Cube↔Postgres metric-parity script (SQL-vs-SQL, no Cube.dev server) that
fills the previously-empty reconciliation-ledger cube slots, aligns the 8-gate
activation checklist to the real merged schema, and records a worker/web
build-split assessment. Nothing is activated; no data-plane write occurs from
this change (both scripts are DRY-RUN by default and apply-ack + governed-host
gated).

## Layer Impact

Release lanes: **`experimental`** (feature-flagged, default-off) and
**`internal-admin`** (serves the admin-only preview shell). Not
`global-control-lane`, not `client-data-lane`, not `public-demo`.

- **Products (layer 4):** `/api/knowledge/ava` reasoning path (auth-gated).
- **Canonical/consumption (layer 3):** read-only; the parity script writes only
  `consumption.consumer_reconciliation_ledger` and only when explicitly run.
- No schema/migration/publication/loader/Azure change here.

## Client Applicability

- All clients: none.
- Internal only: aVa route is auth-gated; the shell flag `home_knowledge_vnext`
  stays OFF; aVa falls back to deterministic when `ANTHROPIC_API_KEY` is absent.
- Feature flag: `home_knowledge_vnext` (unchanged, default OFF).

## Changes Included

- `src/lib/knowledge/consumption-server/ava-egress-provider.ts` +
  `src/app/api/knowledge/ava/route.ts` — audited aVa through
  `@/lib/integrations/ai-egress` (`callModel` + `createAnthropicDirectTextAdapter`
  + `createSupabaseAiEgressAuditSink` + `loadTenantAiPolicyRecord`), deterministic
  fallback only when unavailable, `assertVisibleAnswerContract` → 422 on failure.
- `scripts/knowledge/consumption-metric-parity.ts` — Cube↔Postgres parity;
  fills `consumer_reconciliation_ledger.cube_hash/cube_count`; DRY-RUN default,
  `--apply` requires `METRIC_PARITY_APPLY_ACK` + governed lab host.
- `scripts/knowledge/consumption-activation-gates.mjs` — aligned to the real
  phase3c2e schema (`publication.knowledge_baseline.is_active`,
  `publication.projection_version.build_state`,
  `consumer_reconciliation_ledger.reconciliation_state`,
  `publication.publication_activation.previous_knowledge_baseline_ref`).
- `docs/knowledge-vnext/BUILD_ACCELERATION_ASSESSMENT.md` — knowledge-worker
  split assessment (recommendation: not for build speed; standalone output first).

## QA / Validation

- Typecheck clean; ESLint 0 problems.
- Tests: consumption-server (15) incl. aVa provider availability + refuse-without-
  evidence; existing suites green.
- Parity + gate scripts DRY-RUN verified (no DB writes without apply-ack).

## Rollout Plan

Squash-merge to `main`; the aVa route deploys via `aca-main-deploy.yml` but stays
dormant (auth-gated, flag OFF, falls back to deterministic without a key). The
parity/gate scripts run only as governed ACA job stages during activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected by code; proven after any deploy.
- Feature/env flag update path: `home_knowledge_vnext` stays OFF.
- Live signed-in proof required: before any tenant flag flip (8-gate checklist).

## Rollback Plan

Revert the PR; the aVa provider/route and the two scripts have no other importers
and perform no data-plane write by this change.

## Audit Evidence

- This record + `docs/knowledge-vnext/BUILD_ACCELERATION_ASSESSMENT.md`.
- Tests `src/lib/knowledge/consumption-server/**/__tests__/*`.

## Known Gaps

- aVa content-grounding depth: the provider passes evidence refs + governed
  instructions; resolving refs → full content via the broker is the next
  refinement (the audited egress path itself is wired).
- Metric parity + gates + projection build must be RUN (Bucket B) as governed ACA
  jobs against the private airline lab; the airline lab jobs are `plan_only_ready`
  and must be deployed first.
- Human approval of review batches (step D) is the one remaining non-code gate.
