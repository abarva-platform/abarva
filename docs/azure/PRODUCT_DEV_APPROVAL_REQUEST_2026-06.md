# Product Dev Azure Approval Request

Status: ready for human review. Non-mutating request packet.

This packet is the narrow approval request for the first real Azure environment
execution step: Product Dev only. It does not create subscriptions or resources.
Actual mutation remains blocked unless `docs/approvals/AZURE_MUTATION_APPROVED.md`
exists and is fully populated.

## Scope Requested

| Item                    | Requested approval                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| Environment model       | AbarVa product/control-plane                                         |
| Environment             | Product Dev                                                          |
| Subscription authority  | Create or use one Product Dev subscription                           |
| Management group target | AbarVa product management group                                      |
| Region                  | Approved Azure region from environment factory                       |
| Budget                  | Product Dev baseline budget from the cost-control packet             |
| RBAC                    | Least-privilege platform/release/security groups from the RBAC model |
| Policy                  | Baseline product policy bundle only                                  |
| Networking              | Product Dev network posture only; no client private-plane peering    |
| Secrets                 | Key Vault placeholders only; no secret values in repo                |
| Evidence                | Execution ledger, Azure exports, and what-if outputs                 |

## Explicit Exclusions

This request does not approve:

- Product Preview or Product Prod subscription creation.
- Client Preprod or Client Prod subscription creation.
- DNS changes.
- Production traffic shifts.
- Broad Owner grants outside the approved bootstrap executor.
- Client production data actions.
- PHI/PII handling exceptions.
- Secret values in repository files, chat, issue comments, or PR bodies.
- Any command outside the approved command list.

## Approved Command Families To Consider

These are examples for the human approval file. They are not approved until they
appear in `docs/approvals/AZURE_MUTATION_APPROVED.md`.

```text
az account alias create
az account set
az deployment sub what-if
az deployment sub create
az policy assignment create
az role assignment create
az consumption budget create
az monitor diagnostic-settings create
az keyvault create
az group create
az resource tag
```

## Required Preflight Before Execution

- Confirm the approval file exists and contains no placeholders.
- Confirm the approved time window is active.
- Confirm Product Dev is the only approved environment.
- Confirm the active Azure account and tenant match the approval.
- Run validation scripts:
  - `npm run azure:environment-vending:verify`
  - `npm run azure:environment-rbac:verify`
  - `npm run azure:environment-cost-controls:verify`
  - `npm run azure:product-dev-provisioning:verify`
  - `npm run azure:product-baseline-whatif:verify`
- Create a fresh execution evidence folder under `docs/build/azure/`.

## Execution Sequence After Approval

1. Confirm approval file and active Azure context.
2. Create or select the Product Dev subscription.
3. Attach it to the approved management group.
4. Apply baseline tags.
5. Apply Product Dev budget and alert thresholds.
6. Apply least-privilege RBAC.
7. Apply baseline policy assignments.
8. Run subscription-level what-if for Product Dev foundation.
9. Apply Product Dev foundation only if what-if matches the packet.
10. Export evidence: subscription, tags, policy, RBAC, budget, and diagnostics.
11. Update the execution ledger and master tracker.

## Stop Conditions

Stop and ask Anand before:

- Any unapproved environment is needed.
- Any command outside the approval file is needed.
- Any policy or RBAC assignment would grant broader rights than the packet.
- Any monthly spend ceiling would be exceeded.
- Any secret value is required.
- Any client private-plane resource becomes necessary.
- Any DNS, certificate, or traffic change is proposed.

## Evidence To Produce

| Evidence               | Location                                                   |
| ---------------------- | ---------------------------------------------------------- |
| Approval file snapshot | `docs/approvals/AZURE_MUTATION_APPROVED.md`                |
| Execution ledger       | `docs/build/azure/<date>-product-dev-execution/`           |
| What-if output         | `docs/build/azure/<date>-product-dev-execution/what-if/`   |
| Azure exports          | `docs/build/azure/<date>-product-dev-execution/exports/`   |
| Validation summary     | `docs/build/azure/<date>-product-dev-execution/summary.md` |

## Current Recommendation

Approve Product Dev only first. Treat it as a rehearsal for Product Preview and
Product Prod, but do not bundle those environments into the same approval.
