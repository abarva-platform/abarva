# Packet 30 Phase 2C.2h — Program Phase-Gate Route Parity Artifact

## Scope

Area group: legacy program phase-gate route read seam.

Converted files:

- `src/app/api/programs/phase-gate/route.ts`
- Focused route coverage in
  `src/app/api/programs/phase-gate/__tests__/route.test.ts`

## Parity Pattern

This slice removes the direct Supabase engagement lookup from the phase-gate
POST route. The route remains mutation-adjacent: phase advancement still runs
through `selectProgramsWriteAdapter().advanceEngagementPhase()`, durable audit
still runs through `writeProgramAuditLog()`, and the local filesystem cache
behavior is unchanged.

Before:

```ts
const sb = getServerSupabase();
const { data: engRow, error: fetchErr } = await sb
  .from('engagements')
  .select('id, current_phase, gates_passed')
  .eq('graph_node_id', graphNodeId)
  .maybeSingle();
```

After:

```ts
const engRow = await azureRead.maybeSingle({
  table: 'engagements',
  columns: ['id', 'current_phase', 'gates_passed'],
  where: { graph_node_id: graphNodeId },
});
```

## Behavior Preserved

- Clerk session auth still gates the route.
- Program-code tenant ownership check still gates cross-tenant attempts.
- `requireTenancy()` and `loadUserProgramAccessPolicy()` still enforce
  phase-gate approval permissions.
- Strict-mode approval-role behavior is unchanged.
- Phase 1 to Phase 2 sponsor, stakeholder-success, tension, and data-readiness
  preconditions are unchanged.
- Phase advancement still uses the existing write adapter.
- Durable audit-log write still gates reported success.
- Filesystem ledger write remains best-effort and non-authoritative.
- No database schema, migration, seed, storage, or egress behavior changes.

## Census Delta

Start of this slice, after Phase 2C.2g:

- Runtime Supabase census: `151 files / 617 import-helper matches`
- Broad census: `303 files / 1440 broad matches`
- Current codemod inventory: `90 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `150 files / 614 import-helper matches`
- Broad census: `303 files / 1436 broad matches`
- Current codemod inventory: `89 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-3` import-helper matches
- `0` broad-match file delta
- `-4` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `150 files / 614 import-helper matches`
- Total Phase 2C reduction so far: `-26 files / -111 import-helper matches`

## Validation

Local validation:

```text
npx jest --runTestsByPath src/app/api/programs/phase-gate/__tests__/route.test.ts --runInBand
```

Result: pass, 1 suite / 1 test.

```text
npx eslint src/app/api/programs/phase-gate/route.ts src/app/api/programs/phase-gate/__tests__/route.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
```

Result: pass/warn as expected for the still-open Phase 2C backlog. The target
phase-gate route was removed from `READ_ONLY_SELECT` and reclassified as
`DEFER_MANUAL` because it is still mutation-adjacent.

```text
git diff --check
npm run release:check -- --base origin/main --head HEAD
npx tsc --noEmit --pretty false
```

Results:

- Diff whitespace check: pass.
- Release control gate: pass.
- Full local typecheck: blocked by pre-existing missing optional package type
  declarations (`@azure/identity`, `@azure/storage-blob`,
  `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file
  errors were emitted.

## Rollback Plan

Rollback is file-local. Revert `src/app/api/programs/phase-gate/route.ts`, the
focused test file, the two `2c2h` evidence files, and the generated inventory
update. No database migration, production data operation, or feature flag is
involved.

## Deferred Programs Residue

- The phase-gate route remains mutation-adjacent by design because it advances
  phase state and writes durable audit-log records.
- Program work-item, milestone, risk, approval, execute, and Nexus mutation
  routes remain separate mixed read/write slices.
- Program attachment routes remain storage-backed and out of this read seam
  cleanup.
