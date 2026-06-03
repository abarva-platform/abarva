# 2026-06-03-parser-fallback-runtime — Parser Fallback Runtime Orchestrator

## Release ID

`2026-06-03-parser-fallback-runtime`

## Status

`candidate`

## Plain-English Summary

This change adds the runtime enforcement layer for parser fallback routing. If
Azure Document Intelligence or the primary parser fails, the app now has a
tested orchestration contract that invokes the private Marker path for
sensitive or unapproved documents, invokes LlamaParse only for non-sensitive
documents with explicit customer third-party processing consent, records ledger
events, and keeps all fallback output out of committed corpus/search/graph
state until human review.

## Layer Impact

- `client-data-lane`: Adds ingestion-runtime policy enforcement for
  client-scoped document parsing. It does not add a database migration, external
  parser credentials, or live Azure wiring.

## Client Applicability

- All clients: Applies as the default ingestion fallback contract once the
  runtime caller wires these adapters into the client data plane.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None in this slice.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/2959.
- Commit: final merge commit pending.
- Runtime contract:
  `src/lib/ingestion/parser-fallback-runtime.ts`.
- Regression tests:
  `src/lib/ingestion/__tests__/parser-fallback-runtime.test.ts`.
- Architecture/runbook update:
  `docs/architecture/azure/PARSER_FALLBACK_DECISION_TREE.md`.

## QA / Validation

- Passed locally:
  `npx jest src/lib/ingestion/__tests__/parser-fallback-policy.test.ts src/lib/ingestion/__tests__/parser-fallback-runtime.test.ts --runInBand`.
- Passed locally:
  `npx eslint src/lib/ingestion/parser-fallback-policy.ts src/lib/ingestion/parser-fallback-runtime.ts src/lib/ingestion/__tests__/parser-fallback-policy.test.ts src/lib/ingestion/__tests__/parser-fallback-runtime.test.ts`.
- Passed locally:
  `npx tsc --noEmit --pretty false`.
- Passed locally:
  `npm run release:check -- --base origin/main --head HEAD`.
- Passed locally:
  `git diff --check origin/main...HEAD`.

## Rollout Plan

Merge through the protected GitHub PR flow. This slice makes the runtime
orchestrator available to ingestion callers; live parser execution still
requires adapter wiring, secrets, and data-plane deployment.

## Rollback Plan

Revert the PR. Since this slice adds no migration and no external service
provisioning, rollback removes the orchestrator and tests without data
rollback.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2959.
- Local QA output: focused Jest, ESLint, TypeScript, release control, and diff
  whitespace checks passed before PR.
- CI checks: Pending.

## Known Gaps

- Real Marker deployment is not provisioned in this slice.
- Real LlamaParse credentials and live third-party invocation are not
  provisioned in this slice.
- Production ledger persistence depends on the ingestion caller wiring this
  contract into the data-plane event ledger.
