# 2026-09-29 Source Short Evidence Excerpts

## Release ID

`2026-09-29-source-short-evidence-complete`

## Status

`candidate`

## Plain-English Summary

Source generation now includes the complete parsed text of an ordinary upload when it fits in one short parser chunk. Both the context binder and the Strategy memo/value-target prompts preserve that ending, instead of independently truncating it. Other draft prompts retain their existing excerpt limit; this does not make generated prose authoritative.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: changes only generation-context and draft-prompt excerpts for short uploaded evidence.
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
- Preserve a complete single short chunk in the two Strategy draft prompts. Other draft prompts, and multi-chunk Strategy evidence, retain the existing 500-character excerpt.
- Preserve the existing 900-character per-chunk binder limit for multi-chunk ordinary evidence and the complete bidder Q&A behavior.
- Add behavioral tests for the binder, actual Strategy artifact prompts, and unchanged Scope prompt limit.
- No migration, data job, or approval-policy change.

## QA / Validation

- Pass: red-first tests caught the binder's 900-character and the Strategy draft prompt's 500-character truncation; an unscoped formatter failed the Scope negative test.
- Pass: restoring each truncation as a mutation made its targeted test fail.
- Pass: Source generation suites, 13 suites and 154 tests.
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
