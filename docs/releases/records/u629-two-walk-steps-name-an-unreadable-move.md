# u629 — Two Walk Steps Name an Unreadable Move

## Release ID

`2026-10-08-walk-step-move-unreadable-refusals`

## Status

`candidate`

## Plain-English Summary

If a reviewer's workspace access narrows while they have a Move's phase page
open — the Move is archived, or their grant list no longer includes it — the two
things they can do from that page both stop working. Saving a captured answer
fails, and asking the assistant for cited drafts fails.

Until this change, neither failure told them anything. Both requests answered
with a machine code and no sentence, and both of the places that display such a
failure fall back to printing whatever the server sent. So the screen showed the
literal text `not_found` — once inside the assistant's draft panel, and once in
the small error slot directly beneath the box the reviewer had just typed into.
A reader has no way to act on that. It does not say the Move is the problem, it
does not say their access is the problem, and it does not say where to go next.

Both requests now answer with the sentence the product already uses for exactly
this situation on the gate-approval and phase-advance steps: the Move could not
be opened for this account, it may have been removed or the account's access may
no longer include it, and the Moves list shows what they can work on. The code
and the HTTP status on the wire are unchanged, which matters — a reviewer is
deliberately not told which of the three causes applied, because answering that
would reveal whether a Move they cannot see exists at all.

Two consequences worth stating plainly. First, nothing about when a request
succeeds or fails changed; only what a failed one says. Second, one response was
deliberately left alone: the read-only version of the capture request keeps its
bare body, because no screen in the product displays it, and adding words to a
response nobody reads would be upkeep with no reader. There is now a test
holding that decision in place so a later tidy-up pass does not "complete" the
work by changing it.

## Layer Impact

- `global-control-lane` — shared refusal copy on two product API routes in the
  Moves phase workspace. No schema, no data-plane, no tenant-scoped behavior
  changes; the status codes and error codes on the wire are byte-identical to
  before.

## Client Applicability

- All clients: yes — the refusal copy is unconditional and not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is inside refusal bodies both the legacy and
  the v2 capture arms already read, so it applies regardless of capture flag
  state.

## Changes Included

- `src/app/api/v1/programs/[programId]/phase-input-draft/route.ts` — the
  Move-unreadable arm answers the canonical refusal body instead of a bare code.
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — the same for
  the write path. The read path is deliberately unchanged.
- `src/lib/programs/move-unreadable-refusal.ts` — comment only. Its header
  enumerated "the two live Moves mutation routes", a count that this change made
  wrong; it now enumerates the walk's steps and states which of them has a
  reader, which has no refusal arm at all, and which is deliberately excluded.
- New: `src/app/api/v1/programs/[programId]/phase-input-draft/__tests__/route.test.ts`
  (21 cases) — the drafting step's first route suite.
- New: `src/app/api/v1/programs/[programId]/phase-capture/__tests__/move-unreadable-refusal.test.ts`
  (5 cases) — the write path's refusal and the read path's deliberate silence.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 2 cases rendering the real phase workspace, one per display location.
- `.github/workflows/ai-surface-control-catalog.yml` — one step naming both new
  route suites by exact path. Neither directory is swept by any job, so without
  this they would run nowhere.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — the two new route suites: 26 of 26 cases.
- **PASS** — mutation testing, 12 mutations, 12 killed, in both directions:
  reverting either route to its bare body fails; adding the sentence to the
  read-only arm fails; emitting a retry hint neither reader consumes fails
  (either route); replacing the sentence with the wire code fails 5 cases;
  widening the drafting range to the stage-6 handoff fails; rethrowing instead
  of degrading on an evidence-read outage fails; consulting the per-phase
  evidence read on P1 fails; letting a session-expiry refusal fall into the
  crash arm fails; flipping the read-only claim fails; reading capture state
  before the refusal fails.
- **PASS** — regression sweep: 264 suites / 3,584 tests across
  `src/app/api/v1/programs`, `src/lib/programs/__tests__` and
  `src/components/strategic-moves/__tests__`.
- **PASS** — `npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` over every changed path: exit 0, no errors and no
  warnings.
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`, exit 0,
  50 directories swept by a required job.
- **PASS** — census: base measured in a clean detached worktree of the base
  commit reads 2878 / 2714 with zero drift; the branch reads 2880 / 2716, so
  base +2 on both, with `uncoveredTestFiles` unchanged at 164. Both new suites
  are registered, not dark.
- **PASS** — prettier, checked per file in place against the base. Four of the
  five pre-existing files are clean at base and remain clean. The fifth
  (`phase-capture/route.ts`) warns at base, and all five hunks it proposes fall
  on pre-existing lines — none contains an identifier or comment of this change
  — so it is left as it was found. Both new files are clean.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — signed-in walk. No runtime proof of this change exists; see
  Known Gaps.

## Rollout Plan

Merge to `main` via squash. The change is active on the next ordinary
repo-owned ACA main deploy; it needs no migration, no flag, and no separate
rollout step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none. This change runs no Azure command and does not
  touch the shared web Container App template, revision weights, or traffic.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unchanged by this PR; the next main deploy asserts it.
- Worker image invariant: unchanged; no worker job images are affected.
- Feature/env flag update path: none; no flag or environment variable changes.
- Live signed-in proof required: yes, for the product claim. This record claims
  `merged` and `deployed`-able only, never `live-proven`.

## Rollback Plan

Revert the squash commit. No migration, no data change, and no flag to unwind.
Reverting restores the previous refusal bodies exactly, since neither the HTTP
status nor the error code was altered.

## Audit Evidence

- The PR and its CI run, including the required
  `ai-surface-control-catalog` job, where the new step runs both route suites.
- The mutation table above, reproducible by reverting each route arm in turn.
- The census diff, showing +2 covered and `uncoveredTestFiles` unchanged.

## Known Gaps

- **No live proof.** Nothing in this change has been exercised by a signed-in
  walk. That needs a human in the product.
- **The session-expiry refusal still shows its code.** A request that fails
  because the signed-in session expired answers `401 unauthenticated` with no
  sentence, and the drafting panel prints that token. It comes from the shared
  tenancy helper that answers every route under `/api/v1/programs/**`, so
  naming it there is a wider change with other suites pinning that body; it was
  deliberately left out of this one. The new drafting route suite asserts the
  current shape, so the gap is recorded as a check rather than as prose.
- **Roughly thirty other routes still answer a bare code.** The same
  Move-unreadable arm appears unnamed across non-walk
  `/api/v1/programs/**` routes. They are out of scope here on purpose: each
  needs its own readers enumerated first, because a route whose body no screen
  renders should keep its bare body — the read-only capture arm in this change
  is the worked example.
- **The read-only capture arm is unnamed by design.** If any client ever starts
  fetching it, the test that holds it bare is the one to change.
