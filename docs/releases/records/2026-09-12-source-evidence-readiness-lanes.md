# 2026-09-12-source-evidence-readiness-lanes — Readiness reads the evidence that exists

## Release ID

`2026-09-12-source-evidence-readiness-lanes`

## Status

`draft`

## Plain-English Summary

Optimize told operators to collect eight evidence families on contracts that
already held hundreds of loaded evidence rows. One managed-services agreement
showed "No required evidence family has governed evidence yet — collect
Contract Baseline, Invoice Summary, Invoice Exceptions, SLA Performance, Usage
/ Demand Volumes, Staffing Model, Change Orders, Renewal Terms" while carrying
24 loaded spend months, 72 service-performance periods, 64 document
extractions and 54 document files.

Readiness scored each contract only from the optimization evidence ledger. That
ledger is a curation surface — a reviewer adds an item when attaching evidence
to an opportunity — and nothing populates it at load time. So no amount of data
loading could ever move that count: nothing was reading the lanes the loads
filled.

Readiness now also considers the evidence on the contract's own projection
lanes. Service levels are satisfied by loaded performance periods, invoices by
loaded spend months, scope by loaded scope rows, and so on. A family with no
lane that speaks to it stays missing, which is the honest state.

Provenance is kept distinct: a family satisfied this way is marked
system-evidenced from the projection and is never promoted to document- or
human-verified. A projection row is not a reviewed document.

Also fixes two things on the same card: database identifiers rendering as
English prose, and a characterisation that did not say it was derived.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** The readiness derivation and two
  presentation defects.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched; no stored value changes. What changes is which loaded
  rows the readiness derivation consults.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `contract-optimization-evidence-readiness.ts` — adds
  `ContractEvidenceLaneCounts` and a family-to-lane map. A required family can
  now be satisfied by the contract's loaded rows when the curation ledger holds
  nothing for it, at `system_evidenced` and no higher.
- `buildViewModel.ts` — passes the real lane counts: scope rows, spend months,
  invoiced months, performance periods, document rows, contract-scoped term
  rows, renewal/notice term rows, and change orders. A register header or end
  date alone cannot satisfy the term families.
- `WorkspaceExecutiveShell.tsx` — `withoutIdentifierTokens` strips snake_case
  database values from text meant to read as English; the purpose card now
  names its basis, so a derived characterisation no longer speaks in the same
  voice as a reviewed extraction.
- Tests: lane-satisfaction cases built from the row counts observed live, plus
  identifier-stripping and purpose-provenance cases.

## QA / Validation

- Diagnosed against the live API. The contract detail returned
  `ledger_items: 0` beside `spendMonths: 24`, `performancePeriods: 72`,
  `docExtractions: 64`, `documentFiles: 54` — 214 governed evidence rows, none
  of which readiness consulted.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint` on the workspace directory and data-model — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence
  src/lib/source/data-model` — 41 suites, 321 tests, passing.
- The existing performance-formatting tests caught an over-corrected attempt at
  the purpose card: withholding the composed characterisation also withheld the
  scope phrase taken from the contract's own title, which is legitimate prose.
  The fix names provenance instead of withholding information.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On a managed-services contract with
  loaded evidence, confirm Optimize no longer instructs the reader to collect
  families the contract holds, that the remaining named families are ones with
  no lane behind them, and that no snake_case identifier appears in the purpose
  card.

## Rollback Plan

Revert and redeploy. No migration and no data change.

## Known Gaps

- **Three families still have no lane.** Invoice exceptions, ticket volume and
  staffing model are not carried on any projection lane, so they remain missing
  until a reviewer attaches evidence. That is correct, and it means a contract
  can still be reported as short of required evidence — just truthfully, and
  about a much smaller set.
- **The curation ledger remains unpopulated at load time.** This release stops
  readiness depending solely on it; it does not fill it. Attaching loaded rows
  to opportunities is what would raise a family above system-evidenced, and
  that is reviewer work.
- **The required-family list is still not archetype-applicability aware.** It
  can name service levels for a contract type whose Performance facet is
  declared not required. Now that lanes satisfy families, the practical effect
  is smaller, but the two models still disagree.
- **Identifier stripping is a defence, not a cure.** The underlying field holds
  concatenated enum values; the right fix is at the load path that composes it.

## Audit Evidence

- Commit on branch `claude/source-evidence-readiness-lanes`.
- CI run for the PR, including `npm run release:check`.
- Live diagnosis and local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
