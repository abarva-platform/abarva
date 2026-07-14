# 2026-07-14-nexus-brand-navigation — AbarVa NEXUS Global Navigation

## Release ID

`2026-07-14-nexus-brand-navigation`

## Status

`candidate`

## Plain-English Summary

This release updates the authenticated product navigation so the global brand
reads as AbarVa NEXUS, with NEXUS treated as the platform name. The top
navigation now uses a single canonical component, removes tenant/client/demo
names from the global brand area, changes the Home label to Knowledge while
keeping the `/home` route, and moves Learn into the primary product navigation.

## Layer Impact

- Product shell: replaces the mounted authenticated top bar with the canonical
  `NexusTopNav` component.
- Brand assets: adds the approved AbarVa NEXUS navigation SVG lockups under
  `public/brand/nexus/`.
- QA/guardrails: adds a NEXUS navigation contract audit and focused React tests.
- Data/runtime: no data-plane, tenant data, candidate, promotion, or module
  runtime behavior changes.

## Client Applicability

- All clients: Yes, authenticated product shell only.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No. Public marketing navigation is intentionally separate.
- Feature flag: None.

## Changes Included

- Adds `src/components/navigation/NexusTopNav.tsx`.
- Adds `src/components/navigation/NexusTopNav.module.css`.
- Updates `AppShell` and `/home/learn` to import `NexusTopNav` directly.
- Converts `AppTopBar` into a compatibility shim over `NexusTopNav`.
- Updates `topbar-nav-items` to use Knowledge and include Learn.
- Adds `scripts/audit/nexus-navigation-contract.mjs`.
- Adds focused NEXUS navigation tests.
- Adds architecture note `docs/architecture/nexus-navigation.md`.

## QA / Validation

- Pass: `npm run audit:nexus-navigation`.
- Pass: `npx jest src/components/navigation/__tests__/NexusTopNav.test.tsx src/components/shell/__tests__/topbar-nav-home-admin.test.ts --runInBand` (15/15; repo emits pre-existing duplicate manual mock warnings).
- Pass: targeted ESLint for NEXUS nav, route shell imports, registry, and audit script.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit --pretty false`.
- Pass: `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npm run build` (Turbopack emitted pre-existing broad file-tracing warnings in unrelated enterprise-data/admin modules, then completed successfully).
- Pass: `npm run release:check`.
- Pass: `git diff --check`.

## Rollout Plan

Open a PR from `codex/nexus-brand-navigation`. After merge to `main`, the
repo-owned Azure Container Apps main deploy workflow builds the exact SHA image
and updates `app.abarva.ai`. Browser proof is required before calling this
live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None from this branch.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR or deploy the prior healthy ACA revision through the approved
runtime lane. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI / validation output: Pending.
- ACA revision and image digest: Pending.
- Browser screenshots: Pending after deploy.

## Known Gaps

Live signed-in browser proof cannot be captured until the PR is merged and the
ACA deploy workflow completes.
