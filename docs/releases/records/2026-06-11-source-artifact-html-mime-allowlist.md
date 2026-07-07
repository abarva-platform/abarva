# 2026-06-11-source-artifact-html-mime-allowlist — allow text/html in the Source artifact registry

## Release ID

`2026-06-11-source-artifact-html-mime-allowlist`

## Status

`candidate`

## Plain-English Summary

Recording a stage-gate decision still returned HTTP 500 after the previous fix
(2026-06-11-source-preflight-gate-record-and-shelf-fixes / PR #3402). Live verification
on the deployed revision surfaced the real remaining cause in the server log:

```
[source-artifacts] mimeType "text/html" is not in the allowlist (12 types)
```

The gate approval record (and board-grade deliverables) render to HTML and persist
through `registerSourceArtifactUpload`. `html` is already a first-class value in the
`SourceArtifactFormat` type, but `text/html` was missing from the registry's mime
allowlist AND from the mime→format mapping. So every HTML artifact write threw the
allowlist guard and the route returned a generic 500. PR #3402 had correctly mapped the
playbook stage key but exposed this second, independent guard underneath it — a "fixed
one 500, hit the next" sequence the live re-click caught.

This release adds `text/html` to `SOURCE_ARTIFACT_MIME_ALLOWLIST` and maps it to the
`'html'` format in `sourceArtifactFormatFromMime`, so HTML artifacts persist instead of
throwing.

## Layer Impact

- `global-control-lane`: shared Source artifact-registry upload contract for all tenants.
  No schema change, no data migration — a constant allowlist + a switch case.

## Client Applicability

- All clients: yes — any tenant recording a gate decision or persisting an HTML
  deliverable/governance record through the Source artifact registry.
- Feature flag: none

## Changes Included

- PR (branch `fix-source-artifact-html-mime`)
- `src/lib/source/artifact-registry/mime.ts` — add `'text/html'` to `SOURCE_ARTIFACT_MIME_ALLOWLIST` (now 13 types).
- `src/lib/source/artifact-registry/upload-contract.ts` — map `text/html` → `'html'` in `sourceArtifactFormatFromMime`.
- `src/lib/source/artifact-registry/__tests__/upload-contract.test.ts` — regression test asserting both.

## QA / Validation

- Root cause read directly from the live ACA console log on revision rc-d0a1e6e0c
  (`az containerapp logs show ... | grep gate-decision`) — the verbatim allowlist error.
- New unit test green: `isAllowedSourceArtifactMimeType('text/html') === true` and
  `sourceArtifactFormatFromMime('text/html') === 'html'` (jest, 4/4 in suite).
- Live write-path verification (Playwright against app.abarva.ai / rc-d0a1e6e0c):
  V1 shelf-upload-without-reload PASS, V3 generate-past-egress-audit PASS; V2 gate-decision
  was the failing case this fix targets and will be re-verified to 200 on the next roll.

## Rollout Plan

Squash-merge to main, then standard Azure control-lane web image roll (`az acr build` →
`az containerapp update` → traffic shift). No migration required.

## Rollback Plan

Revert the squash commit and shift traffic back to the prior revision. No data cleanup —
artifacts written with `text/html` are valid registry rows; reverting only re-blocks new
HTML writes.

## Audit Evidence

- Live server log line naming the allowlist rejection (rc-d0a1e6e0c console).
- Playwright verification screenshots under `~/Downloads/source-testing-package/preflight-evidence-v2/`.
- Post-deploy re-verification: V2 gate-decision returning 200 + a persisted approval artifact id.

## Context Ingestion Evidence

Not applicable — no ingestion, parsing, embedding, or retrieval path changed. This widens
the artifact-registry write contract by one mime type for system-generated HTML records.

## Known Gaps

- The gate-decision route still collapses all persistence failures into a generic
  `{ error: 'internal_error' }` 500; surfacing the specific reason to the caller (as the
  upload route does) would have made this diagnosable without reading server logs. Tracked
  separately, not in this PR.
