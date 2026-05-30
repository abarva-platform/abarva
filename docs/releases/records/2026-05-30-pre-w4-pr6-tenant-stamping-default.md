# 2026-05-30-pre-w4-pr6-tenant-stamping-default — Tenant Metadata Stamping Default-On (PRE-W4-PR-6)

## Release ID

`2026-05-30-pre-w4-pr6-tenant-stamping-default`

## Status

`candidate`

## Plain-English Summary

Every row inserted into `public.ai_egress_audit` now automatically carries `request_metadata.intendedTenantKey` (what the caller asked for) and `request_metadata.resolvedTenantKey` (what the policy/loader actually acted on). Callers cannot accidentally ship un-stamped rows: the new broker wrapper (`src/lib/admin/broker/egress-audit-writer.ts`) is the only module allowed to insert into the table, and it throws if either key is missing.

Cross-tenant mismatch detection for the isolation-posture broker (`isolation-posture-broker.ts:44-52,256-265`) was previously opt-in — a STRESS-P0-006-class silent mis-routing without those stamps would have registered as a normal `allow` row, not an anomaly. With this PR, detection is default-on: every row carries the fields the broker reads, and the wrapper additionally emits a structured `console.warn` at write time when the two keys differ (an early-warning signal that surfaces before someone opens the lane).

A new monopoly hygiene test (`egress-writer-monopoly.test.ts`) scans `src/` for any direct `from('ai_egress_audit').insert(...)` or raw `INSERT INTO ai_egress_audit` outside the broker writer. Future PRs that try to bypass the wrapper fail closed.

## Layer Impact

- `runtime-app-lane`: New broker wrapper `src/lib/admin/broker/egress-audit-writer.ts` owns the sole insert path. The previous `supabase-audit.ts` factory is now a thin sink that delegates to the broker writer, threading a required `EgressAuditTenantContext`. Four call sites updated to supply the context.
- `security-lane`: Tenant-resolution mismatch becomes a guaranteed write-time signal (structured `console.warn` on every mismatched row) plus the existing lane-time anomaly badge. Strengthens STRESS-P0-006-class breach detection.
- `qa-validation-lane`: 9 unit tests for the writer (happy + 3 missing-context throws + caller-metadata preservation + spoof-override + mismatch-warn + match-no-warn + supabase-error-throw). 3 hygiene-gate tests for the monopoly scanner (sanity, writer holds the insert path, no insert outside writer).
- `architecture-lane`: No new direct Supabase imports outside `src/lib/admin/broker/**`. The broker boundary test still passes. The `'server-only'` import on the writer prevents accidental client-bundle inclusion.
- `data-plane-lane`: No schema change. Existing `ai_egress_audit` table from `20260522170000_ai_egress_control_plane.sql` plus the Clerk-string `user_id` patch is unchanged. Only the write contract changes.

## Client Applicability

- All clients: Every tenant's egress audit rows now stamp intended + resolved tenant by default. The Isolation lane and Isolation chip on `/admin/audit?tab=isolation` light up anomalies without requiring callers to remember to stamp the metadata themselves.
- Specific clients: None.
- Internal only: No. This is platform-wide.
- Public/demo only: No.
- Feature flag: None. Always-on.

## Changes Included

- `src/lib/admin/broker/egress-audit-writer.ts` (new) — sole authority that writes `public.ai_egress_audit`. `writeEgressAudit(input, ctx)` validates `intendedTenantKey` / `resolvedTenantKey` / `tenantId`, merges stamps into `request_metadata` (overriding any caller-supplied spoofs), warns on mismatch, calls Supabase via `getAzureWriteFluentClient`, throws on insert error.
- `src/lib/integrations/ai-egress/supabase-audit.ts` (modified) — no longer issues a direct insert. `createSupabaseAiEgressAuditSink(ctx)` now REQUIRES a tenant context and delegates every `.write()` to `writeEgressAudit`. Re-exports the `EgressAuditTenantContext` type for callers.
- `src/lib/integrations/ai-egress/anthropic-direct.ts` (modified) — supplies tenant context (`intendedTenantKey: args.tenantId`, `resolvedTenantKey: tenantId from loader`, `tenantId: resolved`).
- `src/lib/integrations/ai-egress/openai-direct.ts` (modified) — same wiring.
- `src/lib/corpus/embedding.ts` (modified) — supplies tenant context from `args.clientId` (intended) and `policyRecord.tenantId` (resolved).
- `src/lib/agents/sentinel-reasoning/db.ts` (modified) — `createSentinelAiAuditSink(ctx)` now accepts and forwards the tenant context; memory-fallback path preserved on Supabase write failure.
- `src/lib/agents/sentinel-reasoning/model.ts` (modified) — supplies tenant context (`args.clientId` intended, resolved-from-loader as resolved).
- `src/lib/admin/broker/isolation-posture-broker.ts` (doc comment only) — top-of-file caveat updated to reflect that tenant stamping is default-on since PRE-W4-PR-6. The anomaly detector at lines 254-269 is unchanged; it now sees stamped fields on every row.
- `src/lib/admin/broker/__tests__/egress-audit-writer.test.ts` (new) — 9 tests pinning the wrapper contract.
- `src/lib/admin/broker/__tests__/egress-writer-monopoly.test.ts` (new) — 3 hygiene-gate tests: sanity (files found), writer holds the insert path, no insert outside writer.
- `docs/releases/records/2026-05-30-pre-w4-pr6-tenant-stamping-default.md` (new) — this record.

## QA / Verification

- `npx eslint src/lib/admin/broker src/lib/integrations/ai-egress src/lib/corpus/embedding.ts src/lib/agents/sentinel-reasoning` → green (2 unused-arg warnings in fake-client test helper; no errors).
- `npx tsc --noEmit` → green for the touched paths (pre-existing missing-module errors for Azure SDKs / pptx unaffected; per `feedback_typecheck_workflow_artifact.md` these are workflow artifacts).
- `npx jest src/lib/admin/broker/__tests__` → 98 passed, 9 suites (includes 9 new writer tests + 3 monopoly tests).
- `npx jest src/lib/integrations/ai-egress` → 11 passed, 2 suites (existing sink contract tests still pass via memory-sink path).
- `npx jest src/lib/admin/__tests__/broker-boundary.test.ts` → green; the writer lives inside the broker dir so the exemption applies.

## Rollout

Always-on. The contract change is type-level: callers that previously called `createSupabaseAiEgressAuditSink()` with no argument no longer compile. The four known callers have been updated in this PR. Any caller landed in a feature branch that has not yet merged will receive a compile error when rebased, with a clear message pointing at the new required `EgressAuditTenantContext`.

## Rollback

`git revert` is safe. The old direct-insert path in `supabase-audit.ts` is preserved in history; reverting restores it and removes the `ctx` requirement. Existing rows are unaffected — only the write contract changed, not the schema.

## Audit Evidence

- `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §6 risk register (cross-tenant leak) — this PR closes the "detection is opt-in" gap.
- `src/lib/admin/broker/isolation-posture-broker.ts:44-52` — the original opt-in caveat (now updated to reflect default-on).
- `src/lib/admin/broker/__tests__/egress-writer-monopoly.test.ts` — the hygiene gate that codifies the monopoly.

## Hard Constraints Respected

- Design system LOCKED — no UI change.
- Broker boundary — monopoly enforced; new writer lives in `src/lib/admin/broker/**`.
- PII — wrapper does not change which fields are written. Payload-fingerprint columns (`prompt_hash`, `response_hash`, snapshot refs) remain caller-controlled and are still excluded from any admin lane projection.
- No silent failures — missing context throws loudly; Supabase errors throw. The Sentinel sink keeps its in-memory fallback only at the sink layer, not at the writer layer, so the contract stays clean.
