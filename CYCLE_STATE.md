# Cycle State · Cycle 1 · File 08 Per-Turn Contract

## Meta
- Cycle started: 2026-04-24T03:29:17Z (Codex lane); 2026-04-22 (Code lane)
- Cycle owner: both
- Cycle scope: File 08 Section 16 P0 items — split by lane below. Codex owns Stage 1-5/8 infrastructure and the April 24 remediation handoff Part 3 P0 items. Code owns Section 9 citation grammar, Section 10 honest-disclosure vocabulary, Section 7 rendering, Section 5 voice-contract UI, and Section 12 handoff affordance. Out of scope until this queue closes: File 08 P1 items, surface redesign work, and marketing/page polish.
- Cycle target completion: open-ended · continue until the committed P0 queue is closed, blocked with escalation, or explicitly deferred with approval

## Committed queue (ordered — do not reorder without updating this file)

### Codex lane
1. F08-S19-state-file — Create and maintain the authoritative repo-root `CYCLE_STATE.md`, adopt File 08 reporting cadence, and anchor this cycle to the Codex P0 queue.
2. P0-1-session-binding — Finish Clerk session stability and tenant binding per April 24 handoff Part 3 P0-1 and File 08 Section 16 context-dimension gaps.
3. P0-2-free-text-runtime — Complete the free-text agent runtime for Nexus + Sentinel (and honest Atlas fallback) through the File 08 Stage 1-6 contract.
4. P0-3-pattern-deliverable-graph — Add first-class pattern/deliverable bidirectional wiring plus query APIs per April 24 handoff Part 4 Contract 3.
5. P0-4-freshness-evidence — Replace hardcoded freshness/evidence counts with real manifest/graph-backed values and browsable source-of-truth.

### Code lane
1. F08-S4.6-seam — Define and publish the `rendered_response` TypeScript contract (`src/lib/agent/renderedResponse.ts`) that Code consumes and Codex produces. Stage-6/7 interface seam per §4.6. Lands first so every downstream render item has a stable shape. **STATUS: merged as-of this writing (file created in-session).**
2. F08-S9-citation — Unified `<AgentCitation>` primitive covering all 6 types from §9.1 (pattern · observation · evidence · prior-turn · program · deliverable) with HIGH/MEDIUM/LOW confidence indicators per §9.3 and broken-target handling per §9.4 and §4.7 failure semantics.
3. F08-S10-vocab — Honest-disclosure vocabulary module (`src/lib/agent/honestDisclosure.ts`) exposing confidence-tier phrases (§10.1-10.3), sparsity openers (§10.4), industry-authored vs measured helpers (§10.5), and can-not-help patterns (§10.6). Plus `<SparsitySignal>` renderer.
4. F08-S7-render — `<AgentResponse>` component that consumes `rendered_response` and lays out: sparsity prose first if flagged, response text with inline citations resolved, confidence qualifiers, follow-up chips, handoff affordance. Replaces ad-hoc text rendering in `AgentRail` bubbles for `speaker: 'agent'`.
5. F08-S5-voices — Per-agent response-structure wrappers (`src/lib/agent/voiceContracts.ts`): Nexus numbered/sectioned, Sentinel evidence-forward, Atlas 150-word cap, Steward fix-first/next/monitor.
6. F08-S12-handoff — `<HandoffAffordance>` primitive per §12.2. Button/chip with `to_agent`, reason, context-carried badge. Click navigates to target surface carrying `handoff_context` via sessionStorage.

## Current position

### Codex lane
- Current item: queue merged · Codex Cycle 1 P0 lane
- Current step within item: post-merge verification in progress · production deploy green · follow-up fix for legacy deliverable code-alias links queued for PR/merge
- Started item at: 2026-04-24T03:34:00Z
- Expected next action ETA: same session

### Code lane
- Current item: Cycle 1 Code queue closed · all six items landed in working tree · typecheck + build clean
- Current step within item: queue merged · awaiting crawler persona verification
- Started item at: 2026-04-22T00:00:00Z (resumed 2026-04-24 after Codex reclaimed state file)
- Expected PR ETA: merged as PR `#157`

## Complete this cycle
- F08-S19-state-file (Codex): authoritative repo-root cycle file created and adopted on `codex/cycle1-codex-execution`
- P0-1-session-binding (Codex): stale active-client context now clears on sign-in/sign-out/auth-redirect, auth-required redirects preserve the requested destination, and auth smoke passes against the live dev server
- P0-2-free-text-runtime (Codex): Programs/Nexus free-text route now creates/validates side-panel threads, assembles context, runs retrieval-backed synthesis, and streams citations/confidence/sparse-evidence fallback
- P0-3-pattern-deliverable-graph (Codex): bidirectional pattern↔deliverable query layer and API routes landed with ambiguity handling and fallback from graph edges to seed/manifest-backed relationships
- P0-4-freshness-evidence (Codex): authored evidence registry loader, canonical tenant/program evidence routes, real pattern evidence/freshness metrics, and registry-backed deliverable evidence chips landed with canonical route coverage
- F08-S4.6-seam (Code): src/lib/agent/renderedResponse.ts committed (no PR yet — bundled with Code lane items for a single Cycle 1 Code PR)
- F08-S9-citation (Code): src/components/agent/AgentCitation.tsx · six citation types × three confidence tiers + broken-target class, compact superscript mode for observations/evidence_source, drawer integration for evidence and observation citations
- F08-S10-vocab (Code): src/lib/agent/honestDisclosure.ts · §10.1-10.6 vocabulary arrays + opener/provenance helpers; src/components/agent/SparsitySignal.tsx · italic librarian-honest treatment (§4.7, §10.4)
- F08-S7-render (Code): src/components/agent/AgentResponse.tsx · sparsity-first render, placeholder-to-citation resolver, follow-up chips, handoff affordance slot
- F08-S5-voices (Code): src/lib/agent/voiceContracts.ts · per-agent opener/body/closer rules, word-count targets, citation cadence, forbidden-phrase lint helpers
- F08-S12-handoff (Code): src/components/agent/HandoffAffordance.tsx · explicit button with session-storage handoff carry (§12.3), one-shot read via consumeHandoffContext
- AgentRail wired (Code): AgentRail consumes RenderedResponse via the new AgentTurn.rendered field · agent bubbles use AgentResponse when rendered is present, fall back to plain text otherwise

## Blocked or escalated
- (none yet)

## Notes and discoveries
- 2026-04-24T03:18:00Z: Repo did not contain a tracked `CYCLE_STATE.md`. A pre-existing untracked draft existed for the Code lane only; this file supersedes it as the authoritative cycle record for Codex execution.
- 2026-04-24T03:20:00Z: `docs/design-canon/08-agent-fabric-per-turn-contract-backlog.md` makes the state file, fixed status cadence, and continuation default P0 and non-optional for Cycle 1.
- 2026-04-24T03:24:00Z: Fetched `origin/main` and found local `main` was stale. Execution branch `codex/cycle1-codex-execution` now tracks current `origin/main`.
- 2026-04-24T03:27:00Z: Canon review split across three explorer agents so the whole `docs/design-canon` folder is actually covered instead of sampling only the handoff and tracker.
- 2026-04-24: Codex claimed state file first and committed codex-lane queue. Code lane reconciled into the same file per §19.1 (`owner: both` is a valid schema value and File 08 Section 19 calls for ONE authoritative file at repo root). Code lane queue was previously drafted as a standalone file by Claude Code; merged here, Codex queue preserved verbatim.
- 2026-04-24: Code lane item F08-S4.6-seam (rendered_response contract) already landed to working tree at `src/lib/agent/renderedResponse.ts` prior to the merge. This is the seam Codex's Stage 6 assembly will produce against; publishing it as the shared contract unblocks parallel work.
- 2026-04-24: User asked "WHERE IS CYCLE_STATE FILE? LOCATION" — answered: `/Users/anand/Projects/nexus/CYCLE_STATE.md` (repo root, per §19.1).
- 2026-04-24T03:41:00Z: Codex patched the auth/session seam with a shared client-context storage helper. Sign-in, auth-redirect, and both sign-out paths now clear stale tenant context; auth-required redirects now preserve the requested destination with `?redirect=`.
- 2026-04-24T03:47:00Z: Fast validation passed (`tsc --noEmit`, focused eslint with pre-existing warnings only). Playwright auth smoke first failed because it targeted dead `localhost:3000`; rerun against the active dev server on `localhost:3003` passed 3 accounts and exposed 1 remaining expectation mismatch (`demo-meridian` shell does not render a `Platform` nav link).
- 2026-04-24T04:06:00Z: Worker lane P0-3 returned and was integrated locally: new bidirectional query helper plus `/api/v1/patterns/{slug}/deliverables` and `/api/v1/deliverables/{id}/patterns` routes with integration tests.
- 2026-04-24T04:09:00Z: Worker lane P0-2 returned and was integrated locally: `/api/v1/programs/[programId]/nexus/ask` now streams retrieval-backed free-text responses with thread creation, source attachments, citations, and honest sparse-evidence fallback. Context preload now includes the anchored pattern key/title.
- 2026-04-24T04:13:00Z: Auth smoke rerun passed cleanly after replacing `waitForLoadState('networkidle')` in the Playwright helper with a deterministic document-ready check. Client shell expectation was also updated to match the intentional signed-in nav (no `Platform` link).
- 2026-04-24T04:24:00Z: P0-4 implementation landed: authored evidence registries now back pattern evidence counts/freshness, seed deliverable evidence chips resolve to canonical tenant/program evidence routes, and pattern detail/preview surfaces show browsable evidence linked to those counts.
- 2026-04-24T04:29:00Z: Full Codex-lane validation is green — focused Jest suites (16 tests), canonical-routes, tenant-rescope, TypeScript, focused eslint, `next build --webpack`, and Playwright auth smoke all passed after the P0-4 route renderer was added to the canonical-route harness.
- 2026-04-24T11:11:42Z: PR `#156` (`feat: complete cycle 1 codex p0 queue`) merged to `main` at commit `8eceb3a54cfa2fc01c6d826a17875f3a904c611c`. Remaining Codex-lane work is deployment completion plus live walkthrough on Apex/Morrison, Meridian deliverables, and in-app free-text agent behavior.
- 2026-04-24: Code lane Cycle 1 queue closed in working tree. Six items merged into a single bundle so the rendered_response contract (seam) and its consumers (citation, vocabulary, renderer, voice contracts, handoff) land together — easier to review than drip PRs, and avoids a half-wired contract.
- 2026-04-24T11:37:14Z: PR `#157` (`feat: cycle 1 code lane · agent render contract`) opened from `code/cycle1-render-contract`. Remaining Code-lane work is PR review/merge plus crawler persona verification once the `rendered_response` seam is exercised end-to-end.
- 2026-04-24T11:59:13Z: PR `#157` merged to `main` at commit `e91f003517f7585706583607814966e3454577a0`; both production deploys went green. Remaining Code-lane work is crawler persona verification on differentiated cited responses.
- 2026-04-24T12:05:00Z: Live walkthrough against production found a real regression: authored legacy deliverable links like `d01-d01-program-charter` 404 even though the canonical route is `d01-program-charter`. Follow-up fix is to normalize duplicate-code legacy segments in `findDeliverableByRoute` so old authored links resolve.
- 2026-04-24T12:24:00Z: First legacy-route fix merged as PR `#158`, but live verification still found `d17-d17-decision-memo` failing because the canonical seeded slug is `d17-decision-memo-for-cxo`. Follow-up fix broadens the resolver so legacy `code-*` segments resolve when a program contains exactly one deliverable for that code.

## Last status emission
- 2026-04-24T04:26:00Z (Codex)
- 2026-04-24 · Code · Cycle 1 queue merged to main; crawler verification pending
