# Moves Recording Readiness Fixes Proof

Date: 2026-07-04

Branch: `codex/moves-recording-readiness-fixes`

## Objective

Fix the two hard blockers found in the end-to-end recording proof:

1. Attachment downloads returned a 302 signed Azure Blob URL and then failed at Blob with `AuthorizationFailure`.
2. Harmless PDFs could be falsely quarantined because the sensitive-data guard scanned raw compressed/binary PDF bytes as UTF-8 text.

## Changes

### Attachment download

Changed `src/app/api/programs/[id]/attachments/[attachmentId]/route.ts`.

Before:

- tenant/program/attachment checks passed;
- route generated a signed URL;
- browser followed 302 to Azure Blob;
- Blob could return `403 AuthorizationFailure`.

After:

- tenant/program/attachment checks still happen first;
- route downloads bytes server-side through `getObjectStorageAdapter().download`;
- route streams bytes back with `content-type`, `content-disposition`, `content-length`, `cache-control`, and `x-abarva-download-proxy: object-storage`;
- browser no longer depends on client-side Blob SAS authorization.

### Sensitive upload guard

Changed `src/lib/security/sensitive-upload-guard.ts`.

Before:

- every upload decoded the first 1 MB as UTF-8;
- known binary/archive formats could accidentally resemble card/phone/account patterns;
- harmless PDFs could be quarantined before storage.

After:

- plain text formats are scanned directly;
- PDFs scan only simple extractable PDF text-string content;
- Office/image/audio/video formats scan only filename and mime type in this synchronous guard;
- declared regulated PHI/PII still quarantines regardless of file type;
- sensitive text embedded in simple PDF text objects still quarantines.

## Validation

Pass:

```bash
npx jest src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts --runInBand
```

Result: 3 suites passed, 26 tests passed.

Pass:

```bash
npx eslint 'src/app/api/programs/[id]/attachments/[attachmentId]/route.ts' src/lib/security/sensitive-upload-guard.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts
```

Pass:

```bash
NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit
```

Pass:

```bash
git diff --check -- 'src/app/api/programs/[id]/attachments/[attachmentId]/route.ts' src/lib/security/sensitive-upload-guard.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts
```

## Known Validation Notes

- Jest emitted pre-existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`.
- Jest emitted the pre-existing `--localstorage-file` warning.
- Initial `npx tsc --noEmit` hit Node heap exhaustion; rerun with `NODE_OPTIONS='--max-old-space-size=8192'` passed.
- The temporary worktree used a symlink to `/Users/anand/Projects/nexus/node_modules` for dependency resolution.

## Recording Gate Status

Local code validation:

- Attachment download 403 blocker: fixed locally and regression-tested.
- Harmless PDF false quarantine blocker: fixed locally and regression-tested.
- P3 generation gate: not changed; still expected to require approve-gate -> generate proof.

Still required before recording:

- Deploy through the approved ACA lane.
- Signed-in live proof on `app.abarva.ai`.
- Re-run upload/download proof against live product.
- Prove approve-gate -> generate for P3 once.

## Non-Claims

- Not deployed.
- Not live browser-proven.
- Not a full P0-P5 recording proof.
- Not a V7 promotion implementation.
- Not a change to the gate policy.
