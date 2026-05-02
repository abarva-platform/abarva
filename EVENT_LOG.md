
## 2026-05-02T06:01:16Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Tower handoff verification.
- Finding: After Apex program reached P6, Tower surfaced exact financial values to a non-finance Programs operator.
- Severity: SEV-1 financial output firewall violation.
- Fix branch: codex/programs-milestone-idempotency.
- Fix summary: Tower synthesis now resolves the active user program access policy, injects restricted-output doctrine, sanitizes demo context and output for restricted users, uses policy-specific v2 cache keys, and redacts visible Home/Tower fixture fallback copy. Also refreshed visible Tower lifecycle copy from Build/Activate/Operate to Execution Roadmap/Approval & Mobilization/Tower Handoff.
- Regression: src/__tests__/integration/tower-financial-firewall.test.ts verifies public Home/Tower fixtures avoid exact dollar values and Tower synthesis bypasses stale unsanitized caches.
- Validation: Focused Tower financial firewall Jest and ESLint passed locally.
