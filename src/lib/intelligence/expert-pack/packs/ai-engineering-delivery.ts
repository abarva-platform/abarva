// Consilium expert — AI Engineering & Delivery (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every product, platform, and engineering leader is asking under the
// GenAI wave: "we built an impressive AI demo — agents, RAG, an LLM app — so how
// do we actually SHIP it to production, keep it reliable and affordable at
// scale, prove it works with evals, and bound the hallucination/latency/cost
// risks that decide whether we can trust it?"
//
// Honesty doctrine. This expert is built around three non-negotiable truths.
// First, EVALUATION AND QUALITY are the hard part — the demo→production gap is
// where most AI initiatives die, and "it works in the demo" is not evidence.
// Without offline AND online evals (golden sets, LLM-judges with human
// calibration, production telemetry) you are flying blind, and accuracy claims
// without a measured eval pass rate are vanity. Second, HALLUCINATION AND
// RELIABILITY bound autonomy — error rate, not raw capability, decides how much
// you can let a system act unsupervised; grounding (RAG, citations, tool-use)
// reduces but never eliminates it, so human-in-the-loop posture is a function of
// measured error rate, not optimism. Third, INFERENCE COST AND LATENCY are real
// engineering constraints, not afterthoughts — token cost per request and p95
// latency can quietly kill the unit economics or the UX of an otherwise-working
// system, and "we'll use the biggest model everywhere" is rarely the right
// answer. The expert refuses the "the demo is impressive therefore it's
// production-ready" leap and insists on eval coverage, a measured error/cost/
// latency budget, and guardrail coverage before any deployment case lands.
//
// This is the BUILD/DELIVERY craft of AI products. It is DISTINCT from:
// engineering-productivity (general dev velocity / DORA — how AI makes the SDLC
// faster), data-analytics-platform (the data foundation underneath), and
// ai-governance (governing, risk, and policy OVER AI). Here the unit of work is
// the AI SYSTEM itself — getting it from prototype to a reliable, evaluated,
// affordable production capability.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const aiEngineeringDeliveryExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.ai-engineering-delivery",
    expertName: "AI Engineering & Delivery Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "ai-engineering-delivery",
    scopeNote:
      "Horizontal across every organization building and operating AI/GenAI " +
      "systems: agents, RAG/retrieval, LLM applications, model selection and " +
      "cost, evaluation and quality, guardrails, prompt and agent engineering, " +
      "MLOps/LLMOps, and the last-mile from prototype to production. The craft of " +
      "BUILDING AND RUNNING AI products reliably and affordably — held to the " +
      "honest positions that evaluation/quality and the demo→production gap are " +
      "the hard parts, that hallucination/reliability bound how much autonomy a " +
      "system can have, and that inference cost and latency are first-order " +
      "engineering constraints. Excludes general developer-velocity / DORA " +
      "measurement (a separate Engineering Productivity expert), the underlying " +
      "data platform and foundation (a separate Data & Analytics Platform " +
      "expert), and the governance/risk/policy layer OVER AI (a separate AI " +
      "Governance expert) — this expert assumes those exist and focuses on the " +
      "build-and-operate engineering of the AI system itself.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "eval_pass_rate",
        name: "Evaluation pass rate / answer quality score",
        definition:
          "Share of cases in a representative evaluation set on which the AI " +
          "system meets its defined quality bar (correctness, faithfulness, " +
          "task success) — measured offline against golden/labelled sets and, " +
          "where possible, online against production telemetry. The honest " +
          "headline of whether the system actually works, not whether the demo did.",
        unit: "% (or graded score 0-100)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis:
            "Production-bound LLM/RAG systems commonly target a high-but-not-perfect " +
            "quality bar; the right bar is task- and risk-dependent (a customer-facing " +
            "agent needs far higher than an internal draft assistant), so this is a " +
            "wide planning range, not a universal target",
          label: "planning-range",
        },
        dataSource:
          "Eval harness over a curated golden set + LLM-as-judge (human-calibrated), plus online quality sampling/feedback in production",
        whyItMatters:
          "The single most important honesty check. Without a measured eval pass " +
          "rate against a representative set, any 'it works' claim is a demo " +
          "anecdote. It is also the gate on deployment and on how much autonomy " +
          "the system can safely have.",
      },
      {
        key: "hallucination_rate",
        name: "Hallucination / factual error rate",
        definition:
          "Share of system outputs that are unsupported, fabricated, or factually " +
          "wrong relative to ground truth or provided context — the reliability " +
          "ceiling that bounds how much a system can be trusted to act unsupervised.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 15,
          basis:
            "Grounded RAG/agent systems with good retrieval and guardrails push " +
            "factual-error rates low, but never to zero; ungrounded generation runs " +
            "far higher; rate depends heavily on task, grounding quality, and model — " +
            "a directional ceiling to drive down, not a fixed bar",
          label: "planning-range",
        },
        dataSource:
          "Faithfulness/groundedness evals (context-attribution, LLM-judge), human review samples, production error/escalation logs",
        whyItMatters:
          "Hallucination, not raw capability, decides autonomy. A system you cannot " +
          "trust to be right must stay human-in-the-loop. Grounding (RAG, citations, " +
          "tool-use) lowers this rate but never eliminates it — so it must be measured, not assumed.",
      },
      {
        key: "prototype_to_production_time",
        name: "Time from prototype to production",
        definition:
          "Elapsed time from a working AI prototype/demo to a deployed, evaluated, " +
          "guardrailed production capability serving real users — the honest measure " +
          "of the last-mile gap where most AI initiatives stall.",
        unit: "weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 39,
          basis:
            "The demo→production last mile (evals, guardrails, latency/cost " +
            "hardening, integration, monitoring) commonly takes a quarter to three " +
            "quarters; many prototypes never cross it at all — a wide planning range " +
            "reflecting how variable and underestimated this gap is",
          label: "planning-range",
        },
        dataSource:
          "Delivery/project records tracking prototype acceptance → first production serving, per use case",
        whyItMatters:
          "The demo→production gap is where AI value dies. A short, repeatable path " +
          "from prototype to production is the core capability of an AI engineering " +
          "org; a graveyard of impressive demos that never shipped is the failure pattern.",
      },
      {
        key: "inference_cost_per_request",
        name: "Inference cost per request",
        definition:
          "Fully-loaded model/inference cost to serve one request (or one resolved " +
          "task), including prompt + completion tokens, retrieval/embedding calls, " +
          "and any multi-step agent/tool turns — the unit economics of running the system.",
        unit: "USD per request (or per resolved task)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.001,
          high: 0.5,
          basis:
            "Per-request cost spans orders of magnitude — a single small-model call " +
            "is sub-cent, while a multi-step agent with large-model reasoning, " +
            "retrieval, and tool turns can run to dimes or dollars; the planning range " +
            "is wide because architecture and model choice dominate",
          label: "planning-range",
        },
        dataSource:
          "Token-usage telemetry × model price, joined to request volume; agent/tool-turn accounting per use case",
        whyItMatters:
          "Inference cost is a real constraint that can quietly destroy unit " +
          "economics at scale. 'Use the biggest model everywhere' is rarely right — " +
          "model routing, caching, and prompt economy are core engineering levers, not afterthoughts.",
      },
      {
        key: "p95_latency",
        name: "p95 end-to-end latency",
        definition:
          "95th-percentile time from user request to complete response, including " +
          "retrieval, model inference (and any multi-step/tool turns), and " +
          "post-processing — the tail latency that governs perceived reliability and UX.",
        unit: "milliseconds (or seconds for agentic flows)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 500,
          high: 10000,
          basis:
            "Interactive single-shot LLM responses target sub-second-to-few-seconds " +
            "p95 (streaming masks some of it); multi-step agentic flows run much " +
            "longer — a wide planning range because acceptable latency is entirely " +
            "use-case-dependent",
          label: "planning-range",
        },
        dataSource:
          "Application performance monitoring / tracing across the inference path (retrieval, model, tools), measured at p95/p99",
        whyItMatters:
          "Latency is a first-order constraint, not a tuning detail. A correct answer " +
          "that arrives too slowly fails the UX; tail (p95/p99) latency, not the mean, " +
          "is what users feel — and agentic multi-step flows make it worse.",
      },
      {
        key: "retrieval_precision_recall",
        name: "Retrieval precision / recall (RAG)",
        definition:
          "Quality of the retrieval step in a RAG system: precision (share of " +
          "retrieved chunks that are relevant) and recall (share of relevant " +
          "context actually retrieved) — the upstream determinant of answer " +
          "faithfulness, because the model can only ground in what retrieval surfaced.",
        unit: "% (precision and recall, or F1 / hit-rate / MRR)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Retrieval quality varies enormously with chunking, embeddings, and " +
            "re-ranking; well-tuned systems reach high precision/recall on in-domain " +
            "queries but degrade on ambiguous or out-of-corpus questions — a wide " +
            "planning range, measured per corpus",
          label: "planning-range",
        },
        dataSource:
          "Retrieval evals against a labelled query→relevant-chunk set; hit-rate / MRR / nDCG on a golden retrieval set",
        whyItMatters:
          "Most RAG failures are retrieval failures, not generation failures. If the " +
          "right context is not retrieved, no model can answer faithfully — so " +
          "retrieval precision/recall must be measured separately from answer quality.",
      },
      {
        key: "eval_coverage",
        name: "% use cases with offline + online eval",
        definition:
          "Share of production (or production-bound) AI use cases that have BOTH an " +
          "offline eval harness (golden/labelled set) AND online evaluation " +
          "(production telemetry, sampling, or feedback) wired in — the maturity " +
          "signal for whether the org can tell quality from anecdote at scale.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 90,
          basis:
            "Eval maturity is the single biggest differentiator between AI orgs that " +
            "ship reliably and those that don't; many start near zero (vibes-based) " +
            "and mature toward broad offline+online coverage — a wide planning range " +
            "reflecting that spread",
          label: "planning-range",
        },
        dataSource:
          "Inventory of AI use cases cross-referenced with the eval platform/harness registry (offline harnesses + online eval wiring)",
        whyItMatters:
          "You cannot improve or trust what you do not evaluate. Offline evals catch " +
          "regressions before deploy; online evals catch drift and real-world " +
          "failures. Coverage of both is the honest maturity bar — vibes-based " +
          "shipping is the anti-pattern.",
      },
      {
        key: "model_drift_incidents",
        name: "Model / version drift incidents",
        definition:
          "Count of incidents where a model/prompt/version change, or a shift in " +
          "input or retrieval-corpus distribution, degraded quality in production — " +
          "the operability signal for whether changes are caught by evals before users are.",
        unit: "incidents per quarter",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 6,
          basis:
            "Mature LLMOps with regression evals on every model/prompt change keeps " +
            "drift incidents near zero; orgs without eval gates discover drift through " +
            "user complaints — a directional planning range to drive down",
          label: "planning-range",
        },
        dataSource:
          "Change/incident log correlated to model, prompt, and corpus version changes; online eval regression alerts",
        whyItMatters:
          "LLM systems are non-stationary: model upgrades, prompt edits, and corpus " +
          "changes all silently shift behavior. Drift caught by evals is a non-event; " +
          "drift caught by users is an incident — this metric tells which world you live in.",
      },
      {
        key: "guardrail_coverage",
        name: "Guardrail coverage",
        definition:
          "Share of production AI surfaces protected by input/output guardrails — " +
          "prompt-injection and jailbreak defenses, PII/secret filtering, toxicity/" +
          "safety filters, schema/format validation, and grounding/citation checks — " +
          "the safety-net depth around generative outputs.",
        unit: "% of production surfaces",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 100,
          basis:
            "Risk-appropriate coverage; customer-facing and tool-acting surfaces " +
            "warrant near-full guardrail coverage, internal/low-risk surfaces less — " +
            "a planning range, because over-guarding adds latency/cost and under-" +
            "guarding adds risk",
          label: "planning-range",
        },
        dataSource:
          "Inventory of production AI surfaces cross-referenced with deployed guardrail/policy components (input + output)",
        whyItMatters:
          "Guardrails are how a probabilistic, attackable system is made safe enough " +
          "to deploy. Coverage must be risk-weighted: tool-acting and customer-facing " +
          "surfaces need the most. Guardrails add latency and cost, so coverage is an " +
          "engineering trade-off, not a free maximize.",
      },
      {
        key: "agent_task_success_rate",
        name: "Agent task success rate",
        definition:
          "Share of delegated agentic tasks an autonomous/semi-autonomous agent " +
          "completes correctly end-to-end (right outcome, no harmful side effects) " +
          "without human rescue — the reliability signal that gates how much real " +
          "autonomy an agent can be given.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Multi-step agent reliability compounds — each step's error rate " +
            "multiplies — so end-to-end success on non-trivial tasks is often well " +
            "below single-call accuracy; narrow, well-bounded tasks reach high " +
            "success, open-ended ones much lower",
          label: "planning-range",
        },
        dataSource:
          "Agent eval suite (task→success/failure with side-effect checks) plus production task outcome + human-intervention logs",
        whyItMatters:
          "Autonomy must be earned by measured success. Error compounds across steps, " +
          "so a 95%-per-step agent can fail most multi-step tasks. Success rate, with " +
          "side-effect checks, decides whether an agent runs supervised, on-the-loop, or unattended.",
      },
      {
        key: "cost_per_resolved_task",
        name: "Cost per resolved task / outcome",
        definition:
          "Fully-loaded inference cost to actually RESOLVE a task or deliver an " +
          "outcome (e.g. a deflected support ticket, a completed agent job), " +
          "including retries, fallbacks, and escalation — the outcome-level unit " +
          "economic that ties cost to value, not just to a request.",
        unit: "USD per resolved task",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.01,
          high: 2,
          basis:
            "Cost per resolved outcome includes retries, multi-turn reasoning, and " +
            "the fraction of attempts that fail and escalate — so it sits well above " +
            "raw per-request cost; spans a wide range by task complexity and success rate",
          label: "planning-range",
        },
        dataSource:
          "Inference-cost telemetry attributed to resolved outcomes (success-weighted), including retries/escalations, joined to outcome counts",
        whyItMatters:
          "The honest economic unit. A cheap per-request model that fails often and " +
          "retries/escalates can cost more per RESOLVED task than a pricier model " +
          "that succeeds first time — so cost must be measured against outcomes, not requests.",
      },
    ],

    painThemes: [
      {
        key: "demo_to_production_gap",
        name: "Demo-to-production gap (the last mile)",
        description:
          "An impressive prototype is mistaken for a finished product, but the " +
          "last mile — evals, guardrails, latency/cost hardening, integration, " +
          "monitoring, edge cases — is the bulk of the real work; the demo crosses " +
          "the line and the production system stalls or never ships.",
        detectionSignal:
          "A backlog of impressive demos and pilots that never reached production; " +
          "no eval harness, guardrails, or monitoring behind the demo; 'we built it, " +
          "why isn't it live?'; prototype-to-production time long or unmeasured.",
        diagnosticQuestion:
          "Of your AI prototypes and pilots, how many have crossed into evaluated, " +
          "guardrailed production — and what is your typical time and failure rate on that last mile?",
      },
      {
        key: "no_evals_vibes_based",
        name: "Vibes-based shipping (no evals)",
        description:
          "The system is shipped and changed on subjective impressions — 'it looks " +
          "good' — with no golden set, no offline eval harness, and no online " +
          "quality measurement, so the team cannot tell improvement from regression " +
          "or anecdote from signal.",
        detectionSignal:
          "No eval pass rate or golden set; quality assessed by spot-checking " +
          "outputs; prompt/model changes shipped without regression evals; eval " +
          "coverage low or zero; 'it seems better' as the bar.",
        diagnosticQuestion:
          "How do you measure answer quality — do you have offline golden-set evals " +
          "and online evaluation wired in, or is quality judged by impression?",
      },
      {
        key: "hallucination_reliability_ceiling",
        name: "Hallucination / reliability ceiling on autonomy",
        description:
          "The system confidently produces plausible-but-wrong outputs at a rate " +
          "that hasn't been measured, so it is either over-trusted (given autonomy " +
          "it hasn't earned) or under-trusted (kept manual when it could be " +
          "grounded and safely automated); error rate, not capability, is the real ceiling.",
        detectionSignal:
          "No measured hallucination/factuality rate; outputs ungrounded or " +
          "uncited; users reporting confident wrong answers; autonomy decisions made " +
          "on optimism rather than measured error rate.",
        diagnosticQuestion:
          "What is your measured hallucination/factual-error rate per use case, and " +
          "is the level of autonomy you've granted justified by that number?",
      },
      {
        key: "inference_cost_blowout",
        name: "Inference cost blow-out at scale",
        description:
          "Per-request token cost that looked trivial in the pilot becomes a " +
          "material run-rate at production volume — driven by oversized models " +
          "everywhere, bloated prompts/context, multi-step agent turns, and no " +
          "caching or routing — quietly breaking the unit economics.",
        detectionSignal:
          "'Use the biggest model for everything' as default; no model routing/" +
          "tiering, prompt-caching, or context economy; inference spend rising " +
          "faster than value; cost-per-resolved-task untracked.",
        diagnosticQuestion:
          "What is your inference cost per request and per resolved task, and what " +
          "model-routing, caching, and prompt-economy levers have you applied — or is the big model the default everywhere?",
      },
      {
        key: "latency_ux_failure",
        name: "Latency / tail-latency UX failure",
        description:
          "The system is accurate but too slow — especially at p95/p99 and in " +
          "multi-step agentic flows — so users abandon it or route around it; " +
          "latency is treated as a tuning detail rather than a first-order constraint " +
          "that streaming, model choice, and architecture must be designed around.",
        detectionSignal:
          "p95/p99 latency unmeasured or far above the UX threshold; no streaming; " +
          "agentic flows that take many seconds with no progress feedback; users " +
          "complaining the AI is 'too slow' or going back to the old path.",
        diagnosticQuestion:
          "What is your p95/p99 end-to-end latency per surface, and is it within " +
          "the UX threshold for that interaction — including your multi-step agent flows?",
      },
      {
        key: "rag_retrieval_failure",
        name: "RAG retrieval failure mistaken for model failure",
        description:
          "Faithfulness problems are blamed on the model when the real failure is " +
          "retrieval — poor chunking, weak embeddings, no re-ranking, stale or " +
          "incomplete corpus — so the right context never reaches the model and no " +
          "amount of prompt tuning or model upgrade fixes it.",
        detectionSignal:
          "Retrieval precision/recall unmeasured; 'the model is hallucinating' with " +
          "no retrieval eval; answers grounded in wrong/missing chunks; effort spent " +
          "on prompts/models while retrieval quality is unknown.",
        diagnosticQuestion:
          "Have you measured retrieval precision/recall separately from answer " +
          "quality — and how many of your faithfulness failures are actually retrieval failures?",
      },
      {
        key: "missing_guardrails",
        name: "Missing or uneven guardrails",
        description:
          "Production generative surfaces lack input/output guardrails — no prompt-" +
          "injection or jailbreak defense, PII/secret filtering, output validation, " +
          "or grounding checks — leaving an attackable, probabilistic system exposed; " +
          "or guardrails are applied uniformly, adding latency/cost where risk is low.",
        detectionSignal:
          "Tool-acting or customer-facing surfaces with no input/output guardrails; " +
          "no prompt-injection/jailbreak testing; PII/secrets unfiltered; guardrail " +
          "coverage low or not risk-weighted.",
        diagnosticQuestion:
          "What input and output guardrails protect each production surface, and is " +
          "coverage risk-weighted — most on tool-acting and customer-facing surfaces?",
      },
      {
        key: "llmops_drift_blindness",
        name: "LLMOps drift blindness (non-stationary systems)",
        description:
          "Model upgrades, prompt edits, and corpus changes silently shift behavior, " +
          "but there are no regression evals gating changes and no online monitoring, " +
          "so drift is discovered through user complaints rather than caught before " +
          "deploy — the system is operated as if it were deterministic when it is not.",
        detectionSignal:
          "Prompt/model/corpus changes shipped without regression evals; no online " +
          "quality monitoring or alerting; no prompt/model version control; drift " +
          "found via user complaints; model-drift incidents recurring.",
        diagnosticQuestion:
          "When you change a model, prompt, or corpus, what regression evals gate " +
          "the change, and what online monitoring would catch drift before your users do?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "rag_grounded_assistant",
        name: "RAG-grounded knowledge assistant",
        valueMechanism:
          "Ground LLM answers in a retrieved corpus (vector + keyword/hybrid " +
          "retrieval, re-ranking, citations) so the system answers from " +
          "authoritative content rather than parametric memory — cutting " +
          "hallucination and making answers traceable. Value shows up as a lower " +
          "hallucination rate and higher eval pass rate at acceptable latency and " +
          "cost, NOT as a flashy demo; retrieval precision/recall is the upstream lever.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "A curated, chunked, embedded corpus with freshness/ownership and access scoping",
          "A labelled retrieval golden set (query → relevant chunks) for retrieval evals",
          "A faithfulness/answer-quality eval set to measure grounding",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Faithfulness depends on retrieval quality — measure retrieval precision/recall separately from answer quality",
          "Citations must be verifiable, not decorative; grounded does not mean infallible — still sample for hallucination",
        ],
        metricsMoved: [
          "retrieval_precision_recall",
          "hallucination_rate",
          "eval_pass_rate",
          "p95_latency",
        ],
      },
      {
        key: "agentic_workflow",
        name: "Agentic workflow (bounded multi-step automation)",
        valueMechanism:
          "Delegate bounded, well-specified multi-step tasks to an agent with " +
          "tools (retrieval, APIs, code execution) under a control posture matched " +
          "to its measured reliability — removing repetitive task chains from human " +
          "queues. Value is realized as agent task success at acceptable cost per " +
          "resolved task; autonomy is gated by measured success and side-effect " +
          "safety, because per-step error compounds across the chain.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Clear task boundaries, success criteria, and side-effect/safety checks",
          "Scoped tool/API permissions with full audit logging",
          "An agent eval suite (task → success/failure with side-effect verification)",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Per-step error compounds — measure end-to-end task success, not single-call accuracy, before granting autonomy",
          "Tool-acting agents need the strongest guardrails and audit; only delegate well-bounded tasks",
        ],
        metricsMoved: [
          "agent_task_success_rate",
          "cost_per_resolved_task",
          "guardrail_coverage",
          "p95_latency",
        ],
      },
      {
        key: "llm_eval_harness",
        name: "LLM evaluation harness & quality platform",
        valueMechanism:
          "Stand up offline golden-set evals plus LLM-as-judge (human-calibrated) " +
          "and online evaluation so every use case has a measured quality bar and " +
          "every model/prompt change is regression-gated — converting vibes-based " +
          "shipping into measured engineering. Value is realized as higher eval " +
          "coverage, a rising eval pass rate, and fewer drift incidents caught before users.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Curated golden/labelled sets representative of real production traffic",
          "Production telemetry / sampling / user feedback for online evals",
          "Human-labelled calibration data to validate any LLM-judge",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "LLM-as-judge must be calibrated against human labels or it manufactures false confidence",
          "Golden sets drift from real traffic — refresh them, or eval pass rate becomes its own vanity metric",
        ],
        metricsMoved: [
          "eval_coverage",
          "eval_pass_rate",
          "model_drift_incidents",
        ],
      },
      {
        key: "guardrail_safety_layer",
        name: "Guardrail & safety layer (input/output controls)",
        valueMechanism:
          "Wrap production surfaces in input/output guardrails — prompt-injection " +
          "and jailbreak defense, PII/secret filtering, toxicity/safety filters, " +
          "schema/format validation, and grounding/citation checks — so a " +
          "probabilistic, attackable system is made safe enough to deploy. Value is " +
          "realized as risk-weighted guardrail coverage and a lower hallucination/" +
          "harmful-output rate, accepting the latency and cost the checks add.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "An inventory of production surfaces classified by risk (tool-acting, customer-facing, internal)",
          "Adversarial / red-team test sets for injection, jailbreak, and PII leakage",
          "Policy definitions for blocked content, schema contracts, and grounding thresholds",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Guardrails add latency and cost — coverage must be risk-weighted, not a uniform maximize",
          "Guardrails reduce but do not eliminate risk; they are a layer, not a guarantee — keep humans on the loop for high-risk surfaces",
        ],
        metricsMoved: [
          "guardrail_coverage",
          "hallucination_rate",
          "p95_latency",
        ],
      },
      {
        key: "model_routing_cost_optimization",
        name: "Model routing & inference cost optimization",
        valueMechanism:
          "Route each request to the smallest model that meets its quality bar, " +
          "with prompt-caching, context economy, batching, and small-model/distilled " +
          "fallbacks — so cost and latency are minimized without dropping below the " +
          "eval-measured quality threshold. Value is realized as lower inference cost " +
          "per request and per resolved task, and lower p95 latency, at held eval pass rate.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Per-request token-usage and latency telemetry joined to model price",
          "Per-tier eval pass rates so routing never trades below the quality bar",
          "Traffic/cost profiling by use case to find routing and caching opportunities",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Routing must be gated by eval pass rate — cheaper is only a win if quality holds",
          "Aggressive caching/routing can introduce subtle quality drift; re-evaluate routed tiers regularly",
        ],
        metricsMoved: [
          "inference_cost_per_request",
          "cost_per_resolved_task",
          "p95_latency",
          "eval_pass_rate",
        ],
      },
      {
        key: "llmops_deployment_pipeline",
        name: "LLMOps deployment & observability pipeline",
        valueMechanism:
          "Productionize AI systems with prompt/model version control, regression-" +
          "eval gates on every change, tracing/observability across the inference " +
          "path, and online quality monitoring with rollback — turning the demo→" +
          "production last mile into a repeatable, safe pipeline. Value is realized " +
          "as shorter prototype-to-production time and fewer drift incidents, with " +
          "evals catching regressions before users do.",
        adoptionProfile: "early",
        dataDependencies: [
          "Versioned prompts, models, and corpus snapshots tied to deployments",
          "Tracing/telemetry across retrieval, model, and tool turns",
          "Regression eval sets and online quality signals wired into the deploy gate",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A deploy gate is only as good as its eval set — thin evals pass bad changes",
          "Observability must span the whole inference path; tracing only the model misses retrieval and tool failures",
        ],
        metricsMoved: [
          "prototype_to_production_time",
          "model_drift_incidents",
          "eval_coverage",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "eval_first_delivery",
        name: "Eval-first delivery baseline",
        description:
          "An evaluation layer stood up BEFORE scaling a use case: a representative " +
          "golden set, an offline eval harness, an online evaluation hook, and a " +
          "human-calibrated LLM-judge where automation helps — establishing the " +
          "measured quality bar (eval pass rate, hallucination rate, retrieval " +
          "precision/recall) that every change and every deployment decision is held " +
          "to. It is the antidote to vibes-based shipping: no quality claim without a measured eval.",
        boundary:
          "Owns the eval methodology, golden sets, judge calibration, and the " +
          "quality dashboards; does not set the quality bar (the product/risk owner " +
          "does) or make the ship decision — it supplies the honest numbers that " +
          "decision uses.",
        humanAccountabilityPoint:
          "Head of AI Engineering / ML Platform lead (with the product owner who sets each use case's quality bar)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "grounded_rag_architecture",
        name: "Grounded RAG retrieval architecture",
        description:
          "A retrieval-augmented architecture — hybrid (vector + keyword) retrieval, " +
          "deliberate chunking, re-ranking, citation/grounding, and a measured " +
          "retrieval golden set — designed so answers are grounded in authoritative, " +
          "access-scoped content and faithfulness is driven by measurable retrieval " +
          "quality rather than parametric guesswork.",
        boundary:
          "Owns retrieval, chunking, embedding, re-ranking, and the grounding/" +
          "citation contract; does not own the source corpus's content, ownership, " +
          "or the underlying data platform (a separate data-foundation responsibility).",
        humanAccountabilityPoint:
          "AI/ML engineering lead for the retrieval system (with the corpus/data owner)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "llmops_pipeline",
        name: "LLMOps pipeline (version, gate, observe, rollback)",
        description:
          "A deployment and operations pattern that treats LLM systems as " +
          "non-stationary: versioned prompts/models/corpus, regression-eval gates on " +
          "every change, end-to-end tracing/observability across retrieval-model-tool, " +
          "online quality monitoring with alerting, and fast rollback — making the " +
          "demo→production last mile repeatable and drift caught before users feel it.",
        boundary:
          "Owns the deployment pipeline, version control, eval gates, tracing, and " +
          "rollback; does not own the model vendor relationship or the eval set " +
          "content itself (supplied by eval-first delivery).",
        humanAccountabilityPoint:
          "ML/LLMOps platform lead (with on-call engineering for production AI surfaces)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "guardrail_safety_architecture",
        name: "Guardrail & safety architecture (risk-weighted)",
        description:
          "An input/output guardrail layer applied risk-weighted across production " +
          "surfaces — prompt-injection/jailbreak defense, PII/secret filtering, " +
          "toxicity/safety filters, schema/format validation, and grounding checks — " +
          "with adversarial/red-team testing, so generative surfaces are made safe " +
          "enough to deploy while accepting the latency/cost the checks add and " +
          "concentrating coverage on tool-acting and customer-facing surfaces.",
        boundary:
          "Owns the guardrail components, policy definitions, and adversarial " +
          "testing of the AI surface; does not own enterprise AI governance/policy " +
          "or the model-risk sign-off itself (a separate AI Governance responsibility).",
        humanAccountabilityPoint:
          "AI safety / application-security engineering lead (with the AI Governance owner for policy)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "cost_latency_optimization_layer",
        name: "Cost & latency optimization layer (routing + caching)",
        description:
          "A serving-layer pattern that drives inference cost and latency down " +
          "without dropping below the eval-measured quality bar: model routing/" +
          "tiering to the smallest sufficient model, prompt-caching, context economy, " +
          "batching, streaming for perceived latency, and distilled/small-model " +
          "fallbacks — keeping the unit economics and UX of a working system viable at scale.",
        boundary:
          "Owns model routing, caching, and serving-layer optimization; does not " +
          "own the model vendor commercial terms or the quality bar each tier must " +
          "meet (set by eval-first delivery and the product owner).",
        humanAccountabilityPoint:
          "AI platform / inference-serving engineering lead (with Finance for the cost envelope)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "AI engineering value is realized as a RELIABLE, EVALUATED, AFFORDABLE " +
        "production system that delivers outcomes — not as an impressive demo. The " +
        "honest chain is: a prototype proves a capability is possible; evals " +
        "establish whether it actually meets a quality bar; grounding (RAG, " +
        "tool-use, citations) and guardrails reduce the hallucination/error rate " +
        "enough to justify a given level of autonomy; cost and latency optimization " +
        "keep the unit economics and UX viable at scale; and LLMOps makes the whole " +
        "thing repeatable and drift-safe. Each step is haircut: the demo→production " +
        "last mile consumes most of the effort and kills many initiatives outright; " +
        "the hallucination/reliability ceiling caps how much can be automated " +
        "(forcing human-in-the-loop and give-back); inference cost and latency at " +
        "production volume erode the economics; and attribution of any business " +
        "outcome to the AI system (versus process or product change) is uncertain. " +
        "Value only books when a use case is in evaluated production with a measured " +
        "quality, cost, and latency envelope — never on the strength of a demo, an " +
        "eval pass rate on an unrepresentative set, or a projected token-cost saving " +
        "with no production volume behind it.",
      dominantHaircutFactors: [
        {
          factor: "Demo→production last-mile attrition",
          rationale:
            "Most of the engineering effort — and most initiative failure — lives " +
            "in the last mile (evals, guardrails, latency/cost hardening, " +
            "integration, monitoring). Many impressive prototypes never cross it, so " +
            "demo-stage value must be discounted heavily until production is real.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Share of prototype-implied value lost to the unshipped or stalled last mile across enterprise GenAI initiatives",
            label: "planning-range",
          },
        },
        {
          factor: "Reliability / hallucination ceiling (autonomy give-back)",
          rationale:
            "Measured error rate caps how much can run unsupervised; the residual " +
            "human-in-the-loop oversight, retries, and escalations give back a slice " +
            "of the automation value that an optimistic case assumed away.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Automation value retained after human-in-the-loop, retries, and escalation are subtracted, given measured error rates",
            label: "planning-range",
          },
        },
        {
          factor: "Inference cost & latency at scale",
          rationale:
            "Per-request economics that looked trivial in the pilot become material " +
            "at production volume; cost per resolved task (with retries/escalation) " +
            "and tail latency erode net value unless routing, caching, and economy are applied.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Net-value erosion from production-scale inference cost and latency before model-routing/caching optimization",
            label: "planning-range",
          },
        },
        {
          factor: "Outcome attribution uncertainty",
          rationale:
            "Business outcomes move for many reasons at once (process, product, " +
            "market); without a baseline or controlled comparison the AI system is " +
            "credited for changes it did not solely cause.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Attribution gap where no baseline or controlled comparison isolates the AI system's contribution to the outcome",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Hallucination / error-rate reduction from grounding + guardrails",
          range: {
            low: 0.3,
            high: 0.8,
            basis:
              "Relative reduction in factual-error rate when ungrounded generation is replaced by tuned RAG + risk-weighted guardrails, measured on a faithfulness eval set",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in hallucination_rate on a representative faithfulness eval set, retrieval quality held or improved",
        },
        {
          lever: "Inference cost reduction from routing + caching (quality held)",
          range: {
            low: 0.2,
            high: 0.7,
            basis:
              "Relative inference-cost reduction from model routing/tiering, prompt-caching, and context economy at held eval pass rate",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in inference_cost_per_request / cost_per_resolved_task with eval_pass_rate flat or up",
        },
        {
          lever: "Prototype-to-production acceleration from LLMOps + eval-first",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Relative reduction in last-mile time once a repeatable eval-gated LLMOps pipeline exists, versus bespoke per-use-case productionization",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in prototype_to_production_time across use cases sharing the pipeline",
        },
      ],
      timeToValueBand:
        "RAG-grounded assistants and an eval harness: 1-2 quarters to a measured " +
        "quality bar and first evaluated production serving on a bounded corpus. " +
        "Guardrail/safety layer and cost/latency optimization: 1-3 quarters, " +
        "layered onto a working system. LLMOps deployment pipeline: 2-4 quarters " +
        "to a repeatable, drift-safe last mile across use cases. Agentic workflows: " +
        "3-6+ quarters given bounding, tool permissions, agent evals, and the " +
        "compounding-reliability bar that gates real autonomy.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Foundation-model / inference platform",
          role: "Where model calls run — the source of token-usage, cost, and latency telemetry and the model/version surface.",
          examples: ["Anthropic Claude API", "OpenAI API", "Azure OpenAI", "AWS Bedrock", "self-hosted inference (vLLM)"],
        },
        {
          name: "Vector store & retrieval layer",
          role: "Holds embeddings and powers RAG retrieval — the source of retrieval quality (precision/recall) signals.",
          examples: ["pgvector / Postgres", "Pinecone", "Weaviate", "Elasticsearch/OpenSearch hybrid", "Azure AI Search"],
        },
        {
          name: "Eval / LLMOps platform",
          role: "Runs offline and online evals, traces the inference path, and gates deployments — the source of eval pass rate, coverage, and drift signals.",
          examples: ["LLM eval/observability platforms", "tracing tools (OpenTelemetry-based)", "in-house eval harnesses", "PostHog LLM analytics"],
        },
        {
          name: "Orchestration / agent framework",
          role: "Wires retrieval, tools, and multi-step agent flows — the surface where prompts, tool permissions, and agent control posture live.",
          examples: ["agent/orchestration frameworks", "tool/function-calling layers", "workflow/durable-execution runtimes"],
        },
        {
          name: "Guardrail & safety layer",
          role: "Applies input/output controls on production surfaces — the source of guardrail coverage and blocked-event signals.",
          examples: ["prompt-injection/jailbreak filters", "PII/secret redaction", "schema/format validators", "content-safety classifiers"],
        },
      ],
      roles: [
        {
          title: "Head of AI Engineering / Applied AI lead",
          accountability:
            "End-to-end delivery and operation of AI systems — the demo→production last mile, eval discipline, and the build-and-operate craft.",
        },
        {
          title: "ML / LLMOps platform engineer",
          accountability:
            "The deployment pipeline, prompt/model version control, eval gates, tracing/observability, and rollback for production AI.",
        },
        {
          title: "AI / ML engineer (RAG, agents, prompts)",
          accountability:
            "Building the system itself — retrieval, agent flows, prompt/agent engineering, and the per-use-case quality bar.",
        },
        {
          title: "AI safety / application-security engineer",
          accountability:
            "Guardrails, adversarial/red-team testing, and the risk-weighted safety layer on production generative surfaces.",
        },
        {
          title: "AI product owner",
          accountability:
            "Sets each use case's quality bar, acceptable error/latency/cost envelope, and the ship decision against measured evals.",
        },
      ],
      regulatoryFrames: [
        {
          name: "AI risk-management & assurance frameworks (NIST AI RMF, ISO/IEC 42001)",
          relevance:
            "Shape how AI systems must be evaluated, monitored, and documented before and during production — the engineering evidence the governance layer consumes.",
        },
        {
          name: "Data privacy & confidentiality (GDPR/CCPA, trade secret)",
          relevance:
            "Sending data and proprietary content to external models, and storing it in vector stores, implicates privacy, residency, and trade-secret protection.",
        },
        {
          name: "AI safety & content-safety obligations (EU AI Act high-risk duties)",
          relevance:
            "Higher-risk AI surfaces carry evaluation, transparency, human-oversight, and robustness duties that the engineering of evals and guardrails must satisfy.",
        },
        {
          name: "Application security & secure-development standards (OWASP LLM Top 10, NIST SSDF)",
          relevance:
            "Define the injection/jailbreak/data-leakage threats guardrails and red-teaming must address in AI-system delivery.",
        },
      ],
      canonicalTerms: [
        {
          term: "Eval (offline / online)",
          definition:
            "Measurement of AI-system quality against a defined bar — offline on a curated golden/labelled set, online on production telemetry/feedback. The honest unit of 'does it work', as opposed to a demo impression.",
        },
        {
          term: "Hallucination / faithfulness",
          definition:
            "A hallucination is an unsupported or fabricated output; faithfulness is how well an output is grounded in provided context. The reliability ceiling that bounds autonomy.",
        },
        {
          term: "RAG (retrieval-augmented generation)",
          definition:
            "Grounding generation in retrieved content (vector/hybrid retrieval, chunking, re-ranking, citations) so answers come from authoritative context rather than parametric memory.",
        },
        {
          term: "LLMOps",
          definition:
            "The operational discipline for non-stationary LLM systems: prompt/model/corpus version control, regression-eval gates, tracing/observability, online monitoring, and rollback.",
        },
        {
          term: "Guardrails",
          definition:
            "Input/output controls around a generative system — prompt-injection/jailbreak defense, PII/secret filtering, content-safety, schema validation, grounding checks — making it safe enough to deploy.",
        },
        {
          term: "Model routing / tiering",
          definition:
            "Sending each request to the smallest model that meets its quality bar, with caching and fallbacks, to optimize inference cost and latency without dropping below the eval-measured threshold.",
        },
        {
          term: "Agent task success rate",
          definition:
            "End-to-end share of delegated agentic tasks completed correctly with no harmful side effects; because per-step error compounds, it sits below single-call accuracy and gates real autonomy.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "The system meets its quality bar (it actually works)",
        authoritativeSource:
          "Eval pass rate and faithfulness/hallucination rate on a representative golden set, plus online quality sampling in production",
        whatGoodEvidenceLooksLike:
          "A measured eval pass rate and hallucination rate on a golden set that mirrors real traffic, confirmed by online evaluation on production data, with the quality bar stated per use case.",
        weakEvidenceToReject:
          "A successful demo, a curated cherry-picked example set, or 'it looks good' — no representative eval, no online measurement.",
      },
      {
        claim: "Retrieval quality (RAG grounding) is sufficient",
        authoritativeSource:
          "Retrieval precision/recall (hit-rate / MRR / nDCG) on a labelled query→relevant-chunk golden set, measured separately from answer quality",
        whatGoodEvidenceLooksLike:
          "Retrieval metrics measured on a labelled retrieval set, with faithfulness failures traced to retrieval vs generation so the right layer is fixed.",
        weakEvidenceToReject:
          "'The model is hallucinating' with no retrieval eval; answer-quality numbers presented as if they prove retrieval works.",
      },
      {
        claim: "Cost and latency are viable at production scale",
        authoritativeSource:
          "Token-usage × price and tracing telemetry at production volume — inference cost per request, cost per resolved task (with retries/escalation), and p95/p99 latency",
        whatGoodEvidenceLooksLike:
          "Cost and tail-latency measured at real production volume per use case, including retries and escalations, against the stated economic and UX envelope.",
        weakEvidenceToReject:
          "Pilot-volume per-request cost extrapolated linearly, mean latency presented as p95, or cost stated per request when the unit that matters is per resolved task.",
      },
      {
        claim: "Autonomy is justified by measured reliability",
        authoritativeSource:
          "Agent task success rate (with side-effect checks) on an agent eval suite, plus production task-outcome and human-intervention logs",
        whatGoodEvidenceLooksLike:
          "End-to-end task success on a representative agent eval set, with side-effect safety verified, and a control posture (in-the-loop / on-the-loop / unattended) chosen to match that measured number.",
        weakEvidenceToReject:
          "Single-call accuracy cited as agent reliability, autonomy granted on demo confidence, or task success claimed with no side-effect/safety verification.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Of your AI prototypes and pilots, how many have crossed into evaluated, guardrailed production — and what is your typical time and failure rate on that last mile?",
      "How do you measure answer quality — do you have offline golden-set evals and online evaluation wired in, and what is your eval coverage and pass rate per use case?",
      "What is your measured hallucination/factual-error rate per use case, and is the level of autonomy you've granted justified by that number?",
      "Have you measured retrieval precision/recall separately from answer quality — and how many faithfulness failures are actually retrieval failures?",
      "What is your inference cost per request and per resolved task, and what model-routing, caching, and prompt-economy levers have you applied?",
      "What is your p95/p99 end-to-end latency per surface, including multi-step agent flows, and is it within the UX threshold?",
      "What input and output guardrails protect each production surface, and is coverage risk-weighted toward tool-acting and customer-facing surfaces?",
      "When you change a model, prompt, or corpus, what regression evals gate the change, and what online monitoring would catch drift before your users do?",
    ],
    maturitySignals: [
      "Every production-bound use case has both an offline golden-set eval and online evaluation; quality is measured, not impressionistic.",
      "Hallucination/error rate is measured per use case and autonomy/control posture is chosen to match it, not granted on optimism.",
      "Retrieval quality (precision/recall) is measured separately from answer quality, so RAG failures are diagnosed at the right layer.",
      "Inference cost (per request and per resolved task) and p95/p99 latency are tracked and actively optimized via routing, caching, and economy.",
      "Production surfaces are protected by risk-weighted guardrails, and an LLMOps pipeline version-controls prompts/models and regression-gates every change.",
    ],
    redFlags: [
      "A backlog of impressive demos and pilots that never reached evaluated production — the demo→production gap is wide and unmeasured.",
      "Quality is judged by impression with no golden set, no offline eval harness, and no online evaluation — vibes-based shipping.",
      "Hallucination/error rate is unmeasured, yet the system has been granted autonomy or is trusted to act unsupervised.",
      "Inference cost per request/resolved task and p95/p99 latency are untracked, with 'use the biggest model everywhere' as the default.",
      "Prompts/models/corpus are changed without regression evals or online monitoring, so drift is discovered through user complaints.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Frontier model / inference providers (Anthropic, OpenAI, others)",
        category: "Foundation models and inference APIs for generation, reasoning, embeddings, and agents",
        switchingCost:
          "Moderate — the model layer is increasingly portable via abstraction, but prompt/agent workflows, evals tuned to a model's behavior, and deep tool integration create real switching friction.",
        renewalDynamics:
          "Fast-moving capability and pricing; favor consumption transparency, model-portability, data-handling/no-training terms, and exit rights over multi-year lock-in.",
      },
      {
        vendorName: "Vector DB / retrieval platforms",
        category: "Embedding storage and retrieval for RAG (managed and open-source)",
        switchingCost:
          "Moderate — embeddings can be re-generated and many stores speak similar APIs, but corpus scale, hybrid-retrieval tuning, and operational integration raise the cost of moving.",
        renewalDynamics:
          "Managed-service or open-source-plus-support models; negotiate on scale tiers, data export, and avoiding proprietary index lock-in.",
      },
      {
        vendorName: "LLM eval / observability / LLMOps platforms",
        category: "Offline+online evals, tracing, prompt/version management, and production monitoring",
        switchingCost:
          "Low-to-moderate — generally workflow-embedded but replaceable; watch eval-set and trace data export and metric-definition portability.",
        renewalDynamics:
          "Crowded, fast-consolidating market; usage- and seat-based terms; negotiate against demonstrated eval coverage and drift-catch value.",
      },
      {
        vendorName: "Guardrail / AI-safety and agent-orchestration vendors",
        category: "Input/output guardrails, content safety, and agent/orchestration frameworks",
        switchingCost:
          "Low-to-moderate — policy and guardrail logic is portable in principle, but deep workflow and tool-integration embedding raises real switching cost over time.",
        renewalDynamics:
          "Emerging, rapidly evolving category; prefer open standards and avoid hard-coupling agent logic to a single vendor's orchestration runtime.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is rarely the model itself (increasingly portable) — it is the accumulated prompt/agent workflows, the evals and golden sets tuned to a specific model's behavior, the vector index/corpus integration, and the orchestration/guardrail logic woven into the application. The negotiating frontier is consumption transparency, no-training/data-handling guarantees, model-portability via abstraction, and avoiding proprietary lock-in in the retrieval, eval, and orchestration layers.",
    negotiationLevers: [
      "Consumption transparency and model-portability (route across providers via abstraction) to avoid model-layer lock-in",
      "Data-handling and no-training-on-our-data guarantees, with residency, retention, and exit/export rights",
      "Right-size capacity to measured production volume, not pilot peaks — and gate scale on eval-based graduation",
      "Outcome/usage-based terms tied to measured quality, cost-per-resolved-task, and latency where available",
      "Export rights for eval sets, traces, and vector indexes to keep the eval, observability, and retrieval layers portable",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      quality_claim: [
        "eval pass rate on a representative golden set",
        "hallucination/faithfulness rate on the same set",
        "online evaluation on production data (not demo examples)",
      ],
      retrieval_claim: [
        "retrieval precision/recall on a labelled query→chunk set",
        "measured separately from answer quality",
        "faithfulness failures traced to retrieval vs generation",
      ],
      cost_latency_claim: [
        "token-usage × price at production volume",
        "p95/p99 latency from tracing (not mean)",
        "cost per resolved task including retries/escalation",
      ],
      autonomy_claim: [
        "agent task success rate with side-effect checks",
        "production task-outcome and human-intervention logs",
        "control posture matched to the measured success rate",
      ],
      value_projection: [
        "baseline metric (quality / cost / latency / time-to-production)",
        "benchmark planning-range",
        "explicit haircut factors (last-mile attrition, reliability ceiling, cost/latency at scale, attribution)",
      ],
    },
    citationStandard:
      "Quality, cost, latency, and autonomy claims cite the eval set or telemetry " +
      "source, the period, the use-case scope, and the measurement basis (golden " +
      "set + online data; production volume; p95/p99 not mean; side-effect-checked " +
      "task success). Quality claims MUST reference a representative eval — never a " +
      "demo or cherry-picked examples. Retrieval claims cite retrieval metrics " +
      "measured separately from answer quality. Value projections cite a baseline " +
      "plus a labelled planning range and the haircut factors applied (demo→" +
      "production attrition, reliability ceiling, cost/latency at scale, " +
      "attribution) — never a single asserted ROI, and never a token-cost saving " +
      "extrapolated from pilot volume without production data.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no eval harness or golden set — frame quality as an industry planning range and flag that real quality is unproven without evals.",
      "Only a demo or pilot exists — present capability as demonstrated-but-not-productionized; the demo→production last mile is unestimated.",
      "Hallucination/error rate is unmeasured — hedge any autonomy or trust claim until faithfulness is measured per use case.",
      "Cost/latency cited from pilot volume — flag that production-scale economics and p95 may differ materially; cost per resolved task is the honest unit.",
      "Retrieval quality is unmeasured — do not attribute faithfulness failures to the model; flag that retrieval precision/recall is unknown.",
    ],
    inferenceLanguage: [
      "Across enterprise GenAI deliveries, the demo→production last mile typically takes...",
      "Without your measured eval pass rate, the industry pattern for grounded RAG quality runs...",
      "Peer AI engineering orgs at this maturity commonly see hallucination/error rates of... after grounding and guardrails",
      "This is a planning-range economic figure; your production-scale inference cost and p95 latency haven't yet been measured.",
    ],
    flagWithoutEvidence: [
      "A specific eval pass rate, hallucination rate, or quality score for this tenant's system",
      "This tenant's actual inference cost per request/resolved task or p95/p99 latency at production scale",
      "A claim that this tenant's agents are reliable enough for unsupervised autonomy",
      "A specific time-to-production or ROI number for this tenant's AI initiative",
      "A claim that retrieval quality is sufficient for this tenant's corpus without a measured retrieval eval",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "AI quality scorecard (eval, hallucination, retrieval, cost, latency, autonomy)",
      exhibitKind: "table",
      note: "Eval pass rate, hallucination rate, retrieval precision/recall, inference cost per request + per resolved task, p95 latency, guardrail coverage, agent task success, eval coverage, drift incidents vs planning ranges.",
    },
    {
      questionPattern: "demo→production value bridge (with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from demo-implied value to realized production value, showing each haircut (last-mile attrition, reliability/autonomy give-back, cost/latency at scale, attribution).",
    },
    {
      questionPattern: "which constraint bites hardest on realized value",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of demo→production attrition, reliability ceiling, cost/latency at scale, and attribution on realized value.",
    },
    {
      questionPattern: "inference cost stack per request / resolved task",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Cost stack across prompt/completion tokens, retrieval/embedding, re-ranking, and agent/tool turns — showing where inference spend concentrates and what routing/caching can take out.",
    },
    {
      questionPattern: "quality / cost / latency trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend eval pass rate, hallucination rate, p95 latency, and cost per resolved task together to show quality holding while cost/latency improve (or drift appearing).",
    },
    {
      questionPattern: "delivery lifecycle / prototype to production stages",
      exhibitKind: "chart",
      chartKind: "swimlane",
      chartBuilder: "swimlane",
      note: "Swimlane of the last-mile stages (prototype → evals → guardrails → cost/latency hardening → production → monitoring) with the gate at each stage.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Evals come first — a representative golden set and online evaluation establish the quality bar before scaling, not after",
      "Autonomy is earned by measured reliability — hallucination and agent task-success rates set the control posture, not optimism",
      "Inference cost and latency are engineered from the start via model routing, caching, and prompt economy at held quality",
      "Production surfaces carry risk-weighted guardrails and an LLMOps pipeline regression-gates every model/prompt/corpus change",
      "The demo→production last mile is treated as the real work and resourced as a repeatable pipeline, not an afterthought",
    ],
    failureDrivers: [
      "Mistaking an impressive demo for a production-ready system and under-resourcing the last mile, leaving a graveyard of unshipped pilots",
      "Vibes-based shipping with no evals — unable to tell improvement from regression, anecdote from signal",
      "Granting autonomy the measured (or unmeasured) error rate doesn't justify, so hallucinations reach users or agents cause harmful side effects",
      "Inference cost and tail latency that looked trivial in the pilot breaking the unit economics or UX at production scale",
      "Operating non-stationary LLM systems as if deterministic — no regression evals or monitoring, so drift is found via user complaints",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "RAG-grounded assistants and an eval harness adopt first — they are " +
      "well-understood and deliver measurable grounding gains on a bounded corpus. " +
      "Guardrail layers and cost/latency optimization follow as systems reach " +
      "production scale and risk/economics force the issue. LLMOps pipelines mature " +
      "next, as teams feel the pain of unmanaged drift. Agentic workflows adopt " +
      "last and most cautiously, gated by the compounding-reliability bar and tool/" +
      "permission governance. Adoption accelerates where a team builds eval " +
      "discipline early; it stalls where impressive demos outrun the eval, " +
      "guardrail, and cost/latency engineering needed to actually ship.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is medium because the engineering signals — eval pass rate, " +
      "hallucination rate, retrieval precision/recall, inference cost, p95 latency, " +
      "agent task success — are directly instrumentable, so 'does it work and what " +
      "does it cost to run' can be measured honestly. But it is only MEDIUM, not " +
      "high: the business OUTCOME the system drives is confounded by concurrent " +
      "process/product changes, most orgs lack clean baselines, and the honest case " +
      "must net out the demo→production attrition, the reliability/autonomy " +
      "give-back, and production-scale cost/latency. The discipline that earns " +
      "clarity is eval-first delivery with cost and latency measured at production " +
      "volume — and refusing to book a demo, an unrepresentative eval, or a " +
      "pilot-extrapolated token saving as realized value.",
  },

  regulatoryFrame: {
    name: "AI-system assurance: evaluation, safety, data-handling, and secure-AI engineering",
    relevance:
      "The dominant cross-cutting frame for building and operating AI systems: " +
      "AI risk-management and assurance frameworks (NIST AI RMF, ISO/IEC 42001) " +
      "shape how systems must be evaluated, monitored, and documented; data " +
      "privacy and trade-secret rules constrain what data and proprietary content " +
      "may be sent to external models or stored in vector stores; AI-safety " +
      "obligations (EU AI Act high-risk duties) impose evaluation, transparency, " +
      "human-oversight, and robustness requirements; and secure-development " +
      "standards (OWASP LLM Top 10, NIST SSDF) define the injection/jailbreak/" +
      "data-leakage threats guardrails and red-teaming must address. This expert " +
      "owns the ENGINEERING EVIDENCE — evals, guardrails, monitoring — that the " +
      "separate AI Governance function consumes to govern (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (it-estate)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
