# AbarVa Azure Cost Circuit Breaker Report

Generated: 2026-06-15T02:35:15.616Z

This is a read-only cost guard. It queries Azure budgets and emits evidence. It does not create, update, stop, delete, scale, pause, or mutate Azure resources.

Budgets are alerting controls, not hard spending caps. Real surge protection also needs quota, policy, SKU, scaling, job-timeout, and human-approved pause controls.

## Overall

- Status: BREACH
- Subscriptions checked: 2
- Counts: {"BREACH":1,"OK":1}

## Recommended Actions

- Notify admin@abarva.ai and alerts@abarva.ai.
- Review cost analysis by service and resource group.
- Pause nonessential jobs only after explicit human approval.
- Do not delete resources or rotate secrets as an automated cost action.

## Subscription Results

| Label | Subscription | Status | Budget | Current | Forecast | Alerts |
| --- | --- | --- | ---: | ---: | ---: | --- |
| lab | abarva-lab-sub | BREACH | $500.00 | $646.27 (129.3%) | $1139.91 (228%) | alerts@abarva.ai, admin@abarva.ai |
| lab | abarva-lab-sub | BREACH | $500.00 | $646.27 (129.3%) | $1139.91 (228%) | alerts@abarva.ai, admin@abarva.ai |
| product-dev | sub-abarva-product-dev-eus-001 | OK | $500.00 | $0.00 (0%) | n/a | admin@abarva.ai |

## Manual Escalation Path

1. Confirm the subscription and budget in Azure Cost Management.
2. Identify the top service/resource group cost driver.
3. If the cost driver is a nonessential job, prepare a one-line human approval request to pause it.
4. If the cost driver is production/client runtime, escalate before taking any action.
5. Record the action and reversal owner in the environment execution ledger.

## Explicit Non-Actions

- No automatic deletion.
- No automatic resource scaling.
- No automatic job disablement.
- No secret or RBAC changes.
- No DNS or traffic changes.

