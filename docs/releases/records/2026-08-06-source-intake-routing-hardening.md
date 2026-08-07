# 2026-08-06-source-intake-routing-hardening — Source Intake Routing Hardening

## Release ID

`2026-08-06-source-intake-routing-hardening`

## Status

`candidate`

## Plain-English Summary

This release hardens Source event origination so a completed intake either opens its approval route or shows a visible creation error. It also removes render-time browser storage and request-id reads that could make the first client render disagree with the server-rendered markup, prevents a persisted expanded chat dock from covering the intake approval actions, and moves the public landing request-access behavior into a small client island so the marketing root does not hydrate as one large client component.

## Layer Impact

- `global-control-lane`: Source intake UI behavior is hardened for event creation and approval navigation across the shared product surface.
- Products: Source onboarding tour and chat-dock persisted mode state are moved to client-side effects to avoid first-render mismatch.
- Products: Source new-event intake opts out of persisted chat-dock mode so workflow actions remain clickable on fresh visits.
- Public route: landing-page request-access behavior is isolated in a focused client controller to reduce root-page hydration work while preserving the same form flow.

## Client Applicability

- All clients: Source intake users receive the safer create-and-route behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx`
- `src/components/source/onboarding/SourceOnboardingTour.tsx`
- `src/components/agent/AgentDock.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`
- `src/app/globals.css`
- `src/components/marketing/LoggedOutLandingPage.tsx`
- `src/components/marketing/RequestAccessController.tsx`
- `src/__tests__/integration/source/source-originate-page.test.ts`

## QA / Validation

- `npm test -- --runTestsByPath src/__tests__/integration/source/source-originate-page.test.ts src/components/agent/__tests__/AgentDock.test.tsx --testNamePattern="hydrates a stored mode preference|can ignore a stored mode preference|SourceOriginatePage"` passed.
- `npx eslint src/components/marketing/LoggedOutLandingPage.tsx src/components/marketing/RequestAccessController.tsx src/components/agent/AgentDock.tsx src/components/source/SourceOriginatePage.tsx` passed with existing image optimization warnings on the marketing page.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- Lighthouse CI budget covers `/` and `/sign-in`; the landing page client-island split is included to keep that required release gate within budget.

## Rollout Plan

Merge to main through a pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source intake route smoke and create-to-approval browser proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow.

## Audit Evidence

- Pull request and CI output after publication.
- Source intake targeted test output listed above.
- ACA deployment evidence after merge.
- Live signed-in Source route proof after deployment.

## Known Gaps

Live signed-in create-to-approval proof must be captured after deployment.
