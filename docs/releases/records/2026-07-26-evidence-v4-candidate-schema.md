# 2026-07-26-evidence-v4-candidate-schema — draft v4 evidence-source / interview / evidence-item split

## Release ID

`2026-07-26-evidence-v4-candidate-schema`

## Status

`draft` — a proposal for review, not an active standard. Nothing in the runtime pipeline reads this
directory. No registry file is modified.

## Plain-English Summary

Companion to `2026-07-26-evidence-sources-consolidation-defect-fix.md` (PR A, the narrow
transformation-bug fix). That fix repairs *how* `evidence_sources` rows get consolidated under the
current v3 schema; it cannot repair the deeper structural gap that made the bug possible in the
first place: v3's `13_evidence_sources.csv` conflates two different concepts — a registry of
*source artifacts* and a ledger of *citeable evidence items* — into one file with no way to
distinguish them.

This PR adds a **draft** v4 schema, under a new `standard-2026-07-v4-candidate/` directory, that
splits these into three domains:

- `13_evidence_sources.csv` (revised): one row per logical source artifact **version** — identity is
  a stable `source_id` (the logical source) plus a required `source_version_id` (this specific
  snapshot), so the same source can legitimately reappear in a later snapshot without overwriting
  history.
- `19_executive_interviews.csv` (new): structured interview observations, each linked to the source
  version representing the transcript/export it came from. Closes the real gap where Home V4's
  "Leadership Agenda" and "Interview Signals" dimensions had no canonical interview source to draw
  from at all under v3.
- `20_evidence_items.csv` (new): one row per citeable fact/excerpt/observation, with a **required**
  `source_version_id` foreign key (not `source_id`) so evidence stays pinned to the exact snapshot
  it was extracted from.

Domains `00`–`12` and `14`–`18` are carried forward from v3 unchanged and are **not duplicated**
here, to avoid two copies of identical content silently drifting apart — see
`../standard-2026-07-v3/template-manifest.json` for their definitions.

## Layer Impact

- None yet. This is a schema-only addition under `datasets/tenant-inputs/templates/universal/`. No
  registry, consolidation, generator, or quality-rule code is pointed at it.

## Client Applicability

- Internal only. No tenant-facing or runtime behavior changes.

## Changes Included

- `datasets/tenant-inputs/templates/universal/standard-2026-07-v4-candidate/`:
  - `template-manifest.json`: full schema definitions for the 3 changed/new domains, plus an
    explicit list of the 18 unchanged domains sourced from v3.
  - `13_evidence_sources.csv`, `19_executive_interviews.csv`, `20_evidence_items.csv`: header-only
    template files, each verified to match the manifest's declared columns exactly.
  - `README.md`: explains the defect this addresses, what changed, and — explicitly — what did not
    change (no registry mutation, no consolidation/generator wiring, no historical data migration).

## QA / Validation

- `pass` — self-consistency check: every template file's CSV header exactly matches its manifest
  entry's declared `columns` array (verified via script, not by inspection).
- `pass` — `node scripts/audit/check-no-legacy-tenant-inputs.mjs` (confirms this new directory does
  not trip the loader-visible legacy-path guardrail).
- Not applicable: no code reads this schema yet, so there is nothing to functionally test beyond
  structural self-consistency.

## Rollout Plan

This PR adds a reviewable draft only. Nothing rolls out. The actual sequence, none of which is part
of this PR:

1. Review and approve (or revise) this schema.
2. Build a dry-run migration reading eligible predecessor/archived files, historical
   consolidation reports, and current canonical data — explicitly never reconstructing lost
   evidence from the already-collapsed `active/current` rows alone. Output lands under
   `reports/evidence-v4-migration/<tenant>/` as reviewable candidates; `active/current` is never
   written directly.
3. Add source-registry and evidence-item semantic quality rules (identity coverage, substantive-field
   density, placeholder rejection, distinctness — beyond today's `minRows`-only check).
4. Wire Home V4's evidence resolution against `evidence_items` (source/proof cards continue to use
   `evidence_sources`).
5. Only after the above pass review: promote via `tenant-input-registry.json` and flip
   `policy.universalTemplateStandardV3IsOnlyApprovedStandard`.

## Deployment Authority

- Repo-owned deploy workflow: not applicable — no runtime image build is triggered.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. No registry, consolidation, or runtime code references this directory, so there is
no rollback risk beyond removing the files.

## Audit Evidence

- This PR's diff and CI run.
- Companion PR: `2026-07-26-evidence-sources-consolidation-defect-fix.md` (the narrow v3 fix this
  schema explains the deeper motivation for).

## Known Gaps

- No migration tooling exists yet to populate this schema from real tenant data. That's explicitly
  the next, separate step (see Rollout Plan) and is not started.
- No quality rules exist yet for the new domains.
- No code path reads or writes this schema. It is documentation-as-code for review purposes only.
