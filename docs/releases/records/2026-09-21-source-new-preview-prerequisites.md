# 2026-09-21 — Source New Preview Prerequisites

## Release ID

`2026-09-21-source-new-preview-prerequisites`

## Status

`candidate`

## Plain-English Summary

When a user previews a later Source New phase, the workspace now names the
specific prerequisites that remain instead of only saying that earlier gates
must be cleared. Previewing stays read-only: it does not advance the event,
approve work, or expose a forward action.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: Source New presentation only. No canonical records,
  adapters, workflow state, approvals, or tenant data change.

## Client Applicability

- All clients: Yes, wherever the Source New event workspace is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source New availability controls apply.

## Changes Included

- Add explicit preview prerequisites for Request, Define, Suppliers and NDA,
  and Market package phases.
- Preserve the existing Current work return action as the only action available
  while previewing a phase that is not open.
- Add a rendered behavior test proving later-phase navigation does not expose an
  approve, continue, or advance action.

The rendered phase contract is:

| Phase | Current action | Preview prerequisite | Completion evidence | Preview action |
| --- | --- | --- | --- | --- |
| Request | Review intake | Request recorded and accepted for review | Request facts or request-phase file | Current work |
| Define | Open scope and strategy | Intake approval recorded | Scope, decision owner, or define-phase file | Current work |
| Suppliers and NDA | Review supplier and NDA readiness | Scope and strategy advanced; eligibility and required NDA coverage recorded | Supplier authority, NDA coverage, or supplier-phase file | Current work |
| Market package | Open the governed package | Scope, eligibility, and required NDA coverage ready | Market-package file and accepted motion where required | Current work |

No phase without an unmet condition was found in the preview state. A phase is
either current, recorded, missing a record, or not open; this change only
clarifies the last state.

## QA / Validation

- Current-main negative control failed because the preview showed only the
  generic earlier-gates message.
- Focused rendered component suite passes: 40 tests.
- Mutation check removes the prerequisite text and must fail the rendered
  regression.
- Full behavior, TypeScript, focused lint, release, and diff checks are required
  before merge.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow builds and
deploys the exact merge SHA. No migration, data job, feature flag, or tenant
write is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned workflow only.
- Approved image digest: Recorded by the deployment proof after merge.
- ACA runtime invariant: Template image, active 100% traffic revision, and
  approved digest must match.
- Worker image invariant: Required workers must match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, as a separate acceptance step.

## Rollback Plan

Revert the merge through a pull request and allow the repo-owned ACA workflow to
deploy the revert. No data rollback is required.

## Audit Evidence

- Pull request and CI results after publication.
- The focused rendered component test.
- Repo-owned deployment artifact and runtime-invariant proof after merge.
- Separate signed-in acceptance for the deployed workspace.

## Known Gaps

- This change does not persist completion, approve a phase, or change workflow
  state.
- Signed-in visual acceptance remains separate from automated proof.
