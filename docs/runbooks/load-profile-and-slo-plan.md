# Load Profile and SLO Evidence Plan

Status: candidate
Owner: AbarVa operations
Audience: founder, engineering, client security, procurement
Backlog tasks: T149, T159

## Purpose

This document defines the load profiles AbarVa should test before making pilot
or year-1 performance commitments. It also prevents premature SLA claims by
separating provisional targets from observed, evidence-backed SLO/SLA numbers.

Use with:

- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- `docs/pilot/SUPPORT-MODEL.md`
- `docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md`
- `scripts/load/azure-primary-surfaces.mjs`
- `npm run azure:load:primary-surfaces`

## Load Profiles

| Profile | Concurrent users | Duration | Purpose |
| --- | ---: | ---: | --- |
| Pilot baseline | 10 | 1 hour | Prove the first pilot can support normal CXO/operator traffic. |
| Year-1 max | 50 | 24 hours | Prove the expected first-year envelope before promising broader rollout. |
| Stretch ceiling | 100 | 24 hours | Find bottlenecks before they appear in a customer escalation. |
| Agent stream burst | 10 simultaneous streams | 30 minutes | Prove concurrent LLM streaming does not exhaust app/runtime resources. |
| Token runaway | 1 high-usage user | 1 hour | Verify cost caps, usage alerts, and degradation behavior. |
| Cold-start sample | 1 user per primary route | 10 runs | Measure scale-to-zero and warm path behavior separately. |

## Primary Surfaces

Every profile should cover:

- Home,
- Intelligence/agent chat,
- Moves,
- Source,
- Tower,
- Admin/setup where pilot admins operate,
- authenticated downloads or exports where relevant.

## Measurements

| Metric | Required evidence |
| --- | --- |
| HTTP success | total requests, 2xx/3xx/4xx/5xx, route-level failures. |
| Latency | p50, p95, p99 by route and by workflow. |
| Agent time | retrieval, context assembly, model call, synthesis, citation packaging. |
| Database pressure | connection count, slow queries, pool saturation, retries. |
| Azure dependencies | Service Bus lag, Blob/ADLS errors, AI Search latency, Key Vault failures. |
| Cost | token usage, model cost, parsing cost, search/query cost, infrastructure cost. |
| Quality | agent refusal/grounding/citation failures under load. |
| Degradation | user-facing fallback behavior under provider or database pressure. |

## Initial Targets

These are initial engineering targets, not final contractual SLAs:

| Experience | Initial target |
| --- | --- |
| Primary authenticated page p95 | 3 seconds after warm-up. |
| CXO answer with citations p95 | 8 seconds for normal-length prompts. |
| File/template intake status update | visible within 2 seconds after upload handoff. |
| Export/download start | 5 seconds for cached or already-rendered artifacts. |
| Error budget | 0 unhandled 5xx during pilot baseline; all expected failures have user-safe copy. |
| Cost guard | token runaway produces cap, alert, or degraded-mode evidence. |

## SLO/SLA Publication Rule

T159 is complete only when SLO/SLA commitments are based on observed
performance evidence. Until then:

- support-model values in `docs/pilot/SUPPORT-MODEL.md` remain pilot-tier
  commitments,
- this plan remains the measurement standard,
- any customer-facing SLA must name the evidence window and environment,
- no one should convert initial engineering targets into contractual promises.

## Evidence Packet

Each run produces:

- date, environment, deployment URL, commit SHA,
- profile name and duration,
- persona/session setup,
- route/workflow list,
- command used,
- summarized latency/error/cost table,
- screenshots or dashboards,
- failures and follow-up owners,
- decision: pass, pass with caveat, fail, or rerun required.

## Go / No-Go

| Gate | Go condition | No-go condition |
| --- | --- | --- |
| Pilot baseline | 10-user 1-hour run has no unhandled 5xx and p95 inside accepted target. | Route instability, auth/session flapping, cost runaway, or unexplained 5xx. |
| Year-1 max | 50-user 24-hour run has stable DB pool and acceptable route/agent p95. | Connection exhaustion, queue backlog growth, or user-visible degradation without fallback. |
| Stretch | Bottlenecks are documented with remediation path. | Unknown failure mode or data-integrity risk. |
| SLO/SLA | Evidence packet exists and leadership approves numbers. | Only guesses, local-only results, or unverifiable dashboard screenshots. |

## Open Items

- Authenticated Azure run requires valid session secret/cookie.
- Agent stream burst requires an agreed model/provider budget.
- Token runaway test requires cost cap instrumentation to be enabled.
- SLO/SLA values remain provisional until observed performance evidence is
  attached.
