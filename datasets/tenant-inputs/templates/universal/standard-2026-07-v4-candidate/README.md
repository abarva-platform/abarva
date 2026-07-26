# Universal tenant input standard — v4 candidate (draft, not promoted)

**This is a draft proposal, not the approved standard.** `standard-2026-07-v3` remains the only
approved tenant input/template standard (`datasets/tenant-inputs/tenant-input-registry.json`:
`legacySourcePurge.allowedSourceOfTruth`, `policy.universalTemplateStandardV3IsOnlyApprovedStandard`).
Nothing in the runtime pipeline reads from this directory. It exists so the schema change can be
reviewed before any registry, consolidation, or generator code is pointed at it.

## Why this exists

A real, confirmed defect in `13_evidence_sources.csv` (v3): the schema conflates two distinct
concepts — a registry of *source artifacts* (one row per CSV/document/transcript used as evidence)
and a ledger of *evidence items* (one row per fact/citation/observation extracted from an artifact).
The synthetic generator produced citation-shaped rows (`evidence_id`, `evidence_type`,
`evidence_location` columns bolted onto the source-registry schema) that all pointed at the same
physical `source_file`, and the consolidation process — correctly deduplicating what looked like
repeated rows describing the same source file — collapsed genuinely distinct evidence citations,
discarding all but one per group. Separately, the `13_evidence_sources` fix landed for v3
(`scripts/data-build/consolidate-active-tenant-inputs.mjs`) is a narrow, temporary compatibility
repair — `source_file + as_of_date` as a business key — not a real answer, since v3 has no way to
express a stable logical-source identity distinct from a specific snapshot.

## What changed

- `13_evidence_sources.csv`: re-scoped to source-artifact-*version*-level. `source_file` →
  `source_ref` (an artifact isn't always literally a file). **Two** identity fields, not one:
  `source_id` (the stable logical source, e.g. `SRC-SHA-EXEC-INTERVIEWS`) and the required
  `source_version_id` (this specific snapshot, e.g. `SRCV-SHA-EXEC-INTERVIEWS-20260725`) — so the
  same logical source can legitimately reappear as a new version without overwriting history.
  `source_kind` (v3's `source_type`) is excluded from identity entirely.
- `19_executive_interviews.csv` (new): structured interview observations (one question/answer per
  row), each linked to the `source_version_id` representing the transcript/workbook it came from.
  Closes the real gap where Leadership Agenda and Interview Signals had no canonical interview
  source to draw from at all in v3.
- `20_evidence_items.csv` (new): one row per citation/observation, with a **required
  `source_version_id`** FK — not `source_id` — so evidence stays pinned to the exact snapshot it was
  extracted from.
- Domains `00`–`12` and `14`–`18` are unchanged and intentionally **not duplicated** here — see
  `../standard-2026-07-v3/template-manifest.json` for their definitions, to avoid two copies of
  identical content silently drifting apart.

## What did not change

- No registry file was modified. `activeTenants[].canonicalInputRoot` still points at
  `active/<tenant>/current`, built from v3.
- No consolidation, generator, or quality-rule code reads this directory yet.
- No historical `active/current` data was migrated. That's a separate, larger step: a dry-run
  migration reading eligible predecessor/archived files, historical consolidation reports, and
  current canonical data — never reconstructing lost evidence from the already-collapsed
  `active/current` rows alone, and never writing to `active/current` directly. Output lands under
  `reports/evidence-v4-migration/<tenant>/` as reviewable candidates, not a live promotion.
