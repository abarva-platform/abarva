# 2026-09-28 Source no-baseline review contract

## Release ID

`2026-09-28-source-no-baseline-review-contract`

## Status

`candidate`

## Plain-English Summary

Source artifact review and rewrite instructions now treat an absent commercial baseline as a governed limit. Reviewers must not ask for unsupported proxy financial amounts, contribution percentages, or invented collection dates to satisfy a generic commercial-specificity rubric.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source generated-artifact quality review and rewrite guidance.
- Layer 3 Canonical Model: read-only context. No fact, evidence, approval, or event-state write.

## Client Applicability

- All clients: Source events generating artifacts that require the consulting-grade review.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Prepend Source-specific evidence limits to initial review, malformed-review retry, and rewrite prompts.
- Replace unbound numeric, proxy, and timing fixes returned by a reviewer before they reach the rewrite model; retain a fix when its value is in bound context.
- Allow commercial specificity to be demonstrated with named levers, an explicitly unquantified range, and a named evidence-closure action when values are not bound.
- Keep recommended evidence and client-set dates distinct from hard gate requirements.

## QA / Validation

- Pass: red-first test reproduced the missing reviewer and rewrite instructions.
- Pass: removing the instruction from initial review and then rewrite each failed the targeted test; both mutations were restored.
- Pass: red-first test caught unsafe reviewer-suggested financial ranges still present in the rewrite prompt; unbound suggestions are replaced while a bound Finance value survives.
- Pass: removing the rewrite-boundary filter failed the targeted test, then was restored.
- Pass: 13 Source generation suites / 144 tests; TypeScript with 8 GB heap; scoped ESLint; release:check; diff check.
- Not run: PR CI, deployment and signed-in regenerated review; required before a live claim.

## Rollout Plan

Squash merge only after applicable CI and review. Deploy through the repo-owned ACA main workflow, verify digest-pinned web and required worker images, then regenerate and inspect a synthetic Source artifact signed in. Existing drafts remain unaccepted until independently reviewed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify template and sole 100%-traffic revision image match the approved digest.
- Worker image invariant: Verify both required delivery workers match that digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No schema or data rollback is required.

## Audit Evidence

PR, applicable CI, official deployment, independent runtime readback, and signed-in draft review are recorded in the private execution ledger.

## Known Gaps

This is a review-instruction correction, not a guarantee that a model-generated draft is commercially valid. Client-final acceptance and stage decisions remain separate human-governed actions.
