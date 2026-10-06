# 2026-09-18-source-new-triage-readiness - Source New Request Triage Readiness

## Release ID

`2026-09-18-source-new-triage-readiness`

## Status

`candidate`

## Plain-English Summary

Source New now places intake records awaiting review in a request-triage queue. Each request answers four questions from existing recorded fields: what was requested, what is missing, who must act next, and whether the request is ready to enter Define. Each row has one navigation action into the existing review workspace.

This is a read-only presentation slice. It does not create or update requests, approve or advance a lifecycle stage, change schema, run a migration, write tenant data, or send email or other external communication.

## Layer Impact

`global-control-lane`: Layer 4 Source presentation and its existing Source event read projection. The summary mapper now retains the already-persisted request description and intake summary so the request-first page can assess the five facts already used by intake: request description, decision owner, scope boundary, value target, and baseline owner.

No Layer 1 intake format, Layer 2 adapter, Layer 3 canonical model, schema, migration, data-plane writer, or communication behavior changes.

## Client Applicability

- All clients: Yes, for authorized Source New users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/source/new` separates lifecycle rows awaiting intake review from active event workspaces.
- The request queue derives readiness only from existing Source event fields and fails closed when required facts are absent.
- The page-level next action follows the real queue state: start a request,
  review pending requests, open accepted work, or resolve request access.
- Pending requests show one action: complete missing facts or review the
  recorded request for Define. Facts-only readiness is labelled "Ready for
  Define review" and does not claim stage approval or advancement.
- Behavior coverage proves ready, incomplete, tenant-hidden, empty, loading, unavailable, and active-workspace separation states.

## QA / Validation

- `pass` - Focused behavior tests: `npx jest --runInBand --runTestsByPath 'src/components/source/new-workspace/SourceNewRequestFirstPage.test.tsx' 'src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts' 'src/lib/source/__tests__/source-event-row-mapping.test.ts' 'src/lib/source/new-workspace/request-triage.test.ts'` (20 tests).
- `pass` - Source behavior suite: `npm run test:behaviors` (25 suites, 265 tests).
- `pass` - Scoped ESLint on changed TypeScript files (no warnings or errors).
- `pass` - Full source ESLint: `npx eslint src/` (zero errors; 248 existing warnings).
- `pass` - TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- `pass` - Release policy: `npm run release:check`.
- `not-run` - Signed-in browser proof; this change is not merged or deployed.

## Rollout Plan

Open a protected pull request after local validation. If separately approved and merged, the repository-owned ACA main deploy workflow may build and deploy the exact main SHA. No manual runtime change, migration, data job, tenant-data operation, or communication task is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after a separately approved merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Not applicable before merge and workflow build.
- ACA runtime invariant: Required after any later deployment; not run here.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after a later deployment, before any live-proven claim.

## Rollback Plan

Revert the pull request through a new protected pull request. The previous request-first empty state and event-workspace list return without data rollback because this release has no schema or data mutation.

## Audit Evidence

Inspect the pull request diff, focused behavior-test output, lint and TypeScript output, release-check output, and the later deployment and signed-in proof only if this candidate is separately approved for merge and release.

## Known Gaps

- The queue reads pending intake from the existing Source event lifecycle; it does not introduce a separate request ledger.
- Readiness is limited to the five facts already captured by Source intake. It does not claim approval, stage completion, or evidence acceptance.
- Merge, deployment, runtime readback, and signed-in proof are outside this task.
