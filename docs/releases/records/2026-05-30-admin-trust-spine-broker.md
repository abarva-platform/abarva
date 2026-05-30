# 2026-05-30-admin-trust-spine-broker — Setup/Admin TrustSpine Broker + Boundary Enforcement (Wave 1 PR-4)

## Release ID

`2026-05-30-admin-trust-spine-broker`

## Status

`candidate`

## Plain-English Summary

Adds the canonical TrustSpine read-model broker for the Setup / Admin surface. TrustSpine is one contract that returns the five trust dimensions — substrate, isolation, integration, governance, and an audit ribbon — so the landing page, Data Trust, Connectors, Users & Access, and Audit pages all read from the same composed source.

In this release the substrate and governance dimensions are wired live (segments from the existing setup-data-broker; open approvals from the program approval queue). Isolation and integration are authored stubs marked `evidence: 'estimated'` so the eventual landing-page chip strip can render honestly until Wave 2 wires the connector health and `ai_egress_audit` readers.

This release also codifies the broker-boundary doctrine as a CI gate: admin pages and `src/lib/admin/**` modules may not import the Supabase server client (or any `@supabase/*` client) directly. Every server read must route through a broker in `src/lib/admin/broker/**`. A hygiene test fails closed when a violation is introduced, with a clear failure message pointing at file:line.

There is no UI or runtime behavior change in this release — the landing page renders the same blocks as before. The visual Trust strip ships in Wave 1 PR-5; this PR is the data spine it will read from.

## Layer Impact

- `runtime-app-lane`: No behavior change. The pre-existing `src/lib/admin/overview-data.ts` is now a re-export shim over `src/lib/admin/broker/overview-supplemental-broker.ts`; admin/page.tsx imports through the unchanged surface.
- `architecture-lane`: Introduces `src/lib/admin/broker/` as the canonical read seam for the Setup/Admin surface. Codifies the broker-boundary doctrine
  (memory · `feedback_broker_boundary.md`) as an executable CI gate.
- `qa-validation-lane`: Adds 6 broker unit tests + 2 boundary hygiene tests. Pre-existing `overview-data.test.ts` continues to pass through the shim.
- `data-plane-lane`: No schema change. No new tables. No migration.

## Client Applicability

- All clients: No runtime impact in this release.
- Specific clients: None.
- Internal only: Architecture seam used by Wave 1 PR-5 onward.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/broker/trust-spine-broker.ts` (new) — `TrustSpine` contract + `getTrustSpine(tenantKey)` composer.
- `src/lib/admin/broker/overview-supplemental-broker.ts` (new) — relocated supplemental fetcher.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` (new) — 6 unit tests.
- `src/lib/admin/__tests__/broker-boundary.test.ts` (new) — hygiene gate, 2 tests.
- `src/lib/admin/overview-data.ts` (modified) — converted to a 3-line re-export shim.

## QA / Validation

- PASS: `npx jest src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` — 6/6.
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` — 2/2.
- PASS: `npx jest src/lib/admin/overview-data.test.ts` — existing 2/2 pass through the shim.
- PASS: `npx eslint src/lib/admin/broker/ src/lib/admin/overview-data.ts src/lib/admin/__tests__/broker-boundary.test.ts`.
- PASS: `npx tsc --noEmit` — zero errors in changed code (pre-existing Azure SDK type gaps remain — workflow artifact per memory).
- PROBED: Introduced a deliberate `getServerSupabase` violation under `src/lib/admin/`; hygiene gate failed with the expected file:line + remediation message, and unblocked once removed.
- PENDING: PR CI.

## Rollout Plan

Merge to main after CI passes. No runtime rollout; no migration; no deploy gate. The TrustSpine broker becomes a load-bearing seam for Wave 1 PR-5 (Trust strip) and later waves.

## Rollback Plan

Revert the PR. Because `overview-data.ts` is a re-export shim back to the broker module, removing the broker dir restores the original implementation byte-for-byte from the pre-shim state of the file. No data or migration rollback is required.

## Audit Evidence

- PR: https://github.com/anandsundaram-hash/abarva/pull/2501
- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.4 (Data Trust backbone) and §7 (Wave 1 PR-4 in the 90-day execution slicing).
- Broker contract: `src/lib/admin/broker/trust-spine-broker.ts`.
- Hygiene gate: `src/lib/admin/__tests__/broker-boundary.test.ts`.

## Known Gaps

- Isolation chip and Integration chip are authored stubs (`evidence: 'estimated'`). Wired in Wave 2 PR-1 (Connector health broker) and Wave 2 PR-2 (Isolation lane).
- Audit ribbon currently surfaces substrate-import events only. Wave 1 PR-6 unions approval + connector + invite events into the ribbon.
- Governance dimension: `ssoConfigured`, `policyDriftCount`, `openInvites` are stubbed with explicit TODO comments. Wired in Wave 2 alongside the Clerk SSO integration and the invite ledger.
