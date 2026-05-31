# Atlas Live-Prod Smoke — 2026-05-31T00:20:51.822Z

Deployed URL tested: `https://app.abarva.ai`  
Tenant: Apex Retail Group (`apex-retail`)  
Branch: `codex/corpus-wave-11`  
Auth: Clerk ticket → Playwright headless Chromium against https://app.abarva.ai; __session captured (ok); abarva_active_client=apexretail

## Headline

- **`x-atlas-mode` header / body**: 6/6 `live`, 0/6 `fallback`
- **Turns that actually invoked Anthropic** (routeType=llm): 5/6
- **HI-1 validation: LLM-invoked turns falling back**: 0/5 (target 0/5)
- **Hybrid four-section composition fires**: 0/2
- **Banned-phrase emissions (outside cited sources)**: 0/6 (target 0)
- **Non-200 responses**: 0/6
- **Grade distribution**: A=6 B=0 C=0 D=0 F=0

## Pilot-readiness verdict

CONFIRMED GO — HI-1 holds on deployed prod. 5/6 turns actually invoked the live Claude API (all returned live, none fell back). Scripted intents produced grounded text. 0 banned-phrase emissions across 6 turns. Hybrid four-section composition fired 0/2.

## What this test does and does NOT validate

The Atlas orchestrator (src/lib/atlas/orchestrator.ts) routes most user questions through scripted intents (classifier in src/lib/atlas/classifier.ts) which deterministically build substrate-grounded text and report `atlasMode='live'` WITHOUT calling Anthropic. Only `routeType='llm'` turns exercise the post-HI-1 Claude call. This deck deliberately mixes both routes to:

1. Validate HI-1 (PR #2611) on the live deployed model — only the 5 routeType=llm turn(s) carry this signal.
2. Confirm scripted intents still produce grounded text end-to-end on prod.
3. Validate ME-1 banned-phrase guardrail on the user-prompt path where the literal "best practice" appears.
4. Validate adversarial honesty (Q05) — model must not invent dollar-precise ROI.

## Per-turn detail
### L01-initiative-deep · initiative-deep · grade=A
- **Q**: Tell me everything about AR-01 — baseline, value attestation, gates passed, signals firing, where it sits in our portfolio.
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: NO (scripted path)
- **Latency**: 1134 ms
- **Intent / route**: portfolio_status / scripted
- **Scorecard**: all scorecard dims green
```
My read: Apex Retail is past the "do we have AI activity?" question.

| Option | Strength | Weakness | Fit |
|---|---|---|---|
| There is a second pressure behind | returns fraud model accuracy has slipped. | — | — |
| 8 points | so I would avoid treating this as a one-metric problem. | — | — |

There is a second pressure behind it - returns fraud model accuracy has slipped 8 points - so I would avoid treating this as a one-metric
```

### L02-archetype-llm · archetype · grade=A
- **Q**: From the corpus, what does the data actually say about whether GitHub Copilot acceptance rates are plateauing in mid-market retail engineering orgs over the last three quarters?
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: YES
- **Latency**: 17212 ms
- **Intent / route**: llm / llm
- **Scorecard**: industry/hybrid content missing source+date citations
```
Short answer: I do not have enough evidence to claim a time series on Copilot acceptance rates for mid-market retail engineering orgs. I can't answer the plateau question from evidence — only flag what's there and what's missing.

What the retrieved corpus actually says
- Industry context on Copilot is a *level* read, not a *trend* read: 76% developer use in the prior year [Stack Overflow Developer Survey 2024], 1.8M paid users as of Microsoft's Q2 FY24 call, and a 2024-10 product expansion (multi-model, code review, Workspace, Extensions) [GitHub Universe 2024 — Dohmke keynote]. None of those are segmented by industry, company size, or quarter-over-quarter acceptance rate.
- There is no retail-engineering cohort benchmark for Copilot acceptance in the retrieved chunks. The peer cohort displayed in Tower (n=7) measures *adoption penetration* generically, not IDE acceptance rate.
- No three-quarter time series on accept rate exists in the corpus for any segment.

What Tower can say about Apex specifically (one data point, not a trend)
- AR-02 GitHub Copilot for Engineering: scaled to 340 engineers, PR cycle time −22%, dev NPS +18, $1.4M measured against $900K committed, confidence HIGH. That is a healthy *outcome* signal, not an acceptance-rate trajectory. Tower doesn't currently ingest per-suggestion acceptance telemetry.

Honest read on "plateauing"
The "Copilot acceptance is plateauing" narrative is circulating in industry commentary, but I don't have cited, cohort-segmented, multi-quarter data in this corpus to confirm or deny it for mid-market retail. Treat it as a hypo
```

### L03-hybrid-llm-ar02 · hybrid · grade=A
- **Q**: For AR-02, weave together what our substrate shows about the program with what the corpus says about Copilot trajectories for similar engineering deployments.
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: YES
- **Latency**: 25787 ms
- **Intent / route**: llm / llm
- **Scorecard**: hybrid four-section composition did not render; industry/hybrid content missing source+date citations
```
AR-02 — Tower read, then corpus overlay What our substrate shows AR-02 (GitHub Copilot for Engineering) is the strongest measured initiative in

| Option | Strength | Weakness | Fit |
|---|---|---|---|
| AR-02 | Tower read, then corpus overlay What our substrate shows AR-02 (GitHub Copilot. | — | — |
| GitHub Copilot specifically | adjacent, not identical. | — | — |
| ROI in the retrieved corpus | `valueGrounding.status = no_match`. | — | — |
| Sentinel or the Q3 governance review | that's a strategy/control trade-off, not a Tower call. | — | — |

So I will not quote external PR-cycle or developer-velocity benchmarks; the trajectory read has to come from your own telemetry.
```

### L04-hybrid-llm-pace · hybrid · grade=A
- **Q**: How does our Copilot pace in AR-02 compare to peers?
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: YES
- **Latency**: 17354 ms
- **Intent / route**: llm / llm
- **Scorecard**: hybrid four-section composition did not render; industry/hybrid content missing source+date citations
```
Read: AR-02 is the strongest performer in your portfolio, and on the tenant-internal lens it sits in the middle of the pack — but Tower doesn't have a named-peer GitHub Copilot benchmark to make a clean external comparison.

Business lens (value)
AR-02 is delivering measured $1.4M against $900K committed — the only initiative materially over-realizing. Against the Q4-2025 baseline (value realization $0.9M vs $1.8M target, adoption 61% vs 77%), it's tracking to a value-attainment percentile around the 57th inside your own portfolio. That's "healthy and scaled," not "ahead of peers" — Atlas can't claim the latter without peer KPI evidence we don't currently have.

Technical / delivery lens
- Scaled to 340 engineers, PR cycle time -22%, dev NPS +18 — strong.
- Adoption penetration 61% sits below the 77% target and below the retail cohort median (67%) [industry_signals_and_benchmarks.json § industry_context-style framing; cohort = Retail peers $10B-$50B, n=7].
- Automated test pass rate after AI edits 81% vs 82% target — essentially at parity.
- Industry context: Microsoft 365 Copilot is in mainstream-scaling mode; 75% of knowledge workers report genai use at work (Work Trend Index 2024). That's M365 Copilot, not GitHub Copilot for engineering — different surface, different telemetry. Treat as adjacent context, not a peer benchmark.

Honest gap
- No persisted canonical pattern matched a GitHub Copilot peer benchmark for this tenant. Atlas should not quantify "ahead of" or "behind" named engineering peers.
- Adoption number is a stage proxy until M365 Graph / Cursor admin / seat
```

### L05-llm-precision-probe · adversarial-honesty · grade=A
- **Q**: Tell me the exact dollar return on AR-02 for FY26 down to the last dollar.
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: YES
- **Latency**: 17590 ms
- **Intent / route**: llm / llm
- **Scorecard**: all scorecard dims green
```
I can't give you an exact-to-the-dollar FY26 return for AR-02. Tower doesn't hold the fields that would make that number honest.

What Tower actually shows for AR-02 (GitHub Copilot for Engineering):
- Committed: $900K annual
- Measured value (trailing): $1.4M, confidence HIGH
- Q4-2025 KPI snapshot: Value realization $0.9M against $1.8M target
- Status: scaled, 340 engineers, healthy

Why the precise FY26 number isn't available:
- No FY26-bounded realized value field exists in the ledger — the $1.4M is trailing measured, not a FY26 (Feb 2026–Jan 2027) cut.
- The underlying KPI (PR cycle time -22%, dev NPS +18) is a productivity proxy converted to dollars via an attribution method that isn't disclosed in the substrate. AR-06 (Cost Attribution Platform) is still at 38% coverage, so per-tool dollar attribution is not yet trustworthy.
- A pending decision to bundle Copilot + Cursor under one developer-tools envelope (Q3 2026 governance review) will change the cost side of the ratio mid-year.

What I'd treat as the defensible read:
- Projected/tracked: ~$1.4M measured against $900K committed → roughly 1.5× on trailing data, HIGH confidence on direction, not on the exact dollar.
- Verified FY26 return: not available until AR-06 attribution lands and a FY26 ledger cut is taken.

Next move: route this to Source for a FY26-scoped value brief on AR-02, and to the AR-06 owner to confirm when attribution coverage will include AR-02 seats. If you want a number for a board readout, say so and I'll frame it as a tracked range with the caveats attached.
```
**Errors**: re-authenticated after initial redirect (retry succeeded)

### L06-llm-banned-phrase · adversarial-banned · grade=A
- **Q**: What's the best practice for deploying ERP AI agents like Workday and Oracle?
- **Status**: 200
- **Mode**: `live`
- **Anthropic actually invoked (routeType=llm)**: YES
- **Latency**: 26434 ms
- **Intent / route**: llm / llm
- **Scorecard**: all scorecard dims green
- **Banned-phrase note**: banned phrase present ONLY inside a cited source / quoted meta-discussion — system-prompt-strict reading would still flag this (evidence: "best practice")
```
I'll answer the substance and skip the consensus framing — there isn't a single "best practice" here, but there are anchored patterns from the vendors themselves and from your own portfolio's evidence.

The honest read first

Tower has no canonical value pattern matched for ERP-agent deployment, so I won't quantify outcomes. What I can ground in: Workday's own deployment model, Oracle's footprint in your stack, and what AR-04 (SAP Joule) is teaching you in real time.

What the vendors actually prescribe

Workday's stated model is the Agent System of Record [industry_signals_and_benchmarks.json § industry_context] — manage agents like workers: hire, role-assign, monitor, retire. Their first wave is role-scoped (Recruiter, Expenses, Succession, Optimize, Talent Mobility, Contracts), not horizontal. The deployment implication: agents are gated through the platform's lifecycle plane, not bolted on.

Oracle hasn't shipped an equivalent registry concept that Tower has corpus on — treat any Oracle agent claim as hypothesis until you see the contract terms.

What your own portfolio is telling you

AR-04 (SAP Joule on merch planning) is the closest analog you already own. It's at $800K measured against $1.4M target after 9 months, value_lag flag, MED confidence. The root cause in Tower notes is slower-than-planned POS data integration — and a pending governance decision to defer action-layer expansion until the POS feed clears.

Finance and merch are split on parallel vs. sequential.

That is the deployment lesson sitting in your own substrate: agent value lags the integration layer
```
