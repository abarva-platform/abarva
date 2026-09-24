# 2026-09-24-board-verdict-heading-attribution — a closure written at the wrong heading depth reached nothing

## Release ID

`2026-09-24-board-verdict-heading-attribution`

## Status

`candidate`

## Plain-English Summary

The execution board is a generated view over three operator documents. It holds no status of
its own: every rung it reports — open, PR, merged, deployed, proven, closed — is a phrase
lifted out of one of those documents, and the work queue that tells an agent what to pick up
next is derived from the rungs.

One of the shapes the documents use to record an outcome is a heading: `Item <id> — CLOSED`,
`Item <id> — deploy verified`, `Item <id> — re-verified`. The reader accepted that shape only
at heading depth three (`###`). The documents write it at depth two. Measured on the live
backlog: **348 `## Item` headings against 128 `###`, and 62 of the depth-two ones state an
outcome.**

Most of those depth-two notes happen to carry a table row for their own id inside the note,
and the *table* reader picks the outcome up from there — so the gap did not show. Where the
note is prose only, the outcome reached no corpus at all and the item stayed at the bottom
rung with a closure written directly above it. **Five ids were in that state.**

The residual report could not name them either. It is a set difference over *ids*: an id the
extractor never produced is reported as unparsed, and each of these ids **was** produced, by
its own table row somewhere else in the document. So the count read zero over exactly the
population that was missing — the same shape as a gate that proves a control exists by
finding its name in a file, reached from a different direction.

The cost was not theoretical. One of the five was the only row the claimable queue offered
outside the data-plane lane, and it had been recorded as finished nine hours earlier. Two
separate scheduled runs spent their triage budget re-discovering that, one of them writing
the closure that the reader then could not see.

Three things changed:

1. **The reader accepts the shape at any heading depth.** At depth three and deeper, any
   title, exactly as before. At depth two, only a title the outcome vocabulary already
   recognises — reading all 348 depth-two headings as item *definitions* would invent a second
   definition for hundreds of ids and suppress every one of them as ambiguous.
2. **A depth-two note contributes its heading, not its body.** This was measured, not
   assumed: with the body included, four items rose a rung off sentences in a narrative about
   neighbouring work, and one item moved from `Closed` to `PR / CI` because its closure note
   cites the pull request that closed it and the reader tests for an open PR *before* it tests
   for a closure. The heading is the operator's verdict; the body is the story around it.
3. **A lane suffix on the id scopes the verdict.** Where one number holds two different items
   the operator disambiguates by writing `T-458(D)`. An outcome note is deliberately admitted
   through every structural pin, so an unscoped reading of that suffix would also close the
   lane-U item of the same number, which is open on a decision nobody has taken. The suffix
   now has to match the lane the item's own definition declares, it **fails closed** when it
   does not, and the withheld verdict is named on stdout and in the summary rather than
   dropped in silence.

## Layer Impact

Release lane: **`internal-admin`**. AbarVa-only operator tooling. No client, no product
surface, no data plane.

- **Layer 4 (products):** none. No route, component, prompt, read model, migration or tenant
  record is in scope. No application code imports `scripts/exec/*`. Two behaviour suites under
  `src/__tests__/` do reference that directory by **path at run time** —
  `census-reads-invocations-by-position.test.ts` reads `scripts/exec/cli-entry.mjs`, and
  `test-ci-coverage-census.test.ts` names the directory in a comment — which an import-closure
  check would miss. Neither file this change touches is among their subjects; both were run and
  pass (2 suites, 60 tests).
- **Control/tooling (not a data-operating-model layer):** the board generator and the
  structure map it reads. The queue generator is unchanged; it consumes the summary the board
  writes and inherits the corrected rungs.

## Client Applicability

**Recipients: internal AbarVa operators only — no client receives this change.** Applies to
all clients equally in the sense that it applies to none: no tenant, cover name or
client-scoped artifact is read or written, and no client-facing surface changes. The operator
documents this reader parses are private and are not part of this repository.

## Changes Included

- `scripts/exec/build-source-board.mjs`
  - `backlogProseItems` accepts `Item <id> — title` at heading depth 2–6 instead of depth 3
    only; at depth 2 the title must be outcome-shaped. A `(D)`/`(U)`/`(C)`/`(T)` suffix on the
    id is carried out as `laneScope`; an optional parenthetical qualifier before the dash is
    tolerated (`## Item 50 (template ...) — verified ...`).
  - The section terminator is depth-aware, so a depth-three item's body is byte-for-byte the
    span it was before.
  - `UPDATE_TITLE` moved above `backlogProseItems`, which now needs it. One regex decides both
    "is this heading a verdict" and "is this definition a note"; two would drift.
  - `attributableStatusText` restricts a depth-two note to `section` + `title`.
  - `buildItem` filters a lane-scoped note against the lane its *substantive* definitions
    declare, fails closed on a mismatch, and records it.
  - New report line `verdict lane suffix unmatched:` and new summary field
    `laneScopedVerdictsUnattributed`, written on every run including at zero.
- `scripts/exec/build-source-board.test.mjs` — four new cases (nine assertions).
- `scripts/exec/source-stage-map.json` — places `T-750`, so the item is visible to the queue
  rather than dropped before its table.

## QA / Validation

**Red first, same suite, same scope.** `node scripts/exec/build-source-board.test.mjs`:

- before the generator change, with the new cases present: **46 passed, 5 failed**
- after: **51 passed, 0 failed**
- clean baseline on `origin/main` before any edit: **42 passed, 0 failed**

**Three deliberate mutations, each naming its own guard.** Reverted after each; the working
tree returns to 51/0.

| mutation | result |
|---|---|
| heading depth narrowed back to `#{3,6}` | 46 passed, **5 failed** — the depth-two cases and the withheld-verdict report |
| lane-scope filter made fail-**open** (`if (true) return true`) | 47 passed, **4 failed** — the lane-U item closes, and the withheld verdict is neither withheld nor named |
| depth-2 title narrowing removed (`if (false) continue`) | 48 passed, **3 failed** — including two pre-existing residual cases, which is why the narrowing is there |

**Measured against the live corpus, not only fixtures.** Both generator versions run over a
copy of the live operator documents, and every item's rung diffed:

| rung | before | after |
|---|---|---|
| Signed-in proven | 35 | 35 |
| PR / CI | 30 | 30 |
| Deployed | 183 | **186** |
| Merged | 141 | **140** |
| Open | 53 | 53 |
| Closed | 21 | 21 |

Three items move, and each move is the document's own word:

- **`67`** `Merged` → `Deployed`. Its note is headed `deployed 2026-09-19`.
- **`T-742`**, **`T-743`** absent → `Deployed`. Both had no parsed definition at all and sat
  in the residual; their rung comes from their own claim records, which already said deployed.
  The residual shrinks from four ids to two, and the census arithmetic still balances.

Collision count is unchanged at 65 of 472, which is the guard in the third mutation above
holding: no depth-two heading became a second *definition*.

**The withheld verdict, measured:** exactly one on the live corpus —
`T-458(D)` over the lane-U item of that number, correctly withheld and now named. The lane-D
item of the same number reads the verdict.

**Sibling suites, all green:** `build-execution-queue` 175/0/2 skipped, `queue-provenance`
30/0, `toolchain-manifest` 17/0, `id-collision` 70/0, `register-citation-check` 22/0,
`fossil-claims` 89/0/2 skipped, `append-claim` 61/0.

The two behaviour suites that reference `scripts/exec/` by run-time path
(`census-reads-invocations-by-position.test.ts`, `test-ci-coverage-census.test.ts`): **2 suites
passed, 60 tests passed.** They are named explicitly because an import-closure check would not
have found them.

**Census arithmetic, both versions:** every id discovered in item position is on the board, in
the residual, or in the unmapped drop list — **0 unaccounted before and 0 after**. Two ids
(`T-429`, `T-445`) are placed on a capability and appear only as `declaredIds`, which an
items-only walk misses; counting them as absent was a measurement error in the first pass of
this check, not a board defect.

`npx eslint` on both changed files: clean, exit 0.
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: **exit 0**, judged by
exit code rather than by grep, because a bare run exits 134 on this machine with no
diagnostics.

**End-to-end, on a copy of the live documents.** With the reader repaired and the one operator
closure note reworded into the vocabulary the control reads, the generated queue offers **3**
claimable rows instead of 4, and the finished item is no longer among them. The three
remaining are all data-plane rows, which is a different problem and is not this item's.

## Rollout Plan

Merge to `main`. No runtime rollout: operator CLI scripts, their suite, and one structure-map
entry. No application code imports them, so no image, revision, flag or environment variable
changes. The next board run picks the change up; the existing summary is invalidated by the
generator's own self-hash, which is that control working rather than a regression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified. It runs on
  merge as it does for any commit to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be confirmed from the merge-keyed deploy run's own
  `runtime-invariant-proof.json` plus an independent read-only Azure read, and recorded in the
  claim register.
- Worker image invariant: unchanged by this diff.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here is reachable from a product route or
  imported by the application.

## Rollback Plan

Revert the single commit. There is no state to unwind: no migration, no committed generated
artifact, no runtime configuration. The reader's previous behaviour returns immediately,
including its blindness to a depth-two verdict.

## Audit Evidence

- The pull request for this record, its checks, and the squash SHA.
- The red-first numbers and the three mutation runs, quoted in the PR body.
- The before/after rung distribution over the live corpus and the per-item diff behind it.
- The execution-queue toolchain CI job (`.github/workflows/execution-queue-toolchain.yml`),
  which runs the changed suite on a runner and triggers on `scripts/exec/**`.

## Known Gaps

- **The outcome vocabulary is not widened, deliberately.** A closure that states its verdict
  in words the reader does not recognise still reads as open. One live note said "re-verified
  ALREADY SATISFIED" and nothing else, and no heading-depth repair can read that; the operator
  document was reworded rather than the regex loosened, because `closed` in lower case appears
  in ordinary prose throughout these documents and matching it would promote by accident.
- **A lane suffix is only as good as the lane on the definition.** The item this was measured
  on is one of 38 rows whose declared lane contradicts its id prefix. Where a definition
  carries no lane at all the scoped verdict is withheld and named, which is the safe answer
  and not a complete one.
- **The rule order inside the rung deriver is untouched.** It tests for an open pull request
  before it tests for a closure, which is why a depth-two note's body is excluded from status
  here rather than filtered sentence by sentence. Reordering those rules would move items this
  change never looked at, and it is not attributable inside this diff.
- **Two ids remain in the residual** (`49`, `T-745`) in shapes this reader still does not
  parse. They are named on stdout and in the queue, which is the state item T-746 set for
  them; nothing here claims to have reduced that to zero.
