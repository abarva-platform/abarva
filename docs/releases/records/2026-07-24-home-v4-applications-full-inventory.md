# 2026-07-24-home-v4-applications-full-inventory — Real application grid (preview route) + live nav dedup

## Release ID

`2026-07-24-home-v4-applications-full-inventory`

## Status

`released` — live-verified 2026-07-24 (see QA below). One follow-up issue found during
verification, tracked separately: the apps dimension's Claude-authored narrative predates this
data and now contradicts it (see Known Gaps).

## Plain-English Summary

Follow-up to the same-day Home Knowledge V4 preview work, revised twice in-session as better
sources were found — this record describes the final state, not the intermediate ones (see
Audit Evidence for the full trail).

A deterministic "Context Intelligence Yield Audit" first found that skyharbor-air has a rich
412-application inventory (`datasets/skyharbor-air-supporting-evidence/`) the Home Knowledge
pipeline never used. A first version of this release shipped that inventory as a grid with
owner/sponsor shown as "Not captured" for all rows, based on an audit that had only checked the
`datasets/` tree.

**That was superseded before merge.** A second source, `tower-standardized-v1/` — a governed,
per-tenant reconciled package with its own reconciliation report and documentation, covering all
5 canonical tenants — has real per-application data including named business owners for **4 of 5
tenants directly on the source record** (`F05_applications-systems.csv`: "COO", "Head of Consumer
Banking", "CFO", "Chief Medical Officer", etc.) and a governed derived-ownership join for the
5th (skyharbor-air, via `F19_team-application-ownership.csv`, confidence-scored 0.50–0.78,
verified 900/900 `application_id` match against F05 for that tenant). This is now the primary
reconciliation source for this release, replacing the `datasets/`-only version.

The grid is deterministic source data rendered directly — never passed through Claude, never
truncated. Reconciled across **all 5 tenants** in one pass:

| Tenant | Applications | With a named owner | Owner source |
|---|---:|---:|---|
| skyharbor-air | 900 | 682 (76%) | Derived join (F19), confidence-scored, caveat shown on hover |
| first-capital | 260 | 260 (100%) | Direct capture (F05) |
| meridian-health | 150 | 150 (100%) | Direct capture (F05) |
| apex-retail | 170 | 170 (100%) | Direct capture (F05) — **reconciled but not injected**, no V4 fixture exists for this tenant yet (no canary has been run) |
| lakeshore-holdings | 130 | 130 (100%) | Direct capture (F05) — same as apex-retail |

Rows still without an owner (skyharbor-air only, 218 of 900) show "Not captured" — genuinely
absent from both F05 and F19 for those specific rows, not fabricated.

**Second change in this release, higher blast radius**: the live production `/home` page
(`HomeEnterpriseBriefApp.tsx`, `NAV_GROUPS`) previously listed ~45 labeled sidebar items across 8
groups, but only 14 distinct `ViewKey` views actually exist to render — most labels were aliases
sharing a `key` with several other items (e.g. 4 different labels all rendering the `priorities`
view), so navigating them silently showed duplicate content under different names. This was found
and diagnosed earlier in the session, then confirmed as the root of a direct user complaint ("I
can see the same tabs, same content") on the live FS Demo tenant. This release deduplicates
`NAV_GROUPS` to exactly one item per real view, keeping all 8 existing group headers, using the
clearest accurate label per view (e.g. relabeling the `priorities` view — which actually renders
`dimKey: "ai"` content — as "AI & Automation Use Cases" instead of the generic "Strategic
Priorities" it was inconsistently called in different places).

This is **live for every real tenant** on `/home`, not the admin-gated preview route — the higher
blast-radius half of this release.

## Layer Impact

- `internal-admin`: the Applications grid is on the same review route as the earlier V4 preview
  work (`/home/v4-preview`, platform-admin gated per PR #5549) — no change to who can reach it.
- `global-control-lane`: the `NAV_GROUPS` dedup changes the live `/home` sidebar for every tenant.
  No content is removed that wasn't already a duplicate of a kept item — every one of the 14 real
  views remains reachable, just once instead of up to 7 times under different labels.

## Client Applicability

- Applications grid: internal only, no client-facing change, same platform-admin-only access as
  the existing preview route.
- Nav dedup: **all clients** — every tenant's live `/home` sidebar changes from ~45 items to 14.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/homeV4Visual.ts`: adds `HomeV4ApplicationFullRow` type (with
  `owner_confidence`/`owner_caveat` for derived-ownership rows) and an optional `full_rows` field
  on `HomeV4DataTab` — a passthrough field distinct from the existing Claude-authored `rows` sample.
- `src/components/home/v4/HomeV4ApplicationsGrid.tsx` (new): filterable/sortable grid component;
  shows a confidence percentage and hover caveat on derived-ownership rows, distinct styling for
  genuinely uncaptured rows.
- `src/components/home/v4/HomeV4ExplorerShell.tsx`: renders the grid under a dimension's primary
  visual when `data_tab.full_rows` is present.
- `scripts/knowledge/reconcile-tenant-applications.mjs` (new): reconciles all 5 tenants'
  `tower-standardized-v1/*/family-2-technology-estate/F05_applications-systems.csv` (+
  `F19_team-application-ownership.csv` for skyharbor-air, whose F05 predates the owner column the
  other 4 tenants have) into `HomeV4ApplicationFullRow[]`, and injects into any existing V4
  fixture for that tenant. Writes a summary to
  `docs/audits/artifacts/tenant-application-reconciliation-2026-07-24.json`. Supersedes and
  deletes `reconcile-skyharbor-applications.mjs` (the `datasets/`-only, skyharbor-air-only, no-owner
  first version of this work).
- `src/app/(maestro)/home/v4-preview/_fixtures/{skyharbor-air,first-capital,meridian-health}.json`:
  regenerated by the script above — each `dimensions[apps].data_tab.full_rows` now has real,
  tenant-specific application + ownership data.
- `docs/audits/HOME-KNOWLEDGE-CONTEXT-INTELLIGENCE-YIELD-AUDIT-2026-07-24.md` (new): the audit that
  motivated the grid.
- `src/components/home/HomeEnterpriseBriefApp.tsx`: `NAV_GROUPS` deduplicated from ~45 items to 14,
  one per real `ViewKey`. No other change to this file — component logic, `VIEW_META`,
  `SECTION_TABS`, and all rendering are untouched.

## QA / Validation

- `pass` — `npx eslint` on all new/changed files, exit 0.
- `pass` — full `npm run build` (production Turbopack build, not just `tsc`).
- `pass` — live signed-in browser verification on the deployed environment (screenshot) prior to
  this specific change, confirming the earlier V4 preview defects stay fixed (5-item real Change &
  Transformation nav, a scatter_2x2 visual actually rendering as a scatter).
- `pass` — live signed-in browser verification of this release's specific changes, post-deploy,
  platform-admin session: (a) `/home/v4-preview?tenant=skyharbor-air` → Enterprise Context →
  Applications & Systems shows "900 of 900 applications" and the gap-note text "682 of 900
  applications have a named owner on file (derived from a team/domain match, not directly
  captured — see the caveat on hover). The remaining 218 show 'Not captured' rather than a
  guess." — matches the reconciliation script's own output exactly; (b) `/home` for
  meridian-health shows exactly 14 sidebar items across all 8 groups (1+2+2+2+4+1+1+1), matching
  the deduplicated `NAV_GROUPS` structure.
- **New finding during this verification**: the apps dimension's `gaps_tab` still states
  "Ownership of the data behind a legality-bound recovery decision is unassigned," and
  `relationship_tab` still shows an explicit "Owners" node labeled "Data steward to confirm"
  (`missing_evidence`) — directly under the grid that now shows 682 of 900 applications with a
  real owner. The narrative was generated before `tower-standardized-v1` was found and has no
  awareness of this data. Not fixed in this release — see Known Gaps.

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys automatically. After
deploy: confirm the ACA runtime invariant, then re-verify both changes live per the QA section
above.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge — no ad-hoc `az`
  commands used.
- Shared runtime mutators: none — no database writes, no schema, no migration. The fixture is
  static JSON bundled at build time, same as the rest of `/home/v4-preview`.
- Live signed-in proof required: yes — grid per the route's original release record; nav dedup
  because it changes a live, all-tenant page (screenshot proof of the deduplicated menu required
  for at least one real tenant before this record moves past `candidate`).

## Rollback Plan

Revert the PR. The preview route reverts to showing only the 6 Claude-generated summary buckets
for the apps dimension (no data was written anywhere, pure code revert). The live `/home` sidebar
reverts to the prior ~45-item menu — functionally a regression back to the duplicate-content
navigation bug, but not a new risk, since that was the pre-existing behavior.

## Audit Evidence

- `docs/audits/HOME-KNOWLEDGE-CONTEXT-INTELLIGENCE-YIELD-AUDIT-2026-07-24.md`
- Live browser screenshots this session confirming the pre-existing V4 preview fixes remain
  correct on the deployed environment.
- Live browser screenshots this session of the live FS Demo tenant `/home` page showing the
  pre-fix duplicate-nav / mislabeled-chart-type behavior directly (the evidence that motivated the
  nav dedup).

## Known Gaps

- **P1, found live during verification, not yet fixed**: the apps dimension's Claude-authored
  narrative directly contradicts the new grid — `gaps_tab.decision_gaps` states ownership is
  "unassigned" and `relationship_tab` shows an "Owners" node as `missing_evidence`, while the grid
  immediately below shows 682 of 900 applications with a real owner. The narrative was generated
  before this data was found; fixing it correctly requires a paid Claude regeneration run, which
  needs explicit authorization (same standing rule as every other paid-generation step this
  session) — not done here. A cheap same-day mitigation (a visible callout noting the narrative
  predates this data) was proposed but not yet approved or built as of this record.

- **apex-retail and lakeshore-holdings have real, reconciled application+ownership data
  (170 and 130 rows respectively, both 100% owned) that is not visible anywhere**, because no V4
  candidate has ever been generated for those 2 tenants this session — there is no fixture to
  inject the reconciled data into. This is a real, named gap, not a "some tenants unaudited"
  hedge: the data exists and is ready; what's missing is a V4 canary run for those 2 tenants
  (a paid generation job) or a lighter-weight wrapper that shows deterministic data without
  requiring Claude narrative first. Neither is done in this release.
- skyharbor-air: 218 of 900 applications (24%) still show "Not captured" for owner — genuinely
  absent from both F05 and F19 for those specific rows, not a processing gap.
- Sponsor and application-type remain unpopulated for all 5 tenants — no source file found for
  either field in `tower-standardized-v1` or `datasets/` during this reconciliation.
- This reconciliation-and-grid pattern has been applied to Applications only, across all 5
  tenants' available source data — not yet extended to other dimensions (Vendors, Programs,
  Budget, etc.) that the same audit found real `tower-standardized-v1` sources for.
- The nav dedup keeps the same 8 group headers and reduces to 14 items matching what's currently
  implemented — it does not yet add new views for dimensions found real via `tower-standardized-v1`
  (e.g. a consolidated Organization/Leadership view, a standalone Metrics view) or reorganize
  toward the "executive chapters vs. explorer dimensions vs. deterministic data registries"
  structure discussed this session. That is a larger, separate follow-on, not done here.
- Two items whose prior duplicate labels are now gone entirely (not just deduplicated) because
  their underlying `key` is used by a differently-labeled kept item: "Value Baselines" (`risks`,
  now only reachable as "Risks & Controls") and "Architecture Dependencies"/"Transformation
  Dependencies" (`map`, now only reachable as "Relationship Map"). No content is lost — these
  rendered identical content to the kept item — but the specific label wording is gone.
