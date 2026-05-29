# 2026-05-29-packet-30-phase-2c-admin-residual-reads — Phase 2C.1b Admin Residual Reads

## Release ID

`2026-05-29-packet-30-phase-2c-admin-residual-reads`

## Status

`candidate`

## Plain-English Summary

This release moves the remaining pure admin read surfaces from direct runtime
Supabase access to the Packet 30 Azure read plane. It covers setup inventory,
AI initiative detail and overview helpers, Atlas trace browsing, program
approval counts, and the pilot dashboard client-id lookup. It does not change
schemas, tenant data, mutations, Clerk behavior, or storage.

## Layer Impact

- data-plane-lane: admin reads now pass through `azureRead` instead of runtime
  Supabase helpers.
- runtime-app-lane: admin pages and the admin approvals GET endpoint keep the
  same projections, tenant predicates, ordering, limits, and fail-soft behavior.
- release-governance-lane: updates Phase 2C inventory and adds a parity
  artifact with census deltas, deferred residue, validation, and rollback.
- client-data-lane: no migrations, seed changes, or data writes.

## Client Applicability

- All clients: admin surfaces read tenant-scoped rows through the same shared
  read plane.
- Specific clients: `/platform/admin/pilot/[tenantKey]` applies to the five
  canonical pilot tenants when accessed by admins.
- Internal only: yes, these are admin/control-lane surfaces.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Converted `src/lib/admin/setup-data-broker.ts` to `azureRead`.
- Converted `src/lib/admin/ai-initiatives/detail-queries.ts` to `azureRead`.
- Converted `src/lib/admin/overview-data.ts` to `azureRead`.
- Converted admin read-only pages:
  - `src/app/(maestro)/admin/atlas/traces/page.tsx`
  - `src/app/(maestro)/admin/programs/approvals/page.tsx`
  - `src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx`
- Converted `GET /api/admin/programs/approvals` counts to `azureRead`.
- Added focused tests for setup broker, AI initiative detail, overview counts,
  and the admin approvals API route.
- Updated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.
- Added `verification/packet-30-phase-2c/2c1-admin-residual-reads-parity.md`.

## QA / Validation

Validation performed:

```text
npx jest src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/ai-initiatives/queries.test.ts src/lib/admin/ai-initiatives/detail-queries.test.ts src/lib/admin/overview-data.test.ts src/app/api/admin/programs/approvals/__tests__/route.test.ts --runInBand
npx eslint src/lib/admin/setup-data-broker.ts src/lib/admin/__tests__/setup-data-broker.test.ts src/lib/admin/ai-initiatives/detail-queries.ts src/lib/admin/ai-initiatives/detail-queries.test.ts src/lib/admin/overview-data.ts src/lib/admin/overview-data.test.ts 'src/app/(maestro)/admin/atlas/traces/page.tsx' 'src/app/(maestro)/admin/programs/approvals/page.tsx' 'src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx' src/app/api/admin/programs/approvals/route.ts src/app/api/admin/programs/approvals/__tests__/route.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Results:

- Focused Jest: pass, 5 suites / 33 tests.
- Focused ESLint: pass.
- Runtime Supabase census: pass/WARN, reduced from `167 files / 688
  import-helper matches` to `160 files / 661 import-helper matches`.
- Codemod inventory: pass, reduced `READ_ONLY_SELECT` from `110` to `103`.
- Diff whitespace check: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`,
  `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors were emitted before
  those dependency-resolution failures.

## Rollout Plan

Merge to main after CI is green, then allow the normal Vercel production
deployment to promote the runtime reads. No database migration or manual data
operation is required.

Post-deploy smoke targets:

- `/admin/atlas/traces`
- `/admin/programs/approvals`
- `/platform/admin/pilot/apex-retail`
- `GET /api/admin/programs/approvals` under an authenticated admin session

## Rollback Plan

Rollback is file-local for the converted surfaces. If one surface regresses,
revert the corresponding file and redeploy. If multiple admin surfaces regress,
revert this merge commit and restore the previous production deployment.

## Audit Evidence

- Parity artifact:
  `verification/packet-30-phase-2c/2c1-admin-residual-reads-parity.md`
- Census artifact:
  `verification/packet-30-phase-2c/2c1-admin-residual-reads-census.json`
- Updated inventory:
  `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`
- Runtime census command output in PR checks/comments.
- PR CI and Vercel deployment evidence after merge.

## Known Gaps

- Admin POST routes that combine defensive reads with Clerk side effects or
  data-plane writes stay out of this pure-read slice and move to the mixed
  read/write phase.
- The onboarding confirmation path stays in manual/storage-adjacent review.
- Phase 2D warn-to-fail Supabase guard enforcement remains out of scope until
  Phase 2C completes.
