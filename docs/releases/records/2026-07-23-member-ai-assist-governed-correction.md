# 2026-07-23-member-ai-assist-governed-correction — MEMBER AI ASSIST Governed Phase Correction

## Release ID

`2026-07-23-member-ai-assist-governed-correction`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator correction path for the disputed Strategic Move `MEMBER AI ASSIST`
(`cd51e4fe-b5c4-4024-bc46-73afaff4e4b7`). The owner decision is to return the Move from P4 to P3,
because the original P3→P4 advancement was reached through the now-fixed fabricated-evidence gate
defect. The correction is intentionally not a silent database edit: it verifies the exact Move
identity, writes immutable audit evidence, raises a critical oversight flag, preserves P4 generated
content, and marks matching P4 deliverables for revalidation.

This release adds the script and tests. The production correction is only complete after the script
runs through the sanctioned ACA operator job, emits a proof bundle, and the live Move is verified at
P3.

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
- NOT RUN YET: ACA runtime invariant for the merged image.
- NOT RUN YET: ACA operator `inspect` run on the authorized Move.
- NOT RUN YET: ACA operator `apply` run with the exact authorization token.
- NOT RUN YET: repeat `apply` idempotency proof.
- NOT RUN YET: signed-in browser proof confirming MEMBER AI ASSIST opens at P3.

## Rollout Plan

Merge via PR to `main`, deploy through the repo-owned ACA main deploy workflow, verify runtime
invariant, run operator `inspect`, then run operator `apply` only if inspect confirms the expected
live identity/current phase. Capture proof bundles for inspect, apply, and idempotency. Update the
incident/backlog records after the live correction is proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none during merge/deploy; the later ACA operator job mutates only the
  authorized Move when `apply` is explicitly requested.
- Approved image digest: captured by ACA main deploy after merge.
- ACA runtime invariant: required before operator inspect/apply.
- Worker image invariant: operator job must run the approved digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after apply, to confirm the Move is visible at P3.

## Rollback Plan

Before apply: revert the PR and redeploy the previous digest-pinned image.

After apply: do not erase audit rows. A rollback would require a new governed correction decision
returning the Move to P4, with its own `program_audit_log`, `module_state_log`, and oversight flag
resolution. P4 deliverables are preserved by this correction, so no content restoration is needed.

## Audit Evidence

- PR URL: pending.
- Incident record:
  `docs/incidents/2026-07-20-member-ai-assist-p4-phase-integrity-disputed.md`
- Owner decision record:
  `docs/backlog/decisions/2026-07-23-moves-owner-decisions.md`
- Inspect/apply/idempotency proof bundles: pending live operator execution.
- Signed-in browser proof: pending live operator execution.

## Known Gaps

- Production correction not yet executed.
- Incident and backlog closure remain pending until the live operator apply and signed-in proof are
  complete.
