# 2026-07-15-live-auth-nav-dock-fixes — Live Auth, Learn Nav, and AgentDock Layout Fixes

## Release ID

`2026-07-15-live-auth-nav-dock-fixes`

## Status

`candidate`

## Plain-English Summary

Fixes three production-facing regressions found during signed-in app checks: server-side auth can recover Clerk role/client metadata when session token claims are incomplete, `/home/learn` no longer renders a duplicate Nexus top nav, and AgentDock no longer feeds its own measured page position back into sticky positioning.

## Layer Impact

- `global-control-lane`: Updates shared Clerk-protected middleware behavior, authenticated Learn shell chrome, and shared AgentDock layout infrastructure used by Intelligence, Tower, Moves, and Source-style agent surfaces.

## Client Applicability

- All clients: yes, for signed-in users on Clerk-protected product routes and shared agent dock surfaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/proxy.ts`: adds bounded Clerk user metadata fallback when session claims omit role/client metadata.
- `src/app/(maestro)/home/learn/layout.tsx`: removes the duplicate nested `NexusTopNav` render.
- `src/components/agent/AgentDock.tsx`: separates measured dock height from stable sticky top offset.
- Regression tests for proxy identity fallback, Learn single-nav ownership, and AgentDock sticky-top separation.

## QA / Validation

- Pass: `npx jest src/__tests__/unit/proxy-session-identity.test.ts src/__tests__/hygiene/learn-layout-single-nav.test.ts src/components/navigation/__tests__/NexusTopNav.test.tsx --runInBand`
- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "does not feed the measured dock top back|self-measured top offset"`
- Pass: `npx eslint src/proxy.ts 'src/app/(maestro)/home/learn/layout.tsx' src/components/agent/AgentDock.tsx src/__tests__/unit/proxy-session-identity.test.ts src/__tests__/hygiene/learn-layout-single-nav.test.ts src/components/agent/__tests__/AgentDock.test.tsx`
- Pending: TypeScript, release check, PR/merge, ACA deployment, and signed-in `app.abarva.ai` browser proof.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the digest-pinned web image. After deployment, run signed-in browser proof for `/home`, `/home/learn`, `/intelligence`, and `/tower`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: no ad-hoc ACA mutation from this PR.
- Approved image digest: pending deploy workflow.
- ACA runtime invariant: pending deploy workflow.
- Worker image invariant: not expected to change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and allow the repo-owned ACA deploy workflow to restore the previous web image. If the Clerk dashboard is corrected first, the proxy fallback can still remain as defense-in-depth; rollback is only needed if middleware latency or route behavior regresses.

## Audit Evidence

- PR URL: pending.
- Deployment URL: `https://app.abarva.ai` after ACA deploy.
- Signed-in proof bundle: pending.

## Known Gaps

- This code fallback does not replace the proper Clerk dashboard/session-token configuration. Production should still move off development Clerk keys or explicitly include required metadata claims.
- The existing full `AgentDock.test.tsx` suite has unrelated stale expectations on current `main`; this release validates the targeted AgentDock offset contract.
