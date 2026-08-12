# 2026-08-12-source-upload-package-requirement-consistency — Source upload package requirement consistency

## Release ID

`2026-08-12-source-upload-package-requirement-consistency`

## Status

`candidate`

## Plain-English Summary

The Source Responses stage stated the vendor upload requirement in two places that disagreed with each other. The file-readiness ledger said the minimum package is two required files per vendor — one main proposal package and one pricing workbook — while the package cockpit strip immediately above it listed five files as required, including SLA, staffing, and transition. A buyer reading the stage saw contradictory instructions on one screen, and the two panels also used different names for the same file family ("Pricing template" versus "Pricing workbook").

Both panels now read from one upload-package policy module, so the requirement level, the file name, and the accepted formats are stated once and rendered identically. The cockpit strip header no longer claims every listed file is required before scoring; it states the required count and notes that conditional content may arrive inside the main proposal.

This is presentation and shared-constant work. No requirement level changed from what the ledger already asserted; the cockpit strip was brought into line with it.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source UI only. Two existing Responses-stage panels now derive their labels and requirement levels from a shared module.
- Canonical model: No change.
- Source adapters: No change.
- Client intake: No change.

## Client Applicability

- All clients: Yes, all users on the Source Responses-stage canvas receive the presentation change after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/vendor-response-upload-package-policy.ts` (new shared policy module)
- `src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx`
- `src/components/source/canvas/responses/VendorResponseFileReadinessPanel.tsx`
- `src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx`
- `src/components/source/canvas/responses/__tests__/vendor-response-upload-package-policy.test.tsx` (new cross-panel regression test)

## QA / Validation

- `npx jest src/components/source/canvas/responses/__tests__/vendor-response-upload-package-policy.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx src/components/source/canvas/responses/__tests__/VendorResponseFileReadinessPanel.test.tsx` — 3 suites, 5 tests passed.
- `npx eslint` on the changed source and test files — clean.
- `npx tsc -p tsconfig.json --noEmit` — no errors in the changed area.
- `git diff --check` — clean.
- `npm run release:check -- --base origin/main --head HEAD` — see PR body.
- The new regression test pins the invariant directly: exactly two families are `Required`, SLA/staffing/transition are `Conditional`, and both panels render the same required-count wording.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting `main` image. No manual runtime mutation, parser production ingestion, data migration, or feature flag action is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy because the deploy workflow updates worker jobs with the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, a Source Responses route should show one consistent requirement statement across the cockpit strip and the file-readiness ledger.

## Rollback Plan

Revert this PR and let the repo-owned ACA main deploy workflow redeploy the prior UI. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Local focused test, lint, and typecheck output from the candidate branch.
- Post-deploy ACA runtime invariant and signed-in Responses-stage screenshot required after merge.

## Known Gaps

- The per-vendor rows of the file-readiness ledger render only when the vendor-response completeness read model returns records. That read model is keyed on a fixed set of seeded event ids, so on other events the ledger renders its policy header with zero rows while the profile-backed panels on the same stage report parsed vendor packages. This PR does not change that derivation; it is tracked as the next Responses-stage slice.
- No new parser production ingestion, file persistence, scoring persistence, vendor communication dispatch, or approval automation is introduced.
