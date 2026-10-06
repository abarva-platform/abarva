# Source — show what parsing actually extracted

## Release ID

2026-10-05-source-parsed-artifact-yield

## Status

Merged — not deployed and not live-proven by this record.

## Plain-English Summary

`text-parser.ts` extracts six families from every uploaded artifact. Two of them, chunks and facts,
are read back by the Nexus answer path and the context binder. **The other four were written on
every upload and read by nothing** — the only other reference to any of them was a column contract
inside a module that is itself unreferenced.

So the product has been extracting structured requirements, pricing components, vendor commitments
and meeting outcomes from client uploads, storing them, and showing an operator none of it.

The event page now says what parsing found: *"14 requirements · 6 pricing components · 2 meeting
outcomes"*.

It counts and does not interpret. A count of extracted requirements is a statement about what
parsing found — never about whether those requirements are complete, correct or agreed.

## Layer Impact

Release lane: **global-control-lane**.

One read added to the page's existing parallel batch, one pure projection, one rendered row. No
schema change, no migration, no write, and no change to authority, approval or tenant rules. The
query is tenant-scoped through `set_config('app.tenant_key', …)` like its neighbours, and the table
names come from a constant map rather than from any input.

## Client Applicability

**All clients**, through the shared global control lane, with no per-client gating and no feature
flag. An event whose store cannot be read says "Not recorded"; one whose uploads genuinely yielded
nothing says "Nothing extracted yet". Those are different sentences on purpose.

## Changes Included

- `src/lib/source/artifact-registry/parsed-yield-view.ts` — projection and label.
- `src/lib/source/artifact-registry/parsed-yield-repository.ts` — per-event counts.
- `src/lib/source/artifact-registry/parsed-yield-view.test.ts` — new suite.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` — reads and projects.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — optional field and row.
- `.github/workflows/unit-suites.yml`, `docs/architecture/test-ci-coverage-census.json`.

## QA / Validation

| Check | Status |
|---|---|
| Projection suite | PASS — 8 cases |
| Affected suites | PASS — 13 suites, 188 tests |
| TypeScript `tsc --noEmit`, by exit code | PASS — exit 0, 0 errors |
| ESLint on changed files | PASS |
| Mutation — unread collapsed into "none" | PASS — failed as intended |
| Mutation — negative counts carried instead of floored | PASS — failed as intended |
| Mutation — label lists zero-count families | PASS — 2 cases failed as intended |
| Mutation — plural rule forced always-plural | PASS — failed as intended |
| `audit:lib-orphans` | PASS — exit 0; refused the projection until it had a product caller |
| `audit:test-ci-coverage` | PASS |
| Signed-in acceptance | NOT RUN |

**The finding was verified against a broken instrument first.** A sweep reported these four tables
as having no reader. The first attempt to confirm it reported *writers = 0* for the two control
tables that are definitely written, which meant the writer pattern was wrong and every count from it
was meaningless; the apparent "1 reader" was the insert matching a `from(...)` pattern. Reading the
actual references settled it: the only non-test mentions of `source_requirements` are the insert at
`text-parser.ts:270` and a column contract in an unreferenced verifier.

The orphan audit refused the projection while it was reachable only from its own test, which is
correct and is why the reader and the page wiring are in the same change rather than a later one.

## Rollout Plan

Merge to `main`; the repo-owned main deploy workflow builds and deploys. No flag, no configuration,
no data step. The tables already hold rows wherever artifacts have been parsed.

## Deployment Authority

Repo-owned main deploy workflow only. No ad-hoc Azure command, no traffic or revision change.

## Rollback Plan

Revert the commit. The field is optional and the read is additive; a revert removes one row and four
counting queries with no data or schema consequence.

## Audit Evidence

- Unread, none and extracted are three distinct rendered strings, each asserted.
- A negative or non-finite count is floored to zero rather than carried, so a broken row cannot
  subtract from a total and hide real extraction.
- Table names come from a constant map, never from request input.

## Known Gaps

- Counts only. The extracted text and its provenance are stored and still not surfaced; a reader
  that shows the rows themselves is a separate slice.
- Two further families named in the same column contract — `source_commercial_exceptions` and
  `source_graph_edges` — are not written by the parser at all, so they are absent here rather than
  zero. The schema contract is wider than the parser.
- Four counting queries run per page load. Tolerable at current row counts; worth folding into one
  statement if an event ever carries a large artifact set.
- Not deployed and not live-proven. No signed-in readback.
