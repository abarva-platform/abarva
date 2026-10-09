# u638 — An artifact version is an address, not a label

## Release ID

`2026-10-08-u638-artifact-version-lineage-refusal`

## Status

`candidate`

## Plain-English Summary

Every Move document — an uploaded evidence file, a generated deliverable, a
session pack, an approval packet — is written by one function, and that function
decides which version number the new file gets by reading the highest-numbered
version already filed under the same Move and document type.

The version number is not a label. It is part of the **storage path**:
`.../generated/p3/<document type>/v2/<file>`. The file name inside that folder
is fixed per document type. So the version number decides which bytes get
written over.

That read had three possible outcomes and only two of them entitle the writer to
a version:

- rows came back and there were none — genuinely the first version, so v1;
- rows came back and one of them is the prior version — so v(prior + 1), and the
  prior row is marked superseded;
- **the read failed** — in which case nothing is known about prior versions.

The third was being answered as if it were the first. The code wrapped the read
in a `try/catch` whose comment read `/* fresh */`, but the data-plane client
this product uses **never throws** — it catches everything internally and
returns a result object carrying an error field instead. So the `catch` could
not be reached by a query failure, and the error the client did return was
discarded by the destructuring that read only the rows.

A failed read therefore restarted the lineage at version 1, and the
consequences compounded:

- the new bytes were uploaded to the **v1 folder**, overwriting the document
  that was already stored there;
- the older record went on naming that same path and the content hash of the
  document that used to be at it, so the registry and the stored bytes
  disagreed, silently;
- a second record was filed claiming version 1, recording no predecessor, and
  there is no uniqueness constraint on (move, document type, version) to stop
  it, leaving two records both marked `current`.

The sharpest case is a **re-generation**: regenerating a deliverable for review
announces its version to the client ("Version 1"), and the revision it replaced
could no longer be produced. For an uploaded evidence file it means the document
behind an approved citation can be gone while the record still points at it.

Now a failed read refuses by name instead. That refusal happens **before** the
bytes are uploaded and before the record is filed, so nothing has landed and a
retry is safe — it is the only exit in this function with that property.

A second, smaller silence is closed in the same function. After the new record
is filed, the previous one is marked superseded, and that update's error was
never read. When it fails, two records stay `current` for one document type.
That failure is reported to the operator log and deliberately **not** turned
into a refusal: both writes have already committed at that point, and a caller
told "this failed" files a second copy.

## Layer Impact

- `3 CANONICAL MODEL` — the `move_artifacts` registry and the Blob vault behind
  it. No schema change and no migration. What changed is the rule about when the
  writer is **entitled** to write: a write whose version cannot be established
  is refused instead of performed at a guessed address.
- `4 PRODUCTS` (Moves) — every surface that files a document. The success path is
  byte-for-byte unchanged, so nothing a reader sees moves unless the version read
  itself fails.

Release lane: `global-control-lane`. Shared writer behaviour, identical for every
tenant, nothing flag-gated.

## Client Applicability

- All clients: yes — one shared writer, used by every document-filing path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This writer sits behind fifteen call sites across uploads,
  generation, regeneration, client approval, sign-off, session packs, workbook
  proposals and backfill, and none of them is flag-gated on this behaviour.

## Changes Included

- `src/lib/programs/deliverables/move-artifact-version-lineage.ts` — new, and
  deliberately not `server-only` so the decision is testable without a mocked
  data plane. `resolveMoveArtifactVersionLineage` reads the prior-version
  query's result and returns one of three outcomes as data — `first`,
  `supersedes` or `unreadable` with a reason. The error field is authoritative
  over the rows: a result carrying an error is never read as an answer about
  prior versions even if it also carries rows. Also exports the two named codes,
  which name opposite sides of the insert — one is a refusal before any write,
  the other a repair owed after both writes committed.
- `src/lib/programs/deliverables/move-artifacts.ts` — `saveMoveArtifact` now
  routes the prior-version read through that module and throws
  `artifact_version_lineage_unreadable` when it cannot establish the lineage,
  logging the reason. The dead `try/catch` is removed. The supersede update's
  error is read and logged under `artifact_supersede_failed`. **No call site was
  edited**: the function's signature, its return shape and its entire success
  path are unchanged, so the fifteen callers are untouched in both directions.
- Suites: `src/lib/programs/deliverables/__tests__/move-artifact-version-lineage.test.ts`
  (new, 12 cases — the decision in isolation) and
  `src/lib/programs/deliverables/__tests__/move-artifacts-version-lineage-writes.test.ts`
  (new, 10 cases — the real writer against a failing read, asserting the order:
  no upload, no insert, no supersede). 22 new cases.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- **No workflow edit.** `src/lib/programs/deliverables/__tests__` is swept as a
  directory by the required AI-surface control catalog, so both new suites are
  merge-blocking as written.

## QA / Validation

- **PASS** `npx jest src/lib/programs/deliverables/__tests__` — 8 suites /
  **77** tests, including the 22 new cases. The pre-existing
  `move-artifacts.test.ts` is green unchanged.
- **PASS** Wider regression over every suite that touches this writer or its
  callers: `src/lib/programs/deliverables`, `src/lib/deliverables/__tests__` and
  the `programs/[programId]/artifacts` route suites together — 54 suites / 523
  tests, 3 snapshots. All green.
- **PASS** Mutation testing, 13 mutants designed, **13 killed**. Each run
  compared failing-test names against the baseline, not only the exit code.
  - **The decisive one is the exact pre-fix revert** — the whole read restored to
    its swallowing form, `catch { /* fresh */ }` and all: 5 fail. The fix is held
    by cases, not by a shape.
  - refusal: the refusal logged but execution continued at v1 (5 fail); the
    refusal moved to **after** the blob upload, which is the ordering claim that
    makes a retry safe (3 fail, including the case that asserts nothing was
    written); the refusal log line dropped (1 fails).
  - supersede: the silent form restored, i.e. the error no longer read (8 fail);
    the log dropped (1 fails); a supersede failure made to **throw**, which is
    the direction that would make a committed save read as nothing-happened
    (2 fail).
  - decision module: a read error no longer unreadable (3 fail); the row
    collection no longer required (1 fails); the numeric prior-version guard
    dropped (7 fail); the error made non-authoritative by checking rows first,
    so a partial result would license a version (3 fail); the next version set
    to the prior version rather than prior + 1 (7 fail).
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no output.
- **PASS** `npx eslint` on all four changed and added files — exit 0.
- **PASS** Prettier `--check` on all four, each passing without ever being
  rewritten. The one pre-existing file edited —
  `src/lib/programs/deliverables/move-artifacts.ts` — was checked after the edit
  and in place, so the repo config applied, and no pre-existing line was
  reformatted into this change.
- **PASS** Census, with the basis stated. `main` committed 2730 / 164 at the base
  commit and a regen of this branch reads **2732** covered with
  `uncoveredTestFiles` unchanged at **164** — exactly the two new test files, so
  inherited drift on this base was zero. The generator's own
  `census drift: committed census matches this run` line is circular (it prints
  after writing); `git status` was read instead.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Signed-in walk. No claim in this record is `live-proven`.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys; no separate step. Nothing is flag-gated.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This release introduces no Azure command, no revision weight change and
no Container App template change, and nothing in it was deployed by hand.

## Rollback Plan

Revert the squash commit. Nothing is written or altered by this release that a
revert would have to migrate: it adds a refusal before two existing writes and
reads an error that was previously discarded. A revert restores the previous
behaviour exactly — including the silent restart at v1 — with no state to
repair. Records written while this release is live are indistinguishable from
records written before it, because the success path is unchanged.

## Audit Evidence

- The data-plane client's no-throw contract was read, not assumed:
  `src/lib/data-plane/postgresCompat.ts` wraps every operation in
  `execute()`, whose `catch` returns `{ data: null, error }`. That is what makes
  the removed `catch` unreachable by a query failure and the discarded error the
  only signal there was.
- The absence of a uniqueness constraint was read from the migration that
  creates the table: the index on (move, document type, version) is
  `CREATE INDEX`, not `CREATE UNIQUE INDEX`, so the duplicate insert succeeded
  rather than failing loudly.
- The overwrite was traced to the path, not inferred: the version is
  interpolated into the folder segment for all four document families, and the
  generation path's file name is derived from the document type alone, so a
  repeated version number resolves to the identical object key. The storage
  adapter's upload overwrites unconditionally.
- Every test that exercises this writer for real was enumerated before the
  behaviour was changed. Of the 24 suites that reference the module, 22 mock it
  wholesale and only one — the writer's own suite — calls it; that suite's
  prior-version mock already returns a null error, which is why the new refusal
  breaks nothing existing. The one integration suite that names the writer mocks
  it too.
- The client-facing consequence was located in the regeneration route, which
  prints the version it was handed back as a client-facing label, and in the
  workbook route, which compares a recorded version to an expected one.

## Known Gaps

- **The supersede failure is reported to the operator log only**, with no field
  on the response and no reader in the product. That is deliberate: the state it
  describes — two records marked `current` for one document type — is an
  operator repair, not something the person filing the document can act on, and
  readers order by recency and take the first match, so the newly filed record
  still wins and the older one is a visible duplicate rather than a stale
  version being signed. A field no reader consumes would have been inert.
- **The refusal's own sentence depends on the caller.** This release names the
  failure; it does not audit how each of the fifteen call sites renders it. A
  caller whose catch hands the error to a responder that re-throws will still
  answer without a body. That is the bare-catch lane's subject and has its own
  ratchet; the refusal is nonetheless an improvement on a silent overwrite at
  every one of those sites.
- **The three unreadable reasons are not equally reachable today.** A failed
  query is the live one. A result carrying no row collection, and a prior row
  whose version is not a usable integer, are guards: the current client always
  returns an array for this query shape, and the column is a non-null integer.
  Both are reachable through the function's own input contract and are exercised
  by cases, but neither has a measured live instance. They are cheap and the
  failure they would otherwise produce is severe — an unguarded string version
  concatenates rather than adds, placing the bytes at a fabricated address.
- **The best-effort blob write is untouched.** A document whose bytes fail to
  store is still registered with an `unconfigured` stamp rather than refused,
  because the upload route does not pass `requireBlobStored`. That remains a
  governed behaviour change owed to Anand as a product call, carried from the
  preceding releases.
- Not `live-proven`. A signed-in walk is owed, and the **regression direction is
  the one to watch**: filing a document must still work unchanged in both
  lineage states — a first upload or first generation landing as version 1, and a
  second of the same type landing as version 2 with the first marked superseded
  and still downloadable. The refusal direction is reachable only by breaking the
  registry read and is not worth staging.
