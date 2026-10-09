# 2026-10-09 — P3 Step 1: map every root cause to a design element

## Release ID

`2026-10-09-moves-p3-design-traceability-step`

## Status

`candidate`

## Plain-English Summary

The third step page on the finalized template: P3 Design, Step 1, "Map every
root cause to a design element". It sits behind `moves_step_pages_v3` and is
on only for the synthetic demo tenant.

The rows are P2's settled root causes, in the order the consultant set in P2
Step 3. Each cause needs one design element that fixes it, or a hand-off to
another program with a named owner (an attestation the gate can check).
Because every design element answers a cause, none can be orphaned. The step
is blocked, with a link back to P2, until P2 has settled at least one cause.
The consultant can fill the step from pasted notes. The fill is deterministic
and verbatim: it drafts an element or a hand-off owner only for causes that
have nothing yet, and it accepts nothing.

The traceability is a **step record**, not a capture question. The phase
workflow registry declares it. It is saved through the existing capture route
with the same revision fence, and rendered for generation, the gate and cited
evidence through one text dispatcher. The capture flow never asks it, so its
question counts, resume step and build control are unchanged for every
tenant. This closes the registry's documented P3.1 capture gap.

This change also applies Claude Design's second review of the real components
(template v1.6):
- The next-action sentence names causes by an authored short name with their
  id, and files by a plain label.
- A cause whose uploaded evidence is in review points to that review instead
  of asking for evidence again.
- The evidence row leads with what was extracted.
- The gate's "Design approved" check shows what actually signs it off for the
  Move's change profile.
- The upload control sits at the right end of the Context line, and Details
  is dropped where it would only repeat the line.
- "Try again" sits in the Blocked sentence.
- The step bar's "open" state is visible.
- The approver is named by role consistently.
- Gate documents show their purpose.

## Layer Impact

- Release lane: `global-control-lane`, feature-flagged.
- Capture route: it saves and reads a phase's step records (P3:
  `design_traceability`) beside the answers. A record joins the snapshot only
  when saved, so a Move without one keeps the revision it had. Records are
  never evaluated as capture questions.
- Readers: the gate's capture text, the build's decision context, the carried
  capture and cited evidence all read structured answers through
  `structured-capture-text.ts`. Free text is returned unchanged.
- Canonical model: no schema change. The record is a module row like any
  answer.

## Client Applicability

- All clients: no visible change while the flag is off. The capture route
  accepts the new record key.
- Specific clients: the synthetic demo tenant (flag on).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_v3`. It requires `moves_capture_v2`.

## Changes Included

- `src/lib/programs/design-traceability.ts` (new): the record, rows from P2,
  operations, completeness, ranked text and team-words gate text.
- `src/lib/programs/design-traceability-notes.ts` (new): fill-from-notes
  proposals.
- `src/lib/programs/structured-capture-text.ts` (new): one text dispatcher for
  structured answers.
- `phase-workflow-registry.ts`: step records (`recordKeys`,
  `PHASE_STEP_RECORD_SECTIONS`). P3.1 owns `design_traceability`.
- The capture route, the phase page and the host: save and load step records,
  P2's values passed to P3, the flagged mount and the entry link.
- `step-page/DesignTraceabilityStep.tsx` (new), and the review-2 changes to
  the shared step page, Gate readiness and P2 Step 3.

## QA / Validation

- New suites pass: traceability record (9), notes proposer (3), page render
  (5), capture-route step records (3), registry step records (2), host mount
  (3).
- Mutation checks pass: 7 mutations, each failing a test. They cover the
  record left out of the snapshot, the stored values or the write; a hand-off
  without an owner; unsettled P2 causes shown; a draft overwriting a settled
  element; and the fill proposing for answered causes.
- Combined run: pass, 68 suites and 1,263 tests, including the AI surface
  catalog's Moves step list.
- `npm run typecheck`: pass. ESLint: pass.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on for the
synthetic demo tenant only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: on the demo Move, open P3 at
  `?step=root-cause-design`. Design one cause and hand one off. Then confirm
  that the P3 build's decision context lists the traceability in rank order.

## Rollback Plan

Remove the demo tenant from the flag, or revert through a pull request. A
saved record stays a valid module row. Without the reader it is ignored by
capture and, as free text, by generation.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.

## Known Gaps

- The evidence review editor still opens in its older styling. Restyling it
  to the canon is next (design review 2).
- The approver's real name is not yet resolved. Role wording is used.
- Signed lines do not yet show who signed and when, because the
  artifact read does not carry them.
