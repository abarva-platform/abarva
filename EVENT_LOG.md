
## 2026-05-02T06:01:16Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Tower handoff verification.
- Finding: After Apex program reached P6, Tower surfaced exact financial values to a non-finance Programs operator.
- Severity: SEV-1 financial output firewall violation.
- Fix branch: codex/programs-milestone-idempotency.
- Fix summary: Tower synthesis now resolves the active user program access policy, injects restricted-output doctrine, sanitizes demo context and output for restricted users, uses policy-specific v2 cache keys, and redacts visible Home/Tower fixture fallback copy. Also refreshed visible Tower lifecycle copy from Build/Activate/Operate to Execution Roadmap/Approval & Mobilization/Tower Handoff.
- Regression: src/__tests__/integration/tower-financial-firewall.test.ts verifies public Home/Tower fixtures avoid exact dollar values and Tower synthesis bypasses stale unsanitized caches.
- Validation: Focused Tower financial firewall Jest and ESLint passed locally.

## 2026-05-02T06:14:30Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / P6 Tower handoff.
- Finding: Apex test program reached P6 in the database, but `/tower` did not visibly surface the handed-off program because Tower still rendered static fixture pressures only.
- Severity: SEV-2 cross-module handoff visibility gap.
- Fix branch: codex/programs-milestone-idempotency.
- Fix summary: `/tower` now queries live `engagements` for active-client P6 programs, applies program assignment scoping via `loadUserProgramAccessPolicy`, and renders a visible `Tower handoffs · P6 active` panel above the legacy pressure accordion.
- Regression: src/__tests__/integration/tower-p6-handoff-panel.test.ts pins tenant filtering, P6 filtering, assignment scoping, and the TowerIndexPage slot wiring.
- Validation: Focused Tower handoff Jest and ESLint passed locally.

## 2026-05-02T06:32:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian preflight.
- Finding: Meridian login landed on `/home` with Meridian tenant chrome but Apex-specific Home content (`CDP`, Vendor C, AMS BAFO, AI spend), creating a cross-tenant UI/content leak.
- Severity: SEV-1 tenant-context leak in Home chrome/content.
- Fix summary: Home now gates Apex fixture content behind an Apex-only tenant check. Non-Apex tenants receive tenant-safe workspace copy, live tenant-scoped program rows only, restricted-financial copy, and no static Apex Tower/Source cards.
- Regression: src/__tests__/integration/home-tenant-scope.test.ts pins the Apex-only fixture guard and non-Apex safe copy.
- Validation: Focused Home tenant-scope Jest and ESLint passed locally.

## 2026-05-02T11:02:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian approval path.
- Finding: Meridian user entered Setup/Admin from a Meridian program approval, but Setup chrome rendered Apex Retail Group because a stale active-client cookie could override explicit tenant-domain personas when Clerk role metadata was admin-ish.
- Severity: SEV-1 tenant indicator mismatch on approval surface.
- Fix summary: `getActiveClientKey()` now pins explicit tenant-domain identities to their inferred client before considering the active-client cookie. This enforces one-client sessions for real client personas even when role metadata is `admin`.
- Regression: src/lib/__tests__/active-client.test.ts verifies `nina.patel@meridian-health.example.com` resolves to Meridian despite a stale Apex cookie.
- Validation: Focused active-client Jest and ESLint passed locally.
