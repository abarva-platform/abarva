# 2026-07-17-moves-agent-assist-soft-rationale — Moves Soft Evidence Rationale

## Release ID

`2026-07-17-moves-agent-assist-soft-rationale`

## Status

`candidate`

## Plain-English Summary

Moves readiness already distinguishes hard blockers from soft, carry-forward context. The Contact Center Agent Assist P2 readiness view correctly made delivery-estimation context soft, but the generic rationale sentence still said the archetype “requires” that optional context at diagnose. This release makes rationale copy severity-aware so hard evidence reads as required and soft evidence reads as optional context, not a phase blocker.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves readiness rationale text for all archetypes and tenants.
- `client-data-lane`: No schema, tenant data, evidence ingestion, candidate/active data-layer, or generation behavior changes.

## Client Applicability

- All clients: Yes, any Strategic Move readiness item marked soft receives the corrected optional-context language.
- Specific clients: Meridian Health member-service Agent Assist P2 no longer reads optional ITSM/delivery-estimation context as required diagnose evidence.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/archetypes/resolver.ts`
  - Hard requirements keep the “requires…” rationale.
  - Soft requirements now render “can use … as optional context; it is not a hard blocker.”
  - Estate-resolved soft requirements use the same optional-context language.
- `src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts`
  - Adds regression coverage that Contact Center Agent Assist P2 delivery-estimation context is soft and does not render as required.

## QA / Validation

- `npx jest src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts --runInBand` — pass.
- `npx eslint src/lib/programs/archetypes/resolver.ts src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts` — pass.
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
- Live signed-in proof required: Yes, verify Meridian Agent Assist P2 still shows Contact Center Agent Assist hard gaps and that optional delivery-estimation context no longer says “requires.”

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration rollback is required.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Live signed-in proof: Pending.

## Known Gaps

- This does not redesign the P2 Prepare tab or File Cabinet upload/review UX.
- This does not change which evidence is hard or soft; it only corrects the wording shown for soft requirements.
