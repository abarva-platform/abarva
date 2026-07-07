# 2026-06-01-data-load-studio-calm-reskin — Data Load Studio Apple-calm reskin

## Release ID

`2026-06-01-data-load-studio-calm-reskin`

## Status

`candidate`

## Plain-English Summary

The `/admin/setup` Data Load Studio looked cluttered: a navy-and-multicolor palette, four heavy stat tiles, a duplicated three-button hero, a raw "Control:" engineering label on every workflow row, two large dense tables (a 7-column template registry and a 5-column readiness grid), and a redundant page title wrapper. This change reskins the Studio to the locked AbarVa design system (cream background, near-black ink, Georgia/Cormorant serif headings, black + ghost buttons, hairline borders) and removes the clutter, following `docs/build/PILOT_DATA_LOAD_STUDIO_DESIGN_SPEC_2026-06-01.md` and the synthesis brief `docs/build/ADMIN_SIMPLIFY_STUDIO_FIRST_BRIEF_2026-06-01.md`. The first viewport is now: active client + one serif headline + one primary action ("Start a governed load") + a single amber "Next decision" aside + a one-line readiness summary strip (with a load-bearing blocked count). Below it: the dimension library (one calm contextual button per card), a read-as-status governed workflow stepper (monitored rows show no fake button), and a trimmed 4-column template reference. A calm empty/first-load state was added for freshly-seeded clients. No business logic or read model changed — this is a presentation-layer reskin of one component plus its page wrapper.

## Layer Impact

- `global-control-lane`: shared Admin/Setup chrome for all clients, no feature gate. Presentation only — `src/components/admin/SetupDataLoadCenter.tsx` (rewrite) and `src/app/(maestro)/admin/setup/page.tsx` (drop the redundant EditorialCanvas title wrapper; mount the Studio directly).
- No `client-data-lane` impact: the `SetupDataLoadCenterModel` read model is unchanged; no schema, migration, API, or data path touched.

## Client Applicability

- All clients: yes — the Setup surface is shared chrome; Apex, Meridian, SkyHarbor all render the calmer Studio from their own scoped model.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/admin/SetupDataLoadCenter.tsx` — reskin + declutter: removed navy fills and sky/mint/coral decorative chips (black + ghost + hairline only); replaced four stat tiles with a one-line summary strip (incl. blocked count above the fold); collapsed the hero to one primary action; removed the `Control: {control.control}` infra label; rendered `href:null` workflow rows as "Monitored" with no button; trimmed the template table from 7 to 4 columns; removed the duplicated "Templates ready now" panel and the "Data loaded by dimension" review table; added a calm empty/first-load state.
- `src/app/(maestro)/admin/setup/page.tsx` — mount `SetupDataLoadCenter` directly in the shell (removed the `EditorialCanvas` wrapper so the page title no longer doubles the Studio hero).
- `src/app/(maestro)/admin/setup/__tests__/page-source.test.ts` — updated string assertions to the new calm copy and added two guards: no `COLORS.navy` fills, no `Control: {control.control}` infra label.

## QA / Validation

- `npx jest --testPathPatterns "admin/setup"` → 5 suites, 27 tests pass.
- `npx eslint src/components/admin/SetupDataLoadCenter.tsx "src/app/(maestro)/admin/setup/page.tsx"` → clean.
- `npx tsc --noEmit` → no errors on the changed files.
- Design-system fidelity: zero `COLORS.navy` references remain in the component; black primary + ghost secondary only; serif headings; hairline borders.
- Tenant isolation preserved: the page still resolves via `resolveAdminTenant()` and binds only to the active client's `SetupDataLoadCenterModel`; no cross-client manifest rendering was introduced (asserted by the existing `manifestCoverage` guard test).

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, no env var, no feature flag. The change is live on `/admin/setup` for all tenants on deploy.

## Rollback Plan

`gh pr revert <pr>` (or `git revert <merge-commit>`) and redeploy. Single-component presentation change, no data or schema dependency — rollback is immediate and side-effect-free.

## Audit Evidence

- PR: (filled on open)
- Spec: `docs/build/PILOT_DATA_LOAD_STUDIO_DESIGN_SPEC_2026-06-01.md`
- Synthesis brief + clutter audit + judge verdict: `docs/build/ADMIN_SIMPLIFY_STUDIO_FIRST_BRIEF_2026-06-01.md`
- Test run: `admin/setup` suites 27/27 green.

## Known Gaps

- This ships the spec's **DL-1 (calm layout)** slice. The guided multi-panel load drawer (DL-2: consent → upload → scan → validate → approve → commit as a focused flow) and the durable ingestion schema (DL-3) remain separate slices; the primary "Start a governed load" CTA routes to the existing `/admin/context-layer/uploads` flow until DL-2 lands, so no control implies a fake action.
- The read-only `/admin` Home declutter (relocating trust strip / posture grid / audit ribbon) is tracked separately; this change is scoped to the Setup surface the founder flagged.
- The `docs/build/ADMIN_SIMPLIFY_STUDIO_FIRST_BRIEF_2026-06-01.md` brief assumed Setup still served the old HomeOverviewV2; main had already split the routes (PR #2777), so the executed scope correctly narrowed to the Studio component reskin.
