# Historical approval evidence isolation

## Release ID

`2026-09-22-source-historical-approval-evidence-isolation`

## Status

`candidate`

## Plain-English Summary

Source no longer uses metadata from a currently routed approval action as proof
that an older recorded approval carried the same version binding or reviewer
role. Recorded approvals remain recorded, but missing historical audit metadata
is shown as an open gap on both current and previously visited stages.

## Layer Impact

- `global-control-lane`
- Layer 4 product projection: Source approval-decision and event-shell read models.
- No canonical data, source adapter, schema, migration, or writer changes.

## Client Applicability

- All clients: Yes, on Source event approval workspaces.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Separate routed-action metadata from historical approval evidence.
- Build a fail-closed audit decision when a recorded off-stage approval is viewed.
- Preserve routed metadata and action behavior for legitimate pending decisions.
- Add stage-generic behavioral coverage across early, response, and value stages.

## QA / Validation

- PASS: focused approval-decision and event-shell suites, 42 tests.
- PASS: mounted approval surface plus focused model suites, 59 tests.
- PASS: full Source canvas suite under Node 24, 48 suites and 232 tests.
- PASS: full Source behavior suite under Node 24, 108 suites and 958 tests.
- PASS: red-first case for a recorded approval plus a fully bound routed action.
- PASS: mutation restoring routed metadata as historical evidence failed two suites.
- PASS: mutation removing off-stage recorded decisions failed the event-shell suite.
- PASS: Node 24 TypeScript, scoped ESLint, and release-control check.
- PENDING: hosted CI, ACA runtime proof, and signed-in replay.

## Rollout Plan

Squash-merge after all applicable checks pass. Deploy only through the
repository-owned ACA main workflow, prove the immutable runtime digest, and
then replay the signed-in approval views without claiming that merge or runtime
proof is product acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repository-owned workflow only.
- Approved image digest: Pending merge and deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash commit and redeploy through the repository-owned ACA main
workflow. No data or migration rollback is required.

## Audit Evidence

- Focused Jest output and mutation failures recorded during implementation.
- Pull request and hosted checks after opening.
- Repo-owned ACA deployment and runtime-invariant artifact after merge.
- Signed-in current-stage and off-stage approval replay after deployment.

## Known Gaps

- The approval artifact queue and the Files evidence-readiness projection use
  different readiness inputs. Their reconciliation is a separate correction.
- Mounted downstream decision or handoff blockers are not yet aggregated into
  the top-level Work readiness summary; that remains separate from historical
  approval metadata.
