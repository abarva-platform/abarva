# 2026-10-13-intelligence-progressive-answer — Progressive executive answers

## Release ID

`2026-10-13-intelligence-progressive-answer`

## Status

`candidate`

## Plain-English Summary

Intelligence releases completed answer paragraphs as the model generates them. Each paragraph passes the existing cumulative retired-fact checks before delivery, and the existing source and model tenant guards remain active. Structured exhibits and source metadata stay out of live prose; the intact final answer packet supplies exhibits, citations, exports and follow-up questions. Follow-ups now prioritize the user's business objective and next executive decision. Starter prompts disappear after a question is submitted.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Intelligence response delivery, follow-up instructions and waiting presentation.
- No canonical schema, tenant intake, source adapter, retrieval dataset or client data changes.

## Client Applicability

- All clients: Shared Intelligence model-authored advisor responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing model-authored output mode; no new flag.

## Changes Included

- Incremental delivery of completed paragraphs with cumulative safety checks.
- Live prose snapshots that suppress incomplete exhibit and provenance fences.
- Final packet reconciliation preserving original model output without duplicate prose.
- Decision-focused follow-up instructions, removal of stale starters during generation, and a visible status beneath the partial answer until completion.
- Existing latency trace receives pipeline timings and the first visible prose mark.

## QA / Validation

- Scoped Jest: 143 tests across nine suites passed, including pre-completion delivery, split retired facts, character-split protocol fences, final packet preservation and rendered follow-ups.
- Scoped ESLint and TypeScript: passed.
- Release validation: all 11 gates passed. Whitespace checks passed.
- Live signed-in first-prose timing, final completion, follow-up relevance and native exhibits: required after deployment.

## Rollout Plan

Squash merge the reviewed PR to main, then use the repository-owned ACA main deploy workflow. Confirm the approved image, healthy revision, 100% traffic and worker parity. Verify progressive output and final answer reconciliation in the signed-in Intelligence page.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Recorded by the main deploy workflow.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest.
- Worker image invariant: Both required worker jobs must use that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR through the repository-owned main deploy workflow. No data or schema rollback is required.

## Audit Evidence

PR, scoped tests, TypeScript, ESLint, release checks, deployment run, runtime proof and signed-in browser snapshots and timings.

## Known Gaps

Progressive delivery reduces waiting for the full answer but does not guarantee a fixed first-answer or completion time. Private model reasoning and retrieval can still delay the first paragraph. Follow-up relevance is model-authored and requires live review. Final exhibits appear when the final packet completes.
