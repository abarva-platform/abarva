# 2026-07-02-home-source-commercial-boundary — Home Source Commercial Boundary

## Release ID

`2026-07-02-home-source-commercial-boundary`

## Status

`candidate`

## Plain-English Summary

Home V6 can identify vendor and contract evidence, but it must not make final commercial actions such as which contract to reopen, renegotiate, renew, cancel, or terminate. This release tightens the Home executive answer contract so vendor and sourcing questions are phrased as Source-validation candidates, with Source owning the commercial decision.

## Layer Impact

- `global-control-lane`: Updates the shared Home V6 executive answer contract and validator for all tenants.
- `public-demo`: Improves demo safety by ensuring Home does not overstate vendor or contract decisions during signed-in demos.

## Client Applicability

- All clients: Yes, for Home V6 executive answer synthesis.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home V6 executive synthesis flags continue to control model synthesis behavior.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`: bumps prompt version to `home-v6-executive-answer-v3`, adds Source commercial-boundary instructions, and rejects unsafe Home commercial action language for vendor/contract questions.
- `src/lib/home/know/v6-home-ask.ts`: canonicalizes V6 dataset display names through the demo-safe client display-name registry.
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`: adds regression coverage for unsafe vendor-renegotiation language and updates prompt-version expectations.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed.
- `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand` passed.

## Rollout Plan

Merge to `main`, build the exact SHA through the repo-owned Azure Container Apps deployment lane, assign 100% traffic to the healthy ACA revision, then run a signed-in Home smoke for the Industrial Demo vendor-renegotiation question.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps release path.
- Shared runtime mutators: None beyond the Home application image.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the merged SHA on the active `ca-abarva-web-lab-eastus` revision.
- Worker image invariant: Not affected.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image. No schema or data migration is included.

## Audit Evidence

- PR URL: To be added after PR creation.
- ACA revision and image digest: To be captured after deployment.
- Signed-in smoke output: To be captured after deployment.

## Known Gaps

This release fixes the true Home/Source boundary miss from the 60-question Home V6 CXO proof. The broader 60-question proof still needs final rerun/rescore after deployment.
