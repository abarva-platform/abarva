# Env / Secret-Injection Proof — 2026-06-07

## Status

`repo-proof-green`

## Scope

This proof covers the committed Azure lab/cutover configuration for how
environment variables and secrets are injected into:

- `ca-abarva-web-lab-eastus` via `infra/azure/app-runtime.bicep`
- Container Apps proof / migration jobs via
  `infra/azure/database-migration-job.bicep`
- Lab parameters under `infra/azure/parameters/*.bicepparam`
- Key Vault reader role binding via `infra/azure/key-vault-rbac.bicep`

It is a static, redacted repository proof. It does **not** read Azure Key
Vault values and does **not** print secret values.

## Command

```bash
npm run azure:env-secret-injection:verify
```

Result captured in this branch:

```json
{
  "audit": "env-secret-injection-proof",
  "status": "pass",
  "proofClass": "static-redacted-repo-proof",
  "summary": {
    "pass": 68,
    "fail": 0
  }
}
```

## What the proof asserts

- Container App runtime secrets are declared with
  `keyVaultUrl: secretRef.keyVaultSecretUri`.
- Container App runtime secrets are read through the managed identity, not
  through literal committed values.
- Runtime secret env vars are projected as `secretRef` entries.
- Container Apps Job secret env vars use the same `secretRef` pattern.
- `key-vault-rbac.bicep` references the Key Vault Secrets User role
  definition (`4633458b-17de-408a-b874-0445c86b69e6`).
- The web runtime lab parameters keep these vars Key Vault-backed and out
  of `plainRuntimeEnv`:
  - `CLERK_SECRET_KEY`
  - `DATABASE_URL`
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `DEMO_LOGIN_PASSWORD`
- The private operator proof job keeps `DATABASE_URL` Key Vault-backed.
- Every non-empty `keyVaultSecretRefs` entry in committed Azure parameter
  files carries:
  - `envName`
  - `containerAppSecretName`
  - `keyVaultSecretUri`
- The verifier scans the committed env/secret-injection config for likely
  secret value shapes and emits only truncated findings if a future leak is
  introduced.

## Explicit non-proof

This is not a live Azure observation. In this Cursor Cloud image, `az` is
not installed, so the agent could not inspect the deployed Container App or
current job revision directly. A live operator proof should still observe
the deployed revision's env list and secret references from Azure control
plane output, with all secret values redacted.

## Live proof follow-up

When an Azure-enabled operator environment is available, run a read-only
control-plane observation equivalent to:

```bash
az containerapp show \
  --name ca-abarva-web-lab-eastus \
  --resource-group rg-abarva-controlplane-lab-eastus \
  --query '{name:name,secrets:properties.configuration.secrets[].{name:name,keyVaultUrl:keyVaultUrl,identity:identity},env:properties.template.containers[0].env[].{name:name,hasSecretRef:contains(keys(@), `secretRef`)}}'
```

The output must show secret names, Key Vault URLs, managed identity refs,
and env names only. It must not include Key Vault secret values.
