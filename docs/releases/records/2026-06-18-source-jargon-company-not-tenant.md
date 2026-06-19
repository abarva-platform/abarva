# 2026-06-18-source-jargon-company-not-tenant — Client-clean labels: "Company" not "Tenant"

## Release ID

`2026-06-18-source-jargon-company-not-tenant`

## Status

`candidate`

## Plain-English Summary

Enterprise executives read "Tenant" as infrastructure jargon — it signals
"software vendor internals," not "your company." This swaps the seven
user-facing places that showed "Tenant" to "Company": the Source event table
column header, the portfolio filter group, the Moves case-switcher accessibility
label, the downloaded XLSX cover sheet, the CXO narrative report cover, a
deliverable evidence label, and the Apex case-study intro. No logic changes and
no internal identifiers were touched.

## Layer Impact

- `global-control-lane`: shared UI copy + shared export toolkit
  (`exports-shared/xlsx-base.ts`). String-only; no behavior change. Internal
  identifiers (`tenant_key`, the `tenantName` data field, the `tenant_substrate`
  evidence id) are deliberately unchanged.

## Client Applicability

- All clients: yes — these labels render for every tenant's Source/Moves UI and
  generated artifacts.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- Branch `fix/source-jargon-company-not-tenant`. Seven one-line label swaps:
  - `components/source/SourcingEventTable.tsx` — "Event / Tenant" → "Event / Company"
  - `components/source/portfolio/PortfolioFilterSidebar.tsx` — filter label
  - `components/moves/living/LivingMoveView.tsx` — `aria-label` "Tenant case"
  - `lib/exports-shared/xlsx-base.ts` — XLSX cover row label
  - `lib/source/exports/cxo-report/source-cxo-narrative-report.ts` — cover metric label
  - `lib/source/exports/artifact-standards.ts` — evidence label (id unchanged)
  - `components/source/learn/case-study/apex/ApexRetailCaseStudyIntro.tsx` — intro line

## QA / Validation

- `eslint` on all 7 files → **PASS** (exit 0; one pre-existing unrelated warning).
- Grep for old strings in tests → **PASS** (no test asserts them; the
  `board-grade-tenant-label` tests cover a separate deliberate placeholder — see
  Known Gaps).
- Typecheck — **runs in CI** (not run locally for this copy-only change).

## Rollout Plan

Merge to main on green PR check → ACA image build/deploy. No migration, no flag.

## Rollback Plan

Revert the commit. Pure copy change; nothing persistent to unwind.

## Audit Evidence

- PR: (filled on open) `fix/source-jargon-company-not-tenant`
- Local proof: eslint exit 0; grep confirms no test depends on the old strings

## Known Gaps

The board-grade deliverable generator has a deliberate "honest `Tenant`
placeholder" (used only when no company key/name is threaded), with its own
behavior contract in `board-grade-tenant-label.test.ts`. Whether that fallback
should read "Company" is a separate, test-bearing decision and is intentionally
out of scope here. Broader non-user-facing "Tenant" usage (identifiers, types,
comments) is correct and left as-is.
