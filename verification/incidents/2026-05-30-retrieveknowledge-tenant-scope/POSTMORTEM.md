# Postmortem — retrieveKnowledge Tenant Scope Leak

## Incident ID

`2026-05-30-retrieveknowledge-tenant-scope`

## Status

`closed-with-follow-ups`

## Plain-English Summary

SkyHarbor Ask validation exposed a tenant-isolation defect in the legacy knowledge retriever. A SkyHarbor request could receive `RESEARCH` source rows seeded for Apex, Keystone, or Brindlemark/First Capital because `retrieveKnowledge()` originally queried active `knowledge_sources` rows without requiring an active tenant scope. PR #2474 fixed the retrieval path by passing tenant context into `retrieveKnowledge()` and filtering off-tenant legacy composite rows before source emission.

## Severity

P0 isolation defect. The defect could expose wrong-tenant synthetic research sources in Ask source payloads. It did not expose real customer production data because the affected tenants in this environment are synthetic demo tenants.

## Affected Window

- First commit introducing `retrieveKnowledge()` without tenant scope: `2c3b9c3af38a09ee02693f9758fee8366810e835`.
- Commit date: 2026-04-19T19:07:26-05:00.
- Fix merged: PR #2474 at 2026-05-30T07:44:13Z.
- Audit caveat: `ai_egress_audit` rows are present from 2026-05-24 onward in the queried production database. No egress rows were returned for 2026-04-19 through 2026-05-23, so the traffic table below reflects the logged egress window, not necessarily every possible application request since code introduction.

## Root Cause

`retrieveKnowledge()` was introduced as a stateless knowledge librarian in commit `2c3b9c3a`. Its original contract retrieved active `knowledge_sources` rows by content type and query entity, but it did not require a typed tenant context. That made tenant filtering optional at the caller layer instead of mandatory at the retrieval boundary.

This bypassed the spirit of Packet 31 tenant invariants:

- I5 required tenant enforcement at the DB query layer.
- I9 later required industry isolation for pattern retrieval.
- I10 later required canonical tenant allowlisting.

The gap: none of those explicitly required every retrieval/synthesis function to accept typed tenant scope. This postmortem adds I11 to close that contract gap.

## Detection

The defect was detected during Phase 6 SkyHarbor Ask load and verifier work. The single-request diagnostic artifact showed SkyHarbor source events including off-tenant `RESEARCH` rows from Apex, Keystone, and Brindlemark/First Capital legacy composite seeds.

Primary diagnostic artifact referenced in PR #2474:

`/tmp/phase6-e2e/skyharbor-single-cio-current/skyharbor-load-results.json`

## Production Traffic During Logged Affected Window

Source: `public.ai_egress_audit`, queried against production `DATABASE_URL`.

Logged egress rows from 2026-04-19T00:00:00Z through the PR #2474 merge time show activity only from 2026-05-24 onward:

| Day                         | Egress calls |
| --------------------------- | -----------: |
| 2026-05-24                  |          181 |
| 2026-05-25                  |          704 |
| 2026-05-26                  |          729 |
| 2026-05-28                  |        2,187 |
| 2026-05-29                  |          120 |
| 2026-05-30 before 07:44:13Z |        5,460 |

Ask-specific logged traffic before the fix:

| Tenant                          | Window                                                    | Ask workflow calls |
| ------------------------------- | --------------------------------------------------------- | -----------------: |
| SkyHarbor Air                   | 2026-05-28                                                |              1,009 |
| SkyHarbor Air                   | 2026-05-30 before fix                                     |              2,396 |
| Apex Retail                     | 2026-05-24, 2026-05-25, 2026-05-28, 2026-05-30 before fix |                 56 |
| Meridian Health                 | 2026-05-24, 2026-05-25, 2026-05-26, 2026-05-30 before fix |                124 |
| Northstar Clinical Technologies | 2026-05-26, 2026-05-30 before fix                         |                251 |
| First Capital                   | 2026-05-26, 2026-05-30 before fix                         |                100 |

Top logged Ask user IDs were Clerk user IDs or null harness rows. The egress table does not store source payloads or user email addresses, so the source-leak finding comes from the Phase 6 diagnostic artifact rather than `ai_egress_audit`.

## Customer-Facing Impact Assessment

No real customer-facing leak is currently identified.

Rationale:

- All five production clients in scope are canonical synthetic/demo tenants: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, and SkyHarbor Air.
- The off-tenant rows identified were legacy composite/demo research rows, not customer-uploaded data.
- The live traffic under review appears tied to demo personas, validation harnesses, and canonical synthetic tenants.
- No signed pilot or real customer tenant is present in the canonical production tenant set reviewed for this postmortem.

Residual uncertainty:

- `ai_egress_audit` does not record source payloads.
- `ai_egress_audit.user_id` stores Clerk IDs, not email addresses.
- If a later Clerk audit maps any affected user IDs to a real customer user, this incident must be reopened and the notification decision revisited.

## Customer Notification Decision

No external customer notification is recommended at this time because no real customer tenant or real customer data exposure has been identified. Internal founder notification is complete through this committed postmortem and PR #2474 release evidence.

## Fix

PR #2474: https://github.com/anandsundaram-hash/abarva/pull/2474

Changes:

- Passed active tenant context into all Ask knowledge retrieval paths.
- Added off-tenant filtering in `retrieveKnowledge()` based on tenant inventory key and surface context.
- Filtered retired legacy composite markers before source events are emitted.
- Added regression coverage for SkyHarbor excluding Apex/Keystone/legacy composite seeds.

Merged fix commit:

`6eabf221fa24d37e659f16a15545c1e9f7b9b168`

## Verification

PR #2474 validation:

- PASS: `npx jest src/lib/intelligence/ask/retrievers/knowledge.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/__tests__/tenant-identity-pin.test.ts --runInBand`
- PASS: `npx eslint src/lib/intelligence/ask/router.ts src/lib/intelligence/ask/retrievers/knowledge.ts src/lib/intelligence/ask/retrievers/knowledge.test.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/tenant-identity-pin.ts`

Post-fix production evidence recorded in release history:

- Phase 6 compact-concise production rerun passed: 50/50 HTTP 200, zero 4xx/5xx, p95 10.866s, zero tenant bleeds.
- SkyHarbor verifier sanity passed: 25/25, fail-harness 0, timeout 0, average 4.92/5.
- Post-strict no-tenant regression passed: HTTP 200, graceful response, zero canonical tenant bleeds, no tenant sources.

## Moves P0 Status Check

The earlier "Moves redirects to home/setup" concern was checked before Section 7 resumed.

Production target: `https://app.abarva.ai`.

Results on 2026-05-30T11:26:17Z:

| Persona                            | Result | Final URL          | Heading         | Console errors |
| ---------------------------------- | ------ | ------------------ | --------------- | -------------: |
| `cto@skyharbor-air.example.com`    | PASS   | `/strategic-moves` | Strategic Moves |              0 |
| `cio@apex-retail.example.com`      | PASS   | `/strategic-moves` | Strategic Moves |              0 |
| `cdio@meridian-health.example.com` | PASS   | `/strategic-moves` | Strategic Moves |              0 |
| `admin@skyharbor-air.example.com`  | PASS   | `/strategic-moves` | Strategic Moves |              0 |

Conclusion: the Moves P0 is not reproduced. Existing broad Playwright smoke tests can still fail because they match both the page `<h1>` and a secondary "Strategic moves" heading; that is a stale assertion issue, not a production redirect.

## Preventive Actions

- Add Packet 31 I11: retrieval and synthesis functions that read tenant-scoped data must accept typed tenant scope.
- Add Packet 31 I12: certified Ask path has a standing 50-concurrent p95 budget.
- Keep PR #2474 regression coverage in CI.
- Add or track a lint/type guard for unscoped retrieval functions.
- Continue universal tenant verification for any tenant-class or industry-class bug.

## Final Classification

Resolved P0 isolation defect with no current evidence of real customer data exposure. Governance follow-ups are captured in Packet 31 I11/I12.
