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
