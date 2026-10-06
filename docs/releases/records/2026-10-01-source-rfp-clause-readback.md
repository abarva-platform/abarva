# 2026-10-01 Source RFP clause readback

## Release ID

`2026-10-01-source-rfp-clause-readback`

## Status

`candidate`

## Plain-English Summary

An RFP clause checklist now remains visible as reviewed after reload when every required value lever has a persisted yes/no decision, including an explicit "not included" decision. A partial checklist does not count as complete. Checklist review alone never creates a monetary value estimate or grants release approval.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema or stored fact change. The reader uses tenant- and event-scoped non-stale fact rows and preserves the newest decision per lever.
- Layer 4 Source: the RFP projection, evidence task state, and insight distinguish a complete checklist from an incomplete one without changing approval authority.

## Client Applicability

- All clients: Source RFP analytics where the governed archetype and checklist facts are available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source analytics exposure; no new flag.

## Changes Included

- Per-lever reader returns assessed and included keys separately; invalid newest decisions do not inherit older values.
- RFP route requires valid 0/1 decisions for every required archetype lever before treating the checklist as complete.
- Evidence hydration marks the checklist task complete only for a persisted complete assessment.
- RFP stage view can show fact-backed checklist coverage without a computed value waterfall.

## QA / Validation

- Red-first reader, hydration, route, and stage-view tests reproduced missing completeness/readback behavior.
- Deliberately weakening all-levers coverage to any-lever caused the partial-checklist route test to fail; the guard was restored.
- Seven adjacent Jest suites: 114 passed.
- Targeted ESLint passed. `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed; default 4 GB heap hit process OOM before diagnostics.
- Signed-in readback and official runtime proof remain required after deployment.

## Rollout Plan

Squash merge through the repository PR, then allow only the repo-owned ACA main deploy workflow to update the shared runtime. No migration, data build, feature flag, or traffic command is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` on main.
- Shared runtime mutators: workflow only.
- Approved image digest: capture from successful main workflow.
- ACA runtime invariant: verify digest-pinned web template and sole 100% healthy revision.
- Worker image invariant: verify required workers match the approved digest after the workflow settles.
- Feature/env flag update path: none.
- Live signed-in proof required: reload the same RFP stage and verify persisted checklist count, live fact provenance, and still-closed release gate.

## Rollback Plan

Revert the merge by PR and use the repo-owned main deploy workflow. Persisted checklist facts remain intact. No schema rollback applies.

## Audit Evidence

PR, CI, workflow run, immutable runtime digest, and private signed-in smoke ledger entry to be linked after execution.

## Known Gaps

This readback change does not create or approve an external RFP package, substitute legal approval, or authorize supplier delivery. Those controls remain separate.
