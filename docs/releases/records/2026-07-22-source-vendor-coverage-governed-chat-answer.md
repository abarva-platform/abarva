# 2026-07-22-source-vendor-coverage-governed-chat-answer — Source aVa chat: first governed structured answer (vendor response coverage)

## Release ID

`2026-07-22-source-vendor-coverage-governed-chat-answer`

## Status

`candidate` — merged pending; typecheck/lint/test clean locally. Live signed-in proof to be
captured and appended after deploy (see Audit Evidence).

## Plain-English Summary

Source's event-canvas aVa chat has always been prose-only, even though a real, already-live
table/chart rendering pipeline (`AgentAnswerRenderer`, driven by an `AvaAnswerPacket`) already
works in production on Home, Intelligence, and Tower. This release wires the first Source
question — "how did vendors respond to our value-lever asks?" — into that same pipeline, so
asking it in the event chat now returns a real per-vendor coverage table instead of prose only.

The numbers in that table are never recomputed: they come from `buildResponseCoverageInsight`,
the exact same builder the canvas's Responses-stage panel already renders, so the chat answer
can never contradict what's on screen.

Separately, this session found that Home/Intelligence's own chat-answer path never actually
invokes the platform's mandatory Context & Corpus Governance gate
(`buildValidatedAgentContextBundle`, per `AGENTS.md`) — it hardcodes `safety.tenantFencePassed:
true` with no override. That gap is flagged separately (see
`docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`, "Known gap (2026-07-22)")
and deliberately NOT fixed here — retrofitting Home/Intelligence is separate follow-up. This
release instead makes the new Source vendor-coverage answer the **first** live call site to
actually invoke that gate, honestly.

**Known, deliberate limitation** (see Known Gaps): the fact rows backing this answer
(`source_event_facts`) are never indexed anywhere today, so every governed candidate this
module builds is honestly `retrievability: "not_indexed"` / `agent_readiness_status:
"not_reviewed"`. The gate is invoked with `requireAgentReady: false` — not as a convenience
default, but because `true` would permanently block this feature; a unit test proves the
`false` setting is load-bearing (the identical candidates get blocked under `true`).

## Layer Impact

- `global-control-lane`: extends `composeAvaAnswer` (shared by Home/Intelligence/Tower/Source)
  with a purely additive, default-preserving optional field; extends the Source event-facts
  reader with a new sibling function; adds one new governed-answer module and an opt-in NDJSON
  branch on the Source event-canvas ask route; wires the canvas chat UI to parse it.

## Client Applicability

- All clients: yes — no gate, no flag. Every Source tenant with vendor-response facts captured
  for an event gets a real table when they ask a vendor-coverage question in that event's chat.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — gated instead by real data presence (no vendor-response signal → the
  module returns `null` and chat behaves exactly as before, prose-only).

## Changes Included

- `src/lib/ava-answer/composeAvaAnswer.ts` — added optional `tenantFencePassed?: boolean` to
  `ComposeAvaAnswerInput`, defaulting to `true` when omitted. Every existing caller
  (Home/Intelligence/Tower) is unaffected — none derive this field today, so the default
  preserves their exact current packet shape.
- `src/lib/source/facts/event-facts-reader.ts` — new sibling reader
  `readVendorLeverResponseFacts()` (alongside the existing `readVendorLeverResponses()`, left
  unchanged for its existing callers). Same `(vendor, lever)` newest-wins dedup, but keeps the
  per-row `id` / `source_citation` / `confidence` the existing function drops — exactly what a
  governed candidate needs.
- `src/lib/source/ava/vendor-coverage-governed-answer.ts` — new module:
  - `factConfidenceToConfidenceLevel()` — explicit mapper from `FactConfidence`
    (`'low'|'med'|'high'`) to `ConfidenceLevel` (`'low'|'medium'|'high'|'unverified'`); the
    string values don't match 1:1, so this is a real mapping function, not a cast.
  - `governedCandidateFromVendorLeverFact()` — maps one fact row to a `GovernedCandidate`:
    real `id`/`client_key`/`tenant_id`/`source_basis`/`confidence_level`; honest constants for
    `classification: 'confidential'`, `retrievability: 'not_indexed'`,
    `agent_readiness_status: 'not_reviewed'`, `cited_render_verified_at: null`.
  - `avaCitationsFromGovernedCandidates()` — mirrors Intelligence's own
    `answerCitationsFromAskSources()` adapter pattern; builds real `AnswerCitation[]` from the
    bundle's `usable` candidates.
  - `buildVendorCoverageGovernedAnswer()` — the orchestrator: reads facts, resolves the value
    archetype, calls `buildResponseCoverageInsight` (never re-derives numbers), maps candidates,
    calls `buildValidatedAgentContextBundle(candidates, { requireAgentReady: false })` — **the
    first live invocation of this gate anywhere in the codebase** — and returns either a real
    `composeAvaAnswer()` packet with a real table + real citations, an honest `status: 'blocked'`
    packet with no table when the gate blocks everything, or `null` when there's no vendor
    signal / no archetype / no vendor rows to show (never a fabricated placeholder).
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — added an opt-in NDJSON branch
  (mirrors `/api/intelligence/ask`'s existing `Accept: application/x-ndjson` convention). Every
  caller that omits the header gets the exact unchanged JSON response. A caller that sends the
  header always gets NDJSON back: a `{type:"summary", ...}` line carrying the same prose payload
  as before, plus — only when the prompt looks like a vendor-coverage question (new
  `looksLikeVendorCoverageQuestion()` keyword heuristic, mirroring the existing
  `wantsTableArtifact`-style pattern in `structured-exhibits.ts`) and a governed answer builds
  successfully — a second `{type:"agent-answer", answer}` line. Also fixed a real bug found
  while wiring this: the route passed `liveEventDetail?.eventType`, a field that does not exist
  on `SourcingEventDetail` (a `tsc` error caught it); the real field is `.archetype`.
- `src/components/source/canvas/UniversalCanvasShell.tsx` — `handleAgentMessage` now sends
  `Accept: application/x-ndjson` and parses NDJSON lines (mirrors `AvaAsk.tsx`'s existing parse
  loop), falling back to a single `res.json()` read if the response has no body stream. Sets
  the new `agentAnswer` field on the pushed `ChatMessage` when an `agent-answer` line arrives.
- `src/components/source/canvas/AvaBottomBar.tsx` — **real gap found beyond the original plan**:
  the plan assumed `AgentDock`'s already-generic `AgentAnswerRenderer` wiring covered this
  surface, but the event-canvas chat thread is rendered by this separate, custom component, not
  by `AgentDock` itself, and it never rendered `msg.agentAnswer` at all. Added the
  `AgentAnswerRenderer` import and render (`showProse={false}`, since the markdown body already
  shows the directAnswer) — without this, the packet would have been computed and attached but
  never actually visible to a user.
- `src/components/source/SourceEventsAgentDockView.tsx` — fixed the `isSourceSurface()` string
  mismatch: this file passed `surface: 'source/events'` (no leading slash) to `/api/chat/agent`,
  which `isSourceSurface()` there only matches as `'/source'`, `.startsWith('/source/')`, or the
  literal `'source-detail'` — `'source/events'` matched none of the three, so the portfolio
  dock never got Source-scoped access policy applied. Fixed to `'/source/events'` in both the
  fetch body and the `AgentDock` `surface` prop (plain `string` type, no breaking change). Per
  the plan's non-goals, `/api/chat/agent/route.ts` itself was **not** touched — only this
  caller's mismatched literal.
- Tests (all new):
  - `src/lib/ava-answer/__tests__/composeAvaAnswer.test.ts` — 2 new cases: omitting
    `tenantFencePassed` preserves `safety.tenantFencePassed: true`; passing `false` produces a
    packet whose `safety.tenantFencePassed` is actually `false`.
  - `src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts` — the confidence
    mapper (all 3 values), the candidate mapper (real fact row in, honest field mapping out,
    including the null-citation case), the citation adapter (shape + the 8-item cap), and 3
    cases against the real `buildValidatedAgentContextBundle` gate: honestly-mapped candidates
    are usable under `requireAgentReady: false`, the identical candidates are blocked under
    `requireAgentReady: true` (proves the `false` default is load-bearing, not cosmetic), and a
    `restricted` classification is still blocked even under `requireAgentReady: false` (proves
    the module never silently degrades a sensitive candidate into a fabricated table).
  - `src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts` — the
    NDJSON intent heuristic, following the same source-literal-assertion pattern already used
    in `src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts` for an
    unexported, route-local helper (the full route has no existing test harness — see Known
    Gaps).

## QA / Validation

- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — clean on every changed file. Caught and fixed 2 real bugs during this pass:
  the `liveEventDetail.eventType` → `.archetype` field-name error above, and a redundant
  `bundle.decision !== 'block'` comparison in `vendor-coverage-governed-answer.ts` that
  TypeScript correctly flagged as having no overlap (the block branch already returns earlier,
  so the value is always `true` at that point — simplified to a literal `true` with a comment).
  Only the pre-existing, unrelated `@xyflow/react`/`@dagrejs/dagre` missing-module errors remain
  (confirmed pre-existing: absent from `node_modules` on `main` too, package.json/install drift
  unrelated to this change).
- `pass` — `npx eslint` on all 10 changed/new files — 0 errors (9 pre-existing unused-var
  warnings in `UniversalCanvasShell.tsx`, all far from the touched code, confirmed unrelated).
- `pass` — new/updated tests: 13 cases in `composeAvaAnswer.test.ts` +
  `vendor-coverage-governed-answer.test.ts` combined, 3 cases in
  `vendor-coverage-intent.test.ts` — 16/16 pass.
- `pass` — full regression sweep, `npx jest src/lib/source src/lib/ava-answer
  src/lib/governance` — 10 suites / 32 tests fail both before and after this change (verified
  identical via `git stash` against the unmodified baseline) — zero regressions introduced.
- `manual` — live signed-in browser proof pending (see Audit Evidence — to be appended after
  deploy).

## Rollout Plan

Merge to `main` via the repo-owned ACA main-deploy workflow. No migration, no flag — the NDJSON
branch is opt-in by request header, and the governed-answer module returns `null` (no behavior
change) whenever there's no vendor-response signal for the event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be verified after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Reverting restores prose-only Source chat, the pre-fix
`isSourceSurface` mismatch on the portfolio dock, and removes the new NDJSON branch entirely —
no data migration either direction; `source_event_facts` and its schema are untouched.

## Audit Evidence

- PR: to be recorded on open.
- Deploy run: to be recorded after merge.
- ACA runtime invariant: to be recorded after merge and deploy.
- Live signed-in proof: to be captured — ask a real vendor-coverage question on a real event
  with real vendor-response data, confirm a real table renders via `AgentAnswerRenderer` with
  real citations.
- Test/typecheck/lint logs: see QA / Validation.

## Known Gaps

- **Retrievability ceiling (deliberate, not an oversight)**: `source_event_facts` is not
  indexed anywhere in the platform today, so every candidate this module builds is honestly
  `retrievability: "not_indexed"` and can never reach `agent_readiness_status: "agent_ready"`
  under the current two-state retrievability model (`RETRIEVABLE_STATES` = `fts_indexed` /
  `search_indexed` only). `requireAgentReady: false` is required for this feature to ever
  produce a non-blocked answer while staying honest — proven load-bearing by a unit test that
  shows the identical candidates blocked under `requireAgentReady: true`. No new
  `RETRIEVABILITY` state was added in this pass; that's real follow-on work, not done here.
- **Home/Intelligence governance gap — flagged separately, not fixed here**: those surfaces'
  `composeAvaAnswer` call sites still hardcode `safety.tenantFencePassed: true` with no real
  gate behind it. See `docs/governance/CONTEXT_CORPUS_ENFORCEMENT_TRACKER_2026-06-08.md`,
  "Known gap (2026-07-22)". Retrofitting those call sites is deliberate, separate follow-up per
  explicit user decision this session.
- **`/api/chat/agent` untouched by design**: the portfolio-level Source dock's chat route was
  not extended with this capability — it has no `eventId` in scope and structurally cannot
  answer a per-event vendor-coverage question. Only the `isSourceSurface` string-mismatch bug
  on that dock's caller was fixed (see Changes Included); the route itself is unchanged.
- **No dedicated route test harness for `nexus/ask`**: the full route has heavy, real data-plane
  and Claude-egress dependencies with no existing mock harness (zero prior tests). The NDJSON
  intent-gate heuristic is unit-tested directly; the actual wire behavior needs the live
  signed-in proof above rather than a heavily-mocked route test.
- Value-waterfall and artifact-quality chat answers are not built in this pass — vendor
  coverage is the first, narrowly-scoped proof of this pattern only.
