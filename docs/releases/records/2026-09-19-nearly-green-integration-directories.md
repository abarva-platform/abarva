# 2026-09-19-nearly-green-integration-directories — Six stale assertions were holding 35 suites out of CI

## Release ID

`2026-09-19-nearly-green-integration-directories`

## Status

`candidate`

## Plain-English Summary

Five folders of integration tests were never run by any CI job. Not because the
tests were bad — between them they held 1,105 assertions that passed — but
because each folder contained a handful of assertions that had gone out of date,
and a job that is red on arrival is a job people learn to ignore. Six failing
assertions in total were keeping 35 test files out of continuous integration.

All six turned out to be stale contracts rather than product defects. Each one
was repaired by asserting the property the old literal stood for, rather than by
updating the literal to match today's code — because a contract pinned to an
exact string goes red the next time a correct change moves it, which is how all
six got here. No assertion was deleted and no test was weakened to make a folder
wirable; that trade is the one this work exists to refuse.

The six:

1. **A module path that never existed.** A hygiene check asserted the module
   imported `@/lib/agents/agent-mission-queue`; the module is at
   `@/lib/agent/...`, singular. The check could not pass. It was also named
   "imports **only** the two allowed cross-modules" while only verifying that
   two were present — it would not have noticed a third. Both halves are now
   real: the import set is compared, and a second case asserts every allowed
   path resolves to a file that exists, which is what would have caught the
   typo years ago.
2. **`FROM node:24`, made unmatchable by a correct change.** The Dockerfile now
   resolves its base through `ARG BASE_NODE_IMAGE` so the registry can be
   redirected at build time. The runtime is still Node 24; the literal just
   could not see it. The check now asserts the ARG default is a node:24 image
   and that every build stage comes from that ARG. This is strictly stronger
   than what it replaced: a stage hardcoded to a public `node:24`, escaping the
   reviewed base image, satisfied the old assertion and fails the new one.
3. **A migration snapshot that went red when the migration succeeded.** A case
   asserted the agent context broker was "not imported by app routes yet". One
   route now consumes it, which is the intended architecture. A test that fails
   when the intended change lands is worse than no test, because the cheapest
   way to make it green is to revert the change. Replaced with the boundary the
   broker exists to enforce: the broker owns bundle assembly and a route
   consumes the assembled bundle rather than reaching past it to build one.
4. **A hand-typed tenant count.** `toHaveLength(3)` went red when a fourth demo
   tenant was added. AGENTS.md forbids a hand-typed tenant list in any test, and
   retyping it as 4 only re-arms the trap for whoever adds the fifth. Replaced
   with the invariants a count was standing in for and never actually tested:
   the list is populated, no tenant appears twice, every listed tenant resolves
   through the module's own lookup, and no tenant is missing a surface.
5. **A sign-in layout that gained a second mode.** The panel now opens on an
   email one-time-code flow, with the invite credentials behind a tab. The
   credential-completeness gate it was testing is unchanged — the test was
   asserting it against a layout the panel no longer opens in. The default mode
   now gets its own gate assertion, since that is what an unauthenticated
   visitor actually sees.
6. **Three hand-typed account addresses.** The same suite listed three specific
   addresses that must not be disclosed, plus a positive anchor on the exact
   words "private invite" that a correct copy change had moved. A list only
   guards the accounts somebody remembered to type. Replaced with the property
   it approximated: the panel renders no address at all, in either mode.

**The CI run then found something the local run could not.** The repository's
"changed integration suites have a CI owner" gate blocked this pull request for
a suite the same pull request was running. The runner and the gate do not use
the same matching rule:

- **jest** treats a path argument as a regular expression against the full path,
  so `src/__tests__/integration/demo` *selects*
  `src/__tests__/integration/demo-code-sign-in-panel.test.tsx`.
- **the gate** registers a suite only by its exact path or by an **ancestor
  directory** of it. `…/integration/demo` is not an ancestor directory of that
  file; the only ancestor is the integration root, which no command names.

So a loose root suite picked up by a directory pattern runs in CI and is
reported as having no CI owner at the same time. This is not confined to this
change: the **eight `programs-*` root files** wired previously have been in that
state since the day they were wired — executing on every pull request, and
invisible to the gate the whole time, so anyone who edited one of the eight
would have been blocked by a gate that was wrong about its own repository. It
stayed hidden because the gate only fires on a suite the current pull request
changes, and nobody had changed one.

The fix is to name all eleven loose root files in the command as well. That
changes nothing about what executes — the wired command runs the identical 145
suites and 4,162 tests before and after, which was verified rather than assumed
— it makes the runner's set and the gate's set agree. A new behavioral case
asserts that agreement directly, so the next occurrence fails locally instead of
in CI.

A further repair was needed as a consequence. A negative control in the Source
CI-registration suite used one of these five folders as its example of "a folder
no workflow names" — true when written, false once that folder was wired. The
control was correct and its example had expired; it now uses a folder name no
workflow will ever name, so it stays exact without expiring again. An over-broad
CI command still fails it, which was verified by making one.

## Layer Impact

Release lane: **`global-control-lane`** — the change ships in the shared
control plane (CI workflows and the test contracts that gate every pull
request) and applies to all clients, with no feature gate. It carries no
runtime behaviour: nothing in the four-layer data path moves.

- **Layer 4 (Products):** no change. No route, component, prompt, schema,
  read model or answer path is modified. The one edit to a product file is a
  doc comment that named a module path which does not exist.
- **Tests, validators, CI and platform tooling:** five integration suites and
  one behavioral suite repaired; five directories added to the integration CI
  workflow; the wired-directory set, the dark-directory ratchet and the
  path-collision enumeration updated to match.

## Client Applicability

- All clients: no behavioral change.
- Specific clients: none.
- Internal only: yes — CI coverage and test contracts.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/integration-suites.yml` — five directories added to the
  wired jest command, with the measurement and the reasons recorded in the
  header.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — wired
  set extended, dark-directory ratchet narrowed by five, path-collision
  enumeration extended with the three loose `demo-*` root suites.
- `src/__tests__/behaviors/source-integration-ci-registration.test.ts` —
  negative control's expired example replaced.
- `src/__tests__/integration/architecture/mission-context-bridge.test.ts`
- `src/__tests__/integration/deployment/docker-runtime-packaging.test.ts`
- `src/__tests__/integration/knowledge/agent-context-broker.test.ts`
- `src/__tests__/integration/tenants/demo-tenant-data-tiers.test.ts`
- `src/__tests__/integration/demo-code-sign-in-panel.test.tsx`
- `src/lib/architecture/mission-context-bridge.ts` — doc comment only.

## QA / Validation

Measured on exact `origin/main` `66acc1a2ab9ed3fc0b751c1836cca7cfd7374582`.

**Failing first, over the same scope.**
Before: 38 suites, **5 failed / 33 passed**; **6 assertions failed** / 1,105
passed. After: **38 suites passed**, **1,115 assertions, 0 failed**. The
assertion count rises by ten because four cases were added, not because any were
removed.

**The wired CI command, run exactly as the workflow runs it.**
Before this change: 107 suites, 3,047 tests. After: **145 suites, 4,162 tests**
(144 passed, 1 skipped; 4,142 passed, 20 skipped). The skipped suite is
pre-existing and is already tracked as its own item.

**Repo-wide coverage census**, run on the base commit and on this branch:
suites run by a workflow **625 → 660**, i.e. **+35 previously-unrun suites** —
exactly the figure the backlog item predicted. Suites run by no workflow
1,667 → 1,632. Fully covered directories 73 → 78; uncovered 379 → 374.
Uncovered governed-risk directories unchanged at 46 critical / 109 high, as
expected: none of these five carries a governed-risk signal.

**Eighteen mutations, eighteen caught.** Each fix was broken deliberately and the
test confirmed red, then reverted:

| # | Mutation | Caught by |
|---|---|---|
| 1 | Bridge gains a third cross-module import | import-set case |
| 2 | The original `agents/` typo restored into the allowed list | both architecture cases |
| 3 | Base image default downgraded to node:22 | Dockerfile case |
| 4 | A stage hardcoded to `node:22`, bypassing the ARG | Dockerfile case |
| 5 | A stage hardcoded to `node:24` — **the old assertion passed this** | Dockerfile case |
| 6 | A route imports the broker's assembly internals | boundary case |
| 7 | The broker import dropped while the call site stays | broker-import case |
| 8 | A tenant listed twice | uniqueness case |
| 9 | A tenant added with a surface silently missing | surface-set case |
| 10 | The panel discloses an account address | disclosure case |
| 11 | The invite-gating statement removed entirely | disclosure case |
| 12 | Demo-invite gate drops the access-code requirement | credential-gate case |
| 13 | Email-mode gate drops the email requirement | email-gate case |
| 14 | A wired directory dropped from the workflow command | three coverage cases |
| 15 | A trailing slash added to a wired path | three coverage cases |
| 16 | A new colliding root file nobody has measured | collision case |
| 17 | The CI command broadened to the integration root | repaired negative control |
| 18 | The eleven loose root files un-named — the exact state this PR's first CI run was blocked by | new runner/gate agreement case, **and** the real gate reproduced it locally |

One mutation attempt (an early form of #12) reported `Tests: 0 total` — the
suite had not run at all. It was rerun against the gate predicate rather than
counted as a catch; a mutation that runs nothing is a false clean, not a pass.

**Other checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` **exit 0**, judged by exit code rather than by grepping output.
`npx eslint` over all changed files **exit 0**. `npm run test:behaviors`
**exit 0**, 36 suites / 363 tests. `npm run test:nav` **exit 0**, 26 tests.

## Rollout Plan

Merge to `main` via squash. The repo-owned ACA main deploy workflow builds and
deploys on merge as it does for any commit. Nothing here changes runtime
behaviour; the visible effect is that a CI job runs 38 more suites per pull
request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az containerapp` command is run by hand.
- Approved image digest: whatever the main deploy workflow produces for the
  merge SHA; recorded in the pulse entry after merge.
- ACA runtime invariant: to be proven after merge with
  `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: same check, same run.
- Feature/env flag update path: none; no flag or environment variable changes.
- Live signed-in proof required: **no.** Test and CI scope only. No product
  code, route, component, prompt, schema or data-plane path changes, so there is
  nothing a signed-in user can observe. The single product-file edit is a doc
  comment.

## Rollback Plan

Revert the squash commit. There is no migration, no data change and no runtime
configuration change, so a revert is complete on its own. Reverting restores the
five directories to being unrun by CI; it does not reintroduce any product
defect, because none was fixed here.

## Audit Evidence

- The PR, its CI run, and the `Integration suites that pass on main` job log,
  which should show 145 suites rather than 107.
- The before/after census figures above are reproducible with
  `node scripts/quality/test-ci-coverage-census.mjs` on the base commit and on
  the merge commit.
- The mutation table is reproducible: each row names the change to make and the
  case that must go red.

## Known Gaps

- **The runner/gate mismatch is fixed by enumeration, not by construction.** The
  eleven loose root files are named explicitly and a behavioral case holds the
  two sets in agreement, but the underlying asymmetry between a jest regex and
  the gate's ancestor-directory rule is still there. A colliding *directory*
  would be worse than a colliding file: a red directory arrives silently where a
  red root file arrives loudly. Filed as its own item.
- **Eleven integration directories are still reached by nothing**, because they
  are red. They are recorded as their own items with measured failure counts and
  are deliberately not wired here — wiring a red directory into a green job
  makes the job permanently red, which is the same end state as not running it.
- **One suite in the wired command skips, and 20 tests skip.** Pre-existing,
  already tracked separately.
- **A route imports `@/lib/knowledge/private-data-plane/registry` directly.**
  Found while repairing the broker boundary. Whether that is a legitimate public
  entry point of that registry or a bypass of the broker is an architecture
  question, not a test question, so no rule was encoded for it. Filed as its own
  item rather than guessed at.
- None of the 35 newly-running suites has ever executed on a CI runner. They
  pass locally on one machine; environment-dependent flake has had no chance to
  show. This is the same exposure already tracked for the previous wiring change
  and is called out again here rather than assumed away.
