# Packet 30 Phase 2C — Deterministic Runtime Supabase Codemod Proposal

## Status

`proposal_only` — do not execute until founder approval.

## Why Phase 2C Needs A Codemod

Phase 2B proved the read boundary by moving high-value customer-facing surfaces one slice at a time:

- Intelligence retriever reads
- AI initiatives reads
- Context-layer reads
- Programs query reads
- Source pricing reads
- Tower portfolio value reads

The latest runtime census is still:

```text
176 files / 725 import-helper matches
325 files / 1647 broad matches
```

At this point, one-PR-per-callsite is too slow and increases merge/rebase risk. The remaining work is mostly mechanical in shape but must still preserve Packet 31 invariants: no tenant bleed, no silent fallback, no mutation-path rewrites disguised as read migration, and no weakening of the runtime guard.

## Proposed Execution Shape

Phase 2C should run as a deterministic codemod plus three area-grouped PRs.

### 2C.0 — Codemod Dry-Run Inventory

Branch: `codex/packet-30-phase-2c-codemod-inventory`

Actions:

- Build `scripts/codemods/phase-2c-supabase-read-inventory.mjs`.
- Parse TypeScript/TSX AST with existing repo tooling; no regex-only rewriting.
- Classify every remaining `getServerSupabase` / Supabase runtime import into:
  - `READ_ONLY_SELECT`
  - `READ_WITH_STORAGE`
  - `MUTATION_WRITE`
  - `MIXED_READ_WRITE`
  - `TEST_ONLY`
  - `DEFER_MANUAL`
- Emit:
  - `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`
  - `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`

Acceptance:

- Inventory count matches `runtime-supabase-import-census.mjs`.
- Every file has exactly one classification.
- No source files modified.

### 2C.1 — Area PR 1: Pure Read Modules

Branch: `codex/packet-30-phase-2c-pure-read-modules`

Scope:

- Files classified `READ_ONLY_SELECT`.
- Replace straightforward `.from(table).select(...).eq/.in/.is/.order/.limit/.maybeSingle` chains with `azureRead.select`, `azureRead.query`, or narrow read adapters.
- Preserve fail-soft behavior where the original helper returned `[]`, `null`, or `0`.
- Add focused tests for each reusable adapter or high-value module group.

Out of scope:

- Storage reads.
- Inserts, updates, deletes, upserts.
- Transactional flows.

Required validation:

- Focused Jest for converted module groups.
- ESLint on touched files.
- `node scripts/audit/runtime-supabase-import-census.mjs` must show a material drop.
- `npm run release:check`.
- Full typecheck in CI.
- Production smoke and post-deploy crawl after merge.

### 2C.2 — Area PR 2: Mixed Read/Write Modules

Branch: `codex/packet-30-phase-2c-mixed-read-write-modules`

Scope:

- Files classified `MIXED_READ_WRITE`.
- Split reads from writes without changing writer semantics:
  - Extract read helpers into `*.read.ts` or data-plane read adapters.
  - Leave writes on existing write clients until Phase 2D/explicit write-path decision.
  - Preserve existing transaction boundaries.
- Add regression tests proving write helpers do not call `azureRead`.

Out of scope:

- Reworking the mutation architecture.
- Introducing dual-write or write-through Azure behavior.

Required validation:

- Focused read/write separation tests.
- Census drop.
- Tenant-isolation smoke when tenant-scoped reads change.
- Production post-deploy crawl.

### 2C.3 — Area PR 3: Storage / Artifact / Deferred Manual

Branch: `codex/packet-30-phase-2c-storage-artifact-deferred`

Scope:

- Files classified `READ_WITH_STORAGE`, `DEFER_MANUAL`, and runtime test leftovers.
- For storage-backed reads, propose one of:
  - keep as explicit non-data-plane storage exception with header and guard allowlist, or
  - introduce an Azure Blob read adapter if the path is customer-facing and runtime-critical.
- For historical migration/test utilities accidentally under `src/`, move to `scripts/` or mark with an allowed historical header only if Packet 31 permits it.

Required validation:

- Updated guard allowlist, if and only if exceptions are intentional.
- Zero accidental runtime Supabase imports outside approved exceptions.
- Release note that names every surviving exception.

## Codemod Safety Rules

- Never rewrite `.insert`, `.update`, `.upsert`, `.delete`, `.storage`, or transaction-like chains automatically.
- Never infer tenant scope. If a query lacks an explicit tenant/client predicate, mark `DEFER_MANUAL`.
- Never add hardcoded tenant fallbacks.
- Never change RLS assumptions silently; if the original relied on RLS, the converted query must use explicit tenant predicates or be manually reviewed.
- Never move a module from fail-closed to fail-open.
- Every generated SQL statement must be parameterized.
- Every interpolated table/column name must use a closed allowlist.

## PR Grouping Recommendation

Use 2-3 large but coherent PRs, not one giant PR:

1. `pure-read-modules`: fastest census reduction, lowest behavioral risk.
2. `mixed-read-write-modules`: highest care; split but do not rewrite writes.
3. `storage-artifact-deferred`: policy/exception cleanup and guard hardening.

Do not merge any 2C PR unless:

- local focused tests pass,
- CI is green,
- post-deploy crawl is `0 P0`,
- `verification/packet-30-phase-2c/*` evidence is updated,
- rollback notes are present,
- production alias smoke passes.

## Phase 2D Boundary

Phase 2C should reduce runtime Supabase imports and classify intentional exceptions. Phase 2D should turn the guard from WARN to FAIL only after:

- all remaining runtime exceptions are explicitly documented,
- the allowlist is minimal and reviewed,
- source/storage exceptions have an owner and follow-up phase,
- post-deploy crawl remains `0 P0`.

## Ask For Approval

Approve 2C execution only if this sequencing is acceptable:

1. Run 2C.0 inventory first.
2. Review the generated inventory summary.
3. Execute 2C.1, 2C.2, and 2C.3 as area PRs with independent validation.
4. Stop before 2D enforcement unless the final 2C exception report is clean.
