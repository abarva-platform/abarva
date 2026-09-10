# 2026-09-09-source-optimize-sized-opportunity-label - Source Optimize Sized Opportunity Label

## Release ID

`2026-09-09-source-optimize-sized-opportunity-label`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 Optimize now labels the total for evidence-backed, non-signal action rows as a sized opportunity total. This avoids implying that every quantified action is negotiable when the row set can include other value types.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source presentation copy only. No canonical data, source adapter, tenant data, loader, or retrieval behavior changes.

## Client Applicability

- All clients: Source Contract 360 Optimize users see the clearer label.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Source Contract 360 Optimize summary label now describes the total as a sized opportunity.
- The helper and behavioral test names now match the broader value-type meaning.

## QA / Validation

- PASS: Targeted Source workspace Jest test.
- PASS: ESLint on touched Source files.
- PASS: TypeScript `tsc --noEmit`.
- PASS: Release-control check.
- PASS: Staged secret scan through the repository hook.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Required before live proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Source Contract 360 Optimize smoke after deployment.

## Rollback Plan

Revert the presentation-only change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- Pull request URL, CI checks, merge SHA, ACA deploy run, runtime-invariant output, and live Source smoke notes.

## Known Gaps

No functional or data-layer gap is known for this label correction. Separate Source optimization gaps remain out of scope: benchmark comparator evidence and target-term fields require canonical data-model work before they can be represented as evidence-backed optimization details.
