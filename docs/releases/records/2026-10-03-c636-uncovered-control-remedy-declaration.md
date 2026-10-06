# 2026-10-03-c636-uncovered-control-remedy-declaration — Uncovered AI-surface controls declare which remedy would fix them

## Release ID

`2026-10-03-c636-uncovered-control-remedy-declaration`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog is the audit truth source for the controls that must appear on any
screen where the product shows AI output — the draft label, the citation, the confidence note, the
human-approval statement, the risk caveat. A required CI gate reads it and refuses a control that
declares no behavioral test, and the gate's report names every control that has none, so the next
one to work on can be read off the report instead of searched for in the test tree.

The report could not say which of those names a behavioral test would actually fix, and the
difference matters because the two cases have opposite fixes. A control can be missing a test
because it is on the screen and nothing proves it — then a test is the fix. Or it can be missing a
test because the control is not on the screen at all — then a test would only record its absence,
and the fix is to put the control on the screen, which is a product decision and not a test to
write. Both states were distinguishable only in a paragraph of prose, and a report cannot act on
prose, so all ten uncovered controls were offered on the same terms.

That is not a harmless gap. Working from that list meant writing a test for a control no reader can
see: the coverage percentage goes up and nothing about the product changes, which is the exact
failure this catalog was built to prevent.

So each uncovered control now declares its remedy as a checked field, and the report states the
count a test would actually fix separately from the count that has no test. Measured against the
catalog today, ten controls have no test and **none** of them is one a test would fix — five are on
a component no screen reaches, and five are on a screen that is reached but do not render. The
report now says so in words. The honest consequence is that the recurring "write a test for the next
uncovered control" task has nothing to draw, and it should stop drawing rather than manufacture work.

## Layer Impact

Release lane: `internal-admin` — AbarVa-only CI and governance tooling. No client-facing surface and
no data-plane object is touched, so neither `global-control-lane` nor `client-data-lane` applies, and
the stricter gate is on by default rather than flagged, so it is not `experimental`.

- **Layer 4 (Products)** — no product behavior changes. No route, component, API response, tenant
  data, or rendered surface is touched. The change is to a governance catalog, the CI gate that
  reads it, and that gate's report.
- Layers 1–3 (client intake, source adapters, canonical model) — untouched.

## Client Applicability

- All clients: no change. Nothing client-visible is modified.
- Specific clients: none.
- Internal only: yes — a CI gate, its report, and a governance catalog.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `docs/security/ai-surface-control-catalog.json` — each of the 10 required-control entries carrying
  `behavioralTest.status: "none"` now also carries `remedy`. All 10 are `render-the-control`, which
  is what the existing `reason` prose on each already recorded by measurement under item C-416. The
  schema `description` documents the field and the drawable rule.
- `scripts/audit/ai-surface-control-catalog.mjs` —
  - `validateBehavioralTest` refuses an uncovered control whose `remedy` is absent or is not one of
    `render-the-control` / `write-a-test`;
  - it refuses `remedy: "write-a-test"` on a surface no route reaches, which is a contradiction: a
    test there mounts the component itself and proves the component, not the product;
  - `renderUncoveredRoster` appends each row's declared remedy and states the drawable count, with
    the zero case stated in words rather than left as an absent section.
- `src/__tests__/behaviors/catalog-declared-coverage.test.ts` — new, 7 cases. Swept by
  `npm run coverage:behavior-gate` inside the required `Behavior coverage floor` job; deliberately
  **not** named in any workflow step, because naming a suite a required job already sweeps is
  refused by `scripts/quality/check-named-suite-requiredness.mjs`.
- `src/__tests__/behaviors/unlinked-control-roster.test.ts` and
  `src/__tests__/behaviors/c574-tower-dock-catalog-entry.test.ts` — three expectations pinned the
  previous roster line format. Updated in place with the reason in the diff, not deleted, and not
  loosened: the C-574 case now asserts `remedy: render-the-control` for all five dock controls, so
  re-labelling them as needing a test turns it red. The roster sort case is scoped to roster lines
  so it fails on ordering only.

## QA / Validation

**New suite, red first.** `src/__tests__/behaviors/catalog-declared-coverage.test.ts`:
**7 failed / 7 total before the fix → 7 passed / 7 total after.**

**Clean baseline over the same scope, measured on the merge base `3dc2d655b1` before any edit.**
The eight pre-existing catalog-driven behavior suites: **8 suites / 112 tests, 112 passing.** After
the change, the same eight plus the new one: **9 suites / 119 tests, 119 passing.** No pre-existing
test was removed or weakened.

**Six mutations, each a verified single substitution, each caught, and each isolated to the cases
that name it.**

| Mutation | Result |
|---|---|
| Delete both remedy guards | 3 failed / 4 passed |
| Remove only the unreachable-surface contradiction branch | 1 failed — `refuses write-a-test on a surface no route reaches` |
| Remove only the remedy-value check | 2 failed — the no-remedy and unknown-remedy cases |
| Make the drawable filter ignore `remedy` | 2 failed — both drawable-count cases |
| Delete the zero-stated-in-words line | 1 failed — the nothing-is-drawable case |
| Delete `remedy` from one live catalog entry | 4 failed / 3 passed |

Each mutation was confirmed to have changed the source before the suite was run, because a no-op
mutation reads exactly like a caught one.

**Gates.** `node scripts/audit/ai-surface-control-catalog.mjs` exit 0.
`npm run audit:ai-surface-control-cases` passed — 40 credited controls, 129 cases across 24 suites,
jest ran and passed every one. `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit 0, no diagnostics (judged on the exit code: a bare `tsc --noEmit` exits 134 on
the operator host, which emits nothing and reads as clean). `npx eslint` on all four changed files
exit 0.

**The gate's report, after the change:**

```
Controls with no behavioral test: 10 of 50. ...
  - tower-atlas-program-pressure-brief:ai-label — ... — not on any screen — remedy: render-the-control
  ... (8 more) ...
  - tower-command-center-ava-dock:risk-caveat — ... — remedy: render-the-control
Drawable by a behavioral test: 0 of 10 uncovered. A control is drawable only where the control is
on the surface and nothing proves it.
  Nothing is drawable: a behavioral test is not the remedy for any of them, so the draw stops here
  rather than writing a test for a control no reader can see.
```

## Rollout Plan

Merge to `main`. No runtime rollout: no image rebuild is required for this change to take effect,
because nothing it touches is served. The CI gate takes effect on the next pull request.

## Deployment Authority

Not required. This release changes no Azure Container Apps resource, deploy workflow, runtime image,
feature flag, environment variable, worker job, traffic weight, DNS record, or environment
promotion. The repo-owned `aca-main-deploy` workflow will build and deploy the merge commit as it
does every merge to `main`; that deploy carries no behavior from this change.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no runtime change.
- ACA runtime invariant: unaffected by this change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing in this change is reachable by a signed-in user.

## Rollback Plan

Revert the pull request. No migration, no data change, no deployed artifact to unwind. Reverting
restores the previous roster format and removes the `remedy` requirement; the ten catalog entries
would keep a field the gate no longer reads, which is inert.

## Audit Evidence

- This pull request and its diff.
- The required `AI surface control catalog` status check on the `main` ruleset, which runs
  `scripts/audit/ai-surface-control-catalog.mjs` and the 50-entry validation.
- The required `Behavior coverage floor` status check, which sweeps
  `src/__tests__/behaviors/` and therefore runs the new suite.
- `npx jest --runTestsByPath src/__tests__/behaviors/catalog-declared-coverage.test.ts` — 7 passed.
- The gate report quoted above, reproducible with `npm run audit:ai-surface-controls`.

## Known Gaps

- **The ten uncovered controls are still uncovered.** This change states the correct remedy for each;
  it does not apply it. Rendering them is an owner decision tracked elsewhere, and this release makes
  no recommendation about it.
- **`remedy` is declared, not derived for the present-but-untested case.** The gate derives one half
  by execution: `write-a-test` on a surface no route reaches is refused against a route-graph walk.
  The other half — whether a control is genuinely absent from a *reachable* surface — is asserted by
  a human measurement recorded in the entry's `reason`, not recomputed by the gate on every run. All
  five reachable `render-the-control` rows cite that measurement. A gate that re-derived it would be
  stronger and is not in this change.
- **The drawable count is zero today, and that is a measurement rather than a property.** The suite
  pins it both ways: one case asserts the live count is zero, another asserts a fixture with one
  drawable control reports one, so the zero cannot quietly become a constant.
