# Product Subscription Command Packet

Status: draft command packet, non-mutating

This packet prepares the product-development subscription sequence:

1. Product Dev
2. Product Preview
3. Product Prod

It intentionally does **not** create subscriptions. It gives the exact command
shape and evidence capture steps for the approved human/operator run.

## Required Values Before Any Creation

Fill these values in the execution ledger before running a create command:

| Field               | Required for              | Example / rule                              |
| ------------------- | ------------------------- | ------------------------------------------- |
| `billingScope`      | all product subscriptions | Azure billing account or enrollment scope   |
| `managementGroupId` | all product subscriptions | AbarVa product platform management group    |
| `approvedBy`        | all product subscriptions | named human approver                        |
| `approvedAt`        | all product subscriptions | ISO timestamp                               |
| `approvalEvidence`  | all product subscriptions | ticket, email, or signed note               |
| `budgetOwner`       | all product subscriptions | `admin@abarva.ai` or approved finance owner |
| `costCenter`        | all product subscriptions | AbarVa cost center code                     |
| `regionSet`         | all product subscriptions | `eastus`, `eastus2` unless changed by ADR   |

## Product Dev Subscription

Planned display name:

```text
AbarVa Product Dev
```

Planned resource naming prefix:

```text
sub-abarva-product-dev-eus-001
```

Creation command shape, to run only after approval:

```bash
az account alias create \
  --name sub-abarva-product-dev-eus-001 \
  --display-name "AbarVa Product Dev" \
  --billing-scope "<billing-scope>" \
  --workload Production
```

Post-create evidence commands:

```bash
az account show --subscription "<subscription-id>" -o json
az account management-group subscription add \
  --name "<management-group-id>" \
  --subscription "<subscription-id>"
az consumption budget create --help
az policy assignment list --subscription "<subscription-id>" -o table
```

## Product Preview Subscription

Planned display name:

```text
AbarVa Product Preview
```

Planned resource naming prefix:

```text
sub-abarva-product-preview-eus-001
```

Creation command shape, to run only after Product Dev is verified:

```bash
az account alias create \
  --name sub-abarva-product-preview-eus-001 \
  --display-name "AbarVa Product Preview" \
  --billing-scope "<billing-scope>" \
  --workload Production
```

Product Preview must not be used for Product Prod traffic. It is a
release-candidate proof environment.

## Product Prod Subscription

Planned display name:

```text
AbarVa Product Prod
```

Planned resource naming prefix:

```text
sub-abarva-product-prod-eus-001
```

Creation command shape, to run only after Product Preview is verified:

```bash
az account alias create \
  --name sub-abarva-product-prod-eus-001 \
  --display-name "AbarVa Product Prod" \
  --billing-scope "<billing-scope>" \
  --workload Production
```

Product Prod is a shared product control plane. It must not store raw client
private documents or client-specific retrieval stores.

## Baseline Verification After Each Subscription

Run these read-only checks after subscription creation and baseline assignment:

```bash
az account show --subscription "<subscription-id>" -o json
az group list --subscription "<subscription-id>" -o table
az policy state summarize --subscription "<subscription-id>" -o json
az consumption budget list --subscription "<subscription-id>" -o json
az role assignment list --subscription "<subscription-id>" -o json
az monitor diagnostic-settings subscription list --subscription "<subscription-id>" -o json
```

## Stop Conditions

Stop and ask Anand before:

- running `az account alias create`
- assigning Owner or User Access Administrator
- creating or increasing budgets
- creating public DNS
- deploying Product Prod
- shifting Product Prod traffic
- loading any client data
- accepting PHI or PII

## Ledger Update Rule

Every successful command must update
`docs/azure/ENVIRONMENT_EXECUTION_LEDGER_TEMPLATE_2026-06.json` or the copied
execution ledger for that run with:

- command run
- operator
- timestamp
- subscription id
- evidence output path
- rollback or abandon decision
