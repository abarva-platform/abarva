# Packet 30 Phase 2D Supabase Runtime Guard

Generated: 2026-05-29

## Purpose

Phase 2C reduced runtime helper usage to `29` matches. This guard prevents
regression while the remaining storage/binary paths wait for a dedicated
storage-adapter decision.

## Enforced Contract

- `filesWithImportMatches <= 10`
- `importMatches <= 29`
- Every helper match must appear in
  `scripts/audit/runtime-supabase-import-allowlist.json`

## Allowlisted Rationale

The allowlist is intentionally narrow. Entries are storage or binary boundaries:

- Source artifact upload/download/generate paths.
- Program attachment upload/download/extract paths.
- Tower upload path.
- The temporary compatibility export at `src/lib/supabase-server.ts`.

Adding a new helper match outside this list fails CI.

## Validation

- PASS: `npm run audit:runtime-supabase-imports:guard`
- PASS: `npm run audit:runtime-supabase-imports`
- PASS: `node --check scripts/audit/runtime-supabase-import-census.mjs`
