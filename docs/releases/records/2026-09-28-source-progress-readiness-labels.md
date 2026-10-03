# 2026-09-28-source-progress-readiness-labels - Honest captured-input status

## Release ID

`2026-09-28-source-progress-readiness-labels`

## Status

`candidate`

## Plain-English Summary

Source stage and approval summaries now distinguish a captured task input from ready required evidence. A completed task badge no longer makes the approval summary claim that the stage is ready to decide while required evidence remains open or no approval is routed.

## Layer Impact

`global-control-lane`, Layer 4 Source presentation and readiness summary only. Layer 3 facts, evidence records, approval policy, and server authorization are unchanged.

## Client Applicability

- All clients: Source New stage and approval views.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Label the stage headline count as captured inputs when required evidence remains open; use a neutral progress bar rather than a green ready signal.
- Include required-evidence readiness in the approval summary and keep its return-to-steps action available when task badges are complete but evidence is not.
- Show routing as unavailable instead of decision-ready when no current-stage approval item exists.
- Preserve the existing ready and file-review labels when all required evidence is usable.

## QA / Validation

- Pass: red-first mounted tests reproduced the false ready headline, missing-evidence approval summary, and unrouted approval summary.
- Pass: deliberately treating any evidence count as ready made the missing-evidence case fail; mutation was restored.
- Pass: Source component suite, 90 suites and 616 tests.
- Pass: Node 24 TypeScript check with an 8 GB heap.
- Not run: signed-in post-deploy readback, pending the official main deployment.

## Rollout Plan

Squash merge the reviewed PR, then allow only `.github/workflows/aca-main-deploy.yml` to deploy the exact main SHA. No migration or data job is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record after workflow completion.
- ACA runtime invariant: Verify digest-pinned web template, healthy 100%-traffic revision, and both delivery jobs.
- Worker image invariant: Both delivery jobs must use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: captured-input headline, blocked approval summary, and viewport-level grey progress status.

## Rollback Plan

Revert the PR through protected main and let the repo-owned workflow deploy the rollback SHA. No schema or data rollback is required.

## Audit Evidence

Local red/green and mutation output, PR checks, official deploy run, Azure digest readback, and signed-in smoke ledger.

## Known Gaps

Captured-input and evidence-ready counts remain distinct by design. This change does not create missing evidence, route an approval item, or advance an event.
