# AbarVa Azure Cost Circuit Breaker

Status date: 2026-06-14

This is the cost-surge guard for AbarVa Azure environments. It is intentionally
**read-only first**. It queries Azure budgets, computes current and forecast
spend against the budget, writes an evidence report, and tells the operator what
to inspect next.

It does not create, update, stop, delete, scale, pause, or mutate Azure resources.
It does not change RBAC, DNS, secrets, traffic, app revisions, or client
data-plane resources.

## Why This Exists

We are standardizing on a USD 500 monthly budget per environment as the first
guardrail. That budget is a necessary alerting control, but it is not enough by
itself.

**Budgets are alerting controls, not hard spending caps.** Azure will send
notifications when thresholds are crossed, but a rogue process can keep running
unless a human or an approved automation stops it. The circuit breaker gives us
early detection plus a safe, auditable escalation path.

## Scope

The same guard applies across both AbarVa environment models:

- Product/control-plane: Lab, Product Dev, Product Preview, Product Prod
- Client private data-plane: Client Preprod, Client Prod

The first active run covers Lab and Product Dev. Product Preview, Product Prod,
Client Preprod, and Client Prod should be added as their subscriptions are
created.

## Thresholds

| Level  | Trigger                               | Operator response |
| ------ | ------------------------------------- | ----------------- |
| OK     | Current and forecast below 50%        | Continue scheduled monitoring. |
| WATCH  | Current or forecast at or above 50%   | Verify alerts and inspect run-rate. |
| WARN   | Current or forecast at or above 80%   | Inspect top cost drivers and prepare a pause request if needed. |
| BREACH | Current or forecast at or above 100%  | Escalate immediately; pause only nonessential workloads with explicit approval. |

## No automatic shutdown

The circuit breaker deliberately does not shut anything down automatically.
Automatic shutdown can break demos, corrupt in-flight jobs, interrupt migration
or ingestion runs, or affect client-facing paths. The safe default is:

1. Detect the breach.
2. Identify the top cost driver.
3. Ask for an exact approval if a pause/scale-down is needed.
4. Record the action and rollback owner in the execution ledger.

## Human approval required

Any mutation after a cost breach requires explicit approval. Examples:

- Pausing a Container Apps job.
- Scaling a runtime app down.
- Disabling an Azure AI Search indexer.
- Removing a high-cost SKU.
- Changing DNS or traffic.
- Changing RBAC or secrets.

Approval must name the subscription, resource, command, time window, approver,
and rollback owner.

## How To Run

Use the script with explicit subscription labels. Do not hardcode subscription
IDs into the script.

```bash
npm run azure:cost-circuit-breaker:check -- \
  --subscriptions "lab=<lab-subscription-id>,product-dev=<product-dev-subscription-id>" \
  --output docs/build/azure/<run-folder>
```

The script writes:

- `cost-circuit-breaker-report.json`
- `cost-circuit-breaker-report.md`

By default the script exits 0 even on BREACH, because the first response is a
report and escalation. For CI/scheduled guardrails that should fail on breach:

```bash
npm run azure:cost-circuit-breaker:check -- \
  --subscriptions "product-dev=<product-dev-subscription-id>" \
  --fail-on-breach
```

## What The Report Must Show

- Subscription label and subscription name.
- Budget amount.
- Current spend and percent of budget.
- Forecast spend and percent of budget, when Azure provides it.
- Alert contacts.
- Overall status.
- Recommended human next action.

## Protection Stack Beyond Budgets

To protect against a surprise USD 1000+ surge, the budget alert is only layer
one. The full protection stack should include:

1. USD 500 budget per environment with actual and forecast alerts.
2. This read-only circuit breaker report.
3. SKU/location policy for expensive services.
4. Container Apps max replica limits and job timeout limits.
5. Azure AI Search SKU guardrails.
6. AI-provider usage telemetry and per-module spend reporting.
7. Manual pause runbook for nonessential jobs.
8. Weekly cost review until environments stabilize.

## Current Known State

- Lab has been moved to corporate budget contacts and USD 500 monthly budget
  levels, but it may already be above budget because it has been carrying shared
  lab/product runtime.
- Product Dev has its own USD 500 monthly budget and starts with no runtime
  workload beyond the placeholder baseline.
- Product Preview, Product Prod, Client Preprod, and Client Prod should not be
  created or mutated from this process without their own approval records.

## Validation

```bash
npm run azure:cost-circuit-breaker:verify
```

The verifier checks that this guard remains read-only first, that no automatic
mutation commands are present, and that the package scripts are registered.
