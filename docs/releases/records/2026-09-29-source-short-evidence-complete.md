# 2026-09-29 Source Short Evidence Excerpts

## Release ID

`2026-09-29-source-short-evidence-complete`

## Status

`candidate`

## Plain-English Summary

Source generation now includes the complete parsed text of an ordinary upload when it fits in one short parser chunk. This prevents a decision-relevant ending from being silently omitted at the prompt boundary. Multi-chunk uploads retain the existing excerpt budget; this does not make generated prose authoritative.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: changes only the generation-context excerpt for short uploaded evidence.
- Layer 3, canonical model: no facts or approvals are written or reclassified.
- Layers 1 and 2: no intake or adapter change.

## Client Applicability

- All clients: yes, when generating Source artifacts from an uploaded short document.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserve up to the parser's 1,800-character bound for a single ordinary evidence chunk.
- Preserve the existing 900-character per-chunk limit for multi-chunk ordinary evidence and the complete bidder Q&A behavior.
- Add behavioral tests for both boundaries.
- No migration, data job, or approval-policy change.

## QA / Validation

- Pass: red-first single-chunk test caught the existing 900-character truncation.
- Pass: restoring that truncation as a mutation made the new test fail.
- Pass: context-binder and prompt-registry suites, 73/73 tests.
- Pass: TypeScript (`tsc --noEmit --incremental false`), scoped ESLint, `npm run release:check`, and `git diff --check`.
- Not run: PR CI/review and signed-in replay at record creation.

## Rollout Plan

Squash-merge after applicable validation and review. Only the repo-owned ACA main workflow may deploy the digest-pinned image. After runtime proof, regenerate a draft from a short synthetic upload and inspect the rendered document and quality gate. Human acceptance remains required before a Client Final or stage approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: pending web template and sole 100%-traffic revision readback.
- Worker image invariant: pending required worker readback.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, regeneration and quality review.

## Rollback Plan

Revert through a PR and the repo-owned main deploy workflow. No stored evidence or database migration is rolled back by this release.

## Audit Evidence

- Red-first and mutation test output are in the private execution ledger; PR, CI, deploy and signed-in receipts will be recorded separately.

## Known Gaps

- A complete excerpt is only source context. Unsupported claims, approval rights and rendered quality still require independent review.
