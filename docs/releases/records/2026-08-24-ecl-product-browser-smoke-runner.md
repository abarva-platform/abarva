# 2026-08-24-ecl-product-browser-smoke-runner — ECL Product Browser Smoke Runner

## Release ID

`2026-08-24-ecl-product-browser-smoke-runner`

## Status

`candidate`

## Plain-English Summary

Adds a narrow signed-in browser smoke runner for the ECL preview provider. It authenticates with the private browser proof cookie when the proof token is available, falls back to Clerk sign-in tickets for local/dev use, pins the active client, opens the Home, Source, Tower, and Intelligence ECL preview routes, captures screenshot and text evidence, and fails on sign-in redirects, empty pages, browser errors, missing expected text, or client-visible builder vocabulary.

Follow-up: the approved ACA main deploy lane now wires the private browser proof route into the web runtime with `ABARVA_PRIVATE_BROWSER_PROOF_ENABLED=1` and `ABARVA_PRIVATE_BROWSER_PROOF_TOKEN=secretref:parallel-run-token`. The private operator job now declares the same proof-token secretRef so the governed ACA proof job can request the proof cookie without printing the token. This is required because the first ACA smoke run failed before product routes on Clerk browser ticket exchange.

Second follow-up: the browser runner emits a compact structured result after its archive output. This keeps the five-step status recoverable from ACA log tails even when screenshot evidence makes the archive too large for the supported log window.

Third follow-up: the first structured route run reached all four product routes. Source passed. Home failed on the preview auth boundary, Tower exposed an internal serving-view name, and Intelligence needed the same client-facing wording cleanup plus better text excerpts for diagnosis. This release keeps the proof route non-default, accepts the private proof cookie only for matching-tenant Home ECL preview, removes raw serving-view names from Tower and Intelligence text, and includes a short text excerpt in the compact proof event.

Fourth follow-up: after deployment, the next five-step smoke accepted Home, Source, and Tower and isolated Intelligence to a route-level unhandled error. The Intelligence ECL reader now wraps its union in a subquery and orders by projected columns, avoiding a PostgreSQL set-operation ordering failure while preserving the serving-view boundary.

Fifth follow-up: the next smoke run accepted all four routes, but the Source route excerpt still showed legacy Source v1 counts because the page honored `sourceProvider` while the cross-product smoke used `provider`. Source now accepts the shared `provider=ecl_projection_db` query key, and the smoke requires the dense ECL Source count signature so legacy Source cannot pass as ECL.

Sixth follow-up: adds a local pre-deploy gate for the same defect class before another ACA deploy loop. The gate checks that the smoke route signatures require dense ECL counts and projection-panel text, that product routes honor the shared `provider=ecl_projection_db` query path, and that the serving-route fence plus Source provider-alias unit test pass locally.

## Layer Impact

- `global-control-lane`: adds proof tooling for shared product QA.
- `products`: validates non-default ECL preview routes only; it does not repoint default providers.
- `client-data-lane`: no source, canonical, commercial, projection, cube, serving, or tenant data is changed by this release.

## Client Applicability

- All clients: no default runtime behavior changes.
- Specific clients: none.
- Internal only: proof tooling for ECL preview validation.
- Public/demo only: none.
- Feature flag: the runner exercises existing `provider=ecl_projection_db` preview routing only.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`
- `src/app/(maestro)/source/preview/workspace/page.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`
- `src/app/(maestro)/home/preview/page.tsx`
- `src/app/(maestro)/tower/page.tsx`
- `src/app/(maestro)/intelligence/page.tsx`
- `src/lib/intelligence/eclContextPackPreview.ts`
- `.github/workflows/aca-main-deploy.yml`
- `infra/azure/parameters/app-runtime.lab.bicepparam`
- `infra/azure/parameters/private-operator.lab.bicepparam`
- `scripts/azure/verify-env-secret-injection-proof.mjs`
- `package.json` script `ecl:product-browser:smoke`
- `package.json` script `ecl:product-browser:predeploy-gate`
- Release record `docs/releases/records/2026-08-24-ecl-product-browser-smoke-runner.md`

## QA / Validation

- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs` — pass.
- `npx eslint src/app/(maestro)/home/preview/page.tsx src/app/(maestro)/tower/page.tsx src/app/(maestro)/intelligence/page.tsx` — pass.
- `npx eslint src/lib/intelligence/eclContextPackPreview.ts` — pass.
- `npx eslint src/app/(maestro)/source/preview/workspace/page.tsx scripts/ecl/run_product_ecl_browser_smoke.mjs` — pass.
- `npx jest --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts --runInBand` — pass.
- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs` — pass.
- `node --check scripts/ecl/run_product_ecl_predeploy_gate.mjs` — pass.
- `npm run ecl:product-browser:predeploy-gate` — pass.
- `git diff --check` — pass.
- `npm run release:check` — pass.
- Signed-in ACA browser proof — first run reached the browser-auth step and was blocked by the Clerk browser ticket path; the runner now prefers the private proof-cookie path before falling back to Clerk tickets.
- Second ACA run reached the deployed browser-smoke image with the private proof-token injected, but the proof archive begin marker was outside the supported log tail after screenshot output. The runner now emits a compact structured status after the archive so the next run can classify the five route steps even if archive extraction is unavailable.
- Third ACA run reached all five steps. Source accepted; Home, Tower, and Intelligence produced route-level findings. These findings are treated as product QA defects, not proof-runner success.
- Fourth ACA run reached all five steps. Home, Source, and Tower accepted. Intelligence rendered the route error boundary; the next run must prove this correction before browser proof can be claimed.
- Fifth ACA run reached all five steps and accepted all four routes, but the Source text excerpt revealed the route still used legacy counts. The Source route and smoke count-signature check are corrected before claiming Source ECL product proof.
- Static env/secret injection proof: `npm run verify:env-secret-injection` verifies the app runtime and private operator include the private proof-token Key Vault secretRef.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image with the private browser proof env/secret binding, then run the private operator job with `--script ecl:product-browser:smoke`, the private browser proof token, and `CLERK_SECRET_KEY` bound from Key Vault. This release does not change default route providers or product traffic.

## Deployment Authority

- Repo-owned deploy workflow: required to publish the script into the runtime image and to apply the private proof env/secret binding.
- Shared runtime mutators: the web runtime receives `ABARVA_PRIVATE_BROWSER_PROOF_ENABLED=1` and `ABARVA_PRIVATE_BROWSER_PROOF_TOKEN=secretref:parallel-run-token`, but only inside the repo-owned ACA main deploy workflow and with the digest-pinned image.
- Approved image digest: resolved by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: required before running the private operator proof job.
- Worker image invariant: required by the deploy workflow when worker jobs are updated.
- ACR build policy: unchanged; the repo-owned Docker Buildx workflow, GitHub Actions cache, Premium registry check, and digest-pinned image contract remain authoritative.
- Feature/env flag update path: repo-owned ACA main deploy workflow only; no ad-hoc shared runtime update is used.
- Live signed-in proof required: yes, for any claim that ECL product preview routes render in the browser.

## Rollback Plan

Revert the PR. The change is proof tooling only and does not mutate data, schemas, provider defaults, or traffic.

## Audit Evidence

- PR URL: to be attached after PR creation.
- Local syntax check: `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs`.
- Future ACA proof output: private operator job summary plus extracted proof bundle.

## Known Gaps

- The runner has not yet completed a live ACA proof after the private proof-cookie fallback; that is the next governed proof step after merge/deploy.
- The runner validates the existing ECL preview routes, not a default-provider cutover.
