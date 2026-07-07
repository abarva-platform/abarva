# 2026-07-04-moves-recording-readiness-fixes — Moves Recording Readiness Fixes

## Release ID

`2026-07-04-moves-recording-readiness-fixes`

## Status

`candidate`

## Plain-English Summary

This release candidate fixes two recording blockers in the Moves upload/download path. Attachment downloads now stream through the authenticated app instead of redirecting the browser to a signed Azure Blob URL that could fail with `AuthorizationFailure`. The sensitive upload guard no longer scans raw PDF/Office binary bytes as plain text, which prevents harmless contract PDFs from being falsely quarantined while still blocking declared regulated data and extractable sensitive text.

## Layer Impact

- `global-control-lane`: Shared attachment download route and upload safety guard behavior change for all tenants.
- `public-demo`: Supports the Industrial/Lakeshore Moves recording path by making deliverable downloads and contract PDF uploads reliable.

## Client Applicability

- All clients: Yes. The attachment download route and sensitive upload guard are shared.
- Specific clients: Industrial Demo / Lakeshore is the immediate recording target.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/programs/[id]/attachments/[attachmentId]/route.ts`
- `src/lib/security/sensitive-upload-guard.ts`
- `src/lib/security/__tests__/sensitive-upload-guard.test.ts`
- `src/app/api/programs/__tests__/attachments-download.smoke.test.ts`
- `src/app/api/programs/__tests__/attachments-upload.smoke.test.ts`
- `proof/moves-recording-readiness-fixes-2026-07-04/proof-report.md`

## QA / Validation

- Pass: `npx jest src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts --runInBand`
- Pass: 3 suites, 26 tests.
- Pass: `npx eslint 'src/app/api/programs/[id]/attachments/[attachmentId]/route.ts' src/lib/security/sensitive-upload-guard.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- Pass: `git diff --check -- 'src/app/api/programs/[id]/attachments/[attachmentId]/route.ts' src/lib/security/sensitive-upload-guard.ts src/lib/security/__tests__/sensitive-upload-guard.test.ts src/app/api/programs/__tests__/attachments-download.smoke.test.ts src/app/api/programs/__tests__/attachments-upload.smoke.test.ts`
- Not run: signed-in browser proof.
- Not run: Azure Container Apps deploy.

## Rollout Plan

1. Review and merge the candidate branch.
2. Build and deploy through the approved Azure Container Apps lane for `app.abarva.ai`.
3. Confirm ACA revision, image digest, traffic, and health.
4. Re-run the live upload/download proof:
   - upload harmless contract PDF;
   - confirm no false quarantine;
   - download generated/uploaded deliverable;
   - confirm app route returns bytes, not Blob 403.
5. Prove P3 approve-gate -> generate once before recording.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: Azure Container Apps only.
- Approved image digest: to be captured after build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must receive 100% traffic.
- Worker image invariant: no worker change in this slice.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback to the previous Azure Container Apps revision if the download or upload path regresses. Code rollback restores the signed URL redirect behavior and the prior raw-byte sensitive scan behavior, but that would reintroduce the recording blockers.

## Audit Evidence

- `proof/moves-recording-readiness-fixes-2026-07-04/proof-report.md`
- Focused Jest, ESLint, TypeScript, and diff-check outputs from the candidate branch.

## Known Gaps

- Live signed-in proof is still required.
- Deploy is still required.
- P3 approve-gate -> generate proof is still required.
- This does not implement V7 promotion.
- This does not change gate policy.
