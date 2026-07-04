# Product Release Factory Contract

Date: 2026-07-04
Status: governance contract and live-readiness audit companion
Scope: AbarVa Product Dev, Product Preview, Product Prod, and future stamped client private data planes

Machine-readable contract: `docs/azure/PRODUCT_RELEASE_FACTORY_CONTRACT_2026-07-04.json`

Live audit script: `npm run azure:product-release-operational:audit`

Strict live audit script: `npm run azure:product-release-operational:audit:strict`

## Core Rule

Product environments are the factory. Client environments are stamped private deployments.

The product factory owns code quality, release certification, migrations, prompt/template/config versioning, and product evidence. Client environments receive certified product releases plus private client data and configuration. They should not become hand-built snowflakes or permanent code forks.

## Factory Model

| Channel | Azure environment | Purpose | Data rule |
| --- | --- | --- | --- |
| Dev | `sub-abarva-product-dev-eus-001` | Fast engineering integration, feature validation, schema testing, and non-client synthetic/demo data | synthetic, fixture, engineering-test only |
| Preview | `sub-abarva-product-preview-eus-001` | Release candidate, full regression, demo/client proof, and migration rehearsal | synthetic, pilot-reference, client-approved-redacted only |
| Prod | `sub-abarva-product-prod-eus-001` | Certified golden product baseline and approved source for client deployments | production control-plane metadata only |
| Client Preprod | stamped per client | Client-specific release validation, private-data dry run, integration proof, UAT | client-approved test/redacted data only |
| Client Prod | stamped per client | Live client operations | approved client production data only |

Dev can be fast. Preview must be serious. Prod must be boring. Client Prod must never receive random branches, one-off patches, or images that have not passed the product release factory unless an emergency breakglass is explicitly recorded and back-merged.

## Promotion Path

```text
Feature branch
  -> Pull Request
  -> Product Dev deploy
  -> Dev Ready gate
  -> Merge to main
  -> Product Preview release candidate
  -> Preview Ready gate
  -> Product Prod certification
  -> Certified release tag
  -> Client Preprod deploy
  -> Client UAT / data-plane validation
  -> Client Prod deploy
```

The promotion unit is the immutable image digest plus its release manifest. Tags are useful labels; digests are the deployment truth.

## Client Pattern

The default client architecture is:

- same certified product engine
- private client data
- private client configuration
- optional client-specific extensions only when justified

Always private per client:

- client data, files, and source documents
- vector indexes and extracted facts
- tenant context and private prompts/context overlays
- secrets, auth config, logs containing client data
- generated artifacts, decision history, audit trail
- client-specific integrations and retention policy

Usually shared:

- core app code and APIs
- Moves, Source, Intelligence, Tower engines
- document generation framework
- deployment modules and release scripts

Private only when needed:

- regulated client extensions
- custom connectors or artifact templates
- private model gateways
- private network adapters
- contractual custom code

## Release Manifest

Every Product Preview, Product Prod, Client Preprod, and Client Prod promotion must record:

- release version
- Git commit SHA
- container image digest
- migration version
- config version
- prompt pack version
- artifact template version
- feature flags
- test results
- deployment timestamp
- approver
- rollback target

For client environments, add client name, client environment, client config version, client secret source, UAT state, and post-deploy validation state.

## Gate Summary

Dev Ready:

- PR merged or approved
- build, unit tests, typecheck, lint passed
- migrations applied cleanly
- `/api/health` passed
- basic user journey passed

Preview Ready:

- full smoke passed
- Source, Moves, Intelligence, and Tower passed
- tenant isolation passed
- artifact generation passed
- rollback documented or tested
- release notes and known issues documented

Product Prod Certified:

- Preview passed
- release version assigned
- database migration approved
- secrets/config verified
- observability verified
- rollback target known

Client Preprod Ready:

- Product Prod baseline exists
- client config, secrets, data connections, migrations, and feature flags validated
- UAT checklist prepared

Client Prod Ready:

- Client Preprod passed
- client sponsor/UAT approval captured
- backup, rollback, release evidence, and post-deploy validation confirmed

## Current Operational Status Language

Use these terms precisely:

- `release_operational`: current or approved image is deployed, health passes, app boots, secrets resolve, Postgres/storage/search/observability/auth/basic tenant load are proven.
- `provisioned_not_operational`: subscriptions/resources exist, but one or more runtime proof items fail or are stale.
- `not_provisioned`: required resource groups or services do not exist.
- `unknown`: current credentials cannot prove state.

The current product subscriptions should not be called release-operational solely because ACA apps and resource groups exist. Health, image freshness, secrets, database, storage, search, observability, auth, and basic journey proof are the bar.

## Immediate Stabilization Sequence

1. Run `npm run azure:product-release-operational:audit`.
2. Fix Product Dev first until it is `release_operational`.
3. Promote the same release candidate to Product Preview and run full regression.
4. Promote to Product Prod only after Preview is green.
5. Stamp the first client Preprod from the Product Prod certified release.
6. Promote client Prod only after client-specific UAT, data-plane validation, rollback, and approval evidence.

This is not just infrastructure hygiene. It is the operating proof behind AbarVa's own governance promise.
