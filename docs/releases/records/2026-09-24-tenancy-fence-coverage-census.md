# 2026-09-24-tenancy-fence-coverage-census — Tenancy fence coverage census (C-508)

## Release ID

`2026-09-24-tenancy-fence-coverage-census`

## Status

`candidate`

## Plain-English Summary

Some of our API endpoints check which customer the caller belongs to before they
answer. A recent change proved that two of those checks had tests which could
never fail: the tests read the endpoint's **source text** and asserted that
certain words appeared in it, in a certain order. Break the check — invert it,
delete it, move it after the thing it is supposed to guard — and the words are
all still there, so the tests stay green.

Those two were found by accident. Nobody knew how many more there were.

This change adds a census that answers that, and nothing else. It does not
change any endpoint, and it does not change any test of any endpoint. It reads
the code the way a compiler does and reports, for every API route:

- whether the route actually **calls** a tenant check (not merely mentions one),
- and whether the tests covering it exercise the route (**behavioral**), only
  read its text (**byte-scanner**), or do not touch it at all (**none**).

The answer, on this commit: **387 API routes, 213 of which call a tenant check.
66 of those have a test that exercises the route. 7 have only text-reading
tests. 140 have no test touching them at all.** Those 147 unproven routes are
published as a ranked list, worst first, so the next repair is read off a
ranking rather than picked by whoever happens to be looking.

Repairing them is deliberately **not** in this change. One change that repairs
twenty endpoints is one change nobody reads, which is the failure this whole
work stream exists to correct. Each repair is its own item, drawn from the top
of the published ranking.

## Layer Impact

Release lane: **`internal-admin`** — an engineering control and a ranking
artifact. It ships no client-facing capability and no data-plane change, and it
is not feature-gated because there is nothing for a flag to turn off: the only
things it adds that execute are a CI job and a script an operator runs.

- **Layer 4 (Products)** — no product surface changes. No route, handler,
  read-model, prompt or rendering path is touched. The only files that execute
  at runtime for a user are unchanged.
- **Platform / test-and-release tooling** — a new repo-owned census script, its
  unit suite, an npm script trio, a committed artifact and a CI job that keeps
  the artifact current. `scripts/exec/source-stage-map.json` gains one entry so
  the backlog item this serves is visible to the execution queue.

Layers 1–3 (client intake, source adapters, canonical model) are untouched.

## Client Applicability

- All clients: none — no runtime behavior changes for any tenant.
- Specific clients: none.
- Internal only: yes. This is an engineering control and a ranking artifact.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

| file | what |
|---|---|
| `scripts/quality/tenancy-fence-coverage.mjs` | the census. Resolves imports and decides "is this a call" with the TypeScript compiler; grows the fence surface from `src/lib/auth/tenancy.ts` to a fixpoint so wrapper modules are found without a hand-kept list; classifies each covering suite; ranks the unproven. `--write` regenerates, `--check` fails on drift. |
| `scripts/quality/tenancy-fence-coverage.test.mjs` | its suite. Fixture cases for each classification, **plus real known positives pinned to files in this repository**, plus a both-directions drift test. |
| `docs/security/tenancy-fence-coverage.json` | the committed census and the ranking, with the executed mutation evidence recorded beside it. |
| `.github/workflows/tenancy-fence-coverage.yml` | runs the suite and the drift check on every pull request and merge group. |
| `package.json` | `audit:tenancy-fence-coverage`, `:check`, `:write`. |
| `scripts/exec/source-stage-map.json` | places `C-508`, which was one of eighteen ids the execution queue dropped before its table for want of a map entry and could therefore offer to nobody. |

No file under `src/` is modified by this change.

## QA / Validation

Measured on `origin/main` `f383dcd6b2e668297eb40ebb751bb4f33ab34165`, in a
dedicated worktree.

### The suite fails first

Written before the script existed: **0 passing, 1 failing** (the module did not
resolve). With the script: **15 passing, 0 failing.**

### The suite can fail — the detector was broken deliberately

The call-detection branch was neutered (`if (false && …)`) so that a called
fence reads as an uncalled one. **7 of 15 cases went red**, including all three
real-known-positive cases and the committed-artifact case. Restored: **15 of 15
green.** A detector whose inversion changes nothing is the shape this census was
built against; this one does not have it.

### The drift check can fail, in both directions

`--check` on the current tree exits **0**. One row of the committed artifact was
edited by hand (`src/app/api/chat/step/route.ts`, coverage `behavioral` →
`none`) and the check exited **1**, naming that exact row. An improvement is
treated as drift too and the suite asserts it: an artifact that lags behind its
own repairs mis-ranks the queue in the direction that reads like good news.

### The classifications were proved by execution, not asserted

Three of the 147 unproven rows were sampled and each mutation was actually run.
The full record is in `mutationProof` in the artifact; in summary:

| route | classified | mutation applied | suites after |
|---|---|---|---|
| `src/app/api/tower/synthesis/route.ts` | byte-scanner | fence deleted; refusal arm returns 200 | **green** — 16 passed / 0 failed, identical to the clean baseline |
| `.../communications/draft/route.ts` | byte-scanner | fence runs, refusal path removed (fail open) | **green** — same invocation, unchanged |
| `src/app/api/admin/context-layer/triage/route.ts` | none | fence deleted | **green** — `jest src/__tests__/behaviors`: 120 suites / 1114 passed clean, 120 / 1114 with the fence gone |

**The calibration that makes those greens mean something.** A green result
proves nothing unless the same command can go red. In the same jest invocation,
the fence on `src/app/api/chat/step/route.ts` — the one with behavioral proof —
was inverted, and its behavioral suite went **red (3 failed)** while the
byte-scanner suite for that same route stayed green beside it. One inversion
detected, two not, in one command.

**The `none` mutation was verified to be a real mutation and not an inert
edit.** A throwaway probe called the handler with an unauthenticated caller: the
real route answered **401**, the mutated route answered **403**. The response
changed and the gate did not notice. The probe was deleted; the tree is clean.

**An independent reader agrees.** `jest --listTests --findRelatedTests` lists
exactly the C-507 behavioral suite for `chat/step/route.ts` and lists nothing for
the sampled `none` route. Measured across the whole census, **0 of the 140
`none` routes is imported by any test file, and 0 has its URL stem named in any
of the 130 specs under `tests/`** — so `none` is not an artefact of the
handler-call heuristic. Nothing loads those routes at all.

**Sampled, not generalised:** 3 of 147. The other 144 carry the classification
the parser gave them and nothing more, and the artifact says so on its face.

### Other checks

- `npx eslint scripts/quality/tenancy-fence-coverage.mjs scripts/quality/tenancy-fence-coverage.test.mjs` — clean.
- `node --test scripts/exec/build-source-board.test.mjs` — 1 passing, 0 failing, after the structure-map edit.
- `npm run audit:tenancy-fence-coverage:check` — exit 0.
- TypeScript was not compiled because **no TypeScript file is modified by this
  change**. The three route files used for the mutation runs were restored from
  byte copies taken beforehand, and `git status` is clean of them.

## Rollout Plan

Merge to `main`. There is no runtime rollout: no image content that serves a
request changes, and no flag, environment variable or migration is involved. The
new workflow begins running on the pull request that adds it.

## Deployment Authority

Not applicable to shared runtime. Recorded for completeness:

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, untouched.
- Shared runtime mutators: none. This change starts no Azure command.
- Approved image digest: unchanged; nothing under `src/` is modified.
- ACA runtime invariant: unaffected by this change's contents. The post-merge
  deploy is verified as a matter of course, not because this release alters the
  image's behavior.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — there is no user-visible surface to
  prove. Stating this positively rather than leaving it blank: this record does
  not claim a signed-in acceptance and does not owe one.

## Known Gaps

Named rather than left implicit, because a sweep that reports only what it found
invites its numbers to be read as the whole truth.

1. **144 of the 147 unproven rows were not executed.** Three were sampled and
   the mutations run; the rest carry the classification the parser gave them.
   The sample was chosen to cover both classes, not at random, so it is
   evidence that the classifier is right about the cases it was shown and not a
   statistical estimate of the other 144.
2. **`byte-scanner` and `none` are classifications of PROOF, not verdicts about
   safety.** A route in either bucket may be perfectly correct today. What the
   census asserts is that nothing would notice if it stopped being correct.
   Reading a row as "this endpoint leaks" would be a misuse of it.
3. **A route exercised only over HTTP by a browser spec reads as `none`.**
   Measured on this commit that set is empty — no `none` route has its URL stem
   named in any of the 130 specs under `tests/` — so the gap is currently
   theoretical. It would stop being theoretical the moment such a spec is
   written, and the census would then under-report that route's coverage.
4. **The fence surface is grown by fixpoint and is deliberately coarse in one
   direction.** A module that calls `requireTenancy` for its own reasons has its
   exports marked, so a route calling one of them is recorded as `indirect`.
   Every such row names the hop in `fenceVia`, which is what makes the
   coarseness reviewable instead of hidden; the alternative, a hand-kept list of
   wrapper modules, is a list that goes stale silently.
5. **Only `src/lib/auth/tenancy.ts` seeds the surface.** Other governance
   boundaries — module access, program access, source access policy — are not
   measured here. Whether they deserve the same treatment is a real question and
   is not answered by this change.
6. **The eighteen unmapped backlog ids.** `C-508` was one of eighteen ids the
   execution queue dropped before its table for want of a structure-map entry,
   and so could be offered to nobody. This change maps one of them — the one it
   implements. Seventeen remain unmapped and therefore invisible to the queue.

## Rollback Plan

Revert the pull request. Nothing depends on the artifact at runtime; the only
consequence of reverting is that the new CI job stops running and the ranking is
no longer published. No migration, no data, no flag.

## Audit Evidence

- The committed census and its recorded mutation evidence:
  `docs/security/tenancy-fence-coverage.json` (`mutationProof.sampled`,
  `mutationProof.calibration`, `mutationProof.independentReader`).
- The suite: `scripts/quality/tenancy-fence-coverage.test.mjs`, in particular the
  cases named `REAL:`, which are pinned to real files rather than to fixtures.
- The CI job: `.github/workflows/tenancy-fence-coverage.yml`, and its step
  summary, which prints the three census lines and the top of the ranking on
  every run.
- Backlog item `C-508`, and the item it continues, `C-507`
  (`docs/releases/records/2026-09-24-c507-route-tenant-fence-proof.md`).
