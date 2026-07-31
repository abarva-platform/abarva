# 2026-07-30-canonical-nexus-toolbar — Canonical NEXUS Toolbar Restoration

## Release ID

`2026-07-30-canonical-nexus-toolbar`

## Status

`candidate`

## Plain-English Summary

Restores a single global NEXUS toolbar for signed-in product pages. A route-local Knowledge header was rendering a second brand and module navigation row beneath the canonical shell; this change removes that duplicate navigation owner and keeps Knowledge-specific controls at the page level.

## Layer Impact

Layer 4 Products: updates authenticated shell composition and navigation presentation only. No data-plane, publication, baseline, projection, Cube, provider, or grounding contracts are changed.

## Client Applicability

- All clients: yes, for signed-in product shell navigation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/knowledge/shell/KnowledgeShell.tsx` no longer renders a route-local product module toolbar or tenant key.
- `src/components/knowledge/shell/ModuleSwitcher.tsx` removed as an obsolete duplicate global navigation implementation.
- `src/components/shell/topbar-nav-items.ts` keeps the global product nav to Knowledge, Intelligence, Moves, Source, and Tower; Learn remains a Home-level destination.
- Focused tests cover the canonical top nav, shell ownership, and Knowledge page controls.

## QA / Validation

- PASS: Focused Jest for canonical nav and Knowledge shell: 4 suites / 27 tests passed.
- PASS: Focused ESLint for modified shell/navigation files.
- PASS: TypeScript project check: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npm run audit:nexus-navigation`.
- PASS: `npm run release:check`.
- NOT-RUN: signed-in browser verification, pending merge and ACA deployment.

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA. After deployment, run signed-in browser proof for `/home/knowledge`, `/home/intelligence`, `/moves` or the approved Moves route, `/source`, and `/tower`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none by this PR.
- Approved image digest: produced by the main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because the change is presentation-only.

## Audit Evidence

- PR URL: pending.
- Focused test output: pending.
- ACA deploy run and image digest: pending.
- Signed-in screenshots: pending.

## Known Gaps

Live signed-in proof is pending until this candidate is merged and deployed.
