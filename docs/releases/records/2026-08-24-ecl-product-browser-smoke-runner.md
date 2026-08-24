# 2026-08-24-ecl-product-browser-smoke-runner — ECL Product Browser Smoke Runner

## Release ID

`2026-08-24-ecl-product-browser-smoke-runner`

## Status

`candidate`

## Plain-English Summary

Adds a narrow signed-in browser smoke runner for the ECL preview provider. It authenticates with the private browser proof cookie when the proof token is available, falls back to Clerk sign-in tickets for local/dev use, pins the active client, opens the Home, Source, Tower, and Intelligence ECL preview routes, captures screenshot and text evidence, and fails on sign-in redirects, empty pages, browser errors, missing expected text, or client-visible builder vocabulary.

Follow-up: the approved ACA main deploy lane now wires the private browser proof route into the web runtime with `ABARVA_PRIVATE_BROWSER_PROOF_ENABLED=1` and `ABARVA_PRIVATE_BROWSER_PROOF_TOKEN=secretref:parallel-run-token`. This is required because the first ACA smoke run failed before product routes on Clerk browser ticket exchange.

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
- `.github/workflows/aca-main-deploy.yml`
- `infra/azure/parameters/app-runtime.lab.bicepparam`
- `scripts/azure/verify-env-secret-injection-proof.mjs`
- `package.json` script `ecl:product-browser:smoke`
- Release record `docs/releases/records/2026-08-24-ecl-product-browser-smoke-runner.md`

## QA / Validation

- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs` — pass.
- `npm run release:check` — pending rerun after this release record correction.
- Signed-in ACA browser proof — first run reached the browser-auth step and was blocked by the Clerk browser ticket path; the runner now prefers the private proof-cookie path before falling back to Clerk tickets.
- Static env/secret injection proof: `npm run verify:env-secret-injection` verifies the app runtime includes the private proof-token Key Vault secretRef.

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
