# AbarVa Azure Environment Setup Execution Status

Status date: 2026-06-13

## Current Position

The environment factory is ready for controlled execution, but no new Azure
subscriptions have been created from this lane yet. The repo now distinguishes
between:

- **Complete**: policy/runbook/contract exists and is verifier-backed.
- **Scaffold-ready**: the packet defines what to run and what evidence to
  capture, but no Azure subscription/resource/data action has happened.
- **Execution-gated**: the next step requires explicit human approval because it
  creates spend, changes RBAC, mutates production/client data, changes DNS, or
  shifts production traffic.

## Progress Snapshot

| Area                                                          | Status                                           | Percent |
| ------------------------------------------------------------- | ------------------------------------------------ | ------: |
| Environment strategy / operating model                        | Complete                                         |    100% |
| Product 3-subscription model                                  | Complete as factory baseline                     |    100% |
| Client private-plane model                                    | Complete as factory baseline                     |    100% |
| Naming, tagging, budget rules                                 | Complete as baseline                             |    100% |
| Identity / RBAC model                                         | Complete as baseline                             |    100% |
| Subscription vending runbook                                  | Complete as non-mutating runbook                 |    100% |
| Product Preview provisioning packet                           | Scaffold-ready, not created                      |     50% |
| Product Preview release-candidate gates                       | Scaffold-ready, not deployed                     |     50% |
| Client private-plane factory                                  | Scaffold-ready, not created                      |     50% |
| Client data onboarding process                                | Scaffold-ready, not run on a client subscription |     50% |
| First client preprod rehearsal packet                         | Scaffold-ready, not executed                     |     50% |
| Client prod go/no-go packet                                   | Scaffold-ready, not executed                     |     50% |
| Operating cadence packet                                      | Scaffold-ready                                   |     50% |
| Actual Azure subscription creation                            | Execution-gated, not started                     |      0% |
| Policy/budget/RBAC/resource provisioning in new subscriptions | Execution-gated, not started                     |      0% |

Tracker math:

- Total ENV items: 22
- Complete: 7
- Scaffold-ready: 15
- Planned: 0
- Strict completion: 31.8%
- Effective progress with scaffold half-credit: 65.9%

## Autonomous Work Queue

These items can proceed without creating subscriptions or changing live
customer/product traffic:

1. Keep the five-environment execution ledger current and verifier-backed.
2. Prepare subscription vending command packets with placeholders only.
3. Prepare Bicep/parameter split for product-dev, product-preview, and
   product-prod without running `az deployment group create`.
4. Add what-if command recipes for each subscription baseline.
5. Add policy-assignment manifests and validation scripts.
6. Add budget/tag/RBAC evidence templates.
7. Add post-vending smoke checklist and report templates.
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

Proceed with **ENV-EXEC-02: product subscription command packet**:

- Generate non-mutating command templates for product-dev, product-preview, and
  product-prod.
- Include exact placeholders for billing scope, management group, budget owner,
  cost center, region, and approval evidence.
- Include `what-if` and verification commands only.
- Do not create subscriptions.

After that packet is merged, ask Anand for the narrow approval to create
`product-dev` only.
