# 2026-08-03-source-workspace-live-binding — Source Workspace: real data binding

## Release ID

`2026-08-03-source-workspace-live-binding`

## Status

`candidate`

## Plain-English Summary

`/source/preview/workspace` (a Finder-style Source explorer + native analytical
canvas + contextual "Ask aVa" panel) previously rendered from a hand-authored
illustrative dataset. This change rebinds it to the governed Source data
plane for the signed-in tenant: real vendor and contract rows, real renewal
and leverage calculations (via existing, already-tested pure functions in
`src/lib/source/data-model/`), and real per-contract financial/operational/
document detail fetched on selection. Fabricated content with no governed
counterpart (a hand-picked vendor/contract heatmap, a per-contract "value
build-up," hand-written findings with invented rule-version citations,
"Continue in Superset" links) was removed rather than reproduced, per the
fixture audit at `docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md`.

## Layer Impact

Release lane: **client-data-lane** — client-scoped Source retrieval, gated
per-tenant through `requireTenancy()`; no schema, RLS, seed, or ingestion
changes.

- **Layer 3 (canonical model):** no change. This reads `source.contract_360`,
  `source.vendor_contract_portfolio`, `source.contract_application_scope`,
  `source.contract_initiative_dependency`, plus per-contract financial
  exposure / operational performance / doc extraction / Tower overlay rows.
  All reads go through the existing `src/lib/source/data-model/read-adapter.ts`
  and governed pure functions in `vendor-contract-portfolio.ts` /
  `sourcing-opportunities.ts` — no new business calculation was introduced,
  and no calculation already proven real was reimplemented.
- **Layer 4 (products):** Source gets one new bound page
  (`/source/preview/workspace`) and one new API route
  (`/api/source/workspace/contract/[contractId]`) for lazy per-contract
  detail. Existing `/source/vendor-portfolio` and
  `/source/sourcing-opportunities` pages are untouched.

## Client Applicability

- All clients: no — this route is reachable by any signed-in user with
  Source module access (same gate as the rest of `/source/*`), but only
  renders non-empty for tenants with populated `source.*` rows. Per the
  attached lab proof, that is currently `skyharbor_global`.
- Specific clients: SkyHarbor Air (lab), pending the same data load for any
  other tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. Gated the same way as every other `/source/*` route
  (`requireProductModule('source')` + `requireTenancy()`).

## Changes Included

- `src/app/(maestro)/source/preview/workspace/page.tsx` — real server
  component: resolves tenant via `requireTenancy()` +
  `getActiveClientRow()` (same canonical resolver as
  `/source/vendor-portfolio`), fetches the portfolio bundle.
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts` —
  new server-only adapter: one parallel fetch of the four portfolio-wide
  reads, re-exports the governed pure functions so the client can't drift
  into recomputing them.
- `src/app/(maestro)/source/preview/workspace/live/contractDetail.ts` —
  type alias for the per-contract detail response shape.
- `src/app/api/source/workspace/contract/[contractId]/route.ts` — new
  read-only API route, mirrors `/source/vendor-portfolio/[contractId]/page.tsx`'s
  existing fetch pattern, exposed as JSON for the workspace's client-side
  Explorer to call on selection.
- `viewModel.tsx`, `buildViewModel.ts`, every file under `lenses/` and
  `canvases/`, `WorkspaceClient.tsx`, `AvaPanel.tsx` — rewritten to consume
  real `SourceContract360Row` / `SourceVendorContractPortfolioRow` /
  `SourceContractApplicationScopeRow` / `SourceContractInitiativeDependencyRow`
  fields instead of the illustrative dataset. `data.ts` (the illustrative
  dataset) and `EventCanvas.tsx` (no real "sourcing event" data exists,
  illustrative or real) were deleted.
- `docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md` — new: the
  fixture-removal ledger (what was fabricated, what maps to a real column,
  what was removed outright) plus a post-binding accuracy check against the
  lab Cube proof (see Audit Evidence).

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .` — 0
  errors, run both on the working branch and in a clean worktree checked
  out from `origin/main` (confirms no dependency on unrelated in-flight
  branch changes).
- `npx eslint src/app/(maestro)/source/preview/workspace/ src/app/api/source/workspace/`
  — 0 errors, 0 warnings.
- Cross-referenced every number this binding produces against an
  independent lab verification (`source-sourcing-context-proof-20260803-final.zip`,
  SHA-256 `429bd4fda8c6b8c824ccf6e6cb1e25e767604b57a0fadf8c092c5ce0e99c96e6`):
  Cube semantic-model verifier `ok: true`, 119 contracts / 28 vendors /
  $1,480,500,000 annual value, `sourcing_contract_scope` 0 explicit / 3,373
  inferred (matches this binding's default confidence-tier behavior with no
  explicit reference set loaded), `sourcing_opportunities` real but 0 rows
  (matches the decision to compute opportunities client-side from
  `computeSourcingOpportunities` rather than read a table that has no data
  yet). Zero discrepancies found; one gap found and documented (see Known
  Gaps).
- **Not yet done:** a live signed-in browser proof of this page rendering
  against populated tenant data. Blocked twice in this working session —
  first because the lab Postgres sits on a private VNet unreachable from
  the dev sandbox (confirmed via a direct connection attempt), then because
  the sandbox's browser pane got stuck redirecting every route to Clerk
  sign-in (an environment/session artifact, not a code issue). This record
  is a `candidate`, not `released`, until that proof exists.

## Rollout Plan

No runtime rollout from this record alone. Merging to `main` makes the code
available to the next `aca-main-deploy` run; whether/when to deploy is a
separate decision. No migration, no feature flag, no env var change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (not
  triggered by this PR).
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable — no deploy performed as part of
  this record.
- ACA runtime invariant: not applicable until a deploy is run.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes, before this record can move to
  `released`** — see Known Gaps.

## Rollback Plan

Revert the merge commit. The page is additive (`/source/preview/workspace`
is a new route; no existing route, schema, or shared component was
modified), so rollback carries no migration or data risk. If deployed and a
rollback is needed before a revert lands, the prior ACA revision's image
predates this route entirely.

## Audit Evidence

- Fixture-removal ledger and post-binding accuracy check:
  `docs/architecture/SOURCE_WORKSPACE_FIXTURE_AUDIT.md`.
- Lab Cube proof (external file, not committed — contains only synthetic
  SkyHarbor data and Azure job logs): `source-sourcing-context-proof-20260803-final.zip`,
  SHA-256 `429bd4fda8c6b8c824ccf6e6cb1e25e767604b57a0fadf8c092c5ce0e99c96e6`.
  Referenced final-merged PR in that lane: abarva-platform/abarva#5911.
- `tsc`/`eslint` output referenced under QA / Validation (not attached as
  files; rerunnable from the commands given).

## Known Gaps

- No live signed-in browser proof yet (see QA / Validation and Rollout Plan).
- `consumption.sourcing_contract_v1` (the Cube-backing view proven live in
  the referenced lab run) exposes `notice_90_day_count` and
  `average_confidence` / `average_relationship_confidence` measures this
  binding does not yet surface. This binding only has the verifier's
  aggregate output for those views, not their full row-level schema, so it
  intentionally does not read `consumption.*` directly yet — doing so
  without a verified schema would risk guessing column names. Follow-up:
  export `consumption.sourcing_*` schemas the same way `source.*` was (see
  `src/lib/source/data-model/types.ts` header) and add read-adapter
  functions once available.
- No standalone Cube API server or Superset connection exists yet (per the
  lab proof's own caveat), so this binding reads Postgres directly rather
  than through a Cube query layer — consistent with the rest of
  `src/lib/source/data-model/`, not a shortcut specific to this change.
- QlikView-style global associative selection (a click anywhere greying out
  non-matching values across every lens, not just within the Explore lens)
  was requested and explicitly deferred to a follow-up pass.
