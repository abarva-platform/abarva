# 2026-07-01-intelligence-executive-safety-fallback — Executive Safety Fallback Polish

## Release ID

`2026-07-01-intelligence-executive-safety-fallback`

## Status

`candidate`

## Plain-English Summary

The first clean safety fallback removed internal session-history wording, but a signed-in production smoke showed the fallback still read awkwardly in one SkyHarbor evidence-gap answer. This release tightens the fallback into a short executive evidence-gap response and removes remaining internal "draft/surface" phrasing from the mixed-tenant safety stop.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence Ask safety wording for all tenants.
- `client-data-lane`: No data, schema, ingestion, or retrieval mutation.

## Client Applicability

- All clients: Cleaner Intelligence fallback wording when a model answer must be repaired or blocked.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts --runInBand`.
- Passed: `git diff --check`.
- Not run yet: `npm run release:check`; to be rerun after release-record status correction.
- Not run yet: signed-in SkyHarbor evidence-gap proof; to be run after ACA deploy.
- Not run yet: Tower/Intelligence smoke scan for forbidden internal language; to be run after ACA deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then rerun the signed-in Intelligence evidence-gap proof and Tower/Intelligence smoke scan.

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

This improves the emergency safety wording. It does not replace the broader V6 data enrichment work needed for richer answer packets and better first-pass model output.
