# 2026-10-13-source-command-actionable-gaps - Actionable contract evidence review

## Release ID

`2026-10-13-source-command-actionable-gaps`

## Status

`candidate`

## Plain-English Summary

The Source Command view no longer presents a generic contract-review candidate as a quantified commitment risk, or describes monetary spend as measured consumption. An unsized action identifies the evidence review needed and opens the matching contract's Evidence tab. Decision posture distinguishes an evidence review from a decision-ready action, without treating a prior approval or a negated readiness state as ready.

## Release Lane

`global-control-lane`

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes Source executive presentation and navigation using existing canonical contract identifiers and read-model fields.
- Layers 1-3: unchanged. No input package, adapter, loader, calculation, schema, tenant row, authentication, or RLS changes.

## Client Applicability

- All clients: users of the Source executive workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- Command headline and next-action tile distinguish evidence review from a supported commercial claim.
- The tile and unsized action drawer open the same canonical contract's Evidence checklist.
- Unsized queue rows are labelled as evidence review rather than an unexplained absent amount.
- Readiness counts match explicit readiness states only; authority alone cannot substitute for readiness.
- Unknown evidence coverage remains unknown, rather than becoming a missing-document count.
- An unsized diagnostic is labelled as unquantified, not as proof that its calculation basis is missing.

## QA / Validation

- Red-first: the two focused suites failed seven new assertions before implementation.
- Green: all 40 workspace suites and 411 tests pass, including the focused KPI and actual parent-shell rendering cases.
- Review follow-up: two additional red-first cases pin the projection's `ready_to_act` state and prevent an unsized diagnostic from being described as a missing calculation basis.
- Mutation proof: removing the parent's navigation callback fails the browser-surface suite; restoring substring readiness matching and approval-as-readiness fails the readiness regression case. Both mutations were restored.
- Targeted ESLint: zero errors, one pre-existing unused-variable warning outside the changed behavior.
- TypeScript with Node 24: zero errors. All eleven release checks pass.
- Existing required AI surface control catalog CI already runs both changed suites; no new untracked test suite is introduced.
- Signed-in pre-change inspection verified the monetary-spend versus measured-usage distinction and the contract Evidence checklist. This is UI/read-model proof, not source-ledger or financial certification.

## Rollout Plan

Open a PR, complete applicable CI and review, squash merge to main, and deploy only through the repo-owned ACA main workflow. No data load, migration, environment update, or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow; no ad-hoc Azure runtime writes.
- Approved image digest: record the workflow artifact's digest after deployment.
- ACA runtime invariant: verify the template, healthy 100%-traffic revision, and required workers independently.
- Worker image invariant: workers must match the approved web digest.
- Feature/env flag update path: none needed.
- Live signed-in proof required: Command headline, next-action tile, decision posture, queue drawer, and Evidence navigation at desktop and narrow widths.

## Rollback Plan

Revert this presentation change through a reviewed PR and the same repo-owned ACA main workflow. No tenant-data rollback is required.

## Audit Evidence

The PR and its CI provide public code proof. Focused red/green reports, full workspace results, mutation reports, runtime invariant output, and signed-in screenshots are retained in a private operator proof bundle. Deployment and signed-in proof are pending at candidate creation and must not be inferred from tests or merge.

## Known Gaps

- This change does not supply missing executed terms, service scope, performance history, measured usage, invoice/payment reconciliation, or reproducible calculations.
- Recorded spend divided by monetary commitment is not capacity utilization or invoice-level reconciliation.
- No portfolio total, candidate amount, realized outcome, or industry benchmark is financially certified by this release.
- Contract evidence coverage and decision readiness remain different measures.
