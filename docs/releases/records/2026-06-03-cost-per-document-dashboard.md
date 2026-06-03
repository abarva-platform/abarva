# 2026-06-03-cost-per-document-dashboard — Cost Per Document Dashboard

## Release ID

`2026-06-03-cost-per-document-dashboard`

## Status

`candidate`

## Plain-English Summary

Adds document-level cost visibility to the read-only Customer Admin workspace.
When model/parser metadata includes document identity, token usage, cost, and
cache telemetry, tenant admins can see which documents drove parse cost, chat
cost, and cache efficiency.

## Layer Impact

- `internal-admin`: Enhances `/admin/customer` with document economics for
  operators and tenant admins.
- `client-data-lane`: Reads only tenant-scoped AI egress audit metadata already
  filtered to the active client. No schema change or new write path is added.

## Client Applicability

- All clients: The panel appears for customer-admin users where the Customer
  Admin workspace is enabled.
- Specific clients: None.
- Internal only: The read model and release packet support operator review.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `CustomerAdminDocumentEconomicsPanel` read model aggregates document-bound
  usage metadata from `ai_egress_audit`.
- `/admin/customer` Cost and Usage panel now shows document count, metered
  documents, parse cost, chat cost, total cost, and cache-hit rate.
- Focused Jest coverage proves tenant scoping and per-document economics.

## QA / Validation

- `npx jest src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts --runInBand` — passed.
- `npx eslint 'src/app/(maestro)/admin/customer/page.tsx' src/lib/admin/customer-admin-read-model.ts src/lib/admin/__tests__/customer-admin-page-view-safety.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright`; CI typecheck is the
  authoritative full-repo signal.

## Rollout Plan

Merge to main. The page remains read-only and automatically shows document
economics when egress metadata carries document keys and cost/cache fields.

## Rollback Plan

Revert the PR. The prior aggregate Cost and Usage panel will return without the
document-level table.

## Audit Evidence

- PR URL: pending.
- Local focused Jest output.
- CI checks after PR open.
- `docs/build/COST_PER_DOCUMENT_DASHBOARD_2026-06-03.md`.

## Known Gaps

- No billing ledger or migration is added.
- Parser/upload jobs must emit parse-cost metadata before parse cost becomes
  complete.
- Weekly cost report and tenant budget alerts remain follow-on work.
