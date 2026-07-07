# 2026-07-07-fix-quality-lens-blank — Fix blank content zone on /intelligence/quality

## Release ID

`2026-07-07-fix-quality-lens-blank`

## Status

`candidate`

## Plain-English Summary

Signed-in Lakeshore users who opened `https://app.abarva.ai/intelligence/quality`
(the Intelligence Knowledge Quality lens) saw the left "Sentinel Intel" rail but a
**blank white main-content zone** — the metrics, the new Recharts charts, the
coverage table, and the gaps list were all present in the page DOM but painted
~3,200px below the fold, invisible in the viewport.

Root cause: the shared `AppShell` body wrapper lays its children out with
`flexDirection: "column"`. The Quality lens passed **two** children directly to
`AppShell` — the 480px-wide `AgentColumn` companion rail (`flexShrink: 0`,
`height: 100%`) plus the main content (`flex: 1`) — expecting a **side-by-side
(row)** layout. Because the wrapper stacks vertically, the full-height rail
rendered first and the `flex: 1` content column was pushed underneath it,
full-width, at `y ≈ 3111px` — off-screen. (Confirmed via live DOM: rail at
`y:64 h:3047`, content at `y:3111 w:1512`.)

On current `main`, however, the entire legacy `src/app/intelligence/*` leaf-route
tree — including `/intelligence/quality` and its `IntelligenceQualityLensPage`
component — was already **deleted** by the "sunset legacy surfaces" change, and
`/intelligence` was reshaped into the working advisory-board surface (which uses
`AgentDock`, not `AppShell`, and renders correctly). The blank page persisted only
in stale deployments. The sunset added **no redirects**, so every bookmarked
`/intelligence/<leaf>` URL now 404s.

This change reconciles both: it adds config-level redirects from the sunset
Intelligence leaf routes (quality, patterns, signals, solutions, map, topics,
brief, author, synthesize, context-demo, failure-modes) to the canonical
`/intelligence` advisory surface. The blank Quality lens now lands on the working
surface instead of showing a broken (or 404) page.

## Layer Impact

- `global-control-lane`: shared app routing behavior. Adds redirect rules in
  `next.config.ts` for retired Intelligence leaf routes. No data-plane, schema,
  or tenant-scoped change; behavior is identical for every client.

## Client Applicability

- All clients: yes — redirect rules are global.
- Specific clients: the reported symptom was observed by Lakeshore (the tenant
  enrolled in the orphaned `intelligence_quality_charts` flag), but the fix is
  tenant-agnostic.
- Internal only: no
- Public/demo only: no
- Feature flag: none. (The orphaned `intelligence_quality_charts` flag is left
  untouched — it has no runtime consumer on `main` and does not gate this fix.)

## Changes Included

- `next.config.ts` — added 16 redirect entries mapping retired
  `/intelligence/<leaf>` routes → `/intelligence`. `/intelligence/ask` is
  **intentionally excluded** (owned by a parallel Intelligence workstream; a
  redirect would shadow its route). No catch-all `/intelligence/:path*` is added
  for the same reason.
- `src/__tests__/integration/intelligence/intelligence-legacy-route-redirects.test.ts`
  — new jest test (14 cases) asserting each sunset leaf redirects to
  `/intelligence`, the Quality lens specifically redirects (root + `:path*`), and
  that `/intelligence/ask` and a catch-all are NOT present.

## QA / Validation

- **Live DOM diagnosis** (signed-in Lakeshore, `app.abarva.ai/intelligence/quality`):
  confirmed the H1 "Knowledge Layer Health" rendered at `y:3214`, the companion
  rail at `y:64 h:3047`, content column full-width at `y:3111` — i.e. content
  present in DOM but stacked below the fold. Confirmed `/intelligence` (advisory
  board) renders correctly side-by-side with visible Recharts.
- **Local dev-server redirect proof** (`npm run dev`, port 3000, curl no-follow):
  - `/intelligence/quality` → `307 → /intelligence` ✓
  - `/intelligence/patterns` → `307 → /intelligence` ✓
  - `/intelligence/ask` → `307 → /sign-in?redirect=/intelligence/ask` (Clerk auth,
    NOT our redirect — confirms the collision-owned path is not shadowed) ✓
- **Config parse**: `node` loaded `next.config.ts` and `redirects()` returned 37
  entries, 16 new intelligence entries, `/ask` absent.
- **Tests**: `npx jest .../intelligence-legacy-route-redirects.test.ts` → 14
  passed, 14 total.
- **Lint**: `npx eslint next.config.ts <test>` → clean (exit 0).
- **Types**: changed files are `next.config.ts` (plain redirect data, no TS
  surface) and a text-shape test; no new type errors. Full-repo `tsc` not run
  (main carries ~339 pre-existing errors under `ignoreBuildErrors`).

## Rollout Plan

Merge to `main` (squash). The redirects become active on the next
`.github/workflows/aca-main-deploy.yml` ACA image build/deploy — no migration, no
flag, no worker job, no env change. Redirects are evaluated at the edge before
auth, so bookmarked Quality-lens URLs immediately resolve to `/intelligence`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none — this PR does not run any `az` command or shift
  traffic.
- Approved image digest: n/a for this PR (produced by the main deploy workflow).
- ACA runtime invariant: unaffected; no template/image/env change in this PR.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: after deploy, verify `/intelligence/quality`
  307-redirects to `/intelligence` and the advisory surface renders for a
  signed-in Lakeshore user.

## Rollback Plan

Revert the single `next.config.ts` change (remove the added redirect entries) and
redeploy `main`. No data or schema is touched, so rollback is a pure config revert
with no migration constraints.

## Audit Evidence

- PR URL: (added on open)
- Local redirect curl output: `/intelligence/quality → 307 /intelligence`;
  `/intelligence/ask → 307 /sign-in` (control).
- Jest: 14/14 passing in
  `src/__tests__/integration/intelligence/intelligence-legacy-route-redirects.test.ts`.
- Live pre-fix DOM measurements (rail `y:64 h:3047`, content `y:3111`) captured
  from `app.abarva.ai/intelligence/quality`.

## Known Gaps

- The root-cause `AppShell` body-wrapper direction (`flexDirection: "column"`
  stacking a two-child `AgentColumn + content` layout) is **latent** but not
  reached by any live route on `main` — every routed `AppShell` surface passes a
  single full-width child, and all two-child `AgentColumn` lens components
  (Cost/Risk/Adoption/Inventory/Outcome/ProgramScope/Pressure/Activity and the
  deleted Quality lens) are orphaned (no app route). Flipping the shared wrapper
  to `row` would risk the many single-child live surfaces and was deliberately
  NOT done in this scoped fix. If those lens components are ever re-wired to a
  route, the `AppShell` wrapper must be corrected (or the surface must wrap its
  own children in a `flexDirection: "row"` container, as Cost/Risk lens already
  do internally) before shipping.
- Orphaned quality-lens artifacts left by the #4528-vs-sunset race remain on
  `main` as dead code: `src/components/intelligence/charts/QualityCoverageCharts.tsx`
  (+ its test), `src/lib/intelligence/intelligence-quality-lens-view.ts`, and the
  `intelligence_quality_charts` flag in `src/lib/features/registry.ts`. They have
  no runtime consumer and are intentionally left untouched here to avoid
  collateral with parallel workstreams; a follow-up cleanup can remove them.
