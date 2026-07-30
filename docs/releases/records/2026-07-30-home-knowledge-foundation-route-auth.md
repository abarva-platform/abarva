# Home Knowledge Foundation Route Auth — PR C1

## Release ID

`2026-07-30-home-knowledge-foundation-route-auth`

## Status

`candidate`

## Plain-English Summary

This release moves the foundation proof landing path from the legacy Knowledge preview URL to the
signed-in Home Knowledge route. The change does not activate real tenant data and does not alter the
Home Knowledge data provider. It only lets an explicitly provisioned foundation proof identity reach
the existing `/home/knowledge` UI so product QA can certify that surface before any provider cutover.

## Layer Impact

- **Layer 4 / Products:** Home Knowledge routing and signed-in UI proof only. The page remains bound
  to the existing fixture runtime from the prior UI migration.
- **Global control lane:** Clerk metadata interpretation and post-sign-in routing now recognize the
  approved Home Knowledge proof route for the foundation proof identity. The route is metadata-gated
  and fails closed for other foundation tenants or proof users without the explicit route capability.
- **No data-plane change:** No schema, loader, baseline, publication, projection, Source, Cube, or
  canonical model changes are included.

## Client Applicability

- **All clients:** No.
- **Specific clients:** None activated for production use.
- **Internal only:** Yes. This is a signed-in foundation proof path for QA/certification.
- **Public/demo only:** No public route is added.
- **Feature flag:** None.

## Changes Included

- `src/lib/auth/foundation-route-access.ts`: Adds a metadata-aware route check and changes the
  normal foundation Knowledge landing path to `/home/knowledge`.
- `src/lib/auth/access-routing.ts`: Continues routing foundation proof sessions through
  `foundationKnowledgePath`, which now resolves to the Home Knowledge route without tenant/provider
  query strings.
- `src/proxy.ts`: Uses the metadata-aware foundation route check so `/home/knowledge` is not
  broadly exposed to every signed-in session and cannot self-redirect when proof capabilities are
  missing.
- `src/lib/auth/foundation-proof-logins.ts`: Adds `/home/knowledge` as the proof landing route and
  explicit allowed route while preserving the existing legacy preview allowance.
- `tests/e2e/knowledge-airline-demo-new-smoke.spec.ts`: Replaces the obsolete demo-code sign-in
  helper with Clerk ticket sign-in and adds route-selection assertions.
- Auth/routing/proxy identity unit tests updated for the new route contract and capability metadata.

## QA / Validation

- **PASS:** Auth/routing unit tests:
  `npx jest src/lib/auth/__tests__/foundation-route-access.test.ts src/lib/auth/__tests__/foundation-proof-logins.test.ts src/lib/auth/__tests__/access-routing.test.ts --runInBand`.
- **PASS:** Focused lint:
  `npx eslint src/lib/auth/foundation-route-access.ts src/lib/auth/foundation-proof-logins.ts src/lib/auth/access-routing.ts src/proxy.ts tests/e2e/knowledge-airline-demo-new-smoke.spec.ts`.
- **PASS:** Repository lint:
  `npx eslint src/`. The command completed with the existing repo warning backlog and no errors.
- **PASS:** Typecheck:
  `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --pretty false --project tsconfig.json`.
- **PASS:** Production build:
  `NODE_OPTIONS="--max-old-space-size=8192" npm run build`. The build emitted existing Turbopack
  broad-file-pattern warnings in unrelated admin/data/pricing modules and completed successfully.
- **PASS:** `npm run release:check`.
- **PASS:** Clerk proof metadata sync:
  `npx tsx scripts/auth/provision-foundation-proof-logins.ts --tenant airline-demo-new --apply --out-dir /tmp/home-knowledge-c1-foundation-proof-provision`.
- **BLOCKED LOCALLY / REQUIRED AFTER DEPLOY:** Clerk-ticket e2e against `/home/knowledge`. The
  unauthenticated route assertion passes locally, and the signed-in proof reaches the Responsible AI
  acknowledgment gate, but the local environment cannot complete the ledger write/read. The gate
  fails closed until the deployed data-plane environment records the required evidence.
- **BLOCKED UNTIL DEPLOY:** Signed-in deployed proof screenshot, network report, and console report.

## Rollout Plan

1. Open PR C1 against `main`.
2. Complete code review with an independent security/auth reviewer.
3. Merge through the protected PR path after validation.
4. Let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting SHA.
5. Capture deployed SHA, image digest, ACA revision, and signed-in proof for `/home/knowledge`.
6. Continue to PR C2 for the governed HTTP provider binding. Do not treat C1 as real-provider
   activation.

## Deployment Authority

- **Repo-owned deploy workflow:** Required for the runtime rollout after merge.
- **Shared runtime mutators:** None in this PR.
- **Approved image digest:** To be captured after the repo-owned deploy workflow completes.
- **ACA runtime invariant:** To be captured after deployment.
- **Worker image invariant:** Not changed by this PR.
- **Feature/env flag update path:** None.
- **Live signed-in proof required:** Yes, for the foundation proof identity on `/home/knowledge`.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data
rollback is required because this release does not write tenant data, baselines, publications,
projections, or Source artifacts.

## Audit Evidence

- PR C1 URL after opening.
- Unit/e2e/build/lint/release-check outputs.
- Post-merge deploy evidence: merge SHA, image digest, ACA revision.
- Signed-in browser proof screenshots and network/console report for `/home/knowledge`.

## Known Gaps

- Real governed HTTP provider binding is intentionally out of scope for C1 and remains PR C2.
- The Home Knowledge route remains fixture-bound until C2.
- Live certification must not be claimed until Responsible AI ledger checks pass in the deployed
  environment and the signed-in browser proof lands on `/home/knowledge` without redirecting to the
  legacy preview route.
