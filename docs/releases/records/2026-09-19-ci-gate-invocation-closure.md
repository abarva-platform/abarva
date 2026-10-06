# 2026-09-19-ci-gate-invocation-closure — Gate invocation follows exact commands and composite chains

## Release ID

`2026-09-19-ci-gate-invocation-closure`

## Status

`candidate`

## Plain-English Summary

The CI gate registry checks whether every script classified as a pull-request gate is actually run
by a workflow. Two limits could make that answer wrong. A workflow mentioning an entry file counted
every package script that shared the file, even when flags selected different modes. Composite
scripts were followed for only one hop, so a real gate behind a longer chain looked unwired.

The checker now recognizes exact package-script command bodies and computes one transitive closure
from the scripts workflows actually run. Sibling modes no longer vouch for one another, nested
composites resolve to a fixed point, and cycles terminate without inventing reachability. Stale
hard-coded script counts were also removed from the file header; the checker remains the authority
for current counts.

## Layer Impact

Release lane: `global-control-lane`.

- **Release control:** CI gate-registry invocation proof and its behavioral tests.
- **Product, canonical model, adapters, and client intake:** unchanged.

## Client Applicability

- All clients: no direct product change.
- Internal engineering: yes — the repository-wide release-control checker receives the change.
- Specific clients: none.
- No client data, runtime authorization, product copy, or feature behavior changes.

## Changes Included

- Match direct workflow commands against the full package-script body, including mode flags.
- Follow nested npm-script composites to a fixed point with cycle protection.
- Add behavior cases for sibling modes, two-hop composites, and composite cycles.
- Remove stale hard-coded script and workflow counts from explanatory prose.

## QA / Validation

- Failing first: the sibling-mode case passed incorrectly and the two-hop composite case failed.
- Focused behavior suite: 11 tests pass after the repair.
- The first correct implementation exposed a 32-second real-repository test path; the final
  breadth-first closure runs the same suite in approximately 0.5 seconds.
- Full behavior suite: 31 suites / 308 tests pass after rebasing onto current main.
- `npm run typecheck`, scoped ESLint, direct gate-registry execution, and release control pass.

## Rollout Plan

Merge through the protected PR lane. The repo-owned ACA main workflow runs after merge. No schema,
migration, data build, feature flag, or manual runtime command is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutation outside that workflow: none.
- Live signed-in proof required: no. This is a repository verification control, not a rendered or
  data-backed product path.

## Rollback Plan

Revert the merge commit. No persisted product or client state changes.

## Audit Evidence

The PR, focused and full behavior output, failing-first output, release gate output, and post-merge
ACA digest readback.

## Known Gaps

- The registry still classifies script intent manually; this change proves invocation, not whether
  a script was assigned the right kind.
- Operator-only baseline writers remain a separate classification batch.
