# 2026-06-16 Deliverable Streaming Fix — board-grade passes use streaming

## Release ID

`2026-06-16-deliverable-streaming-fix`

## Status

`candidate`

## Plain-English Summary

Fixes a bug that made board-grade deliverable generation fail every time on the largest passes. The Deliverable Intelligence Orchestrator authors each deliverable in six Claude passes; the heavy passes (e.g. "Writing the first draft") request a large token budget. The Anthropic SDK refuses a single non-streaming request whose estimated runtime can exceed 10 minutes, throwing `"Streaming is required for operations that may take longer than 10 minutes"` before the request is even sent. The orchestrator was making a non-streaming `messages.create` call, so those passes failed deterministically and no deliverable was ever produced. This change switches the call to the SDK's streaming form (`messages.stream(...).finalMessage()`), which lifts the 10-minute ceiling while assembling the exact same final message the rest of the code already consumes.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer:** Runtime application code — one call site in the audited Anthropic egress path used by the Deliverable Intelligence Orchestrator (`src/lib/deliverables/orchestrator/model-caller.ts`). No schema, no data-plane, no API contract changes. Egress still flows through `preflightAnthropicDirectClient` (audit + tenant policy unchanged); only the transport (streaming vs. non-streaming) changes.

## Client Applicability

- **All clients:** Yes — every tenant that generates board-grade Move/Source/Tower deliverables benefits. The fix is unconditional (no flag); it only changes how the existing Claude call is transported.
- **Specific clients:** None singled out.
- **Internal only:** No.
- **Public/demo only:** No.
- **Feature flag:** None.

## Changes Included

- `src/lib/deliverables/orchestrator/model-caller.ts` — modified: `preflight.client.messages.create({...})` → `preflight.client.messages.stream({...}).finalMessage()`. Header comment updated.
- `src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts` — modified: egress client mock updated from `messages.create` to `messages.stream(...).finalMessage()` to mirror the call site.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator/__tests__/model-caller.test.ts src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts` → **24 passed / 24 total** (pass-routing, token budget, system+user wiring, full six-pass loop + gates).
- `npx tsc --noEmit` → no errors in the changed file (the only tsc errors are pre-existing missing optional deps `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`, unrelated to this change).
- `npx eslint` on both changed files → clean.
- **Live root-cause evidence (before fix):** real SkyHarbor Move `7416481a`, runs `77a16764` and `8f3de601` both reached terminal `failed` at the "Writing the first draft" pass with error verbatim `Streaming is required for operations that may take longer than 10 minutes`. The durable worker recorded the terminal state correctly (claim → heartbeat progress → fail), proving the queue path is sound and isolating the streaming guard as the sole blocker.
- **Post-deploy verification (to attach):** re-run a P1 Program Charter on Move `7416481a`; expect the worker to drain it to `succeeded` and a new DOCX dated 2026-06-16 to appear in the File Cabinet.

## Rollout Plan

Merge to `main` (squash). Rebuild the web image via `az acr build` and deploy to Azure Container Apps as a new web revision (health-gate → traffic shift). The durable generation worker job (`job-abarva-deliv-worker`) runs the same image, so update the job's image to the new tag in the same step. No migration. No flag flip.

## Rollback Plan

Re-point the web app revision and the worker job back to the prior image tag (`durable-64bca71b5`) and shift traffic. No data migration to unwind; in-flight runs are durable and will simply re-fail with the streaming guard under the old image (the pre-fix behavior), never corrupting state.

## Audit Evidence

- PR: (to attach on open)
- CI: jest + tsc + eslint output above
- ACA: new web revision name + worker job image tag (to attach after deploy)
- Live: File Cabinet DOCX for Move `7416481a` dated 2026-06-16, and the worker console log line `claimed run … done · processed=1` with the run reaching `succeeded`.

## Known Gaps

- The non-streaming `createAnthropicDirectTextAdapter` in `src/lib/integrations/ai-egress/anthropic-direct.ts` still uses `messages.create`. It is **not** on the deliverable path (the orchestrator calls `messages.create`/now `stream` directly via `model-caller.ts`), so it is out of scope here; any other caller that requests very large token budgets through that adapter could hit the same guard and should be migrated to streaming in a follow-up.
- Worker scheduling hardening (event-driven KEDA trigger instead of the 20-minute cron, and web-revision GC to prevent Consumption-env saturation) is tracked separately and not part of this fix.
