# 2026-06-17 Truncation Heuristic — markdown-aware (decomposed sections)

## Release ID
`2026-06-17-truncation-heuristic-markdown`

## Status
`candidate`

## Plain-English Summary
The quality gate's truncation check flagged complete sections that legitimately end on a markdown table or
list (a risk register, a next-steps list) as "truncated", because the heuristic only accepted sentence
punctuation as a clean ending. Decomposed per-section generation routinely ends a section on its table/list,
so the check false-positived and blocked an otherwise-good deliverable. The heuristic is now markdown-aware:
it judges the last non-empty LINE and treats a heading / table row / list item / emphasised-label ending as
complete, while still catching a genuine mid-sentence prose cutoff.

## Layer Impact
- **Lane:** `global-control-lane`
- **Layer:** Runtime — `looksTruncated` in `quality-validator.ts`. No other change. The truncation BLOCKER
  still fires for real mid-sentence cutoffs (regression test retained).

## Client Applicability
- **All clients:** Yes. **Feature flag:** None.

## Changes Included
- `src/lib/deliverables/orchestrator/quality-validator.ts` — `looksTruncated` now checks the last line for
  markdown structure (heading/table/list/emphasis) before falling back to the last-char prose check.
- `quality-validator-hardening.test.ts` — added a regression (long section ending on a table or list is not
  flagged); the mid-sentence-cutoff block is retained.

## QA / Validation
- **PASS** — `npx jest …/quality-validator-hardening.test.ts`: 6/6 (incl. new + retained mid-sentence block).
- **PASS** — `npx tsc --noEmit`: clean for the file.
- **Live evidence (before fix):** decomposed Charter run `fa3c125c` on SkyHarbor `7416481a` reached 13 sections,
  evidence 12, 0 unsupported-claim blockers, but blocked on `output appears truncated in section(s):
  risks_issues_dependencies, recommendation, problem_opportunity` — all of which end on a table/list.
- **Post-deploy (to attach):** re-run the Charter; expect `succeeded` + DOCX.

## Rollout Plan
Merge to `main` (squash); `az acr build`; bump worker job image + roll web revision; deactivate idle revisions.

## Rollback Plan
Re-point to the prior image tag.

## Audit Evidence
- PR + CI output above; SkyHarbor `7416481a` Charter reaching `succeeded`.

## Known Gaps
- The truncation signal remains a heuristic; the authoritative signal (the model's stop_reason) could replace it
  in a later pass. Out of scope here.
