# 2026-08-13-healthcare-tenant-contract-remediation — Rebuild the healthcare package into the column contract

## Release ID

`2026-08-13-healthcare-tenant-contract-remediation`

## Status

`candidate`

## Plain-English Summary

One tenant input package was written in a different shape from the column contract every other
package uses. GATE-08 decided the contract is authoritative and the package gets remediated. This is
that remediation.

The package is rebuilt into the contract shape by copying values from the columns it already has into
the columns the contract declares. Nothing is dropped: every original column is preserved alongside
the contract columns, so the change is additive and reversible by deletion. Nothing is invented:
a contract column is filled only by copying a named source column, and where no such column exists the
cell is left empty and the field is raised as an evidence request.

Result: the package goes from 1 of 19 dimensions matching the contract to **19 of 19**, and from
**22% to 54%** of contract fields carrying a value.

54% is an honest stopping point, not a finished one. The reference package in the same standard sits
at 98%. The remaining gap is 125 contract fields — `annual_budget_usd`, `fte_count`, `criticality`,
`parent_function` and similar — that have no source anywhere in the existing data. Closing that gap
means generating those attributes, which is a different activity from remediation and is deliberately
not done here.

The output is written to the governed intake draft package. **No active tenant root was modified.**

## Layer Impact

Release lane: `client-data-lane`.

- **Layer 1 (Client Intake):** adds a rebuilt, contract-conformant draft of the package under
  `datasets/tenant-inputs/<tenant>/v2026-08-governed-intake/canonical-dimensions/`, plus an evidence
  request log. The active root is untouched and still serves the old shape.
- **Layer 2:** unaffected here, but unblocked — adapters keyed on contract columns now have a
  conformant input to target for this tenant.
- **Layers 3-4:** unaffected. Nothing was loaded or projected.

## Client Applicability

- All clients: no.
- Specific clients: none. Synthetic cover tenant.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/data/remediate-v3-envelope-to-contract.mjs` — new. Carries an explicit, auditable mapping
  table (contract column → named source column, per dimension) and writes the rebuilt package plus a
  remediation summary and evidence request log.
- `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/canonical-dimensions/*.csv` — the
  rebuilt package, 19 files.
- `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/remediation-summary.json`
- `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/evidence-requests-from-remediation.csv`

## QA / Validation

The mapping is only trustworthy if it provably invented nothing, so that was verified independently of
the code that produced it — a separate script re-read both packages and compared them cell by cell.

| Check | Result |
| --- | --- |
| Contract cells checked against their own source row | **28,885** |
| Values with no matching cell in that source row (i.e. invented) | **0** |
| Row-count mismatches between source and output | **0** |
| Original columns dropped or altered | **0** |
| Dimension conformance, before → after | **1/19 → 19/19** |
| Contract fields carrying a value, before → after | **65/286 (22%) → 157/286 (54%)** |
| Reference package in the same standard, for comparison | 283/286 (98%) |
| Evidence requests opened for fields with no source | **129** (125 with no source column at all, 4 mapped but empty at source) |
| `npm run audit:tenant-input-quality` | passes; the active root is unchanged so the existing waiver still applies |
| `npm run release:check` | passed |

The cell-by-cell check is the load-bearing one. Every populated contract value appears verbatim as a
value somewhere in the same source row, which is what "deterministic, not generated" has to mean to be
worth asserting.

## Rollout Plan

Merge to `main`. No runtime rollout and no data-plane action. The rebuilt package is a draft in the
governed intake root; nothing reads it.

Promoting it — replacing the active root, repointing the registry, or loading it — remains `GATE-02`
and needs its own scoped approval, dry run, and readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Delete the generated directory and the script. The source package is untouched, so there is nothing to
restore and no state to unwind.

## Audit Evidence

- Per-dimension counts and file hashes: `.../v2026-08-governed-intake/remediation-summary.json`
- Every unfilled contract field, with whether it had a mapping at all:
  `.../v2026-08-governed-intake/evidence-requests-from-remediation.csv`
- The mapping table itself is source code, in `MAPPINGS` — reviewable line by line rather than
  buried in a data file.

## Known Gaps

- **54% is not parity.** The reference package is at 98%. This release closes the shape gap, not the
  content gap, and the package should not be described as "in sync" with the reference on that basis.
- The remaining 125 fields need attribute generation, not mapping. That is legitimate for a synthetic
  tenant — it is how the reference package reached 98% — but it is a generative act and would
  contradict the GATE-08 constraint if done under the banner of remediation. It needs to be chosen
  explicitly.
- Mappings are same-meaning column copies. Where a mapping would have required interpretation, the
  field was left empty instead. Some of those are arguably recoverable by a human who knows the domain
  — `business_capabilities` from `processes`, for instance — and were left for that judgement rather
  than taken.
- A few mappings are defensible rather than exact: `current_state_notes` from `summary`,
  `automation_opportunity` from `use_case`. They are listed in `MAPPINGS` precisely so a reviewer can
  disagree with them individually.
- The rebuilt package inherits its source's provenance. It is still synthetic, still unattested, and
  conformance does not change that.
- `12_relationships.csv` already conformed and is passed through untouched, so it contributes to the
  conformance count without having been remediated.

## Follow-ups

1. Decide whether to generate the remaining 125 attributes to bring this package to parity with the
   reference, and if so, do it as an explicitly labelled synthetic generation pass.
2. `GATE-02`: promote the rebuilt package once content is at an acceptable level.
3. Resolve the duplicate healthcare tenant registration — two healthcare tenants are registered as
   active, and only one is what the product runs on.
