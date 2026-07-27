# 2026-07-26-evidence-v4-migration-gate-1-2-source-identity — normalize source identity before Gate 2

## Release ID

`2026-07-26-evidence-v4-migration-gate-1-2-source-identity`

## Status

`candidate` — a zero-write dry run. Nothing about any tenant's actual data changed.

## Plain-English Summary

Gate 1.1 ([#5662](https://github.com/abarva-platform/abarva/pull/5662)) proved row-level and
evidence-ID reconciliation, but disclosed rather than resolved 699 `source_metadata_conflicts` for
meridian-health. On review, those 699 conflicts turned out to be a field-role modeling defect, not
real disagreement about a source: the `legacy_context_bundle` shape (meridian-health's real active
`13_evidence_sources.csv` shape — `business_name` + `context_item` + `evidence_id` +
`evidence_location`, no `source_file`) was grouping rows into sources by `evidence_location`, then
feeding each row's `business_name`/`evidence_owner` (both properties of the individual evidence
citation, not of the shared source artifact) into that shared source's metadata. Hundreds of
genuinely different citations sharing a handful of `evidence_location` values collided as "the same
source disagreeing with itself" — that's a field-role bug, not evidence quality.

Fix: the real source identity for a `legacy_context_bundle` file is the container FILE itself, not
`evidence_location`. All rows recovered from or read out of one such file now resolve to exactly ONE
`source_version_id` (`source_kind = "context_bundle"`, real file bytes as `content_fingerprint`,
`source_identity_method = "file_level_container"`, `source_identity_confidence = "high"`).
`business_name` and `evidence_location` are routed to each evidence ITEM's `business_object_refs`
instead — the evidence subject, not the source's own metadata.

The same bug pattern was then found, independently, in the `v6_hybrid` and SA-adapter-deterministic
branches: `row.evidence_owner` (and, for lakeshore-holdings specifically, `row.source_owner` itself)
sometimes carries a per-citation stakeholder title (e.g. "Group CIO", "CISO") rather than a real
source-level owner. Fixing meridian-health alone regressed the other 5 tenants from 0 to 3–10
conflicts each for exactly this reason. Fixed identically: a citation row never contributes
`sourceOwner`; the value is preserved on the item's `business_object_refs` instead.

`safe_to_proceed_to_semantic_validation` now has a new required condition:
`blocking_source_metadata_conflicts === 0`. All 6 tenants pass it.

## Real defect found (not hypothetical)

- meridian-health: 699 → 0 `source_metadata_conflicts`. All 699 were the field-role error above, not
  real disagreement — confirmed by re-deriving identity from the file rather than the locator and
  finding zero genuine metadata disagreement remains.
- apex-retail, first-capital-financial, lakeshore-holdings, lakeshore-industries, skyharbor-air: each
  regressed from 0 to 3–10 conflicts after the meridian-health fix alone, for the identical
  citation-field-leaking-into-source-metadata pattern in `v6_hybrid`/SA-adapter rows. Fixed with the
  same principle applied to those two branches. lakeshore-holdings needed a second pass:
  `row.source_owner` itself (not just `row.evidence_owner`) carried the per-citation title for that
  tenant's data.

## Layer Impact

- `internal-admin` lane, read-only tooling. No layer below "reports on disk" is touched.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect.

## Changes Included

- `scripts/data-build/evidence-v4-migration-dry-run.mjs`: `legacy_context_bundle` file-level source
  identity rewrite; owner field-role fix in `v6_hybrid` and the SA-adapter branch; new
  `recordSourceIdentity()` audit lineage; before/after conflict reclassification
  (`resolved_field_role_error`, `resolved_locator_not_source_identity`, `true_source_metadata_conflict`,
  `unresolved_source_identity`); new `blocking_source_metadata_conflicts` safety condition.
- `scripts/data-build/__tests__/run-evidence-v4-migration-tests.mjs`: replaced the now-stale Gate 1.1
  assertion (`sourceMetadataConflicts.length > 0` for meridian-health) with Gate 1.2 regression tests
  — exactly one file-level source per `legacy_context_bundle` tenant, zero conflicts, business subject
  preserved in `business_object_refs`, source-identity audit lineage populated. 58/58 passing.
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/template-manifest.json`:
  `source_kind` enum extended with `context_bundle` and `registry_snapshot` (draft schema, still not
  promoted).
- `reports/evidence-v4-migration/`: regenerated for all 6 tenants; new per-tenant
  `source-identity-resolution.csv`, `source-metadata-conflicts-before-after.json`,
  `source-version-to-evidence-item-reconciliation.csv`.

## QA / Validation

- `pass` — `npx eslint`, zero findings on the modified script and test file.
- `pass` — `run-evidence-v4-migration-tests.mjs`, 58/58 (51 pre-existing + 7 new Gate 1.2 tests).
- `pass` — all 6 registry-active tenants: `reconciliation_status=RECONCILED`,
  `safe_to_proceed_to_semantic_validation=true`, `blocking_source_metadata_conflicts=0`,
  `unresolved_records=0`, `conflicts_requiring_review=0`, `duplicate_output_evidence_ids=0`,
  `orphan_evidence_items=0`, `blank_required_locators=0`, `invalid_classifications=0`.
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Per the explicit gate sequence, Gate 2
(semantic quality validation) begins only after this report is reviewed and accepted.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside `reports/evidence-v4-migration/`, the one script, the one test file,
and the draft v4-candidate manifest enum was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/evidence-v4-migration/all-tenant-migration-summary.json` — full per-tenant report with the
  new `blocking_source_metadata_conflicts` field.
- `reports/evidence-v4-migration/meridian-health/source-metadata-conflicts-before-after.json` — the
  699→0 reclassification, category by category.
- `reports/evidence-v4-migration/*/source-identity-resolution.csv` — per-tenant source-identity audit
  lineage.
- Test suite output (58/58 passing).

## Known Gaps

- The recovery-input-manifest basis is still generated fresh each run via commit-message heuristics,
  not yet pinned/approved (unchanged from Gate 1.1).
- No migration exists yet for domains other than `evidence_sources`/`evidence_items`/
  `executive_interviews` — the 8 other domains flagged in the earlier canonical-data audit remain a
  separate, not-yet-started backfill.
- Gate 2 (semantic quality validation) has not started. Per the explicit gate sequence, it begins only
  now that this report proves source identity is stable for all 6 tenants.
