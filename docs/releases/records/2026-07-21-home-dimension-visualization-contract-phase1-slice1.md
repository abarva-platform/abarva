# 2026-07-21-home-dimension-visualization-contract-phase1-slice1 — Home Dimension Visualization Contract (Phase 1, Slice 1)

## Release ID

`2026-07-21-home-dimension-visualization-contract-phase1-slice1`

## Status

`candidate`

## Plain-English Summary

Home/Knowledge is meant to become a CXO context cockpit where every dimension answers a real business question with a real visual, not a generic bar chart. This is the first slice of that build: a formal, typed `HomeDimensionVisualizationContract` (what visual family each of the 19 dimensions gets, and whether its data supports numeric precision or must stay categorical), plus the first working differentiated visual — a governed categorical cross-tab heatmap — wired into the Applications & Systems dimension.

Before writing renderer code, this slice audited the actual data every dimension would need to plot. Two findings changed the plan from what was originally sketched:

1. Meridian's own approved content pack ships a `approved-cxo-visual-specs.json` governance file that pre-vetted 12 candidate visuals (including a risk/control heatmap and a use-case value/readiness view) and marked **every one `chart_allowed: false`**, reasoning "no certified numeric baseline — qualitative view prevents false precision/assurance." A literal scored 2x2 or a bubble chart with fabricated coordinates would have violated that governance, not just been a style choice.
2. The 19 dimension datasets are not 19 distinctly-structured shapes — they're stamped from ~5 shared schema templates reused across dimension labels (confirmed by inspecting every dimension's actual columns in `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json`). Notably, the "Relationships" dimension's rows carry the exact same schema as "Risks & Controls" and "Metrics & Outcomes" — no real relationship/topology fields exist yet. IT Budget's `amount_usd`/`realized_value_usd` fields are the literal string `"Needs evidence"` on 221 of 241 rows — there is no real dollar figure to plot as a waterfall.

The contract and renderer built here reflect the real data, not the aspirational per-dimension list: a shared `estate_bubble_matrix` / `risk_control_heatmap` / `value_readiness_matrix` visual family (same underlying component, different field pairs) covers the dimensions whose data genuinely supports a two-field categorical cross-tab; dimensions without real differentiating fields fall back unchanged to the existing plain bar/breakdown view — never a fabricated one.

## Layer Impact

- `global-control-lane`: Adds a new typed contract module (`src/lib/home/home-dimension-visualization-contract.ts`) and a new primary-visual renderer inside `HomeKnowledgeDesignContractSurface.tsx`. Both are additive and gated — no existing rendering path is removed or altered for dimensions without a matching, data-supported contract entry.

## Client Applicability

- All clients: the contract module and renderer ship for every tenant using the Home Knowledge design-contract surface (currently Meridian is the only tenant with an approved pack, per the prior release).
- Specific clients: only dimensions whose loaded rows actually carry the contract's required fields render the new visual; for Meridian today that is confirmed to be Applications & Systems (`criticality` x `lifecycle_status`, 20 of 241 rows evidenced for both fields — the rest render nothing new, unchanged fallback).
- Feature flag: none — gated purely by data shape via `dimensionRowsSupportPrimaryVisual`.

## Changes Included

- `src/lib/home/home-dimension-visualization-contract.ts` (new): `HomeDimensionVisualizationContract` type + Zod schema, a registry entry for all 19 canonical dimension keys, `resolveHomeDimensionVisualContract()`, `dimensionRowsSupportPrimaryVisual()`.
- `src/lib/home/__tests__/home-dimension-visualization-contract.test.ts` (new): 10 tests covering schema validation, full dimension coverage, the qualitative-precision guard on `budget`, key resolution/fallback, and the data-support gate.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: adds `CategoricalCrossTabHeatmap` (the shared governed cross-tab renderer — excludes "Needs evidence" placeholder rows from the grid and reports them as a pending count instead of silently dropping them) and `DimensionPrimaryVisual` (looks up the contract for the active dimension, renders the cross-tab only when both required fields are structurally present, otherwise renders nothing). Wired into the Summary tab directly below the existing Dashboard metric tiles.

## QA / Validation

Run in an isolated `git worktree` off fresh `origin/main` (post `#5190` merge):

- `npx eslint` on all 3 touched/new files — clean.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — 0 errors.
- `npx jest src/lib/home/__tests__/home-dimension-visualization-contract.test.ts` — 10/10 passed.
- `npx jest src/lib/home src/components/home` — 189 passed / 54 failed / 243 total, verified via exact failing-test-name diff against a clean `origin/main` baseline run in a second isolated worktree: **0 new failures**. All 54 are pre-existing (unrelated `sourceMode`/`moduleContextSummary` assertions in `home-summary-snapshot.test.ts` and similar files this change does not touch).
- Manual data verification: cross-tab counts for Applications & Systems (`criticality` x `lifecycle_status`) hand-checked against the real Meridian dataset — 221 of 241 rows are placeholder ("Needs evidence" on both fields, correctly excluded from the grid and surfaced as "pending evidence" instead), 20 rows carry real values across 10 distinct (criticality, lifecycle_status) pairs.
- Not yet done: a live signed-in browser screenshot of the rendered heatmap. This surface requires a full authenticated Clerk session; static verification (typecheck, lint, unit tests, and hand-verified real-data grid counts) is the evidence for this slice. Live browser proof should run before/at merge, matching this release's own "Live signed-in proof required: Yes."

## Rollout Plan

Open PR from this candidate; merge through the normal protected `main` lane; deploy through the repo-owned ACA main deploy workflow. After deploy, live-verify the Applications & Systems dimension for Meridian shows the new cross-tab heatmap and that no other dimension's rendering changed.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this candidate.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None — data-shape gated, not flag gated.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. `DimensionPrimaryVisual` is additive inside the Summary tab; reverting restores the prior breakdown-only rendering exactly. No data or migration rollback needed.

## Audit Evidence

- Local command output above.
- `datasets/context-artifacts/approved/meridian-health/home-knowledge/approved-cxo-visual-specs.json` — the governance file that drove the qualitative-precision decision.
- `datasets/tenant-inputs/meridian-health/approved-content/home/design-contract-pack.json` — the real column schemas the contract's `requiredFields` are keyed against.

## Known Gaps

- This is Slice 1 of the larger Home Dimension Visualization Contract effort. Not yet built: the Enterprise Brief landing's six-visual-question rebuild, the relationship/topology graph (blocked on the "Relationships" dimension currently having no real relationship fields — needs either V6 graph substrate wiring or a data-model fix upstream), the Context Horizon ghost-node concept, and multi-facet filters beyond the existing single dynamic facet + confidence.
- The cross-tab heatmap currently covers the `apps`/`infra` (criticality x lifecycle_status), `risks`/`rel`/`metrics` (risk_or_gap boundary x confidence), and `budget`/`ai`/`programs`/`data` (value_boundary/data_domain x confidence) schema families via the same shared component — only `apps` has been hand-verified against real Meridian row counts in this slice; the other family members are wired through the same contract but not individually spot-checked yet.
- No live signed-in browser screenshot yet (see QA section).
