# 2026-09-09-source-optimize-lever-table — Source Optimize Lever Table

## Release ID

`2026-09-09-source-optimize-lever-table`

## Status

`proposed`

## Plain-English Summary

The Contract 360 Optimize tab reported how many levers a contract had and what they were worth in total, but never showed what any individual lever actually asks for. The negotiation detail for each opportunity — the ask, the language to use, the concession the vendor can make, the timing dependency and the owning role — was already parsed by the read adapter and then discarded at the workspace view-model boundary. This release carries that detail through and renders it as a lever table, so a reader can see what to negotiate rather than only how many negotiations exist.

Two related presentation corrections ship with it. The portfolio fact strip no longer renders on a single-contract view, where book-level totals sat above one agreement's detail. And a contract's value-type panel now leads with the value types that carry a figure and states the absence of the others as a finding, instead of listing several rows that all read "Not established".

## Layer Impact

Layer 4 Products: Source presentation only. The change adds fields already present on the canonical opportunity record to a view-model projection and renders them. No loader, adapter, canonical record, migration, or data-plane write is affected.

## Client Applicability

- All clients: Source workspace Contract 360 Optimize and Evidence panels.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Carries `buyerAsk`, `negotiationLanguage`, `vendorConcession`, `timingDependency`, `riskIfIgnored` and `priority` from the canonical opportunity record into the workspace opportunity projection.
- Renders a lever table on the Optimize tab: current ask, vendor concession, worth, owner and timing, one row per lever.
- Reports sized and signal-stage value separately in the executive strip, so rows without defensible figures cannot inflate a headline.
- Withholds a dollar figure from signal-stage rows and labels why.
- Hides the portfolio fact strip when a single contract is selected.
- Rewrites the contract value-type panel to lead with established value types and state absent ones as a finding.
- Adds behavioral regressions for lever-row selection, sized-total exclusion of signal rows, value-type summarisation with and without recoverable value, and the portfolio-strip altitude guard.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` — pass, 35/35.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — pass.
- `npm run release:check` — to be run before merge.
- Live signed-in Source workspace smoke — to be run on the deployed image.

## Rollout Plan

Merge by pull request into `main` and roll out through the repo-owned Azure Container Apps main deploy workflow. No migration, loader, feature flag, or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production web rollout.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: to be recorded at deploy time.
- ACA runtime invariant: to be proved after deploy.
- Live signed-in proof: Contract 360 Optimize lever table, executive strip totals, contract value-type panel, and absence of the portfolio strip on a selected contract.

## Rollback Plan

Revert the Source presentation commit and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required because this change only projects and renders fields that already exist on the canonical opportunity record.

## Audit Evidence

Pull request, CI checks, deployment workflow run, workflow evidence bundle, independent ACA runtime-invariant proof, and live signed-in Source workspace smoke-test notes.

## Known Gaps

The lever table renders only the negotiation fields the canonical record carries. Two fields present in upstream source packages, `target_term` and an explicit benchmark comparator, are not modelled on the opportunity record, so the table can state an ask but cannot yet show the target term beside the current one or cite market data behind a rate ask. Contracts whose opportunity rows carry no negotiation detail render no table rather than an empty one; those rows remain visible in the executive strip counts. This release does not change portfolio denominators, vendor ranking, concentration math, or any finance-confirmation gate.
