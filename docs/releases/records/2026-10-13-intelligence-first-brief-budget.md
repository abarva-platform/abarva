# 2026-10-13-intelligence-first-brief-budget — Bounded initial executive briefs

## Release ID

`2026-10-13-intelligence-first-brief-budget`

## Status

`candidate`

## Plain-English Summary

Intelligence ends its generation request with an explicit initial-response word budget. Broad lists of questions are covered compactly in one integrated brief, with additional depth offered through relevant follow-up questions. Source references and missing reference evidence stay explicit.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Shared model-authored Intelligence output instructions.
- No intake, adapter, canonical model, retrieval dataset or client data changes.

## Client Applicability

- All clients: Model-authored Intelligence responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing model-authored output mode.

## Changes Included

- Initial briefs use a maximum of 100 visible words for simple questions and 300 for broad questions, including exhibit cells and notes. Source metadata and follow-ups are separate.
- Explicit longer-word-count or detailed-report requests can override the initial budget.
- Named briefs integrate the requested areas once, without a repeated closing summary or a full report for every numbered question.
- The final drafting reminder follows the provisional evidence guard, which remains active in both system and user instructions.
- Source titles use supplied references; missing original record, page, passage or date references are identified as unavailable.

## QA / Validation

- Focused streaming, context, route and page suites: 52 tests across six suites passed.
- TypeScript and scoped ESLint: passed. Release checks: all 11 gates passed. Whitespace and export-reachability validation: passed.
- Five signed-in questions: not-run on this candidate; required after deployment to verify initial length, early prose, final reconciliation, evidence discipline and follow-up relevance.

## Rollout Plan

Squash merge to main and deploy only through the repository-owned ACA main workflow. Prove image digest, healthy serving revision, full traffic and worker parity. Re-run the five signed-in questions.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Recorded by the main deploy workflow.
- ACA runtime invariant: Template and 100% traffic revision match the approved digest.
- Worker image invariant: Both required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy main through the repository-owned workflow. No data rollback is required.

## Audit Evidence

PR, local tests and static checks, required CI checks, deployment run, runtime invariant and private signed-in five-question evidence.

## Known Gaps

Word budgets are model instructions, not deterministic truncation. Live review remains necessary. No response rewriting or source-readiness promotion is introduced.
