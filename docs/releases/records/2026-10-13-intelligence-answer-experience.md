# 2026-10-13-intelligence-answer-experience — Intelligence answer experience

## Release ID

`2026-10-13-intelligence-answer-experience`

## Status

`candidate`

## Plain-English Summary

Intelligence now gives a visible progress update while a response is being prepared, retries once when the model produces no answer text, and formats responses according to the depth of the question. Its chat and exhibits use the available content width. Short executive answers can lead into specific follow-up questions; broad requests can cover each required area. Visuals are selected from available evidence rather than a default matrix. The quality-review panel is removed from the advisor page.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Intelligence answer generation instructions, response rendering, and chat layout change. The canonical model, source adapters, tenant intake, and read models do not change.

## Client Applicability

- All clients: Applies to the shared Intelligence advisor surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing model-authored answer mode; no new flag.

## Changes Included

- Intelligence model request configuration and empty-text retry.
- Question-scaled executive response and follow-up instructions.
- Visible waiting updates, full-width chat and exhibit layout, and Markdown styling.
- Removal of the quality-review panel from the advisor page.
- Focused behavior tests for multi-part requests, empty-text retry, and waiting state.

## QA / Validation

- Scoped ESLint: passed.
- Scoped Jest: passed, 44 tests across six suites; the page suite was rerun after removing the quality-review panel.
- TypeScript `tsc --noEmit`: passed.
- `git diff --check`: passed.
- Route reachability check: passed after removing the unused quality-review component.
- Live signed-in answer generation remains to be validated after deployment.

## Rollout Plan

Merge the reviewed PR to `main`, then use the repository-owned ACA main deploy workflow. Confirm the approved digest, healthy revision, 100% traffic, and signed-in Intelligence behavior before recording live proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this candidate.
- Approved image digest: To be recorded by the main deploy workflow.
- ACA runtime invariant: Template and 100% traffic revision must match the approved digest.
- Worker image invariant: Verify required worker jobs against the approved release digest before live claim.
- Feature/env flag update path: No update.
- Live signed-in proof required: Yes, including a short answer, multi-part answer, and waiting state.

## Rollback Plan

Revert the PR and use the repository-owned main deploy workflow to restore the previous approved behavior and digest. No schema or data rollback is required.

## Audit Evidence

PR review, scoped test output, TypeScript result, deploy workflow run, runtime digest and traffic readback, and signed-in Intelligence checks.

## Known Gaps

The original model stop reason and token usage were not recorded, so the historical empty-text cause remains an inference. The new progress indicator does not guarantee a response within a fixed time. Live behavior awaits deployment proof.
