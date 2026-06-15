# AbarVa Azure Environment Master Tracker

Status date: 2026-06-15

This is the repo-side source of truth for the Azure environment setup backlog. It
keeps the two environment models separate:

- Product/control-plane: Product Dev, Product Preview, Product Prod
- Client private data-plane: Client Preprod, Client Prod

No Azure subscriptions or resources are created by this tracker. Azure mutation
requires `docs/approvals/AZURE_MUTATION_APPROVED.md`.

Human approval request packet:
`docs/azure/PRODUCT_DEV_APPROVAL_REQUEST_2026-06.md`. Approval template:
`docs/approvals/AZURE_MUTATION_APPROVAL_TEMPLATE.md`. Neither file authorizes
Azure mutation by itself.

## Progress Math

| Metric                                       | Value |
| -------------------------------------------- | ----: |
| Total ENV items                              |    22 |
| Complete repo-side items                     |    15 |
| Scaffold-ready / not executed items          |     5 |
| Human-gated Azure execution items            |     2 |
| Strict completion                            | 68.2% |
| Effective progress with scaffold half-credit | 81.6% |
| Product Dev Azure execution                  | 75.0% |

Strict completion counts only `Complete` items. Effective progress counts
`Scaffold-ready` items as half credit and ENV-22 as a partial execution credit.
Human-gated Azure execution remains incomplete until approved baseline controls
are executed and verified.

Product Dev Azure execution is now substantially complete. Subscription
`58eef48c-3ed6-48e6-9af4-de1848ad3401` / `sub-abarva-product-dev-eus-001` has
baseline tags, a tagged control-plane resource group, a secured placeholder Key
Vault, a USD 500 monthly budget with actual/forecasted alerts, a read-only cost
circuit breaker, and a minimal Container Apps runtime smoke baseline with HTTPS
proof. Evidence lives at
`docs/build/azure/2026-06-15-product-dev-finish/summary.md`.

Product Preview execution has started but is blocked by Azure subscription API
throttling. Azure returned `TooManyRequests` twice while creating subscription
alias `sub-abarva-product-preview-eus-001`; no Product Preview subscription or
resources were created. Evidence lives at
`docs/build/azure/2026-06-15-product-preview-execution/summary.md`.

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
| ENV-22 | Actual Azure subscription creation and baseline provisioning | Both    | In progress    |  45 | Founder/Platform      | `docs/build/azure/2026-06-15-product-dev-finish/summary.md`                | ENV-01 through ENV-21  | approval-file review plus Azure exports              | Product Dev subscription/RG/KV/budget/cost guard/runtime smoke done; management group, policy baseline, GitHub secrets, real app deploy, and synthetic rehearsal pending | Yes         |

## Human Approval Queue

The next action is not a broad new environment request. It is a targeted Product
Preview retry after Azure subscription API throttling clears, followed by Product
Dev management-group/policy resolution:

> Retry Product Preview subscription alias creation for
> `sub-abarva-product-preview-eus-001`. If it succeeds, apply Product Preview
> USD 500 budget, tags, provider registration, secured placeholder Key Vault,
> runtime smoke baseline, and evidence exports.

Then:

> Grant or perform management-group placement for subscription
> `58eef48c-3ed6-48e6-9af4-de1848ad3401`, then approve either the management
> group policy baseline or a narrower subscription-level Product Dev policy
> packet. GitHub environment secret wiring and real app deployment should stay
> separate because they require secret values and application-release approval.

Do not request Product Preview, Product Prod, Client Preprod, Client Prod, DNS,
traffic shifts, or client-prod data actions yet.
