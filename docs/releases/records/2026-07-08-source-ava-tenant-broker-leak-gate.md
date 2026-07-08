# 2026-07-08-source-ava-tenant-broker-leak-gate — Source aVa chat: second off-topic-content leak (follow-up to #4602)

## Release ID

`2026-07-08-source-ava-tenant-broker-leak-gate`

## Status

`candidate`

## Plain-English Summary

**This is a follow-up to #4602 (`db2350a0b`, "Source aVa polish gate", merged and
deployed), which did NOT fully resolve the symptom it targeted.** #4602 fixed one
real off-topic-content leak, but two independent live re-tests after that fix shipped
— one same-tab, one a genuinely fresh tab with zero conversation history — both
showed the SAME class of bug still happening, with DIFFERENT fabricated-sounding
content each time. That ruled out a stale-deploy/cache explanation and confirmed a
second, still-live generic-content-injection mechanism that #4602 never touched. This
record documents that second mechanism, found by static tracing (not guessed) and
fixed with the same discipline #4602 used.

**Confirmed-still-broken symptom (pre-fix):** on Source event
`adcb1cd0-c586-4622-bd29-574cc5a10862` (Lakeshore Holdings AMS), RFP stage, asking aVa
"What evidence is missing?" produced off-topic answers unrelated to the event's real
data (RFP clause coverage, volumetrics, vendor bids) — instead surfacing portfolio-style
KPI/benchmark framing ("SOX payment approval evidence flagged... benchmark pack shows
Lakeshore at 22 against a top-quartile of 69...", "220 active users and $18.9M in
measured value...").

**What #4602 fixed (confirmed correct, not re-touched here):**
`shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)` correctly gates
`contextBundlePromptBlockForPrompt` (the `getContextBroker().assemble` "CONTEXT BROKER
RECEIPT" mechanism) to empty once a grounded Source mode has fired.
`isGroundedAnswerMode('evidence_readiness')` was verified directly (it is `true` via
`PHASE_A_IMPLEMENTED_MODES`), and the classifier regex for "what evidence is missing?"
was verified to match `evidence_readiness.missing` in isolation — so the per-mode gate
and classification are both correct. Neither was the remaining bug.

**Root cause of the SECOND leak (found by static trace + reproduced with a standalone
Node script simulating the route's exact branch logic):**

1. `agentTenantContextBlock` ("PR-R / CXO grounding") in
   `src/app/api/chat/agent/route.ts` is a wholly SEPARATE broker call from
   `contextBundlePromptBlock` — built via `buildProgramsContextBundle` /
   `buildProgramsContextBundleAsync` → `buildEnterpriseAgentContextBundle` /
   `buildEnterpriseAgentContextBundleAsync`
   (`src/lib/knowledge/agent-context-broker.ts`). It is gated only by
   `isTenantCurrentStateSurface` (any non-auth, non-sign-in surface with an active
   tenant) — it was NEVER gated by `shouldSuppressGenericContextBundleForSourceMode`
   or `isGroundedAnswerMode`. #4602's test suite
   (`source-ava-polish-gate.test.ts`) only pins the `contextBundlePromptBlockForPrompt`
   wiring — it never asserted anything about `agentTenantContextBlock`, so this second
   path had no regression coverage.
2. On this route, `agentName` normalizes to `"Sentinel"` by default
   (`normalizeEnterpriseAgentName`, falls back to `"Sentinel"` for anything that isn't
   exactly `"Nexus"`/`"Atlas"`/`"Steward"`). The broker's Sentinel branch in the
   persisted-data path (`selectPersistedContextItems`, `agent-context-broker.ts`
   ~line 790) unconditionally fetches `kpi_dictionary` (24 rows), `it_landscape`,
   `cross_program_signals`, `evidence_ledger`, and chunk-based retrieval across
   `application_portfolio` / `initiative_financials` /
   `regulatory_and_dependency_context` / `vendor_contract` / `sponsor_signal` — all
   TENANT-WIDE portfolio/KPI data with no Source-event scoping whatsoever — and this
   gets formatted into `agentTenantContextBlock` and injected into the same system
   prompt as the correctly Source-scoped grounding. This explains the symptom
   precisely: the leaked content is REAL, live, per-tenant KPI/signal data (not a
   fixed cached string), so it differs each call while still being off-topic for a
   Source-event evidence question — exactly what both live re-tests showed.
3. Compounding factor found in the same trace: the Source event-detail canvas
   (`UniversalCanvasShell.tsx`, and
   `source/events/[eventId]/approval/page.tsx`) passes the literal surface value
   `"source-detail"` (no leading slash) — but the route's local `isSourceSurface()`
   helper only matched `"/source"` / `"/source/*"`. That means on the actual
   event-detail page, the CORRECTLY Source-scoped `sourceTenantContextBlock` /
   `sourceAccessPolicy` / `sourceClientKey` code paths never ran at all (all three
   are gated by `isSourceSurface(surface)`), while the generic, off-topic
   `agentTenantContextBlock` ran unconditionally. So the event page was receiving
   ONLY the wrong (generic tenant-wide) broker context and none of the right
   (Source-scoped) broker context — a second, independent bug in the same file that
   compounds the first.
4. Tool-call hypothesis (from the investigation brief) was checked and RULED OUT with
   evidence: `getRelevantTools(surface)` for `surface === "source-detail"` only
   returns `commit_source_event` (the only tool whose `surfaces` array includes
   `'source-detail'` — see `src/lib/agent/tools/source/commitSourceEvent.ts`), and
   that tool is already filtered out whenever `sourceAvaGroundingBlock !== ""`
   (pre-existing code, unrelated to this fix). No tool with a generic "search
   enterprise context" / "get program risks" capability is ever registered for this
   surface — the registry has no `'*'`-wildcard tool. The leak is 100% a
   prompt-injection path, not a model-initiated tool call.

**Fix:**

- `src/app/api/chat/agent/route.ts` — derives `agentTenantContextBlockForPrompt` from
  the SAME `shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`
  predicate #4602 already wired, mirroring the existing
  `contextBundlePromptBlockForPrompt` pattern exactly. The system-prompt array now
  references the derived, suppressible variable instead of the raw
  `agentTenantContextBlock`.
- `isSourceSurface(surface)` now also matches the literal `"source-detail"` value, so
  the Source-scoped access policy, client-key resolution, and Source-scoped broker
  block all activate on the real event-detail canvas as originally intended (this
  also fixes the pre-existing "SOURCE CONSULTING PARTNER STYLE" voice instructions
  and the Source access-policy prompt block, which were silently not applying on
  `source-detail` either, for the same root reason).

## Layer Impact

- `global-control-lane`: shared chat-answer behavior for `/api/chat/agent`. Both
  fixes are conservative and additive: `agentTenantContextBlockForPrompt` is only
  empty when `shouldSuppressGenericContextBundleForSourceMode` is true (i.e. only on
  Source turns where a grounded, non-passthrough answer mode has already fired) — no
  other surface or turn changes behavior. `isSourceSurface` broadening only adds the
  literal `"source-detail"` string to an existing `||` chain — every other surface's
  match result is unchanged (verified: `/tower`, `/programs`, `/home`, and bare
  `"chat"` all still return `false`).
- `client-data-lane`: none. No schema, migration, or data-plane change.

## Client Applicability

- All clients / all tenants with `source_analytics` enabled: yes — same reach as
  #4602 (Lakeshore in lab today). The `agentTenantContextBlockForPrompt` suppression
  only activates inside the existing `sourceAvaAnswerMode` classification, which is
  itself gated by the existing `source_analytics` flag and a present
  `surfaceContext.sourceEventId`.
- Specific clients: n/a beyond the existing `source_analytics` flag.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `source_analytics` (unchanged; reused, not newly introduced).

## Changes Included

- `src/app/api/chat/agent/route.ts`:
  - Derives `agentTenantContextBlockForPrompt` from
    `shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`, using the
    same predicate #4602 introduced. Empty string when a grounded Source mode has
    fired; otherwise the raw `agentTenantContextBlock`, unchanged.
  - Replaces the raw `agentTenantContextBlock` reference in the `systemPrompt` array
    with the derived `agentTenantContextBlockForPrompt`.
  - `isSourceSurface(surface)` now also returns `true` for the literal string
    `"source-detail"` (previously only `"/source"` / `"/source/*"`).
- `src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts`
  (new) — source-inspection regression test (route.ts is too heavy for a full-stack
  test, matching the existing `agent-route-context-bundle.test.ts` /
  `source-ava-polish-gate.test.ts` pattern):
  - Pins that `agentTenantContextBlockForPrompt` is derived from
    `shouldSuppressGenericContextBundleForSourceMode(sourceAvaAnswerMode)`.
  - Pins that the `systemPrompt` array references the derived variable, not the raw
    `agentTenantContextBlock`.
  - Pins that `isSourceSurface` recognizes the literal `"source-detail"` surface.
  - A standalone reimplementation of `isSourceSurface`'s logic is asserted against
    the concrete surface values the real Source event-detail canvas sends
    (`"source-detail"`, `"/source"`, `"/source/events"`) and against unrelated
    surfaces (`/tower`, `/programs`, `/home`, `"chat"`), to pin the exact behavior a
    future refactor of the helper must preserve.
  - Verified this test suite FAILS (4 of 7 tests) against the pre-fix route and
    PASSES (7 of 7) against the fixed route — confirmed by stashing/restoring the
    route change and re-running.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — 0 errors. **Net-new = 0 (repo baseline is 0 on
  origin/main). Status: pass.**
- `npx eslint src/app/api/chat/agent/route.ts
  src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts` — 0
  errors. One pre-existing warning
  (`'sanitizeAutonomousDecisionLanguage' is defined but never used`) confirmed
  present on unmodified `origin/main` too (checked via `git stash` + re-run) — not
  introduced by this change. **Status: pass.**
- `npx jest src/lib/source/ava/__tests__` — 186 tests, all green (existing Phase
  A/B/C + polish-gate suite untouched and unaffected).
- `npx jest src/lib/source/ava/__tests__
  src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts
  src/app/api/chat/agent/__tests__/source-ava-tenant-broker-leak-gate.test.ts
  src/app/api/chat/agent/__tests__/source-l7-discipline.test.ts` — 195 tests, all
  green.
- Full-repo-adjacent check: `npx jest src/lib/source/ava/__tests__
  src/app/api/chat/agent/__tests__` shows 3 pre-existing failures
  (`agent-quality-answer-key.test.ts`, `agent-route-context-bundle.test.ts`,
  `steward-trust-spine-wiring.test.ts`) — confirmed IDENTICAL (same failing
  assertions, same count) with this branch's route.ts change stashed out, i.e.
  present on unmodified `origin/main` too. These are a pre-existing single/double
  quote string-match drift unrelated to this fix; not touched or worsened here.
  **This PR introduces zero net-new test failures.**
- New regression test verified to actually catch the regression: ran it against the
  pre-fix `route.ts` (via `git stash`) — 4 of 7 assertions failed exactly as
  expected, then passed cleanly once the fix was restored.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — run before
  finalizing this record; see PR for the passing output.
- No live signed-in browser re-test was performed as part of this change (no live
  LLM/browser session available in this sandbox). This record does NOT claim
  `live-proven` — see Known Gaps.

## Rollout Plan

Merge to `main` via squash. No DB migration, no schema change, no new feature flag.
The fix only activates inside the existing `source_analytics`-gated Source
mode-grounding branch (reuses the exact predicate #4602 introduced) plus one
string-equality broadening in a route-local helper. No traffic shift, no runtime
image change is performed by this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged; not
  invoked by this PR).
- Shared runtime mutators: none. This PR does not mutate shared web traffic, revision
  weights, env vars, or the web Container App template.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected — no image or template mutation.
- Worker image invariant: unaffected — no worker job change.
- Feature/env flag update path: none — reuses the existing `source_analytics` flag;
  no new flag introduced.
- Live signed-in proof required: yes, before claiming `live-proven` — a signed-in
  Lakeshore RFP-stage "What evidence is missing?" turn (ideally in a genuinely fresh
  tab, matching how the persisting bug was originally confirmed) showing an on-topic
  Source evidence-readiness answer with no portfolio-KPI/benchmark framing. NOT
  claimed in this record — this PR is `candidate`, not `live-proven`, exactly like
  #4602 was when it was merged (and #4602's un-verified `live-proven` claim is the
  reason this follow-up exists).

## Rollback Plan

Revert the PR. No migration was applied, so there is nothing to unwind at the DB
layer. Reverting restores the exact prior behavior: `agentTenantContextBlock` would
again be injected unconditionally, and `isSourceSurface` would again fail to
recognize `"source-detail"` — a clean, code-only rollback.

## Audit Evidence

- PR URL: see the branch `fix/source-ava-second-context-leak` PR on
  `abarva-platform/abarva`.
- Prior release record for the mechanism this follows up on:
  `docs/releases/records/2026-07-08-source-ava-polish-gate.md` (#4602,
  `db2350a0b`) — note its own "Known Gaps" section already flagged
  "Live signed-in Lakeshore proof... is pending" and its "Deployment Authority"
  section stated live proof was required but not yet performed. That gap is exactly
  why the underlying symptom (still present, different mechanism) was not caught
  before merge.
- Live-found context (this PR): two independent live browser re-tests on Source
  event `adcb1cd0-c586-4622-bd29-574cc5a10862` (Lakeshore Holdings AMS), RFP stage —
  one same-tab, one fresh-tab with zero conversation history — both showing
  off-topic, differing content on "What evidence is missing?" after #4602 shipped.
- Standalone Node reproduction of the route's branch logic (`isSourceSurface`,
  `isTenantCurrentStateSurface`, the broker-surface ternary) confirming
  `agentTenantContextBlock` fires and `sourceTenantContextBlock` does not, for
  `surface === "source-detail"` — captured in this investigation's working notes.
- tsc / eslint / jest output captured in this record's QA section and in the PR
  description.
- No migration file added or applied.

## Known Gaps

- **Live signed-in proof is NOT included in this record.** This sandbox has no live
  LLM/browser session available to re-run the exact two live-found questions against
  the deployed route. Per the runtime invariant policy, this PR must not be
  represented as `live-proven` until a signed-in Lakeshore RFP-stage re-test (ideally
  fresh-tab, matching how the persisting bug was found) is captured post-deploy.
- This record does not audit whether OTHER agents (Nexus/Atlas/Steward) or other
  surfaces have an analogous unsuppressed `agentTenantContextBlock` leak against
  their own grounded/deterministic answer paths (e.g. Tower's `sourceAvaAnswerMode`-
  equivalent, if one exists) — this fix is scoped to the Source aVa mode-grounding
  gate specifically, mirroring #4602's scope exactly. A broader audit of every
  surface's tenant-broker gating is out of scope here.
- The three pre-existing test failures noted in QA/Validation
  (`agent-quality-answer-key.test.ts`, `agent-route-context-bundle.test.ts`,
  `steward-trust-spine-wiring.test.ts`) are out of scope for this PR — confirmed
  identical on unmodified `origin/main`, not touched or worsened here.
