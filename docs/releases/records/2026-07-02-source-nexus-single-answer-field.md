# 2026-07-02-source-nexus-single-answer-field — Source Nexus Single Answer Field

## Release ID

`2026-07-02-source-nexus-single-answer-field`

## Status

`candidate`

## Plain-English Summary

This follow-up keeps the Source aVa API proof clean by exposing one top-level `answer` field instead of duplicating the same answer under `answer`, `message`, and `text`. The previous release made the user-facing answer visible without falling through to raw JSON, but duplicate aliases caused proof tooling to concatenate the same answer multiple times. This release keeps the clean answer boundary and removes the duplicate aliases.

## Layer Impact

- `global-control-lane`: Adjusts the shared Source Nexus API response shape for all clients using the Source aVa endpoint.
- `client-data-lane`: No schema, data-plane, migration, or evidence-row changes.

## Client Applicability

- All clients: Source Nexus API consumers receive the single `answer` field.
- Specific clients: Immediate proof target remains SkyHarbor Air contract optimization event `SKYH-AMS-CONTRACT-OPT-2026`.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/nexus-api.ts`: removes duplicate `message` and `text` aliases from the deterministic response.
- `src/lib/source/sentinel-chat-llm.ts`: removes duplicate aliases from the optional LLM-backed response.
- Source Nexus tests updated to assert the single answer contract.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts`
- PASS: `npx eslint src/lib/source/nexus-api.ts src/lib/source/sentinel-chat-llm.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/sentinel-chat-llm.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- PASS: `npm run release:check`
- Pending before release: PR checks, ACA deploy, and signed-in SkyHarbor proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main lane, then rerun the signed-in SkyHarbor Source proof and confirm captured aVa answers are not triplicated.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps `ca-abarva-web-lab-eastus`.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Verify active revision and digest before browser proof.
- Worker image invariant: No worker-specific behavior change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA revision. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local and CI validation pending.
- Live proof folder will contain API payloads and screenshots after deploy.

## Known Gaps

Live ACA deployment and signed-in browser proof are pending for this follow-up.
