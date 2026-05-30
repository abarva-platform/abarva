# 2026-05-30-pr-b-tenant-aware-steward-editorial — Tenant-aware Steward editorial body (PR-B · P0 Apex-leak)

## Release ID

`2026-05-30-pr-b-tenant-aware-steward-editorial`

## Status

`candidate`

## Plain-English Summary

The Steward editorial block on `/admin/production-readiness` is now tenant-aware. Before this change, every tenant — Meridian Health System, First Capital Financial, Northstar Clinical Technologies, SkyHarbor Air — saw the literal string "Apex Retail" in their Steward editorial readiness body. That was the #1 source of the Codex Playwright failure on `/admin/production-readiness` and the most visible cross-tenant leak in the admin surface. This PR makes the editorial template render the active tenant's display name and tightens `context-bundle.ts:resolveTenant` so unknown tenant slugs no longer silently render the raw lowercase slug or default through the silent-Apex fallback inside `canonicalClientDisplayName`.

## Layer Impact

- `runtime-app-lane` (security). Per-tenant editorial output and tenant resolution in the agent context bundle. No DB, broker, or data-plane change.

## Client Applicability

- All clients: yes — every non-Apex tenant stops seeing "Apex Retail" in their production-readiness editorial.
- Specific clients: n/a
- Internal only: n/a
- Public/demo only: n/a
- Feature flag: none. Hard cutover on merge.

## Changes Included

- `src/lib/agent/editorial.ts` — production-readiness template body already takes `(ctx) => ...` and interpolates `ctx.tenant.name`. Audited every other template in `ADMIN_TEMPLATES` (architecture, overview, data-trust, connectors, users-access, agent-readiness, build-progress) for Apex literals — none found.
- `src/lib/agent/context-bundle.ts` — added an import of `canonicalClientDisplayName`. Replaced the `name: tenantSlug` shell_only fallback in `resolveTenant` with a new helper `resolveNonCanonicalDisplayName(tenantSlug)` that:
  - calls `canonicalClientDisplayName({ key: tenantSlug })`,
  - accepts the result only when it matches one of the 4 explicit canonical aliases (`Meridian Health`, `First Capital Financial`, `Northstar Clinical Technologies`, `SkyHarbor Air`),
  - falls back to the raw slug otherwise — explicitly avoiding the silent-Apex default inside `canonicalClientDisplayName → getClientOption`.
- `src/lib/agent/__tests__/editorial-tenant-aware.test.ts` (NEW) — 6 cases: 5 canonical tenants + unknown-slug fallback. Each case asserts the tenant's display name appears AND no other canonical tenant name leaks into the body.
- `src/lib/agent/__tests__/context-bundle-tenant-resolve.test.ts` (NEW) — 8 cases covering canonical resolution, platform tenant routing for `build-progress`, unknown-slug shell_only behavior, and the `firstcapital`-alias fallback path.

## QA / Validation

- PASS — `npx jest src/lib/agent/__tests__/editorial-tenant-aware.test.ts src/lib/agent/__tests__/context-bundle-tenant-resolve.test.ts src/lib/agent/__tests__/admin-editorial-tenant-isolation.test.ts` (17 passed).
- PASS — `npx jest src/lib/agent/__tests__` (325 passed across 17 suites — no regressions).
- PASS — `npx eslint src/lib/agent/context-bundle.ts src/lib/agent/editorial.ts src/lib/agent/__tests__/editorial-tenant-aware.test.ts src/lib/agent/__tests__/context-bundle-tenant-resolve.test.ts` (clean).
- PASS — `npx tsc --noEmit` zero new errors in agent/editorial/context-bundle/client-config; pre-existing missing-optional-dependency errors (Azure SDK, pptxgenjs, resvg-js) are unrelated workflow artifacts.

## Rollout Plan

Merge PR-B to `main` → Vercel preview build → Vercel production promote. No migration, no feature flag, no runbook step.

## Rollback Plan

Revert PR-B. The change is purely a string-interpolation update plus a tenant-resolution helper; revert restores the previous behavior (literal "Apex Retail" in editorial body, raw slug in non-canonical tenant name). No data, no schema, no side effects.

## Audit Evidence

- Spec: `docs/build/ADMIN_HOME_FULL_TEST_2026-05-30.md` §2 Layer 5 (Apex-fallback chain) + §6 F4 (fix recommendation) + §7.1 (PR-B slicing entry).
- Tests: `src/lib/agent/__tests__/editorial-tenant-aware.test.ts`, `src/lib/agent/__tests__/context-bundle-tenant-resolve.test.ts`, `src/lib/agent/__tests__/admin-editorial-tenant-isolation.test.ts`.
- PR URL: to be filled by gh.
- Codex Playwright leak observed on `/admin/production-readiness` for SkyHarbor and Meridian — directly addressed.

## Known Gaps

- Only the `production-readiness` editorial template needed the tenant-aware fix; the other 7 `ADMIN_TEMPLATES` entries are tenant-neutral by design (no per-tenant claims in their bodies) and were audited clean.
- The remaining `F1`–`F3`, `F5`–`F13` recommendations from the spec are out of scope for PR-B and are tracked as separate PRs (`PR-A`, `PR-C`–`PR-H`).
- `canonicalClientDisplayName` still silently defaults to Apex when called with an unknown key (via `getClientOption`). PR-B works around it locally in `resolveNonCanonicalDisplayName`; a broader fix to the library function itself is recommended but out of scope here.
- ContextBar consumer (F10) display-name tightening is partially achieved as a side effect of this PR for the 4 non-Apex tenants in shell_only mode; full F10 coverage remains tracked under PR-H.
