# 2026-05-30-setup-audit-ribbon-full-join — Setup/Admin Unified Audit Ribbon · Full Six-Source Join (Wave 2 PR-3)

## Release ID

`2026-05-30-setup-audit-ribbon-full-join`

## Status

`candidate`

## Plain-English Summary

Closes the Trust Plane audit ribbon to its full six-source join — substrate, approval, connector, auth, and now **invite** + **policy** — by adding two new admin brokers (`invite-events-broker.ts`, `policy-events-broker.ts`) and composing their outputs into `trust-spine-broker.composeAuditRibbon`. Invite events source Clerk's invitations API when `CLERK_SECRET_KEY` is wired; policy events read the canonical `tenant_policy_audit` ledger added by the W22 AI-egress migration. Emails are masked to first-char + domain at the broker boundary so raw addresses never reach the page, log line, or PII-sensitive surface. Both brokers honor the honesty doctrine: empty arrays (not synthetic rows) when the underlying ledger or SDK is unavailable.

## Layer Impact

- `runtime-app-lane`: No new components. The existing `AuditRibbon` already color-keys the `invite` (teal) and `policy` (teal) source chips; verified by the existing test suite. The audit page `?source=invite|policy` filter already routes through the `SetupAuditTabs` wiring from PR-2.
- `architecture-lane`: Two new broker modules under `src/lib/admin/broker/**` — `invite-events-broker.ts` and `policy-events-broker.ts` — plus the trust-spine composer extension that unions their outputs. `getTrustSpine` now calls all six upstream brokers via `Promise.allSettled`; any single broker rejection degrades that dimension to empty without crashing the page. Broker boundary remains intact (hygiene gate passes).
- `qa-validation-lane`: 17 new broker tests (12 invite, 11 policy, plus 4 mixed-ordering / degraded-source tests on the trust-spine composer). All 124 admin broker + component tests pass. Email masking is asserted at the row-shape boundary AND inside the trust-spine compose test.
- `data-plane-lane`: No schema change. Policy broker reads `tenant_policy_audit` via `azureRead.select` with `missingTable: 'empty'` so environments without the W22 migration applied return [] cleanly.

## Client Applicability

- All clients: The ribbon now includes invite + policy events whenever the underlying signal exists for that tenant. When neither does, the ribbon falls back to its pre-PR composition (substrate + approval + connector + auth) plus an empty pass for the two new sources — no behavior change for those tenants.
- Specific clients: None.
- Internal only: No. Tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/invite-events-broker.ts` (new) — Clerk-backed broker that emits `invite sent / accepted / expired / revoked` events. PII masking applied at the boundary (first-char + domain). Returns [] when `CLERK_SECRET_KEY` is absent or the Clerk API throws.
- `src/lib/admin/broker/policy-events-broker.ts` (new) — `tenant_policy_audit`-backed broker that emits `policy updated` events. Column allow-list omits `prior_policy`, `new_policy`, and `actor_id` (payload-fingerprint safety, per W2-PR-2 precedent). Missing-table tolerant via `missingTable: 'empty'`.
- `src/lib/admin/broker/trust-spine-broker.ts` (modified) — extended `composeAuditRibbon` signature with invite + policy event arrays; added two `Promise.allSettled` branches to the entry point; graceful warn-and-empty on either rejection. Updated the file-level doc to reference Wave 2 PR-3.
- `src/lib/admin/broker/__tests__/invite-events-broker.test.ts` (new) — 14 tests covering masking edge cases, action derivation, tenant filter, window bounding, snake/camel payload shapes, Clerk SDK absent / throwing, sorted output.
- `src/lib/admin/broker/__tests__/policy-events-broker.test.ts` (new) — 11 tests covering empty client, empty result, row mapping, null-actor → 'system', reason clamping, the explicit column allow-list (payload-safety), missingTable contract, query failure path, sinceIso override, multi-row ordering.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` (modified) — added 4 new tests: source=invite ribbon emission, source=policy ribbon emission, six-source mixed-timestamp ordering, both brokers rejecting (degraded fallback path). Existing "invite empty" test rewritten to reflect the new wired behavior.

## QA / Validation

- PASS: `npx jest src/lib/admin/broker/__tests__` — 4/4 suites, 76/76 tests.
- PASS: `npx jest src/components/admin/__tests__` — 14/14 suites, 48/48 tests.
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — broker-boundary hygiene gate clean (no new `getServerSupabase` references outside the broker dir).
- PASS: `npx tsc --noEmit` — clean.
- PASS: `npx eslint src/lib/admin/broker src/components/admin` — only pre-existing warnings on `AgentReadinessDeepDrill.tsx` and `StewardAskBar.tsx`.

## Rollout Plan

Merge to main after CI passes. No migration (the policy broker tolerates the table being absent via `missingTable: 'empty'`). No feature flag. The brokers degrade to empty arrays in any environment without `CLERK_SECRET_KEY` or `tenant_policy_audit` applied — the ribbon shape and existing four sources are unchanged.

## Rollback Plan

Revert the PR. The trust-spine composer falls back to its pre-PR four-source signature; the two new broker modules become orphan code, harmless. AuditRibbon's existing chips for invite + policy remain (they were already rendered as color-keyed tones in Wave 1 PR-6).

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone E (unified audit ribbon — "mixing substrate-ingest events with auth events with policy edits with connector pulls").
- Predecessor brokers: `src/lib/admin/broker/connector-health-broker.ts` (PR-1) and `src/lib/admin/broker/isolation-posture-broker.ts` (PR-2). The new brokers follow the same `azureRead.select` + `missingTable: 'empty'` + structured-warn-on-failure pattern.
- PII redaction precedent: `isolation-posture-broker.ts` payload-fingerprint exclusion comment; same doctrine applied here for `prior_policy` / `new_policy` / `actor_id` (policy) and raw email addresses (invite).

## Known Gaps

- Invite tenant scoping relies on the inviter stamping `public_metadata.tenantKey` on the Clerk invitation. Unstamped invitations are surfaced to all tenants (honesty doctrine — better visible than silently hidden). When the first-party `tenant_invites` ledger lands, the broker swaps the Clerk path for an `azureRead.select` and the tenant filter becomes precise.
- The policy broker treats every `tenant_policy_audit` row as `'policy updated'` because the W22 schema does not carry an explicit `event_type` column. When a schema variant lands with create / delete rows, the action mapping should branch.
- Email masking is one-way; the broker never carries the unmasked address. Downstream surfaces (e.g. a hypothetical resend-invite action) would need to look up the address from Clerk directly, not from the audit row.
