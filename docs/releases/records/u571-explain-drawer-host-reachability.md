# 2026-10-05-u571-explain-drawer-host-reachability — the reasoning Explain drawer, proven through its hosts

## Release ID

`2026-10-05-u571-explain-drawer-host-reachability`

## Status

`candidate`

## Plain-English Summary

The product has a panel that explains, for one synthesis quote, which gate
criteria were established and which were not. Its headline sentence — "4 of 9
gate criteria met · 2 partial · 1 waived, not met · 2 unmet" — is the bit an
auditor reads first, and until this change the only thing that had ever executed
it was a unit test calling the string builder directly. No test had rendered the
panel. No test had rendered any of the components that open it. Nothing proved
that what the builder returns is what a reader is actually shown.

This change adds that proof. It renders each component that mounts the "Explain"
affordance, clicks the affordance the way a person would, and asserts the
headline the panel puts on screen — including the two readings the headline
exists to prevent: a deliberately-bypassed criterion must never be counted as
established, and a count of one must not read as a plural.

Two things the measurement found that the ticket had recorded differently are
asserted rather than written down in prose, because both files read as though the
opposite were true:

- One component the ticket listed as opening the panel does not open it. It
  mentions the affordance only in a comment describing a button style it copies.
  Three components open the panel, not four.
- The per-stage drawer the ticket asked the same question of has no gate
  headline at all. It is a different panel that streams prose from a different
  route and never calls the builder. So routing work on that host could not make
  the headline observable, and the two panels must not be treated as one surface.

No production code changed. This is a test-only change.

## Layer Impact

**Release lane: `global-control-lane`.** The suite runs on every pull request and
every push to `main` through a required check, so it gates the shared control
plane for all clients. It is not feature-gated, not client-scoped and not an
internal-admin or demo path. No client receives a behaviour change — the lane
describes what the change gates, not what it ships, because the change ships no
runtime behaviour at all.

- **Layer 4 — products (read-only).** Behaviour of the reasoning Explain surface
  is now asserted at the component boundary. Nothing about how it renders or
  what it fetches was altered; the suite executes the existing components as
  they stand.
- Layers 1–3 untouched. No intake, adapter, canonical-model, schema, migration
  or projection change. No tenant data is read: the suite stubs both `fetch`
  calls with in-file fixtures.

## Client Applicability

- All clients: no behaviour change — test-only.
- Specific clients: none.
- Internal only: yes, in effect. The suite runs in CI and changes no served
  surface.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- **Added** `src/lib/reasoning/__tests__/explain-drawer-host-reachability.test.tsx`
  — 9 behavioural cases. Placed beside `gate-summary-line.test.ts` on purpose:
  that directory is swept by `npx jest src/lib/reasoning` in
  `.github/workflows/reasoning-layer-guard.yml`, whose job
  `Typecheck + reasoning-layer tests` is one of the 19 required status checks on
  `main`. A suite written against these components anywhere under
  `src/components/_shared/` would be executed by no workflow, which is the
  defect class this backlog exists against.
- **Added** this release record.
- No source file was modified. `git status` on the branch lists exactly these
  two additions.

## QA / Validation

Baseline and after, measured over the same scope — the two commands the required
job runs:

| Scope | Before | After |
|---|---|---|
| `npx jest src/lib/reasoning` | 60 suites / 786 tests, **0 failing** | 61 suites / 795 tests, **0 failing** |
| `npx jest src/app/api/reasoning` | 2 suites / 8 tests, 0 failing | 2 suites / 8 tests, 0 failing |

The baseline was taken with the new file moved out of the tree, not inferred.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
**exit 0**, 0 diagnostics. Judged on the exit code: a bare `npx tsc --noEmit`
exits 134 on the operator host (V8 OOM) and emits no diagnostics, so a
`grep "error TS"` over its output reports a false clean. The first run of this
check exited 2 on one real error in the new file (an unsound `as` cast over the
payload fixture); the cast was removed and the fixture typed properly rather
than widened through `unknown`.

`npx eslint src/lib/reasoning/__tests__/explain-drawer-host-reachability.test.tsx`
— clean, no output.

**The suite can fail.** Eight mutations, each applied by a helper that refuses
unless its pattern occurs exactly once in the target file — a mutation that
silently edits nothing reads as a survivor and reports a coverage gap that is not
there. Every mutation was reverted from a backup and the tree re-verified clean
(`git status --porcelain` lists only the two added files; no `.bak` remains).

| # | Mutation | Result |
|---|---|---|
| 1 | `ExplainQuotePill` stops mounting `ExplainQuoteDrawer` | **6 of 9 failed** |
| 2 | Drawer renders the pre-fix line off the raw partition (`met + waived` of `total`) | **6 of 9 failed** |
| 3 | `gateCriterionNoun` always returns the plural | **1 of 9 failed** |
| 4 | `buildGateSummaryLine` folds `waived` back into `met` | **4 of 9 failed** |
| 5 | A host declares the wrong `surface` on the pill | **1 of 9 failed** |
| 6 | The per-stage drawer grows a gate headline | **1 of 9 failed** |
| 7 | The pill opens the drawer without a click | **1 of 9 failed** |
| 8 | The component that does not host the pill starts hosting it | **1 of 9 failed** |

Mutations 3–8 each kill exactly the case written for them, so no case is passing
on a neighbour's assertion.

**Census.** `npm run audit:test-ci-coverage:check` exits 0 and reports
`coverage shape matches the committed census` both with and without this file.
Measured in isolation by moving the file out and back, the file moves
`testFiles` 2713 → 2714 **and** `coveredTestFiles` 2549 → 2550 — so
`uncoveredTestFiles` is unchanged, which is the proof that the suite is wired to
a CI job rather than merely present. The committed census is stale by +3 counts;
+2 of those predate this branch and belong to other work. The census JSON is not
updated here because it is held by another agent's live claim, and the counts are
a report, not a gate.

Two jsdom-environment facts are documented in the suite because each one, left
implicit, produces a failure that reads as a product defect:

- jsdom defines no `TextDecoder`, which all three hosts use to decode their
  stream. Without it the decode throws, each host's own `.catch` turns that into
  its error state, and every case fails as "no Explain pill" — which reads as the
  pill being absent from the host. The suite supplies the global from `node:util`.
- `CompareWithDropdown` returns `null` when its catalogue minus the current
  instance is empty, and a null render satisfies both "does not host the pill"
  assertions for the wrong reason. That case asserts the component rendered, and
  rendered an option, before asserting the absence.

## Rollout Plan

Merge to `main` via squash. No runtime rollout: no served route, bundle, image,
flag, env var, migration or worker job is touched. The repo-owned ACA deploy
workflow will build and deploy the merge commit as it does every merge; nothing
in this change requires that deploy to be verified for the change itself to be
in effect, because the change is only in CI.

## Deployment Authority

Not required — this release cannot affect Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker jobs,
traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: **no**, for this change. It is required for the
  routing half of U-571, which this release does not attempt — see Known Gaps.

## Rollback Plan

Revert the merge commit. The change is two added files and no source edit, so a
revert removes 9 test cases and restores nothing else. No migration, no data, no
runtime state. There is no partial-rollback hazard.

## Audit Evidence

- The suite itself: `src/lib/reasoning/__tests__/explain-drawer-host-reachability.test.tsx`.
  Each case states what it is pinning and why in the case name.
- Required CI check `Typecheck + reasoning-layer tests` on the pull request —
  the run that executes both the typecheck and the suite.
- The mutation table above. It is reproducible: apply the listed mutation and
  rerun `npx jest --runTestsByPath <the suite>`.
- `src/lib/qa/active-route-ownership-map.ts`, which independently records one of
  the hosts as imported by no route — the repository's own prior measurement,
  not a finding of this change.

## Known Gaps

- **The routing question is open and is a product decision, deliberately not
  taken here.** Whether the reasoning Explain surface is part of the product —
  and therefore whether these components should be given a reachable host or
  retired together — is the other half of U-571 and the whole of U-570. Nothing
  was mounted to make anything reachable; doing so to clear a gate is the defect
  the orphan-module audit exists against. Recommendation, for the record: answer
  it once for the family rather than per merge, and treat the per-stage drawer as
  a separate surface, because the measurement above shows it does not share the
  headline and so cannot be fixed by the same routing change.
- The three components that mount the pill are still reachable by no URL. This
  release makes their behaviour verdictable; it does not make them reachable, and
  does not claim to.
- The suite exercises the components, not the `/api/reasoning/explain` route that
  feeds them — both fetches are stubbed. The route has its own coverage under
  `src/app/api/reasoning`, run by the same required job.
- `docs/architecture/test-ci-coverage-census.json` stays stale by +3 counts. Not
  regenerated here: it is held by another agent's live claim, and the shape half
  — the half that gates — is green.
