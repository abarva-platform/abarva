# 2026-10-07-stage-readiness-review-preview-shows-restoration — The review surface shows the decisions a re-upload kept

## Release ID

`2026-10-07-stage-readiness-review-preview-shows-restoration`

## Status

`candidate`

## Plain-English Summary

A Strategic Move crosses a phase boundary when a reviewer works through the
answers returned in that transition's readiness workbook and accepts them one by
one. A required answer that comes back blank cannot be accepted, and the only
way to clear it is to complete that cell and upload the workbook again.

A previous release made that re-upload cheap: decisions recorded against an
answer whose question, response, context, and named source are all unchanged are
restored rather than discarded. But the restoration only happened when the
reviewer submitted their next decision, and the review surface knew nothing
about it. So the page a reviewer opened straight after re-uploading showed every
response awaiting a decision — the full list, with no sign that most of it was
already settled. The rational response to that screen is to judge the whole
workbook again, which is the exact work the previous release was meant to save.
A decision the product holds but never shows is, to the person doing the work, a
decision it lost.

This release gives the surface the same reading the submit path performs, run
before the reviewer acts instead of after. Opening the page after a re-upload
now shows each restored decision already standing against its row, and says how
many were kept and why: "N decisions kept from your previous upload of this
workbook — review only what changed". A row whose text was edited still arrives
undecided, because an edited answer is a new answer.

The reading is not a second implementation of the restoration rules. It asks the
existing mergers what they would carry forward for a batch that decides nothing,
so what the screen shows is what submitting would do — including the refusals. A
restored acceptance of a response this upload reports blank is withheld on the
page for the same reason, and by the same code, that the route withholds it.

## Layer Impact

Release lane: `global-control-lane` — shared application behaviour for all
clients, not client-scoped schema, seed, ingestion, or data-plane work.

- **Layer 3 (canonical model):** no change. No schema, no migration, no new
  persisted field. The preview is computed from the stored review artifact that
  already exists.
- **Layer 4 (products — Moves):** the phase workspace seeds its review list from
  one reading of the stored review instead of from a single same-set reading.
  No gate moved. The phase gate, the evidence packets, and the generation
  prompts are untouched, and the P1→P2 gate status continues to answer only for
  a review of the set under review — a superseded review has not cleared that
  transition and is explicitly not allowed to speak for it.

## Client Applicability

- All clients: yes — control-plane behaviour of the Moves readiness-workbook
  review surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The new branch only fires when a stored review belongs to
  a superseded proposal set, which is reachable only by re-uploading a workbook.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/review-preview.ts` — new leaf
  module. `previewStageReadinessStoredReview` answers "what decisions stand
  against this proposal set right now" by asking the two existing mergers what
  they would carry forward for an empty batch, and reports how many came from an
  earlier upload so the surface can say so rather than present restored work as
  fresh.
- `src/lib/programs/stage-readiness-workbooks/review-accumulation.ts` — the
  stored-review lookup now also returns the review artifact's status, its
  metadata, and the stored body's `summary`. All three are read off the same
  artifact the function already downloads, which is what keeps the phase
  workspace on one read rather than repeating the lookup for the parts it needs.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — the
  hand-rolled same-set guard and its inline disposition mapping are replaced by
  that single load plus the new reading. The stored proposal parser now carries
  `context`, which the answer identity keys on. For a restored review the
  displayed counts are recomputed from the decisions that actually stand, and
  the stored readiness split is dropped rather than restated, because it was
  measured over a different set of responses.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the review
  status line reports the kept-decision count when there is one.
- Tests: `src/lib/programs/__tests__/stage-readiness-review-preview.test.ts`
  (new, 16 cases), plus cases added to the review-accumulation suite and the
  phase workspace client suite.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__ src/lib/programs/stage-readiness-workbooks/__tests__ src/app/api/v1/programs`
  — 178 suites, 1809 tests. The first of those directories is directory-swept by
  a required status check, which is why the consequential assertions were put
  there rather than beside the module.
- **PASS** `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 233 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over the changed paths — exit 0 (two pre-existing
  unused-import warnings in the client, untouched by this change).
- **PASS** mutation testing, 11 mutations, 11 killed. The phase workspace is a
  server component with no render harness, so four of those mutations target its
  wiring and are killed by source-level assertions, in the same manner as the
  existing route-shell enforcement suite: removing the preview call; dropping
  `context` from the stored-proposal parser; reporting a hard-coded zero instead
  of the restored count; and letting a superseded review answer for the P1→P2
  gate. The rest target the reading and the status line: treating a superseded
  review as a current-set one; announcing a restoration of nothing; calling
  current-set decisions restored; ignoring the empty-review short circuit;
  dropping the kept-decisions line; always pluralising it; and showing it at a
  count of zero.
- **PASS** `node scripts/audit/moves-gate-consistency.mjs`.
- **PASS** `node scripts/audit/moves-evidence-lifecycle.mjs`.
- **PASS** census regeneration — `testFiles` 2792→2793, `coveredTestFiles`
  2628→2629, uncovered flat at 164. The new suite is CI-registered, not dark.
- **NOT RUN** live signed-in walk. Whether a reviewer sees the restored
  decisions on the real surface needs a stored proposal set for a real Move and a
  signed-in session. That is outside the code lane.

## Rollout Plan

Merge to `main` by squash. Active for all clients on the next repo-owned ACA main
deploy. No migration, no environment variable, no feature flag, and no
data-plane build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow; not pinned here.
- ACA runtime invariant: to be proven by that workflow after merge, not claimed
  by this record.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before any claim that this is live-proven.
  Not performed here, and out of scope for the code lane.

## Rollback Plan

Revert the squash commit. Nothing persists that depends on the new reading: it
only decides what an already-stored review displays, and reverting returns the
surface to seeding same-set reviews alone. No migration to unwind, and no stored
record is written differently because of this change.

## Audit Evidence

- The PR and its CI run.
- A restored decision remains identifiable in the stored review by its note,
  which names the previous upload as its origin; this change does not write it.
- The surface reports the kept-decision count it displayed, and the review API
  continues to report `carriedForwardFromPriorUpload` on submit.

## Known Gaps

- **A restored decision is shown but not yet individually labelled.** The count
  and its explanation sit in the review status line; each restored row shows its
  disposition without marking, on that row, that it came from an earlier upload.
  Per-row provenance on the surface is a separate change.
- **The displayed readiness split is omitted for a restored review** rather than
  recomputed. That split is measured server-side over the responses of the set
  it was written about, and this change does not re-measure it for the current
  set; it is restated only for a review of the set under review.
- A reviewer who corrects only a typo in the named source still re-judges that
  row, unchanged from the previous release and for the same reason: narrowing
  the identity further would accept decisions made against text that is not the
  text on file.
- **The ordering hazard this surface does not yet warn about.** The workbook
  pre-fills the source column with approved evidence references only for areas
  already covered at download time, so downloading the P2→P3 workbook before the
  evidence for that transition is approved leaves every required answer without
  a linked source. That is a sequencing property of the generator, not a defect
  in this reading, and it is not addressed here.
- Whether the transition clears end-to-end after a re-upload is not provable
  from tests; it needs a signed-in walk against a real Move.
