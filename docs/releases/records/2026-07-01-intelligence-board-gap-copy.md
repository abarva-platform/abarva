# 2026-07-01-intelligence-board-gap-copy — Board-Gap Fallback Copy Fix

## Release ID

`2026-07-01-intelligence-board-gap-copy`

## Status

`candidate`

## Plain-English Summary

Signed-in production proof confirmed the Intelligence fallback no longer exposed internal session-history wording, but the sentence shape still rendered awkwardly in the live stream. This release changes the fallback to a bullet-style evidence-gap response that should preserve cleanly in the renderer.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence Ask fallback copy.
- `client-data-lane`: No data, schema, ingestion, or retrieval mutation.

## Client Applicability

- All clients: Cleaner Intelligence fallback wording when session-history repair cannot produce a standalone answer.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`

## QA / Validation

- Not run yet: focused Intelligence guardrail Jest; to be run before merge.
- Not run yet: `npm run release:check`; to be run before merge.
- Not run yet: `git diff --check`; to be run before merge.
- Not run yet: signed-in SkyHarbor evidence-gap proof; to be run after ACA deploy.
- Not run yet: Tower/Intelligence smoke scan for forbidden internal language; to be run after ACA deploy if time permits.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then rerun the signed-in SkyHarbor evidence-gap proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Azure Container Apps web app and aligned worker jobs through the approved workflow.
- Approved image digest: To be captured by deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required through deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision if the fallback change causes unexpected Intelligence Ask behavior. No database rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added after PR checks.
- Deployment run: to be added after merge.
- Smoke output: to be added after production proof.

## Known Gaps

This only fixes the final fallback sentence shape. It does not enrich the underlying V6 packet data or replace broader answer-quality work.
