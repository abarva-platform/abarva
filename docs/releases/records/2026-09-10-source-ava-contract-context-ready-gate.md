# 2026-09-10-source-ava-contract-context-ready-gate - Source aVa Contract Context Ready Gate

## Release ID

`2026-09-10-source-ava-contract-context-ready-gate`

## Status

`released; live-proven`

## Plain-English Summary

Source contract pages now pause the aVa composer until the selected contract detail has loaded. This prevents a contract-specific question from being sent with a stale or incomplete surface context while the dashboard is still assembling governed contract rows.

## Layer Impact

Layer 4 PRODUCTS, lane `global-control-lane`: Source and the shared aVa dock presentation boundary. The release does not change loaders, migrations, canonical data, tenant data, or data-plane writes.

## Client Applicability

- All clients: Source Contract 360 users get the safer composer behavior on contract-detail pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only.

## Changes Included

- Adds a shared AgentDock composer-disabled reason so a host surface can pause sends with visible placeholder copy.
- Wires Source Workspace to pause aVa when `sourceContract360Mode` is active and contract detail state is not `ready`.
- Adds a pure Source gating helper and focused regression tests.

## QA / Validation

- PASS: Focused Source aVa composer tests, 11/11.
- PASS: ESLint on touched Source and AgentDock files.
- PASS: TypeScript `tsc --noEmit --pretty false`.
- PASS: Pull request CI checks completed successfully before merge.
- PASS: ACA deploy through the repository-owned main workflow, run `34447935502`.
- PASS: Independent ACA runtime invariant after deploy at `2026-09-10T07:11:11.827Z`.
- PASS: Live signed-in Source Contract 360 smoke for selected contract detail loading. The aVa composer was disabled with the governed-context loading placeholder while contract detail was loading, then re-enabled after detail became ready.
- PASS: Live signed-in Source aVa smoke after readiness. The answer stayed bound to the selected contract, carried sized versus signal-stage distinction, cited evidence gates, and did not return the incomplete-provider fallback.
- PASS: Live signed-in companion contract smoke verified the same Source Optimize path after hydration without cross-contract bleed or the retired action toolbar controls.

## Rollout Plan

Merge through pull request, then deploy through the repository-owned Azure Container Apps main deploy workflow. No manual ACA mutation, migration, data-build job, or feature-flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: Completed in run `34447935502`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:22ba0b2c1512fa157791ac3b9feeb81f8e4b5612f38fc53d7db4ea80c6b17234`.
- Approved image: `acrabarvalab001.azurecr.io/abarva/web@sha256:22ba0b2c1512fa157791ac3b9feeb81f8e4b5612f38fc53d7db4ea80c6b17234`.
- ACA runtime invariant: Passed. Template image and the 100%-traffic revision image matched the approved digest.
- Active revision: `ca-abarva-web-lab-eastus--mfc3960da` at 100% traffic.
- Worker image invariant: Passed for `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event`.
- Feature/env flag update path: None.
- Live signed-in proof required: Completed for Source contract deep link, composer gating while loading, aVa answer after contract detail readiness, and companion contract smoke.

## Rollback Plan

Revert the Source/AgentDock presentation change or roll production back to the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- Pull request: `#7536`, squash-merged as `fc3960da8cfc7cc6b95b21226cb8c0efb418aa79`.
- Deploy evidence: GitHub Actions run `34447935502`; local artifact path `/tmp/aca-main-deploy-34447935502-evidence`.
- Independent runtime invariant evidence: `/tmp/source-ava-contract-ready-gate-runtime-invariant-fc3960da`.
- Live Source proof: selected contract page first exposed the disabled aVa composer with `Loading governed contract context before aVa can answer.` while detail was loading, then re-enabled the composer after the selected contract detail was ready.
- Live aVa proof: selected-contract answer returned governed contract facts and optimization detail, including 4 sized opportunities totaling `$1.5M`, 2 signal-stage levers excluded from totals/charts, and explicit benchmark/per-SKU evidence gates. It did not return the incomplete-provider fallback and did not leak signal-stage dollar estimates into the answer.
- Companion contract proof: selected-contract Optimize smoke for the companion cloud contract rendered the correct contract, vendor, annual value, avoidable/negotiable posture, and no cross-contract bleed.

## Known Gaps

This release does not change aVa answer generation, retrieval, or contract optimization data. It prevents an incomplete contract-detail state from being submitted as if it were fully grounded.
