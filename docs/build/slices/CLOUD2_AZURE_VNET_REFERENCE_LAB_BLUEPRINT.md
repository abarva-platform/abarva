# CLOUD2 - Azure VNet Reference Lab Blueprint

Slice ID: CLOUD2
Slice name: Azure VNet Reference Lab Blueprint
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane F (parallel build pack)
Depends on: TEN1, CLOUD1

## Purpose

CLOUD2 lands a **documentation-only blueprint** for an Azure
Virtual Network reference lab into which the AbarVa application
shell can later be deployed for **private-VNet, no-public-endpoint,
secret-bounded** validation. CLOUD2 produces no Infrastructure-as-
Code, no scripts, no runtime, and no model calls. It is the
canonical specification that a later Terraform / Bicep / `azd`
slice will implement.

CLOUD2 is the second cloud-architecture contract after CLOUD1
(generic deployable-shape contract) and follows the tenant
isolation discipline defined in TEN1. Where TEN1 governs
**logical** tenant isolation at the read-model and request-context
layer, CLOUD2 governs the **physical** network, identity, and
secret boundaries that a deployed AbarVa shell must respect when
validated inside an Azure VNet.

CLOUD2 does NOT promote any production-readiness component, does
NOT change `production_deployment` status, and does NOT claim a
deployed environment exists. It records that the **blueprint** has
landed and that the lab build itself is still deferred.

## What Changed

- New slice contract
  [docs/build/slices/CLOUD2_AZURE_VNET_REFERENCE_LAB_BLUEPRINT.md](./CLOUD2_AZURE_VNET_REFERENCE_LAB_BLUEPRINT.md)
  (this file).
- New architecture document
  [docs/architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md](../../architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md)
  covering:
  - Resource Group layout (single RG per lab environment).
  - VNet CIDR plan with three subnets: app subnet, data subnet,
    private endpoint subnet.
  - Compute: Azure Container Apps (preferred) or Azure App Service
    on a Premium plan with VNet integration (fallback).
  - Data: Azure Database for PostgreSQL Flexible Server fronted by
    a private endpoint in the data subnet.
  - Storage: Azure Blob Storage account with the blob sub-resource
    fronted by a private endpoint.
  - Secrets: Azure Key Vault fronted by a private endpoint and
    accessed via managed identity, with public network access
    disabled.
  - Observability: Log Analytics workspace and Application Insights
    component bound to the workspace.
  - Private ingress options: Azure Front Door Premium with Private
    Link Service to the App container, or Application Gateway with
    WAF on a dedicated subnet.
  - Private DNS zones for `privatelink.postgres.database.azure.com`,
    `privatelink.blob.core.windows.net`, and
    `privatelink.vaultcore.azure.net`, all linked to the lab VNet.
  - Model gateway stub posture (no live model calls in the lab; the
    gateway is contract-only via MG2 / MG3).
  - Environment variable contract: which envs the application
    expects, which secrets live in Key Vault, and which envs are
    injected by the platform vs read from Key Vault references.
  - Lab validation steps: smoke test (app starts, reads env,
    queries PostgreSQL via private endpoint), DB write/read
    round-trip, Blob write/read round-trip, Key Vault secret
    retrieval via managed identity, log emission to Application
    Insights, and a private DNS resolution check from the App
    subnet.
  - Boundaries: what the lab proves and what it does not prove.
  - Progression path to Terraform / Bicep / Azure Developer CLI
    (`azd`) implementation.
  - Cross-references to TEN1 (logical tenant isolation),
    CLOUD1 (generic deployable shape), MG2 / MG3 (Model Gateway
    contract and safe integration), AUD2 (audit events), and PROD3
    / PROD4 (production-readiness live panel and deferred external
    polling).
- `docs/build/build-slices.json` appends a CLOUD2 entry with this
  slice's `allowedFiles`, `forbiddenFiles`, `validationCommands`,
  `dependsOn` (TEN1, CLOUD1), `status` `code_complete`, `risk`
  `low`, and `ownerAgent` Lane F. Manifest top-level `lastUpdated`
  is bumped to `2026-04-26`.
- `docs/build/production-readiness.json` updates the
  `production_deployment` component:
  - One UNIONed note row recording that the CLOUD2 Azure VNet
    reference lab blueprint is added.
  - `nextAction` UNIONed conservatively to acknowledge that an
    Azure VNet reference lab blueprint exists for a later
    Terraform / Bicep / `azd` slice; prior PROD1 / PROD2 / PROD3 /
    OPS1 wording is preserved verbatim.
  - The component `status` is preserved (`blocked`, NOT promoted)
    because the lab itself is not deployed.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, gate statuses, dimensions, and
    blockers are unchanged.
  - Manifest top-level `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- CLOUD2 does not author Terraform, Bicep, ARM, or `azd` templates.
- CLOUD2 does not author shell scripts, `Makefile`s, or CI / CD
  workflow files.
- CLOUD2 does not provision any Azure resource, does not call the
  Azure ARM API, does not invoke `az`, and does not deploy
  anything.
- CLOUD2 does not run a smoke test, does not start a server, does
  not open a browser, and does not use Playwright, Puppeteer, or
  Cypress.
- CLOUD2 does not promote `production_deployment` or any other
  readiness component. `production_deployment` remains `blocked`.
- CLOUD2 does not modify application code, runtime, auth, the
  Model Gateway, the agent runtime, the evidence ledger, the
  audit ledger, supabase, migrations, package manifests, or
  platform-design docs.
- CLOUD2 does not import any model provider, does not call the
  Model Gateway, and does not write any audit-ledger entry.
- CLOUD2 does not push, merge, or open a PR. Lane agents commit
  only; the integration agent owns cherry-pick / merge.

## Why It Is Safe

- Documentation only. No application code, no runtime
  modification, no IaC, no scripts, no migrations, no model calls,
  no live retrieval, no browser automation, no cloud calls.
- The blueprint explicitly names what the lab proves (private VNet
  deployability, no public endpoints, secrets bounded to Key
  Vault, observability path) and what the lab does NOT prove (no
  production scaling, no DR, no multi-region, no live model
  gateway, no production tenant isolation certification).
- The manifest update is append-only at the note / nextAction
  level and does not change any component status, dimension, gate
  status, blocker list, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as prior docs-only slices (QA1-QA7, OPS1, PROD2).

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-big-cloud2 && npx tsc --noEmit --pretty false`
2. Run the production build:
   `cd /Users/anand/Projects/nexus-big-cloud2 && npm run build`
   (Next.js symlink panic is acceptable to mitigate; this slice
   does not modify any application code.)
3. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `production_deployment` (notes append +
  nextAction UNION).
- Readiness / status changes: none. `production_deployment` stays
  `blocked`.
- Blockers added or removed: none. The existing
  `prod-deploy-verification` blocker remains in place.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior PROD1 / PROD2 / PROD3 / OPS1 wording).
- Notes added: one row on `production_deployment` recording the
  CLOUD2 Azure VNet reference lab blueprint landing and that the
  lab build itself is deferred to a later Terraform / Bicep / `azd`
  slice.
