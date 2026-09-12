# 2026-09-12-source-command-surface-vocabulary — Command surface vocabulary

## Release ID

`2026-09-12-source-command-surface-vocabulary`

## Status

`candidate`

## Plain-English Summary

Two pieces of builder content on the portfolio Command view, found by reading
the deployed page while checking something else.

**An authoring instruction at the foot of the executive view.** The quality
panel closed with "Contract pages should show scope, economics, performance,
relationship, and evidence narratives only when the corresponding load rows
exist. Otherwise they should render a specific backfill request, not a reusable
placeholder." That is a correct design rule and the wrong audience: it is
addressed to whoever builds the contract pages, and it sat under a heading an
executive reads. The same rule is now stated as a fact about what the product
does.

**An internal artifact name in an executive lane panel.** The evidence-lane
panel counted "aVa grounding bundles" beside spend rows, performance rows and
contract headers. A reader has no way to know what a grounding bundle is; the
lane it counts is the set of contracts the assistant can answer on, so it now
says so.

This is the same class as the tab-level directives and the provenance
identifier fixed earlier today, on a surface those changes did not reach.

## Layer Impact

- **Release lane:** `global-control-lane` — shared portfolio Command presentation for all clients, not feature-gated.
- **Layer 4 / Products:** Command quality panel prose and one lane label.
- **Layer 3:** No canonical facts, source assertions, or data-plane rows change. The counted set is unchanged; only its label is.
- **Layer 2:** No adapter or intake changes.

## Client Applicability

- **All clients:** Applies to every tenant's Command view.
- **Specific clients:** None.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `WorkspaceExecutiveShell.tsx`: the quality panel's closing paragraph is restated for its actual audience; the lane label reads "Answerable contracts".
- `WorkspaceClient.ecl-browser.test.tsx`: the assertion now pins the reader-facing wording and asserts the directive is absent.

## QA / Validation

- Focused Jest: 27 suites, 237 tests passed across the workspace slice.
- The existing full-shell assertion caught the prose change immediately, which is why it is updated here rather than silently broken.
- Repository TypeScript: clean. ESLint on both changed files: clean.
- Required follow-up: read the deployed Command view and confirm neither the directive nor the artifact name is present.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA deploy workflow
builds a digest-pinned image and updates the shared lab runtime. No migration or
operator data-build job is required for this presentation-only change.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`
- **Shared runtime mutators:** None outside the workflow.
- **Approved image digest:** Recorded after deployment.
- **ACA runtime invariant:** Required before calling the change live-proven.
- **Worker image invariant:** Not applicable.
- **Feature/env flag update path:** Not applicable.
- **Live signed-in proof required:** Yes, on the portfolio Command view.

## Rollback Plan

Revert the PR or select the prior known-good digest through the repo-owned ACA
deployment lane. No source data or migration rollback is required.

## Audit Evidence

- PR and CI checks for this branch.
- Focused Jest, TypeScript, and ESLint output.
- ACA deployment run, digest invariant, and the deployed-page read.

## Known Gaps

Only the portfolio Command view was read for this class. The other portfolio
views — Contracts, Levers, Evidence, Coverage — have not been audited for
authoring directives or internal artifact names, and the composition
assertions added separately are not yet wired into a portfolio-level render.

A related item was investigated and found not to be a defect: portfolio tab
switching was suspected of forcing a full reload. A dispatched click updates the
crumb, the active state and the query parameter in place, with no document
navigation, so the surface transitions client-side as intended. The earlier
suspicion came from tool clicks that were not landing on the control, not from
the product.
