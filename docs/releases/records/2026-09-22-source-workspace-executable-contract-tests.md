# 2026-09-22-source-workspace-executable-contract-tests — Source workspace contract suites now run the code they describe

## Release ID

`2026-09-22-source-workspace-executable-contract-tests`

## Status

`candidate`

## Plain-English Summary

Two test files in the Source workspace claimed to protect real behaviour but
never ran any of it. Instead of calling the code, each one opened the product's
source files with `readFileSync` and asserted that certain strings appeared in
them. Both were green, and both would have stayed green against a product that
had stopped working — because a *comment* containing the matched string
satisfies every such assertion.

That is not hypothetical here. One of the two exists to stop a specific,
already-shipped defect: a data-freshness label that guessed the refresh date by
pattern-matching a date out of a load-run identifier, and therefore told a
reader a package's version date was the portfolio's refresh date. This change
measured what the old suite did against that exact defect reintroduced, with
the matched string left behind in a comment: **the old suite passed all seven
cases.**

The suites now execute the product. The freshness cases run the date control,
the load-run read and the portfolio assembly. The tenant-routing cases run both
contract APIs as real request handlers and render the real workspace component,
and ask the only question that matters for tenant safety: which tenant was the
read actually issued for?

No product behaviour changes. One helper gained an `export` keyword so a test
can call it directly, matching how several neighbouring helpers in the same
file are already tested.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients,
not feature-gated. The change is test-only plus one `export` keyword, so the
lane carries no client-visible behaviour with it.

- **Layer 4 (Products — Source):** test-only. The Source workspace's freshness
  control and explicit-client request routing are unchanged; they are now
  covered by cases that execute them.
- **Layer 3 (Canonical model):** no change. The canonical load-run completion
  read is unchanged; a case now proves at runtime that it stays scoped to the
  canonical tenant and does not widen to the legacy alias set to reach a date.
- **Layers 1–2:** untouched.

## Client Applicability

- All clients: no behaviour change.
- Specific clients: none.
- Internal only: test and CI surface only.
- Public/demo only: n/a.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/__tests__/sourceFreshness.test.tsx`
  — rewritten. 7 file-reading cases become 7 executing cases covering the date
  control, `listSourceLoadRunCompletions`, and the portfolio's
  newest-completion selection.
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.test.ts`
  — rewritten. 3 file-reading cases become 8 cases that run the contract-detail
  `GET` and the optimization `POST` as request handlers.
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-explicit-client-api-routing.browser.test.tsx`
  — new. The browser half of the same contract, which needs a DOM and so cannot
  share the node-environment file above.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
  — one word: `sourceDateControl` is now exported, as `contractPurposeSummary`
  and `SourceCommandKpiStrip` in the same file already are.

## QA / Validation

**Baseline, measured on both sides over the same scope.** Every suite under
`src/app/(maestro)/source/preview/workspace/__tests__`, by explicit path:

| | suites | tests | failing |
|---|---|---|---|
| clean `origin/main` at `5348e23b0` | 33 | 286 | 0 |
| this branch | 34 | 294 | 0 |

Nothing was red before and nothing is red after; the 8 additional cases are the
net of replacing 10 file-reading cases with 18 executing ones.

**The old suite measured against the defect it exists to prevent.** The
freshness control was changed back to parsing a date out of
`activeLoadRunId`, with a comment left in place mentioning
`portfolio.workspaceDiagnostics.lastCompletedLoadAtIso` — exactly the shape the
old assertions matched:

- old suite: **7 passed, 0 failed** — fully green against the live defect.
- new suite: **2 failed, 5 passed**.

**Red-first proof, fifteen deliberate mutations, fifteen caught.** Each was
applied to the product, the suite run, and the file restored byte-identical
(`git status` clean afterwards, verified):

| # | product mutation | result |
|---|---|---|
| M1 | date control reads the load run id instead of the recorded completion | 2 failed |
| M2 | the scenario-date branch is removed | 1 failed |
| M3 | the completed-status filter is dropped from the second half of the union | 1 failed |
| M4 | the second package loader is dropped from the union | 1 failed |
| M5 | the canonical read is swapped for the legacy-alias fallback | 2 failed |
| M6 | the newest-completion helper trusts the query's ordering and takes the first row | 1 failed |
| M7 | the non-array guard is removed | 1 failed |
| R1 | the detail route ignores the explicit client and reads under the session default | 1 failed |
| R2 | the detail route skips the tenant access check | 3 failed |
| R3 | the detail route degrades an unresolvable client into the session default | 1 failed |
| R4 | the optimization route asks tenancy about the session rather than the requested client | 1 failed |
| R5 | the optimization route resolves an unknown client only after tenancy | 1 failed |
| B1 | the browser drops the client from the contract-detail fetch | 1 failed |
| B2 | the browser drops the client from the optimization request | 1 failed |
| B3 | the url builder emits an empty `client=` when none is resolved | 1 failed |

M5 and R1 are the two that carry tenant-safety meaning: one proves a freshness
read cannot widen tenant scope, the other proves a request naming an explicit
client is not answered from another tenant's data.

**Where a string assertion remains, and why.** Three cases assert on SQL text —
a `status` filter is applied by Postgres, not by us, and no unit test can
execute it. Those assertions are made against the statement the adapter
*issued at runtime*, captured from the session it opened, and are checked
per-union-branch so a filter on one half cannot cover both. A comment in a
source file cannot satisfy them.

- `npx jest --runTestsByPath <the three suites>` — 3 suites, 18 tests, 18 passed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, no diagnostics. Judged on the exit code: a bare `npx tsc
  --noEmit` exits 134 on this host and reports a false clean when piped to grep.
- `npx eslint` over the changed files — 0 errors, 0 warnings.

## Rollout Plan

Merge to `main`. No runtime rollout: the change is test-only plus one `export`
keyword, so the repo-owned ACA main deploy workflow carries it with the next
image like any other commit. No migration, no flag, no env var, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command is run by this change.
- Approved image digest: n/a — no runtime-affecting change; the next main image
  carries it.
- ACA runtime invariant: to be confirmed on the deploy run for the merge SHA.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing a signed-in reader can see
  changes. The product behaviour these cases cover is the behaviour already on
  `main`; that is the point of the change.

## Rollback Plan

Revert the PR. There is nothing to undo beyond the files themselves — no
migration, no data write, no runtime state. Reverting restores the previous
suites, which were green and will stay green, including against the defect they
do not detect.

## Audit Evidence

- The PR, its check run, and the baseline/mutation tables reproduced in its body.
- The mutation script used to produce the fifteen rows above is described in the
  PR; each mutation is a one-line edit to a named product file, and each was
  restored byte-identical before the next ran.

## Known Gaps

- The third suite named in the same backlog item,
  `workspace-ava-contract.test.ts`, is **not** converted here and is filed
  separately. It reads five source files, and one of its seven cases asserts CSS
  class names and layout widths, which a jsdom test cannot execute — converting
  that case needs a product decision rather than more test code, so it is filed
  `decision needed` rather than guessed at.
- The 10 partial file-reading cases inside two otherwise-executing suites, named
  in the same item as its declared second half, are untouched here.
- None of these suites is wired into a workflow. They were unwired before this
  change and remain so deliberately: the backlog item that wires suites into CI
  is a separate, owned piece of work, and wiring a suite in the same change that
  rewrites it would make a green CI run prove nothing about either.
