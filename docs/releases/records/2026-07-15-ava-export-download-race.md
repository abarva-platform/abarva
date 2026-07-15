# 2026-07-15-ava-export-download-race — aVa Export Download Race Fix

## Release ID

`2026-07-15-ava-export-download-race`

## Status

`candidate`

## Plain-English Summary

This release fixes a browser download race in aVa exports. The app was fetching the HTML/PDF response into a client-side Blob, clicking a temporary download link, and relying on synthetic Blob download events. Signed-in Chrome proof showed the export endpoint could return `200` while the browser download was canceled or never emitted. The fix moves exports to a native browser form POST download path while preserving the existing validated export endpoint.

## Layer Impact

- `global-control-lane`: Shared aVa export UI behavior changes for governed answer exports and chat-session exports.
- No data-layer impact: No tenant data, candidate data, Active Tenant Access, module context, or retrieval behavior changes.
- No model behavior impact: No answer generation, Claude prompt, or safety validation behavior changes.

## Client Applicability

- All clients: Authenticated tenants using aVa answer export or chat-session export.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; existing export buttons keep the same user-facing behavior.

## Changes Included

- `src/components/agent-answer/AgentAnswerRenderer.tsx`: submit answer exports through a hidden native form POST instead of fetch-to-Blob download.
- `src/components/agent/AgentDock.tsx`: submit chat-session exports through a hidden native form POST instead of fetch-to-Blob download.
- `src/app/api/intelligence/ask/export/route.ts`: accept a form `payload` field containing the same validated export JSON shape already used by the JSON API.
- `docs/releases/records/2026-07-15-ava-export-download-race.md`: release-control record.

## QA / Validation

- Pass: `npx jest src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand`
- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx -t "exports the current chat session" --runInBand`
- Pass: `git diff --check`
- Pending: `npm run release:check`
- Pending after merge/deploy: focused signed-in Meridian Home aVa HTML/PDF export proof.

## Rollout Plan

Merge through PR into `main`, then deploy through the approved ACA main workflow. No migrations, data builds, feature flags, or manual tenant operations are required.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None outside the approved ACA main workflow.
- Approved image digest: To be produced by ACA main deploy after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by standard ACA main deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Home aVa export proof.

## Rollback Plan

Revert this release to restore immediate blob URL cleanup, or roll back the ACA web runtime to the previous known-good revision if the deployed export path regresses unexpectedly.

## Audit Evidence

- Pre-fix proof: `/tmp/meridian-home-ava-export-proof-passcheck-2026-07-15T20-44-50-279Z/proof-result.json`
- Pre-fix screenshots: `/tmp/meridian-home-ava-export-proof-passcheck-2026-07-15T20-44-50-279Z/screenshots/`
- Pre-fix observation: expanded Home aVa rendered `Export HTML` and `Export PDF`; HTML export endpoint returned `200`; browser download save was canceled.
- First fix proof: `/tmp/meridian-home-ava-export-proof-final-2026-07-15T21-05-20-100Z/proof-result.json`
- First fix observation: deferring only blob URL revocation was insufficient; browser download save was still canceled.
- Second fix proof: `/tmp/meridian-home-ava-export-proof-anchor-2026-07-15T21-25-41-305Z/proof-result.json`
- Second fix observation: keeping the temporary Blob anchor alive still did not produce a completed browser download event in signed-in proof, so this release moves to native browser form POST downloads.

## Known Gaps

- Meridian Home aVa produced table output and chart-ready / graph-like text, but no typed chart or graph artifact markers were detected in the proof. This release fixes download reliability only; it does not add new chart/graph generation.
