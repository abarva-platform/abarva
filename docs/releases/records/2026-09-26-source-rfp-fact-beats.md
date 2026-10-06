# Source RFP Stage Fact-Derived Beats

## Release ID

`2026-09-26-source-rfp-fact-beats`

## Status

`candidate`

## Plain-English Summary

The RFP-stage task and gate now show which value-lever clauses have an observed inclusion fact for the event. Unconfirmed clauses are not represented as absent, and observed clause coverage is not represented as package approval or external release.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no schema or data change; reads the existing tenant-scoped per-lever clause signal.
- Layer 4 Source: derives the RFP task and gate presentation from the observed signal and resolved archetype. Approval and release policy are unchanged.

## Client Applicability

- All clients using the Source event analytics canvas.
- No client-specific data, migration, feature flag or external delivery change.

## Changes Included

- Pass the existing tenant-scoped RFP clause signal to the live stage builder.
- Derive one checklist task, observed-coverage confirmations, approver role and declared RFP deliverables without carrying the sample gate's release claims.
- Preserve the existing `RFP_CLAUSES_V1` upload template and governed stage action.
- Refresh the per-stage provenance measurement for the fourth derived stage.

## QA / Validation

- Pass: four red-first RFP cases failed on the scaffold before implementation and passed after it; a fifth negative case checks empty and undeclared signals.
- Pass: removing the mounted page handoff failed the AST wiring case; misspelling the RFP stage key failed three behavioral cases; both mutations were restored.
- Pass: affected builder and mounted canvas suites, 149 tests; full Source canvas suite, 268 tests; scoped ESLint; TypeScript no-emit with an 8 GB Node heap; release control.
- CI: pending PR creation.
- Signed-in product proof: pending post-deploy RFP canvas readback on an event legitimately at that stage.

## Rollout Plan

Merge through a PR after applicable CI and review. Only the repo-owned ACA main workflow may deploy the merge. Verify the immutable digest on web template, 100%-traffic revision and required worker jobs, then inspect the RFP view signed in if an authorized event is at that stage.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: verify after deploy.
- ACA runtime invariant: verify template, traffic revision and workers after deploy.
- Live signed-in proof required: yes, for the RFP view; report it as owed if no authorized event is at RFP.

## Rollback Plan

Revert through a PR. No data or schema rollback is involved.

## Audit Evidence

Focused behavior tests, generated provenance JSON, mutation results, local checks, PR/CI and post-deploy runtime and signed-in records.

## Known Gaps

The existing clause reader retains only levers with an included-clause fact; it cannot distinguish an explicit zero from a missing row. This view therefore says "not confirmed" for both. It does not certify package readiness, recipient isolation, sponsor approval or RFx release. The frozen synthetic event remains subject to its genuine Scope gate.
