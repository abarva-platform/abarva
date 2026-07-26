# 2026-07-26-evidence-sources-consolidation-defect-fix — tenant-input consolidation collapsed distinct evidence sources

## Release ID

`2026-07-26-evidence-sources-consolidation-defect-fix`

## Status

`candidate` — verified locally via regression suite, not yet merged. Consolidation itself was NOT
re-run; no `active/current` file was modified.

## Plain-English Summary

Found while investigating why several Home V4 dimensions render with no material-specific content
for SkyHarbor: `scripts/data-build/consolidate-active-tenant-inputs.mjs` (the one-time migration
that built today's `active/current` tenant-input CSVs) had a confirmed transformation bug in the
`evidence_sources` domain. It treated `source_file` as pure lineage metadata — correct for every
other domain — and unconditionally overwrote it with the physical path of the file being
consolidated. For `evidence_sources`, `source_file` is the row's *business identity* (which
evidence artifact this row describes), so every row consolidated from the same input file collapsed
onto the same identity, and the consolidation's own conflict resolution silently discarded all but
one candidate's fields per column. Confirmed directly from `reports/tenant-input-consolidation/latest/conflict-resolution-report.json`
(the historical run's own audit trail): apex-retail rows with distinct `original_row_id`s
(`APX-INIT-002` through `-005`) collided and merged into one row.

Two further defects found during review of the initial fix:
1. The first fix version fell back to the consolidation-time path when a row had no semantic
   `source_file` of its own — which recreates the same defect one level down (turns "the evidence
   source is unknown" into "the evidence source is `13_evidence_sources.csv` itself," which is
   exactly the self-reference visible in SkyHarbor's current active rows). Removed; a row with no
   semantic identity is now left empty and flagged `missing_evidence_source_identity`.
2. Some historical rows in this domain aren't corrupted source-registry rows at all — they're
   citation-shaped records (carrying `evidence_id`, `evidence_location`, etc.) that belong to a
   different, not-yet-built "evidence item" entity, wrongly generated into the source-registry file.
   Silently merging or silently accepting these as valid sources would hide that. A new hard gate
   (`hybrid_evidence_contract`) rejects any `evidence_sources` row carrying citation-level fields
   outright.

## Layer Impact

- `internal-admin` lane: this is a one-time tenant-input migration script, not a runtime code path.
  The fix only changes behavior for a *future* re-run of this consolidation; it does not retroactively
  repair the already-collapsed historical rows in `active/current` for the affected tenants (a
  separate governed-backfill decision, tracked and not part of this change).

## Client Applicability

- Internal only. No tenant-facing behavior changes as a result of this PR by itself.

## Changes Included

- `scripts/data-build/consolidate-active-tenant-inputs.mjs`:
  - `mapRow()`: domain-specialized `source_file` handling for `evidence_sources` — preserves the
    row's own semantic value; no fallback to the consolidation-time path (a row with none is left
    empty and flagged `__validationFailure=missing_evidence_source_identity`, recorded to a new
    `reports.missingEvidenceSourceIdentity` list).
  - New `assertNoHybridEvidenceCitationFields()` / `HybridEvidenceContractError`: hard-rejects any
    `evidence_sources` row carrying citation-level fields (`evidence_id`, `source_row_id`,
    `evidence_location`, `locator`, `claim`, `citation`, `excerpt`). Caught at the call site and
    recorded to `reports.hybridEvidenceContractViolations`; the row is skipped, never merged.
  - `primaryKeyByDomain.evidence_sources`: dropped `source_type` (never a valid identity component —
    multiple distinct artifacts can share a kind) and added a temporary, v3-compatibility-only
    `__sourceVersionKey` (`as_of_date`, falling back to `source_date`) so two snapshots/versions of
    the same artifact don't collapse into one row. Explicitly documented as imperfect — the real
    fix is the v4-candidate schema's `source_id`/`source_version_id` split (separate, larger change,
    not included here).
  - Added `export { ... }` + `isDirectlyExecuted` guard so the script's pure functions can be
    imported for testing without triggering a real consolidation run (it previously executed
    unconditionally on import).
- `scripts/data-build/__tests__/run-evidence-sources-consolidation-tests.mjs` (new, 20/20 passing):
  covers no-false-merge across distinct artifacts, no-fallback-to-consolidation-path, the hybrid
  contract gate, the source-version-aware key, and confirms the 18 other domains' `source_file`
  handling is unchanged.
- `scripts/audit/tenant-canonical-data-consolidation-audit.mjs` (new): read-only, all-registry-tenant
  audit that measures canonical tenant-input data quality on two independent axes (content quality:
  `canonical_sufficient`/`canonical_partial`/`placeholder_dominant`/`canonical_empty`/`schema_invalid`;
  provenance: `provenance_complete`/`canonical_only_no_predecessor`/`registered_source_field_loss`/
  `migration_omission`/`conflict_resolution_review`/`predecessor_requires_review`/
  `provenance_unresolved`), separates the 114-cell canonical universe (6 tenants × 19 manifest
  domains) from a 26-cell auxiliary/ungoverned-artifact universe (undocumented `SA02`/`SA04`/
  `SA08`–`SA11` files), and emits a hard-failing `audit-universe.json` reconciliation gate so a
  stale tenant alias or unexplained cell-count drift is caught rather than silently trusted.
- `reports/tenant-inputs/`: this audit's output (`audit-universe.json`,
  `all-tenant-canonical-data-yield.json`, `all-tenant-source-field-loss-matrix.csv`,
  `all-tenant-consolidation-provenance.html`, `canonical-backfill-plan.json`) — the pre-fix baseline,
  since the fix does not change any already-consolidated `active/current` data.

## QA / Validation

- `pass` — `npx eslint`, zero new findings (2 pre-existing unrelated warnings only).
- `pass` — `run-evidence-sources-consolidation-tests.mjs`, 20/20.
- `pass` — `tenant-canonical-data-consolidation-audit.mjs` runs clean across all 6 registry-active
  tenants; `audit-universe.json` status `RECONCILED` (140 observed cells = 114 canonical + 26
  auxiliary, no unexplained residue, no unexpected tenants, no duplicate aliases).
- `pass` — `node scripts/audit/check-no-legacy-tenant-inputs.mjs` (confirms no new files were
  introduced under a loader-visible legacy path).
- Not run: the actual `consolidate-active-tenant-inputs.mjs` migration. Per explicit scope, this PR
  fixes the transformation logic only; it does not execute a real consolidation or mutate
  `active/current`.

## Rollout Plan

1. Merge to `main`. No runtime deploy is triggered by this change (it's a one-time migration script,
   not part of any deployed image's request path).
2. The fix takes effect the next time `consolidate-active-tenant-inputs.mjs` is actually re-run
   (not scheduled by this PR).
3. Separately, tracked but not started: a governed backfill for the 8 SkyHarbor domains already
   flagged by the audit (`migration_omission`/`conflict_resolution_review`), and the larger v4
   evidence-architecture split (source registry / executive interviews / evidence items), each
   requiring their own review before any registry promotion or paid regeneration.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime image build is triggered by this change.
- Shared runtime mutators: none.
- Live signed-in proof required: no — no runtime/UI surface changes.

## Rollback Plan

Revert the PR. No data was mutated; `active/current` is untouched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/tenant-input-consolidation/latest/conflict-resolution-report.json` (pre-existing,
  historical) — the direct evidence the defect analysis is based on.
- New regression suite output (20/20 passing).
- `reports/tenant-inputs/audit-universe.json` — `RECONCILED`.

## Known Gaps

- The already-collapsed historical `evidence_sources` rows in `active/current` for the affected
  tenants are not repaired by this PR. That requires a governed backfill using eligible
  predecessor/archived material (never the already-collapsed `active/current` rows alone), tracked
  separately.
- `source_file + as_of_date` is an explicitly temporary, imperfect v3-compatibility identity. It
  cannot express a stable logical-source identity independent of a specific snapshot. The real
  answer (`source_id` / `source_version_id`) is defined in the separate v4-candidate schema
  (`datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/`), not promoted or
  wired into any code path by this PR.
- The `SA02`/`SA04`/`SA08`–`SA11` auxiliary domains surfaced by the audit remain undocumented in
  both `template-manifest.json`'s 19 required domains and `manifest.json`'s official `SA01`–`SA06`
  source-adapter set. Not addressed here.
