# 2026-07-18-moves-deliverable4-approval-lifecycle — Moves Deliverable Approval Lifecycle

## Release ID

`2026-07-18-moves-deliverable4-approval-lifecycle`

## Status

`candidate`

## Plain-English Summary

`MOVES-DELIVERABLE-4`, built to the "full lifecycle" scope Anand chose after reviewing the risk. Prior to this release, deliverable approval was three disconnected systems that each looked like they implemented "AI Draft → Client Approved → Source of Truth" but didn't: `move_artifacts` had real file storage but no approval status; `deliverables_v2` had a real sign-off mutation but the generation pipeline's two content-selection queries ignored status entirely (ordered purely by version/recency); and every AI regeneration silently reset a signed-off deliverable's status back to `draft` with no preserved record of what was approved. Nowhere did a human's approval actually change what the next phase read.

This release: (1) adds a durable `signed_off_version` pointer to `deliverables_v2` that survives regeneration, (2) extends the real sign-off route to accept either "approve as-is" or "approve by uploading a replacement file" (linked via a new `approved_artifact_id` column into the existing `move_artifacts` vault), (3) makes the two real generation-pipeline content-selection queries prefer the signed-off version over any later unreviewed draft, and (4) adds a visible "Client Approved · vN" badge in the Documents panel, replacing the "AI Draft" badge once approved (and showing both badges when a newer unreviewed draft exists over a still-standing approval, making the previously-silent clobbering visible instead of hidden).

## Layer Impact

- `client-data-lane`: new columns on `deliverables_v2` (`signed_off_version`, `approved_artifact_id`).
- `global-control-lane`: the sign-off API route, `signOffDeliverable`, and the two generation-pipeline content-selection queries are shared logic for every tenant.

## Client Applicability

- All clients: yes — this changes shared deliverable-approval mechanics, not tenant data.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260718020000_deliverables_v2_approval_lineage.sql`: additive migration, two nullable columns + an index, no backfill.
- `src/lib/programs/mutations.ts`: `signOffDeliverable` now sets `signed_off_version` (to the version being approved) and optional `approved_artifact_id`.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`: extended to accept an optional multipart file upload, writing it via the existing `saveMoveArtifact` (reused as-is, no new upload logic) with `artifact_family: 'generated_deliverable'`.
- `src/lib/deliverables/deliverable-content-signals.ts`: content-selection query now orders by `(version = signed_off_version) DESC, version DESC` instead of purely `version DESC`.
- `src/lib/deliverables/moves-generate-deps.ts`: `loadPriorDigests` restructured with `DISTINCT ON (deliverable_type_key)` to return one row per deliverable type (preferring the signed-off version), instead of every version of every deliverable in the engagement with no dedup at all.
- `src/components/strategic-moves/DeliverableApprovalAction.tsx` (new): client component, "Approve as-is" / "Upload approved version" actions.
- `src/components/strategic-moves/PhaseDocumentsPanel.tsx`: mounts the new action; badge logic now reflects real approval state instead of always showing "AI Draft" regardless of status.
- `v2-generator.ts` needed **no code change** — Postgres partial `UPDATE`s only touch listed columns, so its existing regeneration update (`{current_version, status}`) already leaves the new `signed_off_version` column untouched once it exists. Verified with a dedicated test rather than assumed (see QA).

## QA / Validation

- Pass: `npx eslint` on all 6 touched source files + 3 test files.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — zero errors on any touched file.
- Pass: `npx jest src/lib/deliverables/__tests__/` — 82/84 (2 pre-existing snapshot failures in `golden-regression.test.ts`, confirmed identical on a clean `origin/main` stash-test, unrelated to this change).
- Pass: `deliverable-content-signals.test.ts` — updated the one test asserting the old SQL string to assert the new signed-off-preferring query shape.
- Pass: `moves-generate-deps.test.ts` — added a new test proving `loadPriorDigests` sends the `DISTINCT ON` + signed-off-preferring query and correctly maps the single deduped row through `structuredDigest`. This function had zero prior test coverage.
- Pass: `v2-generator.persist-version.test.ts` (new file) — the specific "prove the live-risk path" test called for in the plan: asserts `persistVersion`'s regeneration UPDATE payload is exactly `{current_version, status}` with **no `signed_off_version` key at all** — the concrete mechanism proving a prior approval structurally cannot be clobbered by a later regeneration.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Not run: live signed-in browser proof, and no live Postgres available locally to run an actual end-to-end sign-off → regenerate → verify-content-forward cycle against a real database (established constraint this whole session — no valid local Clerk/DB access). The three unit tests above prove the mechanism precisely instead.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. The migration must apply before the code that reads/writes the new columns goes live — standard migration-then-deploy ordering, no special sequencing needed since both columns are nullable and additive.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none beyond the standard migration apply.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, specifically — sign off a real deliverable, trigger a regeneration, confirm the "Client Approved" badge and the underlying signed-off content survive, before treating this as fully proven live.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. The migration is additive-only (two nullable columns, no data rewritten) — rollback does not require reversing the migration; leaving the unused columns in place is safe if reverted.

## Audit Evidence

- This PR's diff.
- Three new/updated test files proving the specific mechanism (see QA).
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- **No automatic text extraction from uploaded replacement files.** An uploaded PDF/DOCX becomes the client-facing source-of-truth record (downloadable via `approved_artifact_id`), but the AI generation pipeline still feeds forward the *text version* that was current at approval time, not the uploaded file's content. Extracting arbitrary uploaded file content into a generation prompt is separate, real scope, not attempted here.
- `move_artifact_review_decisions` (P2 sponsor review) remains a separate, unintegrated concept by design — see the approved plan's rationale.
- The dead P0 "Approve brief" UI (`ResolveDecisionButton.tsx`, orphaned since a July 10 route cleanup) was not resurrected or wired into this lifecycle.
- Given the real risk to the live generation pipeline this touches, this PR is **not** being auto-merged — flagging for a deliberate merge decision even though merge/deploy is broadly pre-approved for this backlog.
