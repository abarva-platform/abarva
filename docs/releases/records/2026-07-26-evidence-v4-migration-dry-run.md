# 2026-07-26-evidence-v4-migration-dry-run — Gate 1: zero-write evidence migration

## Release ID

`2026-07-26-evidence-v4-migration-dry-run`

## Status

`candidate` — a zero-write dry run. Nothing about any tenant's actual data changed.

## Plain-English Summary

Gate 1 of the four-gate evidence-v4 plan. This adds `scripts/data-build/evidence-v4-migration-dry-run.mjs`,
which reads (a) predecessor evidence-registry files recovered via `git show` against the commit
where they last existed (never as a live loader path — the archive locations were deliberately
purged from the repo, per the registry's own "historical recovery is git history only" policy),
(b) the currently-active (collapsed) `13_evidence_sources.csv` for each tenant, and (c) executive
interview files where present — then proposes a split into `evidence_sources` (source-artifact
versions) / `evidence_items` (citeable units) / `executive_interviews` candidates per tenant.

It performs **zero writes** to `active/current`, `tenant-input-registry.json`, Postgres, approved
Home packs, or any runtime route. Output lands only under `reports/evidence-v4-migration/<tenant>/`.

## Key finding: real evidence was recoverable, and the active-file schema is not uniform

Two things emerged that materially changed the tool's design mid-build:

1. The rows discarded by the confirmed consolidation defect (PR #5659) were genuinely recoverable.
   `git show <commit>:<path>` against the exact `incomingSourcePath` values recorded in the
   historical `conflict-resolution-report.json` returned real, richly distinct evidence: e.g.
   apex-retail's predecessor file has 9 rows sharing one `source_file` but 9 distinct `evidence_id`s
   (`APX-EVID-001`–`009`), each with a real title and section locator — exactly the "one source,
   many evidence items" shape the v4 schema expects.
2. **`meridian-health`'s active/current `13_evidence_sources.csv` does not use the v3 template shape
   at all** — it has no `source_file` column. It uses the same `business_name`/`context_item`/
   `evidence_id`/`evidence_location` shape as the retired `<tenant>/standard-2026-07-v3/` legacy
   packs. All 508 of its rows carry a real `evidence_id`. The tool's first version assumed every
   active file matched the v3 template and wrongly marked all 508 as `intentionally_excluded_with_reason`
   (`no_semantic_source_ref`) — caught by the reconciliation assertion failing to make sense on
   manual review, not by the assertion itself (the count still balanced; the *classification* was
   wrong). Fixed by adding shape detection (`detectShape()`) to the active-file path too, not just
   predecessor files, and this is why `meridian-health` was the one tenant with `0` domains flagged
   in the earlier consolidation audit ([#5659](https://github.com/abarva-platform/abarva/pull/5659))
   — its active file was never thin, it just uses a different schema than the other 5 tenants.

## Reconciliation (hard requirement, asserted not just reported)

Every real input row (predecessor rows successfully read from git + active-file rows + interview
rows) receives **exactly one** disposition from `{migrated_source, migrated_evidence_item,
migrated_interview, duplicate_with_proof, intentionally_excluded_with_reason, conflict_requires_review,
unresolved}`. The tool throws (refuses to report) if `total_dispositioned_rows !== total_input_rows`
for any tenant. All 6 tenants reconcile exactly:

| Tenant | Input rows | Sources created | Evidence items created | Interviews migrated | Conflicts (review) | Unresolved | Reconciliation |
|---|---|---|---|---|---|---|---|
| apex-retail | 23 | 1 | 14 | 0 | 8 | 0 | RECONCILED |
| first-capital-financial | 267 | 2 | 258 | 216 | 8 | 0 | RECONCILED |
| lakeshore-holdings | 19 | 1 | 10 | 0 | 8 | 0 | RECONCILED |
| lakeshore-industries | 434 | 49 | 376 | 0 | 8 | 0 | RECONCILED |
| meridian-health | 869 | 36 | 865 | 221 | 0 | 0 | RECONCILED |
| skyharbor-air | 352 | 26 | 337 | 216 | 8 | 0 | RECONCILED |

**The 8 conflicts appearing in 5 of 6 tenants are the same real, legitimate case, not a bug**:
rows carrying real, distinct `evidence_id`s (e.g. `APX-DAY1-AI-EVID-001`–`008`, real AI-use-case
names) whose `source_file` value is a human-written label ("SA08/SA09/SA10/SA11 AI value realization
source adapters") rather than a real file path — from the same undocumented `SA08`–`SA11` auxiliary
domain files flagged as `ungoverned_auxiliary_artifact` in the earlier canonical-data audit. Correctly
routed to `conflict_requires_review` rather than guessed at either way.

## Layer Impact

- `internal-admin` lane, read-only tooling. No layer below "reports on disk" is touched.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect.

## Changes Included

- `scripts/data-build/evidence-v4-migration-dry-run.mjs` (new).
- `reports/evidence-v4-migration/` (new): per-tenant `evidence-sources-candidate.csv`,
  `evidence-items-candidate.csv`, `executive-interviews-candidate.csv`, `migration-lineage.json`,
  `source-deduplication.json`, `unresolved-records.csv`, `conflict-review.csv`,
  `before-after-summary.html`, plus `all-tenant-migration-summary.json`.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — hard reconciliation assertion passes for all 6 registry-active tenants (throws otherwise).
- `pass` — spot-checked output CSVs contain real, well-formed data (real `evidence_id`s matching
  what `git show` recovered, real interview Q&A linked to a real `source_version_id`, zero orphan
  `evidence_items` without a resolvable `source_version_id`).
- Not applicable: no runtime/UI surface, no live signed-in verification needed.

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Per the explicit gate sequence, the next steps
(semantic quality validation — Gate 2, the all-tenant 38-dimension readiness matrix — Gate 3, and
Home V4 evidence wiring — Gate 4) do not start until this migration output is reviewed and accepted.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside `reports/evidence-v4-migration/` and the one new script was touched.

## Audit Evidence

- This PR's diff and CI run.
- `reports/evidence-v4-migration/all-tenant-migration-summary.json` — the full per-tenant report.
- `reports/tenant-input-consolidation/latest/conflict-resolution-report.json` (pre-existing) — the
  source of the recovered predecessor file paths.

## Known Gaps

- 40 conflicts total (8 × 5 tenants) require a real human decision about how the `SA08`–`SA11`
  auxiliary rows' source should be represented — not resolved here, by design.
- `source_version_id` generation uses a deterministic hash of `source_ref + version_key`, not a
  human-readable ID. Acceptable for a dry run; a real promotion would want readable IDs.
- Deduplication (`source-deduplication.json`) is empty for every tenant in this run — every
  predecessor row happened to be genuinely distinct once shape-detection was corrected. This should
  not be read as "deduplication doesn't work," only that this dataset didn't exercise it; the same
  logic that produces `duplicate_with_proof` was exercised and verified via the regression fixtures
  earlier in this workstream (`run-evidence-sources-consolidation-tests.mjs`).
- No migration exists yet for domains other than `evidence_sources`/`evidence_items`/
  `executive_interviews` (the 8 domains flagged in the earlier canonical-data audit —
  `org_ownership`, `programs_initiatives`, etc. — are a separate, not-yet-started backfill).
