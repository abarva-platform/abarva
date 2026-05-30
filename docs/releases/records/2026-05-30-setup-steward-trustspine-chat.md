# 2026-05-30-setup-steward-trustspine-chat — Steward Chat Grounded in TrustSpine (Wave 3 PR-3)

## Release ID

`2026-05-30-setup-steward-trustspine-chat`

## Status

`candidate`

## Plain-English Summary

Today, when a tenant admin asks the Steward chat dock "what should I do next?", Steward answers with generic onboarding guidance — it doesn't know that this tenant has two degraded connectors, a sparse Vendor Contracts segment, three pending approvals, or SSO that hasn't been configured yet. This release wires the canonical **TrustSpine** read model (substrate, integrations, isolation, governance) into the Steward chat system prompt, so Steward can lead its reply with the specific, leverage-ranked next action for the tenant in front of it.

For canonical phrasings — "what should I do next?", "what's stuck?", "what's the next priority?" — Steward is additionally told to anchor the answer to the top item from a deterministic action queue (degraded connector → high-severity isolation anomaly → sparsest substrate segment → pending approvals → SSO posture). The result: Steward says "Two connectors are degraded — Salesforce on scope mismatch — repair that first" instead of "I'd suggest reviewing your data segments and connector inventory."

## Layer Impact

- `runtime-app-lane`: New helper at `src/lib/admin/steward-trust-spine-context.ts` composes the TrustSpine into a system-prompt block (counts + leverage-ordered action queue) and exposes a pattern-matched "next priority" question detector. The chat route at `src/app/api/chat/agent/route.ts` calls it when `agentName === 'Steward'` on any admin/setup surface (`/admin*`, `/home/data-trust`, `/home/connectors`, `/home/production-readiness`); broker failure degrades to an empty block so Steward keeps its existing voice-doctrine guidance.
- `qa-validation-lane`: 33 new tests across two new suites (28 composer/router/gating/PII/broker-degradation tests + 5 source-level wiring guards on the chat route).

## Client Applicability

- All clients: The Steward grounding fires for every tenant where the user is on a Steward+setup surface. Apex Retail and Meridian have real TrustSpine data today; new tenants with empty substrate see a coherent "No substrate loaded yet — first upload unlocks Sentinel grounding." line.
- Specific clients: None.
- Internal only: No. This is a tenant-admin surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/steward-trust-spine-context.ts` (new) — `composeStewardTrustSpineContext()` system-prompt composer; `composeActionQueue()` leverage-ordered queue; `matchesNextPriorityQuestion()` deterministic question router; `shouldInjectStewardTrustSpine()` surface gate; `redactPii()` email/UUID stripper; `buildStewardTrustSpineBlock()` entry point that resolves the broker and degrades gracefully on failure. Server-only; consumes `getTrustSpine` only — no Supabase.
- `src/app/api/chat/agent/route.ts` (modified) — imports the new helpers; builds the TrustSpine block on Steward + setup surfaces; injects the block + a stronger next-priority directive into the system-prompt array next to the broker grounding block. Broker failure path is non-fatal.
- `src/lib/admin/__tests__/steward-trust-spine-context.test.ts` (new) — 28 tests covering each dimension's output, zero-substrate empty-state, all-green tenant, PII redaction, action-queue ordering, pattern-router positive + negative cases, surface gating, broker resolution + degradation. Includes a snapshot of the canonical Apex-seeded block.
- `src/lib/admin/__tests__/__snapshots__/steward-trust-spine-context.test.ts.snap` (new) — pins the composed block shape so future drift is visible in review.
- `src/app/api/chat/agent/__tests__/steward-trust-spine-wiring.test.ts` (new) — 5 source-level guards: route imports the helpers, gates on Steward + setup, injects block + directive, threads tenant name + industry through.

## QA / Validation

- PASS: `npx jest src/lib/admin/__tests__/steward-trust-spine-context.test.ts src/app/api/chat/agent/__tests__/steward-trust-spine-wiring.test.ts` — 33/33 across 2 suites.
- PASS: `npx jest src/lib/admin/__tests__/broker-boundary.test.ts src/lib/admin/broker/__tests__/trust-spine-broker.test.ts src/app/api/chat/agent/__tests__/` — 58/58 (existing boundary + spine + agent-route tests still pass).
- PASS: `npx eslint` over every touched file.
- PASS: `npx tsc --noEmit -p tsconfig.json` clean.
- Note: `npx jest src/lib/admin/` shows one pre-existing failure in `users-access-sso.test.ts` (unrelated to this PR — confirmed by checking out without this branch's changes).

## Rollout Plan

Merge to main after CI passes. No migration, no feature flag, no deploy gate. The Steward chat block lights up automatically on the next prod deploy for every Steward turn on a setup surface. Broker failure degrades to the prior generic-guidance behavior, so the worst case is silent fall-through rather than user-visible breakage.

## Rollback Plan

Revert the PR. The change is two new files plus a single import + a small derived block in the chat route's system-prompt assembly. No data-plane, schema, or other surface change to back out.

## Audit Evidence

- Audit verdict driving this work: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` § 3 (Setup chat rail) and § 7 Wave 3 PR 3.
- Upstream broker: `src/lib/admin/broker/trust-spine-broker.ts` (Wave 1 PR-4, extended Wave 2 PR-1/PR-2/PR-3 to wire integration + isolation + invite + policy events live).
- Steward voice doctrine: `src/lib/agent/voice-doctrine/steward.ts` — TrustSpine grounding composes alongside (not replacing) the existing voice doctrine; both blocks now flow into Steward turns on setup surfaces.

## Known Gaps

- PII redaction is conservative: emails and UUIDs are stripped from every echoed label, but no semantic detection of person names or organization identifiers. The TrustSpine fields we echo (segment labels, connector names, severity counts) are AbarVa-controlled vocabulary, so the surface area for PII leakage is narrow; if a tenant-defined connector name carries PII in the future, it will be visible to the model and we will need a label-side redaction in the connector broker.
- The deterministic question router is regex-based against a small set of canonical phrasings. Semantically similar but lexically different questions ("what's the most important thing right now?", "any urgent items?") will not trigger the stronger directive, though the TrustSpine block itself still grounds the answer. A wider pattern set or an intent classifier is a follow-on.
- The action queue is composed at prompt time from the TrustSpine snapshot only; it does not yet consider age of each action (a stale 5-day-old approval and a 1-hour-old approval rank identically). When the audit ledger surfaces action ages, the composer can weight them in.
