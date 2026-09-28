# 2026-09-28-c416-tower-shell-brief-controls — the live Tower shell, measured against the pressure brief's controls

## Release ID

`2026-09-28-c416-tower-shell-brief-controls`

## Status

`candidate`

## Plain-English Summary

The AI-surface control catalog lists five reader-facing safeguards for the Tower
"program pressure" executive brief: an AI-assisted label, an evidence basis, a
confidence label, a statement that a person must approve, and a missing-data
caveat. Those five live in a component that no page mounts any more; the Tower
page renders a newer shell. Until now the catalog's only statement about them was
"nothing mounts the component", which was true and said nothing about what a
reader of the Tower page actually sees.

This change answers that by running it. A new test suite mounts the shell the
Tower page renders, walks all 14 of its tabs and sub-tabs, opens the aVa dock and
receives an aVa answer that carries a citation, a confidence grade, a server gap
and a caveat — and records, one case per safeguard, what reaches the screen.
Today: none of the five, as statements. Only a partial clause ("without approving
anything on its own") reaches the opened dock.

The suite is green about that real state rather than red about a decision nobody
has made. Which surface should own the brief is an open owner decision and is not
taken here. Nothing in the product changed.

## Layer Impact

Release lane: **`global-control-lane`** — shared CI and catalog bookkeeping, not
gated to any client or flag.

- **Products** — Tower. Test and catalog only; no product file changed.
- **Canonical model / Client intake / Source adapters** — not touched.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — CI measurement and catalog text.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.brief-controls.test.tsx`
  — new. Six cases: one that the search is non-vacuous (16 states, 14 distinct
  views, AI output on screen), then one per control asserting its measured state,
  each with a precondition on the answer packet the shell builds.
- `.github/workflows/ai-surface-control-catalog.yml` — runs the suite by exact
  path in the required `AI surface control catalog` context.
- `docs/security/ai-surface-control-catalog.json` — the five `behavioralTest.reason`
  strings of `tower-atlas-program-pressure-brief` now cite the measurement. Status
  stays `"none"` on all five, `routeReachable` stays `false`, and `knownSuites` is
  unchanged: the new suite measures the shell, not the unmounted component, and
  claims no coverage credit.
- `docs/security/control-measurements/c416-tower-shell-brief-controls.md` — new.
  The 16 states searched, the per-control results, and the mutation evidence.
- `src/__tests__/behaviors/catalog-claim-binding.test.ts` — one case proved the
  gate quotes a control's own reason by pinning a phrase of the old prose. It now
  asserts the whole live reason is quoted. Stale, not weakened: see below.

## QA / Validation

- **Same scope, clean baseline from a separate worktree at the base
  `a8ef8aed4b`:** the six catalog-reading behavior suites plus the existing shell
  suite, 7 suites / 113 tests / 0 failing before; the same seven plus the new
  suite, 8 / 119 / 0 after.
- **Mutation proof — every case fires alone or with exactly the cases it should,
  and each mutation was confirmed by `git diff --numstat` to change the file first:**
  - M1, the shell's chat `variant="focused"` changed to `"standard"`: 3 failed —
    `ai-label`, `confidence`, `human-approval-gate`. The shared dock renders all
    three when its review chrome is on; the shell switches it off.
  - M2, the opener's "without approving anything on its own" clause removed:
    1 failed — `human-approval-gate`.
  - I1–I4, the four absence assertions of `citation` and `risk-caveat` inverted
    one at a time (nothing in the source turns those two on, so there is no
    positive to remove): each failed its own case only.
  - P1, the response's trace key removed: 2 failed — `citation`, `confidence`.
    P2, the server gaps removed: 1 failed — `risk-caveat`. The preconditions are
    load-bearing.
- **The updated catalog-claim-binding case** fails when the audit script stops
  quoting the reason (the quote replaced with a placeholder, 1/1 on the script),
  and passes on the real script — 73 of 73.
- `npm run audit:ai-surface-controls` exit 0; `npm run audit:ai-surface-control-cases`
  passed. ESLint clean on both test files. `tsc --noEmit` judged on its exit code.
- **Coverage floor:** not charged. The new suite lives outside
  `src/__tests__/behaviors`, which is the only directory the `Behavior coverage
  floor` measures.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as for
any merge; the runtime image is unaffected in behaviour because no product file
changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none added.
- Approved image digest: whatever the merge deploy produces; no runtime change.
- ACA runtime invariant: verified after merge as for any merge.
- Worker image invariant: as above.
- Feature/env flag update path: none.
- Live signed-in proof required: no — no product surface changed.

## Rollback Plan

Revert the squash commit. The catalog reasons return to their earlier prose and
the CI step disappears; no data or runtime state is involved.

## Audit Evidence

- The pull request and its `AI surface control catalog` check run.
- `docs/security/control-measurements/c416-tower-shell-brief-controls.md`.

## Known Gaps

- **The owner decision is not taken.** Whether the brief's accountability block is
  mounted in the Tower shell, or the five controls move to the shell and the
  catalog entry retires, remains open. The measurement makes one input concrete:
  three of the five exist in the shared dock and are switched off by the shell's
  `variant` prop; the other two would need the shell to pass the answer packet's
  citations and caveats through to the dock, in either variant.
- **jsdom against the design fixture, not the deployed route.** The suite measures
  the shell's rendering logic over fixture data. It does not replace a signed-in
  look at the live page, and none is claimed.
- **One answer shape.** The answered turn uses a single rich response. A streamed
  response and a failed-validation response were not separately measured.
