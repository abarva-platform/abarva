# 2026-10-02 — The Exhibit Author Is Told the Required Keys; Non-Text Cells No Longer Fail a Build

## Release ID

`2026-10-02-exhibit-keys-and-nontext-cells`

## Status

`candidate`

## Plain-English Summary

Two faults stopped roadmap-phase deliverables from building. Neither changes a quality check.

**Required exhibits.** Each deliverable type has a list of exhibits it must carry — a roadmap needs its lanes, dependency map and decision calendar. The quality gate decides an exhibit is present by its key, which must match the list exactly. The step that writes exhibits was never given those keys. It was shown exhibit titles and chose its own keys, so a deliverable could contain every exhibit it needed and still be blocked for having none. That step is now told the keys it will be checked against. Exhibits another step already produces — the architecture diagrams, and the open-inputs table — are left out, so they are not produced twice.

**Non-text cells.** The step that assembles tables, checklists and next actions expects text. The model sometimes returns a number, an empty value or a nested value in a cell — 64 rather than "64". One such cell failed the entire build with a code error and no explanation. Those values are now read as text.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable generation:** One added instruction to the exhibit-writing step; tolerant reading of structured fields.
- **Quality gate:** Unchanged. The same exhibits are required, identified the same way.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`: `requiredExhibitsInstruction`, added to the pass that authors exhibits.
- `src/lib/deliverables/orchestrator/section-generation.ts`: `structuredText`; tables, checklists, next actions and slide points read non-text values as text.
- Tests for each.

## QA / Validation

- Targeted Jest: pass — deliverable orchestrator suites, `32 suites, 465 tests`, 4 new.
- Mutation checks: with the text coercion removed the build test fails; with the instruction removed from the pass its test fails.
- Scoped typecheck of the changed files: clean. Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Full typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observations that motivated the change: on a synthetic workflow, one roadmap-phase deliverable was blocked for missing exhibits and another failed with a code error naming a text method on a non-text value.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the roadmap-phase deliverables of the synthetic workflow and read the result: which required exhibits are present, and whether their content is drawn from the document or invented to fill a key.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The gate checks that an exhibit with the required key exists. It does not check that the exhibit's content is right. Telling the writer the keys makes it possible to satisfy the gate with a thin exhibit; the instruction forbids an empty one and forbids invented values, and that is enforced by reading the output, not by a check.
- The exhibit titles shown to the writer come from a separate list that is not reconciled with the required keys.
- A numeric cell is read as its digits without separators, and so is not examined by the numeric-lineage check.
