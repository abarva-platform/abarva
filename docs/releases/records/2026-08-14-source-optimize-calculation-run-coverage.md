# 2026-08-14-source-optimize-calculation-run-coverage — Complete Source Optimize calculation traces

## Release ID

`2026-08-14-source-optimize-calculation-run-coverage`

## Status

`data-plane-proven`

## Plain-English Summary

Source Optimize can only treat a dollar amount as traceable when the opportunity
has a calculation run behind it. Some opportunity builders produced exact
amounts from governed evidence but did not attach the calculation object that the
projection job persists into the calculation-run and calculation-line tables.

This release extends the shared opportunity builder so invoice exceptions, SLA
credit recovery, scope rationalization, and negotiated-improvement candidates
carry calculation rules, formulas, included lines, and source references just
like the existing rate-variance opportunities. It does not turn estimates into
validated savings, does not hide missing evidence, and does not advance any
workflow gate unless the persisted readback proves the required rows exist.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: no schema change. Existing Source optimization calculation
  tables receive fuller persisted rows when the governed projection job is run.
- Products: Source Optimize and Contract 360 can render amount traceability from
  persisted calculation runs instead of showing an untraced amount.
- Source adapters: the existing projection script now receives calculation
  objects for every amount-bearing opportunity emitted by the shared builder.

## Client Applicability

- All clients: yes, for tenants using the shared Source Optimize Contract
  opportunity spine and projection path.
- Specific clients: none in product logic.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-opportunity.ts`: adds
  calculation rules, formulas, included calculation lines, and source references
  for off-contract invoice exceptions, SLA credit recovery, scope
  rationalization, and negotiated-improvement opportunities.
- `src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts`:
  asserts every amount-bearing opportunity in the golden builder fixture has a
  matching calculation amount.
- `scripts/source/project-contract-optimization-spine.ts`: adds a projection
  guard that fails before write when an amount-bearing opportunity has no
  deterministic calculation or has a calculation output that does not reconcile
  to the opportunity amount. The job proof JSON now reports generated and
  persisted calculation coverage by contract.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts src/lib/source/data-model/__tests__/contract-optimization-traceability.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts --runInBand`
- Pass: `npx eslint src/lib/source/data-model/contract-optimization-opportunity.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts`
- Pass: `./node_modules/.bin/eslint scripts/source/project-contract-optimization-spine.ts`
- Pass: `git diff --check`
- Pass: repo-owned ACA main deploy run `31850829037` completed successfully
  after retry and deployed digest-pinned image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:e7374c2e00007eb43f729265819038501d1c73d4d9b849c3ac0f9804005f89f5`.
- Pass: independent ACA readback showed the web template, 100% traffic
  revision, and delivery worker jobs all on the same deployed digest.
- Pass: private-operator before-readback execution
  `job-abarva-private-operator-eus-y29otqx` returned
  `source_contract_optimization_spine_readback.ok=true` and verified operator
  idle restoration.
- Pass: private-operator projection execution
  `job-abarva-private-operator-eus-0eylvmg` ran
  `source:contract-optimization:spine:apply` on the deployed digest, persisted
  7 optimization opportunities, 6 calculation runs, 150 calculation inputs, 7
  opportunity valuations, 6 evidence requests, 188 source-record snapshots, 436
  canonical fact assertions, and 1 fact conflict, then verified operator idle
  restoration.
- Pass: private-operator after-readback execution
  `job-abarva-private-operator-eus-gkmtvop` returned
  `source_contract_optimization_spine_readback.ok=true` and verified operator
  idle restoration.
- Pass: canary readback basis: the ready-baseline contract has 6
  amount-bearing opportunities, 6 calculation runs, 150 calculation inputs, 12
  calculation outputs, 0 missing calculation opportunities, and 0 mismatched
  calculation opportunities. The conflict-baseline contract has 1 opportunity,
  0 amount-bearing opportunities, 0 calculation runs, and 1 blocker fact
  conflict; no amount was converted to validated value.
- Pass: signed-in browser proof on the current deployed image showed the Source
  Optimize UI rendering the persisted amount traceability: step 7 remained
  blocked on Finance/Tower confirmation while 6 of 6 stated amount rows were
  reproducible from calculation runs.
- Pass: follow-up private-operator readback execution
  `job-abarva-private-operator-eus-wf3w72o` on the deployed digest returned
  `source_contract_optimization_spine_readback.ok=true` for the ready-baseline
  and conflict-baseline canary contracts, then verified operator idle
  restoration.

## Rollout Plan

Merged to `main`. The repo-owned Azure Container Apps main deploy workflow built
and deployed the digest-pinned web image. The Source optimization spine
projection was submitted through the approved ACA data-build job path using the
deployed image digest, followed by independent data readback. Signed-in browser
proof has since passed on the selected Source Optimize route.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: the Source optimization projection must run through
  `npm run ops:aca-job` against the private operator job, not through a web
  request or local database connection.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:e7374c2e00007eb43f729265819038501d1c73d4d9b849c3ac0f9804005f89f5`.
- ACA runtime invariant: passed for the deployed web revision and required
  delivery worker jobs.
- Worker image invariant: private operator job used the same approved digest
  for the projection run and restored to the documented idle image/command
  afterward.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: passed on the selected Source Optimize route.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. If projection
rows have already been refreshed, rerun the prior approved projection version or
leave the additive calculation rows in place until an operator-approved data
rollback window. No schema rollback is required.

## Audit Evidence

- PR URL after publication.
- GitHub Actions ACA main deploy run `31850829037`.
- ACA runtime invariant output after deploy.
- ACA private-operator projection proof:
  `job-abarva-private-operator-eus-0eylvmg`.
- ACA private-operator readback proofs:
  `job-abarva-private-operator-eus-y29otqx` and
  `job-abarva-private-operator-eus-gkmtvop`.
- Data readback showing amount-bearing opportunity count, calculation-run count,
  calculation input/output counts, and untraced amount count by canary contract.
- Signed-in browser proof that amount traceability is visible while the
  Finance/Tower blocker remains explicit.
- Follow-up ACA private-operator readback proof:
  `job-abarva-private-operator-eus-wf3w72o`.

## Known Gaps

This release does not resolve missing evidence families, does not approve vendor
outreach, and does not convert negotiated targets or avoided-cost estimates into
realized value. Those remain separate Source Optimize gates.

Signed-in browser proof is now complete for the selected Source Optimize route.
This release still does not approve Finance/Tower confirmation or convert
negotiated targets into realized value.
