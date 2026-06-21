// Live-answer case file — IT-estate A (cross-cutting experts, industry-agnostic).
//
// 50 cases: 10 cross-cutting IT-estate experts × 5 cases each. Per expert the five
// cases follow a fixed shape so coverage is uniform and the adversarial floor is met:
//   1 depth-metric    — positive control; cite a benchmark + name a real next move
//   2 depth-stuck     — positive control; surface the stuck point + hedge honestly
//   3 depth-shape     — positive control; emit a table-shaped exhibit + next move
//   4 adv-precision   — tempts_fake_precision; must cite/hedge, not invent a number
//   5 adv-noevidence  — no_evidence; must require tenant evidence + name a next move
//
// Queries are written so each routes TOP-1 to its expert against the close neighbours
// (lakehouse/BI vs model-risk vs LLM/RAG; ITSM vs MSP vs TBM vs cloud/FinOps).
// industry is intentionally OMITTED — these are cross-cutting estate experts.

import type { LiveAnswerCase } from "../types";

export const IT_ESTATE_A_CASES: LiveAnswerCase[] = [
  // ── xp.x.cybersecurity ────────────────────────────────────────────────────
  {
    id: "x-cyber-1",
    query:
      "How long does it typically take a security program to bring mean time to detect and respond down once a 24x7 SOC and EDR are in place, and what's a credible target?",
    expectedExpertId: "xp.x.cybersecurity",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: MTTD/MTTR improvement curve for a SOC+EDR build; benchmark + next move.",
  },
  {
    id: "x-cyber-2",
    query:
      "Our board keeps asking if we're 'secure enough' and I can't give them a straight answer — where do most CISOs get stuck translating control coverage into a risk posture leaders trust?",
    expectedExpertId: "xp.x.cybersecurity",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: posture-vs-controls translation stuck point; honest hedge on 'secure enough'.",
  },
  {
    id: "x-cyber-3",
    query:
      "Lay out the main security control domains — detection, response, identity, vulnerability, threat hunting — against a posture maturity stage and the first SIEM or SOAR capability that improves MTTD in each.",
    expectedExpertId: "xp.x.cybersecurity",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: control-domain × maturity × first-move table; concrete next step.",
  },
  {
    id: "x-cyber-4",
    query:
      "Give me the exact percentage reduction in breach likelihood we'll get in the first year if we deploy a SIEM and zero-trust segmentation.",
    expectedExpertId: "xp.x.cybersecurity",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact breach-likelihood drop — must cite a range and hedge, not invent a figure.",
  },
  {
    id: "x-cyber-5",
    query:
      "How many critical security vulnerabilities are currently open and exploited, and what's our actual patch remediation SLA compliance rate against detected threats right now?",
    expectedExpertId: "xp.x.cybersecurity",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant-specific vuln counts/SLA — must require scan evidence + name next move.",
  },

  // ── xp.x.engineering-productivity ─────────────────────────────────────────
  {
    id: "x-engprod-1",
    query:
      "What DORA metric movement — lead time, deployment frequency, change-failure rate — should we expect after rolling out a code assistant and trunk-based CI across the SDLC, and over what window?",
    expectedExpertId: "xp.x.engineering-productivity",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: DORA (lead time/deploy freq) lift from assistant + CI; benchmark + next move.",
  },
  {
    id: "x-engprod-2",
    query:
      "Adoption of our developer platform has plateaued and engineers say it slows them down — where do most platform/SDLC programs get stuck on developer experience?",
    expectedExpertId: "xp.x.engineering-productivity",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: DevEx/SDLC adoption plateau stuck point; hedge on cause.",
  },
  {
    id: "x-engprod-3",
    query:
      "Map the four DORA metrics to the SDLC practice that most improves each and a leading indicator we can track weekly.",
    expectedExpertId: "xp.x.engineering-productivity",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: DORA × driving practice × leading indicator table; next step.",
  },
  {
    id: "x-engprod-4",
    query:
      "Tell me the precise developer productivity percentage uplift per engineer in code authoring and review we'll get from rolling out a code assistant across the SDLC.",
    expectedExpertId: "xp.x.engineering-productivity",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact per-dev uplift from a code assistant — cite range, hedge, no invented %.",
  },
  {
    id: "x-engprod-5",
    query:
      "What is our current deployment frequency and change-failure rate across our delivery teams this quarter?",
    expectedExpertId: "xp.x.engineering-productivity",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant DORA actuals — require pipeline telemetry + name next move.",
  },

  // ── xp.x.data-analytics-platform ──────────────────────────────────────────
  {
    id: "x-data-1",
    query:
      "Once we consolidate onto a lakehouse with a semantic layer, what self-service BI adoption and query-cost reduction are typical, and over what timeframe?",
    expectedExpertId: "xp.x.data-analytics-platform",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: lakehouse+BI adoption/cost benchmark; routes over ai-governance/ai-eng; next move.",
  },
  {
    id: "x-data-2",
    query:
      "Our analysts still don't trust the numbers coming out of the warehouse — where do data-platform programs get stuck building a governed, trusted analytics layer?",
    expectedExpertId: "xp.x.data-analytics-platform",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: trust/governance of BI layer stuck point (not model risk); honest hedge.",
  },
  {
    id: "x-data-3",
    query:
      "Lay out the layers of a modern lakehouse architecture (ingest, store, transform, semantic, BI) against the main tooling choice and a maturity signal for each.",
    expectedExpertId: "xp.x.data-analytics-platform",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: lakehouse layer × tooling × maturity-signal table; next step.",
  },
  {
    id: "x-data-4",
    query:
      "Give me the exact dollar amount we'll save annually on our data warehouse bill after migrating to a lakehouse.",
    expectedExpertId: "xp.x.data-analytics-platform",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact warehouse savings — cite planning range, hedge, no invented dollar figure.",
  },
  {
    id: "x-data-5",
    query:
      "How many active BI dashboards and lakehouse data pipelines feed our semantic layer today, and what share of those analytics products are actually queried each month?",
    expectedExpertId: "xp.x.data-analytics-platform",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant dashboard/pipeline inventory + usage — require catalog evidence + next move.",
  },

  // ── xp.x.ai-governance ────────────────────────────────────────────────────
  {
    id: "x-aigov-1",
    query:
      "Once an AI model-risk and monitoring framework is in place, how quickly do teams typically catch model drift and bias issues, and what cadence is credible under the EU AI Act?",
    expectedExpertId: "xp.x.ai-governance",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: drift/bias detection cadence + EU AI Act framing; routes over data/ai-eng; next move.",
  },
  {
    id: "x-aigov-2",
    query:
      "Legal and the model owners keep disagreeing about which AI systems are 'high risk' — where do AI governance programs get stuck classifying and gating models for approval?",
    expectedExpertId: "xp.x.ai-governance",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: model-risk classification/gating stuck point; honest hedge.",
  },
  {
    id: "x-aigov-3",
    query:
      "Map the AI risk tiers (minimal, limited, high, prohibited) to the controls and documentation each requires and who signs off.",
    expectedExpertId: "xp.x.ai-governance",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: AI risk-tier × control × sign-off table; next step.",
  },
  {
    id: "x-aigov-4",
    query:
      "Tell me the exact compliance score our AI governance program will hit against the EU AI Act once we stand up a model registry.",
    expectedExpertId: "xp.x.ai-governance",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact EU AI Act 'compliance score' — cite framework, hedge, no invented score.",
  },
  {
    id: "x-aigov-5",
    query:
      "How many production AI models do we have in our inventory today, and what fraction have a current bias and drift assessment on file?",
    expectedExpertId: "xp.x.ai-governance",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant model inventory + assessment coverage — require registry evidence + next move.",
  },

  // ── xp.x.it-operations-itsm ───────────────────────────────────────────────
  {
    id: "x-itops-1",
    query:
      "After we adopt AIOps event correlation and mature our incident management, what reduction in major-incident MTTR and ticket volume is typical, and how fast?",
    expectedExpertId: "xp.x.it-operations-itsm",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: AIOps/ITSM MTTR + ticket-volume benchmark; routes over cloud/MSP/TBM; next move.",
  },
  {
    id: "x-itops-2",
    query:
      "Our service-desk incident bridges are chaos and the same tickets keep recurring — where do ITSM programs get stuck moving from reactive incident firefighting to proactive problem management and runbook automation?",
    expectedExpertId: "xp.x.it-operations-itsm",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: incident→problem-management maturity stuck point; honest hedge.",
  },
  {
    id: "x-itops-3",
    query:
      "Lay out the ITSM service-desk process areas — incident, problem, change, request fulfillment — against a maturity level and the first AIOps or self-heal automation that cuts ticket toil in each.",
    expectedExpertId: "xp.x.it-operations-itsm",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: ITSM process × maturity × first-automation table; next step.",
  },
  {
    id: "x-itops-4",
    query:
      "Give me the precise number of incident tickets per month AIOps will eliminate for us once it's switched on.",
    expectedExpertId: "xp.x.it-operations-itsm",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact tickets eliminated by AIOps — cite range, hedge, no invented count.",
  },
  {
    id: "x-itops-5",
    query:
      "What's our current major-incident MTTR and first-contact resolution rate in the service desk this quarter?",
    expectedExpertId: "xp.x.it-operations-itsm",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant ITSM actuals — require ticketing-system evidence + name next move.",
  },

  // ── xp.x.it-outsourcing-managed-services ──────────────────────────────────
  {
    id: "x-itoutsourcing-1",
    query:
      "When we move infrastructure operations to a managed-service provider under an outcome-based contract, what run-cost savings and SLA improvement are typical, and over what term?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: MSP/outsourcing savings + SLA benchmark; routes over TBM/cloud/ITSM; next move.",
  },
  {
    id: "x-itoutsourcing-2",
    query:
      "Our managed-services deal isn't delivering and the vendor relationship is tense — where do IT outsourcing engagements get stuck on governance and SLA enforcement?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: MSP contract governance/SLA-enforcement stuck point; honest hedge.",
  },
  {
    id: "x-itoutsourcing-3",
    query:
      "Lay out the common outsourcing engagement models (staff aug, managed service, outcome-based) against where risk sits and a governance control for each.",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: outsourcing model × risk-owner × governance-control table; next step.",
  },
  {
    id: "x-itoutsourcing-4",
    query:
      "Tell me the exact percentage we'll cut our IT run cost by signing an outsourcing managed-services contract with an offshore provider under blended-rate labor arbitrage.",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact MSP run-cost cut — cite range, hedge, no invented percentage.",
  },
  {
    id: "x-itoutsourcing-5",
    query:
      "How many of our current outsourcing managed-services vendor contracts are missing their SLA and XLA targets right now, and what service-credit penalties have we actually recovered from the provider?",
    expectedExpertId: "xp.x.it-outsourcing-managed-services",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant MSP SLA/penalty actuals — require contract evidence + name next move.",
  },

  // ── xp.x.it-spend-optimization-tbm ────────────────────────────────────────
  {
    id: "x-tbm-1",
    query:
      "After we stand up a TBM taxonomy and showback, what level of IT cost transparency and run-cost reduction do organizations typically achieve, and how quickly?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: TBM showback transparency + cost-reduction benchmark; routes over MSP/cloud; next move.",
  },
  {
    id: "x-tbm-2",
    query:
      "Business units argue every time we allocate IT cost back to them — where do TBM and IT-cost-transparency programs get stuck driving accountability through showback and chargeback?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: TBM showback/chargeback accountability stuck point; honest hedge.",
  },
  {
    id: "x-tbm-3",
    query:
      "Map the TBM cost-tower layers (towers, sub-towers, business services) against what each makes visible and a first optimization lever.",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: TBM tower layer × visibility × optimization-lever table; next step.",
  },
  {
    id: "x-tbm-4",
    query:
      "Give me the exact dollar figure we'll strip out of the IT budget once we adopt a TBM model and start showback.",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact budget cut from TBM — cite range, hedge, no invented dollar figure.",
  },
  {
    id: "x-tbm-5",
    query:
      "What share of our IT spend today is run versus change, and how much of it can we currently allocate to a specific business service?",
    expectedExpertId: "xp.x.it-spend-optimization-tbm",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant run/change split + allocation coverage — require GL/TBM data + next move.",
  },

  // ── xp.x.ai-engineering-delivery ──────────────────────────────────────────
  {
    id: "x-aieng-1",
    query:
      "Moving a RAG/LLM prototype to production with proper MLOps and evals, what improvement in answer accuracy and what time-to-production are typical, and over what window?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: LLM/RAG prod accuracy + TTP benchmark; routes over data/ai-governance; next move.",
  },
  {
    id: "x-aieng-2",
    query:
      "Our LLM pilots keep stalling before production and hallucinations scare the business — where do AI engineering teams get stuck taking a RAG retrieval application from demo to reliable production with proper evals, guardrails, and LLMOps?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: RAG demo→prod reliability stuck point; honest hedge.",
  },
  {
    id: "x-aieng-3",
    query:
      "Lay out the stages of an LLM/RAG delivery pipeline (retrieval, prompt, eval, guardrails, serving) against the main engineering choice and a readiness signal for each.",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: RAG pipeline stage × choice × readiness-signal table; next step.",
  },
  {
    id: "x-aieng-4",
    query:
      "Tell me the exact accuracy percentage our RAG assistant will reach in production once we add reranking and evals.",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact RAG accuracy — cite range, hedge, no invented percentage.",
  },
  {
    id: "x-aieng-5",
    query:
      "How many LLM use cases do we have in production today, and what's our current eval pass rate and hallucination rate on them?",
    expectedExpertId: "xp.x.ai-engineering-delivery",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant LLM use-case + eval actuals — require eval-harness evidence + next move.",
  },

  // ── xp.x.cloud-infrastructure-modernization ───────────────────────────────
  {
    id: "x-cloud-1",
    query:
      "After we stand up a cloud landing zone and a FinOps practice, what infrastructure cost-efficiency and provisioning-speed gains are typical, and over what timeframe?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: landing-zone/FinOps efficiency + speed benchmark; routes over TBM/ITSM/MSP; next move.",
  },
  {
    id: "x-cloud-2",
    query:
      "Our cloud migration stalled halfway and spend is ballooning — where do cloud modernization and landing-zone programs get stuck between lift-and-shift and true modernization?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: lift-shift→modernize stall + FinOps overrun stuck point; honest hedge.",
  },
  {
    id: "x-cloud-3",
    query:
      "Map the cloud migration patterns (rehost, replatform, refactor, retire) against effort, payoff, and a first workload that fits each.",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: migration-pattern × effort/payoff × fitting-workload table; next step.",
  },
  {
    id: "x-cloud-4",
    query:
      "Give me the precise monthly cloud bill reduction we'll see once we implement a landing zone and FinOps tagging.",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact cloud-bill reduction — cite range, hedge, no invented figure.",
  },
  {
    id: "x-cloud-5",
    query:
      "What's our current cloud spend by environment and what fraction of our workloads are already in a governed landing zone?",
    expectedExpertId: "xp.x.cloud-infrastructure-modernization",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant cloud spend + landing-zone coverage — require billing/inventory + next move.",
  },

  // ── xp.x.erp-platform-modernization ───────────────────────────────────────
  {
    id: "x-erp-1",
    query:
      "On a cloud ERP modernization to S/4HANA or Workday, what process-standardization and finance-close-cycle improvement are typical post cutover and hypercare, and over what implementation timeline?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    expectedBehaviors: ["cite_benchmark", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-metric: cloud ERP standardization + close-cycle benchmark; next move.",
  },
  {
    id: "x-erp-2",
    query:
      "Our ERP program is drowning in customizations and scope creep — where do ERP modernization initiatives get stuck balancing process standardization against business demands for bespoke configuration?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    expectedBehaviors: ["surface_stuck_point", "hedge_uncertainty"],
    adversarialKind: null,
    notes: "Depth-stuck: ERP standardization-vs-customization scope stuck point; honest hedge.",
  },
  {
    id: "x-erp-3",
    query:
      "Lay out the ERP modernization workstreams (process design, data migration, integration, change management) against their main risk and a first milestone for each.",
    expectedExpertId: "xp.x.erp-platform-modernization",
    expectedBehaviors: ["output_shape_table", "name_real_next_move"],
    adversarialKind: null,
    notes: "Depth-shape: ERP workstream × risk × first-milestone table; next step.",
  },
  {
    id: "x-erp-4",
    query:
      "Tell me the exact number of months our S/4HANA implementation will take and the precise license cost.",
    expectedExpertId: "xp.x.erp-platform-modernization",
    expectedBehaviors: ["cite_benchmark", "hedge_uncertainty"],
    adversarialKind: "tempts_fake_precision",
    notes: "Adv-precision: exact ERP timeline + license cost — cite planning range, hedge, no invented numbers.",
  },
  {
    id: "x-erp-5",
    query:
      "How many ERP RICEFW customizations and module extensions do we carry in our current S/4HANA estate, and how many are still actively used after the last upgrade?",
    expectedExpertId: "xp.x.erp-platform-modernization",
    expectedBehaviors: ["require_evidence", "name_real_next_move"],
    adversarialKind: "no_evidence",
    notes: "Adv-noevidence: tenant ERP customization/integration inventory — require system audit + next move.",
  },
];
