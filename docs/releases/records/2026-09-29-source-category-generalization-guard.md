# 2026-09-29 Source category generalization guard

## Release ID

`2026-09-29-source-category-generalization-guard`

## Status

`candidate`

## Plain-English Summary

The Source Strategy draft quality gate now flags unsupported category rankings and routine-outcome claims even when the model reviewer otherwise passes the draft. The same claim remains allowed when its wording is established in the bound event context.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source draft-quality review for Strategy artifacts.
- Layer 3 Canonical Model: read-only evidence context; no canonical fact, artifact authority, or approval change.
- Layers 1 and 2: no intake or adapter change.

## Client Applicability

- All clients: yes, when generating the affected Strategy drafts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Flag unbound highest/lowest category ranks, most-commonly-assessed claims, and routine outcome assertions.
- Accept the corresponding statement when bound context actually establishes it.
- Leave the existing numeric, temporal, market, and human-review controls intact.

## QA / Validation

- Pass: red-first live-shaped test showed the existing deterministic scan accepted three unbound claims.
- Pass: deleting the new patterns failed the targeted test; the mutation was restored.
- Pass: the source-bound negative case and 13 Source generation suites / 157 tests.
- Pass: TypeScript with 8 GB heap, scoped ESLint, `npm run release:check`, and diff check.
- Not run: PR CI/review and signed-in replay at record creation. A default-heap TypeScript attempt exhausted Node's 4 GB heap before the successful larger-heap run.

## Rollout Plan

Squash merge after local validation and applicable CI/review. Deploy only through the repo-owned ACA main workflow. Verify the digest-pinned web template, sole Healthy/Running 100%-traffic revision, and both required workers before regenerating the affected synthetic draft signed in. Existing drafts remain unaccepted until separately reviewed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and traffic revision readback.
- Worker image invariant: pending both required worker readbacks.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert through a PR and the same repo-owned main deploy workflow. No schema or data rollback is required.

## Audit Evidence

Focused red/green and deletion-mutation output, PR, applicable CI, official deployment, runtime readback, and signed-in draft review are recorded separately in the private execution ledger.

## Known Gaps

This is a bounded lexical guard, not a general fact checker. It does not accept a Client Final, decide a gate, or replace human content review.
