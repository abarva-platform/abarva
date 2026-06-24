# 2026-06-24-ava-answer-packet-contract — Ava Answer Packet Contract

## Release ID

`2026-06-24-ava-answer-packet-contract`

## Status

`candidate`

## Plain-English Summary

This release replaces the old prose-first aVa answer shape with a governed `AvaAnswerPacket`. Home and Intelligence answers now pass through a shared composer and quality gate before rendering, so old scaffold language, row-count-first leads, Home expert leakage, and Home recommendations are blocked by contract instead of patched one string at a time.

## Layer Impact

- `global-control-lane`: Shared answer contract, renderer, route output, and answer-quality validation used by all clients.
- `internal-admin`: Documentation and regression notes for operators reviewing aVa answer quality.

## Client Applicability

- All clients: Yes. The shared answer contract and renderer apply globally.
- Specific clients: None.
- Internal only: Documentation and regression evidence are operator-facing.
- Public/demo only: No.
- Feature flag: No new flag; this updates the shared answer path directly.

## Changes Included

- Added `src/lib/ava-answer/*` with `AvaAnswerPacket`, composer, Home composer, retrieval policy, surface voice files, and packet validation.
- Deleted the old `src/lib/intelligence/answer/agent-answer.ts` public shape.
- Migrated Home KNOW conversion and Intelligence streamed answer events to emit `AvaAnswerPacket`.
- Migrated the shared answer renderer to consume packet fields and typed artifacts.
- Added answer-quality tests and docs under `docs/ava-answer-quality/`.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: focused Jest pack, 62 tests passed.
- PASS: touched-file ESLint.
- Local browser check: confirmed localhost redirects to the one-time-code sign-in page because production Clerk auth states do not authenticate localhost.
- Pending post-deploy: signed-in production browser crawl against `app.abarva.ai`.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps workflow, then run signed-in SkyHarbor aVa/Home browser crawl using the existing Clerk agent auth state.

## Deployment Authority

- Repo-owned deploy workflow: ACA `aca-main-deploy`.
- Shared runtime mutators: Next.js app image only.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required by release checks and post-deploy health.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and redeploy the prior ACA image. No data migration is included.

## Audit Evidence

- Focused Jest and TypeScript output from the Codex run.
- Post-deploy browser screenshots and text-quality crawl report to be appended to `docs/ava-answer-quality/AVA_REGRESSION_REPORT.md`.

## Known Gaps

Moves, Source, and Tower still need deeper route-by-route composer wiring beyond this keystone. Their type contracts now point at `AvaAnswerPacket`, but not every route has been independently browser-proven in this slice.
