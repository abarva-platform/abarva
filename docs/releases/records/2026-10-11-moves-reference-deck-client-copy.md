# 2026-10-11 — Reference deck client copy and exhibits

## Release ID

`2026-10-11-moves-reference-deck-client-copy`

## Status

`candidate`

## Plain-English Summary

The read-only reference deck preview now uses the use-case name on its cover,
explains the purpose of each section, and draws the current workflow from
recorded handoffs. Missing evidence appears once per empty exhibit in client
language; partial exhibits keep confirmed cells and mark open cells for
confirmation. Slide wording and the rendered-file judge block internal workflow
terms and visible edition rules. The change does not calculate figures or
write tenant data.

Missing narrative inputs replace the affected sentence with a clear confirmation
request, while the original source basis remains in the notes. Failed model calls
remain visibly marked as unavailable. PDF downloads also pass checks on their own
rendered pages and extracted text.

## Layer Impact

- Release lane: `experimental`, behind the existing tenant-scoped reference
  deck flag.
- Layer 4 (products): the Moves deck preview's wording, editable PowerPoint
  shapes, PDF layout, and fidelity checks change. The canonical data and
  read paths are unchanged.

## Client Applicability

- All clients: no change while the flag is off.
- Specific clients: only the enrolled synthetic demo workspace may preview
  these decks.
- Internal only: no.
- Public/demo only: the flagged demo preview.
- Feature flag: `moves_reference_deck_v1` (existing).

## Changes Included

- The deck specification builds covers and five numbered section answers from
  the use case and the governed read state. It uses recorded workflow handoffs
  for the current-state diagram and keeps full source wording in speaker notes.
- PowerPoint and PDF render one client-language panel for an empty exhibit;
  the PDF flow uses vector connectors. Populated figures remain editable
  PowerPoint shapes and text with their existing source bindings.
- The word-drafting rule asks for an interpretation and rejects internal
  client text or count-dump answers. The specification and rendered-file judge
  independently check visible copy, layout, figures, and edition boundaries.
- The existing preview route refuses a rendered deck with client-copy findings.
  It remains read-only and returns no persisted deliverable.
- Client-copy rules reject internal layout labels and workflow phrases while
  preserving legitimate domain wording in the use-case name. Missing figures
  cannot produce broken placeholder sentences in titles or answer bars.
- Failed wording calls display "Draft words unavailable" in the affected answer
  bars and retain their fidelity penalty.
- The PDF uses the shared deck palette, a bottom answer bar, and readable divider
  text. Its own page count, canvas, titles, answers, source lines and bound figures
  are inspected before download; a PDF finding refuses that format with score zero.
- The signed-in walk checks both editions for the configured synthetic Move
  after verifying its tenant, so a newly created demo case can be inspected.
  It retains all downloaded files in the proof bundle and fails when either
  format scores below 90 or uses fallback wording.

## QA / Validation

- Focused specification, wording, render, and preview-route suites: **pass**;
  53 tests across five suites on synthetic fixtures.
- Thirteen additional one-at-a-time mutations from artifact review: **pass**;
  each was caught by a focused test and restored.
- Typecheck and changed-file ESLint: **pass**.
- Library orphan, route reachability, and export reachability checks: **pass**;
  no new findings against their baselines.
- Test coverage census: **pass**; one new PDF inspection suite increases the
  branch-base count from 2829 to 2830. Tenancy fence census: **pass**; the existing route remains
  tenant-fenced.
- Manual regenerated and consistency check: **pass**; no flag or manual text changed.
- Release checks: **pass**; all 11 gates ran and passed.
- The signed-in walk suite lists all five tests and its changed file passes
  ESLint. The live walk itself is **pending** the final deployed image.
- Synthetic PowerPoint rendered through LibreOffice for visual review. The
  real PDF renderer produced the expected 11-page and 22-page editions with zero
  direct PDF inspection findings. Numbered contents, divider text, answer bars and
  four-stage and six-stage workflows were inspected as page images.
- Signed-in preview of the current production image: **pending**. The live
  demo data and human visual acceptance are separate release gates.

## Rollout Plan

The wording reliability dependency is merged. Land this candidate after the
operator-walk dependency, with complete CI on its current head and a fresh
fetched-ref coverage-collision scan of every open Moves PR including drafts. The repository
owned ACA main deploy workflow builds and deploys a digest-pinned image. The
existing flag limits use to the synthetic demo workspace. After the final
pre-freeze deploy, run the signed-in walk, save both deck editions as PowerPoint
and PDF files for the demo, and review their actual fidelity scores and pages.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and serving revision against
  the approved digest.
- Worker image invariant: verify required worker images against that digest.
- Feature/env flag update path: no new flag update is requested.
- Live signed-in proof required: fetch and inspect both editions from the
  flagged demo workspace after deployment.

## Rollback Plan

Turn off the existing reference deck flag for the demo workspace or revert
this change through a pull request. No data migration or stored artifact must
be reversed.

## Audit Evidence

- This release record, the pull request and its current-head CI results.
- Focused test and mutation results; local synthetic PowerPoint/PDF renders.
- The subsequent signed-in walk and saved deck files, once available.

## Known Gaps

- The local synthetic fixture lacks an approved delivery estimate and a full
  source set, so its investment score is not an acceptance score for the demo.
- PowerPoint and PDF preview requests draft words independently; the final
  saved files need a side-by-side copy check even when their figure hashes match.
- PDF text and page checks do not replace visual review for overlapping objects
  or crowded text.
- Current production behavior, populated demo figures, actual model wording,
  and human slide-by-slide acceptance remain to be verified after merge and
  deployment.
