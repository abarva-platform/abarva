# 2026-07-17-moves-agent-assist-readiness — Moves Agent Assist Readiness Routing

## Release ID

`2026-07-17-moves-agent-assist-readiness`

## Status

`candidate`

## Plain-English Summary

Moves P2 was showing AI product-development evidence blockers, including DORA / CI-CD delivery metrics, for a Meridian member-service Agent Assist Move. That was the wrong evidence contract for the business problem. This release adds a dedicated Contact Center Agent Assist archetype so member-service Agent Assist work asks for contact-center, process, systems/data, knowledge, PHI/control, and operating-ownership evidence instead. Engineering delivery / ITSM context is treated as optional later-phase implementation-estimation context, not a hard P2 strategy blocker.

The P2 “Findings to review” section is also made actionable: users can open Files & Evidence or continue to Approve & Build from the review step, with copy explaining that the gate will show remaining blockers and will not approve unsupported claims.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves archetype routing and phase-workspace UI behavior change for all tenants.
- `client-data-lane`: No schema, ingestion, tenant data, or candidate/active data-layer behavior changes.

## Client Applicability

- All clients: Yes, any Move whose name/classification resolves to Contact Center Agent Assist receives the corrected archetype routing.
- Specific clients: Meridian Health benefits immediately for member-service / member AI assist Moves.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/archetypes/registry.ts`
  - Adds `CONTACT_CENTER_AGENT_ASSIST`.
  - Routes “Member AI Assist”, “Member Service Agent Assist”, contact/call-center, prior-auth, eligibility, benefits, and agent-assist language to that archetype.
  - Keeps DORA/CI-CD/engineering SDLC evidence out of the P2 hard blocker set.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds explicit actions to the P2 findings review step: Open Files & Evidence and Continue to Approve & Build.
- Tests:
  - `src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts`
  - `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts --runInBand` — pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — pass.
- `npx eslint src/lib/programs/archetypes/registry.ts src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.

## Rollout Plan

Open a PR against `main`, squash merge after validation, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a Meridian member-service Agent Assist P2 page no longer shows DORA/CI-CD as a hard current-state gap and that the Findings step exposes explicit actions.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4969
- Merge SHA: Pending.
- ACA revision: Pending.
- Live signed-in proof: Pending.

## Known Gaps

- This does not change file-upload rendering, file open behavior, or File Cabinet review semantics.
- This does not generate new P2 session packs or client datasets.
