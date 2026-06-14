# AbarVa Azure Environment Master Tracker

Status date: 2026-06-14

This is the repo-side source of truth for the Azure environment setup backlog. It
keeps the two environment models separate:

- Product/control-plane: Product Dev, Product Preview, Product Prod
- Client private data-plane: Client Preprod, Client Prod

No Azure subscriptions or resources are created by this tracker. Azure mutation
requires `docs/approvals/AZURE_MUTATION_APPROVED.md`.

## Progress Math

| Metric                                       | Value |
| -------------------------------------------- | ----: |
| Total ENV items                              |    22 |
| Complete repo-side items                     |    15 |
| Scaffold-ready / not executed items          |     5 |
| Human-gated Azure execution items            |     2 |
| Strict completion                            | 68.2% |
| Effective progress with scaffold half-credit | 79.5% |

Strict completion counts only `Complete` items. Effective progress counts
`Scaffold-ready` items as half credit. Human-gated Azure execution remains 0
until approved and executed.

## Tracker

| ID     | Area                                                         | Model   | Status         |   % | Owner                 | Artifact path                                                              | Dependencies           | Validation                                           | Blocker                                 | Human-gated |
| ------ | ------------------------------------------------------------ | ------- | -------------- | --: | --------------------- | -------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------- | --------------------------------------- | ----------- |
| ENV-01 | Environment strategy / operating model                       | Both    | Complete       | 100 | Founder/Product       | `docs/azure/ABARVA_ENVIRONMENT_FACTORY_2026-06.md`                         | none                   | `npm run azure:environment-factory:verify`           | none                                    | No          |
| ENV-02 | Product 3-subscription model                                 | Product | Complete       | 100 | Platform              | `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`                     | ENV-01                 | `npm run azure:environment-factory:verify`           | none                                    | No          |
| ENV-03 | Client private-plane model                                   | Client  | Complete       | 100 | Platform/Security     | `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`                     | ENV-01                 | `npm run azure:environment-factory:verify`           | none                                    | No          |
| ENV-04 | Naming, tagging, budget rules                                | Both    | Complete       | 100 | Platform/Finance      | `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.md`                 | ENV-01                 | `npm run azure:environment-cost-controls:verify`     | none                                    | No          |
| ENV-05 | Identity / RBAC model                                        | Both    | Complete       | 100 | Security/Platform     | `docs/azure/ENVIRONMENT_IDENTITY_RBAC_MODEL_2026-06.md`                    | ENV-01                 | `npm run azure:environment-rbac:verify`              | none                                    | No          |
| ENV-06 | Subscription vending runbook                                 | Both    | Complete       | 100 | Platform              | `docs/azure/ENVIRONMENT_SUBSCRIPTION_VENDING_RUNBOOK_2026-06.md`           | ENV-01                 | `npm run azure:environment-vending:verify`           | none                                    | No          |
| ENV-07 | Baseline environment factory design                          | Both    | Complete       | 100 | Platform              | `docs/azure/ENVIRONMENT_FACTORY_MANIFEST_2026-06.json`                     | ENV-01                 | `npm run azure:environment-factory:verify`           | none                                    | No          |
| ENV-08 | Product Dev provisioning packet                              | Product | Complete       | 100 | Platform              | `docs/azure/PRODUCT_DEV_PROVISIONING_PACKET_2026-06.md`                    | ENV-02                 | `npm run azure:product-dev-provisioning:verify`      | actual subscription not created         | No          |
| ENV-09 | Product Dev CI/CD packet                                     | Product | Complete       | 100 | Release               | `docs/azure/PRODUCT_DEV_CICD_PACKET_2026-06.md`                            | ENV-08                 | `npm run azure:product-dev-cicd:verify`              | GitHub env secrets not changed          | No          |
| ENV-10 | Product Dev synthetic data baseline                          | Product | Complete       | 100 | Data/Product          | `docs/azure/PRODUCT_DEV_SYNTHETIC_DATA_BASELINE_2026-06.md`                | ENV-08                 | `npm run azure:product-dev-synthetic-data:verify`    | no real load run                        | No          |
| ENV-11 | Product Preview provisioning packet                          | Product | Complete       | 100 | Platform              | `docs/environments/product-preview/provisioning-packet.md`                 | ENV-02                 | `npm run azure:product-preview-provisioning:verify`  | actual subscription not created         | No          |
| ENV-12 | Product Preview release-candidate gates                      | Product | Complete       | 100 | Release/Product       | `docs/release/product-preview-rc-gates.md`                                 | ENV-11                 | `npm run azure:product-preview-rc-gates:verify`      | no release candidate deployed           | No          |
| ENV-13 | Product Preview E2E rehearsal                                | Product | Scaffold-ready |  50 | QA/Release            | `docs/azure/PRODUCT_PREVIEW_E2E_REHEARSAL_2026-06.md`                      | ENV-11, ENV-12         | `npm run azure:product-preview-e2e-rehearsal:verify` | not executed on Product Preview         | No          |
| ENV-14 | Product Prod provisioning packet                             | Product | Complete       | 100 | Platform              | `docs/azure/PRODUCT_PROD_PROVISIONING_PACKET_2026-06.md`                   | ENV-12                 | `npm run azure:product-prod-provisioning:verify`     | actual subscription not created         | No          |
| ENV-15 | Product Prod cutover packet                                  | Product | Complete       | 100 | Release/Security      | `docs/azure/PRODUCT_PROD_CUTOVER_PACKET_2026-06.md`                        | ENV-14                 | `npm run azure:product-prod-cutover:verify`          | Product Prod not deployed/cut over      | Yes         |
| ENV-16 | Product baseline what-if packet                              | Product | Complete       | 100 | Platform              | `docs/azure/PRODUCT_BASELINE_WHATIF_PACKET_2026-06.md`                     | ENV-08, ENV-11, ENV-14 | `npm run azure:product-baseline-whatif:verify`       | no approved subscription ids yet        | No          |
| ENV-17 | Client private-plane factory                                 | Client  | Scaffold-ready |  50 | Platform/Security     | `docs/environments/client-private-plane/factory.md`                        | ENV-03, ENV-04, ENV-05 | `npm run azure:client-private-plane-factory:verify`  | client subscriptions not created        | No          |
| ENV-18 | Client data onboarding process                               | Client  | Scaffold-ready |  50 | Data/Security         | `docs/environments/client-private-plane/data-onboarding.md`                | ENV-17                 | `npm run azure:client-data-onboarding:verify`        | not run on real client subscription     | No          |
| ENV-19 | First client preprod rehearsal packet                        | Client  | Scaffold-ready |  50 | QA/Client owner       | `docs/environments/client-private-plane/first-client-preprod-rehearsal.md` | ENV-17, ENV-18         | `npm run azure:client-preprod-rehearsal:verify`      | rehearsal not executed                  | No          |
| ENV-20 | Client prod go/no-go packet                                  | Client  | Scaffold-ready |  50 | Client owner/Security | `docs/environments/client-private-plane/client-prod-go-no-go.md`           | ENV-19                 | `npm run azure:client-prod-go-no-go:verify`          | client prod not executed                | Yes         |
| ENV-21 | Operating cadence packet                                     | Both    | Scaffold-ready |  50 | Founder/Platform      | `docs/operating-model/azure-environment-cadence.md`                        | ENV-01                 | `npm run azure:operating-cadence:verify`             | cadence not yet run as operating ritual | No          |
| ENV-22 | Actual Azure subscription creation and baseline provisioning | Both    | Human-gated    |   0 | Founder/Platform      | `docs/approvals/AZURE_MUTATION_APPROVED.md`                                | ENV-01 through ENV-21  | approval-file review plus Azure exports              | no approval file; no mutation allowed   | Yes         |

## Human Approval Queue

The next human approval request, when Anand is ready, should be narrow:

> Approve creation of Product Dev only, including subscription vending,
> management group placement, budget, baseline policy assignments, least
> privilege RBAC, and validation exports during a named time window.

Do not request Product Preview, Product Prod, Client Preprod, Client Prod, DNS,
traffic shifts, or client-prod data actions in the first approval.
