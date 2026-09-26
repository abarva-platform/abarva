# 2026-09-26-t488-quarantine-list-read-path-override — Quarantine checker reads its list from a path it is given

## Release ID

`2026-09-26-t488-quarantine-list-read-path-override`

## Status

`candidate`

## Plain-English Summary

One of our test-quality checks guards a list of Source integration test suites that are
temporarily excluded from CI. The test that proves this check works used to exercise it by
**rewriting the real list file in the working tree**, running the check against the modified
copy, and putting the original back afterwards.

The restore was faithful — the file's bytes came back exactly as they were, and `git status`
stayed clean — which is why nobody noticed for weeks. But that same directory is read by
roughly thirty other pieces of tooling while tests are running, including the test-coverage
census, and for the seconds the modified copy was on disk any of them could read it.

This change removes the shared-file write. The check now accepts `--list <path>` and the test
points it at a throwaway copy in a scratch directory. The default is unchanged: with no flag,
the check reads exactly the committed file it has always read, and a new test asserts that
every place the repository actually invokes the check resolves back to that same committed
file — so the new flag cannot quietly become a way to point the gate at a friendlier list.

The problem was filed as theoretical. It is not. Measured on the tree before this change, a
coverage census run while the file was modified read **34** declared quarantined suites
instead of 35 and credited **51** declared quarantines instead of 52 — a wrong number with no
error raised and no gate failed. Reading fewer exclusions over-credits coverage, so the
direction of the error flatters us.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only developer tooling. It is not
`global-control-lane`, because nothing in it is shared app or control-plane behaviour that any
client's request reaches.

- **Layer 4 / tooling and CI controls only.** No product surface, no route, no read model,
  no prompt, no canonical model object, no tenant data. The check that changed reads a JSON
  list of test-suite filenames and exits 0 or 1.
- No change to what the check enforces. Every rule it applied before — stale entries, expired
  failure evidence, both ceilings as two-way ratchets, duplicate entries, `alsoIgnored` shape
  — applies unchanged, to the same committed file, on every invocation the repository makes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — developer tooling and CI only
- Public/demo only: no
- Feature flag: none

## Changes Included

| File | Change |
|---|---|
| `scripts/quality/quarantine-list-path.mjs` | New. `resolveQuarantineListPath(argv, defaultPath)` — returns `--list`'s value when given, the committed default otherwise. Refuses a blank or missing value rather than silently falling through. |
| `scripts/quality/check-source-integration-quarantine.mjs` | Reads its list through that resolver. `DEFAULT_LIST` is the committed path, unchanged. |
| `src/__tests__/behaviors/source-quarantine-ceiling-is-a-ratchet.test.ts` | `withList` now writes a scratch copy under `os.tmpdir()` and passes `--list`. The committed file is never written. Four new cases (below). |

The scratch directory is deliberately **outside** `scripts/quality/`, because a copy left
beside the committed lists would be swept up by the very `*-quarantine.json` reading this
change exists to stop disturbing.

## QA / Validation

### The race, measured before the fix

Three probes against the pre-fix tree, all on `origin/main` `a8179cfa7`:

1. **The wide window** — the modified list sits on disk for the whole of the checker run.
   Driving the census concurrently, exactly as the suite's second case would:

   | | quarantine lists read | declared suites | declared quarantines credited |
   |---|---|---|---|
   | undisturbed | 8 | **35** | **52** |
   | while modified | 8 | **34** | **51** |
   | restored | 8 | **35** | **52** |

2. **The gate does not catch it.** `test-ci-coverage-census.mjs --check` exited 0 in all
   three states. The harm is a silently wrong number, not a failed run — quieter than the
   filing assumed.

3. **The narrow window is real too.** A reader and a writer racing for eight seconds:
   224,012 reads, of which **1,037** were unreadable JSON and **111,280** carried the wrong
   list length. The unreadable branch is the one the census *throws* on.

### The write itself, measured before the fix

Running the suite as it stood left the committed list byte-identical
(`sha256 51a311de…` before and after) while its mtime moved `1790397537 → 1790397596`. That
is why no content comparison and no `git status` ever saw it, and it is why the new
regression case asserts **mtime**, not bytes.

### Suite, before and after

Same file, same scope:

| | Tests |
|---|---|
| before (`origin/main` `a8179cfa7`) | 5 passed, 0 failed |
| after | 11 passed, 0 failed |
| committed list mtime after a run | **unchanged** |

Six new cases:

- `reads the committed list when no --list is given` — the default, asserted directly.
- `actually reads the file --list names, not the committed one` — the override works, and is
  not the default. Paired with the case above, neither passes alone for the wrong reason.
- `resolves every configured invocation back to the committed list` — reads the real argv
  from `package.json` scripts and from `.github/workflows/*.yml`, feeds it through the real
  resolver, and asserts the destination. Not a text scan of the command.
- `never writes the committed list` — bytes **and** mtime.
- `refuses a --list with no path rather than falling back to the default` — the dangerous
  spelling is the silent fallback: `--list` with its value lost to a shell would read the
  committed file while the caller believed it had redirected, and the mutation cases would then
  pass against the wrong list without saying so.
- `refuses to resolve without a committed default` — without one, an absent `--list` resolves to
  nothing and the checker reads no list at all: a gate that passes because it measured an empty set.

The last two were added after the first review pass, for a reason worth stating: the module's
docstring and this record both claimed those refusals, and nothing exercised them. A documented
property with no test is the shape of defect this backlog exists against, so it was closed here
rather than filed.

### Mutation proofs

Each mutation was applied, run, and reverted; the case named is the one that failed.

| Mutation | Result |
|---|---|
| M1 — restore the shared-tree write in `withList`, exactly as it was | **1 failed** / 8 passed — `never writes the committed list` |
| M2 — checker ignores `--list` (`const LIST = DEFAULT_LIST`) | **4 failed** / 5 passed — incl. `actually reads the file --list names` |
| M3 — resolver's default returns a different path | **3 failed** / 6 passed — incl. `reads the committed list when no --list is given` |
| M4 — `package.json` invocation given `--list <another list>` | **1 failed** / 8 passed — `resolves every configured invocation back to the committed list` |
| M5 — `--list` with a missing value falls back to the default instead of refusing | **1 failed** / 10 passed — `refuses a --list with no path rather than falling back to the default` |
| M6 — the missing-default guard removed | **1 failed** / 10 passed — `refuses to resolve without a committed default` |

M4 is the one that matters for the override's own hazard: it is the mutation a person would
make, and it is caught.

### Clean-baseline scope

Six behaviors suites covering this file and every census suite that reads the same directory,
run in a **separate worktree at `origin/main` `a8179cfa7`** rather than from a stash:

| | Suites | Tests |
|---|---|---|
| before | 6 passed, 0 failed | 121 passed, 0 failed |
| after | 6 passed, 0 failed | 127 passed, 0 failed |

### Gates

| Command | Result |
|---|---|
| `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` | **exit 0**, 0 `error TS` |
| `npx eslint` over the three changed files | exit 0 |
| `npm run check:source-integration-quarantine` | exit 0 — "8 excluded of 105 suites … 8 exclusions were re-measured" |
| `npm run check:cli-invocation-guard` | exit 0 |
| `npm run check:export-reachability` | exit 0 — baseline unchanged |
| `node scripts/quality/test-ci-coverage-census.mjs --check` | exit 0, shape matches |

**Pre-existing drift, not introduced here.** The census reports `testFiles 2463 -> 2464 (+1);
coveredTestFiles 2016 -> 2017 (+1)`. The **same two numbers** appear on clean `origin/main`
`a8179cfa7` in the baseline worktree, so this change neither causes nor worsens it, and it is
deliberately not refreshed here — folding someone else's drift into this diff would make both
harder to read.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in this change is imported by the application,
served by a route, or built into an image. The affected code runs in CI and on developer
machines only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` will run on merge as it
  does for any commit to `main`. This change requires nothing of it.
- Shared runtime mutators: none. No `az` command, no image, no traffic, no revision.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be recorded after merge for completeness, as the standing rule
  requires for any merge, not because this change reaches the runtime.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** There is no product surface to sign in to. The
  behaviour is fully provable by `node` and `jest`, and it is.

## Rollback Plan

Revert the squash commit. The three files are independent of everything else: the new module
has one importer, the checker's default is byte-identical in behaviour to today's, and the
suite reverts to its previous form. No migration, no data, no flag, nothing to unwind.

## Audit Evidence

- PR — to be recorded on open.
- Release-check run: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- The three probe scripts are reproducible from the measurement tables above; each writes
  only the tree it runs in and restores it in a `finally`.
- CI: the behaviors scope carries `source-quarantine-ceiling-is-a-ratchet.test.ts`, so the
  four new cases run on every PR from merge onward.

## Known Gaps

- **The sibling lists still have the same shape available to them.** Seven other
  `scripts/quality/*-quarantine.json` files exist with their own checkers. This change gives
  the read-path override to one of them, because only one had a suite writing the shared
  tree. The others were not audited for the same pattern in this change — that is a separate,
  bounded piece of work and is filed as such.
- **The census's own stale-count drift is untouched** and pre-dates this change, as measured
  above. It belongs to whoever refreshes the committed census.
- The narrow truncation window was provoked under artificial contention (a tight write loop),
  not under the suite's own timing. Under the suite's timing the observed harm is the *wide*
  window — a valid but wrong list — which is the one reproduced 1-for-1 in the table above.
