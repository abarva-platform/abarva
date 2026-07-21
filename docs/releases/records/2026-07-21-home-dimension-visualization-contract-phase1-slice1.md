# 2026-07-21-home-dimension-visualization-contract-phase1-slice1 — Home Dimension Visualization Contract (Phase 1, complete)

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

- All clients: the contract module and renderer ship for every tenant using the Home Knowledge design-contract surface. Fixed in this slice: the surface's own route was still hard-gated to `homeTenantKey === "meridian-health"` (a bug, not by design) — now any tenant with an approved pack reaches it. In practice Meridian remains the only tenant with an approved pack today, so this fix has no visible effect yet, but it removes a latent blocker for the next tenant pack that gets approved.
- Specific clients: only dimensions whose loaded rows actually carry the contract's required fields render the new visual; for Meridian today that is confirmed to be Applications & Systems (`criticality` x `lifecycle_status`, 20 of 241 rows evidenced for both fields — the rest render nothing new, unchanged fallback).
- Feature flag: none — gated purely by data shape via `dimensionRowsSupportPrimaryVisual`.

## Changes Included

- `src/lib/home/home-dimension-visualization-contract.ts` (new): `HomeDimensionVisualizationContract` type + Zod schema, a registry entry for all 19 canonical dimension keys, `resolveHomeDimensionVisualContract()`, `dimensionRowsSupportPrimaryVisual()`.
- `src/lib/home/__tests__/home-dimension-visualization-contract.test.ts` (new): 10 tests covering schema validation, full dimension coverage, the qualitative-precision guard on `budget`, key resolution/fallback, and the data-support gate.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`: adds `CategoricalCrossTabHeatmap` (the shared governed cross-tab renderer — excludes "Needs evidence" placeholder rows from the grid and reports them as a pending count instead of silently dropping them) and `DimensionPrimaryVisual` (looks up the contract for the active dimension, renders the cross-tab only when both required fields are structurally present, otherwise renders nothing). Wired into the Summary tab directly below the existing Dashboard metric tiles.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx` (follow-up commit): adds multi-facet Data-tab filters — every `crossLensFilters` entry from the contract renders as its own dropdown, deduplicated against the dataset's own `.facet` field and the auto-detected confidence/status column so no dimension shows two identical dropdowns. A dropdown only renders once its field has at least one real (non-"Needs evidence") value in the loaded rows.
- `src/lib/home/derive-relationship-edges.ts` (new, follow-up commit): parses already-loaded, evidenced, semicolon-delimited cross-reference fields (`apps`/`infra.integrations`, `vendors.linked_systems`, `data.systems`) into real `(from, relationship, to)` edges. Live-verified on production that the Home ask API's own answer text references "the relationship graph" while returning an empty `graphs` array — this closes that gap using data that was already loaded but never parsed into edges, not a new data source.
- `src/lib/home/__tests__/derive-relationship-edges.test.ts` (new): 6 tests, including one asserting 20+ real edges are derived from the actual Meridian dataset file on disk.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx` (follow-up commit): adds `RelationshipTopologyGraph` — a custom SVG bipartite graph (source entities left, connected systems right, one curved line per real derived edge, capped at the top 10 nodes per side by connection count with an honest "showing top N of M" note). Wired into the Relationships dimension's Relationships tab only, alongside the existing chain-of-dimensions diagram. No new dependency added — no react-flow/xyflow package exists in this repo, and this shape doesn't need one.
- `src/lib/home/derive-relationship-edges.ts` (follow-up commit): adds `readDerivedRelationshipGraphEdges()`. A separate, dedicated relationship-derivation job already ran for Meridian and produced `datasets/tenant-inputs/meridian-health/derived/relationship-graph.json` — 1,668 nodes, 2,670 edges (28 self-loops filtered), across 14 node types and 17 relationship types, generated 2026-07-17. It was never wired into the cockpit. Now preferred over the field-parsing fallback when present, with tenant-key fencing against the file's own `tenant_key` field. Confirmed via `find` that no other tenant (SkyHarbor, First Capital, Lakeshore) has this file yet.
- `src/app/(maestro)/home/page.tsx` (follow-up commit, bug fix): this route was still hard-gated to `homeTenantKey === "meridian-health"` despite this same release's earlier "Changes Included" entry claiming that gate had been generalized. Verified against the actual merged PR #5190 diff that it was never touched. Fixed to gate purely on `designContract.pack` presence.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx` (follow-up commit): adds `SixQuestionsLanding` — "do not make the page a list of 19 tabs with one chart each; open with six visual questions." Six additive cards (how is the enterprise organized / where does value flow / what systems and data run it / where is transformation occurring / where are risk and evidence weak / where are the largest opportunities), each stat computed from already-loaded `dimension.count`/`status` fields — no new data. A card renders only if at least one of its mapped dimensions is loaded; clicking opens that dimension. Placed between the AI Success Thesis and the existing Enterprise-at-a-glance block, replacing nothing.
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx` (follow-up commit): adds `ContextHorizon` — the "tease a future" concept, built honestly: dashed "ghost" cards sourced entirely from the pack's own approved `NEXT_EVIDENCE` slot (already used elsewhere, in the Evidence Gaps tab), not invented adjacent-domain names. Renders nothing if the pack has no `NEXT_EVIDENCE` entries. Each card opens the Evidence Gaps tab.

## QA / Validation

Run in an isolated `git worktree` off fresh `origin/main` (post `#5190` merge), re-verified after every commit (9 commits total):

- `npx eslint` on every touched/new file — clean throughout.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false` (full repo) — 0 errors, checked after every commit.
- `npx jest src/lib/home src/components/home` — final state: 199 passed / 54 failed / 253 total, verified via exact failing-test-name diff against a clean `origin/main` baseline run in a second isolated worktree at every checkpoint: **0 new failures** the entire way. All 54 are pre-existing (unrelated `sourceMode`/`moduleContextSummary` assertions in `home-summary-snapshot.test.ts` and similar files this change does not touch).
- 20 new unit tests (10 contract, 10 edge derivation/loader), including assertions against the real Meridian dataset files on disk.
- The two pre-existing boundary-contract test files under `src/app/(maestro)/home/__tests__/` — 10/10 pass after the gate fix.
- Manual data verification against real Meridian data: Applications & Systems cross-tab (20 of 241 rows evidenced across 10 category pairs), all 7 cross-tab-wired dimensions spot-checked (15–257 evidenced rows each), relationship edges (2,642 real cross-node edges from the derived graph), six-question landing cards (507–749 records each, all distinct and non-trivial).
- Live-verified the production gap the relationship graph closes: called `/api/home/know/ask` directly against Meridian's live Home ask endpoint and confirmed `graphs: []` while the answer prose references "the relationship graph."
- Not yet done: a live signed-in browser screenshot of any of the rendered visuals. This surface requires a full authenticated Clerk session, which wasn't available in this session; static verification (typecheck, lint, unit tests, and hand-verified real-data computations) is the evidence for this release. Live browser proof should run before/at merge, matching this release's own "Live signed-in proof required: Yes" — especially to confirm the Meridian-only gate fix has no unintended visual side effect.

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

- All Phase 1 scope items are now built: the visualization contract, 7 dimensions wired to the governed cross-tab visual, multi-facet filters, the relationship graph (both field-parsed and derived-graph-preferred), the six-question landing strip, and the Context Horizon strip.
- The relationship graph prefers a pre-existing, dedicated `derived/relationship-graph.json` (real, evidence-cited, 2,670 edges) when present, falling back to field-parsing (apps/infra.integrations, vendors.linked_systems, data.systems) when it's not. The derived graph only exists for Meridian today — SkyHarbor, First Capital, and Lakeshore fall back to the field-parsed edges until their own graph derivation job runs. Running that job for the other three tenants (and re-checking whether the same 5-shared-schema-template content-generation issue affects their packs at all — none of them currently have an approved Home design-contract pack to check) is a real follow-on, raised with Anand as a candidate for a separate content-generation/data-reload effort, not folded into this PR. Wiring the V6 graph substrate in shadow mode per the standing architecture rule remains a further, longer-term option on top of this.
- The cross-tab heatmap covers the `apps`/`infra` (criticality x lifecycle_status), `risks`/`rel`/`metrics` (risk_or_gap boundary x confidence), and `budget`/`ai`/`programs`/`data` (value_boundary/data_domain x confidence) schema families via the same shared component. All 7 wired families (apps, infra, ai, budget, risks, rel, metrics) were spot-checked against real Meridian row counts before the multi-facet filter follow-up commit — every family produces a non-trivial, real cross-tab grid (15 to 257 evidenced rows, several distinct category pairs each).
- No live signed-in browser screenshot yet (see QA section).
