# 2026-08-13-gate08-column-contract-authoritative — GATE-08 decided: the column contract is authoritative

## Release ID

`2026-08-13-gate08-column-contract-authoritative`

## Status

`candidate`

## Plain-English Summary

One active tenant input package does not match the column contract that the other six match. Until
now the open question was which one is right: fix the package, or change the contract. That fork
blocked every downstream layer, because adapters, canonical loading, and product projections all
depend on knowing which shape is the target.

It is decided. **The column contract is authoritative.** The non-conforming package is remediated to
the contract; the contract is not amended.

The decision is recorded with its evidence in the governance plan, the waiver in the quality gate now
cites it, and the gated apply plan is updated so nobody re-litigates it.

This release also closes a hole in the conformance gate that the analysis exposed. The gate checked
that declared columns were *present*. It did not check whether they carried anything. A package could
therefore have been "remediated" by adding the contract columns and leaving them all blank — the gate
would have gone green while nothing improved. The gate now reports, per tenant, how many contract
fields actually carry a value.

## Layer Impact

Release lane: `client-data-lane`. A Layer 1 governance decision plus a reporting improvement to the
Layer 1 validation gate. No `global-control-lane` behaviour, product surface, or runtime path is
affected, and no tenant data file was written.

- **Layer 1 (Client Intake):** the target schema for tenant input packages is now settled. The gate
  reports contract field fill rate alongside shape conformance.
- **Layers 2-4:** unaffected by this release, but unblocked by the decision — adapter work now has a
  known target shape.

## Client Applicability

- All clients: no.
- Specific clients: none. The affected package is a synthetic cover tenant.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## The Decision And Its Evidence

| Evidence | Finding |
| --- | --- |
| Conformance across active tenants | 6 of 7 conform 19/19. Amending the contract would make six packages non-conforming to accommodate one. |
| Registry policy | `universalTemplateStandardV3IsOnlyApprovedStandard: true` already declares this contract the only approved standard. |
| Expressive power | The non-conforming shape is a governance wrapper with no `annual_spend_usd`, `term_start`, `term_end`, `renewal_date`, `fte_count`, or `criticality`. The questions Source and Tower exist to answer are unanswerable from it — not because values are missing, but because there is nowhere to put them. |
| Provenance | The non-conforming rows declare `source_type: synthetic_v3_context_generation`. It is a generation artifact, not client evidence. There is no client to renegotiate a schema with. |
| Information density | Contract fields carrying at least one value: 99% for the two packages generated to the contract, 23% for the non-conforming one. |
| Coexistence | Conforming packages already carry provenance columns *on top of* contract columns, and the gate permits extras. Governance metadata and the contract are not in tension. |

The remediation is therefore additive: the package needs contract columns present and populated
alongside its governance columns, not its governance columns stripped.

**Binding constraint:** where a contract column has no deterministic source, it must be left empty and
raised as an evidence request — never inferred, back-filled from narrative text, or generated. Money,
counts, and dates are deterministic or they are absent.

## Changes Included

- `docs/governance/TENANT_CONTEXT_SINGLE_SOURCE_OF_TRUTH_REDO_PLAN_2026-08-12.md` — adds the GATE-08
  Decision section with evidence, the binding constraint, and an explicit statement of what the
  decision does *not* authorise. Marks the related open findings closed.
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/quality-depth-rules.json` — the
  waiver reason and remediation now cite the decision and state the additive remediation path.
- `reports/tenant-layer-refresh-2026-08-12/gated-apply-plan.md` — GATE-08 marked decided.
- `scripts/audit/tenant-input-quality-depth.ts` — reports contract field fill rate per tenant.

## QA / Validation

| Check | Command | Result |
| --- | --- | --- |
| Gate still passes | `npm run audit:tenant-input-quality` | passed, 7 active tenants audited |
| Fill rate is discriminating | full run | 99%/99% for the two contract-generated packages, 58-59% for three older ones, 23% for the non-conforming one |
| Types | `npx tsc --noEmit` | clean for the changed file |
| Lint | `npx eslint` on the changed file | clean |
| Release control | `npm run release:check` | passed |

The fill-rate figures are the load-bearing evidence for the decision, so they were computed
independently before being built into the gate, and the two methods agree.

## Rollout Plan

Merge to `main`. No runtime rollout. The decision takes effect as governance immediately; the data
work it authorises is separately gated.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not used.
- Live signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The decision reverts to open and the gate returns to reporting shape without
fill rate. No tenant data is affected, because none was written.

## Audit Evidence

- Decision and evidence table: GATE-08 Decision section of
  `docs/governance/TENANT_CONTEXT_SINGLE_SOURCE_OF_TRUTH_REDO_PLAN_2026-08-12.md`.
- Fill rate per tenant: `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.md`,
  "Column Contract Conformance".
- Per-column detail including which declared columns are entirely empty:
  `reports/canonical-tenant-inputs/latest/tenant-input-quality-depth.json`.

## Known Gaps

- The decision settles the target shape. It does not perform the remediation, and it does not make the
  non-conforming package conformant. That package is still at 23% and still waived until 2026-09-30.
- Fill rate is reported, never enforced. Enforcing a threshold would be arbitrary and would invite
  padding columns with filler to clear it, which is the failure mode this metric exists to expose.
- Fill rate counts a column as populated if *any* row carries a value. A column populated in one row
  out of a thousand reads the same as one populated throughout.
- The measurement surfaced a separate finding not addressed here: three structurally conformant
  packages sit at 58-59% fill. They pass every gate. Whether that is legitimately sparse data or
  quiet under-population is unexamined.
- The decision assumes the non-conforming package's content is regenerable, on the strength of its own
  `source_type: synthetic_v3_context_generation` provenance. If any of it turns out to be
  hand-curated and not reproducible, the remediation plan needs revisiting before regeneration, not
  after.

## Follow-ups

1. Build the remediation: map the non-conforming package into the contract shape deterministically,
   leave unsourced columns empty, and raise the gaps as evidence requests. Regeneration and any
   active-root repoint remain `GATE-02`.
2. Examine the three packages sitting at 58-59% fill and establish whether that is expected.
3. Decide, per script, which of the 187 `audit:*/validate:*` npm scripts are gates and which are
   on-demand evidence, and make the distinction explicit.
