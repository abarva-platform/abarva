# Source File Inventory Disclosure

## Release ID

`2026-10-12-source-file-inventory-disclosure`

## Status

Candidate. Local tests are not deployment or signed-in acceptance.

## Plain-English Summary

Files & deliverables keeps the current evidence checklist, session upload, use-readiness summary and artifact review queue upfront. The complete multi-stage registered file inventory is available through one native disclosure with an explicit file count. No file, blocker, source reference or operation is removed.

## Release Lane

`global-control-lane`

## Layer Impact

`global-control-lane`: Layer 4 presentation only. Intake, adapters, canonical records, file authority, acceptance, approval and data-plane operations are unchanged.

## Client Applicability

All clients using the existing Source event Files workspace. No flag or tenant-specific load.

## Changes Included

- One existing workspace component and its existing render suite.
- A default-closed registered inventory; the empty-inventory message remains visible.
- No new route, schema, dependency, test file or generated census change.

## Design Authority

`docs/design/source-end-to-end-redesign-brief.md:52` specifies the task checklist with concrete state and owner/source. Line 54 requires evidence-based gates. This slice prioritizes that checklist and its blockers without changing gate semantics, advancing client collaboration and evidence access.

## QA / Validation

- Red-first render assertion failed on the unchanged component.
- Canvas analytics directory: 29 suites, 264 tests passing.
- Default-expanding the inventory fails the new render assertion.
- Removing the inventory file cards fails the new render assertion.
- The assertion also pins both registered stage files, the full count, the visible empty state, and checklist/upload/readiness/review controls outside the disclosure.
- The existing directory is run by the AI surface control catalog workflow. No new suite can be left outside CI.
- Scoped lint and TypeScript (8 GiB heap) pass; all 11 release checks pass. Exact-head CI and signed-in visual proof remain required before acceptance.

## Rollout Plan

Review the exact candidate, squash merge through a PR, and deploy only through `.github/workflows/aca-main-deploy.yml`. Verify the digest-pinned web template, healthy single 100%-traffic revision, both required worker images and health. Open Files signed in, verify the inventory starts closed and opens to the complete count, and confirm current blockers and upload actions remain outside it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that main workflow only.
- Approved image digest: resolve from the successful main workflow.
- ACA runtime invariant: template and healthy 100%-traffic revision match the approved digest.
- Worker image invariant: both required delivery workers match the digest.
- Feature/env flag update path: none.
- Live signed-in proof required: closed/open inventory, retained file count, visible gate blockers and page layout.

## Rollback Plan

Revert through a reviewed PR and the main ACA workflow. There is no data mutation to undo.

## Audit Evidence

Exact PR, review, CI, deployment and signed-in observations are recorded separately as they occur. Local tests do not certify file content, source-system integration, financial amounts or workflow readiness.

## Known Gaps

This slice does not improve draft quality, supply missing evidence, accept an artifact, issue an RFP, establish received-response completeness, or enable evaluator scoring.
