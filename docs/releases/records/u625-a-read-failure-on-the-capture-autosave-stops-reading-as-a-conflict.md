# 2026-10-08-a-read-failure-on-the-capture-autosave-stops-reading-as-a-conflict — A read failure on the capture autosave stops reading as a conflict

## Release ID

`2026-10-08-a-read-failure-on-the-capture-autosave-stops-reading-as-a-conflict`

## Status

`candidate`

## Plain-English Summary

The capture autosave is the most-used control on the phase walk: every field of
every phase is persisted through one POST, on a debounce, while the reader types.
Before this change that route loaded the Move's authoritative saved answers
behind a swallowing catch:

```
const currentSnapshot = await loadCaptureSnapshot(ctx, programId, phase)
  .catch(() => ({ modules: [], values: {}, ... }));
```

The loader performs three data-plane reads and has **no legitimate throw** — a
Move with nothing saved reads as empty rows, not as an error. So every throw it
can raise is a read failure, and the catch replaced it with a snapshot asserting
that this Move has no saved answers at all. The route then reported that
substitution to the reader as two different things, neither of them a read
failure.

**The conflict path.** A client that loaded revision R sends it back on every
save. Measured against the substituted snapshot the current revision is the hash
of an empty answer set, which cannot equal R, so the write was refused as a
stale revision — and the refusal carried `values: {}`, the empty-set revision,
and a capture evaluation reporting every required section as missing. Both
autosave call sites adopt that body as the authoritative persisted state. So a
transient read failure blanked the reader's view of answers the database still
held, under the sentence _"This page was loaded before the capture state
changed"_ — which was not true. Nothing had changed; nothing could be read.

**The success path.** The revision fence is optional, so a caller that omits it
skipped the refusal entirely. The diff then reported every submitted field as
changed, the audit trail recorded that count as a real edit, and the success
body's values — one entry per declared section — carried an empty string for
every section the request did not contain. The same client adopts values on
success too. The untouched rows were never written, so the stored state stayed
correct while the screen reported the reader's earlier answers as unanswered: a
200 that contradicted the database.

The fix is to stop substituting. A read failure is now answered as a read
failure, before any write, with one sentence and **no authoritative state**. The
absence of values and revision from that body is what makes it structurally
unable to blank a page, so it is part of the contract rather than an omission.
Both client call sites already reach their generic not-ok branch and show the
sentence against the field, which leaves the typed text on screen and the
section dirty, so the debounce retries on the next keystroke.

Which writes succeed does not change. A readable snapshot behaves exactly as
before, including the genuine stale-revision conflict — the one case where
handing the client authoritative values is correct, because it is how the page
recovers.

## Layer Impact

- Lane: `global-control-lane`

**Products** — the Moves phase capture surface. One previously-unreachable
outcome becomes reachable: a data-plane read failure during a save now answers
503 with a sentence instead of a 409 conflict or a misleading 200. No successful
save, refusal, or gate outcome changes.

**Canonical model** — untouched. No schema, no read model, no projection, no
migration. The change removes writes that could previously be issued against a
phantom empty snapshot; it adds none.

## Client Applicability

- All clients: yes — capture autosave behavior is shared app behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This replaces a wrong answer on a path that already
  answered; it adds no control and opens no new state.

## Changes Included

- `src/lib/programs/phase-capture-snapshot-refusal.ts` — new. Carries the error
  code, the sentence, the 503 status and the body shape, plus the full reckoning
  of both paths the swallowed read reached the reader through. A new module
  rather than an edit to a shared helper, so the wording and the status are
  pinned somewhere a suite can read them without importing the route.
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts` — the swallowing
  catch becomes a real catch that logs the cause for the operator and returns
  the named refusal before any write. The substituted-snapshot literal is gone,
  so there is no longer an empty-answer-set code path to reach.
- `src/app/api/v1/programs/[programId]/phase-capture/__tests__/route.test.ts` —
  new, and the first route-level coverage this route has ever had. Drives the
  real route with the data plane mocked at its boundary and the capture contract
  and integrity modules real.
- `.github/workflows/ai-surface-control-catalog.yml` — wires the new directory
  into the required job as an escaped-bracket directory sweep, matching the four
  sibling route sweeps already there, so a suite added here is merge-blocking
  with no further workflow edit.
- `docs/architecture/test-ci-coverage-census.json` — regenerated: one new test
  file, one new directory, both covered.

## QA / Validation

- `npx jest 'src/app/api/v1/programs/\[programId\]' src/lib/programs/__tests__`
  — **PASS**, 210 suites / 2,774 tests.
- `npm run test:behaviors` — **PASS**, 208 suites / 2,163 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` on the three changed source files — **PASS**, clean.
- `node scripts/quality/check-named-suite-requiredness.mjs` — **PASS**, 50
  directories swept by a required job.
- `npm run release:check -- --base origin/main --head HEAD` — see below.
- Mutation testing — **10 mutations, 10 killed** (12 cases at base):
  - the swallowing catch restored verbatim → **5 fail**. This is the defect
    itself, and it is killed by five separate cases rather than one.
  - the refusal status re-pointed from 503 to 409 → 2 fail. This one
    **survived at first**: every status assertion referenced the exported
    constant, so the test moved with the value it was supposed to pin. 409 is
    exactly the status the client's adopt branch keys on, so the status is now
    asserted by its literal value and by a case that names why.
  - the refusal body given `values` and `revision` → 2 fail.
  - the refusal narrowed to callers that sent the revision fence, with the
    substitution kept for the rest → 2 fail.
  - only the module read guarded, the two evidence reads left swallowed → 1 fail.
  - the sentence replaced by the underlying error's message → 2 fail.
  - the sentence reverted to the stale-revision claim → 1 fail.
  - a write issued before the refusal returns → 2 fail.
  - the success body echoing the request instead of the stored values → 1 fail.
  - the genuine stale-revision refusal stripped of its values → 1 fail, so the
    recovery path the fix must not break is pinned in its own right.
- Census: **+1**, and all of it is mine — `testFiles` 2876→2877,
  `coveredTestFiles` 2712→2713, `directoriesWithTests` 511→512,
  `directoriesFullyCovered` 441→442. A regen at the base matches the committed
  census exactly, so no inherited drift is carried.
- Prettier: measured per file, in place. The route file **warns at the base
  too**, with four pre-existing unclean hunks; exactly one of prettier's
  proposed hunks was on a line of mine and it was fixed by hand, leaving the
  other four alone rather than pulling pre-existing reformats into the diff. The
  new module, the new suite and the workflow were clean.
- Live signed-in walk — **NOT RUN.** Owed; see Known Gaps.

## Rollout Plan

Merge to `main`. No migration, no flag, no worker, no environment variable, no
Azure action. It reaches users with the next ordinary web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no runtime.
- Approved image digest: not applicable — no deploy performed here.
- ACA runtime invariant: not asserted; nothing in this release deploys.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable; no flag.
- Live signed-in proof required: yes, before anyone calls this `live-proven`.
  Not performed here.

## Rollback Plan

Revert the PR. The route returns to the swallowing catch, which is in the diff
verbatim; the new module has no importer outside the route and its suite; the
workflow step and the new test directory disappear together, so the sweep cannot
outlive the suite it runs. Nothing persists state and no migration is involved.

## Audit Evidence

- The new suite, merge-blocking through the directory-wired step added to the
  required AI surface control catalog in this same change.
- The mutation results recorded under QA, including the status mutation that
  survived the first attempt and the assertion change it forced.
- The operator still receives the underlying read error: the route logs the
  cause alongside the refusal, and a case asserts that the log carries the
  message while the response body does not.

## Known Gaps

- **No signed-in walk.** Nothing in this release is `live-proven`. Reaching the
  new arm on the live surface requires a data-plane read failure during a save,
  which is not something to manufacture against a shared runtime; the arm is
  held by the route-level suite instead.
- **The sibling GET is unchanged.** `GET .../phase-capture` reads the same
  snapshot without a swallowing catch, so it has no equivalent defect, and its
  own generic 500 arm is not touched here.
- **`POST .../phase-input-draft` still has no test host.** It was the other half
  of the carried candidate. It calls the same three reads through a different
  loader and does not swallow them, so it has no equivalent substitution — but
  it remains the walk's last uncovered POST and is owed its own directory.
- **Measured and deliberately not changed:** the success path computes its
  capture evaluation from the _pre-edit_ business-change assessment while
  deriving the confirmed solution route from the post-edit one. The divergence
  is latent, not a defect: that assessment is read only by the P2
  solution-route section, and a P2 write cannot change it, while a P1 write
  reaches no section that consumes it. Asserting the latency belongs with the
  capture contract, not here.
- **The audit action vocabulary is unchanged.** A refused read writes no audit
  row at all, which is the correct answer for a request that changed nothing,
  but it also means a read failure leaves no trace outside the operator log.
  Whether a refused save deserves an audit row is a governance question.
