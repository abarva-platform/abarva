# Apex Tenant Overlay Config — Section 7.2

Run date: 2026-05-30  
Tenant: `apex-retail`  
Backlog item: Section 7.2 — Apex tenant config

## Result

PASS. Apex Retail's canonical tenant config now declares:

```ts
patternOverlays: ["core", "retail-v1"];
```

This makes the intended overlay subscription explicit in code, matching the live
data state from Section 7.1.

## Live Subscription Proof

The documented `tenant_overlay_subscriptions` table does not exist in the live
database. The current operational proof is therefore:

- Code config: `apex-retail` has `patternOverlays: ['core', 'retail-v1']`
- Live retrieval substrate: 5,691 `retail-v1` chunks exist for `apex-retail`
- Live verifier: Apex Tier-1 production Ask smoke passed 25/25

## Validation

- PASS: `getTenantPatternOverlays('apex-retail')` returns
  `['core', 'retail-v1']`
- PASS: every canonical tenant includes the `core` overlay
- PASS: `npm run smoke:apex-tier1-verifier` returned 25/25 after Apex substrate
  refresh and retail overlay embedding

## Known Gap

No `tenant_overlay_subscriptions` table exists in live Postgres. If the platform
still wants a DB subscription table separate from code config, that should be a
future schema task. For Section 7.2, the accepted source of truth is the
canonical tenant config plus the loaded `enterprise_context_chunks` overlay rows.
