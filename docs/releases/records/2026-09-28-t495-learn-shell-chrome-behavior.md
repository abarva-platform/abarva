# 2026-09-28-t495-learn-shell-chrome-behavior — Learn shell chrome rule asserted by rendering, not by grepping

## Release ID

`2026-09-28-t495-learn-shell-chrome-behavior`

## Status

`candidate`

## Plain-English Summary

One test was checking an important rule the wrong way, and this replaces it with a test that checks
the rule itself.

The rule is that the `/home/learn` screens show exactly one product navigation bar at the top. The
shared shell owns that bar; the Learn section's own layout must not add a second one. The old test
did not look at the screen at all. It opened two source files as plain text and searched them for
four short fragments of code. That worked until somebody reformatted one of those files from single
quotes to double quotes, at which point the test went red because it was looking for `'/home'` and
the file now said `"/home"`. Nothing about the product had changed, and the navigation bar was
never wrong.

A test like that is worse than no test in two directions at once. It cries wolf when the code is
merely reformatted, and it stays quiet when the behaviour genuinely breaks — the words could all
still be present in a file while the feature was disconnected. So the fragment searches are deleted
rather than made more precise: a cleverer search pattern is the same defect with a longer fuse.

In their place, the new test actually renders the shared shell wrapped around the real Learn layout,
the way the application composes them, and counts the navigation bars that appear. It also renders
the Learn layout on its own to confirm it contributes none, and renders a page outside the Learn
area to confirm the bar is chosen by which page you are on rather than shown unconditionally.

The second half of this change is about visibility. Neither the old test nor the directory holding
the new one was run by any job, so a failure in either would have gone unreported. The new
directory is now named in the Unit suites workflow, so both suites in it run on every pull request.

## Layer Impact

Release lane: `global-control-lane` — shared app/control-plane behaviour, not feature-gated. Nothing
here is client-scoped.

- **Layer 4 — Products (Home · Learn):** no product code changed. The rule this asserts belongs to
  the shared chrome and the Learn layout, and both are untouched. What changed is how the rule is
  proven.
- **Platform tooling / CI:** one directory moves from "run by nothing" to "run on every pull
  request", and the committed coverage census and dark-directory ratchet baseline are updated to
  match.

No data-plane, tenant, schema, RLS, auth, retrieval or model-prompt behaviour is involved.

## Client Applicability

- All clients: no behavioural change reaches any client. This is test and CI-coverage work.
- Specific clients: none.
- Internal only: the CI coverage improvement.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- **Deleted** `src/__tests__/hygiene/learn-layout-single-nav.test.ts` — a source-text scanner, red on
  the base commit for a quote-style reformat.
- **Added** `src/components/chrome/__tests__/MaestroChrome.learnShellChrome.test.tsx` — 5 cases that
  render the chrome and the real Learn layout. Reads no repository file and holds no `toContain`.
- **Changed** `.github/workflows/unit-suites.yml` — one step naming
  `src/components/chrome/__tests__` as a DIRECTORY, per that file's own header rule. This also
  brings the pre-existing `MaestroChrome.test.tsx` into CI, which ran nowhere before.
- **Changed** `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the wired
  directory's line is removed. That ratchet asserts set equality, so this edit and the workflow step
  are required together.
- **Changed** `docs/architecture/test-ci-coverage-census.json` — refreshed via
  `npm run audit:test-ci-coverage:write`.
- **Changed** `docs/architecture/t492-stale-suite-triage.json` — a `movedTo` entry on the deleted
  row. Its own control refused this change until that entry existed; the row's recorded verdict,
  counts and base-commit measurements are unchanged, because a row is history.
- **Added** `docs/architecture/t495-learn-shell-chrome-triage.json` — the verdict record, so the
  scanner-wiring control resolves the deleted path from the latest record rather than the original
  draw.

## QA / Validation

Measured against a **separate clean worktree** at the branch's base commit `84b1759323`, not a stash,
over the same scopes:

| scope | base `84b1759323` | branch |
|---|---|---|
| `src/__tests__/behaviors` | 153 suites / 1666 tests / **0 failing** | 153 suites / 1666 tests / **0 failing** |
| `src/__tests__/hygiene` | 6 suites / 86 tests / **2 failing suites, 2 failing tests** | 5 suites / 85 tests / **1 failing suite, 1 failing test** |
| `src/components/chrome/__tests__` | 1 suite / 10 tests / **0 failing** | 2 suites / 15 tests / **0 failing** |

The one failure that leaves `hygiene` is the deleted suite. The one that remains is
`shell-v2-mode-layout.test.ts`, red on both sides and not this change's to take — see **Known Gaps** below. No absolute repository-wide failure count is quoted, because this change did not cause
one.

**The new suite was proven able to fail.** Five mutations of the product, each confirmed to have
changed the file before the suite was re-run — a mutation that edits nothing reads exactly like a
mutation that was caught:

| mutation | result | what it proves |
|---|---|---|
| remove `"/home"` from `SHELL_SURFACE_PREFIXES` | 2 of 5 failed | the prefix entry — the exact assertion the deleted scanner was making when it broke |
| the Learn layout renders its own `<NexusTopNav />` | 3 of 5 failed | the double render the rule exists against |
| `if (isShellNativePath(pathname))` → `if (true)` | 1 of 5 failed | the negative control; without that case the suite passes for an unconditional nav |
| the Learn layout drops `<LearnSideNav />` | 2 of 5 failed | the layout's own contribution |
| the Learn layout's `main` loses `aria-label="Learn content"` | 1 of 5 failed | the named content region |

**The wiring was proven necessary in both directions**, because a half-done wiring is the failure
mode the ratchet exists for:

| mutation | result |
|---|---|
| delete the `npx jest src/components/chrome/__tests__` **command**, leaving its comment block in place | `product-directory-ci-coverage.test.ts` 1 of 4 failed |
| re-add the directory to the dark-directory baseline with the command present | `product-directory-ci-coverage.test.ts` 2 of 4 failed |

The first is the more important of the two: a comment naming the directory does not satisfy the gate.

Gates run, all exit 0:

- `npx jest --runTestsByPath src/components/chrome/__tests__/MaestroChrome.learnShellChrome.test.tsx` — 5 of 5 pass
- `npm run test:behaviors` — 153 suites / 1666 tests / 0 failing
- `src/__tests__/behaviors/t770-scanner-wiring-refusal.test.ts` — 7 of 7 pass (no declared scanner is wired by this change)
- `src/__tests__/behaviors/t492-stale-suite-triage-record.test.ts` — 21 of 21 pass
- `node scripts/quality/triage-record-census-reconciliation.mjs` — exit 0
- `npm run audit:named-suite-requiredness` — exit 0
- `npm run test:integration:ci-visibility` — exit 0
- `node scripts/quality/test-ci-coverage-census.mjs` — `committed census matches this run`
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no diagnostics. Judged on the exit code: a bare run exits 134 on the operator host, an out-of-memory crash that emits nothing and reads as clean.
- `npx eslint` on the new suite — exit 0

## Known Gaps

- **`src/__tests__/hygiene` stays dark and stays red**, deliberately. A red directory is wired by
  fixing it, never by adding it to a green command. Of its five remaining files, two are
  declared source-text scanners carrying `textIsTheSubject` — the half of this item that needs a
  lane decision from the owner and that an agent must not attempt.
- **`shell-v2-mode-layout.test.ts`** is the next claimable suite of this draw: red on the base for a
  nav-label fragment assertion of the same family as the one deleted here. Not taken, because the
  item's acceptance is per suite.
- **A counting discrepancy worth an owner's eye, recorded and not acted on.** The originating draw
  declares **four** rows with `textIsTheSubject` while this item's gate scope names **three**, and
  the item's prose counts 14 scanners against the 15 the draw declares. Both counts are short by the
  same single row, `src/lib/intelligence/canonical/persistence-contract.test.ts`, which suggests it
  was excluded from the item rather than overlooked by it. It matters because an agent reading only
  the gate's wording — "the 3 rows carrying `textIsTheSubject`" — could take a fourth row that
  carries it believing it claimable. Full reasoning in
  `docs/architecture/t495-learn-shell-chrome-triage.json`.

## Rollout Plan

Merge to `main`. No runtime rollout: no application code, route, prompt, migration, flag or
environment variable changes. The Container App image rebuilds on merge as it does for any commit,
and the new CI step begins running on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az containerapp` command is run by or for this change.
- Approved image digest: unchanged by this change; the post-merge deploy digest is recorded as audit
  evidence, not requested by it.
- ACA runtime invariant: to be proven after merge — template image equals the digest on the single
  100%-traffic revision, revision Healthy/Running.
- Worker image invariant: not applicable; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** No product file changed — the diff is one test file
  deleted, one test file added, one workflow step, and four generated or record artifacts. There is
  no rendered surface for a signed-in check to inspect that this change could have altered.

## Rollback Plan

Revert the squash commit. Nothing to unwind beyond that: no migration, no data write, no flag, no
runtime template change. Reverting restores the deleted scanner and re-dark-lists the directory, and
the ratchet's set equality keeps those two consistent with each other automatically.

## Audit Evidence

- PR URL and its CI run, including the new **Run the T-495 chrome shell-ownership suites** step's job
  log — a suite that is green and unwired is indistinguishable from one that is absent, so the case
  count belongs in the log and not only in this record.
- `docs/architecture/t495-learn-shell-chrome-triage.json` — per-suite verdict, both baseline and
  branch measurements, all seven mutations with their results.
- `docs/architecture/t492-stale-suite-triage.json` — the originating row and its `movedTo`.
- `docs/architecture/test-ci-coverage-census.json` — the coverage census at this commit.
- Post-merge: the ACA deploy run at or after the merge SHA, and the template-vs-traffic digest
  comparison.
