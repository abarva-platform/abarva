# 2026-07-18-healthcare-member-service-agent-assist-pack — Healthcare Agent Assist Function Pack

## Release ID

`2026-07-18-healthcare-member-service-agent-assist-pack`

## Status

`candidate`

## Plain-English Summary

Adds a curated healthcare Member-Service Agent Assist Domain Function Pack so Moves generation for Meridian-style contact-center work can bind to real member-service operating depth instead of borrowing generic patient-access, payer-claims, or financial-services contact-center context. The pack covers claims, benefits, eligibility, prior authorization, CRM, knowledge ownership, PHI/HIPAA controls, human decision boundaries, adoption, value haircuts, and Tower-ready measurement.

## Layer Impact

- `global-control-lane`: adds shared expert-kernel content available to all healthcare-provider tenants whose Moves resolve to `member_service_agent_assist`.
- Expert kernel / domain function packs: adds one new healthcare function key and one complete eight-layer Function Pack.
- Moves generation context: existing pack-resolution call sites can now bind healthcare Agent Assist work to curated operating metrics, pain themes, archetypes, solution patterns, value model, vocabulary, deliverable outlines, and evidence anchors.
- Tests / quality gates: adds coverage proving the new pack passes the depth bar, resolves through the registry, uses healthcare vocabulary, and does not put DORA / CI-CD / SDLC metrics into the strategy spine.

## Client Applicability

- All clients: Any healthcare-provider tenant whose Move resolves to `member_service_agent_assist`.
- Specific clients: Meridian / Healthcare Demo Agent Assist Moves benefit directly.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/expert-kernel/domain/healthcare/member-service-agent-assist.ts`
- `src/lib/programs/expert-kernel/domain/function-pack-types.ts`
- `src/lib/programs/expert-kernel/domain/function-pack-registry.ts`
- `src/lib/programs/expert-kernel/domain/index.ts`
- `src/lib/programs/expert-kernel/domain/__tests__/healthcare-member-service-agent-assist.test.ts`
- `src/lib/programs/expert-kernel/domain/__tests__/function-pack-depth.test.ts`
- `src/lib/programs/expert-kernel/domain/__tests__/function-pack-registry.test.ts`
- `src/lib/programs/__tests__/function-identity.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/programs/expert-kernel/domain/__tests__/healthcare-member-service-agent-assist.test.ts src/lib/programs/expert-kernel/domain/__tests__/function-pack-depth.test.ts src/lib/programs/expert-kernel/domain/__tests__/function-pack-registry.test.ts src/lib/programs/__tests__/function-identity.test.ts --runInBand`
- Pass: `npx eslint` on touched files
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/lib/programs/expert-kernel --runInBand`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: signed-in Meridian browser proof after deploy that a healthcare Contact Center Agent Assist Move generates content using the new pack.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`. No DB migration and no feature flag are required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker-image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a Meridian healthcare Agent Assist Move.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. Because this is code/configured content only and has no migration, rollback is a normal code revert.

## Audit Evidence

Pending:

- PR URL
- Local validation output
- GitHub CI
- ACA deploy proof
- Signed-in Meridian browser proof

## Known Gaps

- This release does not add the Phase Intelligence UI tab.
- This release does not change gate-blocking approval logic.
- This release does not claim realized value or Tower outcomes.
