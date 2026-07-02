# 2026-07-02-source-contract-optimization-operational-pressure-polish — Source Operational Pressure Formatting

## Release ID

`2026-07-02-source-contract-optimization-operational-pressure-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes one visible readability issue found during the live Source contract optimization proof. aVa now renders the operational-pressure finding as its own bullet under a heading instead of producing the awkward `Operational pressure: - ...` text.

## Layer Impact

- `global-control-lane`: adjusts Source contract optimization answer text formatting only.
- `public-demo`: improves the SkyHarbor signed-in contract optimization proof path.

## Client Applicability

- All clients: applies only when Source contract optimization answers include an operational-pressure finding.
- Specific clients: SkyHarbor demo proof path.
- Internal only: no.
- Public/demo only: yes for the current proof scenario.
- Feature flag: none.

## Changes Included

- `src/lib/source/source-answer-engine.ts`: splits the operational-pressure bullet onto a new line.
- `src/lib/source/__tests__/source-answer-engine.test.ts`: adds a regression assertion that `Operational pressure: -` cannot reappear.

## QA / Validation

- Pending: Focused Source answer-engine Jest.
- Pending: Scoped ESLint for touched files.
- Pending: Full TypeScript check.
- Pending: `npm run release:check`.
- Not run yet: Post-deploy signed-in Source browser/API proof.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, confirm 100% traffic on the merged SHA, then rerun the signed-in Source proof on `https://app.abarva.ai/source/events/SKYH-AMS-CONTRACT-OPT-2026?stage=responses`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the approved ACA deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow after merge.
- ACA runtime invariant: verify active revision, 100% traffic, image digest, and `/api/health`.
- Worker image invariant: handled by the ACA deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow. No schema or data-plane migration is included.

## Audit Evidence

To be added after merge/deploy: PR URL, CI run, ACA deploy run, active revision/digest, and signed-in proof folder.

## Known Gaps

This is a narrow text-formatting polish. It does not change Source scoring, extraction, exports, or sourcing decision logic.
