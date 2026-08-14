# 2026-08-14-source-optimize-calculation-run-coverage — Complete Source Optimize calculation traces

## Release ID

`2026-08-14-source-optimize-calculation-run-coverage`

## Status

`candidate`

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
- Pending after merge/deploy: run `source:contract-optimization:spine:apply`
  through the approved ACA private-operator job using the deployed digest, then
  read back the selected canary contract to prove all amount-bearing
  opportunities have calculation runs and calculation lines.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the digest-pinned web image. After deployment, submit the Source
optimization spine projection through the approved ACA data-build job path using
the deployed image digest. Then run data readback and signed-in/browser proof
against the Source Optimize route.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: the Source optimization projection must run through
  `npm run ops:aca-job` against the private operator job, not through a web
  request or local database connection.
- Approved image digest: produced by the workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: private operator job must use the same approved digest
  for the projection run and restore to idle afterward.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, after data readback.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. If projection
rows have already been refreshed, rerun the prior approved projection version or
leave the additive calculation rows in place until an operator-approved data
rollback window. No schema rollback is required.

## Audit Evidence

- PR URL after publication.
- GitHub Actions ACA main deploy run after merge.
- ACA runtime invariant output after deploy.
- ACA private-operator projection proof for the selected canary contract.
- Data readback showing amount-bearing opportunity count, calculation-run count,
  and untraced amount count by contract.
- Signed-in browser proof that amount traceability is visible while separate
  evidence-readiness blockers remain explicit.

## Known Gaps

This release does not resolve missing evidence families, does not approve vendor
outreach, and does not convert negotiated targets or avoided-cost estimates into
realized value. Those remain separate Source Optimize gates.
