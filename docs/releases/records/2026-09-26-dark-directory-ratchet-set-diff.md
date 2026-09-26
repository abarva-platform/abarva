# 2026-09-26-dark-directory-ratchet-set-diff — Dark test-directory ratchet reports a set difference, not a count

## Release ID

`2026-09-26-dark-directory-ratchet-set-diff`

## Status

`candidate`

## Plain-English Summary

The repository has a gate that refuses new "dark" test directories — directories holding test
files that no CI workflow ever runs. It worked by comparing one number against another: the count
of dark directories measured today, against a count committed in the test file.

The equality was right. The resolution was not. A failure read `Expected: 172 / Received: 170` and
said nothing else, and those two numbers are identical in two opposite situations:

- somebody wired two directories into CI, which is good, and the committed number should come down;
- somebody wired two directories and let two others go dark in the same change, which is the
  regression the gate exists to refuse — and the count moves by zero, so the gate stays green.

This change replaces the committed number with a committed **sorted list of directories**, and
makes the failure a set difference. On failure the gate now names, separately, the directories that
**entered** the dark set (the regression) and those that **left** it (a wiring to record). Both
sections print even when one is empty, so a change that does both is visible as two events rather
than as a silence.

Nothing is loosened. The comparison is still an equality in both directions — a decrease fails as
loudly as a rise. The fix is resolution, not tolerance.

Tracked internally as `T-491`, which was filed by the closure of `C-532`: establishing that exactly
the two intended directories had moved required building a second clean worktree at `origin/main`,
running the census in both trees, and diffing the directory sets by hand. The gate had the set in
its own scope the whole time and never printed it.

## Layer Impact

Release lane: `global-control-lane` — a shared repository CI control, not gated by tenant or flag.

- **Layer 4 — products:** no runtime code path changes. No product surface, API route, adapter,
  loader, projection or tenant-visible behavior is touched.
- **Test/tooling (CI controls):** `src/__tests__/behaviors/product-directory-ci-coverage.test.ts`
  changes how it reports; the set of directories it governs is byte-identical to what it governed
  before (170, measured from the same census resolver on the same commit).

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — a CI control and its supporting module
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/qa/dark-directory-ratchet.ts` — new. Pure set-difference and failure-text module:
  `diffDarkDirectories(baseline, observed)` returns `{ entered, left, inAgreement }`, and
  `formatDarkDirectoryDrift` renders the two sections. Duplicates on either side throw rather than
  being collapsed, because a duplicate makes a set difference lie about what moved.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — new. The committed
  baseline, now a sorted unique list of the 170 dark directories rather than the integer `170`.
  Captured from `scripts/quality/test-ci-coverage-census.mjs --json` at `origin/main` `f24fe05fd`.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — the ratchet now diffs against
  that list and asserts the rendered message. The prose log of past movements is kept in place and
  extended with why it became a list; a new case asserts the baseline stays sorted, unique and
  non-empty.
- `src/__tests__/behaviors/t491-dark-directory-ratchet-diff.test.ts` — new. Eight cases over the
  diff module, including the cancelling direction and an assertion that the failure text itself
  contains the names of both sides.

## QA / Validation

**Clean baseline, same scope, measured rather than recalled.** A separate detached worktree was
built at `origin/main` `f24fe05fd4a14e0b7b663704d457a519469491b2` and `npm run test:behaviors` run
in it, then the same command run on this change:

| | suites | tests | failing |
|---|---|---|---|
| clean `origin/main` `f24fe05fd` | 141 | 1445 | **0** |
| this change | 142 | 1454 | **0** |

The delta reconciles exactly: `+1` suite is the new diff suite (8 cases) and `+9` tests is those 8
plus the one case added to the ratchet suite (3 → 4). No pre-existing failure is being quoted as
this change's, and none was introduced.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics. Judged on the exit code: a bare `npx tsc --noEmit` exits 134 on this host, a V8
  out-of-memory crash that emits nothing and reads as clean when grepped.
- `npx eslint` over the three changed/added source files — exit 0, no findings.

**The gate proven to fail in the cancelling direction, on the real census — this is the acceptance.**
The committed baseline was mutated so that two directories the census really does report as dark
are missing from it (they must read as ENTERED) and two directories the census does not report are
present in it (they must read as LEFT). The mutation was asserted to be cancelling before the run:
baseline length 170 → 170, so the old count comparison `170 === 170` passes it. The gate went red
and printed:

```
Dark test directory set has drifted from src/__tests__/behaviors/product-directory-ci-coverage.baseline.json.

  ENTERED the dark set (2) — NEW dark directories. This is the regression this gate refuses: ...
    - src/app/(maestro)/tower/__tests__
    - src/app/api/health/postgres-disruption/__tests__

  LEFT the dark set (2) — wired into CI, or no longer resolving as fully uncovered. ...
    - src/app/api/programs/synthesis/__tests__
    - src/app/api/source/synthesis/__tests__
```

Both sides named, separately, in the failure text.

**Old gate versus new gate on one constructed change, executed rather than argued.** A temporary
suite took the real 170-directory set as *before*, produced an *after* in which two directories are
wired and two go dark, and ran both assertions over it: the count equality passes (`170 === 170`,
blind), the set difference fails and names the two that went dark. Both assertions ran and both
behaved as stated; the temporary suite was then deleted and is not part of this change.

**The fix broken deliberately, three ways.** Each mutation was verified to have changed the source
before the run, so a no-op mutation cannot be mistaken for a surviving one:

| mutation | result | which cases died |
|---|---|---|
| `inAgreement` collapsed to `baseline.length === observed.length` — literally the old behavior | 2 failed, 6 passed | the cancelling case, and the failure-text case |
| `entered` forced to `[]` | 4 failed, 4 passed | every case that asserts a regression is seen |
| the message prints counts instead of names | 2 failed, 6 passed | both cases asserting names are in the text |

The first is the decisive one: restoring the exact old semantics kills precisely the two
cancelling-direction cases and nothing else, which is the defect stated and the defect fixed, with
no slack between them. The module was restored from a pristine copy after each and the suite
returned to 8/8.

No signed-in proof is required by this change and none is claimed: it touches no route, no rendered
surface and no tenant data.

## Rollout Plan

Merge to `main` through a squash PR. The repo-owned ACA main deploy workflow will build and deploy
the digest-pinned image as it does for any merge; this change alters no runtime behavior, so there
is nothing in it for a deploy to activate. Its effect is on CI reporting from the first run after
merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command, no traffic shift, no revision
  weight, no env var, flag, secret or scale change.
- Approved image digest: whatever the repo-owned workflow builds from the merge commit; this
  release pins nothing of its own and asks for no exception.
- ACA runtime invariant: to be verified after merge — Container App template image, the
  100%-traffic revision image and both required worker job images equal to the same digest.
- Worker image invariant: same digest as the web template; unchanged by this release.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — no route, rendered surface or tenant-visible behavior is
  touched. This is a CI control and a pure module. Nothing here may be read as a signed-in proof
  having been run.

## Rollback Plan

Revert the squash commit. There is no migration, no data change and no runtime state, so the revert
is complete on merge. Reverting restores the integer baseline and with it the blindness this change
removes; the dark set itself is unaffected either way.

## Audit Evidence

- PR URL and CI run: recorded on the PR.
- The committed baseline is itself the evidence of the governed set, and is diffable per directory
  from this commit onward — which is the change.
- `scripts/quality/test-ci-coverage-census.mjs --json` reproduces the set independently; its
  `counts.indeterminateInvocations` is asserted to be `0` by the gate, without which the uncovered
  list is an upper bound and any baseline over it is a guess.

## Known Gaps

- The baseline records 170 dark directories. **This change does not wire any of them into CI** and
  does not claim to — it makes the ratchet legible, not smaller. Reducing the set is separate work.
- One directory in the baseline is there because of a measurement correction rather than a
  regression, and wiring it is blocked on a decision about the failures that wiring reveals. That
  decision is untouched here.
- Directories that are *partially* covered do not reach this set at all. That boundary is unchanged
  and is still a caveat a reader has to know; the set difference makes its consequences visible
  when a directory crosses it, but does not remove the concept.
