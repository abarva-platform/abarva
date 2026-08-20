# 2026-08-20-home-v4-record-and-reading — Home v4 behind the preview route

## Release ID

`2026-08-20-home-v4-record-and-reading`

## Status

`candidate`

## Plain-English Summary

Replaces the chapter layout on the gated Home preview route with the approved v4 design.

**The change that matters.** The previous layout labelled every individual claim with its own
epistemic status — `Fact · High confidence`, `Our interpretation · Medium confidence` — roughly
seventy labels per tenant. At that volume the labels stop being read, which is the opposite of what
an honesty mechanism should do. v4 states the distinction once, structurally, by splitting each
chapter into bands and putting each claim in the band that matches what it is:

| Band | What sits there | Source |
| --- | --- | --- |
| What the record shows | counted from the client's own systems and interviews | `claim_type` FACT / OBSERVATION |
| What follows from it | readings of those counts, contestable on the record they cite | CROSS_DOMAIN_INSIGHT / ADVISORY_INFERENCE |
| Open exposures | severity the client's own register already assigns | evidence in the `risk_or_control` domain |
| Not established | what the chapter deliberately does not assert | `limitations[]` |

Every routing rule reads a value the claim already carries — its type, or the canonical domains its
cited evidence declares. Nothing is decided by reading the prose, because a router that interpreted
sentences would become a second, unverified opinion about the enterprise.

**Absence gets billing, not a footnote.** The previous layout rendered gaps as a 12.5px grey italic
line joined end-to-end at the bottom of the chapter. v4 gives the band an `h2` and each gap its own
`h3`, closing with the reason plainly: a blank there is a reported gap, an invented number would not
be.

**Two things removed from the client surface.** The section-count nav ("What matters 5") was a
build metric wearing a nav's clothes — nobody reading a chapter needs to know a band holds five
items before reading it. And the exhibit eyebrow previously would have printed the pipeline's own
`purpose` string ("Show vendor spend concentration to support the single-vendor dependency
narrative"); telling an executive that an exhibit exists to support a narrative is both jargon and a
bad look, framing their own data as evidence assembled for an argument. Exhibits now carry a short
subject label and the purpose string stays internal.

**Exhibits state their own truncation.** A bar exhibit prints how many rows it draws and accounts
for everything it does not, rather than silently showing a top-N.

## Layer Impact

- `global-control-lane`. Presentation only, at layer 4. Reads the existing `ChapterView` /
  `EnterpriseThesis` contract and changes nothing about it.
- No canonical model, generation, verification, schema, or data-plane change. Golden-snapshot
  content is untouched by this release.

## Client Applicability

- All clients: no.
- Specific clients: the two synthetic demo tenants rendered by the gated preview route.
- Internal only: yes — the route requires platform-admin or foundation-operator session.
- Public/demo only: no.
- Feature flag: none. The preview route is the flag: `/home` is untouched and still serves the
  previous reader.

## Changes Included

- `src/components/home/v4/` — tokens, bands, chapter page, exhibit, rail, not-drafted page, band
  router, evidence source labels
- `src/components/home/preview/HomePreviewAppRoot.tsx` — preview route now renders v4
- `scripts/qa/render-home-v4-proof.tsx` — renders all 16 chapters to static HTML for human review
- `tests/behaviors/home-v4-bands.test.ts` — band routing tests

## QA / Validation

- **PASS** — 9 band-routing tests, including checks run against both real golden snapshots: every
  claim reaches exactly one band (a claim reaching none would vanish from the page with nothing to
  show it existed), and each tenant has both chapters with a gap band and chapters without, so the
  band's absent state is exercised against real data rather than first encountered by a reader.
- **PASS** — `tsc --noEmit` clean; `eslint` clean.
- **PASS** — all 16 chapters (8 per tenant) rendered to HTML, served over HTTP, and inspected.
  Band order correct in all 16. Real chapter shapes confirmed and handled without empty headings:
  one chapter renders a single band; two render no "What the record shows" band at all; several
  render no questions section.
- **PASS** — vocabulary scan across all 16 renders: no internal taxonomy, no pipeline strings.
- **PASS** — no horizontal overflow at 1300px or 900px; the claim grid collapses to one column at
  the narrow width.
- Three defects were found by looking at rendered output and fixed before commit: the pipeline
  `purpose` string in the exhibit eyebrow; a bar track and fill that were invisible against the dark
  exhibit ground; and a header that set the full multi-paragraph synthesis in a half-width column,
  producing a standfirst taller than the headline it supports.

## Rollout Plan

Merge to main; the repo-owned ACA workflow deploys. No migration, no job run. This is step 1 of the
sunset sequence and is fully reversible — `/home` is not repointed here, and no legacy code is
deleted.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified
- Shared runtime mutators: none in this change
- Approved image digest: produced by the main deploy workflow for the merge SHA
- ACA runtime invariant: to be confirmed against Azure after deploy — template image digest ==
  100%-traffic revision digest == the merge SHA's build
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: yes — both tenants on the gated preview route

## Rollback Plan

Revert the commit. `HomePreviewAppRoot` returns to the previous chapter layout, which is still on
disk and still imported by nothing else. No data moves.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6553
- CI run attached to that PR
- 16 static chapter renders produced by `scripts/qa/render-home-v4-proof.tsx`
- Approved design document: `Home v4 - Record and Reading.dc.html`

## Known Gaps

- **The design's Missing / Why / To close it breakdown under each gap is not rendered.** The
  contract carries a gap as a single sentence and has no structured fields for it. The band renders
  the sentence and omits the breakdown rather than restating the headline three ways. Populating
  those fields is a generation-layer change.
- **The aVa panel overlays rather than taking a grid track.** The design narrows the chapter and
  gives the panel its own column at wide widths; today it uses the existing dock behaviour, which
  matches the design's narrow-width case only.
- Chapters are marked drafted by whether the writer produced a headline. The contract still has no
  explicit per-chapter generation-state field; adding one is the more durable fix.
- The previous chapter layout is still on disk. Deleting it, repointing `/home`, and adding the CI
  guard are later steps in the sunset sequence and deliberately not bundled here.

## Post-deploy addendum — 2026-08-20

Deployed and live-proven signed-in on both tenants. Runtime invariant confirmed independently
against Azure: ACR tag `main-2b1aea64` digest, Container App template image, and the 100%-traffic
revision `m2b1aea64` all resolve to `sha256:1bac3ac9...`.

Live verification walked all eight chapters on each tenant. Band composition on the live page
matches the pre-merge static renders exactly, including the thin shapes: one chapter renders a
single band, and What Needs Attention renders no "What the record shows" band on either tenant. No
internal taxonomy or per-claim confidence vocabulary appears anywhere. Neither tenant's page
contains the other tenant's name, and the physical source label does not render.

**One defect found on the deployed page and fixed in a follow-up.** The evidence group's rail
progress read "2 of 6 drafted" above six items, all of them drafted and none marked NOT IN DRAFT --
a hardcoded numerator over a computed denominator. Progress is now derived from the items
themselves so the two cannot disagree. Both halves were individually correct; only their
disagreement on screen was wrong, which is why nothing but looking at the page would have caught
it.


## Second addendum — architecture view, and two fidelity corrections

### Architecture was missing entirely

Under "The evidence" the page offered four record tables and a per-domain fact inventory. Nothing
answered *what shape is this estate in* — the question a reader actually arrives with, and one that
301, 72, 65 and 520 rows cannot answer however well sorted. Worse, the item labelled "Current-state
data flow" rendered a fact-count inventory, not a data flow: a nav label overselling its page is
worse than a plain one, so it now reads "What has been loaded", which is what it is.

A "Current-state architecture" view is added, rendered to the approved Architecture Explorer design:

- **L0/L1 weighted landscape.** Tile footprint proportional to recorded system count, so
  concentration answers itself before a number is read. A function below the legible tile width is
  not shrunk until its label is unreadable — it moves to a tail where its share is carried by a bar
  and it is still listed by name with its own count.
- **L2 capability drill.** The fan-in rule: a capability supported by N groups declares the verb
  once in a single pill rather than printing N identical `supports` labels. Every relationship stays
  in the model.
- **Hatched fill means "group, not system"** and is never decorative.

Semantics come from the shared projections, which produce a validated `ArchitectureView`. The page
is a rendering profile over that model and decides nothing about what a node means or what is
related to what.

**Correcting an approach, not just code:** the first attempt wired the engineering SVG renderer —
the artefact the design brief itself calls "the engineering baseline, not the visual target". The
approved Architecture Explorer design already existed in the design project and had not been read.
Shipping the baseline would have shipped the thing the brief explicitly said was not a design.

### Two fidelity corrections against the approved design

1. **The header no longer collapses to one column.** A previous change made the chapter header drop
   to a single column when the synthesis ran long, on the reasoning that the design's own standfirst
   is ~220 characters and real ones run ~1,100. Measured against the design's standalone export at
   1900px, its header is two columns of 741px each, always. Collapsing it left the right half of a
   wide screen empty — the dead canvas that was reported. The design's grid is restored.
2. **The aVa panel stays collapsed by default**, matching the design's resting state. It was briefly
   opened as a side rail to reclaim that width; that was treating the symptom. The canvas does not go
   slack at full width because the header spans it — the panel was never what filled the page.

Verified against the design's standalone export: heading hierarchy, order, and the reserved colours
match exactly, including `rgb(163,45,45)` for Open exposures and `rgb(186,117,23)` for Not
established. Remaining differences are data-driven — this tenant's brief routes one exhibit and one
gap where the design's sample had two of each.


### A fabrication caught by rendering the architecture view

The first render of the tile landscape stamped the same sentence on every tile -- "57 systems
flagged to replace · 121 systems legacy, sunset-planned or deprecated" -- on Clinical Informatics,
Nursing Operations and Population Health alike.

The projection's overlays carry an estate-wide total in their `label` and list in `nodeIds` merely
which capabilities contain any. Rendering that label per tile therefore asserted something false
about every tile it touched: a capability holding 46 systems cannot have 57 flagged for
replacement. Both halves were individually correct -- the total is right, the membership list is
right -- and the combination on screen was a fabricated per-capability number on a client surface.

Per-tile marks now come from the node's own `metrics.replacementCandidates` and
`metrics.agingSystems`. Verified against the source rows: Clinical Informatics 5 of 99, Acute Care
6 of 56, Nursing 5 of 46 -- each tile now states its own figure. The overlay's estate-wide total
belongs once, at view level, not repeated as if it described each part.


### The weighted landscape was inverting its own ranking

Measured on the deployed page: Nursing Operations at 15.3% of the estate rendered a tile 914px
wide, while Acute Care Clinical Operations at 18.6% rendered 561px. The smaller function looked
larger.

Tile widths were relative to their own row, and row heights came from a clamped affine curve, so
area only tracked share *within* a row. Across rows the comparison broke: by area, Nursing measured
121k against Acute Care's 89k -- an inversion of the true ranking, on the one view whose entire
claim is that the concentration answers itself before a number is read. A weighted landscape whose
weights invert the ranking is worse than an unweighted grid: it answers confidently and wrong.

Row heights are now proportional to each row's share of everything drawn, which makes tile area
track share exactly across the whole figure (area/share = 1.00 for every tile). One documented
exception remains: a row pinned to the legibility floor may overstate a small function, and can
never understate one -- hiding real weight is the failure that matters, inflating a small tile is
not.

Two tests lock it: proportionality across freely-sized rows, and an ordering assertion that the
largest function can never render smaller than a smaller one whatever the row packing.


### The same weighting bug, one layer down

Proportional row heights fixed the first tenant but not the second. On an estate that is one
dominant function plus a long tail, the only other drawable function (5.2% of the estate) sat alone
on a trailing row, was pinned to the legibility floor, and then stretched to fill that row's full
width -- rendering at **2.05x** its proportional area.

That was inside the "may overstate a small function" exception documented with the previous fix,
which is exactly why the exception was too generous to keep. Tile width is now derived from the
tile's target *area* at its row's height, rather than from its share of the row, so a tile never
fills a row it has not earned. Measured on the deployed page after the fix: ratio 0.99 against 1.00
for the dominant tile.

Both tenants now hold across every drawn tile:

| tenant | area/share range |
| --- | --- |
| meridian-health | 0.97 – 1.07 |
| skyharbor-air | 0.99 – 1.00 |

A third test covers the lone-small-tile-on-a-trailing-row case directly, since that shape appears
in only one of the two tenants and would otherwise go unexercised.


## Third addendum — the estate views were not architecture

The two estate projections both read only the application register and roll up by
`business_function`. The landscape emits **zero edges**; the capability view emits a fan-out of
identical `supports` lines. Neither is an architecture — they answer where technology is
concentrated, not how it is wired.

The 520 rows carrying `sourceSystem -> targetSystem`, the integration platform each flow crosses,
and its recorded mechanism had never been read by anything. That is why no renderer could have
produced a topology: there was no graph going in. The problem was never the SVG layer.

`buildCurrentStateFlowView` reads those rows into a real four-lane graph — what originates data,
what carries it, where it lands — with 20 nodes and 65 edges for one tenant, 19 and 45 for the
other, both clean against the contract validator. The headline it computes is the finding the
thesis prose had already stated independently: **59% of recorded data movement starts at Epic
Clarity.**

Four decisions worth recording, each made because the first attempt got it wrong and rendering
showed it:

- **Environments are combined.** Three rows reading "— Test", "— Production" and "— Training" are
  three environments of one system. Counted separately they split a 59% concentration into three
  ~20% slices and hide it. The regrouping is declared derived and names its members.
- **Lanes are role in the flow**, not system type. A destination that happens to be an application
  still sits in a receiving lane; putting a receiver back in the originating lane inverts the
  picture, which is exactly what the first version did to one tenant's estate.
- **Only heavy connectors carry labels.** Labelling all 65 produced a band of overlapping 9px text
  between every lane — the fan-in failure this project's own brief warns about. Connectors below
  3% of flows render unlabelled, keep their mechanism and row references, and the threshold is
  stated in the view's limitations.
- **Nothing is silently truncated.** Each lane's tail collapses into one aggregate that states its
  member count: "125 other originating systems", "179 other destinations".

Three tests lock the properties that matter: the view is a graph at all (>10 edges, every endpoint
a declared node), no destination is drawn in the originating lane, and every undrawn system is
accounted for by an aggregate.

The rail item "Current-state data flow" is restored to that name, because it now describes what the
page shows.
