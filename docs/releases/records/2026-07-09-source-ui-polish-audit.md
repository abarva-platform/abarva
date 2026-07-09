# 2026-07-09-source-ui-polish-audit — Source UI/UX polish audit and fixes

## Release ID

`2026-07-09-source-ui-polish-audit`

## Status

`candidate`

## Plain-English Summary

A live crawl of every reachable Source page (Decision Queue, Portfolio, Approvals,
Setup, Capabilities, Patterns, New-event intake, the event canvas, File Cabinet,
Value Proof, printable Report, and the shared "item not found" error page) found
11 concrete, verifiable defects — some cosmetic, one a genuine layout bug that
silently blanks a page. This change fixes all 11 within the existing locked
design system; it does not restyle anything or introduce new visual language.

The most significant fix: `src/app/(maestro)/not-found.tsx` (the shared
"this item isn't available" page shown across Home/Intelligence/Moves/Source/
Tower whenever a record is inaccessible or missing) rendered with **zero
visible content in the main content pane** — confirmed via computed-style
inspection that the pane's the intended "404 / Can't open this / back to
home" content existed in the DOM but collapsed to 0×0 because it was laid
out in a `flexDirection: column` container while assuming a row layout.
Anyone who hit an inaccessible link anywhere in the product saw a mostly
blank white screen instead of a real error message.

The second most significant fix: new Source events could get a garbled
display name (e.g. "Acme In: EHR application management... Sourcing
Event") because the auto-generated-title sanitizer stripped "in scope:"/
"out of scope:" but not the bare "In:"/"Out:" prefixes that the scope-
boundary field's own placeholder text explicitly models as the expected
format — so any user who followed the field's own suggested convention
got a garbled title that then propagated to the portfolio list, page
breadcrumbs, the printable report, and the Value Proof page.

The rest are consistency fixes: 6 different eyebrow/breadcrumb conventions
were in use across otherwise-sibling pages (now standardized to
"Source · [Section]"); the Approvals page and a Source event's Value Proof
page were still on the superseded v2 design system (Georgia serif, raw hex
colors, and in the Value Proof page's case a literal `#F8F7F4` cream
background, explicitly superseded by the locked white-background v3 spec);
native `<select>` dropdowns rendered with the unstyled OS chevron next to
custom-styled buttons; a shared status-chip style rendered at 7.5px, below
the design system's own documented 10–11px minimum; and the File Cabinet
table showed two different date formats for artifacts generated in the
same batch (root cause: the underlying `generatedAt` value is written in
two different string formats by different code paths — fixed at the
display layer by always parsing through `Date` before formatting).

## Layer Impact

- `global-control-lane`: every fix is shared UI/copy/layout code that
  renders identically for every tenant — none of it is tenant-specific or
  feature-flagged.

## Client Applicability

- All clients: yes. Nothing here is gated by tenant, plan, or feature flag.
- Internal only: no.

## Changes Included

- `src/app/(maestro)/not-found.tsx` — wrap `AgentColumn` + WorkPane in an
  explicit `flexDirection: row` container so the WorkPane is no longer
  collapsed to zero size; de-duplicate the "Item unavailable" copy that
  was repeated verbatim across the aVa badge and the WorkPane heading.
- `src/components/source/SourceOriginatePage.tsx` — `sanitizeEventNameClause`
  now strips bare `In:`/`Out:` prefixes, not just `in scope:`/`out of
  scope:`; `STATUS_CHIP` font-size 7.5px → 10px, `SECTION_LABEL` 8.5px →
  10.5px (both below the design system's documented 10–11px eyebrow
  minimum).
- `src/components/source/SourceDecisionQueueView.tsx` — added
  `SOURCE_QUEUE_SELECT_STYLE` (appearance:none + inlined SVG chevron) so
  the Filter/Sort dropdowns match the custom-styled buttons beside them.
- `src/app/(maestro)/source/setup/page.tsx`,
  `src/app/(maestro)/source/capabilities/page.tsx`,
  `src/app/(maestro)/source/patterns/page.tsx` — eyebrow text standardized
  to "Source · Setup" / "Source · Capabilities" / "Source · Patterns"
  (Capabilities' `AppShell` `context` prop already said "Source ·
  Capabilities" — the visible in-page eyebrow had just never been updated
  to match).
- `src/app/(maestro)/source/approvals/page.tsx` — migrated off raw hex
  colors and `Georgia, serif` to `SHELL` design tokens; added the missing
  "Source · Approvals" eyebrow; changed the outer container from a
  centered `maxWidth: 880, margin: 0 auto` layout (inconsistent with
  sibling pages) to full-width with an inner max-width for readability,
  matching Portfolio/Decisions/Setup/Capabilities.
- `src/components/source/FileCabinetPanel.tsx` — added the missing
  "Source · File Cabinet" eyebrow; `Georgia, serif` → `SHELL.SERIF`;
  new `formatFileCabinetDate()` helper parses `generatedAt` through `Date`
  before formatting so the table shows one consistent date format
  regardless of which write path produced the underlying value; softened
  "durably stored in Azure Blob" to "securely stored" (no infra-vendor
  name in customer-facing copy).
- `src/app/(maestro)/source/events/[eventId]/value/page.tsx` — hardcoded
  `#F8F7F4` page background → `#FFFFFF` (v3 spec is white-only; this page
  predated the 2026-05-07 v2→v3 migration).
- `src/app/(maestro)/source/events/[eventId]/report/page.tsx` —
  `generateMetadata` now uses the event's human-readable code for the
  browser tab title instead of the raw UUID.
- `src/__tests__/integration/source/source-originate-page.test.ts` — new
  regression test for the bare `In:`/`Out:` prefix bug (the existing
  suite only covered the two-word `in scope:` variant).

## QA / Validation

Status: **pass**.

- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc -p . --noEmit`: clean,
  0 errors. (The default heap OOM'd mid-run on this machine; re-ran with a
  larger heap and confirmed a genuine clean pass, not an orphaned/empty
  false-positive — the OOM crash produced a full V8 stack trace, so the
  zero-output clean run is a real completion, not a truncated one.)
- `npx jest src/__tests__/integration/source/source-originate-page.test.ts`:
  25/25 passing (24 pre-existing + 1 new regression test for the `In:`/
  `Out:` prefix bug).
- Live-verified pre-fix on the deployed app (not a mock): the `not-found.tsx`
  zero-size WorkPane bug was reproduced twice (once via a real
  cross-tenant-inaccessible event, once via a synthetic nonexistent event
  ID) and root-caused via `getBoundingClientRect()` on the live DOM before
  the fix was written.
- Live-verified pre-fix: created a real Source event end-to-end through
  `/source/new` on the live app, reproducing the garbled-title bug exactly
  ("Healthcare Demo In: EHR application management and integration engine
  support Sourcing Event") and the 7.5px illegible status-chip text before
  fixing either.
- No dedicated test files exist for `FileCabinetPanel.tsx`, the Approvals/
  Setup/Capabilities/Patterns/Value/Report pages, or `not-found.tsx` — none
  added here; each fix is a scoped, low-risk text/style/layout change to
  existing, already-rendering markup, verified via tsc + the targeted test
  suite above plus live pre/post inspection.

## Rollout Plan

Merge via squash to `main`. Deploy through the repo-owned
`aca-main-deploy.yml` workflow to `ca-abarva-web-lab-eastus`, per
[docs/runbooks/azure-container-apps-deploy.md](/Users/anand/Projects/nexus-port-main/docs/runbooks/azure-container-apps-deploy.md).
No migration required — every change is UI/copy code, no schema or data
changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the standard deploy workflow.
- Approved image digest: whatever digest the main-deploy workflow builds
  and pins for this merge; verified post-deploy per the runtime invariant
  below.
- ACA runtime invariant: verify the Container App template image and the
  100%-traffic revision image match the digest built for this PR's merge
  commit before calling this `released`.
- Worker image invariant: n/a — no worker jobs affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — re-run the `/source/new` intake
  flow and the inaccessible-event `not-found` page post-deploy and confirm
  both render correctly (clean event title, legible status chips, visible
  404 content).

## Rollback Plan

Revert this commit. Every change is a self-contained text/style/layout
edit to existing markup with no data or schema dependency — reverting is
safe and returns each page to its prior (flawed but functioning, except
for the `not-found.tsx` blank-pane bug) state.

## Audit Evidence

- PR URL: to be filled in once opened.
- CI run: to be filled in once the PR's checks complete.
- Pre-merge tsc + jest results: see QA/Validation above.
- Pre-fix live reproduction: `not-found.tsx` zero-size WorkPane (DOM
  inspection via `getBoundingClientRect()` returning `{}` for the "404"
  and "Back to home" elements), garbled event title
  ("Healthcare Demo In: EHR application management..."), and the 7.5px
  status-chip text — all captured live on `app.abarva.ai` before the
  corresponding fix was written.
- Post-deploy live proof: to be captured (re-run the same reproduction
  steps and confirm each is now fixed) before this record moves to
  `released`.

## Known Gaps

- Two structurally different canvas UI systems render for the same core
  Source workflow depending on the `source_analytics` feature flag
  (`SourceAnalyticsCanvas` vs. the legacy `UniversalCanvasShell`) — this is
  a much larger, flag-consolidation decision, not a polish fix, and is
  explicitly out of scope here.
- The Value Proof page (`.../[eventId]/value/page.tsx`) and the Report
  page render with no top navigation at all — neither is wrapped in
  `AppShell`. The cream-background violation on the Value page is fixed
  here; the missing navigation chrome on both pages is a larger structural
  change (wrapping a page in `AppShell` requires understanding its context
  providers and is riskier to do blind) and is flagged, not fixed, in this
  slice.
- The `generatedAt` field itself is still written in two different string
  formats by different code paths (`Date.toString()` vs.
  `Date.toISOString()`). This change fixes the display-layer symptom in
  `FileCabinetPanel.tsx`; the underlying write-path inconsistency is not
  hunted down and normalized here.
- 30 of 33 canonical Source deliverable codes still have no generation
  template (pre-existing, tracked separately — unrelated to this audit).
