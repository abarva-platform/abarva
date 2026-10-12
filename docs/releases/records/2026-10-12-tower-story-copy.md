# 2026-10-12 Tower story and source-status copy

## Release ID

`2026-10-12-tower-story-copy`

## Status

`candidate`

## Plain-English Summary

Tower now names the population behind each count and shows missing source fields as unknown. Program decision rows, AI use cases, tool rollouts, adoption-source rows, benefit claims, outcome measures, cost exposures, and source recommendations remain separate. The shared value-chain serving view can return multiple record types; Tower counts benefit claims only from declared value-proof claim rows and keeps outcome measures and cost exposures out of benefit totals and Finance claimability counts. The executive verdict calls for Finance status review where case status is absent. Panels withdraw claims about vendor usage, quarterly results, foundation funding, program domains, and task-system status when supporting fields are not loaded.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Tower read and presentation logic. The AI portfolio reader accepts only an explicit vendor field, and panel copy reflects the available source basis.
- Layers 1–3: No intake, adapter, canonical model, or stored record changes.

## Client Applicability

- All clients: Tower Command Center users after the standard web release.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tower Command Center verdict, budget, AI bets, tools, foundations, and decisions panels.
- AI portfolio reader field mapping: vendor identity requires an explicit vendor field; a source tool name can label a system only on a declared tool rollout. Focused rendering and reader tests cover the boundary.
- Value-chain reader classification: declared value-proof benefit rows drive claim counts, value totals, Finance clearance, and the benefit funnel. Declared outcome-measure rows remain separately counted; cost exposures remain in the cost lens.
- No financial calculation or source-data change.

## QA / Validation

- Focused Tower and reader Jest suites: 16 suites, 126 tests passed.
- A mixed serving-view test includes benefit, outcome-measure, and cost-exposure rows. It verifies disjoint counts, benefit totals and funnel values, the unchanged cost-lens total, and exclusion of outcome and cost rows from the financial trajectory.
- The current registered-intake staging proof showed 18 benefit-feed claim rows, 50 outcome-measure rows, and 100 cost-exposure rows. These are observed candidate counts, not a fixed count for every client.
- TypeScript `tsc --noEmit` and ESLint passed on changed sources and tests.
- `npm run release:check` passed after the lane declaration was added.
- Live signed-in proof is required after the repo-owned deployment; local tests are not runtime evidence.

## Rollout Plan

Squash merge to `main`, then use the repo-owned ACA main deploy workflow. Verify the approved digest at the web template and traffic revision, then inspect the affected signed-in Tower panels.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Determined by the main deploy workflow after merge.
- ACA runtime invariant: Verify template and traffic revision digest parity before claiming deployment.
- Worker image invariant: No worker update in this release; verify the required worker images in the standard deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Tower panels.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

The PR diff, local test and validation output, CI checks, main deploy run, digest readback, and signed-in panel observations.

## Known Gaps

Missing Finance status, approved case funding, program domain, vendor identity, vendor usage, quarterly results, and case-to-value crosswalk require source or projection evidence. Outcome-measure records do not establish a Finance-clearable dollar benefit by themselves. This release labels those gaps and does not fill them by inference.
