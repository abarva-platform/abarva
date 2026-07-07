# Lighthouse CI Runbook

## Purpose

This runbook explains the public-route Lighthouse CI budget gate. The gate protects Core Web Vitals and page performance from silent regressions on the public routes used in buyer, pilot, and investor reviews.

## Local Use

```bash
npm run build
ACCESSIBILITY_AXE_DISABLE_CLERK=1 \
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<valid test publishable key> \
CLERK_SECRET_KEY=<valid test secret key> \
npm run lighthouse:ci
```

Reports are written to:

```text
audit-artifacts/performance/lighthouse/
```

## Routes Covered

| Route      | Reason                                  |
| ---------- | --------------------------------------- |
| `/`        | Public first impression and buyer entry |
| `/contact` | Public conversion route                 |
| `/sign-in` | Public authentication entry             |

## Default Budgets

| Metric                    | Threshold |
| ------------------------- | --------: |
| Largest Contentful Paint  |  7,000 ms |
| Cumulative Layout Shift   |      0.80 |
| Total Blocking Time       |  1,000 ms |
| Speed Index               |  7,000 ms |
| Lighthouse performance    |       0.5 |

The first threshold set is intentionally conservative. It catches major regressions without pretending to be the final production performance target. The initial homepage baseline has elevated layout shift, so the first CLS gate is a regression ceiling rather than the desired target.

## Clerk Handling In CI

The gate uses the same request-scoped public-route Clerk bypass pattern as the axe gate. `ACCESSIBILITY_AXE_DISABLE_CLERK=1` only disables `ClerkProvider` when the proxy forwards the private accessibility/Lighthouse request header for public routes. Normal development, preview, and production requests keep Clerk enabled.

## Raising or Lowering Budgets

Change a threshold only when:

- The current `origin/main` baseline is known.
- The PR includes the observed Lighthouse values.
- The release record explains why the new threshold is safe.

## Known Limitations

The gate runs against local production builds in CI. It does not replace real-user monitoring, production Web Vitals telemetry, or device/network-specific performance analysis.
