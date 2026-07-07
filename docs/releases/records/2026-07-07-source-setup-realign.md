# 2026-07-07-source-setup-realign — Redesigned Source Setup tab ("Source configuration")

## Release ID

`2026-07-07-source-setup-realign`

## Status

`candidate`

## Plain-English Summary

Realigns the Source Setup tab (`/source/setup`) to the standalone "Source
configuration" design, matching the redesigned Source stage/portfolio canvas
(analytics tokens: Fraunces serif headings, paper ground, hairlines, mint status
chips). The new surface is a compact header (eyebrow · serif H1 "Source
configuration" · sub-line) followed by three list-row cards — Evidence sources,
Approvers, Archetype defaults — each with an icon, title, sub-line, right-aligned
status chip, and a Manage button.

The redesign ships DARK behind the existing `source_analytics` feature flag,
which is OFF for every tenant except the Lakeshore value-analytics pilot. When
the flag is ON the route renders the new three-card configuration surface; when
OFF the current artifact-operations Setup page is byte-for-byte untouched.

The redesign is a UI realign only — deterministic and honest. This repo has no
tenant-wide connected-evidence-source registry and no tenant default-archetype
config store, so all three cards render honest placeholder chips
("NOT CONFIGURED") by default. The component accepts real, sourced values
(`evidenceSources`, `approversConfigured`, `archetypeDefault`) and will render
them when a backing config source is wired; it never fabricates a "N of M
connected" count with no backing. Manage buttons are non-functional placeholders
(surface realign only).

## Layer Impact

- `experimental` (feature-flagged, non-default capability): the `/source/setup`
  route now branches on the `source_analytics` flag to render either the new
  three-card configuration component or the existing artifact-operations page.
  The branch is inert for all tenants where the flag is OFF, so shared behavior
  is unchanged unless the tenant is enrolled. No data-plane, schema, or migration
  changes.

## Client Applicability

State exactly who receives the change.

- All clients: No change (flag OFF → existing artifact-operations Setup renders unchanged).
- Specific clients: Lakeshore (the only `source_analytics`-enrolled tenant) sees
  the redesigned "Source configuration" three-card Setup.
- Internal only: N/A.
- Public/demo only: N/A.
- Feature flag: `source_analytics` (policy `tenant`, `includeTenants: ["lakeshore"]`;
  env allowlist `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`).

## Changes Included

- `src/app/(maestro)/source/setup/page.tsx` — the default export is now an async
  server component that resolves the active client, checks `source_analytics`,
  and renders `SourceSetupConfigPage` when ON or the existing (renamed but
  unchanged) `SourceSetupArtifactOperationsPage` when OFF.
- `src/components/source/setup/SourceSetupConfigPage.tsx` (new) — the redesigned
  Setup: header + three list-row config cards, styled with the analytics-canvas
  tokens. Encodes the honesty contract (placeholder chips unless a real value is
  passed in).
- `src/components/source/setup/__tests__/SourceSetupConfigPage.test.tsx` (new) —
  3 render tests: the three cards render with their titles/sub-lines and a Manage
  button; honest "NOT CONFIGURED" placeholders (and no fabricated "N of M
  connected") when no state is sourced; real chip state ("2 CONNECTED",
  "CONFIGURED", "AMS") when sourced values are provided.

No migrations, no data-plane changes, no schema changes.

## QA / Validation

- Unit/render tests: `npx jest SourceSetupConfigPage.test.tsx` — 3/3 pass.
  Covers the three-card structure + sub-lines + Manage buttons, honest
  placeholder chips with no fabricated count, and real chip state when sourced.
- Lint: `npx eslint` on the 3 changed/added files — clean (exit 0).
- Types: `npx tsc --noEmit` — none of the changed/added files report errors
  (repo has ~339 pre-existing unrelated tsc errors + `ignoreBuildErrors`; this
  change introduces none).

## Rollout Plan

Merge to main (squash). No runtime rollout required to change behavior: the code
is inert for all tenants because `source_analytics` is OFF except Lakeshore, and
Lakeshore is already the enrolled analytics pilot. The redesign becomes visible
on the next Azure Container Apps deploy of main via the repo-owned deploy
workflow. No migration to apply. Flip additional tenants only via the flag's
`includeTenants` list or the `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS` env
allowlist.

## Deployment Authority

- Repo-owned deploy workflow: Only the repo-owned ACA main deploy workflow may
  ship this; no traffic-shifting from this PR.
- Shared runtime mutators: None. No worker, job, DNS, env, or traffic changes.
- Approved image digest: N/A — no runtime image invariant changed by this PR.
- ACA runtime invariant: Unchanged; digest-pinned ACA web image policy is untouched.
- Worker image invariant: Unchanged.
- Feature/env flag update path: `source_analytics` via
  `src/lib/features/registry.ts` `includeTenants` or
  `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Live signed-in proof required: Yes — verify `/source/setup` for Lakeshore
  (flag ON) renders the three-card configuration surface, and for a non-enrolled
  tenant (flag OFF) renders the unchanged artifact-operations page, after the
  main ACA deploy.

## Rollback Plan

Revert the squash-merge commit. The change is additive and flag-gated, so
reverting fully restores the current artifact-operations Setup page. No migration
rollback is needed (no schema/data changes). As an interim mitigation, removing
`lakeshore` from the `source_analytics` `includeTenants` list immediately reverts
every tenant to the existing Setup without a code revert.

## Audit Evidence

- PR URL: (added on open).
- CI: `npm run release:check`, eslint, and the Jest render suite runs.
- Test output: `SourceSetupConfigPage.test.tsx` 3/3 pass.
- Live signed-in proof: pending post-deploy `/source/setup` check for Lakeshore
  (flag ON) and a non-enrolled tenant (flag OFF).

## Known Gaps

- Evidence sources, Approvers, and Archetype defaults have no tenant-wide config
  substrate today (no connected-evidence-source registry, no per-tenant
  approver-routing store surfaced here, no tenant default-archetype config — the
  archetype is resolved per-event, not tenant-wide). All three cards render
  honest "NOT CONFIGURED" placeholders and will populate only when those config
  sources are wired. The `SourceSetupConfigPage` component already accepts real
  values (`evidenceSources`, `approversConfigured`, `archetypeDefault`) so wiring
  is a props change, not a redesign.
- Manage buttons are non-functional placeholders; the manage sub-routes are not
  built in this PR.
- Live signed-in proof pending the next main ACA deploy.
