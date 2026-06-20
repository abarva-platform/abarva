// Consilium expert — Legal / Contract AI & Legal Operations (cross-cutting).
//
// W3 wave2 draft. A cross-cutting expert spanning the modernization of the
// legal function with AI: contract lifecycle management (CLM), GenAI contract
// drafting/review/redlining, legal intake & triage, matter management,
// outside-counsel spend, e-discovery, and compliance. The legal function is a
// middle/back-office cost-and-risk center, NOT a revenue center, so value is
// realized as risk reduction + capacity reclaimed, not as a clean P&L line.
//
// CORE DOCTRINE — RISK + CAPACITY, NOT EFFORT-COMPRESSION. Two honest truths
// govern this domain:
//   (1) Lawyer adoption is the binding constraint, not the technology. Lawyers
//       are trained to distrust unverified output, are personally accountable
//       for errors, and route around tools that add friction or that they do
//       not trust. Most legal-AI programs fail on adoption, not capability.
//   (2) Privilege and accuracy fence what is safe to automate. Attorney-client
//       privilege, work-product protection, and the professional duty of
//       competence mean a human lawyer must own every legally-operative output.
//       GenAI hallucination (fabricated citations, invented clauses) is a
//       discipline-and-malpractice risk, so the default posture is
//       human-in-the-loop / human-approval-required, with autonomy reserved for
//       low-risk, high-volume, low-judgment work (e.g. NDA triage, clause
//       extraction for review, intake routing).
// Value attribution is fuzzy: a missed obligation that did not blow up, a
// dispute that did not happen, and a redline that took two hours instead of
// eight are real but hard to book. This expert sizes the prize honestly and
// keeps the human accountable.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const legalContractAiExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.legal-contract-ai",
    expertName: "Legal / Contract AI & Legal Operations Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "legal-contract-ai",
    scopeNote:
      "Cross-cutting modernization of the corporate legal function with AI: " +
      "contract lifecycle management (CLM), GenAI contract drafting / review / " +
      "redlining, legal intake & triage, matter management, outside-counsel " +
      "spend management, e-discovery, and operational compliance. The legal " +
      "function is a middle/back-office risk-and-cost center, so value is " +
      "realized as RISK REDUCTION and CAPACITY RECLAIMED rather than booked " +
      "revenue, and the binding constraint is LAWYER ADOPTION, not technology. " +
      "Default control posture is human-in-the-loop / human-approval-required " +
      "because attorney-client privilege, work-product protection, the duty of " +
      "competence, and GenAI hallucination risk mean a licensed lawyer must own " +
      "every legally-operative output. Excludes the substance of legal strategy, " +
      "regulatory legal advice, and litigation merits (which stay with " +
      "attorneys) — this expert owns the operating model, workflow, tooling, and " +
      "economics of running the legal function.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "contract_cycle_time",
        name: "Contract cycle time (request-to-signature)",
        definition:
          "Median elapsed business days from a contract request being intake'd " +
          "to a fully-executed signed agreement, across the contract portfolio.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "World Commerce & Contracting (IACCM) and CLM-vendor benchmarks; " +
            "high-volume templated agreements run 5-10 days, complex negotiated " +
            "deals 20-30+; manual email-and-Word shops run far longer",
          label: "planning-range",
        },
        dataSource:
          "CLM workflow timestamps (request -> draft -> negotiate -> approve -> " +
          "execute); for off-CLM contracts, intake ticket + DMS signature date",
        whyItMatters:
          "The headline legal-operations throughput metric and the number the " +
          "business feels directly — slow contracts delay revenue recognition " +
          "and stall deals. It is the lever most commonly cited to justify CLM " +
          "and AI drafting/review investment.",
      },
      {
        key: "contract_review_turnaround",
        name: "Contract review turnaround time",
        definition:
          "Median elapsed time from a contract (typically a third-party paper) " +
          "landing on a reviewer's desk to first-pass redline returned.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 48,
          basis:
            "Legal-ops and AI-review-vendor ranges; AI-assisted first-pass " +
            "review of standard agreements can return in hours, fully-manual " +
            "review of complex third-party paper takes 1-2 business days+",
          label: "planning-range",
        },
        dataSource:
          "CLM / AI contract-review tool review-request and redline timestamps; " +
          "matter management for non-CLM reviews",
        whyItMatters:
          "The direct target of AI contract review/redline — first-pass review " +
          "is the highest-volume, most-repetitive lawyer task and the clearest " +
          "place to reclaim attorney capacity without ceding the final call.",
      },
      {
        key: "self_serve_contract_pct",
        name: "% self-serve / business-executed contracts",
        definition:
          "Share of in-scope agreements (e.g. standard NDAs, low-value MSAs, " +
          "order forms) that the business completes through templated " +
          "self-service without a lawyer touching them.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 60,
          basis:
            "CLM self-service / playbook-automation benchmarks; mature programs " +
            "self-serve 40-60% of low-risk volume, early programs under 15%",
          label: "planning-range",
        },
        dataSource:
          "CLM self-service / guided-workflow logs (templated generations " +
          "completed without legal-team assignment)",
        whyItMatters:
          "The capacity multiplier — every self-served low-risk contract is " +
          "lawyer time never spent. It is how a flat legal team absorbs rising " +
          "contract volume, but it only works where the playbook is trusted and " +
          "escalation rules are clean.",
      },
      {
        key: "outside_counsel_spend_pct",
        name: "Outside-counsel spend as % of total legal budget",
        definition:
          "External law-firm and ALSP fees as a percentage of the total legal " +
          "department budget (internal + external).",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Legal-department benchmarking surveys (e.g. ACC, Thomson Reuters " +
            "Legal Department Operations); typical split is 40-55% external, " +
            "varying sharply by industry and litigation load",
          label: "planning-range",
        },
        dataSource:
          "E-billing / matter-management spend data reconciled to the legal GL " +
          "budget",
        whyItMatters:
          "Outside counsel is usually the single largest controllable line in " +
          "the legal budget. Insourcing routine work, AI-assisted e-discovery, " +
          "and matter-level spend analytics are the levers that bend it — but " +
          "the GC weighs cost against risk, not cost alone.",
      },
      {
        key: "matter_backlog",
        name: "Open matter / request backlog per lawyer",
        definition:
          "Average number of open, unresolved legal matters or work requests " +
          "assigned per in-house lawyer at a point in time.",
        unit: "matters / lawyer",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Legal-ops workload benchmarks; varies widely by matter complexity " +
            "and team model — transactional teams carry higher counts, " +
            "litigation lower",
          label: "planning-range",
        },
        dataSource:
          "Matter-management / legal-intake system open-matter counts over " +
          "active lawyer headcount",
        whyItMatters:
          "The capacity-strain signal. A rising backlog with flat headcount is " +
          "the demand-supply gap that intake triage and self-service are meant " +
          "to close; it is also the honest denominator for 'capacity reclaimed' " +
          "value claims.",
      },
      {
        key: "nda_turnaround",
        name: "NDA turnaround time",
        definition:
          "Median elapsed time from an NDA request to a signed NDA — the " +
          "canonical high-volume, low-risk agreement and the usual first " +
          "automation target.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1,
          high: 72,
          basis:
            "CLM NDA-automation benchmarks; auto-generated/auto-approved NDAs " +
            "close in under an hour, manual queues take 1-3 business days",
          label: "planning-range",
        },
        dataSource:
          "CLM NDA workflow timestamps (request -> generate -> sign)",
        whyItMatters:
          "The proving-ground metric for legal AI — NDAs are high-volume, " +
          "low-judgment, and standardizable, so a fast NDA turnaround is the " +
          "first credible adoption win that earns the team's trust for harder " +
          "use cases.",
      },
      {
        key: "contract_value_leakage",
        name: "Contract value leakage rate",
        definition:
          "Estimated share of contract value lost to unenforced obligations, " +
          "missed renewals/price escalations, unclaimed rebates/SLAs, and " +
          "auto-renewals that should have been renegotiated.",
        unit: "% of contract value",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 9,
          basis:
            "World Commerce & Contracting estimate that organizations lose " +
            "roughly 9% of annual revenue to poor contract management; planning " +
            "range narrowed to mature-vs-immature contract estates",
          label: "planning-range",
        },
        dataSource:
          "Obligation-management module + spend/AP reconciliation against " +
          "contracted terms (rebates, SLAs, price holds, renewal dates)",
        whyItMatters:
          "The largest and least-measured legal value pool — money already " +
          "negotiated but never captured because obligations live in PDFs no " +
          "one tracks. Clause extraction + obligation management is how it is " +
          "recovered, but the baseline is an estimate, so claims must be hedged.",
      },
      {
        key: "contracts_in_clm_pct",
        name: "% of contracts in the CLM / under management",
        definition:
          "Share of the active contract estate that lives in the CLM system of " +
          "record with extracted metadata, versus contracts stored ad hoc in " +
          "email, shared drives, or individual lawyers' files.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "CLM-adoption benchmarks; mature deployments reach 70-80%+ of the " +
            "estate, while many enterprises have a large 'rogue' off-CLM tail",
          label: "planning-range",
        },
        dataSource:
          "CLM repository count vs estimated total active-contract population " +
          "(DMS scan, AP supplier count, sampling)",
        whyItMatters:
          "The foundation metric — no obligation management, leakage recovery, " +
          "risk reporting, or portfolio analytics is reliable until the estate " +
          "is in the repository. A low number means most downstream AI value is " +
          "blocked by missing data, not by capability.",
      },
      {
        key: "clause_deviation_rate",
        name: "Clause / playbook deviation rate",
        definition:
          "Share of executed contracts that contain terms deviating from the " +
          "approved standard playbook (e.g. uncapped liability, non-standard " +
          "indemnity, off-policy data terms) without recorded approval.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Contract-review / playbook-compliance benchmarks; well-governed " +
            "estates hold deviations under 10%, loosely-governed estates run " +
            "much higher with unapproved fallbacks",
          label: "planning-range",
        },
        dataSource:
          "AI clause-extraction / contract-analytics over the executed estate, " +
          "compared to the approved clause playbook",
        whyItMatters:
          "The risk-exposure metric — every undocumented deviation is latent " +
          "legal risk (liability, regulatory, data) that surfaces in a dispute " +
          "or audit. AI clause extraction makes this measurable across the " +
          "whole estate rather than spot-checked.",
      },
      {
        key: "legal_intake_response_time",
        name: "Legal intake first-response time",
        definition:
          "Median elapsed time from a business request hitting the legal intake " +
          "channel to a first substantive response or triaged routing.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 48,
          basis:
            "Legal-ops intake-SLA benchmarks; mature intake portals first-" +
            "respond within hours, email-driven intake takes 1-2 business days",
          label: "planning-range",
        },
        dataSource:
          "Legal intake / service-desk system ticket timestamps (created -> " +
          "first response / routed)",
        whyItMatters:
          "The business-experience metric for legal as a service function. Slow, " +
          "opaque intake is why the business routes around legal; AI triage and " +
          "routing are the levers that make legal feel responsive without adding " +
          "headcount.",
      },
      {
        key: "lawyer_tool_adoption_rate",
        name: "Lawyer tool adoption / active-use rate",
        definition:
          "Share of licensed legal-AI/CLM seats whose holders actively use the " +
          "tool in their core workflow (e.g. weekly active use), versus seats " +
          "that are provisioned but dormant.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 75,
          basis:
            "Legal-tech adoption benchmarks; many deployments stall at 20-40% " +
            "active use, well-run change programs reach 60-75%+",
          label: "planning-range",
        },
        dataSource:
          "Tool telemetry (active users / licensed seats) from the CLM and " +
          "legal-AI platforms",
        whyItMatters:
          "The single best leading indicator of whether a legal-AI program will " +
          "deliver value at all — because adoption is the binding constraint. " +
          "Provisioned-but-dormant seats are the most common failure signature, " +
          "so this metric is the early-warning gauge the GC and legal-ops " +
          "director watch.",
      },
    ],

    painThemes: [
      {
        key: "contract_bottleneck",
        name: "Legal as the contract bottleneck",
        description:
          "Every contract — including high-volume, low-risk ones — queues for " +
          "a lawyer, so legal becomes the rate-limiter on deals. Cycle times " +
          "stretch, the business escalates, and lawyers spend scarce judgment " +
          "on standard paper that a playbook could handle.",
        detectionSignal:
          "Long contract cycle time and review turnaround, a large request " +
          "backlog, low self-serve rate, and business complaints that 'legal is " +
          "slow' or deals slipping to next quarter.",
        diagnosticQuestion:
          "What share of your contract volume is standard, low-risk paper that " +
          "still requires a lawyer's touch — and what is your cycle time on it?",
      },
      {
        key: "off_clm_rogue_contracts",
        name: "Off-CLM 'rogue' contracts & dark estate",
        description:
          "A large share of executed contracts never enter the CLM — they live " +
          "in email, shared drives, and individual lawyers' folders — so there " +
          "is no reliable repository to manage obligations, report risk, or feed " +
          "AI. The 'dark' contract estate is invisible until something goes " +
          "wrong.",
        detectionSignal:
          "Low % of contracts in the CLM, inability to answer 'how many active " +
          "contracts do we have with vendor X', contracts surfacing only during " +
          "disputes or audits, AP suppliers with no matching CLM record.",
        diagnosticQuestion:
          "What share of your active contract estate is actually in the CLM " +
          "with extracted metadata, versus stored ad hoc — and how would you " +
          "find every contract with a specific clause today?",
      },
      {
        key: "obligation_value_leakage",
        name: "Value leakage from unmanaged obligations",
        description:
          "Negotiated obligations — price holds, rebates, SLAs, milestone " +
          "credits, renewal and termination windows — are buried in contract " +
          "PDFs that no system tracks, so the company silently fails to claim " +
          "value it already negotiated and gets auto-renewed into bad terms.",
        detectionSignal:
          "Missed renewal/termination dates, unclaimed rebates and SLA credits, " +
          "auto-renewals discovered after the window closed, no central " +
          "obligation register, AP paying contracted-out amounts.",
        diagnosticQuestion:
          "Where do your contractual obligations and key dates live today, and " +
          "who is accountable for ensuring rebates, SLAs, and renewal windows " +
          "are actually captured?",
      },
      {
        key: "outside_counsel_overspend",
        name: "Outside-counsel overspend & weak spend visibility",
        description:
          "Routine, repeatable work is sent to expensive law firms, invoices " +
          "are approved without rigorous review against billing guidelines, and " +
          "there is little matter-level visibility into what drives spend — so " +
          "the largest controllable legal cost runs unmanaged.",
        detectionSignal:
          "High outside-counsel % of budget, flat or rising firm spend, " +
          "rubber-stamped invoices, no rate cards or billing-guideline " +
          "enforcement, routine matters handled externally.",
        diagnosticQuestion:
          "What share of your outside-counsel spend is on work that could be " +
          "insourced or handled by an ALSP, and how rigorously are invoices " +
          "reviewed against billing guidelines?",
      },
      {
        key: "intake_chaos",
        name: "Legal intake chaos & unmanaged demand",
        description:
          "Legal work arrives through every channel — hallway, email, Slack, " +
          "tickets — with no triage, no prioritization, and no record. Lawyers " +
          "self-assign by who-asked-loudest, urgent and trivial work compete, " +
          "and the team cannot see or manage its own demand.",
        detectionSignal:
          "No single intake channel, slow/variable intake response time, work " +
          "lost or duplicated, no demand reporting, lawyers triaging their own " +
          "inboxes ad hoc.",
        diagnosticQuestion:
          "How does legal work actually reach your team today, and can you see " +
          "and prioritize total incoming demand — or does each lawyer manage " +
          "their own inbox?",
      },
      {
        key: "lawyer_adoption_resistance",
        name: "Lawyer adoption resistance",
        description:
          "Lawyers are trained to distrust unverified output, are personally " +
          "accountable for errors, and bill or are measured on judgment — so " +
          "they route around tools that add friction, that they do not trust, " +
          "or that threaten their sense of craft. Licenses get bought; the " +
          "workflow never changes.",
        detectionSignal:
          "Low active-use rate against licensed seats, tools used as " +
          "shelfware, lawyers reverting to Word/email, 'I checked it all " +
          "myself anyway' feedback, no change in cycle-time metrics after " +
          "rollout.",
        diagnosticQuestion:
          "Of your licensed legal-AI/CLM seats, what share are in active weekly " +
          "use in core workflow — and what specifically would make your most " +
          "skeptical senior lawyer trust the output?",
      },
      {
        key: "genai_accuracy_privilege_risk",
        name: "GenAI accuracy & privilege exposure",
        description:
          "Ungoverned GenAI use creates two acute risks: hallucinated content " +
          "(fabricated case citations, invented clauses, confidently wrong " +
          "analysis) that becomes a malpractice/discipline exposure, and " +
          "privilege/confidentiality leakage if privileged or client data is " +
          "fed to tools without proper controls and data handling.",
        detectionSignal:
          "Lawyers pasting client/contract text into consumer GenAI tools, no " +
          "approved-tool policy, no human-verification requirement on AI output, " +
          "no data-handling/retention controls, citation errors slipping into " +
          "work product.",
        diagnosticQuestion:
          "What is your policy on feeding privileged or client data to AI " +
          "tools, and what verification step ensures no AI-generated citation or " +
          "clause reaches a legally-operative document unchecked?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_contract_review_redline",
        name: "AI contract review & redlining",
        valueMechanism:
          "Compare a third-party (or first-party) contract against the " +
          "company's approved playbook, flag deviations and missing protections, " +
          "and propose redlines and fallback language — so a lawyer reviews and " +
          "approves a marked-up draft in a fraction of the time first-pass " +
          "review takes manually, reclaiming attorney capacity on the highest-" +
          "volume task.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Approved clause playbook with standard / fallback positions",
          "Historical redlined contracts for pattern learning",
          "The incoming contract text (parsed from PDF/DOCX)",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A lawyer must review and own every redline — AI suggestions are drafts, never the executed position",
          "Hallucinated or omitted clauses are a malpractice risk; suggestions must be verifiable against the playbook, not free-generated",
          "Privileged / confidential contract text requires governed, non-training data handling",
        ],
        metricsMoved: [
          "contract_review_turnaround",
          "contract_cycle_time",
          "clause_deviation_rate",
        ],
      },
      {
        key: "clause_extraction_obligation_mgmt",
        name: "Clause extraction & obligation management",
        valueMechanism:
          "Extract clauses, key terms, dates, and obligations from the contract " +
          "estate into a structured register, then track and alert on renewals, " +
          "price holds, rebates, SLAs, and termination windows — converting a " +
          "dark PDF estate into managed obligations and recovering value " +
          "(leakage) that was negotiated but never captured.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "The contract estate digitized and in (or feeding) the CLM repository",
          "A clause / obligation taxonomy to extract against",
          "AP / spend data to reconcile obligations to actual payments",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Low-confidence extractions must route to human review before driving an action or a dollar claim",
          "Leakage-recovery figures are estimates until reconciled to AP — present as planning, not booked",
          "Extraction over the estate may touch privileged or sensitive contracts; scope and access must be governed",
        ],
        metricsMoved: [
          "contract_value_leakage",
          "contracts_in_clm_pct",
          "clause_deviation_rate",
        ],
      },
      {
        key: "self_serve_contract_generation",
        name: "Self-serve / GenAI contract generation",
        valueMechanism:
          "Let the business generate standard, low-risk agreements (NDAs, order " +
          "forms, low-value MSAs) through guided templates and approved " +
          "playbooks, auto-approving within pre-set guardrails and escalating " +
          "only deviations — so routine paper never reaches a lawyer and the " +
          "team's capacity scales without headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Approved templates and clause library with locked vs negotiable terms",
          "Guardrail / escalation rules (value thresholds, prohibited deviations)",
          "Counterparty and deal metadata captured at intake",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Only pre-approved templates within defined risk thresholds may auto-execute; anything outside guardrails escalates to a lawyer",
          "Escalation rules must be conservative — a wrongly auto-approved off-policy term is direct legal exposure",
          "Business users are not lawyers; the guided flow must prevent, not just warn against, prohibited edits",
        ],
        metricsMoved: [
          "self_serve_contract_pct",
          "nda_turnaround",
          "contract_cycle_time",
        ],
      },
      {
        key: "legal_intake_triage_routing",
        name: "Legal intake triage & routing",
        valueMechanism:
          "Capture all legal demand through a single intake surface, then use AI " +
          "to classify, prioritize, route to the right team/lawyer, and " +
          "auto-answer or deflect routine questions from the knowledge base — " +
          "turning chaotic, invisible demand into a managed, fast-responding " +
          "service queue without adding triage headcount.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical intake requests labeled by type / routing",
          "A legal knowledge base / policy corpus for deflection answers",
          "Team / matter taxonomy and routing rules",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Auto-deflected answers must be grounded in approved policy, not generated, and flagged as not legal advice where appropriate",
          "Mis-routing or wrongly deflecting a high-stakes matter is a risk; confidence thresholds must escalate ambiguity to a human",
          "Intake may carry privileged or sensitive facts; access and retention must be controlled",
        ],
        metricsMoved: [
          "legal_intake_response_time",
          "matter_backlog",
          "contract_cycle_time",
        ],
      },
      {
        key: "ediscovery_ai_review",
        name: "AI-assisted e-discovery & document review",
        valueMechanism:
          "Use technology-assisted review (predictive coding / continuous " +
          "active learning) and GenAI to prioritize, cluster, and first-pass " +
          "code large document populations for relevance and privilege — " +
          "collapsing the most expensive, most leverage-heavy part of " +
          "litigation and investigations and shrinking outside-counsel and " +
          "review-vendor spend.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "The collected document population (emails, files, chats) in a review platform",
          "Seed sets / human coding decisions to train the model",
          "A privilege/relevance coding protocol agreed with counsel",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Privilege calls and final relevance decisions must be attorney-supervised and defensible to a court",
          "TAR/GenAI methodology must be transparent and defensible (proportionality, validation) — a black box invites challenge",
          "Over-reliance on AI privilege coding risks inadvertent privileged production / waiver",
        ],
        metricsMoved: [
          "outside_counsel_spend_pct",
          "matter_backlog",
        ],
      },
      {
        key: "matter_spend_analytics",
        name: "Matter & outside-counsel spend analytics",
        valueMechanism:
          "Classify and analyze e-billing and matter data to surface " +
          "off-guideline charges, rate creep, work that should be insourced or " +
          "sent to an ALSP, and high-cost matter patterns — enabling rigorous " +
          "invoice review and sourcing decisions that bend the largest " +
          "controllable line in the legal budget.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "E-billing invoice line-item data with task/activity codes",
          "Billing guidelines and negotiated rate cards",
          "Matter taxonomy and historical spend by matter type",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-flagged invoice line items inform a human reviewer's decision; the GC/ops owns the dispute or approval",
          "Sourcing/insourcing decisions weigh risk and relationship, not cost alone — the model advises, the lawyer decides",
          "Spend classification errors mislead sourcing; sample-validate accuracy",
        ],
        metricsMoved: [
          "outside_counsel_spend_pct",
          "matter_backlog",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "clm_system_of_record",
        name: "CLM as contract system of record",
        description:
          "A single contract lifecycle management platform holding the active " +
          "contract estate with extracted metadata, version history, approval " +
          "workflow, and an obligation register — the repository on which every " +
          "downstream AI capability (review, extraction, analytics, leakage " +
          "recovery) depends. Migrating the off-CLM 'dark' estate in is the " +
          "foundational, unglamorous prerequisite.",
        boundary:
          "Owns the contract repository, metadata, workflow, and obligation " +
          "register; does not make the legal judgment on terms (that stays with " +
          "lawyers) and does not replace the negotiation itself.",
        humanAccountabilityPoint: "Legal Operations Director",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "playbook_governed_review",
        name: "Playbook-governed AI review with human approval",
        description:
          "An AI contract-review flow anchored to the company's approved clause " +
          "playbook: AI proposes redlines and flags deviations strictly against " +
          "documented standard/fallback positions, a lawyer reviews and owns the " +
          "final markup, and approved deviations are logged. Grounding to the " +
          "playbook (not free generation) is what makes the output trustworthy " +
          "enough to drive lawyer adoption.",
        boundary:
          "Owns first-pass review, deviation flagging, and redline drafting; " +
          "does not own the final negotiated position or the decision to accept " +
          "risk — a licensed lawyer approves every executed term.",
        humanAccountabilityPoint:
          "Reviewing Attorney / Contracts Counsel (and GC for policy exceptions)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "tiered_self_service_intake",
        name: "Tiered self-service + AI-triaged intake",
        description:
          "A single legal intake surface where AI triages incoming demand: " +
          "low-risk standard requests route to guided self-service / templated " +
          "generation, routine questions are deflected with grounded knowledge, " +
          "and judgment-heavy matters are classified, prioritized, and routed to " +
          "the right lawyer — deflect and self-serve the routine, escalate the " +
          "judgment, make total demand visible.",
        boundary:
          "Owns demand capture, triage, routing, and routine deflection/self-" +
          "service; does not provide legal advice on escalated matters or decide " +
          "matter outcomes, which stay with assigned lawyers.",
        humanAccountabilityPoint:
          "Legal Operations Director (with GC accountable for service model)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "governed_genai_workbench",
        name: "Governed GenAI legal workbench",
        description:
          "An approved, enterprise-controlled GenAI environment for legal — " +
          "drafting, summarization, research assistance, Q&A over the matter/" +
          "contract corpus — with data handling that keeps privileged content " +
          "out of training, an approved-tool policy, and a mandatory human-" +
          "verification step before any AI output reaches a legally-operative " +
          "document. The alternative to ungoverned shadow-AI use.",
        boundary:
          "Owns the safe AI surface, data-handling controls, and verification " +
          "workflow; does not own the substance of the legal work or relieve the " +
          "lawyer of the duty of competence and verification.",
        humanAccountabilityPoint:
          "General Counsel (accountable owner) / Legal Ops (operator)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Legal value is realized on THREE honest levers, none of which is a " +
        "clean revenue line. First, CAPACITY RECLAIMED: AI contract review, " +
        "self-service generation, and intake triage compress cycle time and " +
        "review turnaround so a flat legal team absorbs rising volume without " +
        "headcount — sized as hours/FTE reclaimed against the matter backlog, " +
        "not as booked savings. Second, OUTSIDE-COUNSEL SPEND reduction: " +
        "AI-assisted e-discovery, matter spend analytics, and insourcing routine " +
        "work bend the largest controllable budget line — the most directly " +
        "measurable lever, in e-billing. Third, RISK + LEAKAGE: clause " +
        "extraction and obligation management recover negotiated value (missed " +
        "renewals, unclaimed rebates/SLAs) and reduce latent risk (uncapped " +
        "liability, off-policy deviations) — real but fuzzy, because a dispute " +
        "that did not happen and an obligation now tracked are hard to book. " +
        "Attribution is deliberately conservative: capacity reclaimed is not " +
        "automatically cashable headcount, leakage recovery is an estimate until " +
        "reconciled to AP, and risk reduction is probabilistic. Above all, the " +
        "binding constraint is LAWYER ADOPTION — value is realized only on the " +
        "share of the team that actually changes its workflow, so the value " +
        "model is gated by adoption, not by tool capability.",
      dominantHaircutFactors: [
        {
          factor: "Lawyer adoption (the binding constraint)",
          rationale:
            "Lawyers route around tools they do not trust or that add friction, " +
            "so a large share of provisioned capability is never used. Until " +
            "active-use rates are high, projected capacity and cycle-time gains " +
            "are aspirational — adoption is the single largest haircut in this " +
            "domain.",
          typicalHaircut: {
            low: 0.3,
            high: 0.6,
            basis:
              "Observed gap between licensed seats and active weekly use in " +
              "legal-AI deployments; many stall at 20-40% active use",
            label: "planning-range",
          },
        },
        {
          factor: "Privilege / accuracy fence on what is automatable",
          rationale:
            "Privilege, work-product protection, the duty of competence, and " +
            "GenAI hallucination risk mean the highest-judgment work stays " +
            "human-owned and AI output must be verified — so the auto-executable, " +
            "capacity-freeing share is far smaller than total volume.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Share of legal work fenced from autonomy by privilege, judgment, " +
              "and mandatory human verification in regulated legal practice",
            label: "planning-range",
          },
        },
        {
          factor: "Data readiness & off-CLM dark estate",
          rationale:
            "Clause extraction, obligation management, leakage recovery, and " +
            "analytics all require the contract estate digitized and in the CLM " +
            "with clean metadata; a large rogue off-CLM tail caps how much value " +
            "any AI layer can actually reach.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Implementation experience where missing/off-CLM contracts and " +
              "dirty metadata throttled obligation and analytics value",
            label: "planning-range",
          },
        },
        {
          factor: "Capacity-to-cash conversion & attribution",
          rationale:
            "Reclaimed lawyer hours and avoided risk are real but not " +
            "automatically cashable — capacity rarely converts 1:1 to headcount " +
            "reduction, and leakage/risk value is estimated, so forward value " +
            "must be discounted for soft attribution.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between modeled capacity/risk value and value that lands as " +
              "a measurable budget or P&L outcome",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Contract cycle-time / review-turnaround reduction",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reported cycle-time and first-pass review-time reduction from " +
              "CLM + AI-review programs, gated by adoption",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in contract_cycle_time / contract_review_" +
            "turnaround on adopted workflows",
        },
        {
          lever: "Outside-counsel spend reduction",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Reported outside-counsel spend reduction from AI e-discovery, " +
              "spend analytics, and insourcing of routine work",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in outside_counsel_spend_pct against the legal " +
            "budget",
        },
        {
          lever: "Contract value-leakage recovery",
          range: {
            low: 0.01,
            high: 0.05,
            basis:
              "Recoverable share of contract value from obligation management " +
              "against an estimated 5-9% leakage baseline; conservative because " +
              "the baseline is itself an estimate",
            label: "planning-range",
          },
          measuredAs:
            "Recovered value as a share of contract value, reconciled to AP / " +
            "renewal outcomes",
        },
      ],
      timeToValueBand:
        "Quick wins on high-volume low-risk paper (NDA / self-service " +
        "generation, intake triage): 1-2 quarters. AI contract review at scale " +
        "and outside-counsel spend analytics: 2-4 quarters, gated by adoption. " +
        "Full contract estate migration into CLM + obligation management and " +
        "leakage recovery: 12-24 months because the dark estate must be digitized " +
        "first. Lawyer adoption maturity, not technology, sets the real pace.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Contract lifecycle management (CLM) platform",
          role:
            "System of record for the contract estate — repository, metadata, " +
            "drafting/workflow, approvals, and the obligation register on which " +
            "AI review, extraction, and analytics depend.",
          examples: ["Ironclad", "Icertis", "DocuSign CLM", "SirionLabs", "Agiloft"],
        },
        {
          name: "Matter management / legal management system",
          role:
            "System of record for legal matters, intake, assignments, status, " +
            "and the workload that drives backlog and capacity metrics.",
          examples: [
            "SimpleLegal",
            "Brightflag",
            "Onit",
            "Litify",
            "Mitratech TeamConnect",
          ],
        },
        {
          name: "E-billing / legal spend management",
          role:
            "Captures outside-counsel invoices with line-item task codes and " +
            "enforces billing guidelines/rate cards — the source for spend " +
            "analytics and the outside-counsel budget number.",
          examples: ["Brightflag", "SimpleLegal", "Onit/BillingPoint", "Legal Tracker"],
        },
        {
          name: "Document management system (DMS)",
          role:
            "Stores legal documents, contracts, and matter files; the home of " +
            "much of the off-CLM 'dark' contract estate that must be migrated " +
            "in.",
          examples: ["iManage", "NetDocuments", "SharePoint"],
        },
        {
          name: "E-discovery / document review platform",
          role:
            "Collects, processes, and hosts document populations for " +
            "litigation/investigation review, with TAR/predictive-coding and " +
            "GenAI-assisted review.",
          examples: ["Relativity", "DISCO", "Everlaw", "Reveal"],
        },
        {
          name: "AI contract review / legal GenAI tools",
          role:
            "Playbook-grounded contract review/redline and broader legal GenAI " +
            "assistance (drafting, summarization, research) layered on the " +
            "systems of record.",
          examples: ["Harvey", "Spellbook", "LinkSquares", "Luminance", "Robin AI"],
        },
      ],
      roles: [
        {
          title: "General Counsel (GC)",
          accountability:
            "Overall legal risk, the legal-AI/data-handling policy, and the " +
            "accountable owner of every legally-operative output — the buck " +
            "stops here on privilege and competence.",
        },
        {
          title: "Legal Operations Director",
          accountability:
            "The legal function's operating model, tooling, intake/service " +
            "model, vendor management, and the metrics (cycle time, backlog, " +
            "spend, adoption) — the primary owner of legal-AI transformation.",
        },
        {
          title: "Contract Manager / Contracts Counsel",
          accountability:
            "Contract review quality, playbook compliance, the CLM estate, and " +
            "the integrity of obligations and approved deviations.",
        },
        {
          title: "Reviewing / Responsible Attorney",
          accountability:
            "Owning the final negotiated position and verifying any AI-assisted " +
            "output before it reaches a legally-operative document.",
        },
        {
          title: "Litigation / E-Discovery Counsel",
          accountability:
            "Defensible review methodology, privilege calls, and outside-" +
            "counsel/review-vendor spend on litigation and investigations.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Attorney-client privilege & work-product protection",
          relevance:
            "The dominant fence: feeding privileged content to ungoverned tools " +
            "or careless AI-assisted production can waive privilege, so data " +
            "handling, tool approval, and human control are non-negotiable.",
        },
        {
          name: "Professional responsibility & duty of competence (incl. AI competence)",
          relevance:
            "Ethics rules require lawyers to understand the tools they use and " +
            "to verify AI output; sanctioned cases of fabricated AI citations " +
            "make human verification a professional obligation, not a preference.",
        },
        {
          name: "Data privacy & residency (GDPR / CCPA / cross-border)",
          relevance:
            "Contracts, intake, and matter data carry personal and commercially " +
            "sensitive data; AI processing and any offshore review trigger " +
            "privacy, residency, and cross-border-transfer obligations.",
        },
        {
          name: "Records retention & legal holds",
          relevance:
            "Contract and matter records have retention and legal-hold " +
            "obligations; automation and migration must preserve holds and " +
            "retention rules rather than break them.",
        },
        {
          name: "E-discovery rules & proportionality (FRCP / equivalents)",
          relevance:
            "TAR/GenAI-assisted review must be defensible and proportional under " +
            "the rules of civil procedure; methodology transparency and " +
            "validation guard against challenge and against inadvertent " +
            "privileged production.",
        },
      ],
      canonicalTerms: [
        {
          term: "CLM (contract lifecycle management)",
          definition:
            "The end-to-end management of contracts — request, draft, " +
            "negotiate, approve, execute, store, and manage obligations — and " +
            "the platform that is the contract system of record.",
        },
        {
          term: "Redline",
          definition:
            "A marked-up contract showing proposed edits/changes against a prior " +
            "version or the counterparty's draft — the core artifact of contract " +
            "negotiation and the output of AI review.",
        },
        {
          term: "Obligation management",
          definition:
            "Tracking and ensuring fulfillment of contractual obligations and " +
            "key dates (renewals, SLAs, rebates, price holds, termination " +
            "windows) — where value leakage is recovered.",
        },
        {
          term: "Privilege (attorney-client / work product)",
          definition:
            "Legal protections that keep certain lawyer-client communications " +
            "and litigation-prepared materials confidential and out of " +
            "production; the primary constraint on AI data handling.",
        },
        {
          term: "Matter",
          definition:
            "A discrete unit of legal work (a deal, dispute, advisory request, " +
            "or project) — the unit of intake, assignment, backlog, and spend.",
        },
        {
          term: "Playbook",
          definition:
            "The approved set of standard and fallback contract positions a " +
            "lawyer (or AI) reviews against — the grounding that makes AI review " +
            "trustworthy and deviations measurable.",
        },
        {
          term: "TAR / predictive coding",
          definition:
            "Technology-assisted review — using machine learning to prioritize " +
            "and code documents for relevance/privilege in e-discovery, the " +
            "defensible alternative to linear manual review.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Contract cycle time and review turnaround",
        authoritativeSource:
          "CLM workflow timestamps (request -> draft -> negotiate -> approve -> " +
          "execute) and AI-review tool redline timestamps",
        whatGoodEvidenceLooksLike:
          "Median cycle time and review turnaround for a trailing period, " +
          "segmented by contract type and by whether the workflow was adopted " +
          "(AI-assisted) vs manual.",
        weakEvidenceToReject:
          "A vendor-quoted 'cut review time by 80%' headline with no link to the " +
          "tenant's own baseline, contract mix, or adoption rate.",
      },
      {
        claim: "Lawyer adoption / active use",
        authoritativeSource:
          "CLM and legal-AI platform telemetry (active users vs licensed seats, " +
          "actions per user in core workflow)",
        whatGoodEvidenceLooksLike:
          "Active weekly users as a share of licensed seats over time, by team, " +
          "with the actual workflow actions taken — proving the tool is in core " +
          "use, not shelfware.",
        weakEvidenceToReject:
          "A count of licenses purchased or a one-time training-completion number " +
          "presented as 'adoption'.",
      },
      {
        claim: "Outside-counsel spend and savings",
        authoritativeSource:
          "E-billing line-item data with task codes, reconciled to the legal GL " +
          "budget and billing guidelines",
        whatGoodEvidenceLooksLike:
          "Outside-counsel spend by matter type and firm with off-guideline " +
          "flags, and savings traced to specific insourcing / e-discovery / " +
          "rate actions against a baseline.",
        weakEvidenceToReject:
          "A blanket 'we'll save 20% on outside counsel' with no matter-level " +
          "breakdown or named sourcing action.",
      },
      {
        claim: "Contract value leakage and recovery",
        authoritativeSource:
          "Obligation register from clause extraction reconciled to AP / spend " +
          "and renewal outcomes",
        whatGoodEvidenceLooksLike:
          "Specific recovered obligations (claimed rebates, renegotiated " +
          "renewals, captured SLA credits) tied to dollar amounts and reconciled " +
          "to AP, against a stated leakage baseline.",
        weakEvidenceToReject:
          "Applying a generic '9% of revenue leaks' statistic to the tenant as " +
          "if it were a measured, recoverable figure.",
      },
      {
        claim: "Contract estate coverage and clause risk",
        authoritativeSource:
          "CLM repository counts vs estimated active-contract population, plus " +
          "AI clause-extraction over the executed estate against the playbook",
        whatGoodEvidenceLooksLike:
          "% of the estate in the CLM with extracted metadata, and a clause-" +
          "deviation profile (e.g. uncapped liability, off-policy data terms) " +
          "across the executed population.",
        weakEvidenceToReject:
          "An assertion that 'all our contracts are in the system' with no " +
          "reconciliation to the AP supplier base or DMS scan.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What share of your contract volume is standard, low-risk paper that still requires a lawyer's touch, and what is your cycle time and review turnaround on it?",
      "What share of your active contract estate is actually in the CLM with extracted metadata, versus stored ad hoc in email, drives, and individual folders?",
      "Of your licensed legal-AI/CLM seats, what share are in active weekly use in core workflow, and what would make your most skeptical senior lawyer trust the output?",
      "What is your outside-counsel spend as a share of the legal budget, how much of it is routine work that could be insourced, and how rigorously are invoices reviewed?",
      "Where do your contractual obligations and key dates live today, and who is accountable for capturing rebates, SLAs, and renewal/termination windows?",
      "How does legal work reach your team, can you see and prioritize total incoming demand, and what is your intake first-response time?",
      "What is your policy on feeding privileged or client data to AI tools, and what verification step ensures no AI-generated citation or clause reaches a legally-operative document unchecked?",
    ],
    maturitySignals: [
      "A single CLM holds the majority of the active estate with clean extracted metadata, and the off-CLM tail is being actively migrated in.",
      "AI contract review is grounded in an approved playbook with a lawyer owning every redline, and adoption (active-use rate) is measured and managed.",
      "Low-risk paper (NDAs, order forms) is self-served within governed guardrails, with conservative escalation rules, freeing lawyers for judgment work.",
      "Outside-counsel spend is managed against billing guidelines and rate cards with matter-level analytics, and an approved-tool / data-handling policy governs all GenAI use.",
    ],
    redFlags: [
      "Licenses are bought but active-use rates are low and cycle-time metrics have not moved — adoption has stalled and the program is shelfware.",
      "A large rogue off-CLM estate means obligations, leakage, and clause risk are invisible until a dispute or audit surfaces them.",
      "Lawyers paste privileged or client data into ungoverned consumer GenAI tools, and there is no mandatory human-verification step on AI output.",
      "Value cases lean on generic statistics (e.g. '9% leakage', 'cut review 80%') with no tenant baseline, no adoption assumption, and no attribution path.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Enterprise CLM suites (Ironclad, Icertis, SirionLabs, DocuSign CLM)",
        category: "Contract lifecycle management system of record",
        switchingCost:
          "High — the contract repository, extracted metadata, workflows, and integrations accrete; re-migrating the estate and re-training extraction is the real cost.",
        renewalDynamics:
          "Per-seat or contract-volume subscription with AI features increasingly upsold as premium tiers; leverage measured adoption and estate coverage at renewal.",
      },
      {
        vendorName: "Legal AI / contract-review tools (Harvey, Spellbook, Luminance, LinkSquares, Robin AI)",
        category: "Playbook-grounded AI review, redlining, and legal GenAI",
        switchingCost:
          "Moderate — integrate via document and CLM feeds and are replaceable with re-mapping, but playbook tuning and lawyer trust/habit add stickiness once adopted.",
        renewalDynamics:
          "Per-seat or usage-based pricing in a fast-moving market; favor short terms, model/data-portability rights, and outcome/adoption gating given the pace of change.",
      },
      {
        vendorName: "Matter & legal spend management (Brightflag, SimpleLegal, Onit, Litify)",
        category: "Matter management, intake, and e-billing / spend analytics",
        switchingCost:
          "Moderate-to-high — matter history, e-billing integrations, and firm onboarding accrete; the firm-side e-billing connections are the real re-enablement cost.",
        renewalDynamics:
          "Per-user or spend-under-management pricing; leverage realized spend savings and guideline-enforcement value at renewal.",
      },
      {
        vendorName: "E-discovery platforms (Relativity, DISCO, Everlaw, Reveal)",
        category: "Document review / TAR / GenAI-assisted e-discovery",
        switchingCost:
          "High during an active matter (data hosting and review workflow lock-in); lower between matters, but enterprise hosting commitments and review-team familiarity add stickiness.",
        renewalDynamics:
          "Data-volume (per-GB) hosting plus user/processing fees; AI/GenAI review upsold per matter — negotiate hosting tiers and outcome terms as volumes grow.",
      },
      {
        vendorName: "ALSPs & managed legal services (e.g. UnitedLex, Elevate, Big-4 legal)",
        category: "Alternative legal service providers / outside-counsel substitution",
        switchingCost:
          "Moderate — knowledge and trained teams sit with the provider; re-transition risk on in-flight work, but the relationship is the lever to re-price outside counsel.",
        renewalDynamics:
          "FTE-, managed-service-, or outcome-based pricing; the lever is substituting routine law-firm work and re-pricing as AI absorbs review volume.",
      },
    ],
    switchingCosts:
      "The CLM repository is the stickiest asset — migrating the estate and " +
      "re-training extraction is a multi-quarter effort, so the CLM is rarely " +
      "switched casually. Legal-AI review tools are more contestable in a fast-" +
      "moving market, but lawyer trust and tuned playbooks create soft lock-in " +
      "once adopted. E-discovery locks in during a live matter. The negotiable " +
      "frontier is in the AI layer around the CLM and in re-pricing outside " +
      "counsel / ALSP work as AI absorbs review and discovery volume.",
    negotiationLevers: [
      "Gate AI-tool spend on measured adoption (active-use rate) and tenant-baseline outcome lift, not on seats purchased",
      "Short terms and model/data-portability rights for legal-AI tools given the fast-moving, fast-improving market",
      "Insource routine work and substitute ALSPs for law firms, re-pricing outside counsel from hourly toward fixed/outcome fees",
      "Enforce billing guidelines and rate cards via spend analytics, disputing off-guideline line items before they are paid",
      "Negotiate e-discovery hosting tiers and AI-review terms per matter against data-volume commitments",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      throughput_metric: [
        "CLM / AI-tool workflow timestamps",
        "segmentation by contract type and adopted-vs-manual workflow",
        "trailing-period median",
      ],
      adoption_claim: [
        "platform telemetry (active users vs licensed seats)",
        "core-workflow actions per user",
        "trend over time, not a point-in-time training number",
      ],
      spend_claim: [
        "e-billing line-item data with task codes",
        "reconciliation to the legal GL budget",
        "named sourcing/insourcing action behind any savings",
      ],
      leakage_recovery_claim: [
        "obligation register reconciled to AP / renewal outcomes",
        "stated leakage baseline (estimate, labelled as such)",
        "specific recovered obligations, not a generic statistic",
      ],
      risk_exposure_claim: [
        "AI clause extraction over the executed estate",
        "comparison to the approved playbook",
        "estate-coverage caveat (off-CLM tail noted)",
      ],
      value_projection: [
        "explicit adoption assumption (value is gated by adoption)",
        "benchmark planning-range",
        "haircut factors applied (adoption, privilege fence, data, attribution)",
        "attribution path to a measurable budget/risk outcome",
      ],
    },
    citationStandard:
      "Quantitative legal claims cite the system-of-record source (CLM " +
      "workflow timestamps, platform adoption telemetry, e-billing line items, " +
      "or the obligation register reconciled to AP) plus the period and the " +
      "segment. Throughput and value claims MUST state the adoption assumption " +
      "they depend on, because value is gated by lawyer adoption, not tool " +
      "capability. Value projections cite a labelled planning range, the haircut " +
      "factors applied, and the attribution path — never a generic industry " +
      "statistic (e.g. '9% leakage', 'cut review 80%') asserted as the tenant's " +
      "measured figure, and never a vendor outcome claim presented as validated.",
  },

  hedgeRules: {
    whenToHedge: [
      "Adoption / active-use data is missing — frame cycle-time and capacity gains as adoption-gated potential, not the tenant's realized result.",
      "A generic legal statistic is being used (leakage %, review-time cut) — present it as an industry planning range, not the tenant's measured number.",
      "Leakage or risk-reduction value is being sized — flag that it is an estimate until reconciled to AP / renewal outcomes and that risk value is probabilistic.",
      "Vendor-reported outcomes are cited — mark as provider claims pending tenant-baseline validation.",
      "A claim touches privileged or work-product material — flag the privilege/data-handling constraint before reasoning over it.",
    ],
    inferenceLanguage: [
      "Across corporate legal functions at this scale, contract cycle time typically runs...",
      "Without your adoption telemetry, the industry pattern suggests AI review can compress turnaround by roughly... on adopted workflows...",
      "World Commerce & Contracting estimates contract value leakage near 9% of revenue — treat this as a planning range, not your measured figure...",
      "Peer legal departments commonly run outside counsel at... of budget, but the GC weighs cost against risk...",
      "Treating this as an adoption-gated planning range rather than a realized result...",
    ],
    flagWithoutEvidence: [
      "A specific dollar savings, recovered-leakage amount, or ROI for this tenant",
      "This tenant's actual contract cycle time, review turnaround, or lawyer adoption rate",
      "A capacity or cycle-time gain stated without the adoption assumption it depends on",
      "A claim that a specific contract type or matter can be safely automated/self-served without a privilege and risk review",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "legal value story / capacity, outside-counsel spend, and leakage on one bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current legal cost/risk through capacity reclaimed, outside-counsel reduction, and leakage recovery to net — with the adoption and attribution haircuts shown.",
    },
    {
      questionPattern:
        "contract cycle-time trend / are reviews getting faster",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend contract cycle time and review turnaround against planning ranges, segmented by adopted-vs-manual workflow, to show whether adoption is bending the curve.",
    },
    {
      questionPattern:
        "outside-counsel spend breakdown / where does legal spend sit by matter type and firm",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack outside-counsel spend by matter type/firm with off-guideline and insourceable shares flagged, to show where the controllable cost concentrates.",
    },
    {
      questionPattern:
        "contract estate risk / clause-deviation exposure across the portfolio",
      exhibitKind: "chart",
      chartKind: "heatmap",
      note: "Heatmap clause-deviation rate by clause type and business unit (uncapped liability, off-policy data terms, non-standard indemnity) over the executed estate.",
    },
    {
      questionPattern: "legal operations KPI scorecard",
      exhibitKind: "table",
      note: "Contract cycle time, review turnaround, NDA turnaround, self-serve %, % in CLM, clause-deviation rate, outside-counsel % of budget, matter backlog, intake response, and lawyer adoption rate vs planning ranges.",
    },
    {
      questionPattern:
        "adoption readiness / where does each legal-AI use case sit on safety and adoption",
      exhibitKind: "table",
      note: "Per use case: control posture, privilege/accuracy risk, adoption profile, data dependency, and the metrics it moves — the honest map of what is safe to automate now.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A credible lawyer-adoption program — champions, trust-building on a low-risk first win (NDAs), and tools that reduce rather than add friction in the actual workflow",
      "AI review grounded in an approved playbook with a lawyer owning every redline, so output is verifiable and earns trust rather than being distrusted on sight",
      "Sequencing from high-volume low-risk work (NDA/self-service, intake triage) toward higher-judgment use cases only as trust and data maturity build",
      "The contract estate getting into the CLM with clean metadata, unlocking obligation management, leakage recovery, and analytics that were previously blocked",
    ],
    failureDrivers: [
      "Licenses bought without a change program — lawyers route around the tool, active use stalls, and the program becomes shelfware with no metric movement",
      "AI output distrusted because it is free-generated rather than playbook-grounded, or because a hallucinated citation/clause damaged credibility early",
      "A large rogue off-CLM estate left in place, so obligation, leakage, and analytics value never materializes for lack of data",
      "Value cases built on generic statistics with no adoption assumption or attribution path, so claimed savings never reconcile and the next wave loses funding",
    ],
    adoptionReadiness: "low",
    adoptionCurve:
      "Adoption is the binding constraint and the slowest variable. " +
      "High-volume, low-risk, low-judgment work adopts first — NDA / self-" +
      "service generation and intake triage earn the early trust win. AI " +
      "contract review adopts next, but only where it is playbook-grounded and " +
      "the lawyer keeps the pen; skeptical senior lawyers are the gate. Higher-" +
      "judgment drafting and analysis adopt last and may never fully cede the " +
      "human. E-discovery TAR is the exception — already mainstream and trusted " +
      "because it is court-tested and attorney-supervised. Champions and a " +
      "credible first win matter more than features.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is mixed and honestly capped below back-office norms. The " +
      "firmest lever is outside-counsel spend, directly measurable in e-billing. " +
      "Capacity reclaimed is measurable in cycle-time and backlog but rarely " +
      "converts 1:1 to cashable headcount. Leakage recovery and risk reduction " +
      "are the largest but fuzziest pools — a missed obligation now tracked or a " +
      "dispute that did not happen is real value that is hard to book, and " +
      "baselines are estimates. Above all, every projection is gated by lawyer " +
      "adoption, so ROI is only as firm as the active-use rate — which is why " +
      "the evidence and hedge rules force an explicit adoption assumption and an " +
      "attribution path on every value claim.",
  },

  regulatoryFrame: {
    name: "Attorney-client privilege, professional responsibility & e-discovery rules",
    relevance:
      "The dominant frame for legal-function AI: attorney-client privilege and " +
      "work-product protection fence what data may touch AI tools; the duty of " +
      "competence and sanctioned cases of fabricated AI citations make human " +
      "verification of every legally-operative output a professional obligation, " +
      "not a preference; and e-discovery rules (FRCP / equivalents) require " +
      "TAR/GenAI-assisted review to be defensible and proportional. Data privacy/" +
      "residency and records-retention/legal-hold obligations also apply (see " +
      "vocabulary.regulatoryFrames). Together these set the human-in-the-loop / " +
      "human-approval-required default posture for the domain.",
  },

  provenance: {
    authoredBy: "claude-subagent (W3 wave2)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
