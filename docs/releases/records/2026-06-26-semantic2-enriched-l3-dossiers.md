# 2026-06-26-semantic2-enriched-l3-dossiers — Enriched L3 Dossier Builder

## Release ID

`2026-06-26-semantic2-enriched-l3-dossiers`

## Status

`candidate`

## Plain-English Summary

Adds a controlled builder for enriched L3 dossiers across every tenant and every Semantic2 dimension. The builder creates a deterministic, cited skeleton from typed Semantic2 tables, then asks Claude at build time for grounded derived insights that must cite the selected facts. The output is stored under a new prompt version and is not wired into Home, Intelligence, Source, Moves, Tower, or aVa in this release.

## Layer Impact

- `client-data-lane`: adds a reversible build process that writes a new version of rows into `semantic2_dossiers` without deleting or invalidating the current runtime dossier version.
- `global-control-lane`: adds a shared script and package command for all tenants/dimensions; the logic is universal and keyed by tenant plus dimension, not by client-specific code.

## Client Applicability

- All clients: yes, when the builder is run with `--apply`.
- Specific clients: none.
- Internal only: operator/build tooling only until a later human-approved surface-wiring task.
- Public/demo only: no.
- Feature flag: no surface flag in this release; the new prompt version is inert until read paths request it.

## Changes Included

- `scripts/semantic2/build-enriched-l3-dossiers.mjs`
- `package.json` commands:
  - `semantic2:l3-dossiers:self-test`
  - `semantic2:l3-dossiers:build`

## QA / Validation

- PASS: `npm run semantic2:l3-dossiers:self-test`
- PASS: focused ESLint on `scripts/semantic2/build-enriched-l3-dossiers.mjs` after unused-import cleanup.
- PENDING: `npm run release:check` is rerun after this record is updated.
- PENDING: Private ACA/VNet run with `DATABASE_URL` and `ANTHROPIC_API_KEY` projected from Key Vault.
- PENDING: Outcome bundle in `~/Downloads/abarva-dossier-build-<UTC-ts>/` with sample dossier, build report, insight catalog, validation summary, and outcome report.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA workflow so the script is present in the runtime image, then run a one-off private Container Apps job using the deployed image. The job runs `node scripts/semantic2/build-enriched-l3-dossiers.mjs --apply --emit-file-bundle` inside the VNet.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: one-off Container Apps job only, using the deployed image and Key Vault-backed secrets.
- Approved image digest: captured after ACA deployment.
- ACA runtime invariant: required if deployment is performed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this release because no surface is wired to the new dossier version.

## Rollback Plan

No current runtime path reads the new prompt version. To roll back the data-plane build, set `invalidated_at = now()` for rows where `prompt_version = 'semantic2-l3-enriched-buildtime-claude-v1'`. Existing production dossier rows remain untouched.

## Audit Evidence

- PR and CI once opened.
- ACA deploy run and active revision once deployed.
- Private job execution logs.
- Download bundle with `SAMPLE_DOSSIER.json`, `SAMPLE_DOSSIER.md`, `dossier-build-report.md/.csv`, `insights-catalog.md`, `OUTCOME_REPORT.md`, and `validation-summary.csv`.

## Known Gaps

- This release intentionally stops at the human gate. It does not wire any product surface to the new L3 dossiers.
