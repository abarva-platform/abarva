# 2026-09-16 Source New Event Workspace

## Release ID

`2026-09-16-source-new-event-workspace`

## Status

`candidate`

## Plain-English Summary

After creating a competitive sourcing event, an operator sees the recorded request, its current phase, one next action, and event files by workflow phase. Contract optimization keeps its existing approval path. The existing approval and stage pages still perform the governed decisions. The new page does not mark an item complete based on text entry or a file upload alone.

## Layer Impact

- `global-control-lane`, Layer 4 products: adds an event-scoped Source New workspace and changes the normal post-creation destination. It reads existing event and artifact records only.
- Layers 1-3: no intake schema, adapter, canonical record, migration, or data load change.

## Client Applicability

- All clients: the route and normal post-creation destination are shared.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Event-scoped `/source/new/[eventId]` route and Source New workspace.
- Phase-based file browser over authorized, existing artifact records.
- Pure step-readiness contract for future workflow integration; no readiness result is asserted from unavailable authority fields.
- Normal competitive-event creation lands in the workspace; contract optimization and the guided tour retain their existing approval paths.
- Existing Source entry links use framework navigation so the new dynamic route does not trip route-aware linting.

## QA / Validation

- PASS: focused behavior tests cover next-action uniqueness, missing-fact display, later-stage status, file filtering and version history, navigation, and readiness gates.
- PASS: TypeScript and scoped ESLint.
- PASS: repository-wide ESLint with 0 errors; pre-existing warnings remain.
- PASS: isolated desktop and mobile visual harness checks layout and overflow; it is not signed-in product proof.
- NOT RUN: signed-in deployed workflow proof, pending merge and deploy.

## Rollout Plan

Squash-merge through a PR. The repo-owned ACA main deploy workflow builds and deploys the exact main SHA. No migration or data job is required. Verify the signed-in competitive-event post-creation route, contract-optimization routing, and approval handoff after deployment before calling the slice live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow at deploy time.
- ACA runtime invariant: verify template, traffic revision, and required worker digests after deploy.
- Worker image invariant: no worker changes in this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for event creation, authorized reads, and approval handoff.

## Rollback Plan

Revert the PR, then deploy the revert through the same main workflow. Existing approval and stage routes are unchanged; direct links to the workspace may then return 404. No data rollback is needed.

## Audit Evidence

PR, focused test output, TypeScript and ESLint output, release check, local visual captures, ACA deploy run and image digest, and signed-in post-deploy proof.

## Known Gaps

Supplier selection, NDA, RFI actions, and version-bound approval controls still live in existing Source routes; the new workspace is not a replacement for them. A separate UI and data-model pass is required before those phases can show verified completion and local next actions.
