// Consilium expert — Enterprise Value Office & AI Enablement (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question a CEO/CFO/COO standing up an enterprise innovation or AI-enablement
// office is actually asking: "What is the disciplined METHOD that turns a stream
// of ideas into governed human+agent solutions, with a measured, Finance-attested
// value number, and how do we reuse context and assets across a whole portfolio
// instead of rebuilding from zero each time?"
//
// The operating model this expert encodes has five capability areas working as
// one loop: (1) business-process mapping & reengineering (you cannot redesign
// what you have not mapped); (2) a reusable enterprise context layer (the
// shared asset that makes the second initiative cheaper than the first); (3)
// governed / responsible AI by design (guardrails built in, not bolted on);
// (4) workforce economics & business case (the dual "estimate twice" / capacity
// math that produces an honest dollar number); and (5) a value control tower
// (every initiative baselined, tracked, and Finance-attested).
//
// Honesty doctrine, hard-wired. Value shows up five ways — faster-to-value,
// right-solution, lower-cost-via-reuse, failure-avoided, and adoption-built-in —
// and the two binding constraints are stated plainly everywhere: (a) the value
// number is only as good as FINANCE ATTESTATION rigor, and (b) adoption is
// VOLUNTARY and business-led — mandates fail. Value must be PER-INITIATIVE
// baselined; a blanket percentage applied across a portfolio is auto-rejected.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const valueOfficeAiEnablementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.value-office-ai-enablement",
    expertName: "Enterprise Value Office & AI Enablement Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "value-office-ai-enablement",
    scopeNote:
      "Horizontal across every function and industry: the disciplined operating " +
      "model for standing up and running an enterprise value / innovation / " +
      "AI-enablement office. Covers five linked capability areas — business-" +
      "process mapping & reengineering, a reusable enterprise context layer, " +
      "governed/responsible AI by design, workforce economics & business case " +
      "('estimate twice', capacity model), and a value control tower (baselined, " +
      "tracked, Finance-attested). Value is realized five ways: faster-to-value, " +
      "right-solution, lower-cost-via-reuse, failure-avoided, and adoption-built-" +
      "in. Binding constraints are made explicit — value is only as credible as " +
      "Finance attestation rigor, and adoption is voluntary/business-led " +
      "(mandates fail); value is always per-initiative baselined, never a blanket " +
      "percentage. Excludes function-specific operating depth (revenue cycle, " +
      "trading, merchandising, etc.) and the deep technical sourcing of the AI " +
      "platform stack — those are separate experts the value office orchestrates.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "idea_to_decision_time",
        name: "Idea-to-go/no-go decision time",
        definition:
          "Median elapsed time from a captured idea entering the intake funnel " +
          "to a recorded go/no-go (build, defer, or kill) decision at the value " +
          "office's first gate.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 14,
          high: 45,
          basis:
            "Triage-to-decision cadence in functioning innovation/value offices; " +
            "ad-hoc intake commonly runs to months with no recorded decision",
          label: "planning-range",
        },
        dataSource:
          "Value-office intake/portfolio system (idea register) timestamps from submission to gate decision",
        whyItMatters:
          "Faster-to-value starts at the front door. A long, opaque decision lag " +
          "is where most enterprise value leaks — good ideas stall and sponsors " +
          "lose belief in the office before a single solution ships.",
      },
      {
        key: "value_realized_attested",
        name: "Value realized & Finance-attested ($)",
        definition:
          "Cumulative benefit from shipped initiatives that Finance has formally " +
          "attested against a per-initiative baseline — net of haircuts — not the " +
          "claimed or projected number.",
        unit: "$ (annualized)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0.3,
          high: 0.7,
          basis:
            "Attested benefit as a fraction of originally projected benefit; the " +
            "gap between projected and Finance-signed value is large and normal",
          label: "planning-range",
        },
        dataSource:
          "Value control tower joined to Finance/FP&A attestation records and the P&L/cost baselines",
        whyItMatters:
          "The single number that makes the office credible. Attested value is the " +
          "only value a CFO will defend; projected value is a promise. The binding " +
          "constraint of the whole model is the rigor of this attestation.",
      },
      {
        key: "pct_initiatives_baselined",
        name: "% initiatives with a baselined value case",
        definition:
          "Share of in-flight and shipped initiatives that carry a per-initiative " +
          "value baseline (current-state cost/throughput measured before build) " +
          "rather than a blanket or assumed percentage.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 85,
          basis:
            "Baseline coverage in disciplined value offices; immature programs " +
            "rely on blanket assumptions and cannot baseline most initiatives",
          label: "planning-range",
        },
        dataSource:
          "Value control tower — count of initiatives with a recorded current-state baseline vs total initiatives",
        whyItMatters:
          "Per-initiative baselining is the non-negotiable that prevents a blanket " +
          "'AI gives 20%' fiction. Without it no value claim is attestable and the " +
          "control tower is reporting fantasy.",
      },
      {
        key: "shared_asset_reuse_rate",
        name: "Shared-asset reuse rate",
        definition:
          "Share of new initiatives that reuse at least one existing enterprise " +
          "asset (context-layer dataset, reference solution pattern, guardrail, " +
          "evaluation harness, or component) rather than building it from scratch.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis:
            "Reuse rates once a context layer and pattern library exist; greenfield " +
            "programs with no asset registry reuse almost nothing",
          label: "planning-range",
        },
        dataSource:
          "Asset/context-layer registry usage logs cross-referenced to the initiative portfolio",
        whyItMatters:
          "Lower-cost-via-reuse is the compounding return of a value office. Reuse " +
          "is what makes the second and tenth initiative cheaper than the first; a " +
          "flat reuse rate means the office is a project shop, not a platform.",
      },
      {
        key: "adoption_rate_shipped",
        name: "Adoption rate of shipped solutions",
        definition:
          "Share of intended users in the target business population who are " +
          "actively (habitually) using a shipped solution in the measurement " +
          "window — voluntary, business-led adoption, not provisioning.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Active-use rates for shipped enterprise solutions; voluntary adoption " +
            "stalls well below intended population without a change/adoption plan",
          label: "planning-range",
        },
        dataSource:
          "Solution usage telemetry joined to the intended-user population from the business case",
        whyItMatters:
          "Adoption-built-in is value or it is shelfware. Because adoption is " +
          "voluntary and business-led, a technically excellent solution nobody " +
          "uses realizes zero attestable value — this is where most projected " +
          "benefit silently evaporates.",
      },
      {
        key: "responsible_ai_compliance",
        name: "Responsible-AI compliance %",
        definition:
          "Share of in-scope AI initiatives that have passed the required " +
          "governance/responsible-AI controls (risk classification, data/IP " +
          "handling, evaluation, human-accountability, monitoring) at their gate.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Governance pass coverage in programs with a real gate; bolt-on " +
            "governance leaves a long tail of ungoverned initiatives",
          label: "planning-range",
        },
        dataSource:
          "Governance gate records / responsible-AI control checklist per initiative in the control tower",
        whyItMatters:
          "Governed-by-design is the failure-avoided lever and a license-to-operate " +
          "floor. An ungoverned initiative is a latent incident; compliance % is the " +
          "control tower's early-warning gauge before a model harms or a regulator does.",
      },
      {
        key: "portfolio_throughput",
        name: "Portfolio throughput (initiatives/quarter)",
        definition:
          "Number of initiatives that reach a defined milestone (shipped to " +
          "production, or cleanly killed at a gate) per quarter — the flow rate of " +
          "the whole value pipeline.",
        unit: "initiatives per quarter",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 3,
          high: 15,
          basis:
            "Quarterly throughput of a staffed value office with a reusable context " +
            "layer; bespoke programs sustain only a handful in flight",
          label: "planning-range",
        },
        dataSource:
          "Value control tower — count of initiatives crossing a terminal gate (ship or kill) per quarter",
        whyItMatters:
          "Throughput is the office's flywheel. Throughput rising while cost-per-build " +
          "falls is the signature of a working platform; throughput flat despite " +
          "headcount means the office is not compounding via reuse.",
      },
      {
        key: "cost_per_build",
        name: "Cost-per-build trend",
        definition:
          "Fully-loaded cost to take a comparable initiative from idea to " +
          "production, tracked over time — expected to DECLINE as the context " +
          "layer and reusable assets mature.",
        unit: "$ per comparable build (indexed, trend)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.4,
          high: 0.8,
          basis:
            "Cost of the Nth comparable build as a fraction of the first once reuse " +
            "compounds; no reuse leaves cost-per-build flat",
          label: "planning-range",
        },
        dataSource:
          "Initiative cost ledger (effort + platform + vendor) normalized to comparable build complexity, trended over time",
        whyItMatters:
          "The direct readout of the reuse thesis. A declining cost-per-build curve " +
          "is the financial proof that the context layer and pattern library are " +
          "real assets; a flat curve says the office is rebuilding every time.",
      },
      {
        key: "failure_avoided_rate",
        name: "Failure-avoided rate (killed before build)",
        definition:
          "Share of ideas/initiatives that are deliberately stopped at an early " +
          "gate (no-build, defer, or kill) before significant build spend is " +
          "committed — disciplined attrition, not project failure.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Early-gate kill rates in disciplined portfolios; healthy funnels stop " +
            "the majority of ideas before build, low-discipline funnels build most",
          label: "planning-range",
        },
        dataSource:
          "Gate decision log — early no-build/kill decisions as a share of all gated ideas",
        whyItMatters:
          "Failure-avoided is real, bankable value: money not spent on the wrong " +
          "solution. A near-zero kill rate is a red flag — it means the office " +
          "builds whatever is asked rather than backing only what will land.",
      },
      {
        key: "idea_to_deploy_cycle_time",
        name: "Idea-to-deploy cycle time",
        definition:
          "Median end-to-end elapsed time from an approved (go) idea to a " +
          "solution running in production with real users — the build/ship leg of " +
          "the funnel after the decision gate.",
        unit: "weeks",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 6,
          high: 20,
          basis:
            "Idea-to-production cycle once a context layer and patterns exist; " +
            "greenfield, ungoverned builds run far longer with rework",
          label: "planning-range",
        },
        dataSource:
          "Portfolio/delivery system timestamps from go-decision to production go-live",
        whyItMatters:
          "The core faster-to-value measure on the build leg. Reuse and governed-" +
          "by-design templates compress this directly; a long cycle erodes sponsor " +
          "belief and lets the business case decay before value lands.",
      },
      {
        key: "pct_initiatives_with_adoption_plan",
        name: "% initiatives with a change/adoption plan",
        definition:
          "Share of in-flight and shipped initiatives that carry an explicit " +
          "change-management / adoption plan (named business owner, target " +
          "population, enablement, and an adoption metric) at build approval.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Adoption-plan coverage in offices that treat adoption as a deliverable; " +
            "tech-led programs routinely ship with no adoption plan at all",
          label: "planning-range",
        },
        dataSource:
          "Value control tower — count of initiatives with a recorded adoption/change plan vs total",
        whyItMatters:
          "Because adoption is voluntary and business-led, an initiative with no " +
          "adoption plan is betting on luck. This metric is the lead indicator for " +
          "adoption_rate_shipped and the antidote to 'we built it, why won't they use it'.",
      },
    ],

    painThemes: [
      {
        key: "value_office_as_demo_factory",
        name: "Value office as a demo factory",
        description:
          "The office produces a stream of slick proofs-of-concept that impress " +
          "in the room but never reach production or a Finance-attested number — " +
          "innovation theater dressed as a value program.",
        detectionSignal:
          "Many POCs and showcase decks, almost no production deployments; no " +
          "attested value line; the office reports activity (demos run) not outcomes.",
        diagnosticQuestion:
          "Of everything the office has produced, how many initiatives are in " +
          "production with a Finance-attested value number — and how many are demos?",
      },
      {
        key: "blanket_percentage_value",
        name: "Blanket-percentage value claims",
        description:
          "Benefit is sized by applying a flat assumption ('AI saves 20%') across " +
          "a function or the portfolio, with no per-initiative current-state " +
          "baseline — a number Finance will never sign and the CFO already distrusts.",
        detectionSignal:
          "Value cases share one headline percentage; no per-initiative baseline; " +
          "FP&A cannot reconcile any claimed saving to a cost line or the P&L.",
        diagnosticQuestion:
          "For each value claim, is there a measured current-state baseline for THAT " +
          "initiative, or is the number a blanket percentage applied across many?",
      },
      {
        key: "rebuild_every_time",
        name: "Rebuild-every-time (no reuse)",
        description:
          "Each initiative re-solves data access, prompts, guardrails, and " +
          "evaluation from scratch because there is no shared context layer or " +
          "asset registry — cost-per-build stays flat and the office never compounds.",
        detectionSignal:
          "Low shared-asset reuse rate; flat cost-per-build curve; the same " +
          "datasets, guardrails, and patterns rebuilt under different project names.",
        diagnosticQuestion:
          "What share of a new initiative is reused from existing enterprise assets, " +
          "and is your cost-per-build for comparable work falling over time?",
      },
      {
        key: "adoption_by_mandate",
        name: "Adoption-by-mandate (push, not pull)",
        description:
          "Leadership decrees that the business will use the new solution; because " +
          "adoption is actually voluntary, users route around it, revert to old " +
          "workflows, or comply minimally — and projected value never materializes.",
        detectionSignal:
          "Top-down rollout with no named business owner or adoption plan; usage " +
          "spikes at launch then collapses; shadow workarounds; low active-use rate.",
        diagnosticQuestion:
          "Who in the business owns adoption of this solution, what is the adoption " +
          "plan, and is uptake being pulled by users or pushed by a mandate?",
      },
      {
        key: "governance_bolted_on",
        name: "Governance bolted on at the end",
        description:
          "Responsible-AI controls are treated as a final compliance hurdle rather " +
          "than designed in — so initiatives reach the gate and stall, get reworked, " +
          "or ship with ungoverned risk that surfaces later as an incident.",
        detectionSignal:
          "Governance review happens just before launch; high late-stage rework; a " +
          "tail of shipped initiatives with incomplete responsible-AI controls.",
        diagnosticQuestion:
          "At what stage do responsible-AI controls enter an initiative — designed " +
          "in from intake, or checked at the end as a launch gate?",
      },
      {
        key: "no_attribution_to_finance",
        name: "No bridge from claim to Finance",
        description:
          "The office tracks its own benefit numbers in isolation; Finance was " +
          "never engaged to define the baseline or attest the realized value, so " +
          "every number is contested and none lands in the P&L the CFO defends.",
        detectionSignal:
          "Value reported only in the office's own dashboard; no Finance attestation " +
          "records; projected-to-attested gap is unknown because attestation never runs.",
        diagnosticQuestion:
          "Has Finance defined the baseline and signed off the realized value for " +
          "your shipped initiatives — and what is the projected-to-attested gap?",
      },
      {
        key: "idea_intake_chaos",
        name: "Idea intake chaos / shadow demand",
        description:
          "Ideas arrive through back channels, executive pet projects, and vendor " +
          "pitches with no single intake, no triage criteria, and no recorded " +
          "decision — so the portfolio is whoever-shouted-loudest, not value-ranked.",
        detectionSignal:
          "No single idea register; long idea-to-decision time; initiatives appear " +
          "in build with no recorded go decision; sponsors bypass the funnel.",
        diagnosticQuestion:
          "Is there one intake and one set of triage criteria for ideas, and can you " +
          "see, for any initiative, when and why it received a go/no-go decision?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "idea_intake_triage_copilot",
        name: "Idea intake & triage copilot",
        valueMechanism:
          "A structured intake assistant that captures ideas in one register, " +
          "drafts a first-pass value hypothesis and risk classification, checks " +
          "for duplicates against the existing portfolio, and routes each idea to " +
          "the right gate — cutting idea-to-decision time and killing the " +
          "intake-chaos pattern so good ideas surface fast and weak ones get a " +
          "recorded no early.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Single idea register / intake system as the system of record",
          "Existing portfolio and reusable-asset registry for duplicate checks",
          "Triage criteria and gate definitions encoded as structured rules",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "The copilot drafts the hypothesis and routing; the human gate owner makes the go/no-go",
          "Do not let an AI-drafted value hypothesis become the baseline — it must be Finance-validated before any claim",
        ],
        metricsMoved: [
          "idea_to_decision_time",
          "portfolio_throughput",
          "failure_avoided_rate",
        ],
      },
      {
        key: "process_mapping_assistant",
        name: "Business-process mapping & reengineering assistant",
        valueMechanism:
          "An assistant that ingests SOPs, system logs, and interviews to draft " +
          "current-state process maps, surface the steps and hand-offs that carry " +
          "cost and rework, and propose reengineered human+agent flows — producing " +
          "the current-state baseline and target design that every honest value " +
          "case and right-solution decision depends on.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Process documentation, SOPs, and (where available) process-mining/event logs",
          "Cost and volume data per process step for baselining",
          "Subject-matter input to validate the drafted map",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A drafted process map is a hypothesis — process owners must validate before it baselines a value case",
          "Reengineering proposals change real work; humans own the redesign decision and its workforce impact",
        ],
        metricsMoved: [
          "pct_initiatives_baselined",
          "idea_to_deploy_cycle_time",
          "shared_asset_reuse_rate",
        ],
      },
      {
        key: "reusable_context_retrieval",
        name: "Reusable enterprise context layer (retrieval & assets)",
        valueMechanism:
          "A governed, access-controlled context layer — curated datasets, " +
          "reference patterns, guardrails, and evaluation harnesses — that new " +
          "initiatives retrieve and reuse instead of rebuilding, with usage tracked. " +
          "This is the compounding asset: each reuse lowers cost-per-build and " +
          "raises throughput, turning the office from a project shop into a platform.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Curated context corpus with freshness, lineage, and access entitlements",
          "Asset/pattern registry with reuse tagging and usage logging",
          "Entitlements model so retrieval respects who-can-see-what",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Stale or over-broad context produces confident-wrong reuse — govern freshness and access",
          "Reused assets carry inherited risk; each reuse must re-pass governance for its new context",
        ],
        metricsMoved: [
          "shared_asset_reuse_rate",
          "cost_per_build",
          "portfolio_throughput",
        ],
      },
      {
        key: "value_attestation_assistant",
        name: "Value baselining & Finance-attestation assistant",
        valueMechanism:
          "An assistant that helps construct a per-initiative current-state " +
          "baseline, assemble the benefit case with explicit haircuts, and package " +
          "the evidence Finance needs to attest realized value against that baseline " +
          "— closing the no-bridge-to-Finance gap and replacing blanket-percentage " +
          "claims with attestable, defensible numbers.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Per-initiative current-state baselines (cost, throughput, quality)",
          "Realized post-deployment metrics and the haircut factors",
          "Finance/FP&A definitions of the baseline and attestation criteria",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Finance, not the assistant, attests value — the assistant assembles evidence, the controller signs",
          "Never present an AI-assembled benefit as attested until Finance has formally signed against the baseline",
        ],
        metricsMoved: [
          "value_realized_attested",
          "pct_initiatives_baselined",
          "failure_avoided_rate",
        ],
      },
      {
        key: "governance_by_design_gate",
        name: "Governed/responsible-AI-by-design gate assistant",
        valueMechanism:
          "An assistant embedded at every gate that classifies initiative risk, " +
          "checks data/IP handling, requires an evaluation and a named human " +
          "accountability point, and flags missing controls early — making " +
          "responsible AI a design-time default rather than a launch-time hurdle, " +
          "which avoids late rework and latent-incident failure.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Responsible-AI control checklist and risk-classification taxonomy",
          "Initiative metadata (data sources, model use, user population, decision impact)",
          "Evaluation/monitoring results per initiative",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "The gate assistant flags and classifies; an accountable human approves the governance pass",
          "Automated checks are necessary, not sufficient — high-impact initiatives need explicit human review",
        ],
        metricsMoved: [
          "responsible_ai_compliance",
          "idea_to_deploy_cycle_time",
          "failure_avoided_rate",
        ],
      },
      {
        key: "adoption_change_companion",
        name: "Adoption & change companion",
        valueMechanism:
          "A companion that builds the change/adoption plan for each shipped " +
          "solution — target population, enablement, in-flow nudges, and an " +
          "adoption metric with a named business owner — and tracks uptake against " +
          "it, converting voluntary, business-led adoption into realized value " +
          "instead of leaving solutions as shelfware after a mandated launch.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Intended-user population from the business case",
          "Solution usage telemetry for adoption tracking",
          "Named business owner and enablement content per initiative",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Adoption cannot be mandated by the tool — the business owner drives pull; the companion supports it",
          "Adoption telemetry is monitoring-sensitive; respect consent/notice for usage measurement",
        ],
        metricsMoved: [
          "adoption_rate_shipped",
          "pct_initiatives_with_adoption_plan",
          "value_realized_attested",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "idea_to_value_funnel",
        name: "Idea-to-value funnel with decision gates",
        description:
          "A single intake and a staged funnel (capture → triage → discovery → " +
          "build → ship → attest) where every stage transition is a recorded " +
          "go/no-go gate with explicit criteria. Disciplined early kills are " +
          "treated as bankable failure-avoided value, and nothing reaches build " +
          "without a recorded decision and an owner.",
        boundary:
          "Owns the funnel, the gate criteria, and the decision record; does not " +
          "own the build delivery itself or the function's operating decisions — it " +
          "governs which ideas earn investment, not how each function runs.",
        humanAccountabilityPoint:
          "Head of the Value/Innovation Office (gate owner, jointly with the executive sponsor for major gates)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "reusable_context_platform",
        name: "Reusable enterprise context & asset platform",
        description:
          "A governed, access-controlled platform of curated context (datasets, " +
          "lineage, entitlements) plus a registry of reusable assets — reference " +
          "solution patterns, guardrails, prompts, evaluation harnesses, and " +
          "components — that every initiative retrieves from and contributes back " +
          "to. The compounding asset that drives reuse rate up and cost-per-build down.",
        boundary:
          "Owns curation, entitlements, the asset registry, and reuse measurement; " +
          "does not own the source systems of record or the function-specific data " +
          "those systems govern — it federates and curates, it does not replace.",
        humanAccountabilityPoint:
          "Chief Data/AI Officer (platform owner) with data stewards per domain",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "value_control_tower",
        name: "Value control tower (baselined, tracked, attested)",
        description:
          "A single portfolio view where every initiative carries a per-initiative " +
          "current-state baseline, projected and realized benefit, governance " +
          "status, adoption status, and a Finance attestation state. It is the " +
          "office's source of truth for the projected-to-attested gap and the " +
          "instrument that keeps value honest across the whole portfolio.",
        boundary:
          "Owns portfolio tracking, baselines, and the attestation workflow; does " +
          "not own the attestation decision itself (Finance signs) nor the build — " +
          "it is the system of record for value, not the system that produces it.",
        humanAccountabilityPoint:
          "Value Office lead jointly with Finance/FP&A controller (who attests)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "process_reengineering_method",
        name: "Business-process mapping & reengineering method",
        description:
          "A repeatable method to map a current-state process to task level, " +
          "measure its cost/throughput/quality baseline, and design a reengineered " +
          "human+agent target flow — supplying both the baseline a value case needs " +
          "and the right-solution design that prevents automating a broken process.",
        boundary:
          "Owns the current- and target-state process design and its baseline; does " +
          "not own the workforce/headcount decision that may follow the redesign " +
          "(that is a leadership/HR call against the design's capacity output).",
        humanAccountabilityPoint:
          "Process owner (function leader) with the value office's process lead",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "responsible_ai_by_design",
        name: "Governed / responsible-AI-by-design framework",
        description:
          "A control framework woven through every gate — risk classification, " +
          "data/IP handling, evaluation, human accountability, and monitoring — so " +
          "responsible AI is the default design posture, not a final hurdle. Closes " +
          "the governance-bolted-on gap and is the structural source of " +
          "failure-avoided value and license-to-operate.",
        boundary:
          "Owns the responsible-AI controls, the gate checks, and monitoring " +
          "standards; does not own enterprise security certification or legal " +
          "regulatory sign-off (separate functions it coordinates with).",
        humanAccountabilityPoint:
          "Chief AI Officer / responsible-AI lead (with Legal & Risk on high-impact initiatives)",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
      {
        key: "adoption_change_engine",
        name: "Adoption & change engine (voluntary, business-led)",
        description:
          "A standing capability that attaches a change/adoption plan to every " +
          "shipped solution — named business owner, target population, enablement, " +
          "in-flow nudges, and an adoption metric — and treats adoption as a " +
          "deliverable. Built on the honest premise that adoption is voluntary and " +
          "business-led, so it engineers pull rather than relying on a mandate.",
        boundary:
          "Owns the adoption method, enablement, and adoption measurement; does not " +
          "own the business unit's operating choices or the line-manager incentives " +
          "that ultimately drive pull — it equips and measures, it cannot mandate.",
        humanAccountabilityPoint:
          "Business owner of the solution (in the adopting function), supported by the office's adoption lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "A value office realizes value FIVE ways, and each must be measured " +
        "separately and per-initiative: (1) FASTER-TO-VALUE — a disciplined " +
        "funnel and reusable assets compress idea-to-decision and idea-to-deploy " +
        "time; (2) RIGHT-SOLUTION — process mapping and gated discovery stop the " +
        "firm from building (or automating) the wrong thing; (3) LOWER-COST-VIA-" +
        "REUSE — a shared context layer and asset registry drive cost-per-build " +
        "down as the portfolio compounds; (4) FAILURE-AVOIDED — early kills and " +
        "governed-by-design controls turn money-not-spent and incidents-not-" +
        "suffered into bankable value; (5) ADOPTION-BUILT-IN — change plans " +
        "convert shipped solutions into used solutions. The chain to a real " +
        "dollar runs: per-initiative current-state baseline → projected benefit " +
        "with explicit haircuts → realized post-deployment metrics → FINANCE " +
        "ATTESTATION against the baseline. Two binding constraints are non-" +
        "negotiable and stated plainly: the value number is only as credible as " +
        "Finance-attestation rigor, and adoption is voluntary/business-led so a " +
        "mandate-driven number is fiction. Value is ALWAYS per-initiative " +
        "baselined; a blanket percentage applied across the portfolio is rejected.",
      dominantHaircutFactors: [
        {
          factor: "Adoption shortfall (voluntary, not mandated)",
          rationale:
            "Because adoption is business-led and voluntary, much projected benefit " +
            "never lands — solutions ship to a target population that only partly " +
            "adopts, and unused capability realizes nothing.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Gap between intended and active-user populations for shipped enterprise solutions without a strong adoption plan",
            label: "planning-range",
          },
        },
        {
          factor: "Attestation discount (projected vs Finance-signed)",
          rationale:
            "Finance discounts or rejects benefit that lacks a clean baseline, a " +
            "counterfactual, or a P&L line — the gap between the office's projected " +
            "number and the controller's attested number is large and routine.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Projected-to-attested gap observed where baselines and counterfactuals were weak",
            label: "planning-range",
          },
        },
        {
          factor: "Baseline / attribution uncertainty",
          rationale:
            "Without a per-initiative current-state baseline and isolation from " +
            "concurrent changes, part of any measured gain is not the initiative's " +
            "and must be discounted before it can be attested.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no measured baseline or matched comparison isolates the initiative's contribution",
            label: "planning-range",
          },
        },
        {
          factor: "Reuse / scaling shortfall",
          rationale:
            "Lower-cost-via-reuse only materializes if assets are genuinely " +
            "reusable and reused; immature context layers force partial rebuilds, " +
            "so the projected reuse saving is only partly realized early.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Shortfall between projected and realized reuse savings while the context layer and asset registry are still maturing",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Cost-per-build reduction via reuse",
          range: {
            low: 0.2,
            high: 0.6,
            basis:
              "Reduction in fully-loaded cost of the Nth comparable build once a context layer and pattern library are in use",
            label: "planning-range",
          },
          measuredAs:
            "Relative decline in cost_per_build for comparable initiatives as shared_asset_reuse_rate rises",
        },
        {
          lever: "Faster-to-value (idea-to-deploy compression)",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Compression of idea-to-deploy cycle time from governed templates and reusable assets vs greenfield builds",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in idea_to_deploy_cycle_time for initiatives using reusable assets and gated discovery",
        },
        {
          lever: "Failure-avoided (early-kill spend avoidance)",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Share of ideas stopped at an early gate before build spend in a disciplined funnel — money not spent on the wrong solution",
            label: "planning-range",
          },
          measuredAs:
            "failure_avoided_rate — early no-build/kill decisions as a share of gated ideas, valued as avoided build spend",
        },
      ],
      timeToValueBand:
        "Funnel, gates, and first attested value on early initiatives: 2-3 " +
        "quarters once a single intake and a Finance-defined baseline exist. The " +
        "reuse/context-layer flywheel (declining cost-per-build, rising throughput): " +
        "3-6+ quarters, because reuse only compounds after a few initiatives have " +
        "contributed assets. Governed-by-design and the adoption engine become " +
        "default posture over 2-4 quarters per wave. The honest framing: faster-to-" +
        "value and failure-avoided show first; lower-cost-via-reuse is the slowest " +
        "but most compounding return.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Value / portfolio management system",
          role: "The idea register, gate decision log, and portfolio of initiatives — the value office's primary system of record.",
          examples: ["Planview", "ServiceNow SPM", "Jira Align", "Airtable/portfolio tooling"],
        },
        {
          name: "Finance / FP&A & ERP",
          role: "Holds the cost baselines and the P&L the value number must reconcile to, and where attestation is recorded.",
          examples: ["SAP", "Oracle Fusion", "Workday Financials", "Anaplan / FP&A tooling"],
        },
        {
          name: "Enterprise context & data platform",
          role: "The reusable context layer — curated datasets, lineage, entitlements — and the asset/pattern registry.",
          examples: ["Databricks / Microsoft Fabric", "Snowflake", "Collibra (catalog/lineage)", "internal asset registry"],
        },
        {
          name: "Process intelligence / mapping",
          role: "Source for current-state process maps and baselines (mining, modeling) feeding reengineering and value cases.",
          examples: ["Celonis", "Signavio", "UiPath Process Mining", "Microsoft Process Insights"],
        },
        {
          name: "AI governance / model registry",
          role: "System of record for responsible-AI controls, risk classification, evaluation, and monitoring per initiative.",
          examples: ["Azure AI / model registry", "Credo AI", "IBM watsonx.governance", "MLflow registry"],
        },
        {
          name: "Adoption / usage telemetry",
          role: "Measures active use of shipped solutions against the intended population — the adoption-built-in signal.",
          examples: ["Product analytics (Pendo, Amplitude)", "M365/Workspace usage", "solution-embedded telemetry"],
        },
      ],
      roles: [
        {
          title: "Head of the Value / Innovation Office",
          accountability:
            "The end-to-end operating model — intake funnel, gates, portfolio throughput, and the office's credibility on attested value.",
        },
        {
          title: "Chief Financial Officer / FP&A controller",
          accountability:
            "Defines per-initiative baselines and ATTESTS realized value — the binding constraint and the office's credibility anchor.",
        },
        {
          title: "Chief AI Officer / Responsible-AI lead",
          accountability:
            "Governed/responsible-AI-by-design controls at every gate, risk classification, evaluation, and monitoring.",
        },
        {
          title: "Chief Data Officer / Context-platform owner",
          accountability:
            "The reusable enterprise context layer and asset registry — curation, entitlements, lineage, and reuse measurement.",
        },
        {
          title: "Business owner (adopting function)",
          accountability:
            "Voluntary, business-led adoption of shipped solutions and reinvestment of the value into the function.",
        },
        {
          title: "Process owner / reengineering lead",
          accountability:
            "Current- and target-state process design and the per-initiative baseline that grounds the value case.",
        },
      ],
      regulatoryFrames: [
        {
          name: "AI governance frameworks (EU AI Act, NIST AI RMF, ISO/IEC 42001)",
          relevance:
            "Shape risk classification, evaluation, transparency, and human-accountability requirements that the governed-by-design gate enforces.",
        },
        {
          name: "Financial controls & SOX (attestation integrity)",
          relevance:
            "Value attested into the P&L must withstand financial-control scrutiny; baselines and benefit recognition follow Finance controls discipline.",
        },
        {
          name: "Data privacy & IP handling (GDPR / CCPA and equivalents)",
          relevance:
            "Governs data flowing through the context layer and AI initiatives, and the IP/licensing posture of reused assets and model outputs.",
        },
        {
          name: "Sector-specific regulation (where the enterprise operates)",
          relevance:
            "Industry rules (financial, health, etc.) constrain which use cases are permissible and what governance evidence each gate requires.",
        },
      ],
      canonicalTerms: [
        {
          term: "Value office / value control tower",
          definition:
            "The enterprise capability (and its portfolio system of record) that turns ideas into governed solutions with a baselined, tracked, Finance-attested value number.",
        },
        {
          term: "Per-initiative baseline",
          definition:
            "A measured current-state cost/throughput/quality for THAT specific initiative, established before build — the non-negotiable basis for any attestable value claim.",
        },
        {
          term: "Finance attestation",
          definition:
            "Formal Finance/FP&A sign-off that realized benefit is genuine against the baseline and reconciled to the P&L — the only value the CFO will defend.",
        },
        {
          term: "Reusable context layer",
          definition:
            "A governed, access-controlled body of curated context and reusable assets (patterns, guardrails, evaluations) that initiatives retrieve and reuse, lowering cost-per-build.",
        },
        {
          term: "Governed / responsible-AI by design",
          definition:
            "Building risk classification, data/IP handling, evaluation, human accountability, and monitoring into every gate from intake — not bolting compliance on at launch.",
        },
        {
          term: "The five value mechanisms",
          definition:
            "Faster-to-value, right-solution, lower-cost-via-reuse, failure-avoided, and adoption-built-in — the five distinct, separately-measured ways a value office creates value.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Value realized / Finance-attested",
        authoritativeSource:
          "Finance/FP&A attestation records reconciled to the P&L against a per-initiative current-state baseline",
        whatGoodEvidenceLooksLike:
          "A measured baseline, realized post-deployment metrics net of haircuts, and a controller's formal sign-off tying the benefit to a cost line.",
        weakEvidenceToReject:
          "A blanket percentage ('AI saves 20%') applied across initiatives, or a benefit number the office reports with no Finance attestation.",
      },
      {
        claim: "Cost-per-build reduction via reuse",
        authoritativeSource:
          "Initiative cost ledger normalized to comparable build complexity, trended over time alongside the asset-reuse registry",
        whatGoodEvidenceLooksLike:
          "A declining cost-per-build curve for comparable builds, with the specific reused assets named and reuse rising over the same period.",
        weakEvidenceToReject:
          "An assertion that 'reuse saves money' with no cost trend, no comparability normalization, and no reuse tracking.",
      },
      {
        claim: "Adoption of a shipped solution",
        authoritativeSource:
          "Solution usage telemetry joined to the intended-user population defined in the business case",
        whatGoodEvidenceLooksLike:
          "Active (habitual) usage by the target population over time, with a named business owner and an adoption plan in place.",
        weakEvidenceToReject:
          "Provisioned/licensed counts, launch-week spikes, or a mandate cited as evidence of adoption.",
      },
      {
        claim: "Failure-avoided value",
        authoritativeSource:
          "Gate decision log of early no-build/kill decisions with the avoided build spend each represents",
        whatGoodEvidenceLooksLike:
          "Recorded early kills with the estimated build cost that was not incurred, traceable to a gate criterion and a decision owner.",
        weakEvidenceToReject:
          "A claimed 'avoided cost' with no recorded decision, no gate, and no estimate of what the build would have cost.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "How many of the office's initiatives are in production with a Finance-attested value number — and what is your projected-to-attested gap?",
      "For each value claim, is there a per-initiative current-state baseline, or is the number a blanket percentage applied across many initiatives?",
      "What share of a new initiative is reused from existing enterprise assets, and is your cost-per-build for comparable work falling over time?",
      "Who in the business owns adoption of each shipped solution, and is uptake being pulled by users or pushed by a mandate?",
      "At what stage do responsible-AI controls enter an initiative — designed in from intake, or checked at the end as a launch gate?",
      "Is there one intake and one set of triage criteria, and can you see when and why any initiative received a go/no-go decision?",
      "Has Finance defined the baseline and signed off realized value for shipped initiatives, or does the office track value in isolation?",
      "How do you measure the five value mechanisms separately — faster-to-value, right-solution, lower-cost-via-reuse, failure-avoided, adoption-built-in?",
    ],
    maturitySignals: [
      "Every initiative carries a per-initiative current-state baseline before build, and value is never a blanket percentage.",
      "Finance defines the baseline and formally attests realized value; the projected-to-attested gap is tracked openly.",
      "A reusable context layer and asset registry exist, reuse rate is measured, and cost-per-build is trending down as throughput rises.",
      "Responsible-AI controls are designed in at every gate, and a healthy share of ideas are killed early (failure-avoided) rather than all built.",
      "Every shipped solution has a named business owner and an adoption plan; adoption is engineered as pull, not decreed as a mandate.",
    ],
    redFlags: [
      "Value is reported as a blanket percentage across the portfolio with no per-initiative baseline Finance will sign.",
      "A stream of POCs and demos, almost nothing in production with an attested number — innovation theater.",
      "Flat cost-per-build and near-zero reuse: every initiative re-solves data, prompts, and guardrails from scratch.",
      "Solutions are launched by mandate with no named business owner or adoption plan, and active use collapses after launch.",
      "Governance is a last-minute launch hurdle, producing late rework or a tail of ungoverned, shipped initiatives.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Portfolio / value-management platforms (Planview, ServiceNow SPM, Jira Align)",
        category: "Idea intake, gates, and portfolio/value tracking — the control tower spine",
        switchingCost:
          "High — the office's process, gates, and historical decision record live here; migrating means re-implementing the operating model.",
        renewalDynamics:
          "Per-seat/module enterprise agreements; the negotiation is module right-sizing and avoiding paying for a heavyweight PPM the office does not use.",
      },
      {
        vendorName: "Process intelligence (Celonis, Signavio, UiPath Process Mining)",
        category: "Current-state process mapping and baselining for reengineering and value cases",
        switchingCost:
          "Moderate-to-high — connectors and mined models embed deeply; the asset is the modeled processes, which are hard to re-derive.",
        renewalDynamics:
          "Consumption/connector-based pricing that can scale unexpectedly; negotiate scope, data volume, and outcome-tied terms.",
      },
      {
        vendorName: "Enterprise data/context platforms (Databricks, Snowflake, Microsoft Fabric)",
        category: "The reusable context layer and asset platform substrate",
        switchingCost:
          "High — data gravity, pipelines, and entitlements concentrate here; the context layer is the office's compounding asset and is costly to move.",
        renewalDynamics:
          "Consumption-based; favor consumption transparency, governance/lineage native support, and avoiding lock-in around the asset registry.",
      },
      {
        vendorName: "AI governance / responsible-AI tooling (Credo AI, IBM watsonx.governance, native cloud)",
        category: "Responsible-AI controls, model registry, risk classification, monitoring",
        switchingCost:
          "Moderate — control definitions and evidence accumulate, but standards (NIST/EU AI Act) are portable; lock-in is the evidence corpus.",
        renewalDynamics:
          "Fast-moving, consolidating market; favor standards-aligned tooling, exportable evidence, and outcome-based terms over multi-year lock-in.",
      },
      {
        vendorName: "Innovation / transformation advisory & change partners",
        category: "Operating-model setup, reengineering, and adoption/change services",
        switchingCost:
          "Low — services are re-sourceable; the lasting asset is the internal method, playbooks, and adoption capability they transfer in-house.",
        renewalDynamics:
          "Scope-and-outcome based; structure to build internal capability and asset reuse rather than create a standing advisory dependency.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the reusable context/data platform (data gravity, " +
      "entitlements, the asset registry) and the portfolio/value system that holds " +
      "the gate and decision record — these ARE the compounding assets, so the " +
      "negotiating posture is consumption transparency, exportable evidence/assets, " +
      "and standards alignment, while keeping advisory and point tooling re-sourceable.",
    negotiationLevers: [
      "Right-size portfolio/PPM modules to the office's actual operating model — don't buy heavyweight PPM the office won't use",
      "Consumption transparency and exit/export rights on the context platform and asset registry (protect the compounding asset)",
      "Standards-aligned, evidence-exportable governance tooling to avoid lock-in around the responsible-AI evidence corpus",
      "Outcome/usage-based terms tied to measured adoption and attested value where vendors will offer them",
      "Structure advisory engagements to transfer method and reusable assets in-house, not to create a standing dependency",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      value_attestation: [
        "per-initiative current-state baseline",
        "realized post-deployment metrics net of haircuts",
        "Finance/FP&A formal attestation reconciled to the P&L",
      ],
      value_projection: [
        "per-initiative baseline",
        "labelled planning-range benchmark",
        "explicit haircut factors (adoption, attestation, baseline/attribution, reuse shortfall)",
      ],
      reuse_claim: [
        "asset-reuse registry usage log",
        "cost-per-build trend normalized to comparable complexity",
      ],
      adoption_claim: [
        "solution usage telemetry",
        "intended-user population from the business case",
        "named business owner and adoption plan",
      ],
      failure_avoided_claim: [
        "gate decision log of early no-build/kill",
        "estimated avoided build spend per decision",
      ],
      governance_claim: [
        "responsible-AI control checklist per initiative",
        "risk classification and evaluation/monitoring results",
      ],
    },
    citationStandard:
      "Every value claim cites whether it is PROJECTED or FINANCE-ATTESTED, the " +
      "per-initiative baseline it rests on, and the period. Projected value cites a " +
      "labelled planning range plus the haircut factors applied (adoption shortfall, " +
      "attestation discount, baseline/attribution, reuse shortfall) — never a single " +
      "asserted ROI and never a blanket percentage applied across initiatives. Reuse, " +
      "adoption, and failure-avoided claims cite their respective system of record " +
      "(asset registry, usage telemetry + business case, gate decision log).",
  },

  hedgeRules: {
    whenToHedge: [
      "No per-initiative baseline exists — frame benefit as an industry planning range, never a tenant-specific dollar figure.",
      "Value has not been Finance-attested — present it as projected, and flag the typical projected-to-attested gap.",
      "Adoption is assumed or mandated rather than measured — frame realized value as contingent on voluntary, business-led uptake.",
      "Reuse savings are claimed before the context layer is mature — present cost-per-build reduction as a forward planning range, not realized.",
      "Vendor-reported value-office or productivity outcomes are cited — mark as vendor claims pending tenant validation.",
    ],
    inferenceLanguage: [
      "Across enterprise value offices, the projected-to-attested value gap typically runs...",
      "Without a per-initiative baseline, the industry pattern suggests benefit of...",
      "Peer programs at this maturity commonly see cost-per-build decline of... as reuse compounds.",
      "This is a projected figure; it becomes value only once Finance attests it against a baseline.",
    ],
    flagWithoutEvidence: [
      "A specific attested dollar value for this tenant's portfolio",
      "This tenant's actual cost-per-build trend or shared-asset reuse rate",
      "A claim that a shipped solution here has been adopted by its target population",
      "A blanket percentage benefit applied across this tenant's initiatives",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "value bridge / projected to Finance-attested value",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from projected benefit through each haircut (adoption, attestation, baseline, reuse shortfall) to Finance-attested value.",
    },
    {
      questionPattern: "idea-to-value funnel / how many ideas survive each gate",
      exhibitKind: "chart",
      chartKind: "waterfall",
      chartBuilder: "waterfall",
      note: "Funnel/waterfall of ideas captured → triaged → built → shipped → attested, exposing failure-avoided (early kills) at each gate.",
    },
    {
      questionPattern: "cost-per-build trend as reuse compounds",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend cost-per-build for comparable initiatives against rising shared-asset reuse rate over time.",
    },
    {
      questionPattern: "which haircut bites hardest on value (sensitivity)",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of adoption shortfall, attestation discount, baseline/attribution, and reuse shortfall on realized value.",
    },
    {
      questionPattern: "value office scorecard",
      exhibitKind: "table",
      note: "Idea-to-decision time, attested value, % baselined, reuse rate, adoption rate, responsible-AI compliance, throughput, cost-per-build, failure-avoided, idea-to-deploy, % with adoption plan vs planning ranges.",
    },
    {
      questionPattern: "portfolio value by initiative / where attested value sits",
      exhibitKind: "chart",
      chartKind: "bar",
      chartBuilder: "bar",
      note: "Attested vs projected value by initiative, sorted, to show the portfolio's real value concentration and gaps.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Every initiative is per-initiative baselined and Finance defines the baseline and attests realized value",
      "A reusable context layer and asset registry exist so reuse compounds and cost-per-build trends down",
      "Responsible-AI controls are designed in at every gate, and the funnel kills weak ideas early (failure-avoided)",
      "Adoption is engineered as voluntary, business-led pull — every shipped solution has a named owner and adoption plan",
      "All five value mechanisms are measured separately and a single value control tower holds the honest portfolio view",
    ],
    failureDrivers: [
      "Blanket-percentage value claims with no per-initiative baseline that Finance will never attest",
      "A demo factory: many POCs, little in production, no attested value, and innovation theater for stakeholders",
      "Rebuild-every-time with no reuse — flat cost-per-build and an office that never compounds into a platform",
      "Adoption by mandate: solutions pushed top-down with no adoption plan, used briefly then abandoned",
      "Governance bolted on at the end, causing late rework or a tail of ungoverned shipped initiatives",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Early wins come from the funnel and failure-avoided gates (visible fast) " +
      "and from a few lighthouse initiatives that earn Finance attestation and " +
      "build credibility. The reuse flywheel adopts more slowly — it needs a few " +
      "initiatives to contribute assets before reuse compounds. Business adoption " +
      "of shipped solutions is the hardest leg precisely because it is voluntary: " +
      "functions pull when an owner and adoption plan make the solution the path of " +
      "least resistance, and stall when leadership tries to mandate uptake.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is medium, not high, and that is the honest position. The model " +
      "is built to be attestable — per-initiative baselines plus Finance attestation " +
      "make value more defensible than a typical AI program — but two structural " +
      "constraints cap clarity: value depends on Finance-attestation rigor (a weak " +
      "baseline or no counterfactual collapses the number), and it depends on " +
      "voluntary adoption (a solution nobody uses realizes nothing). Lower-cost-via-" +
      "reuse is the most compounding return but also the slowest and hardest to " +
      "attribute early. Do not promise a firm portfolio ROI from a blanket " +
      "percentage; promise an attestable, per-initiative number that clears Finance.",
  },

  regulatoryFrame: {
    name: "AI governance, financial-control attestation, and data/IP handling",
    relevance:
      "The value office sits at the intersection of three cross-cutting frames: " +
      "AI-governance standards (EU AI Act, NIST AI RMF, ISO/IEC 42001) define the " +
      "responsible-AI-by-design controls enforced at every gate; financial-control " +
      "discipline (e.g. SOX) governs the integrity of value attested into the P&L; " +
      "and data privacy/IP handling (GDPR/CCPA and equivalents) governs the " +
      "reusable context layer and the IP posture of reused assets and model outputs. " +
      "Sector-specific regulation further constrains which use cases are permissible " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (morgan)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
