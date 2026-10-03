# 2026-09-28 Source evidence-bound value target

## Release ID

`2026-09-28-source-d02-evidence-bound-target`

## Status

`candidate`

## Plain-English Summary

The Source value-target draft no longer has to fill financial range and timing fields with unsupported numbers or dates. An unestablished range remains explicitly open for the accountable owner to size from governed evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source value-target authoring instructions.
- Layer 3 Canonical Model: read-only context; no fact, evidence, approval, or event-state write.

## Client Applicability

- All clients: Source events generating a value-target brief.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Make low/base/high sizing and confidence conditional on bound baseline evidence.
- Keep an intake candidate opportunity separate from a financial base case.
- Prohibit illustrative or proxy spend baselines and sensitivity amounts.
- Leave owner assignment and measurement timing open when bound evidence does not establish them.

## QA / Validation

- Pass: red-first prompt test failed on the old unconditional range/window instructions and passed after the correction.
- Pass: removing the new proxy-baseline instruction made the targeted test fail; the mutation was restored.
- Pass: 13 Source generation suites / 144 tests, TypeScript with 8 GB heap, scoped ESLint, release:check, and diff check.
- Not run: PR CI, deployment and signed-in regeneration; required before a live claim.

## Rollout Plan

Squash merge only after applicable CI and review. Deploy through the repo-owned ACA main workflow, verify digest-pinned web and required worker images, then regenerate and inspect a synthetic Source draft signed in. Existing drafts remain unaccepted until independently reviewed.

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

This corrects the authoring contract. It does not guarantee a model will follow it, validate a financial target, approve a draft, or clear a stage gate. The independent content and approval boundaries remain in force.
