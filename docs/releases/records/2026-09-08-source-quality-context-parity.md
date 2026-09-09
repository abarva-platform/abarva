# 2026-09-08-source-quality-context-parity - Quality Context Parity

## Release ID

`2026-09-08-source-quality-context-parity`

## Status

`candidate`

## Plain-English Summary

Source drafting and quality review now evaluate the same parsed evidence depth. Equivalent date and quarter formats reconcile deterministically, while approved event intake and parsed incumbent agreements satisfy only their corresponding evidence requirements. Unsupported benchmarks and other genuine gaps remain blocked.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 - Products: Source narrative generation and consulting-grade deterministic review.

## Client Applicability

- All clients: Yes.
- Specific clients: None encoded in the release.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Give quality review the same six parsed fact summaries per evidence file used by drafting.
- Canonicalize equivalent ISO, month-name, quarter, and duration forms before temporal claim comparison.
- Reconcile an approved event trigger from event intake and an incumbent agreement from parsed MSA, SOW, contract, or agreement files.
- Preserve fail-closed handling for unsupported benchmarks and evidence gaps.

## QA / Validation

- Focused Source prompt-registry and quality-review tests: 60 passed.
- ESLint for touched TypeScript files: pass.
- TypeScript no-emit validation: pass with an 8 GiB heap.
- Release policy validation: pass.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Regenerate the controlled Strategy artifact and require both the deterministic and consulting-grade gates to pass before advancing the event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: captured after deployment
- ACA runtime invariant: template image, 100% traffic revision, and required workers must use the approved digest
- Worker image invariant: verify after deployment
- Feature/env flag update path: none
- Live signed-in proof? Yes

## Rollback Plan

Revert the squash commit through a new PR and deploy the revert SHA. No schema or tenant-data rollback is required.

## Audit Evidence

- PR, merge SHA, and ACA deployment run
- Focused Jest, TypeScript, ESLint, and release-check output
- Controlled generation response and signed-in artifact readback

## Known Gaps

- Parsed evidence remains draft evidence until human acceptance. This release aligns generation-time validation; it does not alter evidence authority.
