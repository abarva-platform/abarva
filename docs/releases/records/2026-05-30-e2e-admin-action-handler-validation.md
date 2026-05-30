# 2026-05-30-e2e-admin-action-handler-validation — E2E validation pass for Trust Plane action handlers

## Release ID

`2026-05-30-e2e-admin-action-handler-validation`

## Status

`candidate`

## Plain-English Summary

Adds a Playwright e2e spec (`tests/e2e/admin-action-handlers.spec.ts`)
that walks the action handlers shipped today by the Trust Plane work (45
PRs) for every canonical demo tenant — Apex Retail, Meridian Health,
First Capital, Northstar Clinical, SkyHarbor Air — and asserts the
user-visible success-state contract for each. Also adds an honest
validation report (`docs/build/E2E_VALIDATION_2026-05-30.md`) that
records what was tested, what passed, what was blocked, and what was
deliberately not tested.

Findings from the same pass: the existing PR-G regression gate spec
(`tests/e2e/admin-tenant-isolation.spec.ts`) catches two real Apex-leak
regressions on `/admin?tab=tenant` (P0) and `/admin/releases` (P1) for
every non-Apex tenant. The fixes for those two routes are out of scope
for this PR — captured as recommended follow-ups in the report.

## Layer Impact

- `global-control-lane`: adds test infra only. No runtime behavior
  changes.
- `client-data-lane`: no schema, broker, RLS, or seed changes. The new
  spec reads from the broker through the live app surface; it does not
  write.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — test infrastructure + audit doc
- Public/demo only: no
- Feature flag: none

## Changes Included

- `tests/e2e/admin-action-handlers.spec.ts` — 35 tests, 5 personas × 7
  surfaces, all green against local `npm run dev` on `BASE_URL=http://localhost:3000`.
- `docs/build/E2E_VALIDATION_2026-05-30.md` — full report with PASS /
  BLOCKED / NOT-WALKED table per persona × surface and a follow-up list
  for the two leak regressions the PR-G gate caught.
- This release record.

## QA / Validation

```bash
BASE_URL=http://localhost:3000 npx playwright test \
  tests/e2e/admin-action-handlers.spec.ts --reporter=list --workers=1
# Result: 35 passed (5.3m)
```

The existing PR-G spec was also re-run per-tenant. Result documented in
the report:

- `/admin?tab=tenant` — FAIL on meridian-health, first-capital,
  northstar-clinical, skyharbor-air (P0 regression: AdminTenantTab falls
  through to TENANT_FIXTURE because the parent page passes no `config`
  prop).
- `/admin/releases` — FAIL on all 4 non-Apex tenants (P1 regression:
  Release Ledger renders the literal `--client-id apexretail` from the
  2026-05-30-tower-servicenow-cmdb-ingest release record markdown body).
- The remaining 16 admin routes pass the leak gate for every tenant.

No new behavior shipped — the only artifacts are test + doc.

## Rollout Plan

- Merge to main.
- CI runs the spec in PR mode; production deploy is unaffected.
- No runtime rollout, no migration apply, no flag flip.

## Rollback Plan

- Pure revert. The PR adds one spec file, one report markdown, and this
  release record. Deleting the three files restores prior state. No data
  migration to unwind.

## Audit Evidence

- PR URL: (filled at PR-open time)
- CI run: (filled at PR-open time)
- Local run output captured in `docs/build/E2E_VALIDATION_2026-05-30.md`
  §3 (35 PASS) and §2 (per-tenant table for the PR-G spec).
- Recommended follow-up tickets:
  - P0 fix `/admin?tab=tenant` to thread broker tenant config through
    `<AdminTenantTab />`.
  - P1 fix `/admin/releases` markdown to remove the `apexretail` CLI
    literal in the 2026-05-30 servicenow-cmdb record, OR tenant-scope
    the release ledger surface.

## Known Gaps

- `sendInvite`, `tenant-switch`, and `notification-preferences-save`
  click flows are NOT executed end-to-end (would email a real recipient
  / mutate the persona cookie / pollute the demo preferences row). The
  spec walks to the actionable affordance and asserts visibility +
  enablement; the actual mutation is covered by unit tests under
  `src/components/admin/__tests__` and `src/lib/admin/__tests__`.
- `ConnectorTestConnectionButton` and `ApprovalDecisionPanel` are
  blocked on demo-seed completeness — non-Apex tenants have no
  connector rows and no pending approvals.
- Steward chat tenant-aware response is not exercised here; deferred to
  the existing hygiene + PR-B unit suite which gates the tenant-aware
  editorial body.
