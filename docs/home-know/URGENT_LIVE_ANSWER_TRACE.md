# Urgent Home KNOW Answer Trace

## Status

As of 2026-06-24, the failing visible answer was produced by the live ACA revision, not by current `origin/main`.

## Step 0 Live Runtime Check

- Host: `https://app.abarva.ai`
- Container App: `ca-abarva-web-lab-eastus`
- Active revision: `ca-abarva-web-lab-eastus--ma739bc12`
- Traffic: `100%` to `ca-abarva-web-lab-eastus--ma739bc12`
- Active image: `acrabarvalab001.azurecr.io/abarva/web@sha256:4cd645ed7fad900ddae190b65f0c2f0a35927f901675c88a3038b0ac11b24aec`
- ACR tag for active image: `main-a739bc12`
- Current `origin/main`: `ff9e3713c8c0455db6ac3fa2ac7ba69ebeba8c97`
- Health endpoint: `200`, Postgres checks green

Conclusion: live ACA was not running current main. Fixing main alone would not change the visible answer until a new revision is deployed and receives traffic.

## Exact Production Path

The current Home ask path is:

1. `src/components/home/know/HomeKnowAsk.tsx`
2. `POST /api/home/know/ask`
3. `src/app/api/home/know/ask/route.ts`
4. `buildHomeKnowResponse`
5. `fetchHomeKnowPacket`
6. `buildHomeKnowResponseFromPacket`
7. `synthesizeHomeKnowProse` when `home_know_llm_synthesis` is enabled and the question is not a decision handoff
8. `validateHomeKnowResponse`
9. `repairHomeAnswerQuality`
10. `HomeKnowAnswerRenderer`

`homeKnowResponseToAvaAnswer` still exists, but it is not the visible `/home` page renderer path. It is used by `src/app/api/intelligence/ask/route.ts` through `buildHomeKnowAgentAnswer` when the Intelligence streaming route is asked to answer with Home KNOW semantics. The `/home` page posts directly to `/api/home/know/ask` and renders the returned `HomeKnowResponse`.

The older visible label `Directional answer` and left-rail page clutter came from the live `main-a739bc12` revision. Current main already changes the answer label to `Partial answer`, moves ask into the inline Home ask band, and adds the Golden composer trace metadata.

## Trace Hook

The route logs safe, development-gated trace metadata when either condition is true:

- `ABARVA_HOME_KNOW_TRACE=1`
- request header `x-abarva-debug-home-know: 1`

Logged fields:

- route
- tenant key
- intent
- answer status
- composer trace
- packet shape: facts, tables, charts, graphs, gaps

The trace does not log secrets, credentials, or raw source payloads.

## Bad Answer Source Analysis

The phrase `cannot be characterized` is not a literal in current main. The two credible sources were:

1. stale live ACA revision prior to the Golden composer/table-binding patch
2. model-generated false no-data prose when the prompt did not bind tables as context

Current main addresses both:

- The synthesis prompt binds FACTS, TABLES, and GAPS.
- The model validator rejects `cannot be characterized` or `cannot be identified` when facts or table rows exist.
- The deterministic fallback for business/IT organization synthesizes role/domain/portfolio context before naming the leader-name gap.
- The shared Home answer quality gate repairs the exact false-refusal path if it reappears before rendering.

## Exact Screenshot Question

Question:

`how is our IT and business organized today? who are our technology leaders under our CIO?`

Expected behavior:

- Home stays in KNOW mode.
- It starts with what the loaded context supports.
- It describes role/domain/portfolio-level accountability.
- It states the specific gap: named individual leaders under the CIO are not loaded.
- It does not invent names.
- It does not lead with row counts, missing-source language, or debug/proof labels.

## Deployment Hold

The ACA workflow for `ff9e3713c8c0455db6ac3fa2ac7ba69ebeba8c97` was cancelled before deploy/traffic shift after the urgent instruction said not to deploy until the exact question is proven.
