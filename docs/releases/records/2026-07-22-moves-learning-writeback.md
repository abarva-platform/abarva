# 2026-07-22-moves-learning-writeback — Moves Learning Writeback Candidates

## Release ID

`2026-07-22-moves-learning-writeback`

## Status

`deployed-and-azure-readback-proven`

## Plain-English Summary

Adds the first governed Moves learning loop. A completed or in-progress Move can now be dry-run or explicitly applied into the enterprise context layer as reviewable learning candidates. The writeback only uses approved evidence, signed-off/client-approved deliverables, and approved phase gate decisions. It does not turn AI drafts, unreviewed uploads, suggested context, excluded context, or gaps into enterprise truth. The release also includes a read-only verifier that independently reads Azure/Postgres after apply and fails if Move-derived candidates are missing facts/readiness rows or have been silently promoted to `agent_ready`.

## Layer Impact

- `client-data-lane`: Adds an operator script and library that can write tenant-scoped rows into `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness`.
- `global-control-lane`: Adds reusable pure planning/persistence code and tests. No UI or runtime route is changed.

## Client Applicability

- All clients: Available as an operator-controlled capability for any tenant with Moves data.
- Specific clients: None hardcoded.
- Internal only: The `--apply` path is operator-controlled; default mode is dry-run.
- Public/demo only: No.
- Feature flag: None. No automatic phase-gate trigger is added in this release.

## Changes Included

- `src/lib/programs/learning-writeback/*`: Pure planner, Azure/Postgres persistence seam, exports, and tests.
- `src/scripts/programs/writeback-move-learning-to-enterprise-context.ts`: Dry-run/apply operator script, with CLI args for local planning and `MOVES_WRITEBACK_*` env vars plus proof-bundle emission for the private ACA operator job lane. The reader resolves the Move by ID and then uses Move-scoped evidence/gate queries, so enterprise-context writeback does not depend on fragile historical client alias strings.
- `src/scripts/programs/verify-move-learning-writeback-readback.ts`: Read-only verifier for post-apply Azure readback. It confirms Move learning records, facts, and readiness sidecars exist and remain `not_reviewed` / `committed_not_indexed` / `pending` until a separate governance promotion occurs.
- `src/lib/programs/learning-writeback/persist.ts`: Converts planner-only `canonical_record_id` helper fields into live `governed_object_readiness.object_id` rows before persistence. ACA apply proof caught the schema mismatch before any active-context promotion path existed.
- `package.json`: Adds `npm run moves:enterprise-context:writeback` and `npm run moves:enterprise-context:verify-writeback`.
- `docs/releases/records/2026-07-22-moves-learning-writeback.md`: This release record.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand` passed with coverage for planning, persistence payload shape, and readback promotion-leak detection.
- Pass: `npx eslint src/lib/programs/learning-writeback src/scripts/programs/writeback-move-learning-to-enterprise-context.ts src/scripts/programs/verify-move-learning-writeback-readback.ts` passed with no reported errors.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-writeback files.
- Pass: GitHub `Typecheck + reasoning-layer tests` passed for PR #5349.
- Pass: `npm run release:check` passed after the release-record wording update.
- Pass: `git diff --check` passed.
- Pass: Private ACA operator dry-run for sandbox First Capital Move `4bf889aa-d4ee-4c1d-936b-51574614d191` found 7 approved evidence rows, 3 signed-off deliverables, 1 gate decision, and 11 eligible writeback records/facts/readiness rows.
- Pass: Private ACA operator apply for the same Move wrote 11 `enterprise_context_records`, 11 `enterprise_context_facts`, and 11 `governed_object_readiness` rows.
- Pass: Private ACA operator readback independently confirmed 11 records, 11 facts, 11 readiness rows, 0 missing facts, 0 missing readiness rows, and 0 active-promotion violations. All readiness rows remained `not_reviewed / committed_not_indexed / pending`.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, and use the operator script in dry-run mode first:

```bash
npm run moves:enterprise-context:writeback -- --client-key arcturus --move-id <move-id>
```

Only after reviewing the dry-run report should an operator run:

```bash
npm run moves:enterprise-context:writeback -- --client-key arcturus --move-id <move-id> --apply
```

For the private ACA operator job lane, pass the same values as env vars:

```bash
MOVES_WRITEBACK_CLIENT_KEY=arcturus
MOVES_WRITEBACK_MOVE_ID=<move-id>
MOVES_WRITEBACK_APPLY=true
MOVES_WRITEBACK_EMIT_PROOF_BUNDLE=true
```

After apply, run the read-only verifier:

```bash
npm run moves:enterprise-context:verify-writeback -- --client-key arcturus --move-id <move-id>
```

For the private ACA operator job lane, use the same `MOVES_WRITEBACK_CLIENT_KEY`, `MOVES_WRITEBACK_MOVE_ID`, `MOVES_WRITEBACK_OUT_DIR`, and `MOVES_WRITEBACK_EMIT_PROOF_BUNDLE=true` values.

## Deployment Authority

- Repo-owned deploy workflow: Required for code availability in ACA.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured by ACA deploy.
- ACA runtime invariant: Required before claiming deployed.
- Worker image invariant: No worker job change.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for dry-run library behavior; live Azure dry-run/apply proof is required before claiming the data loop is operational for a tenant.

## Rollback Plan

Revert the PR and redeploy. If `--apply` has been run, rollback is a tenant-scoped data correction against `enterprise_context_records`, `enterprise_context_facts`, and `governed_object_readiness` rows with `source_system='moves_learning_ledger'` and the relevant Move provenance. No automatic active-context promotion is performed by this release.

## Audit Evidence

- PR #5338 — initial Moves learning writeback planner/persistence/operator path.
- PR #5342 — Move-scoped resolver fix for historical tenant alias drift.
- PR #5345 — readiness schema alignment fix after ACA apply caught `canonical_record_id` drift.
- PR #5349 — read-only Azure readback verifier.
- Final deployed merge SHA: `8869cc555bc91cd5c8b2f5fa4fb2230686ce7b7b`.
- Final ACA revision: `ca-abarva-web-lab-eastus--m8869cc55`.
- Final ACA digest: `sha256:467604d61e1eb5c11ebda693a63f0586c43bf17b8254853fa290e0ab1cff292e`.
- Runtime invariant proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/91-moves-learning-readback-runtime`.
- Final dry-run proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/89-moves-learning-writeback-final-dry-run`.
- Final apply proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/90-moves-learning-writeback-final-apply`.
- Final readback proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/92-moves-learning-writeback-readback-aca`.
- Readback result: `records=11`, `facts=11`, `readinessRows=11`, `activePromotionViolations=0`, readiness status `not_reviewed / committed_not_indexed / pending`.

## Known Gaps

- No automatic phase-gate trigger yet; this release provides a governed operator path first.
- No Admin review UI for Move-derived candidates yet.
- No automatic Azure AI Search indexing or `agent_ready` promotion; readiness starts as `not_reviewed` / `committed_not_indexed`.
