# 2026-10-01-moves-review-packet-grounding — Ground review summaries in explicit metadata

## Release ID

`2026-10-01-moves-review-packet-grounding`

## Status

`candidate`

## Plain-English Summary

P2 artifact-review summaries no longer infer facts, risks, or evidence from document-body keyword matches. The packet uses only explicitly supplied artifact review metadata and generic gate guidance. When quantified facts or strongest-evidence items are absent, the review panel says so instead of presenting an empty section.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4, Moves: changes the P2 artifact-review packet and its presentation. It does not alter phase gates, artifact approvals, tenant data, or generated deliverables.
- No canonical model, source adapter, or database schema changes.

## Client Applicability

- All clients: applies to the shared Moves P2 artifact-review experience.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- P2 review packet now reads explicit facts, evidence, limitations, missing inputs, diagnostic thesis, and P3 implication from artifact metadata; it uses generic language when optional review metadata is absent.
- Review-decision route no longer downloads or parses artifact bodies to build the packet.
- File Cabinet review UI explicitly labels absent quantified facts and strongest-evidence items.
- Added packet, route, and UI regression coverage.

## QA / Validation

- Focused Jest suites: 3 suites, 11 tests passed.
- ESLint on all changed TypeScript/TSX files: passed.
- `npm run typecheck`: passed.
- Release check, CI, deployment, ACA runtime invariant, and live signed-in proof: pending.

## Rollout Plan

Merge through the protected PR process. Deploy only through the repository-owned ACA main deploy workflow. Confirm the exact merge SHA's workflow run, digest-pinned web and worker images, 100% traffic revision, and signed-in artifact-review behavior before marking this release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending exact-SHA deployment.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, for P2 artifact review.

## Rollback Plan

Revert the merged change in a follow-up PR and deploy that revert through the repo-owned ACA main deploy workflow. Until then, the prior image remains the rollback target; no data migration or state backfill is involved.

## Audit Evidence

- PR and CI checks: pending.
- Focused tests and local validation are recorded in the PR.
- Exact-SHA deploy run, ACA digest invariant, and signed-in proof: pending.

## Known Gaps

Existing artifact producers do not yet populate every optional structured review-metadata field. Missing values therefore remain visibly absent; no attempt is made to infer them from artifact prose.
