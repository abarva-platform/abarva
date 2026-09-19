# 2026-09-19-moves-liability-visible-controls-ci — Moves AI-liability suite runs, and runs in CI

## Release ID

`2026-09-19-moves-liability-visible-controls-ci`

## Status

`candidate`

## Plain-English Summary

The Strategic Moves screens that hand a user an AI-generated document carry three visible
controls: an **AI Draft** badge on each document row, an **edit-before-commit** requirement
beside it, and a decision-support watermark on the panel. A test suite exists to prove those
controls are on the page.

That suite has not run at all. Importing the documents panel under jsdom pulls a
server-only authentication module whose dependency ships in a module format Jest does not
transform, so the file failed to parse before a single test executed — and a suite that cannot
parse reports as one failing file, in a directory no CI job ran, so nobody saw it.

Making it run exposed three failures underneath, none of which was a missing control:

1. Two of the sentences share one element on screen, and the assertion compared against an
   element's whole text, so a control that is plainly visible matched nothing.
2. The documents panel was rendered in the mode that deliberately suppresses internal labels.
   The one route that mounts this panel does not use that mode; the test did.
3. The phase action now opens a pre-commit confirmation dialog, and the test clicked the button
   and expected the generation request immediately. The request no longer fires until a named
   approver confirms — a control added after the test was written.

All three assertions were repaired against what the product does now, and the confirmation
step is asserted in both directions: the button alone must send nothing. A fourth case pins the
suppression behaviour, so a caller that asks for a compact layout and silently loses the
AI-draft disclosure shows up as a changed test rather than as a quieter page.

The directory is then wired into CI. **No product code changed.** The controls were already
correct; what was missing was anything that would notice if they stopped being.

## Layer Impact

`global-control-lane`.

- **Layer 4 — Products (Moves):** test and CI coverage only. No component, route, prompt,
  schema or data path changed, and no product behaviour changes for any client.
- No change to layers 1–3.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — repository test governance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx` — module
  mock for the tenancy resolver so the suite parses; three repaired assertions; one added case
  pinning the presentation-mode suppression.
- `.github/workflows/ai-surface-control-catalog.yml` — one step running the 13 green suites of
  `src/components/strategic-moves/__tests__`.

## QA / Validation

**Directory baseline on `origin/main` `a172f5ee4`, before any edit:** 14 suites, 2 failed /
12 passed; 139 tests, 4 failed / 135 passed.

**The suite itself, failing first:** it could not run — `Test suite failed to run`, 0 tests
executed. With the parse fixed and nothing else changed: **3 failed / 3**. After the
assertions were repaired: **4 passed / 4**.

**Scope, same command either side** — the 13 suites now wired:
`npx jest --runTestsByPath <13 paths> --runInBand` → **13 suites / 67 tests / 0 failing**.
On `origin/main` the same 13 paths are 12 passed + 1 unparseable.

**Five mutations to product code, five caught**, each byte-restored and `git diff`-confirmed
clean before the next:

| # | Mutation | Result |
|---|---|---|
| 1 | Drop the edit-before-commit sentence from the phase action header | 1 failed |
| 2 | Never render the AI Draft badge on a document row | 1 failed |
| 3 | Never render the decision-support notice on the panel | 1 failed |
| 4 | Render the per-row requirement unconditionally, leaking it into presentation mode | 1 failed |
| 5 | Make the phase action call generation directly instead of opening the confirmation | 1 failed |

**Wiring mutation — the step, not the file.** Replacing the new workflow step with
`echo skipped` and re-running `node scripts/quality/test-ci-coverage-census.mjs`:
suites reached by a workflow **403 → 390**, and the directory returns to **rank 1** of the
uncovered governed-risk list. Restored, it is absent from that list and the count is 403 again.
The coverage claim is therefore tied to the step running, not to the file existing.

**Other checks:** `npx tsc --noEmit --pretty false` with `tsconfig.tsbuildinfo` removed first —
**exit 0**, exit code judged, not grepped. `npx eslint` on the changed suite — exit 0.
`node scripts/release-check.mjs --base origin/main --head HEAD` — recorded in the pull request.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is a Jest suite and a workflow step. The
repo-owned ACA main deploy workflow will include the merge commit in its next image, which is
behaviourally identical either way.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime change.
- ACA runtime invariant: unchanged by this release.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — no route, component render, copy, prompt, schema or
  data path changed.

## Rollback Plan

Revert the pull request. No migration, no flag, no data change.

## Audit Evidence

- The pull request and its CI run, including the `AI surface control catalog` job log, which
  must show the new step executing the 13 suites.
- The mutation table above; each row is reproducible from the named edit.
- `node scripts/quality/test-ci-coverage-census.mjs` before and after, for the 403/390 figure.

## Known Gaps

- **One suite in the directory stays out of the gate, deliberately.**
  `MovesPhaseStandaloneClient.test.tsx` has 4 cases failing on clean `main`. Three of them
  assert copy or a CSS class that appears nowhere in product code today; one expects an
  artifact-open URL that a later change deliberately altered. They are triaged in the backlog
  rather than fixed here, because fixing them needs a decide-which-side-is-wrong pass per case
  and this change is bounded. Wiring the directory wholesale would have imported four known
  failures.
- **Presentation mode still suppresses the AI-draft disclosure**, and `compact` selects
  presentation mode. The only route that mounts the panel passes `compact={false}`, so nothing
  is suppressed in the product today. Whether a demo view should be allowed to hide an
  AI-generated-content label at all is a product call, logged in the backlog and not decided
  here.
- The committed coverage census is not refreshed by this release; it is a dated measurement
  refreshed by an operator write, and refreshing it here would collide with concurrent work.
