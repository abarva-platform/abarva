# 2026-09-29 Source Strategy criterion review

## Release ID

`2026-09-29-source-strategy-criterion-review`

## Status

`candidate`

## Plain-English Summary

An accepted Request now leads to a usable Strategy gate: authorized reviewers can record each required criterion with an audit rationale, and the stage approval action appears only when the persisted criteria and their evidence are ready. Missing linked files remain visible as work to complete. This does not waive, auto-approve, or advance a stage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Source: reads existing event-scoped criterion and artifact states, displays review controls, and calls the existing guarded criterion action.
- Layer 3: no new fact owner, schema, or loader. The existing artifact-state metadata write clears a quality receipt that belongs to superseded bytes; audited workflow repositories remain authoritative for decisions.

## Client Applicability

- All clients: the Strategy approval view can show the criterion checklist on active events.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. Event approval policies remain unchanged.

## Changes Included

- Event detail route reads persisted gate-criterion state alongside existing stage artifact state.
- Active Strategy stage approval is armed after separate Request acceptance for an authorized reviewer.
- Approval workspace records one criterion at a time through the existing authenticated action; the main Strategy approval remains unavailable while the stage gate is not ready.
- Files exposes existing governed draft generation for a missing catalog artifact only while its stage is the active stage, so a hard-linked but supporting catalog item can be prepared for review.
- An already accepted Client Final can be revised from its active-stage Files row through the existing superseding upload action; past-stage rows remain read-only in that view.
- Accepting new Client Final bytes clears the prior draft/final quality receipt; the new version must be reviewed on its own merits.
- Focused route and mounted workflow tests.

## QA / Validation

- Pass: red-first tests reproduced both the missing active gate action and the absent criterion controls.
- Pass: deletion mutation of the readiness check exposed a premature green approval button and failed the focused test; restored afterward.
- Pass: wrong-method mutation of the criterion write failed the mounted API test; restored afterward.
- Pass: focused route, decision, and mounted workflow tests (68/68), plus analytics canvas and Client Final route regression (245/245) including current-versus-past-stage generation and final revision tests.
- Pass: repository TypeScript check and scoped ESLint for every changed source and test file.
- Pass: the UI reports open criteria as readiness blockers, not as missing reviewer authority.
- Pass: a red-first route test caught a stale quality receipt on changed Client Final bytes; clearing it passes the route suite (9/9).
- Not run: complete Source regression, PR CI/review, runtime and signed-in replay at record creation.

## Rollout Plan

Squash merge after applicable CI/review. Only the repo-owned ACA main workflow builds and deploys the merged SHA. No migration or manual data job is required. Reopen the same event and verify the criterion records and stage exit using the signed-in product path.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: that workflow only.
- Approved image digest: pending official build.
- ACA runtime invariant: web template and 100%-traffic revision must match the approved digest.
- Worker image invariant: required workers must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; exact Strategy criterion and approval replay.

## Rollback Plan

Revert the squash commit through a reviewed PR and allow the repo-owned main workflow to deploy the rollback. Existing criterion decisions remain auditable and are not deleted.

## Audit Evidence

Focused local Jest output and mutation checks; PR/CI and official deployment evidence to be added after execution. Private synthetic journey ledger is held outside this public repository.

## Known Gaps

The archetype decision artifact is cataloged as recommended, but the Strategy gate criterion requires it; this release exposes its governed preparation path without changing the catalog. Signed-in stage exit and downstream lifecycle acceptance remain unproven until replay.
