# 2026-09-19-source-integration-ci-registration — 92 Source integration suites were never run by CI

## Release ID

`2026-09-19-source-integration-ci-registration`

## Status

`candidate`

## Plain-English Summary

`src/__tests__/integration/source/` holds **92 test suites. No GitHub workflow
ran any of them.**

The repository already has a gate for exactly this — "Changed integration suites
have a CI owner" — but it only fires on a suite that the current PR *changes*.
Every suite that nobody has touched since the gate was written therefore sat
unexecuted indefinitely. It surfaced now only because a PR added two new suites
to that directory and was blocked.

Running the directory for the first time found:

| | |
|---|---|
| Suites that pass | **68** |
| Tests that pass | **591** — assertions nobody was collecting |
| Suites that fail on clean `main` | **24** |
| Failing tests | **68** — defects nobody could see |

This wires the directory into CI. The 68 green suites now run on every PR. The
24 red ones are named, with reasons, in
`scripts/quality/source-integration-quarantine.json`.

### Why the directory and not a list of files

The workflow command names the **directory**, so a new Source integration suite
runs the day it lands rather than needing a workflow edit first. That is also
what makes the visibility gate pass for suites nobody has written yet — the
property that unblocks the PRs currently queued behind it.

### The fix that would have looked right and registered nothing

The first draft put the jest run behind an npm script and a wrapper file. That
reads as tidier and **fails silently**: the visibility gate counts a suite as
registered only when a workflow command mentions a test runner **and** names the
suite or a containing directory. A wrapper satisfies neither, so every new
Source integration suite would have gone on failing the gate while the workflow
appeared to run correctly.

Only checking the gate's own predicate caught it. So the command names `npx
jest` and the directory literally, and only the exclusion flags are generated:

```
npx jest src/__tests__/integration/source --no-coverage --ci $(node scripts/quality/source-integration-ignore-args.mjs)
```

Two further details are load-bearing and easy to undo by accident:

- **No trailing slash on the path.** The gate requires the path to be followed
  by whitespace or end-of-command; `source/` makes it stop matching.
- Because jest reads that argument as a *pattern* rather than a directory, it
  also sweeps in sibling files at the integration root whose names begin with
  `source`. One of those is red, so it is named in `alsoIgnored` rather than
  silently tolerated. A trailing slash would have been the natural fix and is
  the one thing that cannot be used here.

### Why 24 suites are excluded rather than fixed

Wiring all 92 would have turned every PR red on arrival, and a workflow that is
red on arrival gets switched off within a day — which is how the directory came
to be unwatched in the first place. The green majority runs now; the red 24 are
recorded as debt with a named cluster each, not quietly dropped.

**Default is include.** A suite runs unless it is on the list, and
`check:source-integration-quarantine` refuses the two ways such a list rots: an
entry naming a suite that no longer exists, and growth past the size the list
was created at (24). Lowering that ceiling as suites are repaired is the point;
raising it takes a visible edit.

### What the 24 failures actually are

Counted and clustered, not just counted:

| Cluster | What it is |
|---|---|
| **Null event object** (~40 of 68 tests) | Product components reading properties off an event the harness supplies as `null` — `SourceScopeStageWorkspace.tsx:365` reading `dataReadiness`, and the same shape for `stages`, `id`, `vendorResponses`, `name`. **This is product code throwing, not a stale assertion.** |
| Next navigation stub | `(0, _navigation.notFound) is not a function` in route-level suites. |
| Stale copy assertions | Suites asserting on-screen text that has since changed. |
| Unclustered remainder | The rest of the `toContain` / `toBe` / `toMatch` failures are counted, not explained. Saying so beats implying a triage that has not happened. |

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI control plane** — one new workflow, one new PR-gate npm
  script, one args generator, one quarantine list, one behaviour suite.
- **No product code changes.** No route, projection, adapter, schema, migration,
  runtime config or image. The 68 suites are executed, not edited.

## Client Applicability

No client receives this change; it is repository CI only.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `.github/workflows/source-integration.yml` | new — runs the directory on every PR |
| `scripts/quality/source-integration-quarantine.json` | new — the 24 exclusions, their clusters, and the root-level sweep-in |
| `scripts/quality/source-integration-ignore-args.mjs` | new — generates only the exclusion flags |
| `scripts/quality/check-source-integration-quarantine.mjs` | new — refuses a stale or growing list |
| `src/__tests__/behaviors/source-integration-ci-registration.test.ts` | new — 5 cases pinning the registration property |
| `package.json` | adds `check:source-integration-quarantine` |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| The exact workflow command, run locally | **pass** — exit 0, 68 suites, 591 tests |
| `src/__tests__/behaviors/source-integration-ci-registration.test.ts` | **pass** — 5/5 |
| `npm run check:source-integration-quarantine` | **pass** — 24 excluded of 92, 68 run |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the three changed code files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

Each applied to a clean tree, measured, restored.

| mutation | expected | observed |
|---|---|---|
| jest step replaced by a wrapper npm script | caught | 3 of 5 red |
| workflow deleted entirely | caught | 3 of 5 red |
| directory replaced by one explicit file path | caught | 1 of 5 red — the not-yet-written-suite case |
| command widened to the whole integration root | caught | 2 of 5 red — the negative control |
| a quarantined suite that no longer exists | caught | validator exit 1, and 1 of 5 red |
| quarantine grown past its ceiling | caught | validator exit 1 |
| the ceiling check removed, then the list grown | **passes** | validator exit 0 |

The first is the one worth naming: it is the tidy-up a reviewer would suggest,
and it silently un-registers every suite. The last is the control — with the
ceiling removed the list can grow unnoticed, which is what makes the ceiling
load-bearing rather than decorative.

**One mutation was initially wrong and reported a false gap.** The first M1 run
targeted command text that no longer existed, so the replace was a no-op, the
suite stayed green, and the harness reported the test as not catching the
mutation. The anchor now asserts before mutating. A mutation that does not apply
is worse than no mutation, because it reads as evidence.

## Rollout Plan

Squash merge to `main`. The workflow runs on the next PR. No image build, no ACA
deploy, no migration, no flag.

## Deployment Authority

Not applicable. This cannot affect Azure Container Apps, deploy workflows,
runtime images, flags, environment variables, worker jobs, traffic, DNS or
environment promotion.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no — nothing here is observable to a signed-in user

## Rollback Plan

Revert the commit. The workflow stops running and the directory returns to being
unwatched. No product behaviour changes either way.

## Audit Evidence

- Workflow: `.github/workflows/source-integration.yml`
- Exclusions and their clusters: `scripts/quality/source-integration-quarantine.json`
- Registration property: `src/__tests__/behaviors/source-integration-ci-registration.test.ts`
- The gate this satisfies: `scripts/quality/check-integration-ci-visibility.mjs`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **24 suites remain red and unrun**, including a cluster where product code
  throws on a null event object. This release makes that debt visible and
  bounded; it does not pay it down. Each cluster needs its own triage.
- **The unclustered remainder is genuinely unexplained.** Roughly half the
  failing tests were counted but not diagnosed.
- **This is one directory.** Other `src/__tests__/integration/*` directories may
  have the same blind spot — the same gate would miss them the same way — and
  they have not been checked.
- **The 591 passing tests have never run in CI before**, so they have not been
  observed to be stable across environments. A suite that passes locally and
  flakes on a runner will show up as noise on the first few PRs.
