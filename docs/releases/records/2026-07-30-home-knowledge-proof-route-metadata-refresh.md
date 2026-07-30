# Home Knowledge Proof Route Metadata Refresh

## Release ID

`2026-07-30-home-knowledge-proof-route-metadata-refresh`

## Status

`candidate`

## Plain-English Summary

This release keeps the signed-in Home Knowledge proof route from failing closed on stale session
claims before Clerk user metadata has a chance to refresh. It only affects the existing
metadata-gated proof route and does not broaden access to Home Knowledge.

## Layer Impact

- **Global control lane:** The proxy refreshes Clerk public metadata before denying the explicitly
  gated Home Knowledge proof path.
- **Layer 4 / Products:** Home Knowledge signed-in proof can complete through the existing product
  route when the proof identity is correctly provisioned.
- **No data-plane change:** No schemas, loaders, projections, baselines, publications, Source,
  Cube, or canonical data are changed.

## Client Applicability

- **All clients:** No.
- **Specific clients:** None for production use.
- **Internal only:** Yes, signed-in foundation proof execution.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `src/proxy.ts`: passes the request pathname into proxy identity resolution and refreshes Clerk
  user metadata before denying `/home/knowledge` when route capability metadata is missing from the
  session token.
- `src/__tests__/unit/proxy-session-identity.test.ts`: adds regression coverage for stale proof
  session claims on the Home Knowledge route.

## QA / Validation

- **PASS:** Focused unit tests for proxy identity and foundation route access:
  `npx jest src/__tests__/unit/proxy-session-identity.test.ts src/lib/auth/__tests__/foundation-route-access.test.ts src/lib/auth/__tests__/foundation-preview-session.test.ts --runInBand`.
- **PASS:** Focused lint for the changed proxy and auth test files:
  `npx eslint src/proxy.ts src/__tests__/unit/proxy-session-identity.test.ts src/lib/auth/foundation-route-access.ts src/lib/auth/foundation-preview-session.ts`.
- **PASS:** Repository release validation with `npm run release:check`.
- **BLOCKED UNTIL DEPLOY:** Deployed signed-in Home Knowledge proof after merge and ACA deployment.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the merged SHA. After deployment, rerun the signed-in Home Knowledge proof for the
foundation proof identity.

## Deployment Authority

- **Repo-owned deploy workflow:** Required after merge.
- **Shared runtime mutators:** None in this PR.
- **Approved image digest:** To be captured after repo-owned deployment.
- **ACA runtime invariant:** To be captured after deployment.
- **Worker image invariant:** Not changed.
- **Feature/env flag update path:** None.
- **Live signed-in proof required:** Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data
rollback is required.

## Audit Evidence

- PR URL after opening.
- Focused unit, lint, and release-check outputs.
- Post-merge deployed SHA, image digest, ACA revision, and signed-in proof output.

## Known Gaps

Full Airline reload, publication, baseline activation, projection reconciliation, Cube parity, and
aVa grounding remain separate execution gates.
