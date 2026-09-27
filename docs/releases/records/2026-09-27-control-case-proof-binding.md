# 2026-09-27-control-case-proof-binding — Bind each AI-surface control credit to the test case that proves it

## Release ID

`2026-09-27-control-case-proof-binding`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog records, for every AI-facing screen and route, which
disclosure controls it must carry — an AI label, citations, a confidence tier, a
human-approval gate — and, for each one, the behavioral test that proves it. A CI gate
checked that declaration hard: the test file must exist, the catalog workflow must
actually run it, and the workflow's name filter must be the one the catalog declares.

What the gate never did was look inside the file. Coverage is credited **per control
kind**, so a suite named by four kinds earned four credits regardless of what it
exercised. Measured on `912a1c593c`, 10 test files carried 25 of the 35 reachable
credits; the worst was a 61-case general suite credited for two kinds.

Deleting the single case that proved one of those two controls left the suite green at
60 cases and left the gate green at exit 0, still reporting that control covered inside
"35 of 35 (100%)". Nothing anywhere went red. That is the founding defect of this
programme restated: a control proved by a name rather than by something that runs.

Each credit now names the case or cases that prove it, and a new gate reads those names
back **from jest's own report** and requires every one to have run and passed. Rename
the case, delete it, skip it, or break the control it asserts, and CI goes red naming
the control and the case.

Nothing a user sees changes. No product code changed, no tenant data is read, and no
control's behavior was altered — only what CI is able to prove about them.

## Layer Impact

Release lane: `internal-admin` — a control catalog, two gate scripts, a census script, a
CI workflow step and a behavioral suite. No product surface, no client data plane.

- **Layer 4 (products)** — no behavior change. Product components and routes are
  untouched; the change is to what the control catalog asserts about them and to the
  gate that checks it.
- **Control plane / CI tooling** — one new pull-request gate, one extension to the
  existing catalog gate, one new hop in the CI test-coverage census, and a 128-entry
  addition to the control catalog.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — an audit document, two gate scripts, a census script, a CI
  workflow step and a behavioral suite
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/security/ai-surface-control-catalog.json` — `behavioralTest.provenCases` added to
  all 39 controls that name a behavioral test path: 128 case names across 23 suites.
  Every name was resolved against jest's own report at authoring time rather than typed,
  so the initial values cannot contain a name that does not exist.
- `scripts/audit/ai-surface-control-cases.mjs` — **new**. Runs the 23 credited suites in
  one jest invocation and reconciles each declared case name against what jest reported,
  by name and by status.
- `scripts/audit/ai-surface-control-catalog.mjs` — the static half: a credited control
  must declare a non-empty, well-formed `provenCases`, and two kinds on one surface may
  not name the same case. The second rule is **imported** from the new module rather than
  reimplemented, so it has one owner.
- `scripts/quality/test-ci-coverage-census.mjs` — a resolution hop for the new script,
  built on the existing ratchet-baseline precedent. Its spawn line is
  `["jest", "--runTestsByPath", ...suites, …]`, so the suites live in the catalog and not
  in any command line; the census now reads them from the catalog's own
  `behavioralTest.path` fields. Without this the invocation lands in
  `indeterminateInvocations`, which 28 behavior suites assert is zero.
- `.github/workflows/ai-surface-control-catalog.yml` — one step,
  `npm run audit:ai-surface-control-cases`.
- `package.json` — the `audit:ai-surface-control-cases` script.
- `docs/architecture/ci-gate-registry.json` — the new script classified `pr-gate`.
- `src/__tests__/behaviors/control-case-proof-binding.test.ts` — **new**, 15 cases.

## QA / Validation

**Red-first, on `main` before any code was written.** Deleted the case
`renders the persistent AI responsibility footer` from
`src/components/agent/__tests__/AgentDock.test.tsx` — the only proof of
`agent-dock-chat-turns/responsibility-footer`:

| | before this change | after |
|---|---|---|
| the suite | 61 → 60 cases, **green** | 61 → 60 cases, green |
| `npm run audit:ai-surface-controls` | **exit 0**, control reported covered, "35 of 35 (100%)" | exit 0 (this is the static half; the case is a runtime question) |
| `npm run audit:ai-surface-control-cases` | did not exist | **exit 1**, naming the control and the missing case |

**Clean baseline over the same scope**, measured in a separate worktree at
`origin/main` `96b5bc62c8` rather than by setting work aside in the same tree:

| | suites | tests | failing |
|---|---|---|---|
| `npm run test:behaviors` at `96b5bc62c8` | 145 | 1535 | **0** |
| `npm run test:behaviors` on this branch | 146 | 1550 | **0** |

`912a1c593c`, this branch's original base, measured the same: 145 / 1535 / 0. So no
failure in either run is attributable to this change, and the delta is exactly the one
suite and 15 cases added here.

An intermediate state of this branch **did** turn 29 behavior suites red, and both
causes were real controls doing their job rather than flakes: the new npm script was not
in the CI gate registry (1 suite), and the census could not resolve its jest invocation
(28 suites). Both are fixed above, by registering the gate and by teaching the census to
resolve the spread — not by relaxing either assertion.

**Five mutations against the fix, five caught, each by named cases:**

| # | Mutation | Result |
|---|---|---|
| 1 | `reconcileProvenCases` stops reporting a case name jest never ran | 1 failed / 14 passed |
| 2 | the status check accepts any status, not only `passed` | 2 failed / 13 passed |
| 3 | the static gate stops requiring `provenCases` | 1 failed / 14 passed |
| 4 | `findSharedProvenCases` stops reporting a case claimed by two kinds | 2 failed / 13 passed |
| 5 | the census hop returns no suites | census reports 1 unresolved invocation; 1 census suite red |

Mutation 4 fails a case in the *static gate* group as well as the pure-function group,
which is the evidence that the gate's import of that rule is load-bearing and not
decorative. Mutation 5 is recorded because a first attempt at it did not apply — the
string had changed — and a mutation that does not apply reads exactly like one that was
caught; it was re-applied and verified to change the census output before being counted.

**Six mutations against the real controls, six caught** — the other direction, proving a
declared case is genuinely about the control it is credited to rather than merely
present in the same file:

| # | Mutation | Caught by |
|---|---|---|
| 1 | delete the proving case | `ran no case named …` |
| 2 | rename the proving case (suite stays at 61 cases) | `ran no case named …` |
| 3 | `it.skip` the proving case | `reported pending rather than passed` |
| 4 | drop `provenCases` for one control | static gate, `no provenCases` |
| 5 | declare one case under two kinds | static gate, `cannot be the proof of two different controls` |
| 6 | remove the rendered `AIResponsibilityFooter` from `AgentDock.tsx` | `reported failed rather than passed` |

A seventh, on a mapping that was judgment rather than obvious: blanking `readinessLabel`
in `deliverable-canvas-polish-view.ts` failed **exactly** the case credited to
`moves-deliverable-canvas-view/confidence` and nothing else.

**Other checks:**

- `npx eslint` on all changed files — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  zero diagnostics, zero output lines, judged on the exit code rather than on a grep.
- `npm run audit:ai-surface-controls` — passes; 23 surfaces, 44 declared controls, 35 of
  35 reachable controls covered. **Unchanged, deliberately**: this release does not move
  the coverage figure, it changes what the figure is allowed to mean.
- `npm run audit:ai-surface-control-cases` — passes; 39 credited controls name 128 cases
  across 23 suites, all run and passed. Runtime about 3s for one jest boot.
- `node scripts/audit/ci-gate-registry-check.mjs` — exit 0.
- Census before/after: 2507 → 2508 test files, 2070 → 2071 run by a workflow, 437 → 437
  run by no workflow, directory counts unchanged. The census hop resolves 23 entries via
  `control-case-catalog` with `indeterminate` at 0, confirmed by calling
  `collectReachableCommands` directly — so it **resolves** the invocation rather than
  exempting it. It adds no coverage, and this record does not claim it does: those 23
  suites were already run by other workflows.

## Rollout Plan

Merge to `main`. No runtime rollout: no product code, route, image, flag, environment
variable or migration is involved. The repo-owned ACA deploy workflow will run on merge
as it does for every commit; that deploy is expected to leave the runtime unchanged in
substance, and proving the runtime invariant here confirms the merge did not move the
shared runtime rather than proving anything about this change being live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
- Shared runtime mutators: none — no `az` command is run by this release
- Approved image digest: whatever the repo-owned workflow builds from the merge SHA; this
  release pins nothing and requests nothing
- ACA runtime invariant: to be read from Azure after merge (template image == 100%-traffic
  revision image == governed worker job images, digest-pinned)
- Worker image invariant: unchanged by this release
- Feature/env flag update path: none
- Live signed-in proof required: **no**, and stated rather than left blank. This release
  ships no product surface: nothing renders, no route changes, no prompt changes, and no
  tenant data is read. There is nothing a signed-in session could observe.

## Rollback Plan

Revert the single squash commit. Nothing else is required — no migration, no image, no
flag. Reverting restores the previous catalog and removes the new workflow step, gate
script, census hop and suite together; each half is inert without the others, so a
partial revert is not needed and a partial revert of the catalog alone would fail the
static gate rather than pass silently.

## Audit Evidence

- PR: recorded on the pull request for this branch
- CI: `AI surface control catalog` workflow, including the new
  `Prove each credited control still has its case` step; `Unit suites` and the behavior
  coverage floor for the new suite
- Baseline evidence: `npm run test:behaviors` at `96b5bc62c8` and at `912a1c593c` in a
  separate clean worktree, 145 / 1535 / 0 both times
- Mutation evidence: the two tables above, each figure taken from a run rather than
  predicted
- Census evidence: `node scripts/quality/test-ci-coverage-census.mjs` before and after,
  plus a direct `collectReachableCommands` probe showing 23 `control-case-catalog`
  entries and `indeterminate: 0`

## Known Gaps

- **`provenCases` binds a credit to a case; it does not prove the case asserts the right
  thing.** The mapping from 128 case names to 39 control kinds was authored by reading
  each case and was spot-checked by mutation in two places (a rendered footer, and a
  view-model readiness label), not in all 39. A case genuinely about the wrong kind would
  pass this gate. That is a strictly smaller hole than the one being closed — before this,
  a credit was bound to nothing at all — but it is a hole, and naming it here is the
  honest state.
- **Five declared controls remain uncovered and are untouched by this release.** All five
  sit on `tower-atlas-program-pressure-brief`, whose component no route reaches; they
  carry `behavioralTest.status: "none"` with a reason, so they declare no credit for this
  gate to bind. Mounting or migrating them is a separate change and a product decision.
- The `provenCases` requirement applies to every control that names a test path. It says
  nothing about how many cases a kind needs; one case is enough to satisfy it.
