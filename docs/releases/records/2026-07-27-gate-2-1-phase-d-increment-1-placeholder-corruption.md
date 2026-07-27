# 2026-07-27-gate-2-1-phase-d-increment-1-placeholder-corruption — honest blank, not a guessed fix

## Release ID

`2026-07-27-gate-2-1-phase-d-increment-1-placeholder-corruption`

## Status

`candidate` — writes only to `datasets/tenant-inputs/candidates/<tenant>/gate-2-1-phase-d-v1/`.
Zero writes to `active/current`. No tenant's live data changed.

## Plain-English Summary

Gate 2.1 Phase D, first increment. Fixes a real, confirmed corruption found while validating the
blocker ledger's cross-domain findings (Phase A): `data_assets_integrations.source_system` and
`metrics_outcomes.data_source` are the literal string `"standard_2026_07_v3"` (the v3 template-set
ID, not a system reference) for 100% of rows across apex-retail, first-capital-financial, and
lakeshore-holdings. skyharbor-air's `metrics_outcomes.data_source` carries an analogous residual
literal (`"skyharbor-air-v6-v7-upgrade-candidate-20260710"`). This predates the only commit touching
these active files, so it was never real content -- not something a prior process destroyed.

The fix blanks the confirmed-corrupted values rather than guessing a replacement. An earlier design
considered keyword-matching each row against the tenant's own real `04_applications_systems.csv`
values to backfill a specific system name -- rejected, because no per-row signal survives the
corruption to ground a confident per-row match, and fabricating one would be exactly the "silently
infer unsupported identity" this whole workstream exists to avoid. Blanking converts a
confidently-wrong value into an honestly-blank one: Gate 2's audit now correctly reports
`not_applicable` for the affected cross-domain check instead of a misleading 0%-resolution
"blocker" that looked like real, if broken, data.

## A sibling fix considered and rejected (worth recording so it isn't retried carelessly)

`evidence_sources.source_owner` shows 0% coverage for several tenants in Gate 2. Investigation found
the real active-file rows genuinely do carry owner values (e.g. "VP Store Operations", "CDAO") -- but
rows sharing the same `evidence_location` (the source-grouping key used by
`evidence-v4-migration-dry-run.mjs`) carry *different* owner values. That's the exact
per-citation-stakeholder-vs-shared-source-owner field-role hazard Gate 1.2 already fixed elsewhere.
Passing these values through as source-level ownership would reintroduce that bug (false
source-metadata conflicts), not close a gap. **Not touched.** Left for governed real-content backfill,
not a migration-script change.

## Layer Impact

- `internal-admin` lane, candidate-generation tooling. No layer below "candidate files on disk" is
  touched; `datasets/tenant-inputs/active/**` is completely unchanged (verified by test).

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect. Candidates are not wired into any loader,
  registry, or product surface.

## Changes Included

- `scripts/data-build/tenant-scenario-model/fix-placeholder-corrupted-references.mjs` (new): the
  fix described above, for the 4 affected tenants.
- `scripts/data-build/tenant-scenario-model/__tests__/run-placeholder-corruption-fix-tests.mjs`
  (new, 30/30 passing): proves row count and every other column stay byte-identical to the real
  active file, the corrupted literal is fully removed, and `active/current` itself is never touched.
- `datasets/tenant-inputs/candidates/<tenant>/gate-2-1-phase-d-v1/` (new, 4 tenants): the corrected
  CSVs.
- `reports/tenant-semantic-remediation/placeholder-corruption-fix-report.json` (new): before/after
  counts per tenant/domain/column.

## QA / Validation

- `pass` -- `npx eslint`, zero findings.
- `pass` -- `run-placeholder-corruption-fix-tests.mjs`, 30/30.
- `pass` -- byte-for-byte diff confirms only the target column changed per file; row count and row
  order unchanged.
- `pass` -- confirmed `datasets/tenant-inputs/active/**` file listing is unchanged after running the
  fix.
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable candidate artifact, not a rollout. Not wired into any active loader.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR, or simply delete the `gate-2-1-phase-d-v1` candidate directories -- nothing outside
them and the two new script files was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/tenant-semantic-remediation/placeholder-corruption-fix-report.json`.
- Test suite output (30/30 passing).

## Known Gaps

This increment is deliberately narrow: a safe, zero-fabrication-risk data-hygiene correction. The
rest of Phase D (per the blocker ledger) is materially harder than initially scoped, for reasons
found only by investigating each domain directly:

- **Apex's 3 empty domains** (`infrastructure_platforms`, `service_scope_managed_services`,
  `operational_process_evidence`) have almost no cross-domain grounding to generate from: `04_
  applications_systems.csv`'s `hosting_location`/`deployment_model` columns are blank, and
  `11_risks_controls.business_function`/`07_vendors_contracts.supported_functions` are blank too --
  the "aggregate real facts already present elsewhere" approach that worked for Meridian's Phase C
  adapter has much less real material to draw on here.
- **Apex's thin domains** (`business_functions`, `ai_automation_use_cases`, `industry_context_patterns`,
  `expert_lenses`, `spend_value`, `workforce_roles`) have real, distinct identities per row (e.g. 107
  distinct `pattern_name` values, 58 distinct `use_case_name` values) but nearly every substantive
  field is blank. `applications_systems.business_function` uses a different vocabulary (slugs like
  `"pos"`, `"warehouse"`) than `business_functions.function_name` (`"POS checkout and payments"`,
  `"Supply Chain and Fulfillment"`) -- a fuzzy/keyword cross-reference is possible but not a clean
  join, and needs to be built carefully to avoid the exact boilerplate-content problem Gate 2 was
  built to catch.
- **Meridian's 5 NOT-ADAPTED domains** from Phase C still need real content, not just a schema
  adapter -- `workforce_roles` has zero real rows anywhere in the tenant's data.
- **Interview generation** (folding Phase E into this pass, per the latest instruction) requires
  building genuinely varied, role-grounded content -- the templated-sentence trap Gate 2 measured
  (`template_word_fraction_pct`) is real and must be actively designed against, not an incidental risk.

None of this is a new mystery -- it's exactly the bounded remediation backlog the ledger describes.
It is, however, real design and generation work per domain/cluster, not a single mechanical pass.
Recommend proceeding cluster-by-cluster (Organization, Technology, Transformation, Knowledge, per the
architectural decision) rather than domain-by-domain, so references resolve by construction -- with
Apex as the first tenant proven end-to-end before generalizing to the other four non-Meridian
tenants.
