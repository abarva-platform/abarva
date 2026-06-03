# Token Consumption Meter Slice

Date: 2026-06-03
Status: candidate
Backlog: T033
Release lane: internal-admin

## What Changed

This slice advances the in-app token and consumption meter by connecting provider
usage metadata to the existing AI egress audit ledger and the Customer Admin
usage panel.

Before this slice, the generic `callModel` wrapper wrote a pre-call audit row
and a completion audit row, but the completion row kept only `preCallAuditId`.
Provider usage metadata returned by the adapter was not preserved for the usage
panel.

After this slice:

- `callModel` merges adapter response metadata into the completion audit row.
- Nested `usage` metadata is preserved instead of overwritten.
- Customer Admin usage summaries read both top-level token/cost fields and
  nested `request_metadata.usage`.
- Regression tests lock the wrapper and Customer Admin behavior.

## Meter Contract

Allowed AI egress rows should carry usage metadata using one of these shapes:

```json
{
  "usage": {
    "input_tokens": 100,
    "output_tokens": 25,
    "cost_usd": 0.000675
  }
}
```

or top-level equivalents:

```json
{
  "input_tokens": 100,
  "output_tokens": 25,
  "cost_usd": 0.000675
}
```

The Customer Admin meter treats either shape as provider metadata.

## Current Coverage

| Surface | Status |
| --- | --- |
| Generic `callModel` wrapper | Completion audit now preserves adapter usage metadata. |
| Customer Admin usage panel | Reads top-level and nested usage metadata. |
| Source streaming preflight route | Still stores token counts in artifact generation metadata; follow-on work should write a completion AI egress row or usage update after streaming completes. |
| Hard tenant caps / overage policy | Not implemented in this slice. |

## QA Evidence

- `npx jest src/lib/integrations/ai-egress/__tests__/ai-egress.test.ts src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts --runInBand`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Remaining T033 Work

T033 should remain `In progress`, not Done, until:

- every live model provider path records usage into the audit ledger,
- streaming/preflight-only paths write completion usage after final provider
  metadata arrives,
- tenant-level caps and alert thresholds exist,
- weekly client-facing usage export/reporting is available.
