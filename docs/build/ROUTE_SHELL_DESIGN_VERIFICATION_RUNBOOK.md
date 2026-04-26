# QA26 Route-to-Shell Design Verification Runbook

## Purpose
Verify that active target routes are actually mounted through canonical AbarVa shell/navigation ownership and not merely backed by unused components.

## Scope
Target routes:
- `/platform/admin`
- `/platform/admin/architecture`
- `/platform/admin/production-readiness`
- `/platform/admin/build-progress`
- `/source`
- `/source/events`
- `/source/events/[eventId]`
- `/tenant/[tenantSlug]/programs`
- `/tenant/[tenantSlug]/programs/[programSlug]`

## Deterministic Verification Checks
1. Route file exists.
2. Canonical shell marker imports are present.
3. Workflow orientation markers are present.
4. Known legacy shell imports are flagged.
5. Source commercial section mount is checked on event detail route.
6. Noncompliant routes must carry explicit deferral reason.

## How To Run
1. `npx jest src/__tests__/integration/qa/route-shell-design-verification.test.ts`
2. `npx tsc --noEmit --pretty false`
3. `npx eslint --max-warnings=0 src/lib/qa/route-shell-design-verification.ts src/__tests__/integration/qa/route-shell-design-verification.test.ts src/lib/qa/index.ts`

## Interpretation
- `compliant`: route file includes canonical shell markers and no disallowed legacy import.
- `legacy`: route still imports known legacy shell/nav token(s).
- `noncompliant`: missing canonical markers.
- `missing`: route file missing.
- Non-compliant/legacy entries require either:
  - immediate remediation in route enforcement slices, or
  - explicit temporary deferral reason.

## Constraints
- No browser automation.
- Source-only file verification.
- Deterministic report output only.

