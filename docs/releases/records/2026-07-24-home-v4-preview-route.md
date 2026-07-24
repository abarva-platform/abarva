# 2026-07-24-home-v4-preview-route — Home Knowledge V4 candidate review page

## Release ID

`2026-07-24-home-v4-preview-route`

## Status

`candidate`

## Plain-English Summary

Adds `/home/v4-preview`, an internal review page that renders the Home Knowledge V4 candidate
contract — the schema hardened, offline-replayed, and canary-verified against three live tenants
earlier this session (skyharbor-air full 38-dimension run in progress at merge time;
first-capital and meridian-health on the 3-dimension `apps,risks,rel` canary shape).

### What this is not

It is not a data-loading change. It writes nothing to any database. The three tenant fixtures
under `_fixtures/` are the literal proof-bundle JSON pulled from real ACA canary executions this
session, bundled as static build-time JSON. The standing decision that no V4-generated content
gets loaded into Postgres until human review passes is unaffected — this route makes the
rendering path visible for review; it does not load anything anywhere.

### Why it's reachable in production

The route originally 404'd outside development (`if (NODE_ENV === "production") notFound()`).
That gate is removed in this PR **by explicit instruction** — Anand asked to deploy it to prod
directly, after the tradeoff was laid out plainly (see chat: local rendering was blocked by the
private-VNet Postgres being unreachable from a laptop — a pre-existing, documented limitation
unrelated to this code — so the only way to actually see this rendered is a reachable
environment; standing up a dedicated preview Container App is a bigger infra step, and the
simpler, explicitly-authorized path was to make the route reachable behind normal auth on the
existing lab/production runtime).

The page stays labeled "Dev-only preview — not production data" in its own UI regardless of
where it's deployed, so it is reachable but never silently presented as approved content.

### Content

- Typed visual renderer (`HomeV4VisualRenderer.tsx`) covering all 12 schema visual types
  (`horizontal_bar`, `stacked_bar`, `waterfall`, `line_trend`, `area_trend`, `radar`, `treemap`,
  `scatter_2x2`, `heatmap`, `evidence_timeline`, `executive_scorecard`, `relationship_graph`) via
  Recharts, sharing the `COLORS` palette from the live `HomeEnterpriseBriefApp.tsx` (exported for
  this purpose — the one line changed in that file).
- Finder-style collapsible explorer sidebar (`HomeV4Explorer.tsx`) — disclosure-triangle groups,
  not a flat list — matching the pattern in the "Home Enterprise Brief" Claude Design mockup
  reviewed earlier this session.
- Five real Change & Transformation pages (`HomeV4ChangeTransformationPages.tsx`): Industry
  Movements, New Ways of Operating, Enterprise Change Theses, Candidate Use Cases (sequencing
  folded in), Transformation Dependencies — collapsed down from 8 misleading sidebar labels in
  the live page, 4 of which were found to route to the identical underlying view.
- Per-dimension pages under "Enterprise Context" reusing the typed visual renderer directly
  against real generated content (verified field-by-field against actual canary JSON, not
  assumed shapes).

## Layer Impact

- `global-control-lane`: new route + components, one exported constant in an existing live
  component (`COLORS`, visibility change only — no behavior change to `HomeEnterpriseBriefApp`).
- `internal-admin`: this is internal review tooling, not a customer-facing feature.

## Client Applicability

- All clients technically reachable at this route once deployed, but content shown is
  synthetic/candidate data for three demo tenants (skyharbor-air, first-capital,
  meridian-health) only — not per-viewer client data, not live for any real client.
- Feature flag: none. Reachability is by URL + existing Clerk/maestro auth only, not surfaced in
  any navigation menu.

## Changes Included

- `src/app/(maestro)/home/v4-preview/page.tsx` (new) — the review page; production gate removed
  per explicit instruction.
- `src/app/(maestro)/home/v4-preview/_fixtures/*.json` (new, ~956KB total) — real proof-bundle
  JSON from this session's canary executions, not synthetic-for-this-PR data.
- `src/components/home/v4/homeV4Visual.ts` (new) — types mirroring the server-side V4 schema
  (`scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`), kept in sync by hand.
- `src/components/home/v4/HomeV4VisualRenderer.tsx` (new) — typed visual dispatcher.
- `src/components/home/v4/HomeV4Explorer.tsx` (new) — Finder-style sidebar.
- `src/components/home/v4/HomeV4ExplorerShell.tsx` (new) — client-side selection state + main
  pane wiring.
- `src/components/home/v4/HomeV4ChangeTransformationPages.tsx` (new) — the five real pages.
- `src/components/home/HomeEnterpriseBriefApp.tsx`: `const COLORS` → `export const COLORS`. No
  other change to this file.

## QA / Validation

- `pass` — `node --check` N/A (TSX); `npx eslint` on all new/changed files, exit 0.
- `pass` — Full-repo `tsc --noEmit`, zero errors.
- `pass` — Every visual field mapping checked directly against real generated JSON from this
  session's canary executions (quoted verbatim in chat), not assumed from the schema alone.
- **`blocked` — no local browser screenshot.** The private-VNet Postgres is unreachable from a
  laptop (documented prior-session limitation), which blocks Clerk role/tenant resolution for
  *every* protected route locally, confirmed by observing the pre-existing `/home` route also
  fail to render locally under the same session. This is unrelated to the code in this PR.
  **Live signed-in browser verification against the deployed environment is required after
  merge, before this record can move past `candidate`.**

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys automatically.
After deploy: confirm the ACA runtime invariant (template image = 100%-traffic revision image =
approved digest), then sign in with a real account and screenshot `/home/v4-preview` on the live
environment to close the QA gap above.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge — the only deploy
  action taken; no ad-hoc `az` commands used to push this branch anywhere.
- Shared runtime mutators: none — no database writes, no schema, no migration.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes** — this PR explicitly makes a new route reachable in
  production; the standard live-proof requirement applies and is called out above as not yet
  satisfied.

## Rollback Plan

Revert the PR. The route disappears entirely (no data was ever written anywhere), and
`HomeEnterpriseBriefApp.tsx`'s `COLORS` visibility reverts with it — no functional change to the
live Enterprise Brief page either way.

## Audit Evidence

- Chat record of the explicit instruction to remove the production gate, including the
  auto-mode classifier's block on the first attempt and the direct re-confirmation before the
  edit was retried.
- Real field-by-field verification against canary JSON, documented in chat with quoted excerpts.

## Known Gaps

- **Live browser proof is the open item** — must be captured post-deploy before this record can
  be marked proven.
- Menu-vs-content mismatch fix (5 Change & Transformation items instead of 8) is applied only in
  this new preview route, not in the live `HomeEnterpriseBriefApp.tsx` navigation — that fix is
  still pending a decision on timing (fold into this migration vs. fix independently now).
- Only three of five real tenants have any V4 content generated at all; apex-retail and
  lakeshore-holdings have none. Full-catalog generation has only been run for skyharbor-air so
  far (in progress at merge time).
- `@dagrejs/dagre` and `@xyflow/react`, imported by the unrelated existing file
  `HomeKnowledgeDesignContractSurface.tsx`, are not declared in `package.json` at all — a
  pre-existing bug that breaks that file's build in any fresh checkout. Not fixed here (out of
  scope, different component); flagged for separate follow-up.
