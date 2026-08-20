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

**Fourth iteration, same day -- Technology Estate tabular explorer:** direct follow-up feedback
named the actual use case: "I may want to tag and know the data and analytics platform servicing
finance needs or clinical needs or population health... what is used for ETL, reporting,
analytics... how many ETL jobs, tables, or reports." That's real structured data, and it wasn't
exposed anywhere -- every prior view (Browse the Data, Current State) reads only the derived,
one-sentence `signalPacket` signals, never the raw canonical CSV records with their real columns.
- `scripts/data-build/build-enterprise-thesis.ts` -- `buildTenant()` now returns `canonicalRecords:
  CanonicalIngestionRecord[]` (the full raw records `buildCanonicalTenantDataReport` already
  computes internally, previously discarded after building the signal packet) on every return
  path, including the early-return failure branches, since this data doesn't depend on Claude
  succeeding at all.
- `scripts/data-build/technology-estate.ts` (new) -- pure, deterministic extraction (no model
  call, nothing to verify -- every value is a direct CSV field) for four object types named
  directly in the request: `application_system`, `vendor_contract`, `infrastructure_platform`,
  `data_asset_or_integration` (301/72/65/520 real records respectively on Meridian). Strips
  ingestion-bookkeeping fields (`sourceFile`, `confidence`, etc.) and narrative-text fields
  (anything ending `Narrative`/`Notes`) from the column set, keeping every real structured field
  (`businessFunction`, `systemCategory`, `vendor`, `criticality`, `annualCostUsd`, `userCount`,
  etc.) in the source CSV's own column order. Precomputes a `primaryDimension` per object type --
  `businessFunction` for applications, `dataDomain` for data assets, `serviceCategory` for vendor
  contracts, `platformType` for infrastructure -- with real counts per value, directly answering
  "servicing finance needs or clinical needs or population health" as an at-a-glance segmentation,
  not a generic low-cardinality-column heuristic.
- `src/components/home/preview/TechnologyEstateTable.tsx` (new) -- one object type's table:
  dimension rollup as clickable count chips (doubles as filter and segmentation-at-a-glance),
  free-text search across every column, an honest "no records match" empty state.
- `src/components/home/preview/HomePreviewApp.tsx` -- sidebar gains a collapsible "Technology
  Estate" tree under Browse the Data, one entry per object type with a real row count, satisfying
  the earlier "tree/branch structure" request. `HomeReviewBundle.technologyEstate` is typed
  **optional**, not required: a golden snapshot generated before this field existed genuinely
  won't have it, there is no runtime schema validation on the JSON these types describe, and every
  reader degrades gracefully (the tree section simply doesn't render) rather than assuming the
  field is always present -- this is what let the code ship safely ahead of regenerating the two
  tenants' fixtures, with no window where the live page could crash against stale data.

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
- Technology Estate iteration: `npx jest tests/behaviors/technology-estate.test.ts` (8 cases, pure
  extraction logic including the dimension-rollup counting and the null-vs-fabricated-guess
  distinction for `primaryDimension`) plus `TechnologyEstateTable.test.tsx` (6 cases: dimension
  chip filtering, free-text search across every column, honest empty state, no rollup rendered
  when `primaryDimension` is null) -- PASS, 47/47 across the full preview test suite.
- **Fixture regeneration, done differently than every prior iteration this workstream, for a real
  reason:** the standard path (a full live `data-build:home-chapters:plan` ACA Job run) hit four
  distinct, unrelated `az containerapp job logs show` failures in a row while retrieving this run's
  output (a bad `--tail` value on one attempt was mine; the other three -- "No replicas found",
  a mid-stream connection reset, and a live `--follow` session that silently closed after
  connecting with no data -- were not). A Log Analytics fallback confirmed the underlying job
  executions themselves succeeded every time, but also surfaced that the ~150-200KB
  `__HOME_CHAPTERS_RESULT_BEGIN__` marker lines this whole workstream's retrieval convention
  depends on are being dropped entirely by Container Apps' console-log ingestion (max captured
  line length: 454 characters, out of runs that should include two ~150KB+ single lines) -- a real
  platform limitation for any future run producing output at this scale, not something a retry
  fixes. Rather than keep fighting fetch reliability for data that doesn't actually need a live
  model call: `technologyEstate` is pure canonical-CSV extraction (see `technology-estate.ts`'s
  own docstring -- "never touches Claude, needs no verification"), so it was computed locally
  (`buildCanonicalTenantDataReport` runs fine offline, confirmed earlier in this same workstream)
  and merged directly into the two tenants' existing, already-verified, already-live-proven golden
  snapshots -- `chapters`/`thesis`/`provenance` untouched, only the new `technologyEstate` key
  added. This is the correct scope for this specific field (it has no live-model dependency to
  reprove) but is not a substitute for a full regeneration the next time `chapters`/`thesis`
  content itself changes -- that will still need the ACA Job path, and the console-log size
  limitation above is worth fixing at the pipeline level (e.g. a blob-based proof bundle, which
  `docs/ops/aca-data-build-job-rule.md` already specifies as the intended mechanism for this class
  of job) before the next iteration that produces output this large runs into it again.
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

**Third iteration, same day:** the user pointed at a live screenshot on a wide monitor showing a
large dead void to the right of a chapter's prose column -- the sidebar fixed the scrolling
complaint but `ChapterSection`'s content was still capped narrow (860px) and left-anchored within
`main`, so a wide viewport just moved the wasted space rather than using it. Fixed two ways: (1)
`ChapterSection` is now a two-column layout -- prose stays a readable ~720px (wider paragraphs
hurt reading, not help it) alongside a new sticky "On this page" rail (guiding question + a jump
nav with real counts per section: What Matters, Exhibit, Tensions & What to Watch, Questions), so
the freed width does real work instead of sitting empty; (2) `main` in `HomePreviewApp` now
centers its active view within a shared `maxWidth: 1280` container, so leftover space on very wide
screens is distributed evenly rather than dumped entirely on one side, applied once at the shell
level so every view (chapters, Current State, Browse the Data) benefits consistently.

**Fourth iteration -- Ask aVa, additive:** the Technology Estate explorer (tabular/tree drill-down
into real canonical records) shipped and was live-verified separately. This iteration adds an
opt-in chat layer, `HomeAvaChat`, wrapping the whole preview app: `AvaChatShell`/`AgentDock` (the
same branded shell Intelligence's own "Ask aVa" uses, extended with a new `defaultMode` prop so it
starts as a collapsed floating chip rather than always-open side-rail -- the existing full-width
chapter layout stays exactly as-is until a reader opts in) send a question to a new route,
`POST /api/home/preview/ask`, gated behind the identical platform-admin/foundation-preview-operator
check the preview page itself uses.

Deliberately **not** built the way Intelligence's own `/api/intelligence/ask` works. That endpoint
composites ~8 independent live-DB retrievers per request and does not call
`buildValidatedAgentContextBundle` despite the governance policy's stated requirement -- a real,
separately-tracked gap this workstream found but did not fix here (out of scope for a preview-only
surface). Home preview has no live DB dependency at all -- every chapter, claim, and Technology
Estate count already lives in the accepted golden-snapshot JSON, already through this workstream's
own entailment-verification pass. `answerHomeAvaQuestion`
(`src/lib/home/preview/ava-answer.ts`) grounds a single Claude call in that JSON alone: every claim
is offered to the model pre-tagged (e.g. `TD-K1`), and the model must cite the exact tag it used --
a tag it invents is dropped server-side, never trusted. Any chart or table the model requests must
name a `dataset_ref` this function itself precomputed from real `dimensionCounts` records; the
model never supplies a plotted value, the same anti-fabrication pattern `build-enterprise-thesis.ts`
already uses for `visual_opportunities`. A question outside the supplied context returns an honest
`no_data`/`partial` status rather than a guess. Chart kind is constrained to what
`AnswerChartKind`/`AgentAnswerRenderer`'s Recharts path actually supports (`bar`/`horizontal-bar`
only for now -- the fuller kind list, and the still-unbuilt relational/structural SVG renderers
noted above, remain future work, not silently promised here).

QA so far: 7 new unit tests in `ava-answer.test.ts` cover the anti-fabrication path directly --
grounded citation resolves to the real claim text, an invented citation tag is dropped, a chart
artifact's data is asserted to equal the real `dimensionCounts` values (not anything the mocked
model response wrote), a `dataset_ref` that doesn't exist produces no artifact, an honest `no_data`
status passes through, and both an unparseable-JSON model response and a thrown client error fall
back to a safe `no_data` packet rather than crashing the route. Full existing Home preview suite
(54 tests) still green; typecheck and targeted ESLint clean. Confirmed, via `git stash`, that 9
pre-existing failures in `AgentDock.test.tsx`/`AdvisoryIntelligencePage.test.tsx` predate this
change entirely and are unrelated (not part of `npm run test:behaviors`, reproduced identically
with this change stashed out) -- left untouched as out of scope.

**Live signed-in browser proof, post-merge/deploy against `https://app.abarva.ai/home/preview`:**
asked a real question ("Which business function has the most applications?") -- the answer
correctly named Clinical Informatics at 99 applications (the real dimensionCounts value) and cited
a real chapter claim (Epic's $86.2M vendor spend, 82 integrations) alongside it, with a real
horizontal-bar chart artifact rendering below the prose, built from the same real counts. A second,
deliberately out-of-context question ("What is Meridian's current stock price?") returned an honest
"I'm not able to answer this question from the current materials" rather than a guess. Switching
tenants (Meridian to SkyHarbor) reset the chat thread to empty, confirming no cross-tenant context
leakage via the `key={tenantKey}` remount. Console showed zero new errors on either tenant.

**Fifth iteration -- real 2D segmentation matrix.** Extends the Technology Estate explorer's flat
dimension-chip filter into a genuine two-dimensional cross-tab: rows stay the record type's
existing `primaryDimension` (e.g. business function), and a new "Cross with" picker lets the reader
add a second real column as columns (e.g. system type, deployment model, data classification,
analytics usage) -- a business-segment-rows x categorical-lens-columns shape, built here entirely
from grounded fields rather than any authored/derived bucket. `eligibleCrossDimensions`
(`src/lib/home/preview/segmentation.ts`)
only offers columns that already exist verbatim in the source canonical data, are string-valued
(excludes quantitative fields like `annualCostUsd`), and have between 2 and 12 distinct values --
never invents a category. `computeCrossTab` counts real per-record combinations into a matrix;
every cell is a clickable button that filters the table below to that exact (row, column)
combination, reusing the existing `dimensionFilter` state plus a new `crossFilter`. This directly
answers the earlier "which data & analytics platform services finance vs. clinical needs" question:
crossing `dataDomain` against `analyticsUsage`/`integrationType`/`platformOrDatabase` on the
`data_asset_or_integration` record type surfaces real ETL/reporting/analytics platform counts per
business domain -- no fabricated "lens" needed since those fields already exist as raw canonical
columns. Also fixed a related pre-existing bug found while extending this component: switching
between Technology Estate object types (e.g. Applications to Vendor Contracts) did not reset
`TechnologyEstateTable`'s internal filter state, since the component was not keyed per object type
-- fixed with `key={activeTechRecordType.objectType}` at the call site in `HomePreviewApp.tsx`.

QA: 8 new unit tests in `segmentation.test.ts` cover the anti-fabrication path directly --
low-cardinality string columns are offered, the primary dimension itself is excluded, a
quantitative column is excluded, a column with too many distinct values (over the 12-value
ceiling) is excluded, an all-null column is excluded, the matrix correctly buckets null values as
"(not specified)", and row/column totals sum to the exact same record count as the existing
`dimensionCounts` (proving the cross-tab isn't double-counting or dropping rows). Full existing
Home preview suite (62 tests) green; typecheck and targeted ESLint clean.

**Sixth iteration -- overall page-quality pass.** Found and fixed two real, pre-existing defects
while reviewing the whole preview end-to-end:

1. **Degenerate dimension-chip filters.** `vendor_contract`'s `serviceCategory` is 90-100%
   singleton per tenant (every distinct value appears on exactly one record) and
   `infrastructure_platform`'s `platformType` is 60-71% singleton -- the flat chip row rendered
   dozens of one-record chips with zero real segmentation value (each chip narrowed to exactly the
   record it came from). `TechnologyEstateTable` now only renders chips for values with a real
   cluster (count > 1); a plain-language note explains the rest exist and points to search or
   "Cross with" instead. When every value is a singleton (the vendor_contract case), the chip row
   is replaced entirely by that note -- no wall of unclickable noise. Nothing is hidden from the
   data itself: every singleton record is still fully reachable via search or the table.
2. **Tablet-width text clipping in `ChapterSection`.** At 768px (tablet), the two-column chapter
   layout (720px prose + 240px sticky rail, `gap: 48`) doesn't fit inside the ~500px `main` has
   available once the 268px nav sidebar is subtracted. The prose `<section>` had `flexShrink: 0`
   -- an explicit "never shrink" -- so instead of wrapping, headline and body text were silently
   clipped past the visible viewport edge by an ancestor `overflow: hidden` (no scrollbar, so the
   text just vanished with no visible symptom other than a truncated sentence). Fixed with the
   standard flexbox pattern: the row now wraps (`flexWrap: "wrap"`), and the prose column uses
   `flex: "1 1 480px"` with `minWidth: 0` instead of a rigid `flexShrink: 0` -- it still prefers
   720px on a normal desktop width (unchanged there), but now shrinks and wraps text properly when
   space is tight, and the sticky rail drops below the prose column rather than being squeezed off
   past the edge. Grepped the rest of `src/components/home/preview/*.tsx` for the same
   `flexShrink: 0` pattern -- the other two instances (a small monospace citation-id label, the
   268px nav sidebar itself) are genuinely fixed-width elements, not columns that need to reflow,
   so left as-is.

QA: existing 63-test suite still green (`TechnologyEstateTable.test.tsx` updated -- its fixture's
`businessFunction` values now both have real clusters, matching realistic production data, plus a
new test asserting the singleton-note path); typecheck and targeted ESLint clean. This pass also
surfaced a gap in this workstream's own verification habit: prior live-proof checks only exercised
the desktop viewport this route was designed for -- tablet width (768px) was never checked and
this bug went unnoticed for two prior iterations as a result. Live proof for this iteration
explicitly includes a tablet-width check.

**Seventh iteration -- layout density.** The reviewer flagged large dead gutters on a wide
(~1900px) monitor: one between the left explorer and the content, another after the content.
Root cause was in `HomePreviewApp`'s `main`: it centered a fixed `maxWidth: 1280` container inside
the space remaining after the 268px sidebar, so on a wide screen the leftover split into two
gutters of roughly 176px each rather than one margin. Compounding it, `ChapterSection`'s flex row
only consumed about 1088px of that 1280 (720px prose + 48px gap + 240px rail + 80px padding),
leaving a further ~190px of unused slack at its right edge. Fixed by dropping the centering so
content is left-aligned and begins immediately after the rail, raising the container cap to 1340,
widening the prose measure to 780 and the rail to 264, and standardising horizontal padding at
56px across all four views (chapters, Current State, Browse the Data, Technology Estate) so every
view shares one left edge. Any remaining slack on very wide screens now collects as a single right
margin instead of being distributed into gutters between elements.

This is a targeted density fix, not the broader visual redesign -- a separate design direction for
the chapter reader has been drafted against the locked brand canon (Fraunces/Inter/JetBrains Mono,
paper ground, evidence surfaced as margin sidenotes rather than behind a click) and pushed to the
AbarVa Design System project as `preview/20-home-chapter-reader.html` for review. That redesign is
not implemented in React and is explicitly not part of this change.

**Eighth iteration -- client-facing hygiene.** Three defects, all the same underlying mistake:
internal machinery rendered onto a surface an executive reads.

1. **Cross-tenant switcher removed.** The rail carried Meridian/SkyHarbor toggle buttons. Even in
   a preview this is the wrong pattern -- a client-facing surface must never imply another
   client's data is one click away. The switcher is gone and tenant selection moved to the route
   (`?tenant=<key>`), so the page now loads exactly one tenant's bundle: the other tenant's
   payload no longer reaches the response at all, rather than merely being hidden from view.
2. **Physical source label was leaking.** `HomePreviewApp` hardcoded `"SkyHarbor Air"`. The
   canonical `DEMO_SAFE_CLIENT_NAMES` map resolves that tenant to `"SkyHarbor Global"`, and the
   tenant's own promotion manifest is explicit that the physical/source label must not appear on
   AbarVa-facing pages. This is why Intelligence displayed "SkyHarbor Global" while this preview
   displayed "SkyHarbor Air" -- Intelligence routes through `demoSafeClientText`, the preview
   bypassed it. Labels now derive from that function rather than hand-typed strings, and the
   header states plainly that this is a demo client on synthetic data.
3. **Internal taxonomy shown to readers.** Claims rendered `"Cross-domain insight"` and
   `"Advisory inference"`, with `GOVERNED FACT` / `LEADERSHIP TESTIMONY` badges on evidence.
   These are pipeline vocabulary, not executive language. Reworded to `"Analysis"`,
   `"Our interpretation"`, `"From your systems"`, and `"From leadership interviews"`. The
   fact-versus-judgement distinction is deliberately kept -- it is the honesty mechanism, and a
   CXO does need to know whether they are being told a fact about their business or given our
   opinion. Only the vocabulary changed.

QA: 3 new regression tests assert the demo-safe name renders, the physical label never does, the
surface is marked as demo/synthetic, and no control exists that names or switches to another
client. Full preview suite green; typecheck clean.

**Ninth iteration -- thesis evidence gaps now reach the chapters they limit.** Auditing the
approved next-generation Home design against the real payload surfaced a silent content defect:
the chapter assembler computed thesis-level `evidence_gaps` but never routed them to chapters, so
`ChapterView.limitations[]` was empty on all 16 chapters across both demo tenants. A design that
gives "what is not established" its own section -- the approved one does -- would therefore have
rendered an empty heading on every chapter, removing precisely the honesty signal the field exists
to carry, and doing it silently.

`assignEvidenceGaps()` routes each gap by subject keyword. Unlike question routing, a gap is not
consumed by its first match: one missing dataset can legitimately limit two chapters, and letting
the first match absorb it would hide the warning from the other chapter's reader. A gap matching no
chapter's subject is a whole-build limitation and lands in the executive brief. After routing, 5 of
8 chapters carry a gap and 3 do not -- so the absent state is a real state any renderer must handle,
not an edge case.

Golden snapshots were backfilled deterministically rather than regenerated. The routing reads only
text already verified and present in each snapshot's own thesis, so it needs no model call; a full
chapter rebuild would have risked changing verified prose to achieve a change that requires none.
The backfill script is idempotent and the resulting diff is 32 lines, every one a `limitations`
entry -- no generated prose changed.

One correction worth recording, because the wrong version of it was briefly circulated: an earlier
draft of the design audit listed `structuralIssues` and the UNSUPPORTED/OVERSTATED verification
ledger entries as further unrouted absence content. They are not usable. Both are builder records
-- they speak in claim paths and verdict vocabulary that must never reach a client surface -- and
most ledger entries are repairs rather than absences. `evidence_gaps` is the only client-safe
absence signal the thesis produces.

Lane: `global-control-lane`. Layer: canonical model assembly (layer 3), no product surface changed.
Clients affected: both demo tenants' Home preview content; no production client surface reads these
snapshots yet. QA: 4 new routing tests (multi-chapter fan-out, whole-build fallback, no-gap-lost,
empty-thesis) plus the 13 existing chapter-assembly tests, all green; typecheck clean; snapshot diff
inspected line by line. Rollout: merge to main, no data-plane migration, no job run required.
Rollback: revert the commit -- the snapshots return to empty `limitations` and no other field moves.
