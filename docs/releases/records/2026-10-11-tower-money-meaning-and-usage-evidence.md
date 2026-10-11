# 2026-10-11-tower-money-meaning-and-usage-evidence — Clarify Tower money and usage proof

## Release ID

`2026-10-11-tower-money-meaning-and-usage-evidence`

## Status

`candidate`

## Plain-English Summary

Tower now names approved funding as funding, keeps it separate from money already spent, and stops presenting a Finance review amount or a sourcing opportunity as proof of tool usage. Where the usage amount is not supported by independent evidence, the page says that it is not measured. A repeated chart is removed until an independent spending category is available. Records explicitly marked as illustrative carry a plain-language notice across the Tower tabs.

## Layer Impact

**Release lane: `global-control-lane`.**

- **Layer 4 (Products):** Tower labels, presentation, and read rules change. Future Tower projection builds keep Finance review and opportunity amounts separate from usage-supported value. The Tower intake-lineage report distinguishes annual spend from an approved budget.
- **Layers 1–3:** No intake, adapter, or canonical record changes. The existing source mismatch still needs a separate governed reconciliation.

## Client Applicability

- All clients: the Tower display and read rules apply wherever this surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: the projection-builder corrections affect future demo builds; this release does not run one.
- Feature flag: no new flag.

## Changes Included

- Tower money labels, usage-proof display, and distribution chart.
- Tower reader and projection-builder handling of usage-supported amounts.
- Tower intake-lineage report mapping of annual spend and approved budget.
- Focused tests and this release record.
- No database load, migration, or runtime data mutation.

## QA / Validation

- Six focused Tower and Source-bridge Jest suites passed (113 tests). The business-case field-survival check, targeted ESLint, TypeScript typecheck, and `git diff --check` passed. ESLint reported four existing unused-symbol warnings in the Source bridge and no errors.
- The active-intake Tower fact-lineage report was run in quote and migration-audit modes. Approved IT budget is absent in active intake; the one-source annual-spend amount is a different measure. Migration audit still finds conflicting promised-benefit assertions, so no such intake amount is quoted.
- The Source read-model lineage check could not reach the private database from this workstation. Source opportunity amounts remain unverified here.
- Signed-in browser proof was captured before this candidate; post-deploy proof is required before claiming the correction is live.

## Rollout Plan

Merge the reviewed PR to `main`. The repo-owned ACA main deploy workflow will build and promote the merged image. Read-time safeguards take effect with that image. Run a separately authorized, tenant-scoped projection rebuild and readback before calling stored usage values repaired. Reconcile intake and projection facts at matching IDs and periods before restoring a budget headline.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this candidate.
- Approved image digest: record after the main deploy workflow runs.
- ACA runtime invariant: verify web template, 100% traffic revision, and required worker images against the approved digest.
- Worker image invariant: verify after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: Tower money and usage labels across the verdict, funding, AI, tools, foundations, and decisions views.

## Rollback Plan

Revert the PR and release the reverted SHA through the repo-owned main deploy workflow. No data rollback is required because this candidate does not rebuild stored projections.

## Audit Evidence

- PR diff, local validation, Tower fact-lineage reports, and post-deploy signed-in observations.
- A future projection rebuild needs its own job proof, readback, and review record.

## Known Gaps

- Current intake and the loaded Tower demo projection have not been reconciled at the same fact grain and period. The budget amount remains withheld.
- The projection needs an explicit scenario/provenance flag on each headline. The current notice relies on declared row quality states, which do not prove every aggregate's source basis.
- The sample annual-benefit estimate was generated from a planning return assumption. It is not an independently measured outcome.
- The summary projection cites fewer source rows than it aggregates; its full row-level lineage needs repair. Claim counts and program-dollar totals also cover different row populations, so the display does not present their ratio as a success rate.
- Existing projection rows require a governed rebuild to clear the stored usage field; a web release alone does not rewrite them.
- Tool costs are not loaded. The product cannot infer license savings from user counts.
- Sourcing opportunity amounts still need their owning read-model lineage and Finance confirmation before they can be presented as realized value.
