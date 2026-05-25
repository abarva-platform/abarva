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

## Rollout Plan

- Merge PR #2341 to `main`.
- Auto-deploys via Vercel on merge (preview already verified successful on PR).
- No staged rollout / feature flag — the change is a pure-function prompt-builder swap with a server-side response guard. Same-shape behavior under all reasoning modes; no per-tenant phasing needed.
- Post-deploy verification: re-run Q1 ("What do you know about us?") on `/intelligence/ask` as Meridian CDIO; assert response contains Meridian-grounded facts and does NOT contain "Apex Retail" / "you're Apex" / any non-Meridian active-tenant assertion.

## Rollback Plan

`git revert <commit-sha>` → re-deploy. No schema migrations to back out, no env-var changes, no data-layer mutations.

If the post-response guard over-fires in production (false-positive cross-tenant detection), the safer interim is to remove only the guard while keeping the dynamic pin: comment out the `if (leakCheck.leaked) { ... return; }` block in `src/lib/intelligence/ask/synthesizer.ts` and redeploy. The pin alone still closes the bug; the guard is defense-in-depth.

## Audit Evidence

- Pre-fix verbatim failing response captured in `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/transcripts/intelligence-ask-q1-grounding.txt`
- Agent's own self-confession of the bleed in TENANT mode captured in `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/transcripts/intelligence-ask-q2-tenant-mode.txt`
- Full stress-test report (left-nav HTML) at `audit-artifacts/full-module-stress-meridian-2026-05-24-2200/FULL_MODULE_STRESS_TEST_REPORT.html`
- Test suite at `src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts` includes the verbatim failing response as an explicit regression case; 22/22 passing.

## Known Gaps

- The post-response guard's detection regex is intentionally conservative (only matches explicit "you're X" / "your organization is X" / "the active tenant is X" frames). A model that asserts wrong-tenant identity in more creative phrasings (e.g., "I see you running a multi-banner retail operation") would not be caught by the guard, though the dynamic pin should prevent this at the prompt layer.
- Off-limits terminology lists are static (defined in `tenant-identity-pin.ts`). If a vertical's terminology evolves materially (e.g., new healthcare regulatory terms), the list must be manually extended.
- The FOUNDATION-FIX-3 scorer in `scripts/audit/run-agent-2task-eval.ts` does not yet incorporate the new `detectCrossTenantIdentityLeak` detector. A follow-up PR should wire it so historical and future audits flag cross-tenant identity leaks consistently. Tracked as a separate task.
- This fix addresses the Sentinel ask synthesizer specifically. Other Sentinel-reasoning surfaces (Source intake agent, Nexus origination, Move-detail chat) that may consume similar session-memory or context may have analogous defects; they were not scoped into this PR. Recommend a follow-up audit pass once this lands and verification passes.
