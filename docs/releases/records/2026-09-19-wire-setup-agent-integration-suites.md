# 2026-09-19-wire-setup-agent-integration-suites — wire two dark integration directories, and repair the five stale contracts holding them out

## Release ID

`2026-09-19-wire-setup-agent-integration-suites`

## Status

`candidate`

## Plain-English Summary

Two directories of integration tests were not run by any continuous-integration
job, so 122 passing checks were being collected by nothing and five checks had
been failing unnoticed. This change reads each of the five, repairs it, and adds
both directories to the job that runs on every pull request.

None of the five was a product defect. Three of them asserted the behavior of
the request-routing file by reading it as **text** and matching a destination
path together with its surrounding quote characters — a form that goes red when
somebody changes a quote style and stays green when somebody changes where a
user is actually sent. That is backwards, and it is why all three were stale:
a route consolidation had changed the destinations months earlier. Those three
destinations are now exported as ordinary objects and asserted directly, so the
check fails when a redirect changes and survives a reformat.

The other two asserted display copy — a tenant classification that stopped being
the only one of its kind, and a card title that no template in the codebase has
ever carried. Both were rewritten to assert the property the copy stood for. In
the tenant case that property is a safety one worth more than the original: a
tenant nobody has configured must not be handed a richly-provisioned context, and
must not silently inherit another tenant's name. That direction is now asserted
explicitly, in both directions.

One of the two directories could not be wired the ordinary way, and the reason is
worth recording. A test-runner path argument is a pattern, not a directory
handle, so naming a directory also runs every directory whose name it begins —
and this directory's name begins another one that is currently failing. Naming
the single suite it holds runs it without dragging the failing directory in. A
new check now refuses any wired directory name that is a prefix of another, so
the next occurrence fails locally instead of turning a shared job red for a
reason nobody would look for in a path pattern.

## Layer Impact

**Release lane: `global-control-lane`.** Shared continuous-integration behavior for
every client, with no feature gate — the job that runs on all pull requests gains
three suites. No client-scoped schema, data, retrieval or private data-plane path
is touched, so this is not `client-data-lane`.

- **Products** — no product behavior changes. The one product file edited
  (`src/proxy.ts`) moves two route-redirect maps from inside the request handler
  to module scope and exports them. The handler indexes the same objects with the
  same keys; no route, destination, status code or auth decision changes. A stale
  code comment describing a redirect target that no longer exists was corrected.
- **Canonical model** — unaffected. No schema, migration, projection, read model,
  tenant data or metric value is touched.
- **Source adapters / Client intake** — unaffected.
- **Platform tooling** — `.github/workflows/integration-suites.yml` gains one
  directory and one file path; the behavioral case that holds the runner and the
  visibility gate in agreement gains two cases.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes — test and continuous-integration scope.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `.github/workflows/integration-suites.yml` — wires `src/__tests__/integration/setup`
  as a directory and `src/__tests__/integration/agent/agent1-foundation.test.ts` as an
  explicit file path, with the collision reason recorded in the file header.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — two new
  cases: one proves a file-wired directory is covered in full and that its
  directory name is *not* in the command; one refuses a wired directory name that
  prefixes another integration directory. The known-dark set loses both entries.
- `src/__tests__/integration/setup/setup-admin-route-registry-parity.test.ts` —
  the retired-route contract is asserted against the exported maps instead of the
  routing file's source text; the three product destinations that must *not*
  collapse are asserted too, so a map that swallowed them would fail.
- `src/__tests__/integration/setup/setup-w6-policies-governance.test.ts` — same
  change for the retired tenant route; two stale markup markers replaced with the
  shell and server-side tenant resolution they stood for.
- `src/__tests__/integration/agent/agent1-foundation.test.ts` — tier assertion
  rewritten as grant-and-refusal, with an explicit case that an unconfigured slug
  does not inherit another tenant's name, classification or identity; two
  card-title assertions rewritten as template identity.
- `src/proxy.ts` — two redirect maps hoisted to exported module constants;
  one corrected comment. No behavior change.

## QA / Validation

**Baseline, measured by execution on the exact branch point before any edit**
(`npx jest --runTestsByPath` over the three suites): **3 suites, 5 failed / 122
passed / 127 total**. The backlog item's shape is exact.

**After**: **3 suites, 0 failed / 130 passed / 130 total**. The count rises by
three because one over-long case was split into three and one new refusal case
was added, not because anything was removed.

**Full wired command, before and after**: 145 suites / 4,162 tests → **148
suites / 4,292 tests**, `1 skipped` both times (a pre-existing skip, tracked
separately). The delta is exactly the three suites this change repairs.

**Nine deliberate mutations, every one caught** — each applied to the real
execution path, the suite run, then reverted:

| # | Mutation | Result |
|---|---|---|
| 1 | Retired tenant route retargeted to its former destination | 2 failed / 14 passed |
| 2 | One retired key deleted from the map | 1 failed / 9 passed |
| 3 | A product destination swallowed into the consolidated one | 1 failed / 9 passed |
| 4 | An unconfigured tenant slug granted the rich classification | 3 failed / 111 passed |
| 5 | Unknown page falls through to a known card instead of the fallback | 2 failed / 112 passed |
| 6 | A surface with no templates borrows the known surface's card | 1 failed / 113 passed |
| 7 | The newly wired directory removed from the workflow command | 3 failed / 4 passed |
| 8 | The file-wired suite's directory named as a directory instead | 4 failed / 3 passed |
| 9 | The file-wired suite's path removed from the command | 2 failed / 5 passed |

Mutation 8 is the one that matters most: it is the collision this change exists
to avoid, and the new prefix case is among the four that fail on it.

**Regression scope — every suite that reads the routing file, plus its four unit
suites.** Measured against a clean checkout of the same commit: **1 failed / 103
passed before, 1 failed / 103 passed after**. The single failure
(`proxy-session-identity`, one case) is red on `main` independently of this
change, was confirmed red on a pristine tree, and is recorded as its own backlog
item rather than repaired here or quietly absorbed.

**Typecheck**: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty
false` — **exit 0**, zero diagnostics, judged by exit code rather than by
grepping its output.

**Lint**: `npx eslint` over every changed path — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in the deployed image changes
behavior. The repo-owned deploy workflow runs on merge as it does for any commit,
and the runtime invariant will be verified after it, but this change has no
product surface to prove.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az containerapp` command is run by hand.
- Approved image digest: whatever the merge commit's workflow builds; recorded after the run.
- ACA runtime invariant: verified after deploy with `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: same run, same digest.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — test and continuous-integration scope only. No route, component, prompt, schema, tenant data or auth path changes.

## Rollback Plan

Revert the merge commit. There is no migration, no data write and no runtime
state, so revert is complete and immediate. Reverting restores two dark
directories and five red checks; it does not restore any product behavior,
because none was changed.

## Audit Evidence

- The pull request and its checks, including the integration job running 148 suites.
- The before/after and mutation numbers above, each reproducible with the commands named.
- The clean-tree baseline that attributes the one remaining failure away from this change.

## Known Gaps

- **A route the registry marks active is not reachable.** The canonical route
  registry carries a Setup data-loads route as `active`, while the request proxy
  redirects that path away before the page renders. One of the two is wrong and
  which one is a mount-or-retire product call, so **neither answer is encoded
  here**. The divergence is named in a comment at the site and recorded as its
  own backlog item. A guess frozen into a test would be worse than the gap.
- The one pre-existing failing unit case described under QA is not repaired here.
- The single skipped suite inside the wired command is still unnamed; it predates
  this change and has its own backlog item.
- A new suite added to the file-wired directory will not run until it is named in
  the command. That is the cost of avoiding the collision, it is deliberate, and
  the coverage ratchet fails the day it happens rather than leaving it dark.
