# 2026-05-30-pre-w4-pr5-empty-state-activation — Empty-state activation + UI polish bundle

## Release ID

`2026-05-30-pre-w4-pr5-empty-state-activation`

## Status

`candidate`

## Plain-English Summary

Four small fixes to the `/admin` Setup landing, drawn from `PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md` §9 (fixes #1, #2, #6, #7 plus bonus #8 audit-ribbon copy):

1. **Activate the W3-PR-6 empty-state code.** The `emptyTenant` flag was never computed on the server page, so `EmptyTenantPrimaryCard` + `EmptyTenantUploadAffordance` (shipped in W3-PR-6) were unreachable for brand-new tenants. Now derived from `snapshot.segments.length === 0` and threaded into `HomeOverviewV2`.

2. **Retire the AI Initiatives Setup panel.** Panel #02 used to point at `/home/ai-initiatives`, which hard-redirects to `/home` — ejecting tenant admins from `/admin` every time they clicked the card. The Intelligence wave will redesign the initiatives surface; until then the panel is removed entirely. Setup panel numbering stays stable (03 Connectors, 04 Users & Access, …) so deep links and the design vocabulary don't drift.

3. **Unify the masthead label.** Browser tab said `Setup · AbarVa`, sidebar said `Setup · Admin`, masthead eyebrow said `HOME · WHERE YOU STAND…`. Pick one noun and use it — the eyebrow now reads `SETUP · WHERE YOU STAND…`.

4. **Suppress all-red Section 01 readiness for empty tenants.** Four modules would all evaluate to ≤30% (red bucket) with no substrate loaded — punishing a brand-new tenant on arrival. When `emptyTenant` is true, `composeHomeV2Extras` emits an empty `readiness` array and `HomeOverviewV2` renders a single editorial placeholder ("Readiness will compute when your first dataset lands.") instead of four red bars.

**Bonus fix #8:** the audit ribbon empty line was a flat "No activity in the last 24 hours." for an empty tenant. Replaced with a stewarded sentence naming what fills the ribbon (substrate ingest, auth/policy/approval events).

## Layer Impact

- `runtime-app-lane`: `/admin` landing now reacts to `emptyTenant` flag — empty-state primary card + 4-tile upload affordance + editorial Steward orientation activate for brand-new tenants.
- `qa-validation-lane`: New snapshot tests for empty vs non-empty paths.

## Client Applicability

- All clients (user-visible change on the `/admin` landing).
- Specific clients: None singled out.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/admin/page.tsx` — derives `emptyTenant` from snapshot; threads through to `HomeOverviewV2`.
- `src/lib/admin/home-overview-v2.ts` — `composeHomeV2Extras` returns empty readiness when tenant is empty; AI Initiatives panel removed from panels array.
- `src/components/home/HomeOverviewV2.tsx` — eyebrow now `SETUP · WHERE YOU STAND…`; Section 01 renders placeholder when `readiness` is empty.
- `src/components/admin/AuditRibbon.tsx` — empty-state copy refined to name what fills the ribbon.
- Updated existing tests where layout intentionally changed; new snapshot tests cover both paths.

## QA / Validation

- PASS: `npx eslint src/` (0 errors).
- PASS: `npx tsc --noEmit` (clean).
- PASS: `npx jest src/components/home src/lib/admin` (snapshots updated).
- PENDING: PR CI gates at submission time.

## Rollout Plan

Merge to main → Vercel production deploy redeploys `/admin` with empty-state activation. No migration, no feature flag, no runbook step.

## Rollback Plan

Revert this PR. Dead code returns; empty-tenant landing reverts to authored-fallback queue. No data migration to reverse.

## Audit Evidence

- Persona walkthrough: `docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md` §9 fixes 1, 2, 6, 7, 8.
- Audit verdict: `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 (empty state) + §2 (label unification).

## Known Gaps

- Section 01 placeholder is a single editorial line; future polish could turn it into a "what readiness measures" preview.
- Audit-ribbon empty copy is static; could compute time-since-provision from `activeClient.created_at` for tighter Day-1 framing (PERSONA_A §9 fix #8 second half).
- AI Initiatives panel is removed entirely. If the Intelligence wave reintroduces an initiatives surface, the panel slot must be re-numbered intentionally.
