# 2026-06-02-admin-setup-load-studio-redesign — /admin/setup Data Loads: real per-tenant operator workflow

## Release ID

`2026-06-02-admin-setup-load-studio-redesign`

## Status

`candidate`

## Plain-English Summary

`/admin/setup` (the Data Load Center) had become a dense implementation document instead of an operator tool. An audit found six stacked full-page sections — a "Reload command plan" (9-step Azure/system spec), a "Pilot verifier posture" checklist (with `npm run verify:pilot-data-plane` shell commands), a 33-row "Templates by dimension" reference table, plus implementation jargon throughout (`Azure Blob`, `landing-zone`, `tenant-keyed`, `Postgres/search`, `idempotency`, `T357-T360`). Worse, the dimension readiness numbers (% complete, status, owner) were **synthetic — derived from checked-in JSON manifests, identical for every tenant**.

This rebuilds the page to the approved v2 wireframe as a calm operator workflow: a client identity band, a five-metric status strip, the single most-urgent next action, a governed-load workflow rail, the dimension readiness table, the governance controls, and an audit-trail preview. **Every number is now real and per-tenant**, read from the live inventory snapshot (`getSetupInventorySnapshot`): coverage, record counts, health/status, last-loaded date, and the recent-activity ledger — with honest empty states ("No data has been loaded for {client} yet", "—") and never a fabricated value. The reload-command-plan, pilot-verifier checklist, and template catalog are no longer on the page; the page links out to their owning routes (`/admin/templates`, `/admin/production-readiness`). Controls route into the real owning workflows (`/admin/context-layer/uploads`, `/admin/context-layer/approval-queue`, `/platform/admin/quarantine`, `/admin/data-trust`) — the page surfaces what to do and routes to act, it does not perform commits inline.

## Layer Impact

- `global-control-lane`: the shared `/admin/setup` Data Loads surface for all clients, no feature gate. Presentation + read-only data binding.
- `client-data-lane` (read-only): the page now reads each client's real loaded-substrate inventory (segment rollups + audit-log tail) — client-scoped via `clientKeyToInventorySubstrateKey`, no cross-client data, no writes.

## Client Applicability

- All clients: yes — every tenant sees its own real loaded dimensions + audit trail, or an honest empty state.
- Specific clients: none singled out.
- Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/lib/admin/setup-load-studio-view.ts` — new pure composer `buildLoadStudioView({tenantName, vertical, snapshot})`: turns the real inventory snapshot into the operator view (identity, 5 metrics, single next action, 7-step workflow rail, readiness rows, controls, ledger). Honest empty states; never fabricates a number; all action hrefs route to real product surfaces.
- `src/lib/admin/__tests__/setup-load-studio-view.test.ts` — unit tests: real-money/record metrics, readiness sort + health→status mapping, blocked-dimension next action, ledger from recent activity, honest empty state, and a jargon-free contract.
- `src/components/admin/SetupDataLoadCenter.tsx` — rewritten (1046 → ~560 lines) to the v2 wireframe. Locked palette (cream/ink/serif, black + ghost buttons, hairline borders, one amber accent). Responsive content grid (collapses at 1060px / 760px). Removed the reload-command-plan, pilot-verifier, exception-intake, dimension-library, and 33-row template sections from the page.
- `src/app/(maestro)/admin/setup/page.tsx` — now async: resolves the broker tenant key and fetches `getSetupInventorySnapshot(...).catch(() => null)` (client-scoped, honest fallback), composes the view, renders inside `AdminCanonShellV2`. No longer depends on the synthetic `buildSetupDataLoadCenterModel` for rendered numbers.
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts` — rewritten design-pin: encodes the new contract (real-snapshot binding, v2 sections, jargon-free, real route targets) and guards re-introduction of the removed implementation-doc sections.

## QA / Validation

- `npx jest` on the affected suites → **all green**: new `setup-load-studio-view` (6), rewritten `page-source` (8), existing `setup-data-load-center` model test, `admin-visible-vocabulary`, and `setup-admin-route-registry-parity` (8).
- `npx eslint` clean on all touched files. `npx tsc --noEmit` clean on touched files (one unrelated pre-existing error: missing `@axe-core/playwright` dev-dep in a Playwright a11y spec).
- Data honesty verified: dimension readiness, metrics, last-loaded, and the audit trail are all derived from `getSetupInventorySnapshot`; null/empty snapshot renders calm empty states, never invented numbers. Deliberately did NOT reuse the synthetic `dimensionCatalog`/`metrics` from the old model (static manifest data, identical per tenant).
- Tenant isolation: uses the same `clientKeyToInventorySubstrateKey` → `getSetupInventorySnapshot` wiring the verified `/admin` landing and Data Trust use (no `apexretail`/`apex-retail` key mismatch).

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, env var, or feature flag.

## Rollback Plan

`gh pr revert <pr>` and redeploy. Presentation + read-only binding; the new view composer + tests are additive; rollback restores the prior implementation-doc page with no data dependency.

## Audit Evidence

- PR: (filled on open)
- Source audit + v2 wireframe: `~/Downloads/ADMIN_SETUP_DATA_LOADS_WIREFRAME_2026-06-02.html` (operator-supplied).
- Findings verified against live code before build: 5 stacked sections (lines 286/440/646/789/955), jargon in the model strings, static `<a href>` controls — all confirmed. F-02 (503 on cold load) not reproduced (307 Clerk redirect). F-01 (sidebar stacking) is partly an `AdminCanonShellV2` concern, tracked separately.
- Reuses verified tenant-keyed read: `getSetupInventorySnapshot`. Deliberately NOT used: `buildSetupDataLoadCenterModel().dimensionCatalog` (synthetic, manifest-derived — would re-introduce identical-per-tenant numbers).

## Known Gaps

- The workflow rail's furthest state is an honest aggregate of real segment health (no data → waiting at Upload; issues → paused at Validate; all committed → complete), not a single in-flight file's live run — a per-run stepper is a follow-up once a live run-state read is exposed.
- Approval/rollback are surfaced as routes into their owning workflows, not inline actions (by design — the page routes to act, it does not commit inline).
- F-01 responsive: the content canvas is fixed here; the `AdminCanonShellV2` sidebar's sub-900px stacking is a separate shell follow-up.
- The legacy `setup-data-load-center.ts` model remains for its own test + the route-registry-parity test; it is no longer the page's data source and can be retired in a later cleanup.
