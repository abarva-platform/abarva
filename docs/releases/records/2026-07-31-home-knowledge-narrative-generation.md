# 2026-07-31-home-knowledge-narrative-generation — Home Knowledge Narrative Generation

## Release ID

`2026-07-31-home-knowledge-narrative-generation`

## Status

`candidate`

## Plain-English Summary

This candidate adds a governed generation stage for the Home Knowledge brief so the AbarVa View, Leadership Perspective, and Benchmark sections can be authored from accepted evidence instead of remaining hardcoded empty states. The generator uses the existing audited Claude egress path and refuses rather than fabricating when evidence or real benchmark cohort data is missing.

## Layer Impact

Release lane: `client-data-lane`.

Products: Home Knowledge can read lens-specific `enterprise_brief_v1` rows for generated narrative content while preserving the deterministic base brief fallback.

Canonical model: No schema changes and no canonical promotion. The stage reads accepted knowledge and writes only consumption projection rows after projection build.

Operations: Adds an HCDN job contract stage for narrative generation between projection build and Home read-model verification.

## Client Applicability

- All clients: Code path is tenant-scoped and reusable.
- Specific clients: First intended lab validation is the current synthetic airline demo tenant.
- Internal only: Operator scripts and proof artifacts are internal.
- Public/demo only: Not public by default.
- Feature flag: No new runtime flag; write execution requires `ABARVA_KNOWLEDGE_NARRATIVE_WRITE_APPROVED=true`.

## Changes Included

- Narrative generator: `src/lib/knowledge/consumption-server/generate-narrative.ts`
- Lens-aware brief reader fallback: `src/lib/knowledge/consumption-server/reader.ts`
- Operator script: `scripts/knowledge/generate-knowledge-narratives.ts`
- HCDN process contract and executor hook: `scripts/knowledge/hcdn-job-runner.mjs`, `scripts/knowledge/processing/*`
- Prompt reference: `docs/knowledge/knowledge-narrative-system-prompt.md`

## QA / Validation

Focused validation:

- Pass: `npx tsc --noEmit --pretty false`
- Pass with pre-existing duplicate manual mock warnings: `npx jest src/lib/knowledge/consumption-server/__tests__/generate-narrative.test.ts --runInBand`
- Pass: `node scripts/knowledge/__tests__/run-hcdn-job-runner-tests.mjs`
- Pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: `npx eslint src/lib/knowledge/consumption-server/generate-narrative.ts src/lib/knowledge/consumption-server/__tests__/generate-narrative.test.ts src/lib/knowledge/consumption-server/reader.ts scripts/knowledge/generate-knowledge-narratives.ts`
- Pass: `npm run release:check`
- Blocked by missing local DB credentials: `npm run knowledge:generate-narratives -- --tenant skyharbor-air --out-dir reports/knowledge-narrative-generation-20260731T000000Z --json`

Live signed-in proof is blocked until a lab write, deploy, and signed-in browser run are completed.

## Rollout Plan

Merge by PR only. After merge, the repo-owned Azure Container Apps main deploy workflow may build and deploy the web image. Lab narrative writes must run through the approved HCDN process with tenant scope, active baseline, accepted evidence, and the explicit write-approval environment variable.

## Deployment Authority

- Repo-owned deploy workflow: Required for app runtime changes.
- Shared runtime mutators: Not authorized by this candidate.
- Approved image digest: Not assigned yet.
- ACA runtime invariant: Must be proven after any deploy.
- Worker image invariant: Must match the approved digest if the HCDN worker runs this stage.
- Feature/env flag update path: `ABARVA_KNOWLEDGE_NARRATIVE_WRITE_APPROVED=true` is required only for the lab/operator write.
- Live signed-in proof required: Yes, before any live-proven claim.

## Rollback Plan

Revert the PR to remove the process stage and generator. If lab narrative rows were written, rerun projection build for the active baseline to restore deterministic base consumption rows, or delete only the lens-specific `enterprise:*` rows under an approved operator rollback.

## Audit Evidence

Expected evidence includes the PR, focused validation logs, release check output, non-writing generation proof bundle when DB/model access is available, and signed-in Home Knowledge screenshots after lab write and deploy.

## Known Gaps

Live generated output and signed-in product certification are still pending because this local environment does not expose the lab database credentials or managed identity token config. Benchmark rows remain empty unless real cohort benchmark data is present.
