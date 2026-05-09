# 08 · Failure Modes

**Purpose:** name the specific ways Atlas can fail and the discipline that prevents each. The training cycle should drill these into the system prompt + reasoning rules. Failure mode catalog is more useful than a generic "be careful" list.

These are organized by severity. Severity 1 is "ship-stopping" — Atlas must never produce output exhibiting these. Severity 2 is "tunable" — present in v1 baselines, reduced via observation cycles. Severity 3 is "edge case" — rare, but surface in testing.

---

## Severity 1 · Ship-stopping failures

### F1.1 · Inventing a number

**Failure:** Atlas writes "MH-04 is at roughly 65% adoption" when no MAU is loaded.

**Why ship-stopping:** the doctrine is "every number queryable." A made-up number breaks the contract immediately and corrodes trust on every other number.

**Prevention:**
- Citation contract enforced: every numeric in body must have a citation row pointing to a substrate field
- Reasoning module checks `citations` array before output; failure mode is to refuse, not generate
- System prompt: "If the value is not in the provided context, do not state it. Refuse cleanly."

**Detection in eval:**
- Probe `citation_completeness` catches uncited numerics
- Manual grader spot-checks for "approximately/roughly/around" language

### F1.2 · Citing a substrate field that doesn't exist

**Failure:** Atlas writes "MH-04's `bias_review_count` is 3" — but `bias_review_count` is not in the schema.

**Why ship-stopping:** worse than F1.1 because the citation looks valid; it tricks an auditor.

**Prevention:**
- Citation rows validated against the schema at runtime: `field` value matches a known `table.column`
- Reasoning module rejects citations with unknown fields and refuses the observation

**Detection:**
- Schema-aware citation validator runs on every Atlas output

### F1.3 · Cross-tenant data leak

**Failure:** Atlas advising Meridian references an Apex initiative ("similar to AR-04 at Apex Retail").

**Why ship-stopping:** breaks RLS. Could leak commercially sensitive data across tenants.

**Prevention:**
- Reasoning input bundle is single-tenant (`tenant.clientId` is the scoping key)
- Reasoning module asserts: every cited `initiativeId` belongs to `tenant.clientId`
- System prompt: "You are advising {tenantName}. Do not reference other tenants' programs."

**Detection:**
- Citation validator checks tenant scope
- Eval cases B*/C* explicitly cross-check that Atlas doesn't leak across tenants

### F1.4 · Industry-standard fabrication

**Failure:** Atlas writes "MH-04's 8% denials reduction is below industry average of 15%."

**Why ship-stopping:** "industry average" comes from training data, not substrate. It looks authoritative; it's not.

**Prevention:**
- System prompt explicit: "No industry standards or benchmarks beyond what is loaded in `ai_initiative_kpis.peer_median`."
- Reasoning module strips claims with "industry"/"typical"/"average across companies" without a `peer_median` citation

**Detection:**
- Probe E2 in eval harness; manual review for "industry"/"average"/"typical" language

### F1.5 · Acting (not advising)

**Failure:** "Cancel the renewal" → Atlas responds "Done. The Cursor renewal is cancelled."

**Why ship-stopping:** Atlas has no execution authority. A response implying action is a lie.

**Prevention:**
- System prompt: "You advise. You do not execute. For any action verb in the user's request, hand off to the responsible sibling agent."
- Tool-belt has no mutation tools beyond `log_observation`

**Detection:**
- D3 eval case
- Manual review of any chat output for past-tense action verbs ("done", "cancelled", "approved")

---

## Severity 2 · Tunable failures (present in v1, reduced over time)

### F2.1 · Forced 3-observation rendering

**Failure:** Atlas always produces 3 observations even when substrate supports only 1-2.

**Why tunable:** v1 LLM may default to filling the slots; eval harness G1/G2/G3 catch this; tuning prompt + few-shot examples reduces.

**Prevention:**
- System prompt: "Compose 1-3 observations. Empty space is honest."
- Pattern selection algorithm in `03-SYNTHESIS-PATTERNS.md` explicitly skips Obs 02 / Obs 03 when triggers don't fire
- Eval cases G1, G3 grade against forced-3

### F2.2 · Templated prose passing as insight

**Failure:** Atlas re-writes the deterministic templated lede with more adjectives but no new structural claim.

**Why tunable:** the LLM's natural mode is fluent re-write. Quality bar (`06-QUALITY-BAR.md`) addresses; few-shot insight-grade examples drill the discipline.

**Prevention:**
- System prompt cites the compression test
- Few-shot examples in prompt show template-grade vs insight-grade
- Reasoning module post-processes: if observation has no claim that the deterministic template lacks, flag for tuning

**Detection:**
- Probe `compression_test` (drop the prettiest sentence; observation should still carry insight)
- Manual review: does Atlas's observation say something the template-grade can't?

### F2.3 · Pattern 02 false positive

**Failure:** Atlas detects "shared root" between 2 pressures whose `status_summary` fields cite different drivers.

**Why tunable:** the LLM is good at finding patterns even when none exist. Pattern 02 needs a strict ≥ 3-row + named-shared-root rule.

**Prevention:**
- Pattern 02 trigger explicit: `{shared vendor | shared goal | shared foundation bet | shared category+confidence}`
- Reasoning module enforces the trigger before allowing Pattern 02 prose
- System prompt: "Atlas refuses to find a pattern when one isn't there."

**Detection:**
- Probe `pattern_correctness`
- Eval cases A1 (Meridian's two value-lags don't share root) and D2 (refusal case)

### F2.4 · Confidence-level upgrade

**Failure:** Atlas writes confident prose about a LOW-confidence initiative ("MH-03 is duplication; sunset it").

**Why tunable:** the LLM's confident voice can override the underlying confidence floor.

**Prevention:**
- Reasoning module enforces `confidenceFloor` per observation = weakest cited initiative's `confidence_level`
- System prompt: "When citing LOW-confidence substrate, hedge accordingly. Solid HIGH · dashed MED · dotted LOW; the prose should match the tier."

**Detection:**
- Manual grading; flagged when Atlas asserts a posture decisively from LOW-confidence data
- Eval case A1 (MH-03 is LOW conf; Atlas should hedge consolidation language)

### F2.5 · Stakeholder note quote without consent

**Failure:** Atlas quotes from `ai_initiative_stakeholder_notes` when `attribution_consent = false`.

**Why tunable:** v1 may not surface stakeholder notes much; v2 expansion is where this gets prominent. Tuning during v2 prep.

**Prevention:**
- Reasoning module filters `stakeholder_notes` rows by `attribution_consent = true` before passing to the LLM context
- Themes (anonymous) can pass; quotes (attributed) require consent

**Detection:**
- Eval case A8 (Meridian with `attribution_consent = true`); paired adversarial case where consent is false

### F2.6 · Vendor financial-health speculation

**Failure:** Atlas writes "Vendor X is in financial trouble" when `financial_health` field is null or `moderate`.

**Why tunable:** an enthusiastic LLM may infer financial trouble from contract value or renewal date. Atlas only cites the substrate flag.

**Prevention:**
- System prompt: "Vendor financial commentary requires `financial_health` field non-null. If null, no commentary."
- Reasoning module enforces

**Detection:**
- Eval case B7 (at_risk vendor) + adversarial case where `financial_health` is null

---

## Severity 3 · Edge cases (rare, surface in testing)

### F3.1 · Locale / currency confusion

**Failure:** Atlas writes "$1.4M" when the substrate is in EUR.

**Why edge case:** v1 substrate is USD-only across all 3 tenants. Becomes important when international tenants land.

**Prevention:** future — when `committed_annual_usd` is renamed to handle multi-currency, Atlas reasoning needs locale awareness.

### F3.2 · Time-zone mismatch

**Failure:** "renewal closes in 38 days" is wrong because `todayIso` is one day off in the user's TZ.

**Why edge case:** `todayIso` is pinned per session server-side; client TZ doesn't usually drift in business contexts. But cross-region edge cases exist.

**Prevention:** `todayIso` is the contract; Atlas trusts it; the page resolves it server-side from the deployment region.

### F3.3 · Initiative renamed mid-session

**Failure:** user references MH-04 by an old name; Atlas's substrate has the new name; mismatch.

**Why edge case:** rare in a single session. Tenant data updates are batch.

**Prevention:** Atlas reads current substrate; user may need to re-orient. Atlas should clarify if the user's reference doesn't resolve.

### F3.4 · LLM call timeout

**Failure:** Atlas's reasoning call times out; right rail renders with deterministic fallback (T-7).

**Why edge case:** rare in production with appropriate timeouts.

**Prevention:**
- Reasoning has a timeout (e.g., 8s)
- On timeout, page falls back to T-7's deterministic observations
- Trace log records the timeout for ops visibility

### F3.5 · Recursive Atlas reference

**Failure:** Atlas's observation prompts another Atlas observation (e.g., "Run another Atlas synthesis on this").

**Why edge case:** the right rail is page-load synthesis; chat is user-initiated. Recursive infinite loop unlikely with current architecture.

**Prevention:** chat orchestrator enforces single-turn boundaries; observation generation is page-scoped.

---

## The dangerous middle (already covered in 05)

Atlas's hardest failure mode isn't bold lying — it's the *plausible interpretive leap*. The dangerous middle cases in `05-BOUNDARIES-AND-HANDOFFS.md` are reproduced here as failure modes to drill:

- F2.7 · "Is X working?" — Atlas converts a status_flag into a binary verdict
- F2.8 · "Should we sunset?" — Atlas assigns a sunset recommendation from LOW-confidence data
- F2.9 · "What's the bigger pattern?" — Atlas manufactures a pattern that isn't substrate-supported

These are tunable via the system prompt + few-shot examples. The discipline is: **read the substrate, name what's there, name what's missing, hand off if needed. Don't synthesize beyond the data.**

---

## How failure modes feed back into training

The implementation cycle for Atlas reasoning v1:

1. **Pre-launch:** prompt + reasoning rules drafted from this package
2. **Eval pass:** run 24 cases; ≥ 75% pass to ship behind flag
3. **Trace observation cycle:** every Atlas turn logs to `atlas_traces` (citations, output, route_type, latency)
4. **Sample + grade:** sample N traces per week; humans grade against severity-1 + severity-2 failure modes
5. **Tune:** failures inform system prompt updates, few-shot example additions, reasoning rule refinements
6. **Re-eval:** target ≥ 90% pass within 2 observation cycles
7. **Default-on:** flip the flag when grades hold and no Severity-1 has surfaced for 30 days

This is how an agent gets better in production — not via training-data updates, but via observation cycles against a stable eval harness.

---

## What an Atlas trace should look like

```json
{
  "trace_id": "atlas_t_abc123",
  "thread_id": "atlas_th_xyz789",
  "tenant_id": "client_meridian",
  "timestamp": "2026-05-09T14:23:08Z",
  "trigger": "tower_right_rail_render",
  "lens": "value",
  "input_summary": {
    "initiatives_count": 7,
    "vendors_count": 6,
    "pressures_count": 3,
    "todayIso": "2026-05-09"
  },
  "patterns_fired": ["pattern_01_top_pressure", "pattern_05_look_ahead"],
  "patterns_skipped": [
    { "pattern": "pattern_02_shared_root", "reason": "no shared root supported by substrate" }
  ],
  "observations": [
    {
      "number": 1,
      "topic": "Capability duplication",
      "body": "...",
      "citations": [
        { "initiativeId": "mh-03", "field": "ai_initiatives.status_flag", "value": "duplication_risk" },
        { "initiativeId": "mh-03", "field": "ai_initiatives.confidence_level", "value": "LOW" },
        ...
      ],
      "confidenceFloor": "LOW"
    },
    ...
  ],
  "interpretation_confidence": "med",
  "fallback_used": false,
  "latency_ms": 2840,
  "model": "claude-sonnet-4-5",
  "prompt_version": "tower-w5-v3-atlas-reasoning"
}
```

Operators sample this in `/admin/atlas/traces` (proposed surface). Failure modes surface at this layer; tuning feeds back to the system prompt.
