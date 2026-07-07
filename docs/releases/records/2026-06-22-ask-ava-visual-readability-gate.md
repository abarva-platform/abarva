# 2026-06-22-ask-ava-visual-readability-gate — Ask Ava visual/readability live gate

## Release ID

`2026-06-22-ask-ava-visual-readability-gate`

## Status

`candidate`

## Plain-English Summary

Adds a live QA gate for the exact Ask Ava failure mode seen in browser testing: when a user asks for a table or chart, the answer must produce a typed exhibit for the canonical renderer, and the prose must be readable like a consultant answer instead of one dense paragraph.

## Layer Impact

- `global-control-lane`: Updates QA scripts that validate shared Home and Intelligence behavior across tenants. No runtime application code changes.

## Client Applicability

- All clients: Applies to every tenant covered by the signed-in tenant matrix.
- Specific clients: None.
- Internal only: QA/runbook enforcement only.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/qa/home-live-gate.mjs`: makes typed table/chart output and readable prose hard checks for explicit visual prompts.
- `scripts/qa/tenant-matrix-gate.mjs`: adds `readable` and `visual` columns to the all-tenant matrix.

## QA / Validation

- Pass: `node --check scripts/qa/home-live-gate.mjs && node --check scripts/qa/tenant-matrix-gate.mjs`.
- Pass: `npm run release:check`.
- Not-run: live signed-in tenant matrix execution; it requires tenant auth states or cookies in the runner.

## Rollout Plan

Merge to `main`. No app deploy is required for script-only enforcement, but normal ACA deployment may still run through the repo-owned deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: No runtime deploy required for this script-only change.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, by running the tenant matrix with signed-in tenant states.

## Rollback Plan

Revert this PR to restore the previous softer QA behavior.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live matrix output: Pending once tenant auth states are available to the runner.

## Known Gaps

Tower still needs separate typed `AgentAnswer` API convergence before it can be held to the same visual-output parity as Home and Intelligence.
