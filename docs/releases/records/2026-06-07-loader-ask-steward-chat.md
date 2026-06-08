# 2026-06-07-loader-ask-steward-chat — Live Ask-Steward scoped chat round-trip

## Release ID

`2026-06-07-loader-ask-steward-chat`

## Status

`candidate`

## Plain-English Summary

The Admin Loader's "Ask Steward" side dock used to only echo what the operator
typed. This change makes it a real, scoped conversation. When validation of an
uploaded file leaves an open-ended question, the operator can ask Steward (our
Claude-backed assistant) about how that one preserved file was mapped or
interpreted, and get a real answer. The answer is generated through the audited
AI egress path with the file's mapping proposal, its validation findings, and
the prior conversation as context. Steward is instructed to stay strictly scoped
to that one file's mapping and to never invent data — if asked for data it does
not have, it says so. Nothing is committed by this path; it is read-only
reasoning to help a human decide.

## Layer Impact

- `global-control-lane`: This is shared Admin Loader / control-plane behavior
  available to any tenant operator using the loader. It adds one new POST API
  route, one new lib module, and wires the existing client component to the live
  route. No client-specific data, schema, or RLS changes. The audited egress
  path (existing) governs the actual model call, so tenant scoping and audit
  logging are preserved.

## Client Applicability

- All clients: Yes — any signed-in tenant operator with access to the Admin
  Loader can use the live Ask-Steward dock. It is not feature-flagged.
- Specific clients: Not applicable.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- New lib `src/lib/context-ingestion/loader/steward-chat.ts`:
  `buildStewardChatPrompt`, `makeStewardChat`, `auditedStewardChatModel`,
  `StewardChatModel`/`StewardChatTurn` types. Mirrors the audited-egress pattern
  in `steward-reviewer.ts` (workflow `admin-loader-steward-chat`, model
  `claude-sonnet-4-6`, dataClass `confidential`, max_tokens 800). Never throws —
  a model error returns a calm fallback string.
- New tests `src/lib/context-ingestion/loader/__tests__/steward-chat.test.ts`
  (7 tests, stub model, no network).
- New route `src/app/api/admin/context-layer/loader/steward-chat/route.ts`
  (POST JSON). Auth via `requireTenancy`, cross-tenant guard on `clientId`,
  requires `tenancy.clientKey`, validates question + proposal, returns
  `loader_steward_chat_*` error codes on bad input and `loader_steward_chat_failed`
  on server error.
- Edited `src/components/setup/loader/AdminLoaderClient.tsx`: replaced the
  echo-only `onSend` with a live fetch to the new route (operator message
  appended, pending/disabled state while awaiting, Steward reply appended);
  added per-escalated-file "Ask Steward" ghost buttons (only for files whose
  `validation.escalateToConversation` is true) that open the dock.

## QA / Validation

- Unit tests: `npx jest src/lib/context-ingestion/loader/__tests__/steward-chat.test.ts --no-coverage`
  → PASSED (7 passed, 7 total).
- Lint: `npx eslint` on all created/edited files → PASSED (clean, exit 0).
- Typecheck: `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`
  filtered to `steward-chat | AdminLoaderClient | loader/steward-chat` → PASSED
  (0 errors in changed files). Pre-existing unrelated module-resolution errors
  (`@azure-rest/ai-document-intelligence`, `@axe-core/playwright`) are install
  artifacts and out of scope.
- Live model round-trip with real Anthropic credentials: NOT RUN in this
  environment (no `ANTHROPIC_API_KEY`); the model seam is injected and unit-tested
  with a stub. The production model path reuses the already-shipped audited egress
  client used by `steward-reviewer.ts`.

## Rollout Plan

Merge to `main` via squash PR and deploy through the standard Azure Container
Apps control-lane deploy. No migration, no feature flag, no data backfill. The
new route and dock behavior become active on deploy. The path is read-only
(no commit), so it carries no data-plane mutation risk.

## Rollback Plan

Revert the squash commit (the three new files + the AdminLoaderClient edit) and
redeploy. There is no schema or data migration to unwind. Reverting restores the
prior echo-only dock behavior. No data is written by this feature, so no cleanup
is required.

## Audit Evidence

- Branch: `cursor/loader-steward-chat`.
- PR URL: to be added when opened against `abarva-platform/abarva`.
- Local QA output: jest 7/7 passed, eslint exit 0, tsc 0 errors in changed files
  (see QA / Validation).
- Per-call AI egress is audited by the existing `getAuditedAnthropicClient`
  preflight under workflow `admin-loader-steward-chat`; audit rows are the
  runtime evidence for each Steward chat turn.

## Known Gaps

- No live end-to-end model round-trip was run here (no Anthropic key in this
  environment); only the injected-stub unit path is validated. A reviewer should
  confirm one real Steward answer in a deployed environment.
- The dock conversation is in-memory only (component state); turns are not
  persisted to an evidence ledger. Persisting Ask-Steward transcripts is out of
  scope for this change.
- "Confirm & resolve" in the dock is still a UI affordance only; it does not yet
  record a resolution decision against the file. Out of scope here.
- The route trusts the proposal/findings sent from the client as conversation
  context; it does not re-fetch them server-side from the preserved record. A
  reviewer should verify whether server-side re-derivation is required before
  pilot hardening.
