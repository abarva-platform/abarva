# Source Client Final upstream authority

## Release ID

`2026-09-30-source-client-final-upstream`

## Status

`candidate`

## Plain-English Summary

A reviewed Client Final could be accepted through the signed-in upload flow yet still be rejected as a required upstream artifact for the next stage's draft. Generation now recognizes the existing Client Final acceptance record as an alternative to the separate artifact-acceptance ledger row. Unreviewed and superseded files remain ineligible.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: No canonical supplier, contract, spend, or pricing fact changes.
- Layer 4: Source generation reads the event-scoped artifact registry's current Client Final state and accepted actor/time. It does not write a gate decision or alter any artifact.

## Client Applicability

- All clients using the Source New Client Final workflow and downstream artifact generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Recognize a linked Client Final only when it is marked current authority, remains in the current lifecycle, and has a recorded accepting actor and time.
- Scope the upstream artifact lookup to the current event in addition to its linked IDs.
- Preserve the existing explicit artifact-acceptance path, stage eligibility, and draft/supersession rejection.

## QA / Validation

- Pass: A focused test failed before the change and passed afterward for a current accepted Client Final with no second acceptance action.
- Pass: Draft, non-final, non-authoritative, actorless, timestampless and superseded negatives remain blocked.
- Pass: Removing the current-authority condition or the event query fence caused the focused test to fail; both mutations were restored.
- Not run: Signed-in downstream generation replay, pending PR checks, merge and official runtime proof.

## Rollout Plan

Squash-merge after applicable CI and review. Only the repo-owned ACA main workflow may deploy shared web and workers. Verify digest-pinned web template, 100%-traffic revision and both workers before replaying the exact signed-in downstream generation action.

## Deployment Authority

- Repo-owned web deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Database migration or data job: None for this change.
- Shared runtime mutators: None from this branch.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a new PR and the repo-owned main workflow. Previously accepted Client Finals remain stored and auditable; reverting would block downstream generation again but would not alter their approval history.

## Audit Evidence

Signed-in upstream-required response, red/green behavior test, two mutation failures, PR checks, official runtime readback and signed-in replay in the private journey ledger.

## Known Gaps

This only fixes downstream generation eligibility. It does not apply a separately pending Scope evidence schema migration, accept Scope evidence, decide its gate, or exit the stage.
