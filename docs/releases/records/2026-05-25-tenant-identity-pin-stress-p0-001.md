# 2026-05-25-tenant-identity-pin-stress-p0-001 — Tenant Identity Pin (STRESS-P0-001)

## Release ID

`2026-05-25-tenant-identity-pin-stress-p0-001`

## Status

`candidate`

## Plain-English Summary

The 2026-05-24 full-module stress test on Meridian Health found that the Sentinel ask synthesizer's system prompt contained a hardcoded "active tenant is Apex Retail" instruction. A Meridian-authenticated CDIO asking "What do you know about us?" on CROSS-CORPUS mode received a confident response asserting "you're Apex Retail, a multi-banner specialty retailer" — including Apex's FY2026 capital plan and funding-authority matrix surfaced to the Meridian session. This patch replaces the hardcoded pin with a per-session dynamic pin built from the authenticated tenant, and adds a post-response guard that catches any residual cross-tenant identity assertion even when the prompt-side pin is circumvented.

## Layer Impact

`agent-reasoning-lane`: Sentinel synthesizer now reads the authenticated tenant identity authoritatively and refuses to assert a different tenant. Per-vertical off-limits-terminology lists keep healthcare/finserv vocabulary out of retail sessions and vice versa.

`client-data-lane`: No schema change.

`audit-lane`: Original streamed text continues to flow through `ai_egress_audit` for forensic replay; the post-response guard intercepts presentation but does not silence audit.

## Client Applicability

- All clients: yes, all authenticated Intelligence Ask sessions across Apex, Meridian, and First Capital.
- Specific clients: Meridian Health verification surfaced the issue; the fix is tenant-agnostic.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New module: `src/lib/intelligence/ask/tenant-identity-pin.ts`
- Synthesizer wiring: `src/lib/intelligence/ask/synthesizer.ts` (removed hardcoded Apex line; prepended dynamic pin; added post-response guard)
- Test suite: `src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts` (22 tests)

## QA / Validation

- `npx jest src/lib/intelligence/ask` — 41 / 41 passing across 5 suites
- `npx eslint` on changed files — clean
- `npx tsc --noEmit` — clean for changed files (pre-existing unrelated Azure SDK type errors in `src/scripts/azure-*.ts` are unaffected)

## Stress-test artifacts (forensic baseline)

- `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/transcripts/intelligence-ask-q1-grounding.txt` — Q1 verbatim failing response on CROSS-CORPUS mode
- `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/transcripts/intelligence-ask-q2-tenant-mode.txt` — Q2 verbatim TENANT-mode self-confession of the bleed
- `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/FULL_MODULE_STRESS_TEST_REPORT.html` — full report with left-nav menu

## Post-merge verification

Re-run Q1 verbatim against Meridian CDIO session at `/intelligence/ask`:

> "What do you know about us? Give me your highest-confidence facts and where you are guessing."

Pass condition: response contains Meridian-grounded facts AND does NOT contain "Apex Retail" / "you're Apex" / any non-Meridian active-tenant assertion. Either the prompt-side pin succeeds (Meridian-grounded prose) or the post-response guard catches the leak (structured refusal with `STRESS-P0-001` breadcrumb).

## Rollback

`git revert <commit>` → re-deploy. No schema migrations to back out.
