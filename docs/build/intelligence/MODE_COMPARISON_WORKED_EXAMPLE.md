# Mode-Comparison Worked Example

> **Why this exists.** The four-mode answer model (generic /
> corpus_grounded / tenant_grounded / cross_corpus) is the most
> ambitious design choice in
> `INTELLIGENCE_SURFACE_FAILURE_MODE_DRIVEN_DESIGN.md` Part C.4. Q2 of
> Part I asks whether it's the right mechanism for failure modes #1
> (indistinguishable from ChatGPT), #6 (tenant-context unused), and #9
> (cross-corpus reasoning missing).
>
> The risk: if `compose_mode_comparison` produces four wordings of the
> same answer with different citation density, the toggle is theatre
> and the moat doesn't land.
>
> This document is a hand-authored test. Read all four answers below.
> Either the deltas are visibly different *answers* (not just different
> *citations on the same answer*) — and Q2 is approved to ship as
> INT-5 — or they aren't and the four-mode model needs reshaping.

---

## The question

**"What's the biggest risk to our AI program portfolio right now?"**

Picked because it has corpus depth (failure modes catalog), natural
tenant grounding (Apex's 4 active programs in distinct phases), and
a cross-corpus opportunity (predict where the portfolio is most
vulnerable in the next quarter). A generic LLM has nothing
tenant-specific to say; the corpus has authored doctrine; Apex has
real portfolio state.

User context: signed-in Apex Retail tenant admin. 4 active programs:

- `apex-cdp-2026` — Customer Data Platform Activation. P3 Design.
  Vendor BAFO complete; architecture review noted production-scale
  identity-resolution accuracy untested.
- `apex-ams-consolidation-2026` — Application Managed Services
  Consolidation. P2 Synthesis. Vendor BAFO in flight; transition-risk
  burndown plan not yet authored.
- `apex-cc-ai-2026` — Contact Center AI. P1 Discovery. Sponsor
  named (CIO) but no recurring 1:1 cadence committed.
- `apex-forecast-2026` — Demand Forecasting & Inventory AI. P0
  Originate. Value hypothesis drafted; baseline data assessment
  not started.

---

## Mode 1 — Generic

> The answer any well-prompted LLM produces drawing on public training
> data. No corpus retrieval. No tenant context.

**Sentinel (generic mode):**

The biggest risks to most enterprise AI program portfolios fall into
four categories:

- **Data foundation.** Most AI programs are bottlenecked by data
  quality, lineage, and access. Without a clean foundation, models
  produce unreliable outputs and stakeholders lose trust.
- **Governance and risk.** AI introduces novel risk surfaces — model
  drift, bias, regulatory exposure under emerging frameworks like the
  EU AI Act and NIST AI RMF. Programs that defer governance tend to
  hit late-stage rework.
- **Change management.** Models that work in pilots often fail to
  drive business outcomes because operating-model and workflow
  changes weren't designed in. The technology lands; the value
  doesn't.
- **Skills and talent.** AI requires SMEs, ML engineers, and
  business-side translators. Programs lacking these roles tend to
  stall regardless of the model's quality.

A balanced portfolio approach — establishing data foundations early,
embedding governance from design, planning workflow change as a
deliverable, and naming roles up front — typically reduces the
biggest risks. Each program should also be evaluated against a
prioritization framework to avoid over-extending the portfolio.

---

## Mode 2 — Corpus-grounded

> Same question, answered using AbarVa's pattern catalog and the
> 10-failure-mode catalog. Cites failure mode IDs, research anchors,
> and contradictions in the corpus.

**Sentinel (corpus-grounded mode):**

Most "biggest risk" answers stay generic because they don't ground
the failure modes in research. The corpus surfaces a sharper view:

- Failure mode #8 (**Pilot-to-Production Scaling Gap**) is the
  single most-cited risk in enterprise AI portfolios. McKinsey: ~73%
  of pilots never reach production. MIT/BCG GenAI Divide: ~95% of
  GenAI pilots fail to deliver measurable revenue. The corpus's
  prevention mechanism is to require production-readiness evidence
  at the P5 (Activate) gate — operations, monitoring, support
  runbooks — before a program leaves Build.
- Failure mode #2 (**Unclear Problem Definition**) is RAND's
  single most-cited root cause across studied AI failures. Programs
  without a tested cohort × behavior-change × mechanism × value-
  direction hypothesis predictably stall in P2 (Synthesis) or
  produce unprovable outcomes by P6.
- Failure mode #9 (**Inability to Measure Outcomes**) is the
  Forrester finding that only ~15% of AI initiatives demonstrate
  EBITDA-level gain — primarily because outcome measurement wasn't
  designed in at P1.

A contradiction worth surfacing: the corpus shows two competing
framings. Framing A (industry consensus): data foundation is the #1
risk. Framing B (the corpus's own evidence): data is necessary but
not sufficient — programs with great data still hit pilot-to-
production gaps if workflow change wasn't designed. Failure mode #5
(**Lack of Business Commitment to Operating-Model Change**) is the
McKinsey-cited single biggest EBIT-driver and is structurally
under-discussed in industry conversations about AI risk.

So the biggest risk depends on portfolio composition — but for most
enterprise portfolios, failure modes #5 and #8 in combination are
where the most value evaporates. Both have authored prevention
mechanisms in the AbarVa platform.

---

## Mode 3 — Tenant-grounded

> Same question, answered using the user's tenant data plus the
> corpus. Cites tenant artifacts (program names, gate states,
> evidence) alongside corpus patterns.

**Sentinel (tenant-grounded mode):**

The corpus says failure modes #5 and #8 are usually the biggest
combined risk in an enterprise AI portfolio. Your portfolio's actual
state surfaces a different specific risk:

- `apex-cdp-2026` is in P3 Design with vendor BAFO complete, but the
  architecture review attestation noted production-scale
  identity-resolution accuracy is untested. That's failure mode #8
  surfacing early — vendor pilot data was curated; production
  validation hasn't happened. The corpus's mechanism is to make this
  a P3 deliverable rather than a P4 surprise.
- `apex-cc-ai-2026` is in P1 Discovery with the CIO named as sponsor
  but **no recurring 1:1 cadence committed**. That's failure mode #1
  (Lack of Executive Sponsorship) firing in real time, not as a
  predicted risk — McKinsey's State of AI is unambiguous that this
  pattern is the single biggest correlate of stalled programs. The
  pattern catalog's anti-pattern "The Phantom Sponsor" is the named
  framing.
- `apex-ams-consolidation-2026` is in P2 Synthesis with vendor BAFO in
  flight, but the **transition-risk burndown plan hasn't been
  authored**. That's failure mode #7 (Vendor and Build-vs-Buy
  Strategy Errors) intersecting failure mode #5 — choosing a vendor
  before the operating-model delta is named is the corpus's most-
  observed failure pattern in AMS-consolidation programs. Forrester:
  75% of self-built agentic AI architectures fail; AMS programs
  inherit similar sourcing-discipline risks.

If asked which specific risk to address first across your portfolio,
the corpus + your tenant state combine to flag the
`apex-cc-ai-2026` sponsor-cadence gap as the highest-leverage. It's
the only one of the three where the failure has already begun (no
calendar commitment) rather than being a predicted risk that good P3
discipline could still prevent.

`apex-forecast-2026` (P0 Originate) is too early to flag specific
risks; the data assessment hasn't been done.

---

## Mode 4 — Cross-corpus

> The question reasoned across corpus + tenant + active programs
> simultaneously. Surfaces things only AbarVa can find — predictions
> derived from aggregating tenant state against corpus mechanisms.

**Sentinel (cross-corpus mode):**

Reasoning across the corpus's prevention mechanisms and your
portfolio's actual state, three findings emerge that no single
program view would surface:

**Finding 1 — The portfolio's failure-mode burden is concentrated
in P1–P3, not P4–P5.** The conventional risk view focuses on
pilot-to-production (failure mode #8) which lands at P4–P5. Your
portfolio's actual exposure is upstream: 3 of 4 programs are in P1–P3
and carry unresolved hard-gate items (sponsor cadence on
`apex-cc-ai-2026`, transition-risk burndown on
`apex-ams-consolidation-2026`, identity-resolution validation on
`apex-cdp-2026`). The corpus's mechanism is unambiguous: failure
modes prevented at P0–P3 cost ~10% of those prevented later. Your
portfolio is structurally early and can pay the lower price — IF
you act on the upstream gaps in the next 30–60 days.

**Finding 2 — The vendor-decision sequencing risk that crosses
two programs.** `apex-cdp-2026` (vendor BAFO complete, P3) and
`apex-ams-consolidation-2026` (vendor BAFO in flight, P2) are
running parallel sourcing decisions on different cadences. The
corpus's `CON-007` (Vendor pilot success vs production failure) is
flagged on both. The cross-corpus signal: programs that close
parallel vendor decisions within a 90-day window without coordinated
transition-risk discipline have a **2.4× higher rate** of post-go-
live escalation per the corpus's outcome data. Your two BAFO closes
are within that window. Either coordinate transition-risk planning
across both, or stagger the contracts.

**Finding 3 — The portfolio-level prediction.** Combining the
above: the program most likely to stall in the next 60 days is
`apex-cc-ai-2026`, not because Contact Center AI is technically
hard but because the sponsor-cadence gap (failure mode #1) is the
fastest-firing failure mode in the corpus and has already begun.
McKinsey's data: programs without active sponsor engagement at P1
exit P2 with stalled charters at ~3× the rate of programs with
committed cadence. The corpus's mechanism is to require an
`engagement_participants` row with calendar cadence before P0 → P1
gate passes — which means this advance happened before the
prevention mechanism was satisfied. The remediation path is to
require the cadence commitment before P1 closes, not P2.

The biggest risk to your portfolio right now is not generic
("data quality") or even the most common corpus risk
(pilot-to-production). It's specific: the
`apex-cc-ai-2026` sponsor-cadence gap, which the corpus says
is fastest-firing and your tenant state shows is already firing.

---

## Delta analysis — what's structurally different between modes

| Dimension | Generic | Corpus | Tenant | Cross-corpus |
|---|---|---|---|---|
| **Specificity of risk** | Categories (4 generic) | Failure modes #1, #2, #5, #8, #9 named with research anchors | Specific tenant artifacts (program names, gate states, evidence locators) | Specific prediction with named program + named timeframe |
| **Provenance** | None (frameworks named: NIST AI RMF, EU AI Act) | McKinsey, MIT/BCG, Forrester, RAND with stats and percentages | Tenant artifacts (BAFO state, architecture review attestation, sponsor metadata) + corpus patterns | Multi-source: corpus mechanisms + tenant state + corpus outcome data (90-day window stat, 2.4× escalation rate) |
| **Contradiction surfacing** | None | Framing A vs Framing B explicitly named (data-first vs workflow-change-first); CON-007 referenced | Tenant-specific: "your portfolio's actual exposure is upstream" contradicts the conventional view | Aggregates the contradiction into a portfolio-level prediction |
| **Action implied** | Balanced approach (vague) | Two failure modes (#5 + #8) with prevention mechanisms | "Highest-leverage = `apex-cc-ai-2026` sponsor gap" (specific program) | "Most likely to stall in next 60 days = `apex-cc-ai-2026`; remediation = cadence before P1 close" (specific timing + specific gate) |
| **Reasoning visible to user** | Implied | Cited via failure mode IDs and research anchors | Reaches into the user's portfolio without them having to ask | Connects three programs through a shared corpus mechanism in a way no individual program view would surface |
| **Could ChatGPT produce this?** | Yes (this IS what ChatGPT produces) | No — failure mode IDs and the AbarVa-authored prevention mechanisms aren't in public training data | No — tenant data is private | No — requires both the corpus mechanism AND the tenant state at once |

---

## Q2 verdict — do the deltas pop?

**Yes, with two caveats.**

The deltas are visibly different *answers*, not just different
*citations on the same answer*:

- Generic → Corpus: the risk *type* changes. Generic gives 4
  categories; corpus surfaces failure mode #5 (workflow-change) as
  structurally under-discussed and the #5+#8 combination as the
  actual leverage point. Generic and corpus disagree on the answer
  — which is the moat.
- Corpus → Tenant: the risk *target* changes. Corpus says #5+#8 is
  the typical answer; tenant says your portfolio's bigger risk is
  failure mode #1 firing on `apex-cc-ai-2026` right now. Corpus and
  tenant produce *different* answers because the user's specific
  portfolio is in a different state than the typical one.
- Tenant → Cross-corpus: the *form* of the answer changes. Tenant
  names individual program risks; cross-corpus produces a
  portfolio-level prediction with a timeframe (60 days) and a
  remediation (require cadence before P1 close, not P2). The
  prediction couldn't exist in any other mode.

**Caveat 1 — Mode 1 (Generic) requires running the question through
a Claude/GPT call with NO tools and NO corpus context.** This means
every mode-comparison costs at least 2× LLM calls (generic baseline
+ corpus answer) and up to 4× for fully authenticated questions.
Pricing implications are real — at scale this is a noticeable cost
delta vs single-mode.

**Caveat 2 — The cross-corpus mode requires real tenant data
persistence.** Findings 2 and 3 above (90-day vendor-decision window,
3× stall rate for sponsor-cadence gaps) cite outcome data from "the
corpus" — but in v1, those statistics aren't actually in the corpus.
They're plausible but synthetic. Until Codex's data-layer work makes
outcome telemetry real, cross-corpus mode has to honestly say "this
prediction is grounded in mechanism, not in measured outcomes" or
the mode is unfakeable in the wrong direction (it fakes specificity
the platform can't yet back up).

## Recommendation

Approve Q2. The four-mode model produces visibly different answers
on a real question. INT-5 (J3 conversational + mode comparison) is
green-lit subject to:

1. **Engineering check before INT-5 starts.** Verify that
   `compose_mode_comparison` can produce these four modes with
   distinct retrievals (generic = no tools, corpus = `search_corpus`
   only, tenant = `search_corpus` + `reason_across_tenant`,
   cross-corpus = `search_corpus` + `reason_across_tenant` +
   portfolio aggregation). If the implementation collapses any two
   modes into the same retrieval path, the delta degrades to
   citation density — which is theatre per Q2.
2. **Honesty rule for cross-corpus mode.** Until outcome telemetry
   is real (Codex's track), cross-corpus answers must label
   mechanism-derived predictions distinctly from outcome-measured
   ones. Synthetic-but-plausible statistics presented as measured
   are the kind of thing that erodes trust on first audit.
3. **Cost-aware default.** For cold visitors, default to two-mode
   side-by-side (generic vs corpus) rather than four-mode. The
   four-mode toggle is opt-in for authenticated users with tenant
   data. This caps the LLM cost at the moments where the moat
   actually lands.

If those three are accepted, the model is the right mechanism for
failure modes #1, #6, #9 and INT-5 can proceed.

---

**Author:** Claude Opus 4.7
**Reviewer:** Anand (founder)
**Status:** Awaiting founder Q2 verdict.
