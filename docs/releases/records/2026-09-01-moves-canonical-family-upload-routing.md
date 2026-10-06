# Release Record — Canonical-Family Upload Routing

## Release ID

`2026-09-01-moves-canonical-family-upload-routing`

## Status

Merged — pending live proof.

## Plain-English Summary

A P2 readiness gap instructs the user, verbatim, to *"Upload CMDB export as
CSV."* Uploading exactly that through the step's own uploader failed with
*"no open document evidence family was available for this file"*, and readiness
did not move.

The parse and commit handlers already existed for all three affected families.
The uploader simply sent every file down the document path.

`isDocumentFamily` returns `!family.backing`. Families with a canonical tower
table are not document-eligible, so the document path can never map them — that
guard is correct. The defect was that the only uploader on the step routed
everything through it, so the on-screen instruction could not be followed.

Upload & Review now dispatches on family type: canonical-backed families go to
`ingestCurrentStateCsv` (parse → validate → commit to the tower table plus an
`evidence_ledger` citation); document families keep the parse → review → commit
ladder. Nothing about the guard or the document path changed.

### Two states kept apart

Parsed and committed are reported separately, and a parse that commits zero rows
is a failure, never an upload:

```
Committed 10 of 10 parsed rows to readiness          → success
row 4: criticality required (parsed 10 rows, committed 0) → failure
```

A schema that parses is not the same fact as rows landing in the canonical
table, and the UI must not conflate them.

### Provenance

Left to the route default, `representative_synthetic`. Understating trust is the
safe direction: a file is never labelled a real client export on the strength of
which panel it was dropped into.

## Layer Impact

Lane: `global-control-lane`. No other lane is affected.

Layer 4 (Products — Moves P2 upload surface). No canonical model change, no
schema change, no migration. Both ingestion paths already existed; only the
client-side dispatch changed.

## Client Applicability

All clients receive this change — not feature-flagged, none opted out. It
affects P2 Upload & Review for archetypes declaring canonical-backed
current-state families.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — add
  `ingestStructuredForFamily`; dispatch on `family.documentFamily`.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — replace the rejection test with two routing tests.
- `docs/status/moves-rich-context/fixtures/*.csv` — three synthetic CSVs
  conforming to the real parser schemas.

The server-side guard in `current-state/ingest-doc` is deliberately unchanged.
It remains correct defence-in-depth for a direct POST.

## QA / Validation

**Status: pass.**

- `MovesPhaseStandaloneClient.test.tsx` — 72 passing, 76 total. The 4 failures
  are byte-identical to the pre-change baseline, verified by stashed comparison;
  the suite grew 75 → 76.
- New tests: canonical family reaches the structured loader **and does not also
  travel the document path** (a duplicate row would otherwise be created for
  data already committed); parsed-but-not-committed reports as failure.
- `current-state-ingest` + `current-state-doc-ingest` — 32/32 pass.
- `tsc --noEmit` clean. `eslint` clean.
- Fixtures validated against `parseCmdbCsv` / `parseDoraCsv` /
  `parseWorkforceCsv`: 20 / 10 / 24 rows, **0 errors**.

## Rollout Plan

Standard main deploy through the repo-owned ACA workflow. No flag.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert and redeploy. No migration to unwind. Reverting restores the rejection
message; committed tower rows are unaffected.

## Audit Evidence

Fixtures are synthetic — no client, person, or location. No tenant data was
mutated to produce this record; the earlier live reproduction wrote nothing
because every upload was rejected.

## Known Gaps

- **Not live-proven.** Readiness has not yet been observed moving off
  `0% collected` on a real Move. That is the next step and this record may not
  be called live-proven until it happens.
- The gap card still does not name the required columns. A user with a real
  export whose headers differ will now get `missing columns: …`, which is
  informative but arrives only after an attempt.
- Document families still require per-item approval on the Findings substep;
  the phase gate still does not promote them. Unchanged here.
