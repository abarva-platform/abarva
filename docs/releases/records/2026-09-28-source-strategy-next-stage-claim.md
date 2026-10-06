# 2026-09-28 Source Strategy next-stage claim guard

## Release ID

`2026-09-28-source-strategy-next-stage-claim`

## Status

`candidate`

## Plain-English Summary

The Source quality gate now rejects a Strategy draft that implies approval skips directly to the market-package stage. Strategy approval can advance only to the next governed Define/Scope stage.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source draft quality review and user-facing review feedback.
- Layer 3 Canonical Model: read-only stage context; no fact, event-state, evidence, or approval write.

## Client Applicability

- All clients: Source events generating Strategy decision artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Detect direct Strategy-to-RFP or market-package advancement claims in the two gate-defining Strategy drafts.
- Preserve accurate next-stage language, later-stage discussion, and explicit prohibitions on premature advancement.

## QA / Validation

- Pass: red-first behavioral test reproduced the direct-stage-skip claim before the guard.
- Pass: removing the live-shaped direct-advancement pattern made the targeted test fail; the mutation was restored.
- Pass: 13 Source generation suites / 146 tests.
- Pass: TypeScript with 8 GB heap, scoped ESLint, release:check, and diff check.
- Not run: PR CI, deployment, and signed-in regeneration; verify before live claim.

## Rollout Plan

Squash merge after local validation and applicable CI/review. Deploy only through the repo-owned ACA main workflow. Verify the digest-pinned web template, sole 100%-traffic revision and required workers, then regenerate and inspect a synthetic Strategy draft signed in. Existing drafts remain unaccepted pending independent review.

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

This is a narrow narrative guard. It does not approve a draft, make a gate decision, or release a market package. Other content-quality dimensions remain independently enforced.
