# 2026-07-19-intelligence-stream-artifact-polish — Intelligence Stream And Artifact Polish

## Release ID

`2026-07-19-intelligence-stream-artifact-polish`

## Status

`candidate`

## Plain-English Summary

This release hardens the Intelligence aVa chat experience after the FS Demo live audit. It prevents malformed chart/visual payloads from appearing as raw JSON in the chat, keeps generated follow-up questions short enough for the visible rail, and shows lightweight progress text while aVa is selecting client context and evidence before the first streamed answer token arrives.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence answer rendering, structured artifact extraction, stream scrubbing, and generated follow-up display for all tenants using the Intelligence aVa chat.
- `client-data-lane`: No schema, migration, seed, or tenant data mutation.
- `public-demo`: Improves buyer-facing/demo chat quality and export artifact cleanliness by ensuring visuals render as typed artifacts or are removed from prose.

## Client Applicability

- All clients: Yes, all Intelligence aVa chat tenants receive the stream/follow-up/artifact hardening.
- Specific clients: Validated first against Healthcare Demo and FS Demo audit findings.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- Harden malformed multiline `chart` artifact handling so valid bare chart blocks become typed chart artifacts and invalid blocks are scrubbed from prose.
- Add final packet scrub coverage for bare multiline chart/table/graph/follow-up payloads.
- Reduce generated follow-up max length from 320 to 220 characters after existing footer cleanup.
- Display a short progress message in the Intelligence chat while sources/context are being selected before answer text starts streaming.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/answer/__tests__/structured-fence-stream-filter.test.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts src/lib/intelligence/ask/__tests__/followups.test.ts src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx --runInBand` — 4 suites, 64 tests passed. Jest emitted the existing duplicate manual mock warnings.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: `npx eslint` on changed Intelligence renderer/parser/follow-up files.
- PASS: `npm run build`. Build completed with existing Turbopack broad dynamic-file-pattern warnings in Home/enterprise-data runtime modules.
- NOT-RUN: post-deploy live FS Demo regression for the prior raw chart leak prompt and follow-up rail; required after ACA deploy.

## Rollout Plan

Merge this PR to `main`; the repo-owned ACA main deployment workflow builds and deploys the digest-pinned web image to `ca-abarva-web-lab-eastus`. After deploy, rerun signed-in Intelligence proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. No data rollback is required because the change is runtime rendering/scrubbing only.

## Audit Evidence

Pending:

- PR URL.
- CI/local check output.
- ACA revision, image digest, and runtime invariant after deploy.
- Signed-in FS Demo regression report showing no raw chart JSON/fence leak and concise follow-ups.

## Known Gaps

Streaming still depends on the upstream model producing the first answer delta after retrieval/synthesis. This release improves perceived wait-state transparency; it does not replace the model path with token-by-token partial reasoning or change model latency.
