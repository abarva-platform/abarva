# ctx-030-setup-triage-queue — Classification Triage Queue for Context Records

## Release ID

`ctx-030-setup-triage-queue`

## Status

`candidate`

## Plain-English Summary

This release adds a Classification Triage Queue to the Admin / Context Layer section. When context records are loaded with an unknown domain segment (classification_source = NEEDS_CLASSIFICATION, lifecycle_state = review), operators can now navigate to /admin/context-layer/triage, select the correct domain segment for each record, optionally add a business function, and click Confirm. Confirmed records are immediately promoted to lifecycle_state = active with classification_source = OPERATOR_CONFIRMED, making them available to Explore and Sentinel answers.

A Postgres migration adds four new nullable columns to enterprise_context_records (domain_segment, business_function, criticality, classification_source), extends the lifecycle_state check constraint to accept 'review', and adds a partial index for fast triage queue lookups.

## Layer Impact

- `internal-admin` lane: New admin UI page (/admin/context-layer/triage) and two API routes (GET /api/admin/context-layer/triage, PATCH /api/admin/context-layer/triage/[id]). These are operator-only surfaces behind Clerk authentication and tenant-key scoping. No public-facing or client-facing behavior changes.
- `client-data-lane`: Additive Postgres migration adds nullable columns and an extended check constraint to enterprise_context_records. No existing rows are modified; the migration is safe for production apply.

## Client Applicability

- All clients: No. This is an AbarVa operator tool, not a client-facing surface.
- Specific clients: No.
- Internal only: Yes. AbarVa operators only. Requires a valid Clerk session with an active client row.
- Public/demo only: No.
- Feature flag: None required; the triage queue is empty on tenants with no NEEDS_CLASSIFICATION records.

## Changes Included

- New migration: `supabase/migrations/20260616210000_enterprise_context_classification_triage.sql` — adds domain_segment, business_function, criticality, classification_source columns to enterprise_context_records; extends lifecycle_state check constraint; adds partial index.
- New API route: `src/app/api/admin/context-layer/triage/route.ts` — GET handler returning NEEDS_CLASSIFICATION records for the active tenant.
- New API route: `src/app/api/admin/context-layer/triage/[id]/route.ts` — PATCH handler promoting a single record to OPERATOR_CONFIRMED + active.
- New component: `src/components/admin/context-layer/ClassificationTriageQueue.tsx` — client component with table, domain segment dropdown, optional business function field, confirm button, toast feedback, skeleton loading, and empty state.
- New page: `src/app/(maestro)/admin/context-layer/triage/page.tsx` — server component page with breadcrumb, title, subtitle, and the queue component.
- Updated: `src/app/(maestro)/admin/context-layer/page.tsx` — Classification Triage link added to the navigation panel.

## QA / Validation

- PASS: `npx tsc --noEmit` — zero errors in new files; pre-existing errors in `document-intelligence-layout.ts` and `public-axe.spec.ts` are unrelated upstream gaps.
- NOT RUN: Authenticated browser smoke test (requires a real Clerk session with a tenant that has NEEDS_CLASSIFICATION records). Triage queue renders empty state gracefully when no records match.
- NOT RUN: Database migration against real Postgres (requires ACA VNet access). Migration uses IF EXISTS / IF NOT EXISTS guards and is idempotent.
- PASS: `node scripts/release-check.mjs --base origin/main --head HEAD`

## Rollout Plan

1. Merge to main. ACA main deploy workflow builds a new Azure Container Apps image revision.
2. Apply migration via the `job-abarva-db-migrate-lab-eastus` ACA job (az acr build + image-override pattern from the VNet job runbook).
3. Navigate to /admin/context-layer — the Classification Triage link appears in the navigation panel.
4. To populate the queue, load records with classification_source = 'NEEDS_CLASSIFICATION' and lifecycle_state = 'review' via the bulk-upload governed path or a future loader that flags unknown segments.

## Rollback Plan

Revert the PR to restore prior navigation links and remove the triage page, component, and API routes. The migration columns are nullable and additive — no data rollback is required; existing records remain unaffected. If the lifecycle_state constraint change causes issues, drop and recreate it with the original three-value set.

## Audit Evidence

- PR: pending.
- CI: pending.
- TypeScript: `npx tsc --noEmit` — zero errors in new files.
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` — PASS.
- ACA deploy: pending.

## Known Gaps

- Triage queue currently only surfaces records with lifecycle_state = 'review'. Future loaders that set this state are not yet wired. The queue will show empty until the bulk-upload or a future ingestion path sets the correct classification_source and lifecycle_state.
- Criticality field is stored but not exposed in the triage UI (future enhancement).
- No count badge on the context-layer dashboard link (would require an async server query per page load; deferred to keep the dashboard fast).
