# 2026-07-24-home-v4-applications-full-inventory — Real application grid (preview route) + live nav dedup

## Release ID

`2026-07-24-home-v4-applications-full-inventory`

## Status

`candidate`

## Plain-English Summary

Follow-up to the same-day Home Knowledge V4 preview work. A deterministic "Context Intelligence
Yield Audit" this session (`docs/audits/HOME-KNOWLEDGE-CONTEXT-INTELLIGENCE-YIELD-AUDIT-2026-07-24.md`)
found that skyharbor-air has a genuinely rich 412-application inventory (real hosting, vendor, run
cost, modernization data) that the Home Knowledge pipeline never used — the review page's apps
dimension only ever showed 6 Claude-generated summary buckets, no per-application detail. This
release adds the real 412-row inventory as a filterable/sortable data grid on the `/home/v4-preview`
review route's Applications & Systems dimension page, alongside (not replacing) the existing
Claude-authored narrative interpretation.

The grid is deterministic source data rendered directly — never passed through Claude, never
truncated. Named owner/sponsor/application-type fields are absent from the specific 412-row source
this grid uses; the grid shows "Not captured" for those columns rather than a blank cell or a
fabricated value, so the gap stays visible.

**Correction (found later the same session, before this record shipped)**: the original audit's
claim that owner/sponsor is "confirmed absent from every tenant's source data" was an overclaim —
it was based on the `datasets/` tree only. A separate, richer source
(`tower-standardized-v1/skyharbor-air/family-8-semantic-enrichment/F19_team-application-ownership.csv`,
900 rows, real `business_owner_role`/`owning_team_id`/`executive_owner_role` fields) exists and was
not audited. It uses a non-overlapping application identity space from this grid's 412 rows —
verified zero name overlap — so it cannot be joined onto this grid as-is, and its own values carry
explicit confidence scores (0.50–0.78) and caveats rather than being ground truth. "Not captured"
in this grid is accurate for *this grid's specific rows*; it is not a claim that no ownership data
exists anywhere for this tenant.

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

- `src/components/home/v4/homeV4Visual.ts`: adds `HomeV4ApplicationFullRow` type and an optional
  `full_rows` field on `HomeV4DataTab` — a passthrough field distinct from the existing
  Claude-authored `rows` sample.
- `src/components/home/v4/HomeV4ApplicationsGrid.tsx` (new): filterable/sortable grid component.
- `src/components/home/v4/HomeV4ExplorerShell.tsx`: renders the grid under a dimension's primary
  visual when `data_tab.full_rows` is present.
- `scripts/knowledge/reconcile-skyharbor-applications.mjs` (new): one-off reshaping script, reads
  the real 412-row source CSV and writes `full_rows` into the skyharbor-air fixture. Not a merge
  with the tenant's other (sparser) application file — confirmed during implementation that the
  two files' overlapping `APP-NNNN` IDs identify different, unrelated synthetic applications (e.g.
  `APP-0001` is "Reservations Core PSS-01" in one file, "Revenue Accounting Core 1" in the other) —
  a row-level merge would have fabricated correspondence between unrelated rows, so this uses the
  richer file alone.
- `src/app/(maestro)/home/v4-preview/_fixtures/skyharbor-air.json`: regenerated by the script
  above — `dimensions[apps].data_tab.full_rows` now has 412 real rows.
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
- `pending` — live re-verification of both changes in this release specifically has not yet been
  captured; do before marking `released`: (a) the Applications grid rendering 412 rows with
  working filters on `/home/v4-preview?tenant=skyharbor-air`, (b) the live `/home` sidebar showing
  14 deduplicated items across the same 8 groups, for at least one real tenant.

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

- Owner/sponsor/application-type columns will read "Not captured" for all 412 rows on day one —
  genuine for this specific grid's source rows; see the correction above re: `tower-standardized-v1`
  for the fuller picture across sources.
- This same reconciliation-and-grid pattern has not yet been applied to any other tenant or
  dimension — skyharbor-air's apps dimension only, per the audit's proven scope.
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
