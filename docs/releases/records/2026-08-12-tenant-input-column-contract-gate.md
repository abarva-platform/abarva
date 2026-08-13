# 2026-08-12-tenant-input-column-contract-gate — Column contract conformance in the tenant input quality gate

## Release ID

`2026-08-12-tenant-input-column-contract-gate`

## Status

`candidate`

## Plain-English Summary

The tenant input quality gate checked that each canonical dimension file existed and had enough rows.
It never checked that those rows carried the columns the template contract declares. A package could
therefore be full of data, pass the gate, and still be unreadable to every source adapter — because
the adapters look for contract column names that were not there.

That is not hypothetical. One active package has been carrying a generic
`record_id / context_item / dimension / evidence_id` governance schema instead of the per-dimension
contract columns across 18 of its 19 dimensions, and it passed the gate every time it ran.

This adds the missing check. For every active tenant, each declared dimension is resolved in the
active input root and its header row is compared against the declared columns. The gate now fails on
nonconformance unless there is a dated waiver naming an owner, a reason, an expiry, and a remediation
path — and it fails when a waiver expires, when a waiver is no longer needed, and when a waiver names
a tenant that is not active.

The one known nonconforming package is waived until 2026-09-30 so this lands without red-lining every
PR. New drift fails immediately.

## Layer Impact

Release lane: `client-data-lane`. The change is confined to a Layer 1 validation script and its rule
file. No `global-control-lane` behaviour, product surface, or runtime path is affected.

- **Layer 1 (Client Intake):** the quality gate now validates dimension shape in addition to presence
  and row depth. No tenant data was read for any purpose other than reading header rows, and no tenant
  file was written.
- **Layers 2-4:** unaffected.

## Client Applicability

- All clients: no. This is a CI validation gate.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-input-quality-depth.ts` — adds `columnConformanceForTenant`, a quote-aware
  header reader, waiver evaluation, failure conditions, and a Column Contract Conformance section in
  the generated report.
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/quality-depth-rules.json` — adds
  `columnContractWaivers` with one dated entry.

## QA / Validation

The gate is only worth having if it fails when it should. Each failure condition was exercised against
real repository state, not a fixture:

| Scenario | Expected | Result |
| --- | --- | --- |
| Baseline, waiver present and valid | pass | passed, 7 active tenants audited |
| Waiver removed | fail on the real defect | failed: 18 nonconforming dimensions named, with per-file missing-column counts |
| Waiver expiry set to a past date | fail on expiry | failed, quoting the expiry date and the remediation path |
| Waiver added for an already-conformant tenant | fail as unnecessary | failed, asking for the waiver to be removed |
| Waiver naming a non-active tenant | fail as stale | failed, plus the underlying defect resurfaced |
| Restore baseline | pass | passed |

Other checks:

| Check | Command | Result |
| --- | --- | --- |
| Discrimination | full run across all 7 active tenants | 6 tenants 19/19 conformant; 1 tenant 1/19 with 18 column gaps and 2 filename drifts |
| Lint | `npx eslint scripts/audit/tenant-input-quality-depth.ts` | clean |
| Types | `npx tsc --noEmit` on the changed script | clean |
| Release control | `npm run release:check` | passed |

## Rollout Plan

Merge to `main`. No runtime rollout: this is a CI-time validation script. The repo-owned ACA main
deploy workflow will build and deploy on merge as it does for every commit; the resulting revision is
behaviourally identical.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime image contract change.
- ACA runtime invariant: unchanged by this release.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no — no signed-in surface changes.

## Rollback Plan

Revert the squash commit. The gate returns to depth-only checking and no tenant data is affected,
because nothing was written to any tenant file.

## Audit Evidence

- Generated report: `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.md`, section
  "Column Contract Conformance".
- Machine-readable per-tenant detail, including every missing column name:
  `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.json`, `tenants[].columnContract`.
- Underlying analysis that surfaced the defect:
  `reports/tenant-layer-refresh-2026-08-12/claim-reconciliation-matrix.csv` (`SCHEMA_GAP` rows).

## Known Gaps

- Conformance is checked on the header row only. A file can declare the right columns and still leave
  them empty; row-level completeness is not asserted here.
- Extra columns beyond the contract are counted but never fail the gate. Tenant packages legitimately
  carry provenance columns on top of the contract, so treating extras as errors would be wrong.
- Dimension resolution falls back to the `NN_` filename prefix when the exact contract filename is
  absent. That is what lets filename drift be reported rather than misread as an absent dimension, but
  it means a wildly misnamed file sharing a prefix would be matched to that dimension.
- The waiver mechanism is local to this gate rather than routed through
  `docs/governance/policy-exceptions.json`. It is deliberately placed in the registry-referenced rule
  file that this audit already reads, but that does mean there are now two exception surfaces in the
  repository.
- The waiver defers a decision it cannot make. Whether the contract or the nonconforming package is
  authoritative is `GATE-08` and needs a human.

## Follow-ups

1. Resolve `GATE-08` and remove the waiver. The gate will fail on 2026-10-01 if nobody does.
2. Consider consolidating this waiver surface with `docs/governance/policy-exceptions.json` if a third
   exception mechanism ever appears.
