# 2026-10-06-claim-gate-route-segment-paths — a declared path with a dynamic route segment now locks

## Release ID

`2026-10-06-claim-gate-route-segment-paths`

## Status

`candidate`

## Plain-English Summary

The execution claim gate exists to stop two automated runs editing the same file at the same
time. Each run declares the files it intends to touch, and the gate refuses a second run that
asks for a file somebody already holds.

It could not see most of the application's route files. The gate recognises a path by its
characters, and its character set admitted no square brackets or parentheses — the two things
every Next.js route directory is named with. So a run that correctly declared
`src/app/api/v1/source/[eventId]/stage/route.ts` was not refused on that file and was not
warned about it either: the path was not vetoed, it was never seen. Measured over the live
register, 223 declared or named paths were in that shape and **not one of them held anything**,
while 357 files under `src/app` carry a bracketed segment and 341 carry a route group.

This was the expensive direction of the same reader defect that item `T-804` closed from the
other side. `T-804` was a false *refusal*: it cost one reader a second look and announced
itself. This is a false *pass*: it put two runs on one route file and told neither.

The fix widens the path grammar to the four shapes the framework actually writes — `[id]`,
`[...slug]`, `[[...filter]]` and `(group)` — rather than admitting brackets loosely, because the
register is full of markdown links and a loose class reads `[record](docs/x.md)` as a single
token and invents a path called `record](docs/x.md`.

Measuring the change surfaced a second effect worth naming. An unreadable segment did not merely
fail to hold its own path — it **split the list it sat in**. The gate decides a whole list at
once, so a `Files released:` cue at the head of a list governed everything after it only while
the list stayed contiguous; an unread route path broke it in two and the tail stayed *held* on a
line that said in words it was releasing it. Two lines of the live register held 9 and 7 paths
that way. Both are release lines, which the hold reader discards in any case, so no refusal ever
came of it — but the reading was wrong, and the same split would land on a claim line's
disclaimer just as readily.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operations tooling — the pre-claim gate
that decides whether an automated execution run may take a file. It reads an operator-owned
register and writes nothing. No product layer changes.

- Layer 1 Client intake — unaffected.
- Layer 2 Source adapters — unaffected.
- Layer 3 Canonical model — unaffected.
- Layer 4 Products — unaffected. Nothing here is imported by the application or shipped in the
  image.

## Client Applicability

- All clients: no.
- Specific clients: no.
- Internal only: yes — the execution claim gate used by scheduled automation runs.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/register-time-authority.mjs` — `PATH_TOKEN` is rebuilt from a route-aware segment
  grammar (`DYNAMIC_SEGMENT`, `ROUTE_GROUP`, `routeSegment`). The segment is written so that
  every repetition must consume a bracket or a paren and a plain run never nests inside another
  quantifier: the naive `(?:PLAIN+|GROUP)+` is the classic exponential-backtracking shape, and
  this reader runs over every line of a 3.8 MB file.
- `scripts/exec/register-time-authority.test.mjs` — 19 cases, driving the real CLI as a child
  process over fixtures for the gate-level ones.

No migration, no route, no schema, no flag.

## QA / Validation

**Failing first, over the same scope.** `scripts/exec/register-time-authority.test.mjs`:

| | before the fix | after the fix |
|---|---|---|
| this suite | **8 failing**, 368 passing | **0 failing**, 382 passing |

The 8 were the gate-level refusal for a bracketed path and for a route-group path, the
grouped-path kind, the catch-all and optional-catch-all readings, the bracketed scope, the
suffix-less bracketed token, and the released-list split.

**Through the CLI, not on the predicate.** Every gate-level case runs
`register-time-authority.mjs --preclaim` as a real child process and reads its exit status.

**End-to-end on a copy of the live register.** A claim declaring the real route file
`src/app/api/v1/source/[eventId]/stage/route.ts` was appended through `append-claim.mjs` to a
copy of the register, and a second run under a different identity asked for that exact path with
the same command and the same queue:

- judged by `origin/main`: `Pre-claim passed — take`.
- judged by this change: `REFUSED BY THE FILE HALF — 1 of 1 requested path(s) already held`,
  naming the path, the holder `runner-one#E2E` and the line number.

**The discriminator, re-measured in both directions and not assumed.** `claimedPaths` run over
every line of the live register, before and after:

| | before | after |
|---|---|---|
| holds read | 5,870 | 5,936 |
| distinct paths | 1,894 | 1,983 |
| wall time | 48 ms | 47 ms |

- **110 distinct paths newly admitted** (304 occurrences). **101 exist in the working tree.** The
  other 9 are path-shaped route files that do not exist at this SHA — renamed or deleted test
  files and one `[tenantSlug]` page. **Zero non-path tokens were newly admitted**: no English,
  no `Product/Lab`, no `and/or`, no `24/7`, no markdown-link fragment.
- **21 distinct paths no longer admitted.** 5 of them, and every one that reached the hold
  reader, are **scopes** — `src/app/`, `src/app/api/v1/source/`,
  `src/app/api/v1/source/events/`, `source/events/`, `/api/v1/source/` — which are the prefix
  truncations the old tokenizer produced when it stopped at a bracket. A scope is a note and
  never refuses, so nothing that refused before stops refusing. The remaining 16 are the two
  release lines described above, replaced by the correct reading that the line releases its list.

**Through `heldPaths`, which is what the gate refuses from:**

- **Live 3-hour window: 13 holds before, 13 after, 0 changed.** No claim live at this instant
  declares a bracketed path, so the published held-paths table does not move today. The effect
  is on the next run that declares one.
- **Whole register, window off: 1,025 holds before, 1,035 after.** 34 newly held, every one a
  real route file that previously locked nothing, across 13 holder identities. 5 no longer held,
  all 5 the truncation scopes above.
- **Newly colliding with a live claim: none.** Stated as measured rather than as hoped — this
  change can only add refusals, and some of them will be correct ones a run was getting away
  with.

**Mutation proof — 8 of 8 killed.** Each mutation was applied to the shipped file alone and the
suite re-run; the harness asserts the pattern matches exactly once before editing, so a mutation
that silently applied to nothing cannot read as a survivor.

| | mutation | verdict | failing cases |
|---|---|---|---|
| M1 | drop the dynamic-segment branch (back to the defect) | KILLED | 8 |
| M2 | drop the route-group branch | KILLED | 5 |
| M3 | admit one bracket only, missing `[[...filter]]` | KILLED | 1 |
| M4 | forbid the catch-all dots, missing `[...slug]` | KILLED | 2 |
| M5 | loosen the group to any bracket character | KILLED | 2 |
| M6 | let a group's contents cross a slash | KILLED | 2 |
| M7 | let a segment match empty | KILLED | 1 |
| M8 | drop the multi-group repetition in one segment | KILLED | 1 |

Both directions are covered, which is what the acceptance asked for: M1 and M2 prove a bracketed
path on a declared list must lock, and M5 and M6 prove a bracketed token that is not a path must
not.

Three of these survived the first pass, and the diagnosis is worth recording because two were
real gaps in the tests rather than equivalent mutants:

- **M6** survived against a control written as `[the record](docs/x.md)`. The space in the link
  text makes a single token impossible whatever the grammar admits, so the space was doing the
  work and the grammar was untested. Rewritten space-free as `[record](docs/x.md)`, the mutation
  invents `record](docs/releases/records/t804.md` and loses the real target. It fires on no line
  of the register today only because every link there happens to have a space in its text, which
  is luck and not a property.
- **M7** survived with no case for the non-empty segment. Measured over the register it invents
  `/` and `//` as scopes and **loses 21 real files**, so the `+` is load-bearing.
- **M8** changed nothing observable over all 1,983 pairs, because a segment with two groups is a
  shape nothing in this tree writes. It is not an equivalent mutant in general — Next.js
  intercepting routes write `(..)(..)feed` as one directory name — so the case added is that
  real framework shape rather than a synthetic one.

**Sibling suites, all green on this branch:** `append-claim` 100, `build-execution-queue` 229,
`signed-in-proof-reconcile` 127, `fossil-claims` 91, `self-falsifying-assertion-probe` 91,
`id-collision` 72, `register-merge-coverage` 53, `deploy-proof-resolver` 50, `cli-entry` 34,
`queue-provenance` 30, `claimable-preconditions` 23, `register-citation-check` 22 — 0 failed in
each.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
0**, judged by exit code rather than by grepping for `error TS`, with 0 diagnostics emitted.

**The board generator still exits 1** over these inputs, for 291 backlog ids that are not on the
structure map. That is pre-existing: `origin/main`'s own generator exits 1 over the identical
inputs. Named here so the non-zero exit is not read as this change's.

## Rollout Plan

Merge to `main`. **No runtime rollout.** Nothing in this change is imported by the application
or shipped in the container image, so no image build, no revision shift and no flag update
follows from it. The change takes effect for the next automation run that invokes the gate from
a checkout containing it.

## Deployment Authority

- Repo-owned deploy workflow: not exercised — no runtime artifact changes.
- Shared runtime mutators: none.
- Approved image digest: not applicable; no image is built from this change.
- ACA runtime invariant: unaffected. No template image, revision weight or worker job is touched.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is stated rather than skipped — this
  change has no product surface and renders nothing. A signed-in session would exercise no line
  of it.

## Rollback Plan

Revert the single commit. The gate returns to its previous reading, which is the defect: a
declared route path holds nothing. There is no migration, no state and no deployed artifact, so
revert is the whole of the rollback.

## Known Gaps

- **A route-group segment in the FIRST position of a path is still unreadable.** The token
  grammar reaches a path through a delimiter class that includes `(`, so an opening paren in
  front of a path is consumed as punctuation and `(maestro)/source/page.tsx` written with no
  prefix reads as nothing. Every route path the register actually writes is rooted at `src/`, so
  no declared entry is in that shape today, and the delimiter cannot be narrowed without losing
  the far commoner `(scripts/exec/foo.mjs)`. Measured, not assumed: 0 occurrences on the live
  register. Left open rather than fixed speculatively.
- **A bracketed directory with no trailing slash and no extension still holds nothing**, e.g. a
  declared `src/app/api/v1/source/[eventId]`. The normaliser strips a trailing `]` before the
  suffix test, so the token fails it and is dropped. That is the pre-existing rule for every
  extension-less, slash-less token and is not specific to route segments; a scope is declared
  with a trailing slash. Unchanged by this item.
- **The two release lines whose reading changed are not reconciled in the register.** Their old
  reading held 9 and 7 paths each on lines that said in words they were releasing them. Both are
  release lines, which `heldPaths` discards, so no refusal ever came of it and nothing is owed to
  any run — but the register still carries the lines, and nobody has checked whether any other
  line's disclaimer was split the same way and did reach a claim. Counting that is a separate
  measurement.
- **No live claim exercised the fix on the real register.** The 3-hour window held 13 paths
  before and after, because no claim live at the time declared a bracketed path. The end-to-end
  proof is on a *copy* of the live register with a claim this run appended to it. The first
  genuine refusal will come from the next run that declares a route file.

## Audit Evidence

- The pull request this record ships with, and its CI run.
- `node scripts/exec/register-time-authority.test.mjs` — 382 passed, 0 failed; 8 failing on the
  parent commit over the same scope.
- The mutation table above, reproducible by applying each listed substitution to
  `scripts/exec/register-time-authority.mjs` and re-running that suite.
- `node scripts/exec/register-time-authority.mjs --file <register> --since <ISO>` runs clean over
  the live register and reports the same 2 pre-existing `unsourced_elapsed` violations before and
  after.
