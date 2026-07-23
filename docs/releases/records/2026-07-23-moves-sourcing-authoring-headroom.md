# 2026-07-23 Moves Sourcing Authoring Headroom

## Release ID

`2026-07-23-moves-sourcing-authoring-headroom`

## Status

`candidate`

## Plain-English Summary

The P3 Sourcing Strategy keeps its 1,800-3,600-word hard quality gate, while
its seven section-level authoring budgets now total about 3,150 words. This
leaves room for normal model variance and the required options matrix without
weakening the client-facing length limit.

## Layer Impact

- `global-control-lane`: shared Moves Sourcing Strategy prompt structure only.
- No evidence, gate, tenant-data, phase-state, approved-option, architecture
  decision, or quality-validator changes.

## Client Applicability

- All clients: yes, for P3 Sourcing Strategy generation.
- Feature flag: none.

## Changes Included

- Tighten the seven Sourcing Strategy section instructions from a combined
  3,600 words to a combined 3,150 words.
- Preserve the existing 1,800-word minimum and 3,600-word hard export ceiling.
- Add regression coverage for the section-level budgets.

## QA / Validation

- Live finding: v13 produced the correct seven-section Sourcing Strategy at
  3,624 words and was correctly blocked 24 words above the 3,600-word ceiling.
- Pending: focused tests, lint, typecheck, release check, and post-deploy v14
  architecture-chain proof.

## Rollout Plan

Merge through a PR and deploy through the repo-owned ACA main workflow. Verify
the web and both workers use the same digest, then run a new immutable P3
architecture-chain proof without approving the P3 gate or advancing P4.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: workflow only.
- Approved image digest: pending.
- ACA runtime invariant: pending.
- Worker image invariant: pending.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and redeploy the prior approved digest. Existing generated and
blocked runs remain immutable audit history; no schema or phase-state rollback
is required.

## Audit Evidence

- v13 proof:
  `moves-p3-architecture-live-proof-v13-2026-07-23T13-00-07Z`.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3 architecture-chain proof remains open until the post-deploy retry
  passes all four artifacts.
