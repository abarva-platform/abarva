# 2026-10-01-ecl-live-proof-home-findings-route — Read Home finding checks from the surface that can show them

## Release ID

`2026-10-01-ecl-live-proof-home-findings-route`

## Status

`candidate`

## Plain-English Summary

The product browser proof checks ten declared findings by looking for rows that only the diagnostics findings panel renders. In default-route mode, which is the mode the post-deploy proof runs, the Home finding checks were evaluated on the default Home route. That route does not mount the panel, so those checks could not pass whatever the product did.

This change reads Home's finding checks from the Home diagnostics surface, which does mount the panel, and keeps the default Home route as the route proven for route health, named surfaces and counts. No assertion is removed or loosened.

It also separates three reports that were one. A finding that is not found is reported against the finding and no longer as a failure of the route. A findings surface that does not load is reported as that. An unhealthy route is reported as a route failure. Each of the three still fails the run.

A browser-free contract now refuses any finding check bound to a URL that cannot mount the findings panel. It runs before merge, in both route modes.

## Layer Impact

`global-control-lane`: Layer 4 proof tooling only.

- L4 proof harness: the browser smoke changes where Home's finding checks are read in default-route mode, and how finding misses, route failures and findings-surface load failures are reported.
- L4 product pages: unchanged. No file under `src/` changes, and the findings panel is not mounted anywhere new.
- L1, L2 and L3: unchanged. No tenant data is loaded, rebuilt or read differently.

## Client Applicability

- All clients: no product behavior change.
- Specific clients: none.
- Internal only: yes. The post-deploy proof harness, its pre-deploy gate, and one pull-request check.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_product_ecl_browser_smoke.mjs`: in default-route mode the Home route carries a separate findings surface, the Home diagnostics URL; finding checks are read from it; finding misses leave route issues and are listed under the finding; a findings surface that fails to load is listed under its own name and fails the findings verdict; the assertion contract refuses a finding check whose URL cannot mount the findings panel; the contract report names the route mode it validated; the CLI body is guarded by the shared entry-point predicate so the suite can import the module.
- `scripts/ecl/run_product_ecl_predeploy_gate.mjs`: runs the contract in default-route mode as well as opt-in mode, and requires each report to name its mode and be accepted rather than trusting the exit code alone.
- `scripts/ecl/__tests__/run-ecl-product-browser-smoke-contract-tests.mjs`: new suite for the contract and for the three separate reports.
- `package.json`: `test:ecl-product-browser-smoke-contract`.
- `.github/workflows/ecl-no-stop-data-pipeline.yml`: one early step that runs the contract in both modes and the suite; `scripts/exec/cli-entry.mjs` added to the path filters because the smoke now imports it.
- This release record.

## QA / Validation

- Pass: `npm run test:ecl-product-browser-smoke-contract`, 27 of 27 cases.
- Pass: `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract`, and the same with `--default-routes`.
- Pass: `npm run ecl:product-browser:predeploy-gate`, with both contract commands accepted.
- Pass: the new contract applied to the route table as it was before this change fails in default-route mode with exactly the five Home finding checks, and passes in opt-in mode.
- Pass: mutation checks. Reverting the fix fails the contract in default-route mode and stops the smoke before it launches a browser. Removing the contract's condition, weakening either half of the mount rule, folding finding misses back into route issues, dropping the findings-surface verdict, and disabling the entry-point guard each fail a named case in the suite.
- Pass: the three commands of the new workflow step, run in a copy of the six files they read with no `node_modules`.
- Pass: `npx eslint --max-warnings 0` on the three touched scripts.
- Pass: `npm run test:npm-script-targets` against a tree that contains this change.
- Pass: `npm run audit:test-ci-coverage:check`; the census is identical with and without the workflow change.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Not run: the browser smoke itself. It was not run against the deployed product from this workspace.
- Not run: the Python and Postgres steps of the pull-request workflow. They do not read the files this change touches.

## Rollout Plan

Merge through a pull request to `main`. The pull-request check is active on the pull request itself. The repo-owned ACA main deploy builds the image that carries the updated smoke, and the post-deploy product live proof then runs it from that image. No migration, flag or manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. This change does not alter it.
- Shared runtime mutators: none. No Azure command was run for this change.
- Approved image digest: produced by the repo-owned workflow after merge.
- ACA runtime invariant: unchanged by this change; checked by the existing post-deploy steps.
- Worker image invariant: not changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. The post-deploy product live proof for this change's own deploy is the first evidence. This record must not be marked live-proven before that run.

## Rollback Plan

Revert the pull request and let the repo-owned workflow redeploy. There is no data, schema, flag or runtime configuration to undo. Reverting restores the earlier behavior, in which the Home finding checks cannot pass in default-route mode.

## Audit Evidence

- Pull request and merge SHA.
- The pull-request run of the `ECL no-stop data pipeline` workflow, step `Prove product browser smoke finding-surface contract`.
- The post-deploy product live proof run for this change's deploy: its compact summary, and the browser operator's structured event.
- Local outputs of the commands listed under QA / Validation.

## Known Gaps

- This cannot be proven green before merge. The smoke runs from the deployed image inside the operator job, so the first real evidence is the proof run after this change's own deploy.
- The findings check proves that the diagnostics findings panel is mounted and carries its fixed rows. It does not prove that findings are derived from tenant data.
- The live answer eval has not executed since the browser step began failing, so its current result is unknown. Other Home checks that were hidden behind this failure, such as the counts and the builder-vocabulary scan, may fail for real once it is removed.
- The Home diagnostics surface reads the projection strictly, with no fallback. If that read fails, the findings surface is reported as failed to load, which is a true signal and not a harness fault.
- The contract trusts a declared list of pathnames that mount the findings panel. It does not read product code, so it would not notice the panel being removed from one of them; the live proof would.
- In the compact summary, `default_entry_routes.accepted` is still the overall browser verdict. A finding miss no longer lowers the route count, but that flag and the cutover lane derived from it still read as not accepted. Changing that is a reporting decision and is not made here.
- A missing named surface is still counted as an issue of its route, as before.
- The pre-deploy gate as a whole still runs only in the post-deploy workflow. Only the contract and its suite were added to a pull-request workflow, because the rest of the gate is source-text checks and Jest suites that this pull-request job does not install.
- The eval step's run condition is unchanged, so it is still skipped whenever the browser step fails.
