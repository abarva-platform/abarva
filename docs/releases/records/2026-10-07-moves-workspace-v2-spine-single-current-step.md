# 2026-10-07-moves-workspace-v2-spine-single-current-step — One current step in the phase-workspace spine

## Release ID

`2026-10-07-moves-workspace-v2-spine-single-current-step`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace recently gained a four-stage sub-step spine — CAPTURE
steps, then GENERATE, OUTCOME and GATE — as the navigator inside a phase. Two of
those four stages are markers for a control that lives on another screen:
GENERATE lights beside the last capture step, because the governed
approve-and-build control sits in that step's footer, and GATE lights beside
OUTCOME, because the approve control travels onto the review screen. Lighting
both was intended: it shows the user that the generate/attest action is in reach.

The defect was that one field carried two meanings. The spine's `state` field
drove both the visual highlight and the `aria-current="step"` attribute, so on
the last capture step two buttons in the same navigation each announced
themselves as the current step, and on the review screen two more did. An
assistive-technology user was told there were two current steps and neither
identified where they actually were. Sighted users saw two highlighted stages
with no way to tell which one they were on.

This splits the two meanings. `state` keeps driving the highlight and is
unchanged, so the surface looks exactly as it did. A new `isCurrentView` field
names the one stage the flow is actually rendering, and only that field drives
`aria-current`. On the last capture step the current step is the capture step,
not the GENERATE bridge; on the review screen it is OUTCOME, not the GATE
marker.

Nothing about capture, saving, generation, the gate pipeline, evidence or
approvals changes. This is a correctness fix to one accessibility attribute.

## Layer Impact

Release lane: global-control-lane

- Products: the Moves phase workspace only, and only the phase-workspace v2
  shell behind its feature flag. One presentation module and the one line of its
  host component that emits the attribute. No other product surface reads either.
- Canonical model: unchanged. No object, identifier, field or relationship is
  added, read or written differently.
- Source adapters / client intake: unchanged. Nothing in this change reads tenant
  input.

## Client Applicability

- All clients: no. The surface is behind a tenant-gated flag that is off by
  default, and with it off the component renders byte-for-byte as before.
- Specific clients: the synthetic demo tenant, which is the only enrolment of
  the phase-workspace v2 flag.
- Internal only: no.
- Public/demo only: effectively yes — the only enrolled tenant is synthetic.
- Feature flag: `moves_workspace_v2` (conjoined server-side with
  `moves_capture_v2`). Unchanged by this release; no enrolment is added or
  removed.

## Changes Included

- `src/lib/programs/moves-workspace-v2-spine.ts` — adds the `isCurrentView`
  field to `MovesV2SpineStage`, sets it for the rendered capture step at a
  non-recap view and for OUTCOME at the recap, and documents that `state` is the
  emphasis channel while `isCurrentView` is the single navigational stage.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — the spine's
  `aria-current` now reads `isCurrentView` instead of `state === "current"`.
  One line, plus the comment stating why.
- `src/lib/programs/__tests__/moves-workspace-v2-spine.test.ts` — five cases:
  exactly one current view at every view and both findings settings; which stage
  it is; that GENERATE and GATE never claim it even while carrying the emphasis;
  that the emphasis channel is unchanged (two highlighted stages at the last
  capture step and at the recap); and that a short or empty capture set never
  yields more than one.
- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — one
  case walking the flow to the last capture step and asserting two highlighted
  stages but exactly one `aria-current="step"`, on the capture stage.

No migration, route, script, dataset, manifest or flag definition changed.

## QA / Validation

- `npx jest src/lib/programs/__tests__/moves-workspace-v2-spine.test.ts src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`
  — **PASS**, 2 suites / 53 tests (47 before this change).
- `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__`
  — **PASS**, 192 suites / 2,298 tests. Whole directories, because the host
  component is shared; no existing case needed updating.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — **PASS**, exit 0.
- `npx eslint` on all four changed files — **PASS**, exit 0.
- Mutation testing of the new assertions — **PASS**, 6 of 6 killed: reverting the
  host's `aria-current` to the emphasis field; making every capture stage the
  current view; making OUTCOME never the current view; letting GENERATE claim it;
  letting GATE claim it; and silently re-styling the emphasis channel so GENERATE
  stops lighting. The last one is deliberate — it guards the look this fix
  promises not to change.
- Pinning measurement (the honest middle one) — with the source fix applied and
  the new cases withheld, both suites read 47/47, identical to the unchanged
  branch point. **No pre-existing case asserted either the broken or the correct
  behaviour**, which is how a doubled attribute shipped. Recorded so the next
  reader knows the behaviour was unpinned on both sides, not merely untested.
- Test-file census — **unchanged by design**: both cases were appended to suites
  already registered and swept by CI, so no new file is introduced and the
  covered/uncovered counts are flat.
- Live signed-in walk — **NOT RUN**. Requires an authorized signed-in session and
  is outside this lane. The attribute change is asserted at the DOM level in the
  component suite above.

## Rollout Plan

Merge to `main` by squash. No runtime rollout step of its own: the change is
inside an already-deployed, already-enrolled flag-gated component, so it becomes
active for the enrolled synthetic tenant with the next ordinary image build and
deploy through the repo-owned Azure Container Apps main deploy workflow. No
migration, no flag change, no environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. No other
  path is used or needed.
- Shared runtime mutators: none. This release runs no Azure command, shifts no
  traffic, and does not touch any Container App template.
- Approved image digest: not applicable — no deploy is performed by this release.
  The next main deploy builds and pins its own digest.
- ACA runtime invariant: not asserted here, because this release performs no
  deploy. Whoever next deploys `main` proves it as usual.
- Worker image invariant: not applicable; no worker job changes.
- Feature/env flag update path: not applicable; no flag definition or enrolment
  changes.
- Live signed-in proof required: yes, for the visible surface, and it is NOT
  claimed by this record. This may not be called live-proven until an authorized
  signed-in walk of the phase workspace is captured.

## Rollback Plan

Revert the squash commit. The change is four files with no migration, no
persisted state, no contract shared outside the module and its one host, so the
revert is complete and immediate. Reverting restores the doubled attribute — the
defect, not a broken state — so there is no ordering or data constraint.
Alternatively, turning `moves_workspace_v2` off for the enrolled tenant removes
the spine from the surface entirely, since the legacy step bar renders instead.

## Audit Evidence

- The PR for this record, its squash commit on `main`, and its CI run.
- The QA commands and counts above are reproducible on the merge commit.
- The mutation and pinning measurements are stated in full in QA / Validation so
  an auditor can re-run them without re-deriving the mutation set.

## Known Gaps

- The live signed-in walk is not performed or claimed here; see Deployment
  Authority.
- The spine's OUTCOME and GATE stages still cannot reach the `done` or `current`
  highlight on a phase that is not an intelligence phase, because the review
  screen they describe is unreachable in the configuration the product serves
  (the review-before-submit control is off while a governed approve slot is
  present, so the only two entries into that view are both closed). That is a
  separate, already-recorded reachability question about the review screen, not
  an accessibility one, and this release deliberately does not change which
  screens are reachable. The attribute fix is correct either way: the stages that
  can light are the ones now named.
- Whether a marker stage should carry the highlight at all is a design question
  for the shell's owner. This release preserves the current look and pins it, so
  a deliberate change stays deliberate.
