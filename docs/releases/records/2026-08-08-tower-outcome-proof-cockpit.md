# 2026-08-08-tower-outcome-proof-cockpit — Tower Outcome Proof Cockpit

## Release ID

`2026-08-08-tower-outcome-proof-cockpit`

## Status

`candidate`

## Plain-English Summary

Tower's default Command Center screen now opens as an outcome-proof operating cockpit instead of a set of separate posture tiles. The first read is a CFO-style verdict, followed by board-value posture, a Recharts value waterfall, a labeled capital decision matrix, an evidence-owner queue, and a compact source-trust rail. Tower aVa now starts hidden as a compact invocation point and opens into a wider artifact-ready advisory overlay for richer tables, Recharts visuals, and exportable executive insight sessions.

The change does not rebuild Tower data or alter source-of-truth rules. It reshapes the existing governed Tower mart projection into a stronger executive story: what is claimable, what is blocked, who owns the missing proof, and which values still need stronger lineage before they can behave like certified board numbers.

## Layer Impact

- `global-control-lane` / Layer 4 Products: Tower presentation changes only. The screen continues to read the existing `cio_tower.mart_*` read model through the existing Tower view model.
- `global-control-lane` / Layer 3 Canonical / marts: no schema or data mutation in this release. Missing mart fields are rendered as not loaded rather than inferred.
- Layer 1 / Layer 2: no intake, adapter, loader, or tenant package changes.

## Client Applicability

- All clients: all tenants that can access the Tower Command Center surface receive the new default screen after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/views/CommandCenterView.tsx` — replaces the first tab composition with the Outcome Proof Cockpit: board posture, proof-stage strip, Recharts waterfall, labeled decision matrix, evidence-owner queue, and source-trust rail.
- `src/components/tower/command-center/charts/OutcomeDecisionMatrixChart.tsx` — adds a Recharts scatter matrix with labeled program bubbles, quadrant backgrounds, sized exposure bubbles, and click-through program selection.
- `src/components/tower/command-center/TowerCommandCenter.module.css` — adds the wide-canvas cockpit layout and responsive constraints.
- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx` — keeps Tower aVa collapsed by default, restores the invocation to a wider expanded overlay, and declares Tower-specific rendering/export intent in the surface context.
- `src/components/atlas/AtlasChatPanel.tsx` and `src/components/agent/AgentDock.tsx` — expose dock controls for artifact-heavy surfaces and preserve exact visible answer strings when a caller has already applied the surface's governance policy.
- `src/app/api/tower/cio-chat/route.ts` and `src/lib/cio-tower/answer.ts` — add server-controlled Tower visible-context criteria so the prompt owns constraints, artifact expectations, exact rendering policy, and PDF/HTML export readiness.
- `src/components/tower/command-center/drawers/ProgramDrawer.tsx` and `src/lib/tower/command-center/__fixtures__/design-fixture.ts` — align drawer and candidate-pipeline copy to claim-gate language rather than casual realized-value language.
- `src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx` — updates the Command Center behavior assertion to the new cockpit contract.

## QA / Validation

- Pass: `npx eslint src/components/agent/AgentDock.tsx src/components/atlas/AtlasChatPanel.tsx src/components/tower/command-center/TowerCommandCenterAvaShell.tsx src/components/tower/command-center/views/CommandCenterView.tsx src/components/tower/command-center/charts/OutcomeDecisionMatrixChart.tsx src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/app/api/tower/cio-chat/route.ts src/lib/cio-tower/answer.ts src/lib/cio-tower/tower-chat-artifacts.ts`
- Pass: `npx jest src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx src/components/tower/command-center/__tests__/TowerCommandCenterAvaShell.test.tsx src/components/atlas/__tests__/AtlasChatPanel.test.tsx src/lib/cio-tower/__tests__/tower-chat-artifacts.test.ts src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/command-center/__tests__/render-harness.test.tsx --runInBand`
- Visual proof: `/Users/anand/Downloads/tower-cfo-audit-2026-08-08/outcome-proof-cockpit-harness/01-command-center-1440-final.png`
- CXO deployment audit pack: `/Users/anand/Downloads/tower-cxo-deploy-audit-2026-08-08/current-harness/`
- CXO layout scan: all 16 captured states report zero horizontal overflow, no header above 26px, and no unsafe outcome-value wording in the scanned visible text.
- Latest deploy validation: focused Tower/aVa/mart suites passed 111/111.
- Note: Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks; the focused suites still passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image. No operator data-build job, mart refresh, migration, feature flag, or tenant data promotion is required for this UI-only release.

## Deployment Authority

- Repo-owned deploy workflow: required for production activation.
- Shared runtime mutators: none in this release.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required only if deployed to shared Product/Lab runtime.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deployment, verify the Tower route renders the cockpit for a signed-in user and that tab navigation/drawers still work.

## Rollback Plan

Revert the Tower Command Center UI changes and redeploy through the repo-owned main deploy workflow. Because no schema, loader, mart, or tenant data changes are included, rollback is a normal application-code rollback.

## Audit Evidence

- Local lint output for the changed Tower files.
- Local Jest output for the Tower Command Center behavior suite.
- The diff in the listed files.
- Post-deploy signed-in browser proof should be captured before marking the release live-proven.

## Known Gaps

- The companion mart-completion candidate adds first-class mart fields for source-lineage state, proof waterfall stages, and evidence-owner queue metadata, but live tenants still need approved migration and governed refresh before those values are populated from the data plane.
- Local visual proof uses the design fixture. Live-proof status still requires signed-in Tower verification after the repo-owned deployment workflow promotes the merged SHA.
