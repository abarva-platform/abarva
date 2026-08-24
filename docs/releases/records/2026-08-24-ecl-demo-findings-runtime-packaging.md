# 2026-08-24-ecl-demo-findings-runtime-packaging — ECL Demo Findings Runtime Packaging

## Release ID

`2026-08-24-ecl-demo-findings-runtime-packaging`

## Status

`candidate`

## Plain-English Summary

The deployed ECL product browser smoke needs the committed demo findings contract to verify that the ten named findings render on their intended preview surfaces. This change includes that single JSON contract in the Docker build context and runtime image, instead of excluding it with the rest of the documentation tree.

## Layer Impact

- Layer 4 product QA: the deployed private browser smoke can validate the same F1-F10 findings contract that local predeploy validation reads.
- No data-plane mutation: no source, context, commercial, review, projection, cube, or serving data changes.
- No route cutover: this does not repoint any default provider.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: AbarVa product/lab QA operators and agents.
- Public/demo only: synthetic assessment preview proof for the Meridian reference dataset.
- Feature flag: none.

## Changes Included

- `.dockerignore`: allow `docs/architecture/meridian-demo-findings-20260824.json` into the Docker build context.
- `Dockerfile`: copy that JSON file into the runtime image beside the existing runtime architecture assets.
- Release record for the runtime packaging fix.

## QA / Validation

- pass: `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract`
- pass: `npm run ecl:product-browser:predeploy-gate`
- pass: `git diff --check`
- pass: `git check-ignore -v docs/architecture/meridian-demo-findings-20260824.json` returns no ignore rule, proving the file is no longer excluded from Docker context.
- blocked until merge/deploy: digest-pinned ACA deploy and private operator browser smoke rerun.
- not-run: Docker image build locally; the repo-owned ACA main deploy workflow is the approved build path.

## Rollout Plan

Merge through PR, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then rerun the private ECL product browser smoke against `?provider=ecl_projection_db`.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none outside the repo-owned ACA deploy workflow.
- Approved image digest: assigned by the repo-owned ACA deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed proof.
- Worker image invariant: required before claiming deployed proof.
- Feature/env flag update path: none.
- Live signed-in proof required: private operator browser smoke must pass before claiming findings are demonstrable on rendered surfaces.

## Rollback Plan

Revert this packaging change and redeploy through the repo-owned ACA main deploy workflow. Product runtime behavior is otherwise unchanged; the affected capability is the deployed smoke script's ability to read the findings contract.

## Audit Evidence

- Prior private browser smoke failed before navigation because the runtime image could not open `docs/architecture/meridian-demo-findings-20260824.json`.
- Predeploy gate output from this PR.
- ACA deploy workflow evidence after merge.
- Private operator browser smoke output after redeploy.

## Known Gaps

Default-provider cutover remains out of scope. This release only fixes runtime packaging for the non-default ECL preview proof.
