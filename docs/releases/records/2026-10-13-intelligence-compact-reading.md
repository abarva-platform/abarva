# 2026-10-13-intelligence-compact-reading — Concise reading with immediate detail

## Release ID

`2026-10-13-intelligence-compact-reading`

## Status

`candidate`

## Plain-English Summary

Intelligence shows a concise initial reading view and lets the executive open the complete answer immediately. Compact exhibits stay whole; larger exhibits remain available in the full analysis. Sources and follow-up questions remain accessible. Generic JSON fences containing valid source or question metadata now render as sources and clickable questions.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Intelligence opts into a presentation budget in the shared chat dock. Model-authored metadata decoding and source display also change.
- No intake, adapter, canonical model, retrieval dataset or client data changes.

## Client Applicability

- All clients: Model-authored Intelligence responses.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing model-authored output mode; other dock callers do not set the reading budget.

## Changes Included

- Simple questions use a 100-word reading budget; broader questions use 300. An explicit word count is honored within a bounded range.
- Longer content folds at complete blocks or sentences. No table rows or chart data are cut. The full authored text, packet and exports remain unchanged.
- The complete analysis opens locally without another model call. The disclosure is withheld while generation is in progress.
- Source titles, supplied context records and excerpts remain accessible outside the folded analysis.
- Only exact source-alias arrays and three question strings qualify for generic JSON metadata decoding. Ordinary JSON and unsupported exhibits stay reviewable.

## QA / Validation

- Compact reading, metadata, native exhibits, dock and page tests: 39 tests across seven suites passed locally, including complete opportunity-brief fit and oversized table-only/code-only openings.
- TypeScript, scoped lint, export reachability and whitespace checks: passed. Release checks: all 11 gates passed.
- Five signed-in pressure questions plus expansion and follow-up click: not-run on this candidate; required after deployment.

## Rollout Plan

Squash merge to main and deploy only through the repository-owned ACA main workflow. Prove the approved digest, healthy serving revision, full traffic and worker parity, then verify signed-in streaming, concise views, expansion, source rendering and follow-up interaction.

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

PR, local tests and static checks, required CI, main deployment, runtime invariant, and private signed-in question/expansion evidence.

## Known Gaps

The concise view is an excerpt of the authored analysis rather than a separately generated summary. Full evidence discussion remains available through expansion and source details. Model instructions continue to request concise, decision-focused content and distinguish provisional evidence from verified outcomes.
