# 2026-06-07-env-secret-injection-proof — Env / Secret-Injection Proof

## Release ID

`2026-06-07-env-secret-injection-proof`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic, redacted proof that the Azure lab/cutover configuration
injects sensitive environment variables through Container Apps `secretRef`
entries backed by Key Vault, instead of committing or projecting literal secret
values as plain runtime env. The proof can be rerun locally without Azure
credentials and records its limits honestly: it proves committed configuration,
not the live deployed Azure revision.

## Layer Impact

`global-control-lane`: adds release/cutover verification tooling and evidence
for shared Azure runtime/job configuration. There is no application route,
database schema, tenant data, model-provider, or auth behavior change.

## Client Applicability

- All clients: applies to the shared Azure control-lane secret-injection
  posture and operator evidence.
- Specific clients: none.
- Internal only: used by AbarVa operators and agents during cutover/release
  validation.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/azure/verify-env-secret-injection-proof.mjs`
- `package.json` command:
  `npm run azure:env-secret-injection:verify`
- `docs/build/cutover/ENV_SECRET_INJECTION_PROOF_2026-06-07.md`
- `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md`
- `docs/releases/records/2026-06-07-env-secret-injection-proof.md`

## QA / Validation

- Pass: `npm run azure:env-secret-injection:verify`
  - Result: `68` pass, `0` fail
  - Proof class: `static-redacted-repo-proof`

## Rollout Plan

Merge to `main`. The verifier and proof docs become available to operators and
future CI/manual release checks. There is no runtime deploy, migration, feature
flag, Key Vault mutation, DNS change, or Container App revision rollout in this
release.

## Rollback Plan

Revert the PR if the verifier scope or evidence wording is incorrect. No data,
secret, runtime, or infrastructure rollback is required because the change does
not mutate Azure resources or secret values.

## Audit Evidence

- PR URL after opening.
- Local verifier output from `npm run azure:env-secret-injection:verify`.
- `docs/build/cutover/ENV_SECRET_INJECTION_PROOF_2026-06-07.md`.
- `docs/build/cutover/AZURE_CUTOVER_PROOF_2026-06-07.md` Step 10.

## Known Gaps

- This is not a live Azure control-plane observation. The agent image used for
  this release did not have `az` installed, so a live operator should still
  inspect deployed Container App/job revision metadata with secret values
  redacted.
