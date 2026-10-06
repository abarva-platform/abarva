# 2026-10-02 — Moves Wording: Gate Dialog, Approval Prompt, Discovery Gap Labels

## Release ID

`2026-10-02-moves-gate-dialog-and-gap-wording`

## Status

`candidate`

## Plain-English Summary

Three pieces of on-screen wording in Moves were wrong or exposed internal names.

- The dialog that confirms a gate approval named the phase being approved as the one that would open ("approve the P2 gate … opens P2"). It now names the next phase. When an earlier gate is being re-approved, it says the Move stays where it is.
- The rationale box shown when accepting any deliverable suggested text about the charter and the first gate, whatever the phase. The suggestion is now phase-neutral.
- Open gaps carried from discovery into the design comparison were labelled with the discovery document's internal key. They now use the document's title.

No behavior changes.

## Layer Impact

**Release lane: `global-control-lane`.** Shared Moves wording for every client; not behind a feature flag.

- **Product layer — Moves:** Display text only. No gate, approval, scoring, or data behavior changes.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients using Moves receive the wording after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: gate confirmation text names the phase that opens.
- `src/components/strategic-moves/FileCabinetPanel.tsx`: phase-neutral rationale suggestion.
- `src/lib/programs/phase-templates/p3-option-assembler.ts`: discovery gap labels use the document title.
- Tests for the dialog text and the labels.

## QA / Validation

- Targeted Jest: pass — phase page component, file panel, and option assembler suites.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Signed-in runtime verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, open a gate confirmation and the design comparison on a synthetic workflow and read the text.

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
- Targeted test output: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- Other internal terms remain on Moves screens (for example the approver's role key in confirmation dialogs, and "word-equivalent" on file rows). They are not changed here.
- A discovery gap whose label came from a table header still reads as a list of column names.
