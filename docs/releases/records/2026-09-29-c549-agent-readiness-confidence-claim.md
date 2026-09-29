# Release record — correct the Agent readiness drill-down confidence claim by rendering it (C-549)

## Release lane

`global-control-lane` — audit documents and tests only. No product file changed.

## What changed

The legal AI-generated UI catalog answered "Confidence / assumption disclosure present?" for the
Agent readiness drill-down with "Yes: deterministic source caption and generated timestamp". A
caption saying a view is not live execution, and a hardcoded date, say where the page came from;
neither tells a reader how far to trust a readiness verdict.

A new suite renders the real component over the real builder and measures three facts:

1. The render carries exactly what the legal row cited — the prepared-review caption and the
   generated date — so the rest of the measurement is not over an empty page.
2. No rendered text is a confidence value, a certainty or assumption statement, or a percentage.
   The only confidence text on the page is the component's own `confidence_scoring` factor, which
   reports that capability as deferred ("modeled but not wired").
3. No non-test source file imports the component, and the unreachable-components baseline lists it,
   so no reader can open the screen at all.

The legal cell now reads `Partial` with those facts, and the next-control column says to mount the
drill before claiming any disclosure on it. Because the cell no longer starts with `Yes`, the control
catalog gate no longer derives a claim from it, so the matching `uncatalogued` coverage row is removed
from `docs/security/ai-surface-control-catalog.json`. The per-bucket tally pinned in
`catalog-claim-binding.test.ts` moves `deferredWithJoin` 11 → 10 with the reason written beside it.

## Layer impact

None of the four data layers. Audit documents (legal catalog, control catalog) and tests.

## Client applicability

No client. The component is unmounted and reads a static builder; no tenant data is read.

## QA / validation

- New suite red first on the base: 1 failed of 4 (the legal-cell case); 4 of 4 after.
- Mutations, each confirmed to change a file before the run, each failing exactly its own case:
  component renders `Confidence 80%` → the no-disclosure case; a page imports the component → the
  mounted-by-nothing case; the builder reports `confidence_scoring` as `ready` → the no-disclosure
  case; legal cell restored to `Yes` → the legal-cell case.
- Control catalog gate (`audit:ai-surface-controls`): exit 0 on the whole change; exit 1 on each
  half-edit (legal `Yes` with the coverage row removed: "missing catalogClaimCoverage entry";
  coverage row kept with the legal cell `Partial`: "does not match a current legal catalog claim").
- `uncatalogued` coverage rows: 5 → 4.
- The new suite sits in `src/components/admin/__tests__`, which the `unit-suites.yml` admin step
  runs by directory on every pull request.

## Rollout

Merges through the normal PR path. Nothing renders differently; the deploy carries no behaviour
change.

## Rollback

Revert the squash commit. The gate is satisfied in both states because the legal cell and the
coverage row move together.

## Audit evidence

The PR's check runs, the admin step's job log naming the new suite, and this record.
