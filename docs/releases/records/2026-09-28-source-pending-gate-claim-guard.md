# 2026-09-28 Source pending-gate claim guard

## Release ID

`2026-09-28-source-pending-gate-claim-guard`

## Status

`candidate`

## Plain-English Summary

Strategy draft authoring and deterministic review now reject a recommendation to approve or advance while the event's recorded Strategy criteria remain pending. Accurate next-review instructions and recommendations after the recorded criteria clear remain allowed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Strategy artifact generation and quality review.
- Layer 3 Canonical Model: read-only use of existing gate criteria and event state. No schema, canonical fact, approval, or event-state write.

## Client Applicability

- All clients: Source events generating a Strategy Memo or Value Target Brief.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tell the authoring model not to recommend approval or advancement when a Strategy criterion is pending.
- Detect `approve to advance` and `approval to advance` claims under the pending-gate deterministic review, alongside the existing readiness language.
- Evaluate separate clauses independently, so a refusal elsewhere on a line cannot conceal a positive approval recommendation.
- Preserve accurate refusal language and recommendations only after the recorded gate criteria clear.

## QA / Validation

- Pass: red-first tests reproduced a pending-gate approval recommendation that the existing reviewer missed, and the missing authoring instruction.
- Pass: negative tests allow explicit refusal language while pending and an approval recommendation only after criteria are recorded as met; a mixed refusal/recommendation line still fails review.
- Pass: deliberate removal of the new claim pattern and of clause isolation each failed a targeted test; both implementations were restored.
- Not run: PR CI, runtime readback, and signed-in regeneration of this candidate; required before live claims.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only through the repo-owned ACA main workflow. Independently verify digest-pinned web and worker runtimes, then regenerate and inspect the affected synthetic drafts signed in before any client-final or stage decision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required. Previously generated drafts remain review-only.

## Audit Evidence

PR, applicable CI, official deploy, runtime readback, and signed-in content review are tracked in the private execution ledger.

## Known Gaps

This guard checks a specific contradictory recommendation. It does not certify every generated commercial, legal, or numeric claim, and it does not approve or advance an event. A persisted draft with a failed quality receipt remains subject to human review.
