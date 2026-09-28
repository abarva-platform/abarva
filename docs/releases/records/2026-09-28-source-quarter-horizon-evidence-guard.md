# 2026-09-28 Source quarter-horizon evidence guard

## Release ID

`2026-09-28-source-quarter-horizon-evidence-guard`

## Status

`candidate`

## Plain-English Summary

The Source draft quality gate now treats a fixed number of post-go-live quarters as a duration claim. A draft cannot pass solely on model review when that measurement horizon is absent from bound evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source draft-quality review and feedback for Strategy artifacts.
- Layer 3 Canonical Model: read-only evidence context; no canonical fact, approval, or artifact-state write.

## Client Applicability

- All clients: Source events generating gate-defining Strategy drafts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Recognize quarter-length measurement horizons, including post-go-live wording, as temporal claims.
- Normalize a quarter to three months so an equivalent evidence-bound duration remains valid.
- Keep client-set timing unquantified when no duration is bound.

## QA / Validation

- Pass: red-first behavioral test reproduced an unbound quarter horizon passing the deterministic scan.
- Pass: deleting the new recognition pattern failed the live-shaped targeted test; the mutation was restored.
- Pass: 13 Source generation suites / 150 tests, TypeScript with 8 GB heap, and scoped ESLint.
- Not run: PR CI, deployment, and signed-in regeneration; verify before live claim.

## Rollout Plan

Squash merge after local validation and applicable CI/review. Deploy only through the repo-owned ACA main workflow. Verify the digest-pinned web template, sole 100%-traffic revision, and both required workers; then regenerate and inspect the affected synthetic draft signed in. Existing drafts remain unaccepted pending independent review.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Template and sole 100%-traffic revision match the approved digest.
- Worker image invariant: Both required delivery workers match that digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No schema or data rollback is required.

## Audit Evidence

PR, applicable CI, official deployment, independent runtime readback, and signed-in draft review are recorded in the private execution ledger.

## Known Gaps

This is a bounded temporal-claim guard. It does not accept a draft, make a gate decision, or validate every narrative statement; human review remains required.
