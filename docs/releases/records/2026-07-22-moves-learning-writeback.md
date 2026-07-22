# 2026-07-22-moves-learning-writeback — Moves Learning Writeback Candidates

## Release ID

`2026-07-22-moves-learning-writeback`

## Status

`candidate`

## Plain-English Summary

Adds the first governed Moves learning loop. A completed or in-progress Move can now be dry-run or explicitly applied into the enterprise context layer as reviewable learning candidates. The writeback only uses approved evidence, signed-off/client-approved deliverables, and approved phase gate decisions. It does not turn AI drafts, unreviewed uploads, suggested context, excluded context, or gaps into enterprise truth.

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
- `src/lib/programs/learning-writeback/persist.ts`: Converts planner-only `canonical_record_id` helper fields into live `governed_object_readiness.object_id` rows before persistence. ACA apply proof caught the schema mismatch before any active-context promotion path existed.
- `package.json`: Adds `npm run moves:enterprise-context:writeback`.
- `docs/releases/records/2026-07-22-moves-learning-writeback.md`: This release record.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/learning-writeback/__tests__/moves-learning-writeback.test.ts --runInBand` passed with 3 tests.
- Pass: `npx eslint src/lib/programs/learning-writeback src/scripts/programs/writeback-move-learning-to-enterprise-context.ts` passed with no reported errors.
- Blocked: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` is blocked by pre-existing Home graph optional dependency resolution errors for `@xyflow/react` and `@dagrejs/dagre`, outside the Moves learning-writeback files.
- Pass: `npm run release:check` passed after the release-record wording update.
- Pass: `git diff --check` passed.
- Blocked: local dry-run/apply proof is blocked on this operator machine because no `ABARVA_AZURE_DATABASE_URL` or `DATABASE_URL` is available locally. Use the private ACA operator-job lane for Azure read/write proof.

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

Pending:

- PR URL
- CI checks
- Dry-run report path
- Optional apply report path
- ACA runtime invariant proof after deploy

## Known Gaps

- No automatic phase-gate trigger yet; this release provides a governed operator path first.
- No Admin review UI for Move-derived candidates yet.
- No automatic Azure AI Search indexing or `agent_ready` promotion; readiness starts as `not_reviewed` / `committed_not_indexed`.
