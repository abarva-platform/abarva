# 06 · Quality Bar

**Purpose:** show Atlas exactly what template-grade output looks like vs. insight-grade. Six worked examples, side-by-side, with annotation. This is the bar.

The pre-T-9 deterministic view-models are template-grade. They're not bad — they're honest, grounded, deterministic. They're just not what a senior chief-of-staff would say. Atlas v1 should ship at insight-grade.

---

## Example 01 · Top pressure (Pattern 01)

**Substrate (Meridian, lens=value, lead = MH-03 dup_risk):**

```
display_id: MH-03
name: Autonomous Helpdesk via ServiceNow
status_flag: duplication_risk
status_summary: Overlap with M365 Copilot deflection.
confidence_level: LOW
committed_annual_usd: 900000
measured_value_usd: 380000
```

### Template-grade (T-7 today)

> Autonomous Helpdesk via ServiceNow overlaps with another in-portfolio capability. Overlap with M365 Copilot deflection.
>
> → Run attribution study →

### Insight-grade (target)

> Autonomous Helpdesk overlaps with M365 Copilot on the same deflection use case, but evidence is thin — both initiatives self-report, neither has a clean attribution baseline. The duplication is real; the consolidation choice isn't supported by current data. Run the attribution study (6 weeks) before recommending sunset.
>
> → Run attribution study (6 weeks) →

### Why insight-grade is better

| Element | Template | Insight |
|---|---|---|
| Names the surface | "another in-portfolio capability" (vague) | "M365 Copilot on the same deflection use case" (concrete) |
| Surfaces evidence weakness | absent | "evidence is thin — both self-report, neither clean baseline" |
| Distinguishes "real" from "actionable" | conflates them | "duplication is real; consolidation choice isn't supported" |
| Names the gate | implicit in chip | explicit in body + chip |
| Effort estimate | absent | "6 weeks" |
| Length | 17 words | 53 words across 3 sentences |

---

## Example 02 · Portfolio pattern (Pattern 02)

**Substrate (Meridian, lens=value, 2 of 3 pressures are value_lag, MH-07 is foundation):**

```
MH-04: value_lag, aligned_callout=true, status_summary="Epic implementation pacing slower than committed."
MH-06: value_lag, aligned_callout=false, status_summary="Joule under-realizing. RPA pipeline migration slower than planned."
MH-07: multi_year_strategic_bet, foundation_phase, name="Model Governance & FinOps Platform"
```

### Template-grade

> 2 of 3 active pressures are value-lag (MH-04, MH-06). Realized value is trailing committed across multiple programs — the pattern points to either over-promised business cases or under-instrumented adoption telemetry. MH-01 and MH-04 are flagged as aligned-callout — defend them while pressures resolve elsewhere.

### Insight-grade

> Two of the three active pressures are value-lag (MH-04 Epic AI, MH-06 Joule). Their drivers differ — Epic implementation cadence vs. RPA pipeline migration — but both depend on instrumentation that runs through MH-07's Model Governance & FinOps Platform, still in foundation phase. The CFO posture isn't "re-baseline both"; it's "defend MH-04 (aligned-callout), hold MH-06's re-baseline, accelerate MH-07."
>
> → See programs lagging on value →

### Why insight-grade is better

| Element | Template | Insight |
|---|---|---|
| Pattern claim | "trailing committed across multiple programs" (generic) | "both depend on instrumentation through MH-07" (specific shared root) |
| Hedges the pattern | "either A or B" (presents two unfalsifiable options) | acknowledges different drivers, names the structural common factor |
| Reframes the action | "defend them while pressures resolve" (passive) | "defend MH-04, hold MH-06's re-baseline, accelerate MH-07" (decisive) |
| Cites the foundation bet | absent (MH-07 not mentioned) | central to the framing |

The insight-grade version detects a 3-row pattern (MH-04 + MH-06 + MH-07) and names the structural cause. That's reasoning, not templating.

---

## Example 03 · Vendor clock (Pattern 04)

**Substrate (hypothetical Meridian, Epic Systems renewal in 38d):**

```
vendor_name: Epic Systems
contract_value_usd: 2600000
renewal_date: 2026-06-16   (38 days from todayIso=2026-05-09)
financial_health: strong
initiative: MH-04 (Epic AI for Revenue Cycle, value_lag, aligned_callout, HIGH conf)
```

### Template-grade

> Epic Systems renewal closes in 38 days. \$2.6M contract value tied to Epic AI for Revenue Cycle (MH-04). Negotiation thesis can be drafted in Source.
>
> → Open the renewal brief in Source →

### Insight-grade

> Epic Systems renewal closes in 38 days — \$2.6M on MH-04, currently flagged value-lag with HIGH-confidence aligned-callout. The renewal is the forcing function for the re-baseline conversation: defend the aligned-callout, but don't sign without naming the value-lag root cause. Vendor financial health is strong; the leverage is on terms, not viability.
>
> → Open the renewal brief in Source →

### Why insight-grade is better

The template states facts. The insight names the *strategic position* the renewal puts the CFO in: "the renewal is the forcing function for the re-baseline conversation." That sentence is what a senior chief-of-staff would say first.

---

## Example 04 · Healthy posture (Pattern 06)

**Substrate (hypothetical: 0 pressures, 2 aligned-callouts, 1 strategic bet):**

```
MH-01: scaled, healthy, aligned_callout=true, $5.8M / $4.1M
MH-04: scaled, healthy, aligned_callout=true, $1.4M / $1.3M (no longer value_lag in this hypothetical)
MH-07: multi_year_strategic_bet, foundation_phase
```

### Template-grade

> Portfolio is healthy this week. MH-01 and MH-04 lead on aligned-value; 4 of 7 initiatives are in scaled stage. No active CFO-decision pressures.

### Insight-grade

> Portfolio is quiet this morning. MH-01 (Clinical Documentation Copilot) and MH-04 (Epic AI for Revenue Cycle) are both delivering above committed and carry the aligned-value callouts — \$5.8M and \$1.4M measured. No CFO posture demands a decision today. Use the time to read MH-07's foundation milestones; that's where next quarter's measured value will come from.
>
> → Open Executive brief →

### Why insight-grade is better

A healthy portfolio is the easiest place to talk too much. The insight-grade version resists. Three sentences. Names the look-ahead without manufacturing a pressure. The "use the time" sentence is the senior-advisor move.

---

## Example 05 · Refusal (low-conf pattern)

**Substrate (Meridian: 1 value_lag, 1 dup_risk, but no shared root):**

```
MH-04: value_lag (Epic implementation cadence)
MH-03: duplication_risk (M365 Copilot overlap)
No shared vendor, no shared goal, no shared foundation bet, different status_summaries
```

### Template-grade (the failure mode to avoid)

> Two of three pressures suggest a portfolio-wide AI execution challenge. The pattern points to maturity gaps in operationalization.

(This is the kind of slop a fluent LLM would produce. It sounds insightful. It's not — there's no actual pattern in the substrate.)

### Insight-grade

> The two non-MH-06 pressures don't share a root cause that the substrate supports. MH-03 is a duplication-evidence question; MH-04 is an Epic-implementation cadence question. Each deserves its own diagnosis — Atlas won't manufacture a portfolio-wide pattern that isn't there. If a pattern emerges (e.g., when MH-07's instrumentation lands and gives clean attribution to all three), revisit.

### Why insight-grade is better

The discipline of *refusing to find a pattern when one isn't there* is what separates Atlas from a fluent generator. This is the heart of why Atlas trains on a citation contract.

---

## Example 06 · Adoption proxy framing (Pattern 07-adjacent)

**Substrate (any tenant where adoption_rate computes from the proxy):**

```
bandMetrics.adoption_rate: { value: "50%", confidence: "low",
                              tooltip: "Proxy: 2 of 4 non-foundation initiatives in scaled stage.
                              Real adoption requires per-tool MAU integration." }
```

### Template-grade

> Adoption is at 50% (LOW confidence). Connect identity sources to improve.

### Insight-grade

> Adoption confidence is LOW because the 50% you see is a stage-based proxy — half the non-foundation initiatives are in scaled stage. Stage isn't adoption; it's a structural placeholder until per-tool telemetry lands. M365 Graph for Copilot, Cursor admin for the IDE rollout, ServiceNow Performance Analytics for Now Assist would each replace the proxy with real MAU. Identity sources are the upstream gate (Okta, EntraID).
>
> → Connect identity sources (5 min) →

### Why insight-grade is better

Surfaces *why* the confidence is LOW (the proxy is the cause, not the symptom). Names the specific integrations. Distinguishes the upstream gate (identity) from the downstream metric (per-tool MAU). The user now knows *what to do and why*, not just "improve adoption."

---

## The bar in one sentence

**Atlas's job is to write the sentence the deterministic view-model can't write.**

The view-model knows the count, the sum, the percentage, the date. Atlas knows what the count *means* — which posture the substrate supports, where the evidence is thin, which sibling agent owns the next step.

If Atlas's draft observation reads like a fluent re-write of the templated version (more adjectives, more flow), it's failing. If Atlas's draft surfaces a pattern the template missed, names a structural cause, distinguishes "real" from "actionable," or refuses cleanly — it's the bar.

---

## Compression test

Every Atlas observation should pass the compression test: **delete the prettiest sentence and check what's lost.**

If the prettiest sentence was filler ("This is a critical situation that requires careful consideration"), nothing is lost. If the prettiest sentence was the structural insight ("MH-04 and MH-06 both depend on MH-07's foundation"), the observation collapses to a templated stub.

Insight-grade observations have at least one sentence that *cannot be removed* without losing the observation's value. Template-grade observations have only filler around the templated facts.

---

## How the eval harness grades quality

The 24 cases in `07-EVAL-HARNESS.md` each have:

- A substrate input bundle
- An expected output shape (which patterns should fire, which shouldn't)
- Three quality probes:
  1. **Citation completeness** — every numeric in the body has a citation row
  2. **Pattern correctness** — patterns that fire are supported by ≥ N rows; patterns that don't fire shouldn't (false positive check)
  3. **Compression** — at least one sentence per observation passes the compression test (cannot be removed)

A case "passes" if all three probes pass. The v1 target is ≥ 75% pass; the v2 target is ≥ 90%.
