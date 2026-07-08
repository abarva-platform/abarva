# Moves aVa chat hardening — live proof (2026-07-08)

Signed-in browser proof, tenant Lakeshore Holdings, Move `RETAIL-LEGAL-2026` (id `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`), P2 Discover & Diagnose. Deploy: `aca-main-deploy.yml` run [28966894228](https://github.com/abarva-platform/abarva/actions/runs/28966894228), head `49d98d20998fad47a29e036b07c9562e733efd74` (includes `0fbfdd9378ac460ae7e813cdb6222290c6b261d7`, the Moves aVa chat hardening merge, as an ancestor). ACA runtime invariant confirmed: `templateImage`/`activeImage`/`expectedImage` all match digest `sha256:1d5201f00d83c52d4bae21ee2187750a23644c5984c88abf81b600a4b3f13f3c`.

## Headline finding — root cause discovered, not the outcome hoped for

The 6 specified prompts were asked in this chat panel. The first pass (before a page reload) surfaced a conversation thread containing what looks like cross-Move/cross-tenant history (mentions of "Kyriba rollout," "Treasury bank connectivity programs" — none of which belong to this Move). Suspecting stale conversation-history contamination, the page was reloaded to start a genuinely fresh, single-turn conversation, and "What should I do next?" was asked again.

**Result on the fresh conversation:** aVa answered:

> "The strongest signal in your current data is the SOX payment approval evidence control... No active Move session is visible in this conversation, so I'm working from your Lakeshore Holdings [portfolio]... Two concrete options: (1) Start a Move to resolve the SOX evidence gap... (2) If a Move is already in flight on this, tell me which one and I'll help you assess whether it's..."

This is on the exact URL `https://app.abarva.ai/strategic-moves/908c9bf8-e745-45dc-9ad8-3d493a2a1c8a/phase/2` — a specific Move's specific phase page — and aVa explicitly states no Move is visible to it.

**Conclusion:** this is not conversation-history pollution and not a failure of the new hardening packet's content. It indicates `programId` (and therefore `surfaceContext.programId`) is not reaching the chat route's `if (programId) { ... }` branch for this live chat surface — which means **neither the pre-existing basic grounding ("Active program: ...", phase pack) nor the new Moves aVa hardening packet ever executes**, because both are nested inside that same `if (programId)` condition. The new code is additive-only and wrapped in try/catch exactly as designed — it did not error, it simply never ran, because its precondition (`programId` present) was not met on this live request.

This was not visible in local jest tests because those test the pure packet/classifier/quality-gate functions directly, not the live request payload the browser actually sends — there is no existing integration test that asserts `programId` reaches this route from the real `/strategic-moves/<id>/phase/<n>` client component.

## What was confirmed working

- No console errors on any of the 6 prompts, before or after the reload.
- No network 5xxs observed.
- No banned-language, no internal-ID/schema leaks, and no workflow-bypass claims in any answer.
- The rest of the phase-workspace UI (checklist, approved-Inputs-Pack card, feed-forward, pattern-assembly) all rendered correctly with real data on the same page load — confirming the page itself has `programId` (it's in the URL and used by the surrounding React components); the gap is specifically in what the *chat* request sends/receives server-side.
- "Can we move to the next phase?" correctly did NOT claim to approve or advance anything — it asked which program, consistent with the disallowed-actions contract (no workflow bypass), even though it lacked Move grounding.

## What was not confirmed

- Whether the Moves aVa hardening block, when it does fire (i.e. once the `programId`-reaches-the-route gap is fixed), produces phase-grounded, Source/Tower-aware, non-fabricating answers as designed and unit-tested. The pure-function layer is fully tested (37 passing tests); this live pass could not exercise it end-to-end because its precondition never triggered.

## Recommendation

Before any further Moves aVa chat hardening work, root-cause why `surfaceContext.programId` (or `body.programId`) is not reaching `/api/chat/agent` from the live `/strategic-moves/<id>/phase/<n>` chat panel — check what the client component (`StrategicMovePhaseClient.tsx` / the chat dock it mounts) actually sends in the request body versus what `canonicalizeFromBody` expects. This is a pre-existing condition (predates this session's changes) but blocks not just the new hardening layer, it also blocks the phase pack and basic "Active program" context that existed before this release — meaning the underlying issue is likely already degrading Moves aVa's answer quality broadly, not just the new hardening block.
