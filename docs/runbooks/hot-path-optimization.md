# Hot Path Optimization

Status: candidate
Owner: AbarVa engineering / operations
Backlog row: T158
Cadence: after every live pressure-test run that exceeds target or before
publishing pilot SLO/SLA commitments

## Purpose

T158 is the follow-through row after pressure testing. Load tests are useful
only if the slowest or riskiest paths become concrete fixes. This runbook
defines how to identify the top three hot paths, decide whether they are code,
database, model-provider, storage, or workflow bottlenecks, and record the
before/after evidence needed before calling the row complete.

Use with:

- `docs/runbooks/pressure-test-harness.md`
- `docs/runbooks/backend-load-regression-gate.md`
- `docs/runbooks/top-user-journey-load-tests.md`
- `docs/runbooks/load-profile-and-slo-plan.md`
- `scripts/load/pressure-test-matrix.mjs`
- `scripts/load/azure-primary-surfaces.mjs`

## Completion Rule

Do not mark T158 `Done` from this runbook alone.

T158 moves to `Done` only after:

- at least one live pressure-test evidence packet exists,
- the top three hot paths are ranked by impact,
- each hot path has an owner, root-cause hypothesis, and optimization plan,
- fixes or accepted-risk decisions are recorded,
- before/after measurements prove improvement or explain why no code change was
  appropriate,
- the tracker note links the evidence packet and final disposition.

Until then, T158 should be `In progress`.

## Hot Path Ranking

Rank candidates by user and business impact, not only raw latency.

| Rank signal | What to inspect | Why it matters |
| --- | --- | --- |
| P95/P99 latency | Load run summary, browser matrix, Lighthouse, route logs. | Finds user-visible slow paths. |
| Error rate | 5xx, fetch failures, auth redirects, provider failures. | Identifies reliability cliffs before scale. |
| Saturation | DB pool wait, queue backlog, model provider queueing, Blob/parse backlog. | Reveals capacity limits that worsen with concurrency. |
| Cost amplification | Token spikes, repeated parsing, cache misses, retries. | Protects gross margin and usage caps. |
| Workflow criticality | Home, Admin, Intelligence, Source, Moves, Tower. | Prioritizes pilot-critical flows over low-traffic pages. |

## Hot Path Taxonomy

| Bottleneck type | Common signals | First diagnostic |
| --- | --- | --- |
| Database query | Slow query logs, pool wait, repeated N+1 reads, missing index. | Capture SQL shape, row count, query plan, and caller. |
| Server render / route | High TTFB, cold start, large server component tree. | Compare cold vs warm samples and route-level traces. |
| Client bundle / hydration | Lighthouse/bundle budget regressions, slow interaction. | Inspect bundle diff, dynamic imports, and hydration warnings. |
| Model/provider | Long first token, retry bursts, provider overload. | Capture model, prompt size, cache usage, retry count, and fallback path. |
| Parsing/storage | Upload queue backlog, Blob latency, parse retry, quarantine delay. | Capture file size/type, storage path, scan/parse state, and queue time. |
| Workflow design | Too many sequential calls, avoidable refetch, duplicate work. | Draw request waterfall and remove serial dependency where safe. |

## Optimization Packet

Create one packet per pressure-test cycle:

```text
pressure-test-evidence/
  YYYY-MM-DD-hot-path-optimization/
    source-run.md
    top-three.md
    before-after.md
    accepted-risks.md
    follow-ups.md
```

`top-three.md` should include:

- rank,
- route or workflow,
- pressure profile that exposed it,
- observed p50/p95/p99 or error/cost signal,
- root-cause hypothesis,
- owner,
- planned fix or accepted-risk rationale,
- target improvement.

## Fix Patterns

| Pattern | Use when | Evidence needed |
| --- | --- | --- |
| Add or tune index | Query is selective but scanning too much data. | Query plan before/after, migration or DBA approval, rollback note. |
| Batch reads | N+1 or repeated broker reads dominate a route. | Request waterfall before/after, route p95 improvement. |
| Cache stable context | Same tenant/corpus/prompt context is recomputed frequently. | Cache key, invalidation owner, hit rate, stale-data risk. |
| Move work async | User request waits on parsing, export, notification, or enrichment. | Queue handoff evidence, retry/DLQ behavior, user-safe status copy. |
| Stream or paginate | Response or UI waits on large payload. | Payload size reduction, first meaningful render improvement. |
| Reduce prompt or enable cache | Model latency/cost driven by repeated stable context. | Token count, cache behavior, answer quality regression check. |
| Add graceful degradation | Dependency latency cannot be eliminated safely. | Fallback copy, retry policy, audit/log evidence. |

## Before / After Measurement

Each optimized hot path needs a comparable measurement:

| Measurement | Required |
| --- | --- |
| Same environment | Same staging, azure-lab, or production target unless explained. |
| Same profile | Same pressure profile, duration, concurrency, and authenticated role. |
| Same commit linkage | Before SHA and after SHA. |
| Same metric | p95, p99, error rate, cost, queue wait, or pool wait. |
| Decision | improved, no material change, accepted risk, or needs follow-up. |

Do not compare local dev to production. Do not compare unauthenticated page
loads to authenticated pilot workflows. Do not optimize against synthetic
numbers without naming the synthetic limitation.

## Pilot Go / No-Go Use

Before a pilot release, T158 evidence should answer:

- Which three hot paths were most important?
- What changed?
- What remained risky?
- What user-facing workflow is affected if the path regresses?
- What alert, rollback, or degraded-mode behavior exists?

## Related Commands

```bash
npm run load:pressure-matrix:check
npm run load:backend-regression:check
npm run load:top-journeys:check
```

## Known Limits

This runbook does not run the live pressure test or perform the optimizations by
itself. It makes the follow-through measurable so T158 can be closed only after
real hot paths are found and treated.
