# 2026-08-03-source-cube-lab-runtime — Source Cube Lab Runtime

## Release ID

`2026-08-03-source-cube-lab-runtime`

## Status

`candidate`

## Plain-English Summary

Adds the first deployable Cube Core runtime for the Source semantic layer in lab. The runtime packages the governed Source cube model, tenant-scoped query rewrite, default drill members, and business drill hierarchies into a separate Azure Container Apps service so downstream analytics can query Source metrics through Cube rather than direct database SQL.

## Layer Impact

- `client-data-lane`: adds a lab semantic-runtime path over already loaded Source data; no raw intake, canonical load, or database mutation is included.
- `internal-admin`: adds a repo-owned lab deployment/proof workflow for the semantic runtime.
- SOURCE ADAPTERS: no intake or raw-load behavior changes.
- CANONICAL MODEL: no canonical data model changes.
- PRODUCTS: no visible Source, Home, Tower, Moves, or Intelligence UI changes in this PR.
- Serving/semantic layer: adds the Cube runtime packaging, lab deploy workflow, and runtime verifier for the Source semantic model.

## Client Applicability

- All clients: no production web behavior change.
- Specific clients: lab semantic runtime is configured for the existing synthetic procurement/Source dataset.
- Internal only: yes, this is a lab runtime and proof workflow.
- Public/demo only: no public route or demo page is added.
- Feature flag: none.

## Changes Included

- `Dockerfile.cube` packages pinned Cube Core with the Source semantic model.
- `.github/workflows/aca-cube-lab-deploy.yml` builds and deploys a separate lab Cube Container App.
- `scripts/source/cube-runtime-entrypoint.mjs` maps the existing database URL secret into Cube Postgres environment variables.
- `scripts/source/verify-source-cube-runtime.mjs` verifies Cube REST API health, auth failure behavior, tenant-scoped queries, and key Source portfolio metrics through Cube.
- `cube/model/source_sourcing.yml` adds default hierarchies and drill members for the Source cubes.
- `scripts/source/verify-source-cube-parity.mjs` now fails if Cube measures lack drill members or expected hierarchies are removed.
- `package.json` adds `source:cube:verify-runtime`.
- Follow-up hardening: the workflow records private Key Vault references but does not read or create vault secrets from GitHub-hosted runners; ACA resolves the database URL through the runtime managed identity.
- Cube-only API and SQL credentials are stored as Container App local secrets, sourced from GitHub secrets when configured and generated at deploy time otherwise. Secret values are masked and are not written to evidence artifacts.
- The deploy workflow recreates only the lab Cube Container App if an earlier failed first-time provision left that Cube service in `Failed` state before the runtime became usable.
- The internal SQL API port update uses an explicit Container App name with the generated ARM payload to satisfy the Azure CLI update contract.
- The internal SQL API port update omits the previous revision suffix from the generated payload so Azure can create the follow-up revision without suffix collision.
- The private-runtime verifier runs the Azure Container App exec command under a pseudo-terminal wrapper so GitHub-hosted runners can satisfy the Azure CLI exec TTY contract while preserving the same in-container Cube API checks.

## QA / Validation

- PASS: Cube model parses as YAML and exposes 8 cubes, 9 views, all expected hierarchies, and drill members on every measure.
- PASS: Cube lab deploy workflow parses as YAML.
- PASS: `git diff --check`.
- PASS: `docker build -f Dockerfile.cube -t abarva-source-cube-runtime:test .`.
- PASS: local container entrypoint fails closed when required runtime secrets are absent.
- PASS: follow-up workflow fix keeps release/deploy authority gates green after removing GitHub-runner Key Vault reads.
- PASS: deploy retry design keeps the production database URL on private Key Vault while bootstrapping Cube-only credentials as non-exported Container App local secrets.
- PASS: deploy retry design handles a failed first-time Cube Container App provision by recreating the separate lab Cube service before reapplying the corrected runtime.
- PASS: deploy retry design corrects the SQL-port update command to provide the required Container App name when applying the generated ingress payload.
- PASS: deploy retry design removes reused revision suffixes from the generated SQL-port payload.
- PASS: deploy retry design wraps the private-runtime exec verifier in a pseudo-terminal so the GitHub runner can invoke Azure CLI exec non-interactively without weakening the Cube API assertions.
- NOT RUN locally: Postgres parity verifier, because this checkout does not contain a lab database URL. The deploy workflow obtains the database URL from Key Vault.

## Rollout Plan

Merge to `main`; the new Cube lab workflow builds `abarva/cube:<main-sha>`, resolves a digest, creates or updates `ca-abarva-cube-lab-eastus`, keeps HTTP ingress internal, configures an internal Cube SQL API TCP port, waits for the revision to become healthy, verifies the digest/private-ingress invariant, and runs the Cube API verifier inside the private runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-cube-lab-deploy.yml`.
- Shared runtime mutators: none for the web app. This creates/updates only the separate lab Cube service.
- Approved image digest: resolved by the Cube lab deploy workflow after merge.
- ACA runtime invariant: workflow verifies the Container App template image and private ingress configuration.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not for this runtime-only PR; later Source UI binding requires signed-in proof.

## Rollback Plan

Disable or revert the Cube lab deploy workflow and remove or roll back `ca-abarva-cube-lab-eastus` to the prior revision. No data rollback is required because this PR does not mutate Source data.

## Audit Evidence

- PR for this release.
- GitHub Actions artifact `aca-cube-lab-deploy-<sha>`.
- Cube runtime verifier output under `audit-artifacts/aca-cube-lab-deploy/cube-runtime-verifier.txt`.
- Runtime invariant output under `audit-artifacts/aca-cube-lab-deploy/runtime-invariant.json`.

## Known Gaps

- Superset binding is not completed in this PR; this PR exposes the internal Cube SQL API port and proves the runtime shape first.
- If GitHub-provided Cube credentials are not configured, the lab deploy generates Cube-only credentials during deployment; Superset binding should use stable managed credentials before broad consumer rollout.
- Native Source workspace binding is not completed in this PR.
- Some Source cubes are contract-ready but intentionally sparse until deeper operational extracts are generated and loaded.
