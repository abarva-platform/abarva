# u602 — Evidence awaiting review stops reading as never provided

## Release ID

`2026-10-08-evidence-awaiting-review-next-action`

## Status

`candidate`

## Plain-English Summary

A Move's discovery readiness grades evidence by family (ownership, lineage,
metric definitions, and so on) and tells the reader what to do next about each
one. It grades on APPROVED evidence only, and a family's coverage is a binary
`covered | missing`. Neither of those is wrong on its own, but together they
leave the reader no way to tell two completely different situations apart:

- nothing has ever been provided for this family, and
- everything has been provided, and it is sitting in that reader's own review
  queue waiting for them to accept or reject it.

Both reported `status: "missing"`, and both presented the same authored next
action — a sentence of the form *"Upload a … from …"*. So at the exact moment a
reviewer has a queue of loaded evidence in front of them, the product asks them
to go and upload the documents that are already waiting for their decision. The
reviewer's real next action — record a decision — was never stated anywhere.

That sentence is not confined to one panel. It reaches the live assistant
prompt (the per-family need is formatted into the turn as `Next: <sentence>`),
the phase-gate approval route, the phase deliverable generator and the phase
documents panel. So the assistant itself would tell the reviewer to upload
evidence it had already been told was loaded.

This change makes the next action state the truth: when an uncovered family has
evidence awaiting review, the sentence says how many items are waiting, that
they are awaiting that reader's review, and names the surface the review queue
is actually on, while saying plainly that the slot stays uncovered until a
decision is recorded.

The deliberate non-change is the more important half. Pending evidence is not
approved evidence, so **nothing the gate layer reads moves**. `status` stays
`missing`, `priority` stays `required`, and the draft boundary, the preliminary
generation caveat and the waiver option are untouched. A family with evidence
awaiting review must never read as covered — the point is to name the correct
next action, not to relax a gate. A family that is already covered keeps its
authored wording, because approved evidence exists and nothing is blocked on
the reviewer.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) and one additive read. Layer 1 (Client Intake), Layer 2
(Source Adapters) and Layer 3 (Canonical Model) are untouched: no schema, no
migration, no adapter, no intake and no read-model change. The readiness loader
gains one additional SELECT against an existing table, grouped by an existing
column, reading an existing decision value. It writes nothing.

That read is deliberately a SEPARATE query rather than a widening of the
existing one. Folding both decision values into the approved query would let
rows awaiting review crowd out approved rows inside its row limit and so change
what counts as covered. Coverage must keep grading on approved rows alone, so
the approved query is byte-for-byte unchanged, and the new read degrades to
"nothing awaiting review" if it fails.

## Client Applicability

- All clients: no behaviour change whatsoever until a Move has evidence loaded
  and awaiting review. With none, every consumer receives byte-identical
  packets, which is asserted as a test case rather than claimed.
- Specific clients: none. No tenant is named in any line of this change; the
  new read is scoped by the same per-tenant alias set the surrounding loader
  already uses, so it cannot widen to another tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. The fix corrects a sentence on an existing surface
  and adds no new gate.

## Changes Included

- **New** `src/lib/programs/evidence-readiness/pending-review-next-action.ts` —
  the whole decision, as a dependency-free pure module: how many review rows
  name a family, the sentence presented in their place, and the resolver that
  rewrites the next action only for an UNCOVERED family with at least one row
  awaiting review. Written as a new module rather than as edits inside the
  packet builder so it can be reasoned about and mutated on its own.
- `src/lib/programs/discovery/evidence-readiness.ts` — adds the optional
  `familiesAwaitingReview` field to `DiscoveryEvidenceReadiness` and the second,
  additive query that populates it. The field is optional so a readiness object
  built before it existed, or one that crossed an API boundary without it, reads
  as "nothing awaiting review" rather than throwing.
- `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts` — one
  field now resolves through the new module instead of taking the authored
  sentence unconditionally. No other field changed.
- `src/lib/programs/discovery/__tests__/evidence-readiness-blueprint-basis.test.ts`
  — repairs the ANCHOR of an existing source-scraping guard, not its claim. It
  located its subject by searching for `return evaluateDiscoveryEvidenceReadiness({`;
  the loader now wraps that call to attach a non-grading field, so the literal
  moved and the case silently measured an empty string. It now anchors on the
  CALL rather than the statement shape around it. The assertion itself is
  unchanged and was re-proved load-bearing by mutation (see QA).
- **New** `src/lib/programs/evidence-readiness/__tests__/pending-review-next-action.test.ts`
  — 12 cases. The directory is swept by a directory step of the REQUIRED AI
  surface control catalog workflow, so these are merge-blocking with no
  workflow edit.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/evidence-readiness/__tests__/pending-review-next-action.test.ts`:
  12 of 12.
- **PASS** — `npx jest src/lib/programs/evidence-readiness/__tests__`: 8 suites,
  133 tests.
- **PASS** — `npx jest src/lib/programs src/lib/deliverables`: 496 suites,
  7089 tests, 3 snapshots. This range covers every consumer of the packet
  builder and of the readiness loader that has a suite.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on both changed library paths, exit 0.
- **PASS** — mutation testing, **9 mutations, 9 killed**, each by the intended
  case:
  1. covered-family guard removed → the covered-family case fails.
  2. threshold inverted so every family is rewritten → 3 fail, including both
     no-rows cases.
  3. resolver short-circuited to the authored sentence (the fix disabled) → 3
     fail.
  4. family-id filter dropped from the counter → 2 fail, including the
     only-the-named-family case.
  5. a row with an unusable count dropped instead of counted as one → that case
     fails.
  6. number agreement forced to plural → the agreement case fails.
  7. the "stays uncovered" clause removed from the sentence → the rewrite case
     fails, so the sentence cannot quietly start implying coverage.
  8. **the decisive one** — the builder made to treat an awaiting-review family
     as covered → 2 fail, including the invariant case. This is what proves the
     "awaiting review never reads as covered" guard is load-bearing rather than
     decorative.
  9. against the REPAIRED anchor above, the basis pass-through removed from the
     loader → that case still fails, proving the repair did not weaken it.
- **PASS** — census regenerated; `census drift: committed census matches this
  run`. Delta `testFiles` +1, `coveredTestFiles` +1, `pullRequestCoveredTestFiles`
  +1, **`uncoveredTestFiles` unchanged** — the durable claim is the delta; the
  absolutes are base-relative and shift when the base moves. Uncovered holding
  still is the proof the new suite is not dark.
- **PASS** — `npm run audit:tenancy-fence-coverage:write`, regenerated with no
  new unfenced surface.
- **NOT RUN** — any signed-in walk. Nothing here is `live-proven`. The
  behaviour this corrects is only observable once evidence is loaded for review
  on a Move, which is a data-lane step this lane does not perform.
- **NOT RUN** — integration and E2E suites requiring live credentials.

## Rollout Plan

Rides the normal `main` deploy lane: squash merge to `main`, then the repo-owned
ACA main deploy workflow builds the digest-pinned image and shifts traffic. No
flag to enable, no migration to apply, no data build to run, no ordering
constraint against any other change.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. This change requires no ad-hoc Azure command, no env or flag update, no
revision-weight change and no worker job. The runtime invariant (template image,
100%-traffic revision image and worker job images all matching the approved
digest) is proved by that workflow, not by this record. This record may be read
as `merged` and `deployed`; it may NOT be read as `live-proven`.

## Rollback Plan

Revert the squash commit. The change is three library files, one new module, one
new suite, one test-anchor repair and a regenerated census — no schema, no
migration, no backfill, no flag and no persisted state, so the revert is
complete and immediate with no cleanup step. Reverting restores the prior
sentence; it cannot strand data, because nothing here writes.

A narrower rollback is available if only the wording is at issue: the resolver
is a single pure function, so returning the authored sentence from it restores
previous behaviour everywhere at once while leaving the additive read in place.

## Audit Evidence

- The defect is measured, not inferred: a probe against the real modules showed
  every uncovered family of a declared archetype presenting an "Upload a …"
  sentence with no awareness of rows awaiting review, and the same probe after
  the change showing the corrected sentence with correct number agreement and
  zero drift across all twelve gate-bearing fields.
- The "changes nothing but the sentence" case is explicitly guarded against
  vacuity: it asserts the gate-bearing field set is identical AND that the
  sentence set is NOT, so it cannot pass by the rewrite silently doing nothing.
- The consumer reach is recorded by the module's own header comment, which names
  why the sentence matters (it is formatted into the live assistant turn) rather
  than leaving that to be rediscovered.

## Known Gaps

- **No signed-in proof.** This is corrected prose on a surface this lane cannot
  walk signed-in, and it is only observable once evidence exists in a review
  queue. Owed to Anand as part of the demo walk.
- **The surface name in the sentence is a literal.** It names the tab the review
  queue is rendered on. There is no canonical source for product surface names
  to derive it from, so a future rename of that tab would make the sentence
  stale without failing a test. Creating that canonical source is a larger
  change than this one and is not attempted here.
- **Coverage is still binary.** This change makes the NEXT ACTION aware of
  evidence awaiting review; it deliberately does not add a third coverage state
  between `covered` and `missing`. A genuine `awaiting_review` status would be
  visible to the gate layer and is a governance decision, not a wording fix —
  it is not taken here, and the binary status is left exactly as it was.
- **Only the next action is corrected.** The panels that render these packets
  could also show a count of items awaiting review as a badge; no consumer was
  changed to do so, because adding a field with no reader would be the same
  class of defect as the one this fixes.
