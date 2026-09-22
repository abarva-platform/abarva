# 2026-09-22-source-route-suites-behavioral-rewrite — Source route suites assert behaviour instead of file bytes

## Release ID

`2026-09-22-source-route-suites-behavioral-rewrite`

## Status

`candidate`

## Plain-English Summary

Three Source test suites checked that certain **words appeared in a source file** rather than
checking what the product does. That is not a test: a behaviour-preserving rename breaks it, and a
comment containing the same words satisfies it. One of the three had also been failing since
2026-09-11, because a deliberate product change replaced the sentence it was matching — and it
could have been made green again by typing the old sentence into a comment.

All three now render or import the thing they judge:

- **Source intake identity** is proved by making the canonical tenant resolver and the legacy
  active-client row disagree and checking which one reaches the screen.
- **The retired portfolio route** is proved by the redirect it performs and the parameters it
  forwards.
- **`/source` and `/source/360`** are proved by module identity — the same page function object —
  which no comment can satisfy.
- **The workspace loading shell** is mounted, in both of its branches: the portfolio heading and the
  contract deep-link heading.
- **The Source access guard** is rendered, so the refusal sentence, the account it names, and the
  three safe exits are read off the screen rather than out of the file.
- **Contract-detail retry** is driven through the real failure: a transient failure is retried, a
  spent failure is stated rather than spun on, and a failed contract is released so opening it again
  tries afresh.

No product file changed. The expected string in the failing test was **not** edited — editing it
would have restored green and left a check a comment could pass, which is the defect itself.

## Layer Impact

Release lane: `global-control-lane` — repository test tooling shared by every client, with no
client-scoped data or schema in scope and no feature gate.

- **Layer 4 (Products — Source):** test-only. The behaviour under test is unchanged; the change is
  what the tests are able to detect.
- Layers 1–3 unaffected. No tenant data, schema, loader, adapter or projection is touched.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — repository test coverage.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/__tests__/tenant-resolution-source-contract.test.ts` → `.test.tsx`,
  rewritten (6 byte-matching cases → 10 behavioural cases).
- `src/app/(maestro)/source/__tests__/not-found-source.test.ts` → `.test.tsx`, rewritten
  (2 byte-matching cases → 5 behavioural cases).
- `src/app/(maestro)/source/preview/workspace/__tests__/contractDetailRetry.test.tsx`, rewritten
  (6 declaration-matching cases → 6 behavioural cases).
- `docs/architecture/t550-stale-suite-triage.json` — two rows given a `movedTo` field.
- `src/__tests__/behaviors/t550-stale-suite-triage-record.test.ts` — its existence check taught to
  follow a recorded move, and strengthened in four ways while doing so.
- This release record.

**The rename broke a gate, and the gate was right.** `Behavior coverage floor` failed 1 of 803 on
the first push: `T-550 stale suite triage record › names only files that exist in the tree`. The
T-550 triage record names two of these suites by their `.ts` paths, and their rewritten contents
contain JSX, so they had to become `.tsx`. The record's paths were **not** restamped to the new
names — that record is an audit snapshot of a draw taken at a base commit, and those files were
`.ts` at that instant. Instead the two moved rows carry an explicit
`movedTo { path, byItem, reason }`, and the guard follows it. The control ends up strictly stronger
than the one it replaces: a missing path with no `movedTo` still fails; a `movedTo` whose
destination does not exist fails; a `movedTo` attributed to the draw's own item fails, because a
draw may not move what it judges; a `byItem` that is not a lane-prefixed id fails; and a row that
still resolves at its recorded path may not carry a `movedTo` at all, so the field cannot be left
behind as decoration. No verdict, count, execution number or rationale in the record was altered.

One control was **retired rather than rewritten**, with the reason recorded in the file: the case
that scanned `WorkspaceExecutiveShell.tsx` for its `PAGE_LABELS` array and its two navigation
`aria-label`s. The same behaviour is already asserted by rendering in
`preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`, which mounts the shell, asserts
the `Source workspace navigation` landmark is present and `Main application navigation` absent, and
clicks `Levers` and `Coverage`. See **Known Gaps** for the two caveats on that coverage, which are
real and are not claimed away here.

## QA / Validation

**Baseline, clean `3e08ad5f2` vs branch, same scope both sides** — the two directories that contain
the changed files, `src/app/(maestro)/source/__tests__` and
`src/app/(maestro)/source/preview/workspace/__tests__`:

| | suites | tests | failing |
|---|---|---|---|
| clean `3e08ad5f2` | 36 | 296 | **6** (3 suites) |
| this branch | 36 | 303 | **5** (2 suites) |

One failure removed — the stale scanner assertion — and seven net tests added. The remaining five
failures in two suites are pre-existing on clean `main`, are not in this change's scope, and are
filed as T-554 and T-555 rather than quoted as if caused here.

**The three changed suites alone:** 14 tests / 1 failing before → 21 tests / 0 failing after.

**Falsifiability — 13 mutations, 13 caught, 0 escapes.** Each mutation edits product code, runs the
owning suite, and is reverted; every product file was confirmed byte-identical afterwards (`git
status` shows only test files changed).

1. retry branch removed from the contract-detail fetch — caught
2. a failed contract latches as handled instead of releasing — caught
3. the synchronous in-flight guard removed — caught
4. loading shell ignores the deep-linked contract — caught
5. loading shell paints a retired tab in its navigation — caught
6. intake identity name taken from something other than the resolver — caught
6b. intake identity key taken from something other than the resolver — caught
7. intake serves the queue without a resolved tenant — caught
8. retired portfolio route forwards an ungoverned param — caught
9. `/source/360` declares its own page component instead of the workspace one — caught
10. access guard drops its non-disclosure sentence — caught
11. access guard sends a refused reader into Moves — caught
12. access guard stops naming the account the link was refused for — caught

**The strengthened triage guard — 5 mutations, 5 caught, 0 escapes**, each mutating the record and
reverting it (`git diff` afterwards shows only the two intended `movedTo` blocks):

A. a moved row drops `movedTo` entirely, which is the pre-fix failure — caught
B. `movedTo` points at a file that does not exist — caught
C. the draw attributes the move to itself — caught
D. `movedTo` left as decoration on a row that still resolves — caught
E. `byItem` is not a lane-prefixed item id — caught

- `npx jest src/__tests__/behaviors` — **96 suites / 803 tests / 0 failing** locally, matching CI's
  totals with the one failure resolved.

Mutation 6 **escaped the first version of this suite** and is recorded because it changed the work:
`canonicalClientDisplayName` rewrites a mapped key's display name regardless of the name handed to
it, so asserting on a mapped tenant pinned the key and not the name. A case using a key the
canonicaliser has no rule for was added, which is the only arrangement in which the resolver's own
name is observable. The escape was found by running the mutation, not by reading the code.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics (judged by exit code; a bare `npx tsc` exits 134 on this machine).
- `npx eslint` on the three files — exit 0, 0 errors, 0 warnings.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing outside two test directories is in the diff, so the
Container App image content is unchanged in substance and no signed-in proof is owed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on the merge's own deploy run.
- ACA runtime invariant: asserted by that run's `runtime-invariant-proof.json`.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — no file under `src/` outside two test directories changed.

## Rollback Plan

Revert the PR. No migration, no data change, no flag, nothing to unwind.

## Audit Evidence

- PR and its check run.
- Mutation table above, reproducible by re-applying each edit and running the named suite.
- Baseline table above, reproducible on a clean worktree at `3e08ad5f2`.
- `git status` on the branch: only test files and this record.

## Known Gaps

1. **None of the three suites runs in any workflow, before or after this change.** No workflow
   command reaches `src/app/(maestro)/source/__tests__` or
   `src/app/(maestro)/source/preview/workspace/__tests__`. Rewriting them makes them worth running;
   it does not run them. Wiring is T-552's scope and is blocked at filing time on a live claim over
   `.github/workflows/unit-suites.yml`. **Rewritten is not wired.**
2. **The coverage one control was retired in favour of is real but sits in a red, unrun suite.** The
   nav and label assertions in `WorkspaceClient.ecl-browser.test.tsx` execute and pass — they are at
   lines 408–448, while that suite's first failure is later, at line 594 — but the suite as a whole
   is red on clean `main` (3 of 10 cases) and no workflow runs it. Filed as T-554. Stated rather
   than left to be found: if that suite is ever quarantined, the retired control goes with it.
3. **A defect this rewrite found is pinned, not fixed.** Filed as U-511 and held by an `it.failing`
   case in the access-guard suite, which passes only while the defect exists and turns red the day
   it is fixed. Not repaired here because it lives in product code outside this change's claimed
   file list.
