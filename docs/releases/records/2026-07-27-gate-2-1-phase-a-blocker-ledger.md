# 2026-07-27-gate-2-1-phase-a-blocker-ledger — classify before repairing

## Release ID

`2026-07-27-gate-2-1-phase-a-blocker-ledger`

## Status

`candidate` — a zero-write, read-only classification pass. Nothing about any tenant's actual data or
any consumer script changed.

## Plain-English Summary

Gate 2 ([#5664](https://github.com/abarva-platform/abarva/pull/5664)) found real semantic-quality
defects across all 6 tenants but did not classify *why* each blocker exists. Gate 2.1 begins the
repair -- but its first phase, per the explicit instruction, is to classify every blocker before
touching any data, and specifically to independently validate the cross-domain referential-integrity
checks first, since Gate 2's own release notes disclosed that some of its low resolution rates might
be a rule-mapping defect rather than a real data gap.

This adds `scripts/audit/tenant-semantic-blocker-ledger.mjs`, which reuses Gate 2's `auditTenant()`
directly (no duplicated scoring logic) and classifies every `semantic_blocker`/`semantic_partial`
finding into one of nine blocker classes, with concrete source evidence, a proposed repair, and an
acceptance test. For cross-domain checks specifically, it samples the real field values on both sides
of each declared rule and applies three tests -- is one side ID-shaped while the other holds names
(a rule defect, not a data gap); is a field's value a single repeated template/packet-identifier
literal (a real content defect, not a rule problem); or do both sides hold genuine, simply
unconnected content (a real referential gap) -- rather than assuming any low resolution rate is a
data problem.

## Real findings from validating the cross-domain rules (the required first step)

- **`applications_systems.vendor` → `vendors_contracts.vendor_name` is comparing incompatible
  fields**, not observing broken data: for apex-retail and first-capital-financial, `vendor` holds an
  opaque ID (`VDR-00001`) while `vendors_contracts` has no matching ID column at all -- only
  `vendor_name` (a display name) and `contract_name` (a *different* ID scheme, `APX-VND-001`, that
  doesn't match either). Classified `audit_rule_defect`: no shared ID field currently exists in the
  v3 schema for this domain pair. Do not "fix" this by generating data to make names match; the join
  key itself needs to exist first.
- **A genuine, previously undiscovered content-corruption pattern**: `data_assets_integrations.source_system`
  and `metrics_outcomes.data_source` are the literal string `"standard_2026_07_v3"` (the *template
  set ID*, matching `templateSetId` in the v3 manifest) for 100% of rows, across apex-retail,
  first-capital-financial, and lakeshore-holdings. skyharbor-air's `metrics_outcomes.data_source`
  carries a different but equally bogus literal, `"skyharbor-air-v6-v7-upgrade-candidate-20260710"`
  (a residual packet/file identifier). This traces to whatever process first generated these tenants'
  synthetic seed data -- the value predates the only commit touching these active files
  (`b10b11843`, "Consolidate active tenant inputs"), so it was never a real system reference to begin
  with, not something consolidation destroyed. Classified `synthetic_domain_thin`.
- **Where source values ARE genuinely distinct real content** (lakeshore-industries' and
  skyharbor-air's `vendor` fields hold real names like "Kyriba", "Oracle EPM"; `business_sponsor`
  fields hold real titles like "VP Innovation", "Treasurer") but still fail to resolve, that's
  classified `referential_identity_defect` -- a real gap, correctly attributed, not conflated with
  the two findings above.
- **meridian-health's interview `initiative_link` check resolving at 0% is a downstream consequence
  of finding #1 from Gate 2** (its schema-mismatched `programs_initiatives`/`ai_automation_use_cases`
  domains), not an independent referential defect -- the ledger generator checks whether an entry's
  target domain(s) are themselves schema-mismatched before classifying, so this doesn't get
  double-counted as a separate problem requiring separate work.

## Layer Impact

- `internal-admin` lane, read-only tooling. No layer below "reports on disk" is touched.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect.

## Changes Included

- `scripts/audit/tenant-semantic-blocker-ledger.mjs` (new): the classification script described above.
- `scripts/audit/__tests__/run-tenant-semantic-blocker-ledger-tests.mjs` (new, 27/27 passing):
  classification-logic unit tests plus real-data validation (e.g. confirms apex-retail's vendor check
  really is an `audit_rule_defect` and not a data gap; confirms meridian-health has exactly its 16
  schema-mismatched domains represented as `source_adapter_missing`, not fewer or more).
- `reports/tenant-semantic-remediation/all-tenant-blocker-ledger.csv` (new): 116 classified entries
  across all 6 tenants -- tenant, domain, blocking reason, blocker class, source evidence, proposed
  repair, affected dependent domains, code/data owner, and acceptance test per row.
- `reports/tenant-semantic-remediation/all-tenant-remediation-plan.json` (new): counts by blocker
  class with the phase each class maps to in the Gate 2.1 plan.

## Blocker classification totals (all 6 tenants, 116 entries)

| Blocker class | Count | Maps to |
|---|---|---|
| `synthetic_domain_thin` | 62 | Phase D (governed enrichment) |
| `source_adapter_missing` | 17 | Phase C (Meridian typed adapter) |
| `synthetic_domain_empty` | 9 | Phase D |
| `synthetic_boilerplate` | 9 | Phase D/E (interview generator redesign) |
| `referential_identity_defect` | 8 | Phase B (canonical scenario model with stable IDs) |
| `migration_defect` | 7 | `evidence-v4-migration-dry-run.mjs` code fixes |
| `audit_rule_defect` | 4 | Correct or retire the rule -- explicitly NOT a data-enrichment target |

Per tenant: meridian-health is almost entirely `source_adapter_missing` (17 of 27 entries) --
confirming Gate 2's finding that its problem is structural, not a content gap. apex-retail,
first-capital-financial, lakeshore-holdings, lakeshore-industries, and skyharbor-air are dominated by
`synthetic_domain_thin`, consistent with Gate 2's finding that most of their blockers are real content
gaps needing governed enrichment, not code bugs.

## QA / Validation

- `pass` -- `npx eslint`, zero findings on both new files.
- `pass` -- `run-tenant-semantic-blocker-ledger-tests.mjs`, 27/27.
- `pass` -- every one of the 116 ledger rows carries a nonblank `proposed_repair` and
  `acceptance_test`; every `blocker_class` value is one of the nine declared classes.
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Per the explicit Gate 2.1 sequencing, Phase B
(the universal canonical scenario model) does not begin data-shape design until this ledger is
reviewed -- particularly the 4 `audit_rule_defect` entries, which must be corrected or retired before
any related data is "enriched" to satisfy them.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside `reports/tenant-semantic-remediation/` and the two new script files
was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/tenant-semantic-remediation/all-tenant-blocker-ledger.csv` -- the full classified ledger.
- `reports/tenant-semantic-remediation/all-tenant-remediation-plan.json` -- counts and phase mapping.
- Test suite output (27/27 passing).

## Known Gaps

- The `audit_rule_defect` classification identifies that no ID-based join key currently exists for
  `applications_systems.vendor` ↔ `vendors_contracts` in the v3 schema -- it does not yet propose
  *which* field should carry that ID or where it comes from. That decision belongs to Phase B's
  scenario-model design.
- `looksLikePlaceholderConstant()`'s detection is pattern-based (template/packet/schema/manifest-shaped
  literals, or the specific `-v6-v7-upgrade-candidate-` residual pattern found in skyharbor-air) --
  it will not catch every possible leftover-constant defect, only the ones matching these observed
  shapes. A manual skim of `synthetic_domain_thin` entries during Phase D is still warranted.
- Phases B through G (canonical scenario model, Meridian adapter, targeted enrichment, interview
  redesign, evidence repair, versioned candidate build + Gate 2 rerun) have not started.
