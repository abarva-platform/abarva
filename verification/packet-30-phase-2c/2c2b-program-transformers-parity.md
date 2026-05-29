# Packet 30 Phase 2C.2b — Program Transformers Parity Artifact

## Scope

Area group: pure read transformer logic under `src/lib/programs`.

Converted files:

- `src/lib/programs/transformers.ts`
- `src/lib/programs/__tests__/transformers-azure-read.test.ts`

## Parity Pattern

This slice removes the runtime Supabase client from the program view-model
transformers and routes read-only lookups through the Packet 30 Azure read
plane. It does not change program mutations, uploads, storage, route handlers,
schemas, or tenant data.

### Client / Person / Team Resolution

Before:

```ts
getServerSupabase().from('clients').select('name').eq('id', clientId).maybeSingle()
getServerSupabase().from('persons').select('id, name, role').eq('id', userId).maybeSingle()
getServerSupabase().from('engagement_participants').select(...).eq('engagement_id', engagementId)
```

After:

```ts
azureRead.maybeSingle({ table: 'clients', columns: ['name'], where: { id: clientId } })
azureRead.maybeSingle({ table: 'persons', columns: ['id', 'name', 'role'], where: { id: userId } })
azureRead.select({ table: 'engagement_participants', columns: [...], where: { engagement_id: engagementId } })
```

Parity notes:

- Canonical client-name normalization is unchanged.
- Retired-tenant text sanitization is unchanged.
- Missing person rows still fall back to placeholder people.

### Program Summary / Detail View Models

Before:

```ts
supabase.from('pattern_match_logs').select('pattern_key')...
supabase.from('deliverables_v2').select('title, status')...
supabase.from('maestro_oversight_flags').select('id', { count: 'exact', head: true })...
```

After:

```ts
azureRead.maybeSingle({ table: 'pattern_match_logs', ... })
azureRead.maybeSingle({ table: 'deliverables_v2', ... })
azureRead.count({ table: 'maestro_oversight_flags', ... })
```

Parity notes:

- Pattern, charter, activity, open-flag, and pending-approval semantics are
  preserved.
- Existing program query helpers (`getModuleState`, `getWorkItems`,
  `getMilestones`, `getRisks`) remain the source for typed program rows.
- The previous optional `supabase` transformer option is retained as a no-op
  compatibility field while the transformer itself uses the canonical read
  plane.

### Strategic Move Transformers

Before:

```ts
supabase.from('clients').select('id, name, industry_code, slug')...
supabase.from('program_audit_log').select(...).order('created_at', ...)
supabase.from('deliverables_v2').select(...).order('updated_at', ...)
```

After:

```ts
azureRead.maybeSingle({ table: 'clients', ... })
azureRead.select({ table: 'program_audit_log', ... })
azureRead.select({ table: 'deliverables_v2', ... })
```

Parity notes:

- Strategic move sponsor/participant resolution, recent activity, linked
  evidence, deliverable previews, status derivation, and gate criteria remain
  structurally unchanged.
- Deliverable type aliasing (`deliverable_type_key AS module_key`) is handled
  with a select-only `azureRead.query` because `azureRead.select` intentionally
  does not support column aliases.
- `evaluateGate` continues to own gate-evaluation reads; governance remains a
  separate mixed read/write-adjacent module and is not folded into this pure
  transformer slice.

## Census Delta

Start of this slice, after Phase 2C.2a:

- Runtime Supabase census: `156 files / 649 import-helper matches`
- Broad census: `311 files / 1519 broad matches`
- Current codemod inventory: `99 READ_ONLY_SELECT`

End of this slice:

- Runtime Supabase census: `155 files / 631 import-helper matches`
- Broad census: `311 files / 1470 broad matches`
- Current codemod inventory: `98 READ_ONLY_SELECT`

Slice delta:

- `-1` runtime file with import-helper matches
- `-18` import-helper matches
- `0` broad-match files
- `-49` broad matches
- `-1` READ_ONLY_SELECT candidate

From the Phase 2C.0 baseline:

- Baseline: `176 files / 725 import-helper matches`
- Current: `155 files / 631 import-helper matches`
- Total Phase 2C reduction so far: `-21 files / -94 import-helper matches`

## Deferred Programs Residue

Remaining program hits are intentionally split into later PRs:

- `src/lib/programs/governance.ts` includes approval/gate evaluation and stays
  out of this pure transformer read slice.
- `src/lib/programs/mutations.ts`, `approval.ts`, `execute.ts`, and related
  mutation flows stay out of pure-read Phase 2C.
- Program route handlers under `src/app/api/v1/programs/**` and
  `src/app/api/programs/**` remain for route-level parity slices.
- Upload, attachment, and storage-adjacent program paths remain for later
  mixed read/write or storage phases.

## Validation

Local validation:

```text
npx jest src/lib/programs/__tests__/transformers-azure-read.test.ts src/lib/programs/__tests__/strategic-moves-transformers.test.ts src/lib/programs/__tests__/live-program-display.test.ts src/lib/programs/queries.azure-read.test.ts --runInBand
```

Result: pass, 4 suites / 9 tests.

```text
npx eslint src/lib/programs/transformers.ts src/lib/programs/__tests__/transformers-azure-read.test.ts
```

Result: pass.

```text
node scripts/audit/runtime-supabase-import-census.mjs
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
```

Result: pass. Census/inventory evidence updated in
`verification/packet-30-phase-2c/CODEMOD_INVENTORY.*`.

Full local typecheck remains blocked by pre-existing missing optional package
type declarations (`@azure/identity`, `@azure/storage-blob`,
`@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No touched-file errors
were emitted before those dependency-resolution failures.

## Rollback Plan

Rollback is file-local. If transformer behavior regresses, revert
`src/lib/programs/transformers.ts` and the focused regression test. If the
issue is limited to summary/detail construction, revert the relevant helper
block first and redeploy. If strategic move view-model construction regresses,
revert this whole slice because the status/activity/deliverable reads are
co-located in the same transformer module.
