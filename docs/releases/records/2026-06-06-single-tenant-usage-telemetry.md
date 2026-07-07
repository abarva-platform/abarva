# 2026-06-06-single-tenant-usage-telemetry - Single-tenant access posture and product usage tracking

## Release ID

`2026-06-06-single-tenant-usage-telemetry`

## Status

`candidate`

## Plain-English Summary

This release removes the implicit `@thesundaram.com` to Meridian routing path, makes tenant switching opt-in behind an explicit environment flag, and adds signed-in product usage telemetry so operator review can see pageviews and clicks by user, persona, route, module, and tenant metadata without changing customer/demo logins.

## Layer Impact

- `global-control-lane`: Tightens tenant-resolution policy for all signed-in sessions by requiring explicit Clerk metadata or canonical demo email domains instead of founder-domain inference.
- `internal-admin`: Tenant switching is dormant by default and only works when `ABARVA_ENABLE_TENANT_SWITCHER=1` is deliberately set.
- `public-demo`: Product telemetry runs for signed-in demo/product sessions and records pageviews plus click events in PostHog.

## Client Applicability

- All clients: yes, signed-in usage telemetry and stricter no-implicit-tenant policy apply globally.
- Specific clients: none.
- Internal only: tenant switcher opt-in flag.
- Public/demo only: none.
- Feature flag: `ABARVA_ENABLE_TENANT_SWITCHER=1` is required to re-enable tenant switching.

## Changes Included

- `src/lib/client-config.ts`: removes `thesundaram.com` domain-to-Meridian client inference.
- `src/lib/admin/tenant-switch-authority.ts`: requires `ABARVA_ENABLE_TENANT_SWITCHER=1` before tenant switching is authorized.
- `src/components/ProductUsageTelemetry.tsx`: identifies signed-in users and captures pageviews plus product clicks in PostHog.
- `src/components/PostHogProvider.tsx`: disables PostHog autocapture and masks all session-recording inputs.
- `src/lib/telemetry/product-usage.ts`: shared telemetry helper functions.

## QA / Validation

- PASS: `git diff --check`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/jest tests/unit/access-routing.test.ts src/lib/admin/__tests__/tenant-switch-authority.test.ts src/lib/telemetry/__tests__/product-usage.test.ts --runInBand`
- PASS: `/Users/anand/Projects/nexus/node_modules/.bin/eslint src/components/ProductUsageTelemetry.tsx src/components/PostHogProvider.tsx src/lib/telemetry/product-usage.ts src/lib/telemetry/__tests__/product-usage.test.ts src/lib/admin/tenant-switch-authority.ts src/lib/admin/__tests__/tenant-switch-authority.test.ts tests/unit/access-routing.test.ts src/app/layout.tsx`
- PARTIAL: `/Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false` reaches no touched-file errors, then fails on existing missing optional packages: `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`.

## Rollout Plan

Merge to main, deploy through Vercel production, and confirm `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` are present in production. Leave `ABARVA_ENABLE_TENANT_SWITCHER` unset unless a controlled internal diagnostic session explicitly needs it.

## Rollback Plan

Revert this PR to restore the prior pageview-only telemetry and tenant-switch authorization. If click telemetry needs to be disabled without rollback, remove `NEXT_PUBLIC_POSTHOG_KEY` or gate the telemetry component in a follow-up patch.

## Audit Evidence

- PR, CI, and production deployment evidence to be added after merge.
- Unit tests cover access routing, tenant-switch default-off posture, and telemetry helper behavior.

## Known Gaps

PostHog must be available in production for click events to appear. This release does not create a first-party product-click database table; governance audit actions remain in `admin_audit_log`.
