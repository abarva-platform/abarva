# 2026-07-07-source-ava-grounded-guard — aVa deterministic grounding + quote-not-compute guard on Source events

## Release ID

`2026-07-07-source-ava-grounded-guard`

## Status

`candidate`

## Plain-English Summary

The Source product is deterministic: the event fact model (`source_event_facts`) plus
the archetype value-lever math own every number, and the canvas renders the computed
per-step insight and value bridge from them ($46M–$65M for the AMS pilot). aVa — the
Source chat dock — previously answered a value question ("what's my value at stake?")
from the language model's own reasoning, ungrounded in those numbers. That created a
real risk: aVa could emit a figure that CONTRADICTS the canvas, which would destroy
trust in the whole deterministic design.

This change, gated behind the existing `source_analytics` flag, does three additive
things when the chat surface carries a Source event id and the tenant is enrolled:

1. GROUNDING — it runs the SAME deterministic builders the canvas call-site runs
   (`readEventFacts` → `buildStepInsight`, and the value bridge) and injects their
   EXACT numbers into aVa's system prompt as an authoritative "DETERMINISTIC SOURCE
   GROUNDING" block. No math is re-implemented; every number is quoted verbatim from a
   builder the canvas already trusts, so the block and the canvas cannot diverge.
2. QUOTE-NOT-COMPUTE GUARD — a system directive tells aVa it may only state a $ / %
   that appears verbatim in the grounding block, must never compute/estimate/infer a
   value, must say "not computed yet — provide X" when a number is absent, and must
   never contradict the canvas. Narrative, navigation, and drafting are encouraged;
   number-invention is forbidden.
3. READ-ONLY — while grounded on an existing event, aVa's only registrable write tool
   (`commit_source_event`, which creates a brand-new event) is suppressed, so aVa
   cannot spin up a new event mid-conversation. No tool can write facts, approve gates,
   or advance stages anywhere in the chat path — those stay human-driven.

When the flag is OFF or no Source event id is present, none of this runs and the chat
behaves exactly as before. The governing rule (CLAUDE.md/AGENTS.md Tower doctrine
applied to Source): read models own values; the agent owns NARRATIVE; it must never
calculate spend/value/ROI/risk.

## Layer Impact

- `global-control-lane`: shared app/control-plane behavior, feature-gated. The change
  is a new pure grounding-context builder (`ava-grounding-context.ts`) plus wiring in
  the universal agent chat route (`/api/chat/agent`). It only activates behind the
  `source_analytics` flag AND when `surfaceContext.sourceEventId` is present, so
  un-enrolled tenants and non-Source surfaces see zero behavior change. No schema,
  migration, retrieval index, or data-plane write change — the grounding numbers are
  computed on read from facts already in `source_event_facts` using the canonical
  deterministic builders. Claude receives numbers to quote, not to compute.

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore (the only tenant in `source_analytics.includeTenants`),
  plus any tenant added via `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `source_analytics` (existing master flag for the Source value-analytics
  layer). OFF → identical to today.

## Changes Included

- `src/lib/source/facts/view/ava-grounding-context.ts` — NEW. Pure renderer
  `renderAvaSourceGroundingFromFacts` (facts → authoritative grounding block + quotable
  lines, reusing `buildStepInsight` / value bridge — no re-implemented math), the async
  DB wrapper `buildAvaSourceGrounding` (RLS-scoped `readEventFacts`, best-effort,
  never throws), and the exported `AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD` directive.
- `src/app/api/chat/agent/route.ts` — wire the missing `sourceEventId`: flag-gated
  build of the grounding block + guard (keyed off `surfaceContext.sourceEventId`,
  `isFeatureEnabled(..., "source_analytics")`, `getSourcingEvent` for the value-at-stake
  baseline + viewing stage), inject the grounding block with the source context and the
  guard first in the response guidelines, and suppress `commit_source_event` while
  grounding is active (read-only on an existing event). All additive; empty strings are
  stripped by the existing prompt join-filter when the flag is off.
- `src/lib/source/facts/view/__tests__/ava-grounding-context.test.ts` — NEW: the
  divergence eval (grounding numbers equal the canvas builders' output for the same AMS
  fixtures; live-vs-sample provenance honesty; guard forbids computing). No live LLM.

## QA / Validation

- `npx jest src/lib/source/facts/view/__tests__/ava-grounding-context.test.ts` — passed
  (6/6): the divergence eval asserts the grounding block contains the EXACT value-bridge
  headline `buildValueBridgeInsight` computes and the exact `buildStepInsight` headline
  for the same AMS fixtures; asserts LIVE vs SAMPLE/MODEL provenance; asserts the guard
  forbids computing and requires verbatim quoting.
- `npx jest src/lib/source/facts` — passed (185/185 across 14 suites); no regression in
  the Source fact/insight/value-bridge builders the grounding reuses.
- Existing agent/chat tests: the two pre-existing `route.ts` source-text-assertion
  failures (`agent-route-context-bundle`, `steward-trust-spine-wiring`,
  `agent-quality-answer-key`) were confirmed to ALSO fail on clean `origin/main`
  (stash-and-rerun) — they are pre-existing brittleness, NOT caused by this change.
- `npx eslint` on the 3 changed files — 0 errors (1 pre-existing unused-import warning
  in `route.ts` unrelated to this change, confirmed present on clean main).
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — completed
  (exit 0, 167-line non-empty log). Total errors = 131 = the documented `main` baseline;
  ZERO errors mention any changed file (`ava-grounding-context.ts`, `route.ts`, or the
  test). Net-new type errors = 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pass (this record).

Status: pass.

## Rollout Plan

Merge to `main` via squash PR to `abarva-platform/abarva`. Becomes active on the next
repo-owned ACA main deploy workflow build/deploy of the web image. No migration, no new
env var, no worker job, no runtime traffic mutation from this branch. Behavior is dark
for every tenant not in `source_analytics` (only Lakeshore today).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` is the only path
  that builds/deploys the shared web image; this change piggybacks on the normal main
  deploy. No ad-hoc `az acr build` / `docker push` / branch workflow.
- Shared runtime mutators: None. This branch performs no `az containerapp update` and
  does not shift traffic, revision weights, or the web Container App template.
- Approved image digest: N/A for this PR — the standard main deploy sets the
  digest-pinned image; this change adds no new image contract.
- ACA runtime invariant: unchanged — to be proven by the normal post-deploy digest match
  (template image = 100%-traffic revision image = worker images) after main deploy, not
  by this branch.
- Worker image invariant: unchanged; no worker job image touched.
- Feature/env flag update path: `source_analytics` (existing). No flag value changes in
  this PR — Lakeshore is already enrolled; the code activates the grounding for enrolled
  tenants only.
- Live signed-in proof required: A signed-in Lakeshore Source-event check that aVa
  quotes the canvas value-bridge number verbatim and refuses to compute a new one is
  recommended after deploy; this record is `candidate`, not `live-proven`.

## Rollback Plan

Additive, flag-gated, no schema/data/flag-value change. Fastest rollback is to revert
the squash-merge commit on `main` and let the next main deploy build the reverted image;
aVa returns to its prior ungrounded Source-event behavior. No migration to unwind, no
data written. Alternatively, removing Lakeshore from `source_analytics` disables the
grounding without a revert (the whole Source value-analytics layer is gated on it).

## Audit Evidence

- PR URL: see the opened PR on `abarva-platform/abarva` (branch
  `feat/source-ava-grounded-guard`).
- Test output: jest runs above (6/6 divergence eval, 185/185 Source facts) + eslint
  clean (0 errors) + tsc net-new 0 (131 = baseline, no changed file in the log).
- Anti-contradiction guarantee: executable in `ava-grounding-context.test.ts` — the
  grounding block's numbers equal `buildValueBridgeInsight` / `buildStepInsight` output
  for the same AMS fixtures. The grounding reuses the canvas builders directly, so the
  two cannot diverge by construction.
- Read-only assertion: on a Source event dock (`surface="source-detail"`) the only
  registrable write tool is `commit_source_event` (creates a NEW event); no tool writes
  `source_event_facts`, approves gates, or advances stages. It is suppressed while
  grounding is active.

## Known Gaps

- Not yet live-proven in a signed-in browser session against real Lakeshore facts (see
  Deployment Authority); the localhost/CI environment cannot reach the private VNet
  Postgres, so the divergence guarantee is proven at the builder level (same code path
  as the canvas), not end-to-end in the browser in this PR.
- Grounding foregrounds the current-stage insight + the event value bridge. Additional
  per-step insights (should-cost, transition risk, BAFO progress, committed value) are
  computed by the same reused builders but are not all individually threaded into the
  block yet — extending the quotable-line coverage to every insight kind is future work.
- The guard is a strong system directive, not a hard output filter; a numeric-output
  linter over aVa's Source replies (reject a $ not present in the grounding block) is a
  possible future hardening beyond this prompt-level guard.
- This grounds the `/api/chat/agent` dock path (the aVa dock). The separate
  `/api/v1/source/[eventId]/nexus/ask` route already carries its own citation discipline
  in `sentinel-chat-llm.ts`; aligning it to the same quote-not-compute guard is future
  work.
