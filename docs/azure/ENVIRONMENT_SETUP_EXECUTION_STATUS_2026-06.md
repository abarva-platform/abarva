# AbarVa Azure Environment Setup Execution Status

Status date: 2026-06-15

## Current Position

The environment factory is ready for controlled execution, but no new Azure
subscriptions have been created from this lane yet. The normalized tracker now
lives in `docs/azure/AZURE_ENVIRONMENT_MASTER_TRACKER_2026-06.md` and is copied
to Downloads for review snapshots. The repo distinguishes between:

- **Complete**: policy/runbook/contract exists and is verifier-backed.
- **Scaffold-ready**: the packet defines what to run and what evidence to
  capture, but no Azure subscription/resource/data action has happened.
- **Execution-gated**: the next step requires explicit human approval because it
  creates spend, changes RBAC, mutates production/client data, changes DNS, or
  shifts production traffic.

The Product Dev approval request was executed in a narrow approved scope.
Product Dev now has a real subscription, cost guardrails, a secured placeholder
Key Vault, and a minimal Container Apps runtime smoke baseline. The latest
evidence lives at
`docs/build/azure/2026-06-15-product-dev-finish/summary.md`.

## Progress Snapshot

| Area                                                          | Status                                           | Percent |
| ------------------------------------------------------------- | ------------------------------------------------ | ------: |
| Environment strategy / operating model                        | Complete                                         |    100% |
| Product 3-subscription model                                  | Complete as factory baseline                     |    100% |
| Client private-plane model                                    | Complete as factory baseline                     |    100% |
| Naming, tagging, budget rules                                 | Complete as baseline                             |    100% |
| Identity / RBAC model                                         | Complete as baseline                             |    100% |
| Subscription vending runbook                                  | Complete as non-mutating runbook                 |    100% |
| Product Preview provisioning packet                           | Complete as repo-side packet, not created        |    100% |
| Product Preview release-candidate gates                       | Complete as repo-side packet, not deployed       |    100% |
| Client private-plane factory                                  | Scaffold-ready, not created                      |     50% |
| Client data onboarding process                                | Scaffold-ready, not run on a client subscription |     50% |
| First client preprod rehearsal packet                         | Scaffold-ready, not executed                     |     50% |
| Client prod go/no-go packet                                   | Scaffold-ready, not executed                     |     50% |
| Operating cadence packet                                      | Scaffold-ready                                   |     50% |
| Actual Azure subscription creation                            | Product Dev created; Preview/Prod/client planes not created |     25% |
| Policy/budget/RBAC/resource provisioning in new subscriptions | Product Dev budget/KV/runtime smoke done; MG/policy/GitHub/app pending |     45% |

Tracker math:

- Total ENV items: 22
- Complete repo-side items: 15
- Scaffold-ready / not executed items: 5
- Human-gated Azure execution items: 2
- Strict completion: 68.2%
- Effective progress with scaffold half-credit: 81.6%
- Product Dev Azure execution: 75.0%

## Autonomous Work Queue

These items can proceed without creating subscriptions or changing live
customer/product traffic:

1. Keep the five-environment execution ledger current and verifier-backed.
2. Keep the Product Preview, client private-plane, rehearsal, go/no-go, and
   operating cadence packets current as design changes land.
3. Prepare Bicep/parameter split for product-dev, product-preview, and
   product-prod without running deployment commands.
4. Maintain what-if command recipes for each subscription baseline.
5. Add deeper policy-assignment manifests and validation scripts when policy
   bundles are selected.
6. Maintain budget/tag/RBAC evidence templates.
7. Maintain post-vending smoke checklist and report templates.
8. Align older release-environment docs that still mention Vercel preview as a
   production-adjacent path with the current Azure-first runtime posture.

## Hard Approval Queue

These must stop for Anand's explicit approval:

1. Create `product-dev` subscription.
2. Move any subscription into a management group.
3. Assign Owner or User Access Administrator.
4. Create or increase Azure budgets.
5. Create public DNS records or change existing DNS.
6. Deploy or shift traffic for Product Prod.
7. Create client-preprod or client-prod subscriptions.
8. Run any client-prod data migration, ingestion, or index refresh.
9. Accept PHI/PII exceptions. Current policy says no.

## Recommended Next Execution Step

Continue in this order:

1. Retry Product Preview subscription creation after Azure subscription API
   throttling clears.
2. Resolve Product Dev management-group access or decide on a narrower
   subscription-level Product Dev policy packet.
3. Keep GitHub environment secret wiring separate because it requires real
   secret values.
4. Keep real AbarVa app deployment and Product Dev synthetic data rehearsal as a
   controlled application-release slice.

The current approval file covers Product Dev and Product Preview only. Do not
use it for Product Prod, Client Preprod, or Client Prod.

## Product Preview Attempt

Product Preview execution was started after Product Dev runtime proof. The
approval file now includes a narrow Product Preview addendum and the Product
Preview budget model was corrected to USD 500/month.

Azure returned `TooManyRequests` twice when creating subscription alias
`sub-abarva-product-preview-eus-001`. No Product Preview subscription or
resources were created. Evidence lives at
`docs/build/azure/2026-06-15-product-preview-execution/summary.md`.

Next safe step: retry Product Preview subscription creation after Azure
subscription API throttling clears.
