# Product Baseline What-If Packet

Status: non-mutating scaffold

This packet makes the next Azure environment step executable without creating
anything. It covers only the product subscriptions:

1. `product-dev`
2. `product-preview`
3. `product-prod`

It is deliberately preflight-only. Do not create subscriptions, assign RBAC,
create budgets, deploy resources, change DNS, or shift traffic from this
packet. Those actions still require a separate approval request.

Verifier: `npm run azure:product-baseline-whatif:verify`

## Purpose

The goal is to let an Azure operator produce a repeatable evidence bundle before
the first subscription is created or before a newly created subscription is used:

- policy-assignment plan
- budget proof
- RBAC proof
- tag proof
- Bicep what-if output
- execution-ledger link

This closes a gap between the operating model and actual subscription vending:
we can now say exactly what evidence must exist before an environment is treated
as ready for workload deployment.

## Hard Stops

Pause for Anand before:

- running `az account alias create`
- moving a subscription into a management group
- assigning Owner or User Access Administrator
- creating or increasing an Azure budget
- running `az deployment sub create`
- running `az deployment group create`
- deploying or shifting Product Prod traffic
- changing DNS
- loading client data
- accepting PHI or PII

## What-If Sequence

Run the environments in this order only:

1. `product-dev`
2. `product-preview`
3. `product-prod`

For each environment:

1. Confirm the execution ledger has an explicit approval reference or a
   placeholder that says approval is still required.
2. Confirm the subscription id is either a placeholder or a real id from an
   already-approved subscription creation.
3. Generate the environment tag parameter file from the provisioning packet.
4. Run subscription-scope `what-if` against the foundation template.
5. Run subscription-scope `what-if` against the app-runtime foundation template.
6. Export budget, policy, RBAC, and tag evidence if the subscription already
   exists.
7. Attach all outputs to the execution ledger.

## Command Shapes

These are templates only. Do not run against a real subscription unless the
ledger has approval for that environment.

```bash
az account set --subscription "<product-env-subscription-id>"
```

```bash
az deployment sub what-if \
  --location eastus \
  --template-file infra/azure/foundation.bicep \
  --parameters tags="@<generated-product-env-tags.json>"
```

```bash
az deployment sub what-if \
  --location eastus \
  --template-file infra/azure/app-runtime-foundation.bicep \
  --parameters tags="@<generated-product-env-tags.json>"
```

```bash
az policy assignment list --subscription "<product-env-subscription-id>" -o json
az consumption budget list --subscription "<product-env-subscription-id>" -o json
az role assignment list --subscription "<product-env-subscription-id>" -o json
az resource list --subscription "<product-env-subscription-id>" --query "[].{id:id,name:name,type:type,tags:tags}" -o json
```

## Evidence Bundle

Each environment's bundle must include:

- `what_if_foundation_json`
- `what_if_app_runtime_json`
- `policy_assignment_export`
- `budget_export`
- `rbac_export`
- `tag_export`
- `execution_ledger_reference`

Product Preview must also include `release_candidate_gate_export`.

Product Prod must also include `rollback_plan_export` and the explicit public
cutover approval placeholder.

## Completion Bar

This packet is complete when the verifier passes and the execution ledger points
to this packet as the baseline for product environment what-if evidence.

It does not make any Azure subscription complete. A subscription is complete
only when the approved execution ledger says `verified` and has real evidence
for subscription, policy, budget, RBAC, tags, diagnostics, workload health, and
rollback.
