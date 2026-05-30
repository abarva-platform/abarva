# 2026-05-30-fix-trust-spine-snapshot-divergence — TrustSpine / masthead substrate-count divergence (P0)

## Release ID

`2026-05-30-fix-trust-spine-snapshot-divergence`

## Status

`candidate`

## Plain-English Summary

On `/admin` for any tenant where the `data_inventory_segments` substrate is
populated, two read paths could disagree:

- The masthead pills and Section 02 read the page-cached snapshot from
  `cachedInventorySnapshot(brokerTenantKey)`.
- The Trust strip and posture grid read `getTrustSpine(brokerTenantKey)`, which
  in turn issued an INDEPENDENT call to `getSetupInventorySnapshot`.

If the second (Trust-spine-internal) call rejected for any reason — connection
hiccup, transient DB-pool exhaustion under React Server Component concurrency,
etc. — `getTrustSpine` fell back to a zero-substrate dimension SILENTLY (no
warn log, unlike the other five dimensions). The user saw the masthead pills
say `14 SEGMENTS LOADED · 415 RECORDS` while the Trust strip read `0 no data
yet (estimated)` and the posture grid rendered empty cards. The W3-PR-6
empty-state polish then took over the page, telling the prospect to "Upload
your first dataset" on a tenant we'd been curating for weeks.

Investigation (browser walk `MANUAL_BROWSER_WALKTHROUGH_2026-05-30.md` §P0 #1)
hypothesized a tenant-key mismatch in `clientKeyToInventorySubstrateKey`, but
the substrate `tenant_key` column was canonicalized to the long-form key (e.g.
`meridian-health`) by migration `20260515120000_tenant_key_canonicalization.sql`
and `clientKeyToInventorySubstrateKey` already returns that exact value
(verified by existing tests at
`src/lib/agent/tools/intelligence/__tests__/_shared.test.ts:138-149` and by
the audit script `src/scripts/audit/audit-numbers-sanity.ts:23` which uses
`brokerKey: 'meridian-health'` directly). The real failure mode is the silent
double-call divergence described above.

Fix: thread the page's already-cached snapshot through to `getTrustSpine` via a
new `options.snapshotOverride` parameter, eliminating the duplicate DB read at
source. Add symmetric warn logging on the residual `getSetupInventorySnapshot`
rejection path so future divergences are observable. Add a regression test that
locks `clientKeyToInventorySubstrateKey` to the substrate-column values for all
five canonical tenants.

## Layer Impact

- **runtime-app-lane (correctness)** — eliminates a silent double-call
  divergence between the page-cached snapshot and the trust-spine-internal
  snapshot read. Trust strip + posture grid now reflect the same substrate
  count as the masthead pills.
- **qa-validation-lane** — new tenant-key contract test
  (`src/lib/admin/__tests__/tenant-key-consistency.test.ts`) and two new
  TrustSpine broker tests (`snapshotOverride` honored;
  `setup_inventory_snapshot.degraded` warn emitted on rejection).

## Client Applicability

- **All clients:** all five canonical tenants benefit — the failure mode is
  intermittent, not tenant-specific. The original symptom was reported on
  Meridian but could surface on any tenant under DB-pool pressure.
- **Specific clients:** N/A.
- **Internal only:** N/A.
- **Public/demo only:** N/A.
- **Feature flag:** N/A — fix is unconditional.

## Changes Included

- `src/lib/admin/broker/trust-spine-broker.ts` — `getTrustSpine` accepts
  `options.snapshotOverride`; adds symmetric warn logging on the snapshot
  rejection branch.
- `src/app/(maestro)/admin/page.tsx` — `cachedTrustSpine` now awaits
  `cachedInventorySnapshot` first and threads the result into `getTrustSpine`.
- `src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` — new tests for
  `snapshotOverride` (honored both for a value and for explicit `null`) and
  for the new degraded-warn line. Existing substrate-throw test updated to
  assert the new warn.
- `src/lib/admin/__tests__/tenant-key-consistency.test.ts` (new) — contract
  test locking `clientKeyToInventorySubstrateKey` to the substrate-column key
  for all five canonical tenants, and documenting the deliberate divergence
  with `clientKeyToBrokerTenantKey` (which the Sentinel-side
  EnterpriseDataRoom uses).

## QA / Validation

- `npx jest src/lib/admin/__tests__/tenant-key-consistency.test.ts` → PASS
  (8 tests, new file).
- `npx jest src/lib/admin/broker/__tests__/trust-spine-broker.test.ts` → PASS
  (24 tests — 2 new + 22 existing, including the updated substrate-throw test
  that now also asserts the new warn).
- `npx jest src/lib/agent/tools/intelligence/__tests__/_shared.test.ts` → PASS
  (16 tests — confirms the substrate-key mapping was NOT changed; existing
  contract preserved).
- `npx tsc --noEmit` → no new errors. Only the pre-existing
  `@azure/identity` / `@azure/storage-blob` / `@azure/service-bus` /
  `pptxgenjs` / `@resvg/resvg-js` "Cannot find module" warnings remain, which
  are the documented worktree workflow artifact per
  `feedback_typecheck_workflow_artifact.md`.
- `npx eslint src/lib/admin/broker/trust-spine-broker.ts src/app/(maestro)/admin/page.tsx src/lib/admin/__tests__/tenant-key-consistency.test.ts src/lib/admin/broker/__tests__/trust-spine-broker.test.ts`
  → PASS (no lint output).
- `npm run test:behaviors` → 5 pre-existing failures in
  `src/__tests__/behaviors/tenant-onboarding.test.ts` (unrelated to this
  change — confirmed by re-running with my changes stashed: same 5 failures
  on bare main). All other 85 behaviors tests PASS.

## Rollout Plan

Merge to main → Vercel production deploy via existing PR auto-deploy pipeline.
No migrations, no env vars, no feature flag.

## Rollback Plan

Revert the PR. The change is additive (`getTrustSpine` accepts the new optional
parameter; old call sites without it preserve the prior behavior). No data
shape changes.

## Audit Evidence

- Source diagnostic: `docs/build/MANUAL_BROWSER_WALKTHROUGH_2026-05-30.md` §P0
  bug #1 ("Trust strip / posture grid / empty-state inverted for non-empty
  tenant") and §P0 bug #2 ("`emptyTenant` flag is a footgun").
- Substrate-column key evidence: migration
  `supabase/migrations/20260515120000_tenant_key_canonicalization.sql` lines
  48-51 (alias map) and the audit script
  `src/scripts/audit/audit-numbers-sanity.ts` lines 22-24 (uses
  `brokerKey: 'meridian-health'` to query `data_inventory_segments`).
- PR URL: filled in after `gh pr create`.
- CI run: filled in after CI completes.

## Known Gaps

- The original walk-through doc proposed an alternative fix that changed
  `clientKeyToInventorySubstrateKey` to return `brokerTenantKey` (with
  `meridian` instead of `meridian-health`). That fix would have broken the
  working substrate path because the substrate `tenant_key` column was
  canonicalized in migration 20260515 to `meridian-health`. The contract test
  added in this PR locks in the correct mapping so future drift toward the
  proposed-but-wrong fix is caught at CI.
- The `emptyTenant` flag in `admin/page.tsx` was already cross-validated
  against the page snapshot in a prior PR (PRE-W4-PR-5); no further change
  needed there.
