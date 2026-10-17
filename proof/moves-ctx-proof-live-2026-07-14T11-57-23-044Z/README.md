# MOVES-CTX-PROOF-PR1 — Signed-In Move Context Extract Workflow Smoke

Status: deployed but workflow smoke failed with findings

Runtime: https://app.abarva.ai
Tenant: Meridian Health
Disposable Move: CTX Smoke Member Assist 2026-07-14T11-57-23-7c646661
Move ID: 44f6f4d4-ab88-4fdf-88e8-45c26f27838c
Proof captured: 2026-07-14T11:57Z

## What Passed

- Signed-in Meridian persona reached Strategic Moves.
- Disposable Move was created and promoted through P0 into P1.
- Four neutral smoke evidence uploads were accepted through the real workspace upload endpoint.
- Evidence readiness after upload was 4 of 4 required families covered and readyForP3=true.
- P1 Gate approval UI was reached through the real phase shell.
- Approve & Build was enabled and clicked in the signed-in browser.
- `/api/v1/deliverables/generate-phase` returned 202.
- Move Context Extract artifact was created:
  - artifactId: f41a57f0-6aab-43fd-8b5a-8a117ffd236c
  - sourceMode: active_home_context
  - candidateVersionId: null
- File Cabinet API showed the extract artifact as current.
- Extract download returned HTTP 200.
- Extract markdown preserved sections for:
  - Attached Evidence
  - Suggested Context - Needs Review
  - Excluded / Not Used
  - Gaps to Complete
- Candidate preview context was explicitly excluded by default.
- P1 charter deliverable was queued and completed:
  - runId: b7785254-08c2-4d3c-897d-667183a4cb78
  - artifactId: b81f6ca6-d4ce-4fe1-aa91-3e4d476a09c4
  - retrievedEvidence: 4
  - status: succeeded
- A second generate-phase request returned `contextExtract.status = skipped_existing` and reused the current artifactId.

## P0/P1 Finding

The context extract did not attach the uploaded Move evidence rows and did not create a `program_evidence_items` evidence row for the extract.

Evidence:

- Evidence readiness API after upload: 4 of 4 required families covered.
- Generation run status: `retrievedEvidence = 4`.
- Context extract response: `attachedEvidenceItems = []`.
- Context extract response: `evidenceId = null`.
- Extract markdown: `## Attached Evidence` contains `None.`

This means the phase deliverable generator can consume uploaded Move evidence, but the Move Context Extract artifact is not reflecting that same Move-scoped evidence as attached/approved evidence. It is not a candidate-leakage failure; it is an attachment/persistence contract gap between the uploaded evidence/readiness path and the context-extract path.

## Additional Finding

The healthcare upload guard quarantined the first synthetic evidence packet because it used health-plan domain terms. That behavior is defensible and useful: regulated-looking content was blocked before storage/indexing. The successful smoke used neutral operating-language evidence.

## Proof Files

- `meridian-health/api/05b-evidence-uploads.json`
- `meridian-health/api/05c-evidence-readiness-after-uploads.json`
- `meridian-health/api/06-step-navigation.json`
- `meridian-health/api/06-approve-build-button.json`
- `meridian-health/api/07-generate-phase-first.json`
- `meridian-health/api/08-run-polls.json`
- `meridian-health/api/09-artifacts-after-first.json`
- `meridian-health/api/10-context-extract-download-summary.json`
- `meridian-health/text/10-context-extract.md`
- `meridian-health/summary.json`
- `meridian-health/screenshots/06b-p1-gate-section.png`
- `meridian-health/screenshots/07-p1-after-approve-build.png`

## Validation

Pass:

- `npm run test:moves-context-extract`
- `npm run audit:moves-context-extract`
- `npm run audit:active-candidate-separation`
- `npm run audit:tenant-isolation:moves`
- `npm run audit:architecture-rules`
- `npm run audit:enterprise-naming`
- `npm run release:check`
- `git diff --check`

TypeScript:

- First run: `npx tsc --noEmit --pretty false` failed with local Node v25 heap OOM.
- Retry: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.

## Recommended Next Fix

Fix the context-extract attachment contract so the extract can attach current Move-scoped uploaded evidence that is already accepted by readiness/generation, while keeping candidate/suggested context review-only.

Expected repair target:

- Move Context Extract should include the four uploaded evidence rows as attached evidence, or explicitly explain why each generated-deliverable evidence row was excluded.
- `evidenceId` should be created when attached evidence exists.
- The File Cabinet artifact should render the attached evidence lineage instead of `None.`
- Generation should not treat suggested/candidate/gap context as approved evidence.
