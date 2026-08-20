# 2026-08-19-home-preview-production-render — production-faithful React preview of the 8-chapter Home experience

## Release ID

`2026-08-19-home-preview-production-render`

## Status

`candidate`

## Plain-English Summary

The content-generation pipeline for the new eight-chapter Home experience was accepted as
mechanically proven in a separate release
([docs/releases/records/2026-08-19-home-chapter-writer-foundation.md](2026-08-19-home-chapter-writer-foundation.md))
-- five live-fire fixes, both tenants generating complete, evidence-verified output. That release
explicitly drew the line: the content engine passing does not mean the Home *experience* has
passed. This release builds the experience side: a real, gated, production-faithful preview route
that renders the exact `ChapterView`/`EnterpriseThesis` payload contract the generator produces,
against both accepted tenants' golden-snapshot output, so a human can actually judge whether it
reads like an extraordinary executive briefing -- the bar the workstream set, not "does the JSON
serialize correctly."

New route: `/home/preview`, gated to platform admins and foundation-preview operators, `force-dynamic`.
Renders all eight chapters (Executive Brief, Our Business, Strategy & Value Creation, How We
Operate, Technology & Data, Performance & Value, Leadership Perspective, What Needs Attention) in
production order, each composed as: answer-first headline -> executive synthesis -> key insights
(every claim inspectable for its underlying evidence with one click) -> a governed visual exhibit
where one was assigned -> tensions and what to watch -> questions worth asking management. A
"Browse the Data" section beneath every chapter exposes every deterministic signal and governed
fact in the tenant's packet, searchable and filterable, independent of whether a chapter cited it
-- closing the composition loop the workstream named: thesis -> chapter -> insight -> fact ->
visual -> evidence -> exploration. An instant tenant switcher moves between Meridian Health and
SkyHarbor Air without a page reload, since both are loaded server-side from checked-in JSON
fixtures.

**No `:apply`, no database write, no `/home` route change, no legacy-reader removal.** This is a
new, separate, admin-gated route reading static fixture files; `/home` itself and every existing
reader are completely untouched.

**Iteration after the first live look (same day, same review cycle):** direct feedback on the
first version -- "one large page that keeps scrolling," "full canvas width," "an explorer... a
current state tech/architecture view" -- drove a structural rebuild of the shell, not a cosmetic
tweak. The app is now a persistent left sidebar (tenant identity, candidate badge, switcher, and
every navigation destination) plus a single active view in the main pane, instead of all eight
chapters concatenated into one continuously scrolling document. A new **Current State** view groups
every loaded signal and governed fact by its real domain (Applications & Systems, Vendors &
Contracts, Infrastructure & Platforms, Workforce, Programs & Initiatives, Risk & Controls, AI &
Automation, and twelve more) into expandable category cards with real counts -- the "what has been
loaded" survey the feedback asked for, distinct from Browse the Data's flat searchable list. A fact
spanning multiple domains (e.g. a vendor concentration that is also a spend fact) genuinely appears
under each domain it belongs to, not deduplicated to one "primary" category.

## Layer Impact

Release lane: `internal-admin` (gated to platform admin / foundation-preview operator only; not a
client-facing route). Layer 4 (Products) -- a new preview surface under the Home product, reading
Layer 3-shaped payloads (the exact `EnterpriseThesis`/`ChapterView` canonical shapes from
`scripts/data-build/*.ts`, type-only imported so no data-build runtime code reaches the bundle)
from checked-in fixture JSON rather than the canonical model or the database. No canonical model
change. No product route change to `/home` itself.

## Client Applicability

- All clients: no -- this route is not client-facing.
- Specific clients: none -- the two tenants shown (Meridian Health, SkyHarbor Air) are the
  workstream's own review pair, not a client-facing activation.
- Internal only: yes -- platform-admin/foundation-preview-operator gated, matching the
  `knowledge-preview` route's own precedent.
- Public/demo only: no.
- Feature flag: none. Access control is the session gate itself, not a flag.

## Changes Included

- `src/lib/home/preview/types.ts` (new) -- type-only re-exports of the exact
  `ChapterView`/`EnterpriseThesis`/`GroundedClaim`/`VisualOpportunity`/`HomeReviewBundleProvenance`
  shapes from `scripts/data-build/*.ts`, plus the `HomeReviewBundle` wrapper shape. `import type`
  only, so no data-build runtime code (pg, papaparse, node built-ins) reaches any bundle.
- `src/lib/home/preview/golden-snapshot.ts` (new) -- server-only loader (`import "server-only"`)
  reading `src/lib/home/preview/golden-snapshots/<tenantKey>.json`. No live model call, no
  database. Refuses (returns `null`, never throws or falls back) for any tenant outside the two
  accepted keys.
- `src/lib/home/preview/golden-snapshots/meridian-health.json`,
  `skyharbor-air.json` (new) -- the accepted review bundles: full published thesis, all eight
  chapter payloads, verification ledger, structural-issue log, and the complete visual-dataset
  catalog, built from the fifth (clean) live-proof run in the prior release, plus generation
  provenance (contract/prompt/model/verification versions, a content hash of the signal packet,
  the deploying commit and image digest).
- `scripts/data-build/build-enterprise-thesis.ts` -- exports `THESIS_PROMPT_VERSION`, `Verdict`,
  `VerificationLedgerEntry`, `StructuralIssue` (previously internal types/constants, needed so the
  preview's type layer and the provenance stamp can reference the real types instead of
  hand-duplicating them).
- `scripts/data-build/build-home-chapters.ts` -- adds `HomeReviewBundleProvenance` and
  `buildProvenance()`: every future `data-build:home-chapters:plan` run now stamps its output with
  `home_synthesis_contract_version`, `thesis_prompt_version`, `chapter_prompt_version`, `model`,
  `signal_packet_version`, `canonical_snapshot_hash` (sha256 of the signal packet, same algorithm
  already used for the DB-write dedup check), `verification_version`, `generated_at`, and (when run
  as an ACA operator job) `generation_commit_sha`/`generation_image_digest`. This is the lineage
  mechanism the workstream asked for: any future prompt/model/pipeline change can be compared
  against this run's stamp to tell whether generation got better, worse, or merely different.
- `src/components/home/preview/visuals/home-chart-kit.tsx`, `dataset-fields.ts`,
  `GovernedVisual.tsx` (new) -- the shared visual contract renderer. Literal-hex palette derived
  from the locked AbarVa design system (`src/app/globals.css`: navy `#1B2B5C` primary, teal
  `#0E8A65` secondary -- Recharts cannot resolve CSS custom properties in SVG paint, so these are
  duplicated as literals, same constraint Tower's own `chart-kit.tsx` documents for its separate
  teal/cream palette). Only two visual_types (`bar`/`stacked_bar`, `horizontal_bar`) and one more
  (`donut`) actually appear across both accepted tenants' output; renderers exist for exactly
  those three. A `dataset_ref` with no field configuration, or a `visual_type` with no built chart
  renderer (the fourteen relational/structural types -- `capability_map`, `dependency_graph`, etc.
  -- none of which the current thesis generator has proposed), falls back to a labeled data table
  rather than being silently dropped -- "missing is never zero" applies to a proposed exhibit
  exactly as much as to a governed fact.
- `src/components/home/preview/evidence-resolver.ts`, `ClaimCard.tsx` (new) -- the evidence
  interaction mechanism. Every claim (`key_insights`, `tensions`, `what_to_watch`) renders as
  prose with a quiet "Why do we believe this?" affordance; clicking resolves the claim's
  `evidence_ids` against the tenant's real signal packet and shows the underlying deterministic
  statement, confidence, claim type, and (for a `kind: "testimony"` signal) an explicit
  "LEADERSHIP TESTIMONY" label distinguishing a leadership quote from a computed fact. Collapsed
  by default -- the narrative reads clean; evidence is one click away, not printed regardless of
  whether a reader wants it.
- `src/components/home/preview/BrowseTheData.tsx` (new) -- the factual explorer: every signal and
  governed context item in the tenant's packet, searchable by text and filterable by domain,
  independent of whether any chapter cited it.
- `src/components/home/preview/ChapterSection.tsx`, `HomePreviewApp.tsx`,
  `HomePreviewAppRoot.tsx` (new) -- the full chapter composition and the page-level app shell.
  **Rebuilt after first live feedback**: `HomePreviewApp` is now a persistent left sidebar
  (tenant identity, candidate-status badge reusing the existing governed `StateBadge` component's
  `candidate` tone, tenant switcher, chapter nav, Current State and Browse the Data links,
  generation-provenance footer) with a single active view in the main pane -- clicking a sidebar
  item swaps `main`'s content entirely rather than scrolling to an anchor within one long page.
  Local `activeView` state lives in `HomePreviewApp` itself (not lifted to the root), so it
  naturally survives a tenant switch since the same component instance persists.
- `src/components/home/preview/domain-labels.ts` (new) -- human-readable labels and a fixed
  display order for the twenty raw `domains` tags (`vendor_contract`, `application_system`, etc.)
  that appear on every signal/context item. A domain not yet in the table title-cases the raw
  identifier rather than showing it verbatim.
- `src/components/home/preview/CurrentState.tsx` (new) -- the "what has been loaded" survey added
  in response to feedback asking for "an explorer... a current state tech/architecture view."
  Groups every signal and governed fact under every domain it belongs to (not deduplicated to one
  "primary" domain) as expandable category cards with real counts, ordered enterprise-identity ->
  technology -> people -> risk/programs/AI. Five categories most relevant to "what does the estate
  look like" (Applications & Systems, Infrastructure & Platforms, Vendors & Contracts, Data &
  Integrations, Workforce) are expanded by default; the rest are one click away.
- `src/app/(maestro)/home/preview/page.tsx` (new) -- the route itself. Follows the
  `knowledge-preview` route's established convention: `force-dynamic`, gated on
  `isPlatformAdminSession() || isFoundationPreviewOperatorSession()`, `notFound()` otherwise. Loads
  both tenants' golden snapshots server-side (so tenant switching is instant, no navigation) and
  throws loudly, not silently, if a snapshot file is missing. Wrapped in `<AppShell surface="home">`
  like every other Home surface.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` -- PASS, 0 errors.
- `npx eslint` on every new/changed file -- PASS, 0 errors.
- `npx jest` across the new test suites -- PASS, 94/94 (61 pre-existing data-build tests
  unaffected + 33 new: golden-snapshot loading and evidence-id resolution against the real
  fixtures, dataset field configuration against the real visual datasets, `GovernedVisual`'s three
  fallback boundary cases -- unresolvable dataset_ref, unconfigured dataset, empty dataset --
  `ClaimCard`'s expand/collapse evidence interaction against a real claim, `BrowseTheData`'s
  search/filter/empty-state behavior, `domainLabel`'s coverage of every domain actually present in
  either accepted tenant's real data (a new domain the generator starts emitting fails this test
  rather than silently rendering as a title-cased guess), and `CurrentState`'s category grouping --
  including a real multi-domain fact confirmed to render once per category it genuinely belongs
  to, not deduplicated to a single "primary" domain).
- Every chapter's `evidence_ids` independently re-verified to resolve to a real signal or context
  item in the same bundle (test: `golden-snapshot.test.ts`, "every chapter's evidence_ids resolve
  to a real signal or context item in the same bundle") -- the same discipline the generator's own
  verification enforces, checked again at the render layer as a second, independent guard.
- **Live signed-in browser check, done post-merge/deploy against `https://app.abarva.ai/home/preview`,
  signed in as the real platform-admin session (Anand Sundaram):** page renders past the admin
  gate; both chapters' real content displays (Meridian's Executive Brief headline and body,
  SkyHarbor's after switching); the tenant switcher swaps content instantly with no page
  navigation and no stale content bleed-through; a `ClaimCard`'s "Why do we believe this?" click
  correctly expanded to show the two real resolved signals (`sig_concentration_001`,
  `sig_dependency_076`) with their actual statements and source records, then collapsed again on
  a second click; the `horizontal_bar` exhibit rendered with a working hover tooltip showing the
  real vendor name and formatted dollar value; Browse the Data rendered "114 of 114 shown" and
  correctly narrowed to the 2 real Cotiviti-related facts on a live search; the
  `questions_for_management` fix (PR #6519) held on this exact deployed build -- the rendered
  question was the real, grounded PAM/CyberArk coverage-gap question, not the earlier fabricated
  "sponsor change" text. Console showed zero errors from this change (one pre-existing, unrelated,
  already-documented Clerk dev-keys warning). This is the audit evidence the "not yet done" note
  below used to flag as outstanding -- now complete.
- The acceptance question itself -- "would a newly appointed CXO spend 20 minutes here and come
  away feeling Abarva understands their enterprise exceptionally well" -- is explicitly the
  workstream owner's call, not a QA checkbox. This release provides the surface to answer it, not
  the answer.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image; `/home/preview` becomes reachable
at the deployed lab URL for a platform-admin or foundation-preview-operator session. No feature
flag, no migration, no traffic shift beyond the routine image update. Output stays entirely
`:plan`-equivalent -- no database write path exists anywhere in this change, `/home` is untouched --
until a human reviews the actual rendered experience for both tenants and makes the separate,
explicit decision to authorize `:apply` and a `/home` pivot.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR -- a new route, no env/flag/scale/secret change.
- Approved image digest: recorded at merge, verified independently against
  `az containerapp show`/`az containerapp revision list` before any live-proof claim, per this
  repo's standing runtime-invariant discipline.
- Live signed-in proof required and complete: see QA/Validation's live browser check against
  `https://app.abarva.ai/home/preview`. Was not required to merge (the route is admin-gated and
  inert for every non-admin session), but was required before the acceptance review this route
  exists to support could be considered ready for a human review pass.

## Rollback Plan

Revert the commit. No database row has ever been written by any part of this workstream
(`build-home-chapters.ts` has no write path at all; the golden-snapshot files are static JSON, not
a migration), so rollback is a pure code revert with no data cleanup needed. `/home` itself was
never touched, so there is nothing to roll back there.

## Audit Evidence

PR link recorded at merge. The live signed-in browser check against
`https://app.abarva.ai/home/preview` (see QA/Validation) is the audit trail for the mechanical
side of this release -- render correctness, evidence interaction, chart rendering, tenant
switching, search. The still-open audit item is the human acceptance review itself (does this read
like an extraordinary CXO briefing), which is a separate, explicit decision the workstream owner
makes directly against the live URL, not something this record can certify.

## Known Gaps

The relational/structural visual types (`capability_map`, `dependency_graph`, `organization_map`,
`strategy_tree`, `risk_chain`, `value_chain`, `timeline`) have no chart renderer yet -- none of
them appear in either accepted tenant's current output, so this is a real but currently-inert gap;
`GovernedVisual` falls back to a labeled table rather than dropping the exhibit if the generator
ever proposes one. The literal-hex chart palette is duplicated from `src/app/globals.css` by hand,
the same maintenance burden Tower's own `chart-kit.tsx` already carries and documents -- a future
design-token change requires updating both places. This route intentionally does not attempt
side-by-side (two-column) rendering of both tenants at once; the instant tenant switcher was judged
a better reading experience for a full executive briefing than two narrower columns, but this is a
design choice worth confirming against the reviewer's actual expectation, not an oversight.
**Second live signed-in browser check, done post-merge/deploy against the sidebar shell
(`https://app.abarva.ai/home/preview`, same real platform-admin session):** the sidebar renders
with all eight chapters, Current State, and Browse the Data visible at once, no scrolling needed
to see any navigation destination; clicking a chapter swaps the main pane instantly with the
sidebar staying fixed in place -- the specific "one large page that keeps scrolling" complaint no
longer applies, since only one view's content renders at a time. Current State renders its
category-card grid across the full remaining width; the four categories expected to be
open-by-default (Applications & Systems, Data & Integrations, Infrastructure & Platforms, Vendors
& Contracts) showed real facts immediately, and the collapsed ones (Enterprise Profile, Business
Functions) toggled open correctly on click. Console showed zero new errors -- only the same
pre-existing, unrelated Clerk dev-keys warning already noted above. This closes the "immediate
next step" the first version of this note flagged as outstanding.
