# 2026-07-01-intelligence-clean-safety-fallback — Clean Intelligence Safety Fallback

## Release ID

`2026-07-01-intelligence-clean-safety-fallback`

## Status

`candidate`

## Plain-English Summary

The Intelligence Ask stream guard already prevented session-dependent Claude wording from reaching the user, but one production smoke showed the last-resort safety response exposing internal mechanics. This release changes that fallback to a clean evidence-gap answer that is safe for an executive demo and does not mention hidden history, prior conversation state, or internal rendering behavior.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence Ask synthesis guard used by all tenants.
- `client-data-lane`: No data, schema, or retrieval mutation.

## Client Applicability

- All clients: Receive the cleaner fallback wording if the model cannot repair session-dependent language.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`

## QA / Validation

- Passed: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/__tests__/intelligence-consultant-text-synthesis.test.ts src/app/api/source/synthesis/__tests__/route.test.ts src/app/api/programs/synthesis/__tests__/route.test.ts --runInBand`.
- Passed: `git diff --check`.
- Not run yet: production signed-in rerun of the SkyHarbor evidence-gap question; to be run after ACA deploy.
- Production smoke finding: SkyHarbor evidence-gap question triggered the old fallback phrase. This release removes that user-visible internal wording.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then rerun the exact SkyHarbor evidence-gap question and the Tower/Intelligence smoke scan.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: Azure Container Apps web app and aligned worker jobs through the approved workflow.
- Approved image digest: To be captured by deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required through deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll back ACA traffic to the prior healthy revision if the new fallback causes unexpected Intelligence Ask behavior. No database rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added after PR checks.
- Deployment run: to be added after merge.
- Smoke output: to be added after production proof.

## Known Gaps

This cleans the safety fallback wording. It does not eliminate the need to keep improving prompt stability so the fallback is rarely needed.
