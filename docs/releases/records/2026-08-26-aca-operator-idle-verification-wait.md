# 2026-08-26-aca-operator-idle-verification-wait — ACA Operator Idle Verification Wait

## Release ID

`2026-08-26-aca-operator-idle-verification-wait`

## Status

`candidate`

## Plain-English Summary

Adds an opt-in bounded wait to the ACA private-operator wrapper's final idle verification. This keeps the default strict cleanup contract, while allowing selected workflows to wait briefly when the only remaining issue is another execution on the same shared operator job still finishing.

## Layer Impact

`client-data-lane` operator tooling only. The change affects how proof-producing ACA jobs verify their restored idle state after a run. It does not change application runtime code, tenant data, schemas, migrations, product projections, or default routes.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None.
- Internal only: ACA operator workflows and release proof lanes.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ops/submit-aca-operator-job.mjs` accepts `--idle-verify-wait-seconds`.
- `.github/workflows/ecl-retired-layer-cleanup.yml` opts into a 300-second idle verification wait for live dry-run and apply executions.
- `scripts/ops/__tests__/submit-aca-operator-job.test.ts` covers the new plan-only field and invalid negative values.

## QA / Validation

Current candidate validation:

- PASS — `npm run ops:aca-job -- --self-test`
- PASS — workflow static assertions for cleanup workflow opt-in flags
- PASS — `git diff --check`
- PASS — targeted wrapper unit tests: 11/11 passing
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through PR. The workflow change becomes available to manually dispatched cleanup runs after the normal repository deployment path picks up `main`. No data-plane mutation is performed by this release record.

## Deployment Authority

- Repo-owned deploy workflow: No web deploy required for the script/workflow change itself.
- Shared runtime mutators: The cleanup workflow still uses the governed ACA private-operator wrapper.
- Approved image digest: Resolved at workflow runtime from the deployed ACA template.
- ACA runtime invariant: Required for later data-plane cleanup runs, not changed by this PR.
- Worker image invariant: Not changed.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR. The wrapper default remains strict even with the option present, so workflows that do not pass the new flag are unaffected.

## Audit Evidence

- PR URL after opening.
- CI and local validation logs for wrapper tests and release check.
- Cleanup workflow artifact from the next dry-run showing `99e-idle-verification-wait-log.json`.

## Known Gaps

The option only waits when the final idle verification problem is another non-terminal execution on the same shared job. Template drift, image drift, command drift, env/secret drift, identity drift, and manual trigger shape drift still fail immediately.
