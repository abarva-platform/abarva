# 2026-08-17-tower-canonical-reconciliation — Tower reads canonical alongside its mart

## Release ID

`2026-08-17-tower-canonical-reconciliation`

## Status

`candidate`

## Plain-English Summary

Tower reads seven `consumption.tower_*_v1` views fed by ten collectors against live operational
systems. That pipeline works and this does not replace it — replacing metered telemetry with declared
client figures would be a downgrade, because the mart knows what was actually spent.

What was missing is the other half. The client's own declared technology budget, vendor book and
programme portfolio sit in canonical and reached no product, so Tower could report what it metered
and nobody could ask why that differed from what the client said they would spend.

Both bases now sit side by side with the gap computed. Under the fact authority rules that gap is
**`VARIANCE`, not `CONFLICT`** — a declared budget and an observed actual disagreeing is not an error
to suppress, it is usually the most interesting number on the page. `CONFLICT` stays reserved for two
sources of the *same* basis disagreeing.

## Layer Impact

**Release lane: `client-data-lane`.** Read-path only.

- **Layer 3:** unchanged.
- **Layer 4:** Tower's mart unchanged and still authoritative for observed values. Tower additionally
  reads the shared canonical projection.
- **Runtime:** a declared-vs-observed panel renders above the command centre.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `src/lib/tower/canonical-reconciliation.ts`
- `src/app/(maestro)/tower/page.tsx`

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, confirm on the signed-in surface for both tenants.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow. No job, no data write.

## Rollback Plan

Revert. Tower returns to mart-only, which is where it was.

## Audit Evidence

- The commit and its PR.
- The panel names its canonical build version on screen, so a reader can trace any figure to a build.

## Known Gaps

- **The panel renders above the command centre rather than inside it.** Deliberate: the mart's figures
  are metered and these are declared, and two numbers with different provenance in one row invite a
  reader to treat them as one measure. Weaving them together needs a design decision, not a layout
  change.
- **Third-party contract value has no observed counterpart** — the mart carries no vendor total — so
  it shows as `declared_only` rather than a variance.
- **`"Updated Aug 9, 2026"` is still frozen** in the Tower header (`TowerCommandCenter.tsx:60`). It is
  the one hardcoded literal on Tower's render path and it reads as an as-of claim regardless of the
  actual refresh.
- **The real fix is still ahead.** The ten collectors should write canonical facts with
  `basis: observed`, at which point declared and observed live in one model and the Tower mart becomes
  a projection of canonical rather than a parallel chain. This release makes the gap visible; it does
  not yet close the chain.
