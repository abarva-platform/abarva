# 2026-07-18-moves-phase-intelligence-agent-assist-alias — Agent Assist Pack Binding Fallback

## Release ID

`2026-07-18-moves-phase-intelligence-agent-assist-alias`

## Status

`candidate`

## Plain-English Summary

Moves Phase Intelligence now recognizes short legacy Meridian Agent Assist Move names, such as "MEMBER AI ASSIST", as the healthcare member-service Agent Assist Function Pack when no persisted function pack key exists. The resolver still prefers persisted Move identity first and still uses the deterministic Function Pack classifier before the alias fallback.

## Layer Impact

- `global-control-lane`: updates the read-only Moves Phase Intelligence summary path for all tenants.
- `client-data-lane`: no schema, data load, candidate promotion, or tenant data mutation.

## Client Applicability

- All clients: yes, for read-only Phase Intelligence binding behavior.
- Specific clients: Meridian benefits immediately for legacy Agent Assist Moves that predate persisted function pack keys.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/phase-intelligence-summary.ts`
- `src/lib/programs/__tests__/phase-intelligence-summary.test.ts`

## QA / Validation

Candidate validation:

- Pass: `npx eslint src/lib/programs/phase-intelligence-summary.ts src/lib/programs/__tests__/phase-intelligence-summary.test.ts`
- Pass: `npx jest src/lib/programs/__tests__/phase-intelligence-summary.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`, updates the deliverable worker jobs, and shifts 100% traffic only after the runtime invariant passes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow
- Approved image digest: pending deploy
- ACA runtime invariant: pending deploy
- Worker image invariant: pending deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes, Meridian Move Phase Intelligence must show `Member-service Agent Assist Function Pack`

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Since this is read-only summary logic, rollback has no data migration or data repair step.

## Audit Evidence

Pending PR, CI, ACA deploy evidence, and signed-in Meridian proof bundle.

## Known Gaps

This does not backfill `engagements.function_pack_key`; it only improves read-time Phase Intelligence binding for legacy Moves.
