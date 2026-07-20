# 2026-07-20-source-client-facing-artifact-hygiene — Source Client-Facing Artifact Hygiene

## Release ID

`2026-07-20-source-client-facing-artifact-hygiene`

## Status

`candidate`

## Plain-English Summary

Source generated drafts now apply the client-facing document standard before content QA sees the body. The strategy memo prompt now asks for the same sections the QA scanner requires, and generated client-facing drafts deterministically replace internal labels, AI/model language, source-register mechanics, and stage-gate wording with client-safe wording.

## Layer Impact

- `global-control-lane` — Product runtime: Source artifact generation prompt retrieval and body sanitation now apply the client-facing language policy for profile-backed documents.
- `global-control-lane` — Source documentation standards: d01 generation sections now match d01 QA-required exhibits, preventing the generator from asking for one structure while the Files matrix scores another.
- `global-control-lane` — Tests: Focused agent-generation coverage locks the sanitizer and section contract against the content QA scan used by the Files matrix.

## Client Applicability

- All clients: Applies to Source generated client-facing artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/client-facing-hygiene.ts`
- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/section-conformance.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- Focused tests under `src/lib/source/agent-generation/__tests__/`

## QA / Validation

- Pass: `npm test -- --runInBand src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` (4 suites, 30 tests; existing duplicate Jest mock warnings only).
- Pass: `npx eslint src/lib/source/agent-generation/client-facing-hygiene.ts src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/section-conformance.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to `app.abarva.ai`. Regeneration of an existing persisted draft is a separate operator/product action; this release fixes the generation path and does not silently overwrite human-reviewable draft bodies.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deployment.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, prove a generated or regenerated Source client-facing draft can render in the Files matrix without content blockers.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned deploy workflow. Existing persisted draft bodies remain auditable; this release does not run a data migration or destructive body rewrite.

## Audit Evidence

- Pending PR URL.
- Pending validation output.
- Pending ACA deployment run, image digest, revision, and signed-in browser proof.

## Known Gaps

Existing persisted draft bodies created before this release may still show content QA blockers until regenerated or edited by a human. This is intentional; the release does not silently rewrite existing client-reviewable content.
