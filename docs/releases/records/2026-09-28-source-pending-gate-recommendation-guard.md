# 2026-09-28 Source pending-gate recommendation guard

## Release ID

`2026-09-28-source-pending-gate-recommendation-guard`

## Status

`candidate`

## Plain-English Summary

Strategy draft authoring and deterministic review now reject positive instructions to record approval or advance an event while recorded Strategy criteria remain pending. A neutral request to hold a review and record the actual decision remains allowed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy draft authoring and quality review.
- Layer 3 Canonical Model: read-only use of existing gate criteria. No canonical fact, schema, approval, or event-state write.

## Client Applicability

- All clients: Source events generating Strategy artifacts while gate criteria are pending.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Explicitly prohibit authoring instructions that tell the owner to record approval or advance before the criteria are met.
- Catch positive approval, advancement, no-blocking-gap, and premature criterion-closure claims in deterministic review.
- Preserve explicit refusal and conditional approval language when the condition is that every applicable criterion is actually met.

## QA / Validation

- Pass: red-first tests reproduced positive recommendation forms that the prior pending-gate reviewer missed.
- Pass: refusal, conditional-decision, mixed-clause, and cleared-gate negatives remain allowed.
- Pass: deliberate removal of the positive approval pattern and conditional exception each failed a targeted test, then was restored.
- Pass: 13 generation suites / 143 tests.
- Not run: PR CI, runtime readback, and signed-in regenerated-content replay; required before live claims.

## Rollout Plan

Squash merge after local validation, applicable CI, and review. Deploy only through the repo-owned ACA main workflow after any preceding shared-runtime deployment settles. Verify digest-pinned web and worker runtimes, then regenerate and review the synthetic Strategy draft signed in before any client-final or stage decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required. Existing AI drafts remain unaccepted.

## Audit Evidence

PR, applicable CI, official deploy, runtime readback, and signed-in content review are tracked in the private execution ledger.

## Known Gaps

This is a specific content contradiction guard, not a complete proof of every generated commercial or legal claim. A draft remains subject to human review and does not satisfy a pending gate.
