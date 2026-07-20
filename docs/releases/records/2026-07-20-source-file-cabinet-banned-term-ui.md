# 2026-07-20-source-file-cabinet-banned-term-ui — Render the banned-term backstop signal in the live File Cabinet

## Release ID

`2026-07-20-source-file-cabinet-banned-term-ui`

## Status

`candidate`

## Plain-English Summary

This closes the last disclosed gap from the banned-term-backstop thread
([[2026-07-20-source-banned-term-backstop-scan]],
[[2026-07-20-source-banned-term-file-cabinet-note]]): the compliance signal now
actually renders in the live Source File Cabinet, and a real bug found along the way is
fixed.

Two things were wrong, not one:

1. **The registry read path never returned `description` at all.** The prior release
   wrote a compliance note into the file-cabinet registry record's `description` column,
   but `SourceArtifactRegistryRecord`, its `SELECT_COLUMNS` list, and `rowToRecord()`
   never included that column on the way back out — the value was write-only. Fixed by
   adding `description` to the read path (the column already existed in the schema; no
   migration).
2. **The note text itself was not client-safe.** It enumerated the actual matched banned
   term(s) (e.g. "d09", "substrate") in a field readable by anyone with File Cabinet
   access — defeating the purpose of hiding those terms in the first place. Fixed by
   replacing the enumerated-term text with a generic, client-safe compliance-review
   marker (`SOURCE_COMPLIANCE_REVIEW_FLAG_MARKER` in `artifact-governance.ts`) and two
   small pure helpers (`withComplianceReviewFlag` / `hasComplianceReviewFlag`) that write
   and detect the marker without ever exposing the raw matched terms. The raw match list
   remains available only in `body_generation_metadata.bannedTermMatches` on the
   canonical substrate row — an internal audit trail, not a client-readable field.

With both fixed, the signal now flows: generation → registry `description` (marker only)
→ `SourceShellArtifactLike.description` → `toFileItem()` derives a boolean
(`needsComplianceReview`) → `SourceShellFileItem` → an amber "Compliance review
required" chip on the file card in `SourceAnalyticsCanvas.tsx`. The raw description text
itself is never forwarded past `toFileItem()` — only the derived boolean and two fixed,
pre-written client-safe strings reach the UI.

## Layer Impact

- `global-control-lane`: Source File Cabinet rendering
  (`source-event-shell-v2.ts`, `SourceAnalyticsCanvas.tsx`) and the registry read path
  (`artifact-registry/index.ts`, `artifact-registry/types.ts`) for all tenants.
- Purely additive/display: no new write path beyond the already-shipped compliance-flag
  write in generate/route.ts (this release only fixes its read-back and its wording).

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no — this is client-facing (the whole point is that a client user with
  File Cabinet access sees a safe compliance flag, not the buyer-facing consequence of a
  hidden-term leak).
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/artifact-registry/index.ts` — add `description` to the raw row type,
  `SELECT_COLUMNS`, and `rowToRecord()` (fixes the write-only bug).
- `src/lib/source/artifact-registry/types.ts` — add `description` to
  `SourceArtifactRegistryRecord`.
- `src/lib/source/artifact-governance.ts` — add
  `SOURCE_COMPLIANCE_REVIEW_FLAG_MARKER`/`_LABEL`/`_MESSAGE` and the
  `withComplianceReviewFlag` / `hasComplianceReviewFlag` helpers.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — replace
  the enumerated-banned-term description text with the client-safe marker.
- `src/lib/source/source-event-shell-v2.ts` — add `description` to
  `SourceShellArtifactLike`; add `needsComplianceReview` /
  `complianceReviewLabel` / `complianceReviewMessage` to `SourceShellFileItem`; compute
  them in `toFileItem()`.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` — render an amber
  "Compliance review required" chip + message on `FileCard` when
  `needsComplianceReview` is true.
- Tests: `artifact-governance.test.ts` (marker helpers), `source-event-shell-v2.test.ts`
  (flagged vs. clean file items), `artifact-registry.test.ts` (description round-trips
  through the read path; previously would have silently returned `undefined`),
  `SourceAnalyticsCanvas.chat.test.tsx` (chip renders with client-safe text; raw marker
  string and matched terms never appear in the rendered DOM).
- This release record.

## QA / Validation

- `pass` — Focused Jest across the four touched test files: 49/49 passed
  (`artifact-governance.test.ts`, `source-event-shell-v2.test.ts`,
  `artifact-registry.test.ts`) plus 13/13 passed
  (`SourceAnalyticsCanvas.chat.test.tsx`).
- `pass` — Broader regression check:
  `npx jest --testPathPatterns="src/lib/source|src/app/api/v1/source|src/components/source"`
  — 2369/2404 passed, 13 suites / 35 tests failing. Confirmed via `git stash` + re-run
  that the identical 13 suites / 35 tests fail on the unmodified branch — pre-existing,
  unrelated failures. This change adds 7 net new passing tests and zero new failures.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pending` — `npm run release:check` — to run before PR.
- `pending` — Live signed-in browser proof against `app.abarva.ai` post-deploy: locate a
  Source event/artifact where the backstop scan has fired (or trigger a fresh generation
  on a high-stakes artifact and confirm), screenshot the rendered compliance chip, and
  confirm the raw description text visible in dev tools does not contain any enumerated
  banned term. Recorded as pending here; will be updated with the actual result before
  claiming this "live-proven."

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow. Takes effect immediately on
every Source File Cabinet render — no flag, no migration.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard main-deploy workflow.
- Approved image digest: recorded post-merge once the deploy run completes.
- ACA runtime invariant: to be verified post-deploy (template image = 100%-traffic
  revision image = worker images, matching approved digest).
- Worker image invariant: covered by the same main-deploy workflow step.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Known Gaps / QA above.

## Rollback Plan

Revert the merge commit. No migration, no data mutation; a revert fully restores prior
(write-only, non-rendered) behavior with no cleanup required. Note: any registry records
written with the old enumerated-term description text between
[[2026-07-20-source-banned-term-file-cabinet-note]]'s deploy and this one remain in the
database with the old wording — this release does not backfill/rewrite historical
`description` values, since retroactively editing an audit-trail field is a bigger,
separate decision than this UI fix.

## Audit Evidence

- PR URL: recorded post-open.
- Focused + broader Jest logs: 49/49 and 13/13 passed; broader suite 2369/2404 with
  confirmed pre-existing baseline.
- Typecheck log: clean.

## Known Gaps

- **Historical records are not backfilled.** Any artifact generated between
  [[2026-07-20-source-banned-term-file-cabinet-note]]'s deploy and this one that tripped
  the scan has the old, non-client-safe enumerated-term text sitting in its
  `source_artifacts.description` column right now. This release stops writing that text
  going forward and stops *reading* it in a way that would surface literally (the UI only
  renders the two new fixed strings, never the raw description), but the raw column value
  itself is unchanged for those historical rows. Anyone with direct DB/API access to
  `description` on those specific rows could still see the old enumerated text. A
  targeted backfill (rewrite historical flagged descriptions to the new marker-only text)
  is a reasonable, bounded follow-up if any such rows are found to exist in production.
- Live signed-in proof is pending as of this record's initial write — to be completed and
  recorded before claiming "live-proven" per this session's standing discipline.
