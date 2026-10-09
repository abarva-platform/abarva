# u652 — The gate judges the workbook upload under review

## Release ID

`2026-10-09-gate-judges-current-workbook-upload`

## Status

`candidate`

## Plain-English Summary

Between phases, a Move's team downloads a readiness workbook, fills it in, and
uploads it. Each upload is stored as a set of parsed answers awaiting review. A
reviewer then accepts or rejects the answers, and that review is stored as a
separate record. The phase gate will not let the Move advance until the required
answers are accepted.

A team can upload the workbook again — to fix a cell, add a source, or change
an answer. The new upload is a new set of answers. The review on file still
belongs to the previous upload until someone reviews again.

The phase page has always handled this correctly. It reads the latest upload,
uses the stored review only if it was recorded against that exact upload, and
shows any decision carried over from an earlier upload as "restored" — a
decision not yet on record for the new upload, which the gate must not count.

The server's gate read did not ask which upload a review belonged to. It took
whatever review was on file. So after a re-upload, the gate judged the Move on
the **previous** upload's decisions. A required answer that was changed or
emptied in the new upload still counted as accepted at the gate, while the page
beside it showed it pending. Two server paths read it this way: the gate
submission and the phase build. The page held the build on the new upload, but
the gate submission and the build route both passed on the old one.

The server now reads the gate the way the page does:

- It finds the upload under review with the **same** finder the page now uses,
  so the two cannot pick different uploads.
- It honours the stored review only when that review was recorded against this
  exact upload and version, using the membership check the review route and the
  page already share.
- Otherwise — never reviewed, reviewed only on an earlier upload, or the review
  could not be read — every answer in the current upload counts as undecided,
  which is exactly what the page shows.

The page and the server also map a stored answer to the gate's terms with one
shared function now, instead of two hand-written copies.

Nothing about what a reviewer may decide, what the gate requires, or how a
recorded review of the current upload counts has changed. A re-upload whose
answers did not change is unaffected in practice: the review control already
offers to record the restored decisions against the new upload in one step, and
once recorded they count.

## Layer Impact

Release lane: `global-control-lane`. The phase gate and the phase page are
shared app behavior and are not feature-gated.

- **Layer 4 (Products — Moves):** the gate's workbook read (used by the gate
  submission and the phase build routes) honours only a review of the current
  upload; the phase page chooses that upload and maps its rows through the same
  shared functions.
- **Layer 3 (Canonical model):** unchanged. Same artifacts, same columns, no
  schema, no write.
- **Layer 2 / Layer 1:** untouched.

## Client Applicability

- All clients: yes — every client's Moves use the same gate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This corrects an existing read so it matches the rule the
  page already applies; there is no new capability to gate.

## Changes Included

- `src/lib/programs/stage-readiness-workbooks/current-proposal-set.ts` (new) —
  the finder for the upload under review, the row-to-gate mapping, and the
  undecided reading of an upload with no review on record.
- `src/lib/programs/stage-readiness-workbooks/gate-proposal-context.ts` — the
  gate read loads the current upload first and honours a stored review only when
  it belongs to that upload.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` — uses
  the shared finder and mapping in place of its inline copies. No behavior
  change on the page.
- `src/lib/programs/stage-readiness-workbooks/__tests__/accepted-context.test.ts` —
  the gate block is rewritten over a fake artifact store holding both the upload
  and the review (its earlier fixture held a review with no upload behind it,
  which cannot happen). 13 gate cases, including the re-upload, a version
  mismatch, an unreviewed upload, an unreadable review, a decision stored on an
  upload row, and a case asserting the gate reading equals the page's reading
  for a re-upload.

## QA / Validation

- **PASS** `npx jest src/lib/programs/stage-readiness-workbooks/__tests__
  src/app/api/v1/programs/[programId]/phase-gate-approval
  src/app/api/v1/deliverables/generate-phase
  src/lib/programs/__tests__/stage-readiness
  src/__tests__/integration/programs/stage-readiness` — 21 suites, 300 tests.
- **PASS** `npx jest src/components/strategic-moves/__tests__/moves-detail-route-sunset.test.ts
  src/__tests__/integration/programs/program-route-shell-enforcement.test.ts` —
  the source checks over the phase page, 13 tests.
- **PASS** Mutation testing, 13 designed mutations, 13 killed: honouring any
  stored review (4 failing) · honouring a superseded review (7) · keeping a
  disposition stored on an upload row (1) · the finder ignoring phase (1), type
  (1), or status (1) · reading a review when no upload is on file (1) · dropping
  the upload's move check (1), source-phase check (1), or target-phase check
  (1) · pinning the upload version (1) · returning an empty reading instead of
  none (1) · reading missing upload bytes as an empty workbook (1). The first
  pass left the status and source-phase checks surviving; one case was added for
  each.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on the four changed source files — exit 0.
- **PASS** `npx prettier --check` on the new module, the loader, and the test.
  The phase page carries one pre-existing formatting warning at a line this
  change does not touch; it was left as it is on `main`.
- **PASS** `audit:test-ci-coverage:write` and `audit:tenancy-fence-coverage:write`
  — no census change (`git status` clean for both); no test file was added, and
  the edited suite's directory is already run by two workflows.
- **NOT RUN** Signed-in walk. Nothing here is claimed `live-proven`. Producing a
  re-upload after review needs a reviewer action on the private data plane, and
  the Moves end-to-end walk remains Anand's step.

## Rollout Plan

Merge to `main`. It becomes active with the next repo-owned ACA main deploy; no
migration, no flag, no worker change, no separate rollout step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command and touches no
  Container App template, revision weight, env var, secret, or scale rule.
- Approved image digest: not applicable — no runtime update is requested here.
- ACA runtime invariant: unaffected; to be proven by the main deploy workflow as
  usual when this rides a deploy.
- Worker image invariant: unaffected. No worker behavior changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before `live-proven`. After a reviewed
  workbook is re-uploaded with a required answer changed, the gate submission
  must refuse until that answer is reviewed, and must pass once the reviewer
  records the restored decisions.

## Rollback Plan

Revert the PR. The change is one read path, one new pure module, two inline
copies replaced on the page, and one test block. Reverting restores the previous
read. No migration, no data written, no flag to flip back.

## Audit Evidence

- PR: the pull request for branch `moves/e2e-run112-wb`.
- CI: the required check set on that PR, including the unit and AI surface
  control catalog steps that run `src/lib/programs/stage-readiness-workbooks/__tests__`.
- Mutation log: the thirteen designed mutations and their kill counts are
  recorded under QA above.

## Known Gaps

- The next-phase context read (`accepted-context.ts`), which decides which
  accepted answers may feed the next phase's drafting, has the same gap: it reads
  the review on file without asking which upload it belongs to. It only admits a
  finished review, so its effect is narrower — a finished review of an earlier
  upload can still feed answers that the current upload changed. It is left for
  its own change so that the gate fix can be reviewed on its own.
- The phase page's gate-submit control is still offered while required evidence
  is open, whereas the build control beside it is held. With the page and the
  server now reading the same workbook, holding it can be weighed without the
  risk of the page holding a submission the server would accept.
- An upload that cannot be read is reported to the gate as no workbook, on both
  the page and the server. That is the safe reading, but neither states that the
  upload exists and was unreadable.
