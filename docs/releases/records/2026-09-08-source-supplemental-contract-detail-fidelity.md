# 2026-09-08 Source Supplemental Contract Detail Fidelity

## Release ID

`2026-09-08-source-supplemental-contract-detail-fidelity`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now treats a successfully fetched supplemental contract as the active contract throughout the page. The loading state no longer flashes an unrelated portfolio contract, contract-specific scope can render from the detail response, and the selected contract is included in the aVa surface context without changing portfolio-register totals.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source workspace selection, detail rendering, and aVa surface context.
- Layers 1-3: No intake, adapter, canonical-data, calculation, or tenant-record changes.

## Client Applicability

- All clients: Yes, when contract-depth rows exist outside the main portfolio-register projection.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Promote a loaded contract-detail response into the shared Source view model.
- Keep supplemental contract rows separate from portfolio-register counts.
- Show an explicit loading or unavailable state instead of a substitute contract.
- Render application scope from contract-detail confidence tiers when the portfolio payload does not carry that contract.
- Include the selected supplemental contract in the governed aVa surface context and contract directory.

## QA / Validation

- Source workspace browser behavior tests: PASS.
- Source view-model tests: PASS.
- Scoped ESLint: PASS.
- TypeScript no-emit check: PASS with the repository heap setting increased for the full graph.
- Signed-in product proof: NOT RUN; required after deployment.

## Rollout Plan

Merge through the protected PR lane and deploy the exact main SHA through the repo-owned ACA workflow. Then open a supplemental contract from Source search and from a Tower action, verify the loading state never shows another contract, verify contract scope and evidence counts, and run a contract-specific aVa question.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new PR and redeploy that main SHA. No data rollback is required because this release changes only Layer 4 selection and rendering behavior.

## Audit Evidence

- PR URL, merge SHA, CI run, and ACA deploy run after publication.
- Focused view-model and browser behavior tests.
- Signed-in Source and Tower-to-Source drill-through proof after deployment.

## Known Gaps

Supplemental contract rows remain intentionally outside portfolio-register totals until they are matched into the governed contract book. This release improves their detail path; it does not alter that governance decision.
