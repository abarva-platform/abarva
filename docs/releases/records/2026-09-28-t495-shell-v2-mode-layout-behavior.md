# 2026-09-28-t495-shell-v2-mode-layout-behavior — One chat entry per surface asserted by rendering, not by grepping

## Release ID

`2026-09-28-t495-shell-v2-mode-layout-behavior`

## Status

`candidate`

## Plain-English Summary

The shell layout spec says every screen has exactly one place to talk to the assistant, and that
a few shared pieces — the page-state provider, the legacy left rail — are owned by the shared shell
rather than by individual pages. One test was guarding those rules by opening source files as plain
text and searching them for component names.

That test was red, but not because anything was wrong: the product navigation labels were
deliberately renamed, and it was still searching for the old ones. More important is what its
eighteen *green* cases were worth when we checked them:

- the case "the program detail page uses the chat drawer" passed because a **code comment** in that
  file mentions the drawer — nothing checked that the drawer is still rendered;
- a screen that has since been deleted simply dropped out of its lists, with no failure;
- the only listed screen that used one of the chat components it looked for is not reachable from
  any route;
- and the chat component that the Tower screen actually uses was not in its vocabulary at all.

So the text searches are deleted, not sharpened. The replacement renders each screen that a route
actually shows — program detail, programs index, Tower, and two admin pages — with every chat
component swapped for a marker, and checks the exact list of chat markers each screen produces. It
also renders the shared shell directly and checks it mounts one page-state provider and hides the
legacy rail unless asked.

The navigation half of the old test did not need rewriting: an existing test already renders the
top navigation and checks both rules, including the new labels. It simply ran in no CI job. Its
directory is now run on every pull request.

## Layer Impact

Release lane: `global-control-lane` — shared app/control-plane behaviour, not feature-gated. Nothing
here is client-scoped.

- **Layer 4 — Products (Moves · Tower · Admin shell):** no product code changed. What changed is how
  the shell-layout rules over those surfaces are proven.
- **Platform tooling / CI:** one directory moves from "run by nothing" to "run on every pull
  request"; one new suite lands in a directory CI already runs. The committed coverage census and
  the dark-directory ratchet baseline are updated to match.

No data-plane, tenant, schema, RLS, auth, retrieval or model-prompt behaviour is involved.

## Client Applicability

- All clients: no behavioural change reaches any client. This is test and CI-coverage work.
- Specific clients: none.
- Internal only: the CI coverage improvement.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- **Deleted** `src/__tests__/hygiene/shell-v2-mode-layout.test.ts` — a source-text scanner of 19
  cases, red on the base commit for a deliberate nav rename.
- **Added** `src/components/shell/__tests__/shell-v2-mode-layout.test.tsx` — 15 cases that render
  five route-mounted surfaces and `AppShell`. Reads no repository file. Its directory is already run
  by the AI surface control catalog workflow, so it needs no workflow change.
- **Changed** `.github/workflows/unit-suites.yml` — one step naming
  `src/components/navigation/__tests__` as a DIRECTORY, per that file's own header rule. It brings
  the pre-existing `NexusTopNav.test.tsx` (17 cases, green) into CI.
- **Changed** `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the wired
  directory's line is removed. That ratchet asserts set equality, so this edit and the workflow step
  are required together.
- **Changed** `docs/architecture/test-ci-coverage-census.json` — refreshed via
  `npm run audit:test-ci-coverage:write`.
- **Changed** `docs/architecture/t492-stale-suite-triage.json` — a `movedTo` entry on the deleted
  row. The row's recorded verdict, counts and base-commit measurements are unchanged.
- **Added** `docs/architecture/t495-shell-v2-mode-layout-triage.json` — the verdict record, so the
  scanner-wiring control resolves the deleted path from the latest record.

## QA / Validation

Measured against a **separate clean worktree** at the branch's base commit `a8ef8aed4b`, not a stash,
over the same scopes:

| scope | base `a8ef8aed4b` | branch |
|---|---|---|
| `src/__tests__/hygiene` | 5 suites / 85 tests / **1 failing suite, 1 failing test** | 4 suites / 66 tests / **0 failing** |
| `src/components/shell/__tests__` | 5 suites / 40 tests / **0 failing** | 6 suites / 55 tests / **0 failing** |
| `src/components/navigation/__tests__` | 1 suite / 17 tests / **0 failing** | 1 suite / 17 tests / **0 failing** |
| `src/__tests__/behaviors` | 153 suites / 1669 tests / **0 failing** | 153 suites / 1669 tests / **0 failing** |

The one failure that leaves `hygiene` is the deleted suite. No absolute repository-wide failure count
is quoted, because this change did not cause one.

**The new suite was proven able to fail.** Six mutations of the product, each confirmed to have
changed its file before the suite was re-run:

| mutation | result | what it proves |
|---|---|---|
| replace `<RibbonSynthesis …/>` in `ProgramDetailPage.tsx` with `null` | 1 of 15 failed | the Mode B ribbon is rendered, not merely imported |
| drop the `embedded` prop from `AgentCanvas`'s `<AtlasDrawer>` | 3 of 15 failed | the Mode B chat stays embedded — the old suite's case would have stayed green on its comment |
| default `showAppRail` to `true` in `AppShell` | 1 of 15 failed | the legacy rail stays opt-in |
| remove the `AtlasPageStateProvider` wrap from `AppShell` | 1 of 15 failed | the shell owns the provider |
| render `AskAnythingBar` beside the Tower chat panel | 2 of 15 failed | a second chat, and the wrong chat kind, on a Mode A surface |
| wrap the programs index body in its own `AtlasPageStateProvider` | 1 of 15 failed (`<= 1`, received 2) | a page re-mounting the provider the shell already mounts |

**The wiring was proven necessary in both directions:**

| mutation | result |
|---|---|
| replace the `npx jest src/components/navigation/__tests__` **command**, leaving its comment block | `product-directory-ci-coverage.test.ts` 1 of 4 failed |
| restore the directory to the dark-directory baseline with the command present | `product-directory-ci-coverage.test.ts` 1 of 4 failed |

Gates run:

- `npx jest --runTestsByPath src/components/shell/__tests__/shell-v2-mode-layout.test.tsx` — 15 of 15 pass
- `t770-scanner-wiring-refusal`, `t492-stale-suite-triage-record`, `t493-stale-suite-triage-record`,
  `t492-wired-directory-ci-coverage`, `product-directory-ci-coverage` — 64 of 64 pass
- `node scripts/quality/triage-record-census-reconciliation.mjs` — exit 0
- `node scripts/quality/test-ci-coverage-census.mjs --check` — `committed census matches this run`
- `npm run audit:named-suite-requiredness` — exit 0
- `npm run test:integration:ci-visibility` — exit 0
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no diagnostics. Judged on the exit code: a bare run exits 134 on the operator host, an out-of-memory crash that emits nothing and reads as clean. Its first run on this branch exited 2 on this suite's own mock typing, which was fixed and the provider-count mutation re-proven afterwards.
- `npx eslint` on the new suite — exit 0
- `node scripts/release-check.mjs --base origin/main --head HEAD` — exit 0

## Known Gaps

- **`src/__tests__/hygiene` is now green, 4 of 4, and still deliberately NOT wired.** Two of its four
  files are declared source-text scanners carrying `textIsTheSubject` — the half of this item that
  needs a lane decision from the owner and that a scanner-wiring control refuses to wire whether it
  passes or not.
- **An unmounted surface is no longer guarded.** The old suite guarded a Source index page that no
  route renders. Whether to delete that component is not this change's to decide.
- **The chat census counts four leaf components.** A future chat component that owns its own
  composer is invisible to it until it is added to the mocked leaves; the suite's header says so.

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
  deleted, one test file added, one workflow step, and four generated or record artifacts.

## Rollback Plan

Revert the squash commit. Nothing to unwind beyond that: no migration, no data write, no flag, no
runtime template change. Reverting restores the deleted scanner and re-dark-lists the directory, and
the ratchet's set equality keeps those two consistent with each other automatically.

## Audit Evidence

- PR URL and its CI run, including the **Run the T-495 top-nav render suites** step's job log and
  the AI surface control catalog workflow's **Exercise unwired component suites** step, which now
  collects the new suite.
- `docs/architecture/t495-shell-v2-mode-layout-triage.json` — per-suite verdict, both baseline and
  branch measurements, all eight mutations with their results.
- `docs/architecture/t492-stale-suite-triage.json` — the originating row and its `movedTo`.
- `docs/architecture/test-ci-coverage-census.json` — the coverage census at this commit.
- Post-merge: the ACA deploy run at or after the merge SHA, and the template-vs-traffic digest
  comparison.
