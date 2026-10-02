# 2026-10-02 — Evidence Review Fields Accept Typed Corrections

## Release ID

`2026-10-02-evidence-review-typing`

## Status

`candidate`

## Plain-English Summary

When a file is uploaded to a Move, a person reviews what was extracted from it and corrects it before approving. The list fields on that review form — decisions, risks, baseline candidates, actions, observations, assumptions, open questions — could not be corrected by typing. Each keystroke rebuilt the field from trimmed, non-empty lines, so a space typed after a word or a new line started with Enter was removed before the next key was pressed. Finished text could be pasted in; it could not be typed.

The form now keeps the text as typed while the reviewer is editing, and turns it into a clean list once, when the reviewed version is saved. What is stored on approval is unchanged in shape: trimmed lines, blank lines dropped.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves evidence-review behavior for every client; not behind a feature flag.

- **Product layer — Moves evidence review:** Editing behavior of seven list fields on the review form. The approval request, its payload shape, and the review rules are unchanged.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves evidence review receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/CurrentStateReadinessPanel.tsx`: the review editor keeps raw field text in state and normalises on save; the normaliser is exported for reuse.
- A regression test that replays keystroke-sized changes (a trailing space, a new line) and checks the saved payload.

## QA / Validation

- Targeted Jest: pass — `4 tests` in the evidence-review suite, 1 new.
- Negative check: pass — the new test fails against the previous component (`"Queue "` came back as `"Queue"`).
- Targeted ESLint and Prettier on changed files: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, a change event carrying a trailing space or a trailing new line left the field unchanged.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, open an evidence review on a synthetic workflow, type a two-line correction into a list field, and confirm both the on-screen text and the approved result.

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
- Targeted test output and the negative check: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- This fixes how corrections are entered, not what the extraction proposes. On the same synthetic workflow the proposed extractions contained assumptions and questions that the source files do not state, and two factual slips; a reviewer still has to find and remove those.
- The summary and evidence-reference fields were already free text and are unchanged.
