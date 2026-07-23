# 2026-07-23-member-ai-assist-governed-correction — MEMBER AI ASSIST Governed Phase Correction

## Release ID

`2026-07-23-member-ai-assist-governed-correction`

## Status

`live-correction-proven`

## Plain-English Summary

Adds a governed operator correction path for the disputed Strategic Move `MEMBER AI ASSIST`
(`cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`). The owner decision is to return the Move from P4 to P3,
because the original P3→P4 advancement was reached through the now-fixed fabricated-evidence gate
defect. The correction is intentionally not a silent database edit: it verifies the exact Move
identity, writes immutable audit evidence, raises a critical oversight flag, preserves P4 generated
content, and marks matching P4 deliverables for revalidation.

The production correction has now been executed through the sanctioned ACA operator job and
live-verified in a signed-in browser. The Move is back on P3 (`Choose the Approach`); P4 generated
content was not deleted and remains historical/revalidation material.

## Layer Impact

- `internal-admin`: adds a one-purpose operator script for the approved MEMBER AI ASSIST correction.
- `client-data-lane`: when run in `apply` mode, mutates exactly one authorized Move row and related
  audit/oversight rows for that Move. No tenant-wide data build and no candidate/data-layer behavior
  change.

## Client Applicability

- All clients: no user-facing runtime change.
- Specific clients: Meridian Health / `MEMBER AI ASSIST` only, and only when the operator job is run
  with the exact authorization token.
- Internal only: operator proof flow and remediation script.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/programs/correct-member-ai-assist-phase.ts`
  - `inspect` mode reads the live Move and writes a proof plan without mutation.
  - `apply` mode requires `MOVES_MEMBER_AI_ASSIST_CORRECTION_AUTHORIZATION=return-to-p3-approved-2026-07-23`.
  - Refuses any Move id other than `cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`.
  - Refuses identity mismatch on name `MEMBER AI ASSIST` and live database graph node
    `eng_member_ai_assist_mrp7yhe4`.
  - Note: older incident/backlog text used the display/historical identifier
    `HEALTHCARE_PROVIDER-MEMBER-2026`; the ACA inspect run proved the current
    `engagements.graph_node_id` is `eng_member_ai_assist_mrp7yhe4`, so this script binds to the
    live database identity plus exact Move UUID/name.
  - If live state is already P3, reports `already_at_target` and does not mutate.
  - If live state is P4, updates `engagements.current_phase` to P3, removes P4 gate entries from
    `gates_passed`, writes `program_audit_log`, writes `module_state_log`, raises a critical
    `maestro_oversight_flags` row, and marks P4 deliverables for revalidation.
- `scripts/programs/__tests__/correct-member-ai-assist-phase.test.ts`
- `package.json` npm scripts:
  - `moves:member-ai-assist-correction`
  - `moves:member-ai-assist-correction:inspect`
  - `moves:member-ai-assist-correction:apply`

## QA / Validation

- PASS: `npm run moves:member-ai-assist-correction -- --self-test`
- PASS: `npx jest scripts/programs/__tests__/correct-member-ai-assist-phase.test.ts --runInBand`
  (the repo emitted pre-existing duplicate manual mock warnings; the focused suite passed).
- PASS: `npx eslint scripts/programs/correct-member-ai-assist-phase.ts scripts/programs/__tests__/correct-member-ai-assist-phase.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- PASS: `npm run release:check`
- PASS: `git diff --check`
- PASS: ACA runtime invariant for PR #5497: revision
  `ca-abarva-web-lab-eastus--mae18fa02`, image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:74fcdaaa5ad393f545ea20b6be5192a51074611bc664ec5149e6fd8948ac52cc`,
  100% traffic, healthy/running.
- PASS: first ACA operator inspect failed safely before mutation because the original script bound
  to the historical/display graph id `HEALTHCARE_PROVIDER-MEMBER-2026` while the live
  `engagements.graph_node_id` was `eng_member_ai_assist_mrp7yhe4`. PR #5497 corrected the binding
  to the live database identity and added a regression test rejecting the stale id.
- PASS: corrected ACA operator `inspect` on approved image, execution
  `job-abarva-private-operator-eus-ypw1nom`, proof bundle
  `/tmp/member-ai-assist-correction-inspect-20260723T175600Z/proof/local-20260723T175619655Z`,
  `status=PASS`, `beforePhase=4`, `afterPhase=4`, `planStatus=would_correct`,
  `mutationApplied=false`.
- PASS: ACA operator `apply` with the exact authorization token, execution
  `job-abarva-private-operator-eus-wpfqoxb`, proof bundle
  `/tmp/member-ai-assist-correction-apply-20260723T175900Z/proof/local-20260723T175814594Z`,
  `status=PASS`, `beforePhase=4`, `afterPhase=3`, `planStatus=would_correct`,
  `mutationApplied=true`.
- PASS: repeat `apply` idempotency proof, execution `job-abarva-private-operator-eus-qufjijy`,
  proof bundle
  `/tmp/member-ai-assist-correction-idempotency-20260723T180100Z/proof/local-20260723T180002348Z`,
  `status=PASS`, `beforePhase=3`, `afterPhase=3`, `planStatus=already_at_target`,
  `mutationApplied=false`.
- PASS: signed-in browser proof with the Meridian automation agent storage state:
  `https://app.abarva.ai/strategic-moves/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/phase/3`
  returned HTTP 200, did not redirect to sign-in, and rendered `MEMBER AI ASSIST` at P3
  `Choose the Approach` with P0/P1/P2 complete and P4/P5 downstream. Proof:
  `/tmp/member-ai-assist-correction-browser-proof-2026-07-23T18-04-01-668Z/result.json` and
  `/tmp/member-ai-assist-correction-browser-proof-2026-07-23T18-04-01-668Z/member-ai-assist-phase3.png`.

## Rollout Plan

Completed via PR #5496 and PR #5497, deployed through the repo-owned ACA main deploy workflow.
Runtime invariant was verified before operator execution. The correction followed inspect → apply
→ idempotency → signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none during merge/deploy; the later ACA operator job mutates only the
  authorized Move when `apply` is explicitly requested.
- Approved image digest:
  `sha256:74fcdaaa5ad393f545ea20b6be5192a51074611bc664ec5149e6fd8948ac52cc`.
- ACA runtime invariant: verified before operator inspect/apply.
- Worker image invariant: operator job ran the approved digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: complete.

## Rollback Plan

Before apply: revert the PR and redeploy the previous digest-pinned image.

After apply: do not erase audit rows. A rollback would require a new governed correction decision
returning the Move to P4, with its own `program_audit_log`, `module_state_log`, and oversight flag
resolution. P4 deliverables are preserved by this correction, so no content restoration is needed.

## Audit Evidence

- PR URLs:
  - https://github.com/abarva-platform/abarva/pull/5496
  - https://github.com/abarva-platform/abarva/pull/5497
- Merge SHAs:
  - `3eb7119efe38af38dab3cd7a47a89677cc7dbae7`
  - `ae18fa0289aeaa811bf92f1464a3a45ca1131f4e`
- Incident record:
  `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`
- Owner decision record:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`
- Initial safe-fail inspect log:
  `/tmp/member-ai-assist-correction-inspect-20260723T173300Z/04-logs.txt`
- Corrected inspect proof bundle:
  `/tmp/member-ai-assist-correction-inspect-20260723T175600Z/proof/local-20260723T175619655Z`
- Apply proof bundle:
  `/tmp/member-ai-assist-correction-apply-20260723T175900Z/proof/local-20260723T175814594Z`
- Idempotency proof bundle:
  `/tmp/member-ai-assist-correction-idempotency-20260723T180100Z/proof/local-20260723T180002348Z`
- Signed-in browser proof:
  `/tmp/member-ai-assist-correction-browser-proof-2026-07-23T18-04-01-668Z`

## Known Gaps

- The operator wrapper reported a nonzero exit after these runs because an unrelated Home V4 review
  execution (`job-abarva-private-operator-eus-lpfrkx5`) remained non-terminal in Azure even after
  emitting its own proof end marker. The correction executions above independently show `Succeeded`
  and their proof bundles are complete. This is an operator-lane hygiene gap, not a failed MEMBER AI
  ASSIST correction.
- The live UI still displays the historical/display identifier `HEALTHCARE_PROVIDER-MEMBER-2026`
  in the Move header, while the governed correction identity is the live database graph node
  `eng_member_ai_assist_mrp7yhe4`. The mismatch is now documented and should be cleaned up as a
  separate label/data-binding issue.
