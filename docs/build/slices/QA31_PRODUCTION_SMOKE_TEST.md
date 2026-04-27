# Slice Report: QA31 — Production Smoke Test

Slice ID: QA31
Title: Production Smoke Test — 16 Routes
Wave: wave-25
Track: 10-demo-qa-production-hardening
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

---

## Summary

Implements a two-part smoke test:
1. Jest test that verifies route smoke inventory metadata (deterministic, no network)
2. Shell script that runs live HTTP checks against the Vercel production URL

## Files created

| File | Purpose |
|---|---|
| `src/__tests__/integration/qa/production-smoke-test.test.ts` | Route inventory metadata tests |
| `scripts/smoke-test.sh` | Live HTTP smoke script (curl-based) |

## Routes covered

16 production routes verified via `scripts/smoke-test.sh`:
`/`, `/tenant/apex-retail/programs`, `/tenant/apex-retail/programs/apex-cdp-2026`,
`/tenant/apex-retail/intelligence`, `/tenant/apex-retail/tower`,
`/tenant/meridian/programs`, `/tenant/meridian/intelligence`,
`/tenant/arcturus/programs`, `/admin`, `/admin/architecture`,
`/admin/production-readiness`, `/admin/setup`, `/admin/data`,
`/admin/users`, `/admin/agents`, `/admin/build`

## Usage

```bash
# Run live smoke against production
./scripts/smoke-test.sh

# Run against a specific URL
SMOKE_BASE_URL=https://staging.vercel.app ./scripts/smoke-test.sh
```

## Deferred

Live HTTP smoke in Jest CI — requires running Vercel deployment accessible from CI. Shell script is the CI integration path (run as a separate step after deployment).
