# 2026-07-26-evidence-v4-migration-gate-1-1-hardening — semantic preservation before Gate 2

## Release ID

`2026-07-26-evidence-v4-migration-gate-1-1-hardening`

## Status

`candidate` — a zero-write dry run. Nothing about any tenant's actual data changed.

## Plain-English Summary

Gate 1.1, the hardening pass requested after Gate 1 ([#5661](https://github.com/abarva-platform/abarva/pull/5661))
proved row-level reconciliation but not yet evidence-*semantic* preservation. Row reconciliation
(every input row gets exactly one disposition) was real and correct, but it didn't yet prove that
every evidence identity, dimension association, and classification survived migration correctly.
This PR closes that gap.

Nine changes, all to the same zero-write dry-run tool:

1. **The 40 repeated "SA08-11 adapter" conflicts are now resolved deterministically**, not left as
   blanket human-review items. Those rows already carry a real `evidence_location` (e.g. "Microsoft
   365 Admin Center / Copilot usage export") that identifies the true upstream source; `source_file`
   on those rows is just a descriptive adapter-family label. Migrated as `source_ref =
   evidence_location`, `source_kind = api_export`, with the label preserved in
   `business_object_refs`/`quality_notes`, not treated as identity.
2. **Evidence-ID reconciliation** (`evidence-id-reconciliation.csv` per tenant): every row carrying a
   real input `evidence_id` is tracked end-to-end (input file, row, disposition, output ID, source
   FK). Hard-fails if the same (evidence_id, row) pair is reconciled twice.
3. **Dimension and business-object routing preserved**: `dimension_keys`/`business_object_refs` were
   previously hardcoded blank; now populated from real available hints (domain labels, priority
   themes, dimension fields) and validated against the actual 38-key dimension catalog.
4. **Classification semantics fixed**: only real approval/review-status values
   (`approved`/`review_required`/`rejected`/`pending`/`candidate`) are accepted into
   `classification`. Values that were previously mis-mapped in (retrieval eligibility, dimension
   labels, priority themes) are now routed to their correct field or dropped to blank.
5. **Locator is now actually required**: a citeable item with no locator is rejected, even if it has
   a summary — a summary was never a substitute for "where did this come from."
6. **Real content fingerprints**: `content_fingerprint` now hashes the exact bytes this migration
   actually possesses (the interview file, read directly off disk) rather than hashing the source's
   name/reference and calling it "content." For the many sources that are only *described by* a
   recovered registry row (not recovered themselves), the fingerprint is honestly blank with a
   `quality_notes` explanation.
7. **Source metadata merges safely** across multiple contributing rows: blanks are filled,
   equal values confirm each other, and genuinely differing values are routed to
   `source-metadata-conflicts.csv` rather than the first row silently winning.
8. **`recovery-input-manifest.json`**: records, for every predecessor path discovered, its recovery
   commit, git blob SHA, content SHA-256, detected shape, row count, discovery basis, and
   inclusion/exclusion decision — the basis for pinning an approved recovery universe on a future run
   instead of re-deriving commits from message heuristics every time.
9. **51 new regression tests**, run against real, git-tracked tenant data (not synthetic mocks) —
   proving the fixes against the actual dataset this hardening pass was built for.

## Real defects found while hardening (not hypothetical)

- **meridian-health's active file has a genuine duplicate**: the exact same interview-derived
  evidence content (same `evidence_id`, same `business_name`, same `context_item`) appears twice
  under two different `record_id`s. The tool now detects this correctly as
  `duplicate_with_proof` rather than either crashing or silently creating two items.
- **meridian-health also reuses the same `evidence_id` across two genuinely different
  representations** of the same underlying observation — a summarized "context bundle" row in the
  active file and the raw row in the interview file. This is a real modeling ambiguity, not a script
  bug; it's routed to `conflict_requires_review` rather than guessed at.
- **meridian-health's coarse `evidence_location` grouping** (only 9 distinct values covering hundreds
  of rows) causes genuinely different logical sources (e.g. "Unified clinical + claims lakehouse" vs
  "Call center optimization" vs "Provider quality and performance") to collapse under one
  `source_version_id`. The new source-metadata-merge logic catches this correctly — 699 metadata
  conflicts recorded for meridian-health, all real, all disclosed in `source-metadata-conflicts.csv`
  — rather than silently overwriting or hiding it. This is a genuine limitation of grouping by
  `evidence_location` alone for this tenant's specific shape, flagged for a future refinement, not
  fixed by pretending the grouping is finer than it is.

## Layer Impact

- `internal-admin` lane, read-only tooling. No layer below "reports on disk" is touched.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect.

## Changes Included

- `scripts/data-build/evidence-v4-migration-dry-run.mjs`: all 9 hardening items above.
- `scripts/data-build/__tests__/run-evidence-v4-migration-tests.mjs` (new, 51/51 passing).
- `reports/evidence-v4-migration/`: regenerated with the corrected logic; two new per-tenant files
  (`evidence-id-reconciliation.csv`, `source-metadata-conflicts.csv`) plus a new top-level
  `recovery-input-manifest.json`.

## QA / Validation

- `pass` — `npx eslint`, zero findings on both the script and the new test file.
- `pass` — `run-evidence-v4-migration-tests.mjs`, 51/51.
- `pass` — `run-evidence-sources-consolidation-tests.mjs` (the earlier PR A suite), still 20/20 —
  confirms this change didn't regress the narrow v3 consolidation fix.
- `pass` — all 6 registry-active tenants: `reconciliation_status=RECONCILED`,
  `safe_to_proceed_to_semantic_validation=true`, `unresolved_records=0`,
  `conflicts_requiring_review=0`, `duplicate_output_evidence_ids=0`, `orphan_evidence_items=0`,
  `blank_required_locators=0`, `invalid_classifications=0`.
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Gate 2 (semantic quality validation) can now
begin against migration output that's been proven to preserve evidence identity and dimension
routing correctly, not just row counts.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside `reports/evidence-v4-migration/`, the one script, and the one new
test file was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/evidence-v4-migration/all-tenant-migration-summary.json` — the full per-tenant report,
  now with the Gate 1.1 acceptance fields.
- `reports/evidence-v4-migration/recovery-input-manifest.json` — the recovery-provenance basis.
- New test suite output (51/51 passing).

## Known Gaps

- `source_metadata_conflicts` is not required to be zero for `safe_to_proceed_to_semantic_validation`
  — it's a disclosed report, not a blocking gate, per the Gate 1.1 spec. meridian-health's 699
  conflicts (all traced to coarse `evidence_location` grouping) are real and worth a future grouping-
  key refinement, not resolved here.
- The recovery-input-manifest is generated fresh each run via commit-message heuristics, not yet
  pinned/approved. A future run should prefer recorded values from a reviewed copy of this file.
- No migration exists yet for domains other than `evidence_sources`/`evidence_items`/
  `executive_interviews` — the 8 other domains flagged in the earlier canonical-data audit remain a
  separate, not-yet-started backfill.
