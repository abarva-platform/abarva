# u653 — A phase is drafted only from answers to the upload under review

## Release ID

`2026-10-09-prompt-reads-current-workbook-upload`

## Status

`candidate`

## Plain-English Summary

Between phases, a Move's team fills in a readiness workbook and uploads it. A
reviewer accepts or rejects each answer. When the next phase's documents are
drafted, the accepted answers are handed to the drafting step as context — and
only accepted answers, so nothing a human has not approved shapes the draft.

A team can upload the workbook again after it was reviewed. The upload writes a
new set of answers; it does not touch the review. So until someone reviews the
new upload, the review on file still describes the **previous** upload.

The previous change (u652) made the phase gate notice this: it now honours a
review only when it was recorded against the exact upload under review, the way
the phase page always has. The drafting context did not get the same check. It
read whatever review was on file, so after a re-upload the next phase was drafted
from answers accepted on the previous upload — answers the team may have changed
or removed in the new one — while the page showed every answer of the new upload
as not yet reviewed. Nothing held the build in that window: the build's own
workbook hold reads the transition **out of** the current phase, while the
drafting context reads the transition **into** it.

The drafting context now asks the same question the gate asks. It finds the
upload under review with the shared finder, and uses a stored review only when
the review's record and its stored body both name that exact upload and version.
Otherwise it hands the drafting step no workbook answers at all, which is what is
true: no answer to the current upload has been accepted yet. Once the reviewer
records a review of the new upload, its accepted answers flow as before.

Nothing about which answers count as accepted, how an open review is labelled in
the drafting context, or any gate decision has changed.

## Layer Impact

Release lane: `global-control-lane`. Phase drafting is shared app behavior and is
not feature-gated.

- **Layer 4 (Products — Moves):** the accepted-answer context read by the phase
  build route and the generation dependency bundle (the queue worker and the
  single-document generate path) uses only a review of the current upload.
- **Layer 3 (Canonical model):** unchanged. Same artifacts, no schema, no write.
- **Layer 2 / Layer 1:** untouched.

## Client Applicability

- All clients: yes — every client's Moves draft phases the same way.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This applies an existing membership rule to one more
  reader; there is no new capability to gate.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/accepted-context.ts` — the shared
  review read behind both the drafting context and the finished-review policy
  now locates the upload under review in the same artifact listing and refuses a
  review whose record or body names a different upload or version. A superseded
  review is refused on its record, before its bytes are downloaded.
- `src/lib/programs/__tests__/stage-readiness-prompt-context.test.ts` — fixtures
  now hold the upload beside the review (a review with no upload behind it cannot
  happen); six cases added: a re-upload, a newer version of the same upload, a
  different upload with the same set id, membership asserted on the body, no
  upload under review (absent, wrong status, wrong phase, no set id), and two
  missing set ids not matching each other.
- `src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts`
  — the finished-review fixture holds the upload beside the review.

## QA / Validation

- **PASS** `npx jest src/lib/programs/stage-readiness-workbooks/__tests__
src/lib/programs/__tests__/stage-readiness-prompt-context.test.ts
src/lib/programs/__tests__/moves-generate-gate-record-wiring.test.ts
src/lib/deliverables/__tests__/moves-generate-deps.test.ts
src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts` — 14
  suites, 179 tests.
- **PASS** Mutation testing, 6 designed mutations, 6 killed: dropping the
  set-id guard · dropping the record membership check · dropping the body
  membership check · pinning the upload version · pinning the upload artifact
  id · reading a review with no upload under review.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on the three changed files — exit 0.
- **PASS** `npx prettier --check` on the three changed files.
- **PASS** `audit:test-ci-coverage:write` and `audit:tenancy-fence-coverage:write`
  — no census change; no test file was added.
- **NOT RUN** Signed-in walk. Nothing here is claimed `live-proven`. Producing a
  re-upload after review needs a reviewer action on the private data plane, and
  the Moves end-to-end walk remains Anand's step.

## Rollout Plan

Merge to `main` after u652 (this change uses the finder u652 introduces). It
becomes active with the next repo-owned ACA main deploy; no migration, no flag,
no worker-specific step beyond the image the main deploy already rolls out.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command and touches no
  Container App template, revision weight, env var, secret, or scale rule.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unaffected; to be proven by the main deploy workflow as
  usual when this rides a deploy.
- Worker image invariant: the queue worker reads this context through the
  generation dependency bundle, so it takes the change with the same digest the
  main deploy pins for workers. No worker configuration changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before `live-proven`. After a reviewed
  workbook is re-uploaded, a phase build must draft without the earlier upload's
  answers, and must include the new upload's accepted answers once it is
  reviewed.

## Rollback Plan

Revert the PR. The change is one read path and its tests. Reverting restores the
previous read. No migration, no data written, no flag to flip back.

## Audit Evidence

- PR: the pull request for branch `moves/e2e-run113-prompt`.
- CI: the required check set on that PR, including the AI surface control
  catalog step that sweeps `src/lib/programs/__tests__`.
- Mutation log: the six designed mutations and their kill counts are recorded
  under QA above.

## Known Gaps

- The drafting context now carries no workbook answers between a re-upload and
  its review, and says nothing about that in the prompt. A sentence stating that
  a newer upload is awaiting review would be more informative than silence; it
  is left for its own change.
- The phase page's gate-submit control is still offered while required evidence
  is open, whereas the build control beside it is held (carried from u652).
