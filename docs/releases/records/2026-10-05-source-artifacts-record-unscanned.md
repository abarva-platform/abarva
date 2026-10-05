# Source — record that nothing scanned an uploaded artifact

## Release ID

2026-10-05-source-artifacts-record-unscanned

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

`source_artifacts.malware_scan_status` has existed since September and **nothing ever wrote it**, so
every artifact carried null. Null is ambiguous: it reads the same for a row created before the
column existed and for a file nobody scanned. Only one of those is a control gap, and it was
invisible.

Every artifact now records `not_scanned` at creation, with a reason saying why.

That is the truth for every path the product has. All four entry points — upload, client-final,
e-sign send and vendor-proposal ingest — read the file into memory and parse it **in the same
request**. Defender scans blobs in storage, so no scan has happened by the time the row is written.
There is no queue and no storage hop between receiving the bytes and reading them.

`not_scanned` is Defender's own term and one of the values the column's CHECK constraint already
permits, so the database and the scanner vocabulary agree.

## Layer Impact

Release lane: **global-control-lane**.

Two fields on the artifact insert, two on the record type, and the readback. No schema change — the
columns and their constraint already exist. No migration, no new query, no behaviour change to any
upload.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. No visible change: this records a fact that was previously discarded. Rows created before this
change keep their null and are not backfilled, because a backfill would be asserting something about
files nobody examined.

## Changes Included

- `src/lib/source/file-cabinet/repository.ts` — writes the status and reason, reads them back.
- `src/lib/source/file-cabinet/types.ts` — optional fields on the record.
- `src/__tests__/behaviors/source-artifact-records-unscanned-state.test.ts` — new suite.

## QA / Validation

| Check | Status |
|---|---|
| New suite | PASS — 6 cases |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| Mutation — default back to null | PASS — failed as intended |
| Mutation — default to `no_threats_found` | PASS — **2 cases** failed as intended |
| Mutation — drop the readback | PASS — failed as intended |
| Signed-in acceptance | NOT RUN |

The fields are optional on the record type rather than required. Making them required broke four
call sites that build a record in memory rather than reading one from storage — and those genuinely
have no scan verdict, so optional is the honest shape. Absent means "built in memory", null means
"the stored row predates the column", and neither means clean. The type says so.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step, no migration.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. Rows written while it was live keep a truthful `not_scanned`, which no reader
depends on yet.

## Audit Evidence

- A mutation defaulting the value to `no_threats_found` fails two tests, so an unscanned artifact
  cannot come to read as a clean one.
- The value is asserted against the column's existing CHECK constraint, so the code and the database
  agree on the vocabulary.

## Known Gaps

- **This records the gap; it does not close it.** Nothing scans Source artifacts. The fix is
  architectural — uploads would have to land in storage, be scanned, and only then be parsed — which
  makes uploads asynchronous and is a product decision, not an implementation one.
- `src/lib/source/artifact-scan-gate.ts` remains unwired, correctly: it is fail-closed, and with
  nothing scanning, wiring it anywhere would either never fire or refuse everything.
- No surface shows the status yet. It is recorded, not displayed.
- Existing rows keep null; no backfill.
- Not deployed and not live-proven. No signed-in readback.
