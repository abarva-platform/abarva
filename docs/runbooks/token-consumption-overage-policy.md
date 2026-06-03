# Token Consumption Overage Policy Runbook

Mapped backlog row: `T059`.

This runbook tells AbarVa operators how to handle client model-token usage
before a pilot crosses its contracted allowance. It is a commercial and
operations control. It does not grant legal approval, change a signed SOW, or
deploy runtime cap configuration by itself.

## Default Policy

| Control | Default posture |
| --- | --- |
| Included pilot allowance | 50M model tokens per client per month. |
| Default overage rate | `$18` per 1M additional tokens. |
| Hard-cap posture | Block or rate-limit new model calls when the contracted cap is reached unless approved overage is active. |
| Client notification | Notify the client admin before material overage is incurred. |
| Approval owner | Founder or delegated commercial owner. |
| Evidence owner | Account owner or operations owner. |

## Usage Surfaces

The cap applies to client-scoped model usage across:

- agent chat and reasoning requests;
- retrieval-augmented answers;
- summaries and generated artifacts;
- Source, Moves, Atlas, Sentinel, and admin-assisted analysis flows;
- batch jobs or background generation that call model providers.

Document parsing, Azure infrastructure, storage, vector/search indexing,
premium support, direct connectors, and custom corpus work are tracked
separately when material.

## Threshold Workflow

| Trigger | Action | Owner | Evidence |
| --- | --- | --- | --- |
| Warning threshold reached | Review usage drivers and projected end-of-month usage. | Operations owner | Usage snapshot, client, period, top surfaces. |
| Material overage likely | Prepare client notice and commercial options. | Account owner | Draft notice and projected overage. |
| Cap reached without approval | Block or rate-limit non-critical model calls. | Engineering or operations owner | Runtime cap decision and audit metadata. |
| Client approves overage | Activate approved overage policy. | Founder or delegated commercial owner | Approval, rate, cap, effective date, rollback owner. |
| Month closes | Reconcile billed, waived, or rate-limited usage. | Finance or founder | Invoice line or documented exception. |

## Client Notice Template

```text
Subject: AbarVa pilot usage notice

Your AbarVa pilot has reached [X]% of the monthly fair-use model-token
allowance for [client / period]. Current usage is [N] tokens, with projected
month-end usage of approximately [N] tokens.

The pilot includes [cap] model tokens per month. If usage exceeds that
allowance, you may approve continued usage at [rate] per 1M additional tokens,
or AbarVa can rate-limit non-critical AI generation until the next monthly
cycle.

Please confirm your preferred treatment by [date/time]. AbarVa will not enable
uncapped usage without written approval.
```

## Approval Record

Capture this before activating any exception:

```text
Client:
Client id:
Usage period:
Current usage:
Projected usage:
Approved treatment:
Overage rate:
Temporary cap or end date:
Approver:
Approval timestamp:
Client notice sent:
Runtime owner:
Rollback owner:
Finance reconciliation owner:
```

## Runtime Alignment

Runtime enforcement should use the AI-egress usage-cap controls when available.
If runtime enforcement is not yet wired for a client, keep the backlog row
`In progress` and use manual monitoring plus client communication until the cap
settings, audit trail, and weekly reporting evidence are live.

Do not mark the row `Done` based only on this runbook. `Done` requires approved
commercial terms, runtime or operational cap enforcement evidence, and a
customer-facing reporting path.

## Rollback

If an exception is activated incorrectly:

1. Disable or restore the prior cap configuration.
2. Notify the account owner and founder.
3. Preserve the mistaken approval/configuration evidence.
4. Reconcile any usage or invoice impact.
5. Update the account record with the corrected treatment.

## References

- `docs/gtm/pilot-pricing-and-packaging.md`
- `docs/releases/records/2026-06-03-tenant-usage-cap-policy.md`
- `src/lib/integrations/ai-egress/tenant-usage-cap-policy.ts`
