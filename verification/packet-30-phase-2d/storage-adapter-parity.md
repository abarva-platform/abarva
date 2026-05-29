# Packet 30 Storage Adapter Parity

Generated: 2026-05-29

## Purpose

Replace the final runtime storage-bound Supabase helper callsites with a shared
object-storage adapter while preserving route behavior and rollback semantics.

## Before

- Runtime helper census: `10 files / 29 matches`
- Remaining allowlist consisted of Source artifacts, Program attachments, Tower
  upload, AgentDock upload, and `src/lib/supabase-server.ts`.

## After

- Runtime helper census: `1 file / 1 match`
- Only remaining helper match: `src/lib/supabase-server.ts`
- Guard threshold tightened to `maxFiles=1`, `maxImportMatches=1`.

## Route Parity

- Upload routes still validate auth, tenancy, MIME type, size, and sensitive
  upload posture before writing bytes.
- Metadata insert failures still trigger best-effort object deletion.
- Download routes still issue short-lived read URLs and redirect.
- Source artifact detail still reads text bytes only for text-like artifacts.

## Rollback Path

Revert this PR. Per-file rollback is mechanical because every route replacement
is a direct storage boundary swap:

- `getObjectStorageAdapter().upload(...)` back to the prior storage upload call.
- `getObjectStorageAdapter().remove(...)` back to the prior storage remove call.
- `getObjectStorageAdapter().download(...)` back to the prior storage download call.
- `getObjectStorageAdapter().createSignedUrl(...)` back to the prior signed-url call.

## Validation

- PASS: `npm run audit:runtime-supabase-imports:guard`
- PASS: `npm run audit:runtime-supabase-imports`
- PASS: focused ESLint over changed runtime/test files
- PASS: focused Jest suite, `51` tests
- PASS: `npx tsc --noEmit --pretty false`
