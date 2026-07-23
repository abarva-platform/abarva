# 2026-07-23 Moves Operating Model Authoring Headroom

## Release ID

`2026-07-23-moves-operating-model-authoring-headroom`

## Status

`candidate`

## Plain-English Summary

The P3 Operating Model keeps its 2,400-4,600-word hard quality gate, while its
eight section-level authoring budgets now total about 4,100 words. This leaves
room for normal model variance and required exhibits without weakening the
client-facing length limit or encouraging filler.

## Layer Impact

- `global-control-lane`: shared Moves Operating Model prompt structure only.
- No evidence, gate, tenant-data, phase-state, approved-option, architecture
  decision, or quality-validator changes.

## Client Applicability

- All clients: yes, for P3 Operating Model generation.
- Feature flag: none.

## Changes Included

- Tighten the eight Operating Model section instructions from a combined 4,500
  words to a combined 4,100 words.
- Preserve the existing 2,400-word minimum and 4,600-word hard export ceiling.
- Add a regression test for the authoring budgets.

## QA / Validation

- Live finding: v12 produced the correct eight-section Operating Model at 4,683
  words and was correctly blocked 83 words above the 4,600-word ceiling.
- Pending: focused tests, lint, typecheck, release check, and post-deploy v13
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

- v12 proof:
  `moves-p3-architecture-live-proof-v12-2026-07-23T12-20-32Z`.
- PR, deployment invariant, and post-fix proof: pending.

## Known Gaps

- Full P3 architecture-chain proof remains open until the post-deploy retry
  passes all four artifacts.
