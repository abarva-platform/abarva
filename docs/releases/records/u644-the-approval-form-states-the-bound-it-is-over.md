# u644 — The approval form states the bound it is over

## Release ID

`2026-10-09-u644-reviewed-extraction-form-bounds`

## Status

`candidate`

## Plain-English Summary

Promoting an uploaded or loaded evidence item from "awaiting review" to
"approved" is a human act, and it is the single step that turns a parsed
document into evidence a phase gate will count. The reviewer does it from a
form in the Files & Evidence cabinet: a summary box, seven lists of extracted
facts, a references box, a rationale box, and two buttons — Reject, and
"Approve reviewed version".

The server will not store a reviewed version whose contents are over its two
size bounds: **at most fifty items in any one of the seven list fields**, and
**at most thirty evidence references**. Over either one, the approval is
refused before anything is written, with a single reason — the reviewed
extraction is required — whose sentence tells the reviewer to review the parsed
facts above and then approve the reviewed version.

Nothing on the form states either number. So the one sentence the refusal can
produce describes a form the reviewer has not filled in, and prescribes the
action they have just taken. Pressing Approve again sends the same contents and
is refused the same way. The only escape is to delete lines from one of seven
fields, and nothing says which field, or how many, or that length is the
problem at all.

**A stored row can put a reviewer in that state with no action of their own.**
The function that fills the form from a recorded evidence row bounds the
references at the server's number and bounds none of the seven lists. An
evidence row holding fifty-one or more extracted items in a single list — which
a long governance or controls document readily produces — opens a form that the
server already refuses, under a black, full-opacity, pointer-cursor Approve
button that does nothing when pressed.

The button's own styling made that worse. It was already withheld on an empty
summary, but only its `disabled` attribute read that condition: the opacity and
the cursor read a shorter one. So an empty summary produced a button that looks
live, is inert, and explains nothing.

This change states the bounds where the reviewer is working:

- the two bounds the server refuses on are now **exported from the module that
  refuses on them** and read from there by both sides, so the form cannot be
  held to a different number than the approval;
- the form evaluates its contents against those numbers — on the values it
  would actually send, not on the raw text boxes, so its count is the count the
  server counts — and when it is over, it says which field, how many items are
  in it, what the limit is, and how many to remove;
- the empty-summary case joins the same reckoning and gets the same treatment;
- one verdict now drives the button's `disabled` attribute **and** its opacity
  and cursor, so a withheld control always looks withheld;
- **Reject stays available throughout.** A rejection sends no reviewed
  extraction, so it is not subject to either bound, and a reviewer who decides
  the extraction is wrong must not be blocked by its length.

**No list is shortened on the reviewer's behalf.** Which lines go is a review
judgement, and silently dropping facts a source document records is the one
outcome worse than refusing the approval. The form names the overage and leaves
the edit to the person signing it.

The seven list fields are also no longer re-listed inside the form. They are
derived from the approval contract's own type, so a list field the contract
gains cannot go unrendered and unchecked — the seven-entry literal it replaces
was a roster nothing required to be complete.

## Layer Impact

- **Layer 4 (Products)** — Moves. The evidence review form's approve control
  and a new visible reason block. No route changed, no request shape changed,
  no stored value changed. A form within the bounds behaves exactly as before.
- **Layer 3 (Canonical model)** — no schema, migration, or stored-value change.
  The two numeric bounds are the same numbers as before; they are now named
  constants instead of inline literals, and the extraction normaliser's accept
  and refuse sets are byte-for-byte identical.

Lane: `global-control-lane`.

## Client Applicability

- All clients: yes — the review form is shared and not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change replaces a dead-end control with a stated
  reason; gating it would leave the dead end live for anyone not enrolled.

## Changes Included

- `src/lib/programs/evidence-review-contract.ts` — the two refusal bounds are
  exported as `REVIEWED_EXTRACTION_REFUSAL_LIMITS` and the normaliser and the
  form-filling producer read them instead of inline literals. The header records
  why only these two are refusals: every character bound in the module
  truncates rather than rejects, so a form must not block on one.
- `src/lib/programs/reviewed-extraction-form-bounds.ts` — new.
  `evaluateReviewedExtractionForm` returns either an approvable verdict or a
  non-empty list of named blockers, as two mutually exclusive shapes so a true
  flag cannot sit beside a populated blocker list. The list-field roster is a
  `Record` over the contract's own field type, which the compiler requires to
  be total.
- `src/components/strategic-moves/CurrentStateReadinessPanel.tsx` — the review
  editor computes that verdict, renders the blocker sentences as a labelled
  list above the decision row, and drives the approve button's attribute and
  its styling from the one reckoning. Its local field union and its seven-entry
  label literal are replaced by the derived roster.
- `src/lib/programs/__tests__/reviewed-extraction-form-bounds.test.ts` — new.
- `src/components/strategic-moves/__tests__/FileCabinetPanel.evidence-review.test.tsx`
  — six host cases on the already-wired cabinet suite.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one
  new test file.
- `docs/releases/records/u644-the-approval-form-states-the-bound-it-is-over.md`
  — this record.

No migration, no route signature change, no new dependency.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__`: 201 suites, 2842 tests
  green.
- **PASS** — `npx jest src/components/strategic-moves/__tests__`: 53 suites,
  856 tests green.
- **PASS** — the two directly affected suites: 50 cases green.
- **PASS** — mutation testing, **14 of 14 defect mutants killed**:
  1. the approve attribute reverted to its pre-change condition, so an
     over-bound form is offered again (the defect this release removes) —
     killed, 3 cases;
  2. the styling reads the shorter condition again, so a withheld button looks
     live — killed, 2 cases;
  3. the form's list bound drifts one above the contract's — killed, 14 cases;
  4. the form's reference bound drifts one above the contract's — killed;
  5. the blocker list is no longer rendered — killed, 2 cases;
  6. the approvable verdict is returned regardless of the blockers — killed,
     19 cases;
  7. the empty-summary blocker is dropped — killed, 4 cases;
  8. the overage sentence loses its singular form — killed;
  9. the verdict is computed from the stored lists instead of the reviewer's
     edits, so correcting an overage does not clear the block — killed;
  10. the overage sentence states no count — killed, 3 cases;
  11. the list-field roster loses a member — killed **by the compiler**
      (`TS2741`, the property is required by the derived `Record`);
  12. the normaliser's list check diverges from the exported bound — killed,
      8 cases;
  13. the normaliser's reference check diverges from the exported bound —
      killed;
  14. the form-filling producer's reference cap diverges from the exported
      bound — killed.
- **DELIBERATE NO-OP, NOT A SURVIVOR** — lowering the exported bound itself
  leaves all 50 cases green. That is the point of exporting it: both sides move
  together, and the cross-check asserts they agree at the bound and one over
  it, not that the bound holds a particular value.
- **PASS** — `tsc -p tsconfig.json --noEmit` with an 8192 MB heap, exit 0.
  Note the first draft of the new test shipped real `TS18048`/`TS2339` errors —
  an `expect(...).toBe(false)` does not narrow the verdict union — and they are
  fixed by narrowing on the discriminant.
- **PASS** — `npx eslint` on all five changed source files, exit 0.
- **PASS** — Prettier measured per file in place against the base revision.
  `CurrentStateReadinessPanel.tsx` was already unformatted at base at two call
  sites (an `onDecision` argument list and a `decide` argument list) and is left
  exactly as it was there; verified by line number that neither sits in a hunk
  from this change. The other four files are clean.
- **NOT RUN** — live signed-in walk. Producing the over-bound direction needs a
  recorded evidence row holding more than the bound in one list, which is a
  data-plane state this lane may not create. It is covered by the
  mutation-verified suites instead.

The new library suite is in `src/lib/programs/__tests__`, swept wholesale by the
required surface control catalog, and the host cases are on a suite that catalog
already names by path — so no workflow change is needed and neither is dark.
Census moved `+1/+1` on the one new test file with the directory bands
unchanged.

## Rollout Plan

Merge to `main` by squash. The change is a component and two library modules
with no migration and no flag, so it becomes active with the next image built
and deployed by the repo-owned ACA main deploy workflow. No separate rollout
step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; this
  release pins none.
- ACA runtime invariant: unchanged; no `az containerapp update` is part of this
  release.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: yes, for the healthy direction — see Known
  Gaps.

## Rollback Plan

Revert the squash commit. The change is confined to six files, adds no
migration and no stored value, and writes nothing, so a revert restores the
prior behaviour exactly — including, deliberately, the live-looking approve
button on a form the server refuses. There is no data to migrate back and no
partially applied state to reconcile.

## Audit Evidence

- The PR for this release and its CI run.
- The mutation results listed under QA, reproducible by applying each listed
  mutation to the named file and running the two affected suites.
- The base-versus-change Prettier measurement described under QA.
- The census regeneration diff, `+1/+1` with the directory bands unchanged.

## Known Gaps

- **No live signed-in proof.** A reviewer approving a within-bounds item, and a
  reviewer meeting the new reason block on an over-bound one, are asserted in
  tests and have not been walked by a signed-in user. That walk is owed
  together with the walks already outstanding for the preceding releases in
  this series.
- **The bounds themselves are not revisited.** Fifty items per list and thirty
  references are the numbers the stored contract has always refused on, and
  raising either is a storage-and-contract decision, not a wording one. This
  release makes them visible and actionable; whether fifty is the right number
  for a long source document is a separate call.
- **The form-filling producer still bounds the references and not the lists.**
  That asymmetry is what makes the over-bound form reachable without any
  reviewer action, and it is left in place on purpose: capping the lists there
  would silently discard extracted facts the row records, which is worse than
  naming the overage. The alternative — storing the full list and bounding only
  what is sent — is a contract change.
- **The second mount of this editor is not separately proven.** The editor is
  mounted from the cabinet, which is live for the demo tenant, and also from the
  current-state readiness panel. The host cases exercise the cabinet mount; the
  readiness-panel mount renders the same component with the same props and is
  not asserted here.
