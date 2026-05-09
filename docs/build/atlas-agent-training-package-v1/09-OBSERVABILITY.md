# 09 · Observability

**Purpose:** what Atlas writes to traces, how operators grade those traces, and how the observation cycle drives Atlas tuning. Without observability, Atlas is a black box. With it, Atlas is a tunable instrument.

---

## What Atlas already logs

The existing infrastructure (per migration `20260421152100_atlas_message_traces.sql` and `20260421152000_atlas_observations.sql`):

| Table | Purpose | Atlas writes |
|---|---|---|
| `atlas_threads` | session context | one per chat thread |
| `atlas_observations` | persisted observations from chat turns | summary, severity, observationKind |
| `atlas_message_traces` | turn-level provenance | route_type, intent, latency, prompt_version |

Atlas v1 reasoning **adds** richer trace shape to support the failure-mode grading in `08-FAILURE-MODES.md`.

---

## The Atlas reasoning trace

Every right-rail render that runs through Atlas reasoning emits a trace row with:

```ts
interface AtlasReasoningTrace {
  traceId: string;
  threadId: string | null;       // null for page-load renders, set for chat turns
  tenantId: string;
  userId: string | null;
  timestamp: string;
  trigger: 'tower_right_rail_render' | 'atlas_chat_turn';

  // Input summary (not the full substrate; just shape)
  inputSummary: {
    initiativesCount: number;
    vendorsCount: number;
    pressuresCount: number;
    bandConfidenceFloor: 'high' | 'med' | 'low' | 'none';
    lens: TowerLens;
    todayIso: string;
  };

  // Pattern selection (deterministic pre-LLM decision)
  patternsFired: ReadonlyArray<PatternId>;
  patternsSkipped: ReadonlyArray<{ pattern: PatternId; reason: string }>;

  // Output
  observations: ReadonlyArray<{
    number: number;
    topic: string;
    body: string;
    confidenceFloor: 'HIGH' | 'MED' | 'LOW';
    citationsCount: number;
    actionsCount: number;
  }>;
  ifYouOnlyDoOneToday: string;

  // Citations (the contract enforcement layer)
  citations: ReadonlyArray<AtlasCitation>;

  // Quality signals
  interpretationConfidence: 'high' | 'med' | 'low';
  fallbackUsed: boolean;          // true → renderer fell back to deterministic T-7
  fallbackReason?: string;        // 'timeout' | 'low_confidence' | 'parse_error' | etc.

  // Performance
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;

  // Versioning
  model: string;                  // e.g. 'claude-sonnet-4-5'
  promptVersion: string;          // e.g. 'tower-w5-v3-atlas-reasoning'
  packageVersion: 'v1.0.0';       // the training package version
}

type PatternId =
  | 'pattern_01_top_pressure'
  | 'pattern_02_shared_root'
  | 'pattern_03_defend_while_resolving'
  | 'pattern_04_vendor_clock'
  | 'pattern_05_look_ahead'
  | 'pattern_06_healthy_posture';
```

This shape is wide. The point is to make every Atlas decision auditable: which patterns fired, which were skipped, why, and what the cited substrate was.

---

## Where the trace lives

**Storage:** new table `atlas_reasoning_traces` (parallel to `atlas_message_traces`):

```sql
CREATE TABLE atlas_reasoning_traces (
  trace_id            VARCHAR(80) PRIMARY KEY,
  thread_id           VARCHAR(80) REFERENCES atlas_threads(id),
  tenant_id           UUID NOT NULL REFERENCES clients(id),
  user_id             VARCHAR(120),
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trigger             VARCHAR(40) NOT NULL,

  input_summary       JSONB NOT NULL,
  patterns_fired      JSONB NOT NULL,
  patterns_skipped    JSONB NOT NULL,
  observations        JSONB NOT NULL,
  if_you_only_do_one  TEXT,
  citations           JSONB NOT NULL,

  interpretation_confidence VARCHAR(8) NOT NULL,
  fallback_used       BOOLEAN NOT NULL DEFAULT FALSE,
  fallback_reason     VARCHAR(80),

  latency_ms          INTEGER,
  prompt_tokens       INTEGER,
  completion_tokens   INTEGER,

  model               VARCHAR(80) NOT NULL,
  prompt_version      VARCHAR(80) NOT NULL,
  package_version     VARCHAR(20) NOT NULL
);
```

Indexes on (`tenant_id`, `timestamp DESC`), (`prompt_version`), (`fallback_used`).

**Surface:** `/admin/atlas/traces` (proposed). Filterable by tenant, date range, prompt version, fallback status. Each row clickable into a detail view showing the full trace JSON.

---

## The grading workflow

Operators (or Atlas tuning sessions) sample traces and grade them. The grading rubric maps to the failure modes in `08-FAILURE-MODES.md`.

### Sampling strategy

Daily cron job samples:

- 5 traces per tenant per day (15 traces/day across 3 tenants)
- 100% of traces with `fallback_used = true` (the safety net fired; understand why)
- 100% of traces with `interpretation_confidence = 'low'`
- 50% of traces from new prompt versions in their first 48 hours (high observation density on changes)

Total: ~25-40 traces/day. Manageable for one operator-hour daily.

### Grading per trace

For each sampled trace, the grader runs:

1. **Citation completeness probe** — automated: every numeric in observation bodies has a citation
2. **Schema validity probe** — automated: every citation field exists in the schema
3. **Tenant scope probe** — automated: every cited initiativeId/vendorId belongs to the tenant
4. **Pattern correctness probe** — automated: each `patterns_fired` had its trigger satisfied; each `patterns_skipped.reason` is plausible
5. **Compression probe** — manual or LLM-grader: each observation has at least one structural sentence
6. **Voice probe** — manual: no fluff, no cheerleading, no "approximately"
7. **Refusal probe** — manual: when refusal expected (per `05-BOUNDARIES-AND-HANDOFFS.md`), did Atlas refuse cleanly?

### Grading verdict

Per trace:

```
Pass = all automated probes pass + manual probes pass
Soft fail = automated probes pass; manual probes flag voice/compression
Hard fail = any automated probe fails (Severity 1 from 08-FAILURE-MODES.md)
```

Hard fails trigger:

- Immediate flag in /admin/atlas/traces with Severity 1 marker
- Daily digest to ops on Severity 1 count
- Auto-disable of the prompt version if Hard-fail rate > 5% over 100 consecutive traces

Soft fails feed the tuning queue.

---

## Tuning loop

Weekly cycle:

1. **Mon morning:** review last week's trace digest. Count Severity 1, Severity 2, Severity 3 issues.
2. **Mon afternoon:** identify the top 3 patterns of soft failures (e.g., "Pattern 02 fires too often when only 2 rows support it").
3. **Tues:** draft prompt v3.x updates: tighter system prompt language, additional few-shot examples, refined pattern triggers.
4. **Wed:** dev branch with new prompt version; run the eval harness; ≥ 75% required to ship.
5. **Thu:** ship behind flag; first 48h has 50% trace sampling on new version.
6. **Fri:** mid-cycle check; rollback if hard-fail rate spikes.

Each prompt version is logged to `prompt_version` field; A/B comparison via SQL (`SELECT prompt_version, COUNT(*), AVG(...)...`).

---

## Telemetry SQL primitives

Common queries operators run:

### Daily fallback rate per tenant

```sql
SELECT
  tenant_id,
  DATE_TRUNC('day', timestamp) AS day,
  COUNT(*) FILTER (WHERE fallback_used) AS fallbacks,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE fallback_used) / COUNT(*), 1) AS fallback_pct
FROM atlas_reasoning_traces
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY tenant_id, day
ORDER BY day DESC, tenant_id;
```

### Pattern fire frequency

```sql
SELECT
  jsonb_array_elements_text(patterns_fired) AS pattern,
  COUNT(*) AS fires,
  AVG(latency_ms) AS avg_latency_ms,
  AVG(CASE WHEN interpretation_confidence = 'high' THEN 1 ELSE 0 END) AS high_conf_share
FROM atlas_reasoning_traces
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY fires DESC;
```

### Hard-fail traces (Severity 1)

```sql
SELECT trace_id, tenant_id, timestamp, observations, fallback_reason
FROM atlas_reasoning_traces
WHERE
  (jsonb_path_exists(citations, '$[*] ? (@.field == "INVALID")') OR
   fallback_reason = 'parse_error' OR
   fallback_reason = 'cross_tenant_leak')
  AND timestamp >= NOW() - INTERVAL '24 hours';
```

### Citation density (proxy for substrate-grounded reasoning)

```sql
SELECT
  prompt_version,
  AVG(jsonb_array_length(citations)) AS avg_citations_per_render,
  AVG(jsonb_array_length(observations)) AS avg_observations
FROM atlas_reasoning_traces
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY avg_citations_per_render DESC;
```

A higher citation count per observation correlates with insight-grade output. A trend toward fewer citations over time signals templated drift.

---

## What's NOT in the trace

For privacy and storage:

- Full substrate input is not persisted (only counts + summary). Reasoning is reconstructible by re-running with the same inputs.
- User chat messages are stored separately in `atlas_message_traces` (existing table); the reasoning trace only references the threadId.
- Stakeholder note quotes are never persisted in traces, even if they appear in observations. The citation row stores the noteId; the quote stays at rest.

---

## Versioning hooks

Every Atlas trace records:

- `package_version` (this training package version, e.g., 'v1.0.0')
- `prompt_version` (Atlas system prompt version)
- `model` (Claude model identifier)

When any of these three change, the trace shape allows correlation:

- "Did the 2026-05-15 prompt update reduce the Pattern-02 false-positive rate?"
- "Is Severity 1 hard-fail rate higher on model X than on model Y?"
- "Which package version introduced the citation density regression?"

A simple compare query:

```sql
SELECT prompt_version, COUNT(*) AS traces,
  ROUND(100.0 * SUM(CASE WHEN fallback_used THEN 1 ELSE 0 END) / COUNT(*), 1) AS fallback_pct,
  AVG(jsonb_array_length(citations)) AS avg_citations
FROM atlas_reasoning_traces
WHERE timestamp >= NOW() - INTERVAL '14 days'
GROUP BY 1 ORDER BY 1;
```

---

## The observability dashboard

A simple `/admin/atlas/traces` view with:

1. **Header KPIs** — last 7d fallback rate, hard-fail count, avg latency, traces/day per tenant
2. **Pattern fire rate stacked chart** — week-over-week
3. **Trace list** — filterable, paginated, click-through to detail
4. **Trace detail** — full JSON of the trace, side-by-side with the substrate input replay (re-run reasoning to check determinism), citations rendered as a table, Sev marker if applicable
5. **Compare prompt versions** — pick two `prompt_version` values, see KPI deltas

This dashboard is downstream of v1; v1 ships with the trace table populated and SQL primitives ready, dashboard surface follows.

---

## Done state for observability

After this package + the implementation wave:

- ✅ `atlas_reasoning_traces` table exists with schema above
- ✅ Every Atlas reasoning render writes a trace row
- ✅ Citation shape enforced at write time (rejects malformed citations)
- ✅ Fallback path documented and recorded
- ✅ Daily sampling + grading workflow defined (this doc)
- ✅ SQL primitives ready for ops
- ✅ Versioning hooks captured per trace

The dashboard at `/admin/atlas/traces` follows in a v1.1 wave.
