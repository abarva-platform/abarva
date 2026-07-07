# Bundle Budget Runbook

## Purpose

This runbook explains the Next.js bundle budget gate. The gate protects Nexus from silent JavaScript growth by checking build manifests after `npm run build`.

## Local Use

```bash
npm run build
npm run bundle:budget
```

The report is written to:

```text
audit-artifacts/performance/bundle-budget.json
```

## Default Budgets

| Metric                    |   Default |
| ------------------------- | --------: |
| Total manifest JavaScript | 15,000 KB |
| Largest JavaScript chunk  |  1,500 KB |
| Largest route JavaScript  |  4,500 KB |

The first floor is intentionally conservative. It is a guardrail against major regressions, not a final performance target.

## Overrides

Use environment variables only for investigation or a deliberately documented threshold change:

```bash
BUNDLE_BUDGET_TOTAL_JS_KB=15000 \
BUNDLE_BUDGET_MAX_CHUNK_KB=1500 \
BUNDLE_BUDGET_MAX_ROUTE_JS_KB=4500 \
npm run bundle:budget
```

## Raising or Lowering Budgets

Change a threshold only when:

- The current `origin/main` baseline is known.
- The PR includes the new observed baseline.
- The release record explains why the new threshold is safe.

## Known Limitations

The script reads Next build manifests and file sizes. It does not measure network compression, runtime hydration cost, or Lighthouse performance. Lighthouse and accessibility gates are separate backlog items.
