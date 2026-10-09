# u636 — A refused download says whether the file is gone

## Release ID

`2026-10-08-u636-artifact-download-refusal-split`

## Status

`candidate`

## Plain-English Summary

Every row of a Move's document cabinet carries two controls, "Open" and
"Download". Both are plain links straight at
`GET /api/v1/programs/:programId/artifacts/:artifactId/download`, and nothing in
the product fetches that route, so when it refuses there is no client to catch
the refusal and dress it up. The browser renders the response body as a page.
That raw body **is** the screen the reader gets.

It said one thing for three different situations: a 404 whose whole explanation
was the five words _not found or storage unconfigured_. A disjunction, naming no
remedy, for three causes with three different remedies:

- **The file is not filed here.** The id is not on this Move for this client —
  a stale or mistyped link. Nothing is wrong and nothing can be done; the file
  the reader wants is somewhere else.
- **The file is listed but its contents were never written.** The registry row
  records the intended storage location and stamps itself `unconfigured`,
  because the write of the bytes is best-effort: if object storage was
  unavailable at the moment of upload the row is still created. The only copy of
  those bytes was the request body, nothing re-attempts the write, and no later
  attempt at this URL can ever succeed. The file is **gone** and the reader has
  to produce it again.
- **The contents are stored but could not be fetched just now.** Nothing is
  lost and nothing is owed by the reader. Waiting is the remedy.

Conflating the second with the first is the expensive one, and the old sentence
got it precisely backwards. _Storage unconfigured_ reads as an environment
problem someone else will fix, so a reader whose only copy of an evidence file
is unrecoverable is invited to keep retrying a link that will refuse forever,
instead of being told to upload it again. The same registry state is what the
cabinet's storage chip was taught to show in the preceding release; this one
makes the download path agree with it rather than contradict it.

The route could not have told these apart. Its producer collapsed all three to
a single `null`, and — the part that made the split possible at all — the
producer's own query did not even **select** the column that carries the storage
stamp, so the distinction was unavailable at the source, not merely unused at
the surface.

## Layer Impact

- `4 PRODUCTS` (Moves) — the document cabinet's two download controls. Which
  code, which status and which sentence a refused download produces changed.
- `3 CANONICAL MODEL` — unaffected. No schema, no migration, no write path. The
  producer's read adds one existing column to its `SELECT` list and classifies
  what it already fetched; nothing is written and no stored value changes.

**One status code changed deliberately, and one deliberately did not.** An
absent artifact stays **404**, because a row belonging to another client or
another Move resolves to that same answer and the two must stay
indistinguishable from outside — the refusal says nothing about whether the id
exists elsewhere, and a case asserts the sentence does not acquire that leak.
Unretained bytes now answer **410**, and unreachable storage **503**, matching
the house convention that only a retryable failure is 5xx.

Release lane: `global-control-lane`. Behaviour is identical for every tenant and
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared route behaviour and shared product copy.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none, and this matters for reachability. The document cabinet is
  reachable regardless of the capture-flow flags, so these two controls are
  live wherever the redesigned flow is enrolled. The sibling readers of the same
  download path that sit inside the phase body are dark in that configuration,
  which is why the fix is on the **producer and the route**: the screen is the
  server's own body, so correcting the route corrected the screen without
  touching a component file.

## Changes Included

- `src/lib/programs/move-artifact-download-refusal.ts` — new, and deliberately
  not `server-only` so a suite can reach the naming directly rather than only
  through a mocked route. Declares the three reasons with status, code,
  authored sentence and a `retryable` flag held as **data**, plus
  `moveArtifactBytesNeverRetained`, which reads the row's storage stamp through
  either an object or a JSON-encoded `metadata` column. That reader answers
  `true` **only** for an explicit `unconfigured` stamp: a row with no stamp at
  all is not evidence of loss, and reporting a file as gone when the row does
  not say so is the one error this classification may not make.
- `src/lib/programs/deliverables/move-artifacts.ts` — adds
  `downloadArtifactOutcome`, which names its failure instead of returning
  `null`, and adds `metadata` to the row `SELECT` so the two unfetchable causes
  can be told apart at all. A comment on that column list says what dropping it
  silently costs. `downloadArtifactBytes` is kept and now delegates, returning
  the file or `null` exactly as before, so its **nine other product call sites
  are unchanged** and none of them needed an edit. A row whose stamp says
  `unconfigured` but whose bytes **are** fetchable is still served: the stamp
  records one past write attempt, not the present state.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/download/route.ts`
  — reads the named outcome and answers each cause with its own status and
  sentence. The success path is untouched: same bytes, same content type, same
  inline/attachment disposition.
- Suites: `src/lib/programs/__tests__/move-artifact-download-refusal.test.ts`
  (new, 15 cases — the naming and the stamp reader),
  `src/lib/programs/__tests__/move-artifact-download-route-refusal.test.ts`
  (new, 8 cases — the route's mapping and its unchanged success path), and +11
  cases in `src/lib/programs/deliverables/__tests__/move-artifacts.test.ts` —
  the **producer's own** classification, exercised against real row and
  download behaviour rather than a mock of itself.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.
- **No workflow edit.** Both new suites' homes are directory-swept by the
  required AI-surface control catalog (`src/lib/programs/__tests__` and
  `src/lib/programs/deliverables/__tests__`), so they are merge-blocking as
  written.

## QA / Validation

- **PASS** `npx jest --runTestsByPath` on the three affected suites — 3 suites /
  39 tests, including the 34 new cases.
- **PASS** Wider regression: `src/lib/programs/__tests__` 192 suites / 2687
  tests; `src/lib/programs/deliverables/__tests__` and
  `src/lib/programs/stage-readiness-workbooks/__tests__` together 16 suites /
  156 tests; the route suites of every changed caller — the programs artifacts
  routes, the deliverable sign-off route and the stage-readiness-workbook route
  — 8 suites / 116 tests. All green.
- **PASS** Mutation testing, 14 mutants, **14 killed**, both directions. Suite
  and test counts were compared against the 3/39 baseline on every mutant, not
  just the exit code.
  - producer, where the labels are actually computed: the two unfetchable
    labels swapped, i.e. a lost file reported as a wait and a wait reported as
    a loss (3 fail); `metadata` dropped from the `SELECT`, which is the state
    the fix started from (1 fails); an unfetchable row falling back to
    not-found, i.e. the defect being removed (3 fail); a stamped row refused
    without attempting the fetch, so a recoverable file is declared gone
    (1 fails); the tenant belt-and-braces check deleted (1 fails);
    `downloadArtifactBytes` no longer collapsing a refusal to `null`, which is
    the contract its nine other callers rely on (4 fail, including a
    pre-existing case).
  - naming: an absent stamp made to claim the bytes are lost — the
    over-reporting direction (7 fail); unretained bytes answering 404 like an
    absent row, i.e. the conflation this release removes (4 fail); unreachable
    storage described as terminal (4 fail); an absent artifact no longer a 404,
    which would break the cross-tenant contract (4 fail); the not-found
    sentence made to say the id belongs to another client (1 fails); the
    JSON-encoded `metadata` column no longer read (1 fails).
  - route: every refusal forced back to 404 (3 fail); the old
    `artifact_unavailable` / _not found or storage unconfigured_ body restored
    (5 fail).
  - **One mutant was withdrawn as behaviour-neutral rather than reported as a
    survivor.** Rewriting the delegation as `outcome.file ?? null` survived, and
    correctly so: a refusal outcome carries no `file`, so the expression is
    identical to the original. It was re-run as a mutation that does change
    behaviour — returning the outcome object itself, which is truthy — and that
    one is killed. A survivor that cannot change behaviour is not a coverage
    gap.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, no output.
- **PASS** `npx eslint` on all six changed and added files — exit 0.
- **PASS** Prettier, measured in place per file. The one pre-existing file whose
  text was edited beyond additions —
  `src/lib/programs/deliverables/__tests__/move-artifacts.test.ts` — was checked
  **at its base revision in its own directory**, so the repo config applied, and
  it was already clean; `diff -u` against prettier's output on the edited file
  then prints no hunks, so no pre-existing line was reformatted into this
  change. The two other edited files and the new module passed `--check` without
  ever being rewritten.
- **PASS** Census, with the basis stated. `main` commits 2890 test files / 2726
  covered; a regen of this branch reads 2892 / 2728 — exactly the two new test
  files, so the **inherited drift on this base is zero** and the delta being
  exactly two is itself the check. `uncoveredTestFiles` is unchanged at 164,
  because both new suites land in directories the required catalog already
  sweeps.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Signed-in walk. No claim in this record is `live-proven`.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys; no separate step. Nothing is flag-gated, so the corrected refusals are
live for every tenant as soon as the revision takes traffic.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This release introduces no Azure command, no revision weight change and
no Container App template change, and nothing in it was deployed by hand.

## Rollback Plan

Revert the squash commit. The change is one route's refusal bodies and statuses,
one added read column, and one additive producer function whose only product
caller is that route — `downloadArtifactBytes` keeps its previous signature and
behaviour, so the nine call sites that use it are not touched in either
direction. No stored record is written or altered, so a revert restores the
previous single 404 with nothing to migrate and no state to repair.

## Audit Evidence

- `artifact_unavailable` and the string _not found or storage unconfigured_ were
  each measured on the base commit as occurring in exactly **one** place
  repo-wide, this route, so no other producer or reader shared the code being
  replaced. (An unrelated Source NDA module uses a same-named constant of its
  own; it is a different module and is untouched.)
- The reader was resolved before the fix was designed, not assumed: the two
  cabinet controls are `<a href>` elements built by `artifactInlinePreviewUrl`
  and `artifactFinalDownloadUrl`, and a search for a `fetch` of this route
  across the product returns **nothing**. So there is no client branching on the
  status, which is what makes the two new status codes safe, and no client
  interposing on the body, which is what makes the body the screen.
- The route has no suite of its own and creating one beside it would be dark
  until the required catalog names it file by file, so the route's wiring is
  pinned from `src/lib/programs/__tests__`, which the catalog sweeps wholesale.
  Those cases mock the producer and the suite's own header says so, which is why
  the producer's classification is pinned separately against real row and
  download behaviour.

## Known Gaps

- **The upload path's fail-open is not fixed here.** The live evidence upload
  route does not pass `requireBlobStored`, so an upload whose bytes are lost is
  still registered rather than refused, and its extraction remains approvable.
  This release makes that state legible at the moment of download; refusing the
  upload outright is a governed behaviour change and is owed to Anand as a
  product call.
- **This route's catch is still a bare call to the shared tenancy responder**,
  which re-throws a non-tenancy error. It is left alone on purpose: everything
  the handler calls either throws a tenancy error or swallows its own failures,
  so the re-throw is not reachable from here, and the bare-catch lane has its
  own ratchet. An unreachable arm is not worth an edit that would move that
  ratchet's count.
- A row with **no** storage stamp and unfetchable bytes is reported as
  unreachable storage, not as loss. That is the deliberate direction — the row
  does not say the bytes were never written — but it means a pre-stamp row whose
  bytes really are gone reads as retryable.
- Not `live-proven`. A signed-in walk is owed. The **regression direction is the
  one to watch**: a healthy file must still open inline and download as an
  attachment from both cabinet controls, with the same filename and content
  type, for both an uploaded evidence file and a generated deliverable. The
  refusal directions matter less and are hard to stage without breaking storage.
