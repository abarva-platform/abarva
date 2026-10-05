# Source New — show RFx release state

## Release ID

2026-10-05-source-new-release-state

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

The RFx release layer was built and invisible. `source_event_rfx_package_version` has write paths,
two routes under `rfx-release/` persist versions and contact approvals, and
`readPreparedRfxPackagesForEvent` reads them back — but the Source New event page called none of it.
An operator could not see whether a package version had ever been prepared, for how many recipients,
or at all.

The page now reads it in the same parallel batch as the authorities, and shows it as its own row.

The reader returns `registryAvailable: false` both when the store cannot be read and when a row
fails its integrity check. Either way the honest answer is "we do not know", which is a different
fact from "nothing was prepared". The projection keeps those apart and the surface renders them
differently: **Not recorded** against **No package prepared**.

## Layer Impact

Release lane: **global-control-lane**.

One added read inside the batch that already runs in parallel, one pure projection, one rendered row.
No schema change, no migration, no write, and no change to authority, approval or tenant rules.

## Client Applicability

All clients, through the shared control lane. Events with no prepared package read "No package
prepared"; events whose store cannot be read say "Not recorded", which is what they are.

## Changes Included

- `src/lib/source/new-workspace/release-state-view.ts` — new projection and label.
- `src/lib/source/new-workspace/release-state-view.test.ts` — new suite.
- `src/components/source/new-workspace/ReleaseStateRow.test.tsx` — new render suite.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` — reads prepared packages, projects the state.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — optional field and row.
- `.github/workflows/unit-suites.yml`, `.github/workflows/ai-surface-control-catalog.yml` — run both.
- `docs/architecture/test-ci-coverage-census.json` — refreshed by the repo-owned generator.

## QA / Validation

| Check | Status |
|---|---|
| Projection suite | PASS — 9 cases |
| Render suite | PASS — 4 cases |
| Affected suites | PASS — 7 suites, 131 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS — exit 0 |
| Mutation — unread collapsed into "none" | PASS — failed as intended, restored |
| Mutation — first row taken instead of highest version | PASS — failed as intended, restored |
| Mutation — plural rule forced always-plural | PASS — failed as intended, restored |
| Mutation — absent prop rendered as "No package prepared" | PASS — failed as intended, restored |
| `audit:lib-orphans` | PASS — exit 0, no new orphan |
| `audit:test-ci-coverage` | PASS — census refreshed, shape matches |
| Signed-in acceptance | NOT RUN |

The projection takes the highest version rather than the first row. The query orders by version
descending, but the current version is a property of the data and not of the query that fetched it;
relying on `ORDER BY` would be correct only until somebody changed it, and a wrong "current version"
is the kind of error that reads as true. A test feeds the rows out of order, and the mutation that
takes `versions[0]` fails it.

One defect found was in the new test rather than the product: the helper rendered twice in a single
case and a document-wide query then matched both copies. Scoped to its own container.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The field is optional and the read is additive; a revert removes one row and one
query with no data or schema consequence.

## Audit Evidence

- The release read joins the existing `Promise.all`, so it adds no serial latency.
- Unread, none and prepared are three distinct rendered strings, each asserted.
- Census moves by two test files; no other directory changed state.

## Known Gaps

- This reports prepared package versions. It does not report issuance: nothing here says a package
  reached a supplier, because nothing in the product does that yet.
- Recipient contact approvals are counted, not listed.
- Not deployed and not live-proven by this record. No signed-in readback was performed.
