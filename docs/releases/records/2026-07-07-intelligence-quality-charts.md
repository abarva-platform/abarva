# 2026-07-07-intelligence-quality-charts — First Recharts visualizations on the Intelligence Quality lens

## Release ID

`2026-07-07-intelligence-quality-charts`

## Status

`candidate`

## Plain-English Summary

The **first Recharts (v3.8.1) data-visualizations** in the product, added to the Intelligence
Knowledge Quality lens (`/intelligence/quality`), behind a NEW default-off feature flag
`intelligence_quality_charts`.

Two charts render from the SAME deterministic view the page already builds
(`buildIntelligenceQualityLensView()`) — no new data, no refetch, no fabricated series:

- **Domain coverage** — a horizontal bar chart of `patternCount` per domain, each bar colored by
  the domain's coverage strength (strong = the design green, moderate = amber, thin = rust/muted),
  with axis labels, a tooltip, a strength legend, and `tabular-nums`.
- **Contradiction status** — a donut of the contradiction status counts (open / under review /
  resolved → A / resolved → B / accepted-as-tension) with a legend and a total caption.

Honesty is enforced: if `domainCoverage` is empty, an honest empty state renders instead of a
chart; if the contradiction summary total is `0`, a "No contradictions logged yet" empty state
renders instead of an empty/zero donut. The existing `honestDisclaimer` on the page stays visible.

When the flag is OFF (the default for every tenant), the charts component is never mounted and the
Quality lens is byte-identical to today.

## Layer Impact

- `experimental`: the charts render only when `intelligence_quality_charts` is enabled for the
  active tenant (no tenant enrolled — `includeTenants: []`). Everything is inert while the flag is off.
- `global-control-lane`: a new client chart component, a new flag in the registry, and a flag-gated
  render branch in the Quality-lens page are added to the shared app. Inert unless the flag is on.

## Client Applicability

- All clients: no behavior change — the Quality lens is unchanged while the flag is off (default).
- Specific clients: none enrolled yet (`includeTenants: []`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `intelligence_quality_charts` (policy `tenant`, off for all; env allowlist
  `ABARVA_FEATURE_INTELLIGENCE_QUALITY_CHARTS_TENANTS`).

## Changes Included

- `src/components/intelligence/charts/QualityCoverageCharts.tsx` **(new, `'use client'`)** — the first
  Recharts visualizations: a `BarChart` (domain coverage, `Cell`-colored by coverage strength) and a
  `PieChart` donut (contradiction status), both in `ResponsiveContainer`, with tooltips, a legend,
  axis labels, `tabular-nums`, honest empty states, and AbarVa shell-token theming. Charts ONLY the
  real view fields; never fabricates a series or value.
- `src/lib/features/registry.ts` — new `intelligence_quality_charts` flag (`FeatureFlagKey` union
  entry + `FEATURE_FLAGS` definition; policy `tenant`, `includeTenants: []`).
- `src/components/intelligence/IntelligenceQualityLensPage.tsx` — accepts a `showCharts` prop and, when
  true, renders the `QualityCoverageCharts` section from the SAME view (between the summary metrics and
  the domain-coverage table). Default `false` → unchanged.
- `src/app/intelligence/quality/page.tsx` — resolves the flag for the active tenant via
  `isFeatureEnabled` (same call shape as `src/app/(maestro)/source/events/[eventId]/page.tsx`) and
  passes `showCharts`.
- `src/components/intelligence/__tests__/QualityCoverageCharts.test.tsx` **(new, 4 tests)** — jsdom
  render tests (ResponsiveContainer mocked to inject a fixed size so the real chart tree mounts).

## QA / Validation

- `npx jest src/components/intelligence/__tests__/QualityCoverageCharts.test.tsx` → **4 tests pass.**
  Covers: a real `domainCoverage` fixture renders exactly one bar per domain (no fabricated extras);
  an empty `domainCoverage` renders the empty state with zero bars (no chart, no invented series); a
  zero-total contradiction summary renders "No contradictions logged yet" (no donut); a non-zero
  summary renders the donut with the honest total. **pass.**
- `npx tsc --noEmit` (full project, 8 GB heap) → **0 errors in the changed files** (the ~339
  pre-existing project errors are unrelated; `next.config` uses `ignoreBuildErrors`). **pass.**
- `npx eslint` on all changed files → clean. **pass.**
- `node scripts/release-check.mjs --base origin/main --head HEAD` → **pass.**
- recharts 3.8.1 imports cleanly under React 19 in a `'use client'` component (its peer range lists
  `^19.0.0`); no SSR/React-19 incompatibility encountered — the component is client-only and the
  charts are rendered only inside the flag-gated branch, so there is no server-side chart render.

## Rollout Plan

Merge to `main` via PR + squash. The charts render on the Quality lens only when
`intelligence_quality_charts` is on for the tenant (no tenant enrolled). When off, the Quality lens is
unchanged. No migration, no data change. To enable for a pilot tenant, add the tenant to
`includeTenants` (or set `ABARVA_FEATURE_INTELLIGENCE_QUALITY_CHARTS_TENANTS`).

## Deployment Authority

- Repo-owned ACA main deploy per `docs/runbooks/azure-container-apps-deploy.md`.
- Shared runtime mutators: none — the charts are unreachable while the flag is off; the default lens
  render is untouched.
- Approved image digest: assigned by the ACA main deploy workflow at deploy time.
- ACA runtime invariant: template image = 100%-traffic revision image = approved digest (proven post-deploy).
- Worker image invariant: n/a (no worker change).
- Feature/env flag update path: `intelligence_quality_charts` via `includeTenants` in the feature
  registry or `ABARVA_FEATURE_INTELLIGENCE_QUALITY_CHARTS_TENANTS`.
- Live signed-in proof required: yes, before flipping to `released` — a signed-in tenant with the flag
  on must show the two charts rendering from real quality-lens data with the empty states honored.

## Rollback Plan

Revert the PR, or simply leave the flag off (default) — the charts are reachable only through the
flag-gated branch, so an off flag is a complete functional rollback with no code change. No migration
to roll back.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest (4 tests), tsc, eslint.
- The charts consume `IntelligenceQualityLensView` built by `buildIntelligenceQualityLensView()` — the
  same deterministic view the page already renders; no new data path, no model call, no retrieval.

## Known Gaps

- **Live signed-in proof pending** — the charts are unit-tested but not yet proven end-to-end in a
  signed-in browser with the flag on for a tenant.
- No tenant is enrolled yet (`includeTenants: []`); enrollment for a pilot proof is a follow-up.
