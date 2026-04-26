# CLOUD5 - Azure Container Apps / VNet IaC Starter

Slice ID: CLOUD5
Slice name: Azure Container Apps / VNet IaC Starter
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane D (parallel build pack)
Depends on: CLOUD1, CLOUD2

## Purpose

CLOUD5 lands a **reference Bicep IaC starter** for a private-VNet
Azure Container Apps lab. It is the first IaC artifact in the
CLOUD track and is marked **STARTER / LAB ONLY** in every file.

CLOUD5 does NOT deploy. It does NOT call the Azure ARM API. It does
NOT require Azure credentials, a real subscription, or a real
tenant. It does NOT promote `production_deployment` or any other
readiness component. It records that the starter has landed and
that the deploy itself remains deferred.

The starter complements the documentation-only blueprint authored
in CLOUD2 by providing a concrete `main.bicep` whose resource
shape matches the blueprint - VNet with two subnets, Container
Apps Environment + Container App, Postgres Flexible Server, Storage
Account, Key Vault, Log Analytics workspace, and three privatelink
DNS zones.

## What Changed

- New starter directory `infra/azure/container-apps-vnet/` containing:
  - `main.bicep` - reference Bicep template. File header marks it
    STARTER / LAB ONLY. All parameters carry `@description(...)`.
    No subscription IDs, tenant IDs, or secrets are embedded.
    Postgres administrator password is intentionally NOT inlined;
    the operator must inject it at deploy time via a Key Vault
    secret reference.
  - `parameters.example.json` - ARM deployment-parameters file with
    `<replace-me>` placeholders for every operator-supplied value
    (`location` is allowed to be `eastus2` as a representative
    sample). No real secrets.
  - `README.md` - explains purpose, what the starter proves vs does
    NOT prove, prerequisites, validation-only commands
    (`az bicep build`, `az deployment group what-if`), and forward
    references to CLOUD2 / CLOUD1 / CLOUD4. `az deployment group
    create` is documented as a forward step only and is marked
    "NOT to be executed from this starter".
- New deterministic test suite
  `src/__tests__/integration/deployment/azure-vnet-iac.test.ts`
  asserting:
  - `main.bicep` exists and declares each required Azure resource
    type (`Microsoft.Network/virtualNetworks`,
    `Microsoft.App/managedEnvironments`,
    `Microsoft.App/containerApps`,
    `Microsoft.DBforPostgreSQL/flexibleServers`,
    `Microsoft.Storage/storageAccounts`,
    `Microsoft.KeyVault/vaults`,
    `Microsoft.OperationalInsights/workspaces`).
  - `main.bicep` declares all 9 required parameters and at least 9
    `@description(...)` annotations.
  - `main.bicep` uses the public hello-world placeholder image and
    references the three privatelink DNS zone names.
  - `main.bicep` contains no `sk-` keys, no GUID-shaped subscription
    or tenant IDs, no literal password assignments outside parameter
    declarations, no PEM private-key blocks.
  - `parameters.example.json` parses as JSON, uses the ARM
    deployment-parameters `$schema`, declares all required keys, and
    every value is `<replace-me>` (or `eastus2` for `location`).
  - `README.md` contains `STARTER`, `LAB`, and `not production`,
    documents the validation-only commands, marks any `az deployment
    group create` reference as NOT to be executed, and cross-
    references CLOUD2 / CLOUD1 / CLOUD4.
- New slice contract
  [docs/build/slices/CLOUD5_AZURE_CONTAINER_APPS_VNET_IAC_STARTER.md](./CLOUD5_AZURE_CONTAINER_APPS_VNET_IAC_STARTER.md)
  (this file).
- `docs/build/build-slices.json` appends a CLOUD5 entry with this
  slice's `allowedFiles`, `forbiddenFiles`, `validationCommands`,
  `dependsOn` (CLOUD1, CLOUD2), `status` `code_complete`, `risk`
  `low`, and `ownerAgent` Lane D. Manifest top-level `lastUpdated`
  is bumped to `2026-04-26`.
- `docs/build/production-readiness.json` updates the
  `production_deployment` component:
  - One UNIONed note row recording that the CLOUD5 Azure Container
    Apps + VNet IaC starter is added.
  - `nextAction` UNIONed conservatively to acknowledge that an
    Azure Bicep starter exists for review and dry-run; prior PROD1
    / PROD2 / PROD3 / PROD4 / OPS1 / TEN1 / TEN2 / CLOUD1 / CLOUD2 /
    OPS2 wording is preserved verbatim.
  - The component `status` is preserved (`blocked`, NOT promoted)
    because no resource has been deployed.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, gate statuses, dimensions, and
    blockers are unchanged.
  - Manifest top-level `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- CLOUD5 does not run `az deployment group create`. It does not
  deploy any Azure resource, does not call ARM, and does not need
  Azure credentials.
- CLOUD5 does not author Terraform, ARM JSON, `azd` templates, or
  shell deploy scripts.
- CLOUD5 does not provision a private container registry, Front
  Door, Application Gateway, WAF, identity provider, bastion, or
  private endpoints. Those are forward steps.
- CLOUD5 does not authenticate against Azure CLI in CI or locally
  as part of validation. The `npm run build` and `npx jest` and
  `npx tsc --noEmit` commands are file-pure.
- CLOUD5 does not promote `production_deployment` or any other
  readiness component. `production_deployment` remains `blocked`.
- CLOUD5 does not modify application code, runtime, auth, the
  Model Gateway, the agent runtime, the evidence ledger, the
  audit ledger, supabase, migrations, package manifests, or
  platform-design docs.
- CLOUD5 does not push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick / merge.

## Why It Is Safe

- The Bicep file is a starter; its file header explicitly says
  "STARTER / LAB ONLY. Not production. Do not deploy without
  review." The README and parameters file echo this stance.
- All 9 parameters are operator-supplied. The Postgres administrator
  password is sourced from Key Vault at deploy time and is never
  embedded in the template. No `sk-` API keys, no GUID-shaped
  subscription or tenant IDs, no literal password values appear
  in the file.
- The placeholder container image is the public Microsoft
  `containerapps-helloworld:latest` image. It is used purely so the
  Container App resource shape compiles; it is not a real workload.
- The deterministic test suite enforces all of the above with regex
  guards over the on-disk file contents. The suite makes no network
  calls.
- The manifest update is append-only at the note / nextAction level
  and does not change any component status, dimension, gate status,
  blocker list, or overall readiness percent. The
  `prod-deploy-verification` blocker remains in place verbatim.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-enterprise-cloud5 && npx tsc --noEmit --pretty false`
2. Run the deterministic test suite:
   `cd /Users/anand/Projects/nexus-enterprise-cloud5 && npx jest src/__tests__/integration/deployment/azure-vnet-iac.test.ts`
3. Run the production build:
   `cd /Users/anand/Projects/nexus-enterprise-cloud5 && npm run build`
   (Next.js symlink panic is acceptable to mitigate; this slice
   does not modify any application code or routes.)
4. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
5. (Optional, requires Azure CLI; not part of CI):
   `az bicep build --file infra/azure/container-apps-vnet/main.bicep`
   for an offline syntax check. No deploy is performed.

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION).
- Readiness / status changes: none. `production_deployment` stays
  `blocked`.
- Blockers added or removed: none. The existing
  `prod-deploy-verification` blocker remains in place.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior PROD1 / PROD2 / PROD3 / PROD4 / OPS1 / TEN1 / TEN2 / CLOUD1
  / CLOUD2 / OPS2 wording).
- Notes added: one row on `production_deployment` recording the
  CLOUD5 Azure Container Apps + VNet IaC starter landing and that
  the deploy itself is deferred.
