// Consilium expert — Enterprise Architecture & Technology Strategy (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It is the CIO-office
// ARCHITECTURE DISCIPLINE: target-state architecture across the business,
// application, data, and technology domains; architecture standards and
// principles; technology strategy and roadmap; reference architectures;
// architecture governance and review boards; the technology radar; and the
// build-vs-buy decision. It answers the question every CIO faces once the estate
// has accreted a generation of point decisions: "what is our target-state
// architecture, which standards and principles govern new investment, and how do
// we steer the technology portfolio toward it — without an ivory tower that
// produces diagrams nobody decides with?"
//
// HONESTY DOCTRINE. This expert is built around three non-negotiable truths.
// First, EA earns its keep by ENABLING DECISIONS, not by producing artifacts —
// a target-state diagram, a principles deck, or a reference architecture that no
// investment decision was made with is overhead, not architecture. The unit of
// EA value is a better build-vs-buy call, a standard that prevented a redundant
// platform, a roadmap that sequenced a migration — measured in decisions
// influenced, not models drawn. Second, IVORY-TOWER EA is the known failure mode:
// a central team that publishes standards no one follows, reviews that gate
// velocity without adding judgment, and a target state disconnected from how
// money is actually spent. Architecture that delivery teams route around has
// failed regardless of how complete it is. Third, ARCHITECTURE DEBT COMPOUNDS
// SILENTLY: every standards exception, every off-radar technology adopted, every
// redundant capability tolerated raises the cost of the NEXT change — and unlike
// a budget overrun it does not show up on a P&L until integration grinds to a
// halt. The expert refuses the "EA = enterprise diagrams" reflex and the
// "more governance = more control" leap, and insists architecture be measured by
// decisions enabled and debt avoided, grounded in standards compliance, technology
// diversity, and reference-architecture reuse before any "transformation roadmap"
// is sold.
//
// DISTINCT from two neighbors. It is NOT application-modernization: that expert
// reasons about the application PORTFOLIO and legacy debt EXECUTION (TIME/6R
// disposition, decommissioning, rewrites). It is NOT it-strategy-operating-model:
// that expert reasons about the IT ORG, funding model, and operating model. This
// expert owns the ARCHITECTURE itself — the target state, the standards and
// principles, the reference architectures, the governance that steers investment
// toward coherence — the discipline that decides what GOOD looks like across
// domains, which the other two then execute and organize around.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const enterpriseArchitectureExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.enterprise-architecture",
    expertName: "Enterprise Architecture & Technology Strategy Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "enterprise-architecture",
    scopeNote:
      "Horizontal across every enterprise's CIO office: the ARCHITECTURE " +
      "discipline that sets target-state architecture across the business, " +
      "application, data, and technology domains; defines and governs architecture " +
      "standards and principles; owns the technology strategy and roadmap, " +
      "reference architectures, the technology radar, and the build-vs-buy " +
      "decision; and runs architecture governance / review boards that steer " +
      "investment toward a coherent target state. Anchored to the honest positions " +
      "that EA earns its keep by ENABLING DECISIONS (not producing diagrams), that " +
      "IVORY-TOWER EA — standards no one follows, reviews that gate velocity " +
      "without adding judgment — is the known failure mode, and that ARCHITECTURE " +
      "DEBT compounds silently until the next change becomes unaffordable. Supports " +
      "the CIO's technology-strategy and architecture-governance module. Excludes " +
      "the execution of application portfolio rationalization and legacy " +
      "modernization (a separate application-modernization expert — TIME/6R, " +
      "decommissioning, rewrites), the IT organization, funding model, and " +
      "operating model (a separate it-strategy-operating-model expert), and " +
      "deep data-platform engineering, cloud-infrastructure landing zones, and " +
      "cybersecurity architecture (separate experts) — this expert owns the " +
      "cross-domain target architecture, the standards/principles, and the " +
      "governance that decides what GOOD looks like, not the build-out of any one " +
      "domain.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "standards_compliance_pct",
        name: "Architecture standards compliance %",
        definition:
          "Share of in-scope systems, services, and new investments that conform " +
          "to the published architecture standards (approved technologies, " +
          "patterns, integration and security baselines) versus those running on " +
          "exceptions or off-standard choices — the adherence signal for whether " +
          "the standards actually govern.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "Compliance varies enormously with how enforced and how usable the " +
            "standards are; a low figure usually means ivory-tower standards no one " +
            "follows rather than a non-compliant estate, so the directional ask is " +
            "rising compliance with standards teams actually choose to follow",
          label: "planning-range",
        },
        dataSource:
          "Architecture review records + APM/CMDB tagging of systems against the standards catalog, reconciled to the exception register",
        whyItMatters:
          "Standards that are not followed are not standards — they are documents. " +
          "Compliance is the honest test of whether EA is steering real investment " +
          "or publishing into a void; low compliance with no exception trail is the " +
          "ivory-tower signature, not an enforcement opportunity.",
      },
      {
        key: "technology_diversity_index",
        name: "Technology diversity / sprawl index",
        definition:
          "The count of distinct technologies serving the same capability category " +
          "(e.g. number of databases, programming languages, integration tools, " +
          "or cloud platforms in production) — a proxy for unmanaged sprawl versus " +
          "deliberate, supportable standardization.",
        unit: "distinct technologies per capability category",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 8,
          basis:
            "Healthy estates deliberately keep a small, supported set per category " +
            "(with one or two sanctioned alternatives), while sprawled estates carry " +
            "many; the directional ask is a converging, supported set, never a " +
            "monoculture mandate that ignores fit",
          label: "planning-range",
        },
        dataSource:
          "Technology-stack inventory in the EA repository / CMDB grouped by capability category against the technology radar",
        whyItMatters:
          "Diversity is the master driver of run cost, skills fragmentation, and " +
          "integration complexity. Every unsanctioned technology is a new support, " +
          "patching, and hiring obligation — sprawl is architecture debt accruing " +
          "in plain sight, and convergence to a supported set is the clearest EA " +
          "value lever that is not a rewrite.",
      },
      {
        key: "reference_architecture_reuse_pct",
        name: "Reference-architecture reuse rate",
        definition:
          "Share of new solutions and significant changes that adopt a published " +
          "reference architecture or sanctioned pattern rather than designing " +
          "bespoke from scratch — the leverage signal for whether EA's reusable " +
          "assets are actually used.",
        unit: "% of new solutions adopting a reference architecture",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Reuse depends on whether reference architectures are usable, current, " +
            "and tied to delivery; low reuse usually means the references are " +
            "shelfware, so the directional ask is rising reuse of references teams " +
            "find faster than building bespoke",
          label: "planning-range",
        },
        dataSource:
          "Architecture review intake records tagging each solution against the reference-architecture catalog",
        whyItMatters:
          "Reference architectures are how EA scales judgment without reviewing " +
          "everything by hand: a reused pattern is a decision already made well. " +
          "Low reuse means EA is producing artifacts faster than teams consume " +
          "them — the diagrams-not-decisions failure mode in one metric.",
      },
      {
        key: "architecture_review_cycle_time",
        name: "Architecture review cycle time",
        definition:
          "Elapsed time from an architecture review request (design intake, " +
          "standards exception, or board submission) to a decision returned — the " +
          "responsiveness signal that exposes whether governance enables or " +
          "throttles delivery.",
        unit: "business days from request to decision",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 20,
          basis:
            "Lightweight, tiered review can decide most requests in days; heavyweight " +
            "monthly-board gating stretches to weeks and pushes teams to route " +
            "around it, so the directional ask is fast, proportionate review",
          label: "planning-range",
        },
        dataSource:
          "Architecture review board / intake tracking (request-to-decision timestamps by review tier)",
        whyItMatters:
          "Cycle time is where governance becomes a tax or a help. Slow review is " +
          "the mechanism by which EA becomes an ivory tower teams bypass — the " +
          "moment review costs more than the standard it protects, delivery routes " +
          "around it and compliance silently erodes.",
      },
      {
        key: "decisions_with_architecture_input_pct",
        name: "% technology decisions with architecture input",
        definition:
          "Share of material technology investment decisions (new platforms, major " +
          "build-vs-buy, significant integrations) that were taken WITH architecture " +
          "engagement at decision time — not retrofitted afterward — the influence " +
          "signal for whether EA is in the room when money is committed.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Influential EA is engaged before commitment on most material decisions; " +
            "marginalized EA reviews after the fact, so the directional ask is " +
            "architecture present at decision time, not a rubber-stamp at the end",
          label: "planning-range",
        },
        dataSource:
          "Investment/governance decision records cross-referenced to architecture review and engagement logs",
        whyItMatters:
          "This is the single most honest measure of EA value: architecture that is " +
          "not in the room when investment is decided is not enabling decisions, it " +
          "is documenting them after the fact. Low input is the marginalization " +
          "signal that precedes irrelevance — and it is the number EA should be " +
          "measured on, not artifacts produced.",
      },
      {
        key: "architecture_debt_ratio",
        name: "Architecture (technical) debt ratio",
        definition:
          "Estimated effort to bring the estate into conformance with the target " +
          "architecture and standards (remediate non-conformance, retire " +
          "off-standard technology, resolve known architecture violations) as a " +
          "fraction of total IT change capacity — a tracked proxy for accumulated " +
          "architecture debt, best read with its rate of change.",
        unit: "ratio (conformance-remediation effort / change capacity)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.1,
          high: 0.4,
          basis:
            "Estates carry a meaningful conformance backlog; the absolute value is " +
            "model-dependent, so the honest signal is the TREND — whether new debt " +
            "is accruing faster than it is being worked down",
          label: "planning-range",
        },
        dataSource:
          "Architecture exception register + standards non-conformance findings sized against portfolio change capacity, trended over time",
        whyItMatters:
          "Architecture debt is the silent compounding cost: it does not appear on a " +
          "P&L, it appears as the next change taking twice as long. The ratio is " +
          "only honest read as a RATE — a one-off cleanup that does not change how " +
          "fast new exceptions accrue buys a temporary dip, not a cure.",
      },
      {
        key: "redundant_capability_count",
        name: "Redundant business-capability count",
        definition:
          "The number of business capabilities served by more than one application " +
          "or platform with materially overlapping function — the duplication the " +
          "target architecture is meant to converge, distinct from raw application " +
          "redundancy in that it is scored against the capability map.",
        unit: "capabilities with material platform overlap",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Estates grown through M&A and uncoordinated investment accumulate " +
            "overlapping platforms per capability; the directional ask is convergence " +
            "to a target per capability, not a fixed count",
          label: "planning-range",
        },
        dataSource:
          "Business-capability model joined to the application/platform inventory in the EA repository",
        whyItMatters:
          "Redundant capability is where uncoordinated investment shows up as " +
          "permanent run cost and integration complexity. It is the value-side case " +
          "for a target architecture: convergence removes license, support, and " +
          "integration cost at once and is far more durable than re-coding any one " +
          "system — but only if the target state actually drives investment.",
      },
      {
        key: "eol_technology_pct",
        name: "% estate on end-of-life / off-radar technology",
        definition:
          "Share of the estate running on technologies that are end-of-life, " +
          "out-of-support, or sitting in the 'hold/retire' ring of the technology " +
          "radar — the obsolescence-and-drift signal for whether the estate is " +
          "tracking toward the target technology set.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Aging estates carry a tail of out-of-support and off-radar technology; " +
            "the band is wide because it tracks investment discipline, with the " +
            "directional ask being a falling tail as the radar steers adoption",
          label: "planning-range",
        },
        dataSource:
          "Technology-stack inventory cross-referenced to vendor support-lifecycle data and the technology-radar ring assignments",
        whyItMatters:
          "Off-radar and end-of-life technology is architecture debt with a security " +
          "and audit edge — it is unpatchable risk and rising run cost that the " +
          "radar exists to prevent. A high tail means the radar is descriptive, not " +
          "directive: it labels what exists rather than steering what gets adopted.",
      },
      {
        key: "business_capability_coverage_pct",
        name: "Business-capability coverage / fit",
        definition:
          "Share of the enterprise business-capability map supported by fit, " +
          "target-aligned applications (adequate, supported, on-standard, " +
          "non-redundant) versus capabilities that are gapped, over-served, or " +
          "served by off-target legacy — the alignment lens between architecture " +
          "and the business model.",
        unit: "% of capabilities served fit-to-target",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 85,
          basis:
            "Coverage depends on capability-mapping maturity; mature estates show " +
            "most capabilities served by fit, target-aligned applications with few " +
            "gaps or redundancies, so the directional ask is rising fit coverage",
          label: "planning-range",
        },
        dataSource:
          "Business-capability model joined to the application inventory and target-architecture conformance ratings",
        whyItMatters:
          "Capability coverage is what keeps architecture business-anchored rather " +
          "than a technology-only exercise. It is the bridge between business " +
          "strategy and the technology estate: it shows where the architecture is " +
          "over-investing (redundant), under-investing (gapped), or carrying " +
          "fragile off-target legacy — the map an EA function steers investment by.",
      },
      {
        key: "roadmap_adherence_pct",
        name: "Technology-roadmap adherence",
        definition:
          "Share of committed technology-strategy roadmap milestones (target-state " +
          "transitions, platform convergence, standards adoption waves) delivered " +
          "within their committed window — the credibility signal for whether the " +
          "roadmap steers reality or is a wish list.",
        unit: "% of roadmap milestones delivered on commitment",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Architecture roadmaps slip when they are aspirational and disconnected " +
            "from funding; roadmaps tied to the investment cycle land far more " +
            "reliably, so a low figure signals a roadmap that does not drive spend",
          label: "planning-range",
        },
        dataSource:
          "Technology-strategy roadmap milestone tracking (committed vs actual) joined to the investment/portfolio plan",
        whyItMatters:
          "A roadmap nobody funds or delivers is a slide, not a strategy. Adherence " +
          "is the honest test of whether the target architecture is connected to how " +
          "money is actually committed — a low figure means EA is planning a future " +
          "the investment process is not buying.",
      },
      {
        key: "integration_complexity_index",
        name: "Integration complexity index",
        definition:
          "A measure of estate coupling — point-to-point integration density, " +
          "average dependencies per application, and share of integrations outside " +
          "the sanctioned integration pattern — the brittleness signal the target " +
          "architecture's integration standards are meant to reduce.",
        unit: "index (point-to-point density + avg dependencies/app, normalized)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.2,
          high: 0.7,
          basis:
            "Estates without integration standards accumulate dense point-to-point " +
            "webs; the normalized index falls as integration converges to managed " +
            "patterns, so the directional ask is decoupling, not an absolute floor",
          label: "planning-range",
        },
        dataSource:
          "Integration/dependency inventory (integration-platform logs + architecture dependency mapping) against the sanctioned integration pattern",
        whyItMatters:
          "Integration complexity is the form architecture debt takes that most " +
          "directly raises the cost of the next change: dense coupling makes every " +
          "system hard to change or retire without breaking unseen consumers. It is " +
          "where 'the next change becomes unaffordable' actually happens, and the " +
          "integration standard is the lever that holds it down.",
      },
      {
        key: "build_vs_buy_outcome_realization_pct",
        name: "Build-vs-buy decision outcome realization",
        definition:
          "Share of significant build-vs-buy decisions whose actual outcome (cost, " +
          "fit, time-to-value, total cost of ownership) matched the case the " +
          "decision was made on — the calibration signal for whether the " +
          "architecture function's build-vs-buy judgment is trustworthy.",
        unit: "% of build-vs-buy decisions realizing their stated case",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 80,
          basis:
            "Build cases routinely under-estimate ongoing ownership and over-estimate " +
            "differentiation; buy cases under-estimate integration and lock-in, so " +
            "tracked realization calibrates the function's judgment over time",
          label: "planning-range",
        },
        dataSource:
          "Post-implementation review of build-vs-buy decisions against their original business case (TCO, fit, time-to-value)",
        whyItMatters:
          "Build-vs-buy is one of EA's highest-leverage decisions and the easiest to " +
          "get wrong on optimism. Tracking realization is how the function earns " +
          "calibrated judgment instead of reflexive answers — and it makes the " +
          "honest point that an unexamined 'we should build this' is usually the " +
          "more expensive mistake than it looks.",
      },
    ],

    painThemes: [
      {
        key: "ivory_tower_ea",
        name: "Ivory-tower EA (artifacts nobody decides with)",
        description:
          "The architecture function produces target-state diagrams, principles " +
          "decks, and reference models that look complete but are disconnected from " +
          "how investment is actually decided — delivery teams route around them, " +
          "standards go unfollowed, and EA's output is overhead rather than a lever " +
          "on real decisions. Completeness of the artifact is mistaken for " +
          "influence on the outcome.",
        detectionSignal:
          "Low % of decisions with architecture input; standards compliance low " +
          "with no exception trail; reference-architecture reuse near zero; EA " +
          "measured on artifacts produced rather than decisions enabled or debt " +
          "avoided; teams describe architecture as a gate, not a help.",
        diagnosticQuestion:
          "Of your material technology investment decisions in the last year, what " +
          "share had architecture engaged BEFORE commitment — and can you point to " +
          "decisions that changed because of architecture input, not just artifacts produced?",
      },
      {
        key: "governance_as_velocity_tax",
        name: "Governance as a velocity tax (gate without judgment)",
        description:
          "Architecture review is a heavyweight, one-size gate that every change " +
          "must pass regardless of risk — slow, queue-bound, and adding process " +
          "rather than judgment. It throttles delivery without improving outcomes, " +
          "so teams under deadline pressure bypass it and the very standards it " +
          "protects erode in the shadow estate it creates.",
        detectionSignal:
          "Long architecture review cycle time; a single monthly board gating " +
          "everything; no risk-tiered or self-service path; shadow architecture and " +
          "exception requests spiking near release deadlines; delivery teams citing " +
          "review as a top schedule risk.",
        diagnosticQuestion:
          "Is your architecture review tiered by risk with a fast/self-service path " +
          "for low-risk changes, or does everything pass through one heavyweight " +
          "gate — and how long does a typical decision actually take?",
      },
      {
        key: "target_state_disconnected_from_money",
        name: "Target state disconnected from how money is spent",
        description:
          "A polished target-state architecture and multi-year roadmap exist on " +
          "paper but are not wired into the investment and budgeting cycle — funding " +
          "decisions ignore them, projects proceed off-target, and the roadmap slips " +
          "year over year while the estate drifts in a different direction than the " +
          "architecture intends.",
        detectionSignal:
          "Low roadmap adherence; target architecture not referenced in funding/" +
          "investment governance; new investments approved with no conformance check; " +
          "the gap between as-is and target widening rather than closing across cycles.",
        diagnosticQuestion:
          "Is your target architecture wired into the investment/budget cycle so " +
          "funding decisions are checked against it — or does it live separately from " +
          "where money is actually committed, and is the as-is/target gap narrowing or widening?",
      },
      {
        key: "silent_architecture_debt",
        name: "Architecture debt compounding silently",
        description:
          "Every standards exception, off-radar technology, and tolerated redundant " +
          "capability raises the cost of the NEXT change, but the cost is invisible " +
          "because it lands as future friction rather than a current line item — so " +
          "debt accrues unmeasured until integration grinds, change estimates " +
          "balloon, and the estate becomes effectively unchangeable.",
        detectionSignal:
          "No architecture-debt or conformance backlog measure; exception register " +
          "missing or never worked down; rising integration complexity and EOL/" +
          "off-radar share; change estimates inflating with no obvious cause; " +
          "'we can't touch that system' a common refrain.",
        diagnosticQuestion:
          "Do you measure architecture debt as a TREND — the rate at which " +
          "exceptions, off-radar technology, and redundant capability accrue versus " +
          "get worked down — or is it invisible until the next change becomes unaffordable?",
      },
      {
        key: "standards_no_one_follows",
        name: "Standards that are documents, not decisions",
        description:
          "The standards catalog is published but unenforced and often unusable — " +
          "too abstract, out of date, or detached from delivery tooling — so teams " +
          "either ignore it or paper over non-compliance with un-tracked exceptions. " +
          "The standards describe an intent nobody is held to, and compliance is " +
          "unknown because no one reconciles the estate to them.",
        detectionSignal:
          "Standards compliance unmeasured or low; no exception register, or one " +
          "that only grows; standards not embedded in reference architectures or " +
          "delivery pipelines; technology diversity climbing despite a 'standard set'.",
        diagnosticQuestion:
          "Are your standards enforced and usable — embedded in reference " +
          "architectures and the delivery path, with a live exception register — or " +
          "are they a catalog teams route around, and do you actually know your compliance rate?",
      },
      {
        key: "uncontrolled_technology_sprawl",
        name: "Uncontrolled technology sprawl (radar that only describes)",
        description:
          "New technologies enter the estate through uncoordinated team choices, " +
          "shadow IT, and M&A with no effective radar steering adoption — so the " +
          "estate accumulates many technologies per capability category, " +
          "fragmenting skills, multiplying support and patching obligations, and " +
          "raising integration cost. The technology radar, where one exists, labels " +
          "what is there rather than governing what gets adopted.",
        detectionSignal:
          "High technology-diversity index; many databases/languages/integration " +
          "tools per category; a radar that is descriptive (catalogs existing tech) " +
          "rather than directive (gates adoption); new technologies appearing in " +
          "production with no adopt decision.",
        diagnosticQuestion:
          "How many distinct technologies serve the same capability category in " +
          "production, and does your technology radar actually gate new adoption — " +
          "or does it just describe the sprawl after it has already happened?",
      },
      {
        key: "build_reflex",
        name: "Build reflex (unexamined build-vs-buy)",
        description:
          "Significant capabilities are built bespoke on a reflex of " +
          "differentiation or 'not-invented-here' without an honest build-vs-buy " +
          "case — under-counting the perpetual ownership cost of custom code and " +
          "over-stating the differentiation, so the estate accretes maintenance " +
          "burden for capabilities that are commodity and would have been cheaper to buy.",
        detectionSignal:
          "Custom-built systems for clearly commodity capabilities; build-vs-buy " +
          "decisions with no documented TCO comparison; low build-vs-buy realization " +
          "(build cases over-running their case); a backlog dominated by maintaining " +
          "bespoke commodity systems.",
        diagnosticQuestion:
          "For your significant build decisions, was there an honest build-vs-buy " +
          "case comparing total ownership cost and real differentiation — and how " +
          "have your past build decisions actually realized against their cases?",
      },
      {
        key: "domain_silo_no_cross_cutting_view",
        name: "Domain silos with no cross-cutting architecture",
        description:
          "Business, application, data, and technology architecture are owned and " +
          "optimized separately with no coherent cross-domain target — so decisions " +
          "that are locally rational (a domain's best app, a team's preferred data " +
          "store) are globally incoherent, producing redundant capability, " +
          "duplicated data, and integration sprawl that no single domain owner is " +
          "accountable for.",
        detectionSignal:
          "Architecture domains run as separate workstreams with no integrated " +
          "target; redundant-capability count high; duplicated data and " +
          "point-to-point integration between domains; no business-capability map " +
          "tying the domains together; no single owner of the cross-domain target state.",
        diagnosticQuestion:
          "Is there a single coherent cross-domain target architecture (business, " +
          "application, data, technology) tied to a business-capability map — or are " +
          "the domains optimized in silos that produce redundancy and integration sprawl?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_estate_modeling_assistant",
        name: "AI-assisted architecture estate modeling & conformance",
        valueMechanism:
          "Use AI to reconcile fragmented inventory sources (CMDB, spend, " +
          "integration logs, code repositories) into a current architecture model — " +
          "applications, technologies, capabilities, and dependencies — and to " +
          "score conformance against the standards catalog and technology radar " +
          "automatically, surfacing off-standard technology, redundant capability, " +
          "and standards exceptions that manual modeling misses. Value shows up as a " +
          "current, trustworthy architecture model and a live conformance and " +
          "debt-trend view, so EA steers from reality instead of a stale diagram — " +
          "NOT as the AI making the conformance call.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Reconcilable inventory sources (EA repository/CMDB, application spend, integration inventory, technology-stack data)",
          "A published standards catalog and technology-radar ring assignments to score against",
          "A business-capability model to map applications and redundancy against",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI builds and scores the model; the conformance/exception decision and the target-state intent stay with the architect",
          "An auto-generated model that hides its confidence gaps is worse than none — a wrong 'conformant' assessment misdirects investment",
        ],
        metricsMoved: [
          "standards_compliance_pct",
          "technology_diversity_index",
          "architecture_debt_ratio",
          "redundant_capability_count",
        ],
      },
      {
        key: "ai_architecture_review_copilot",
        name: "AI architecture-review copilot (decision acceleration)",
        valueMechanism:
          "Apply AI to triage architecture review intake — classifying risk, " +
          "checking a design against published standards and reference " +
          "architectures, drafting the standards-conformance assessment, and " +
          "routing low-risk changes to a fast/self-service path — so review " +
          "capacity goes to the genuinely novel decisions and the cycle time on " +
          "routine ones collapses. Value is faster, more consistent review that " +
          "STOPS governance being a velocity tax; it does NOT replace the board's " +
          "judgment on material or novel decisions, which still get human review.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "The standards catalog, reference-architecture catalog, and review decision history in machine-usable form",
          "Architecture review intake with risk-tiering criteria",
          "Cycle-time and reuse baselines to measure the copilot against",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "A copilot that auto-approves to hit cycle-time targets re-creates the rubber-stamp failure — material/novel decisions stay with the board",
          "Standards conformance drafted by AI must be reviewable and traceable to the cited standard, not an opaque verdict",
        ],
        metricsMoved: [
          "architecture_review_cycle_time",
          "reference_architecture_reuse_pct",
          "standards_compliance_pct",
        ],
      },
      {
        key: "ai_target_state_scenario_modeling",
        name: "AI-assisted target-state & roadmap scenario modeling",
        valueMechanism:
          "Use AI to generate and compare target-state and convergence scenarios — " +
          "modeling the cost, risk, and capability impact of consolidating " +
          "redundant platforms, retiring off-radar technology, and sequencing " +
          "roadmap waves — so the architecture function can pressure-test options " +
          "against the investment cycle rather than hand-drawing one future. Value " +
          "is better-grounded target-state and roadmap decisions tied to money; the " +
          "scenarios are inputs to a human strategy choice, NOT an auto-selected target.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "The current architecture model with per-capability redundancy and per-technology TCO",
          "The investment/portfolio plan and change-capacity constraints to sequence against",
          "Roadmap-adherence and architecture-debt baselines",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Scenario cost/benefit are planning estimates with assumptions, not commitments — they must carry their haircuts, not a single confident number",
          "A target state auto-selected by a model and not owned by an accountable architect is exactly the disconnected-from-money failure mode",
        ],
        metricsMoved: [
          "roadmap_adherence_pct",
          "redundant_capability_count",
          "business_capability_coverage_pct",
        ],
      },
      {
        key: "ai_tech_radar_horizon_scanning",
        name: "AI technology-radar horizon scanning & adoption signals",
        valueMechanism:
          "Apply AI to scan the external technology landscape and the internal " +
          "estate together — emerging technologies, vendor lifecycle and end-of-life " +
          "signals, and where unsanctioned technology is creeping into production — " +
          "to keep the technology radar current and directive rather than a " +
          "once-a-year offsite artifact. Value is a live radar that steers adoption " +
          "and flags drift early; the adopt/trial/hold/retire RING decision stays a " +
          "deliberate human call informed by the scan, not automated by it.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "External technology and vendor-lifecycle data sources",
          "The internal technology-stack inventory to detect drift and off-radar adoption",
          "The current radar ring assignments and adoption criteria",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Horizon-scanning surfaces signals and drift; the radar ring (adopt/trial/hold/retire) is a deliberate governance decision, not an AI verdict",
          "Hype-driven external signals must be filtered against the estate's actual fit and skills, or the radar chases novelty over value",
        ],
        metricsMoved: [
          "eol_technology_pct",
          "technology_diversity_index",
          "standards_compliance_pct",
        ],
      },
      {
        key: "ai_build_vs_buy_decision_support",
        name: "AI-assisted build-vs-buy & TCO decision support",
        valueMechanism:
          "Use AI to assemble the build-vs-buy case — surveying buy options against " +
          "requirements, estimating fully-loaded build TCO including perpetual " +
          "ownership, modeling integration and lock-in cost for buy, and recalling " +
          "how comparable past decisions actually realized — so the decision is made " +
          "on an honest, calibrated comparison rather than a build/buy reflex. Value " +
          "is better-calibrated build-vs-buy outcomes; the AI produces the comparison, " +
          "the accountable decision-maker makes the call.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Requirements and the business-capability fit being decided",
          "Past build-vs-buy decisions with their realized outcomes (the calibration corpus)",
          "Build TCO and buy/integration/lock-in cost data",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "The build-vs-buy decision and its accountability stay human — AI assembles the case, it does not own the commitment",
          "TCO comparisons must surface their assumptions (especially perpetual build-ownership cost) honestly, or they bias toward whichever option was already preferred",
        ],
        metricsMoved: [
          "build_vs_buy_outcome_realization_pct",
          "technology_diversity_index",
          "integration_complexity_index",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "federated_architecture_governance",
        name: "Federated, risk-tiered architecture governance",
        description:
          "A governance operating model that replaces a single heavyweight board " +
          "with a federated model: a small central team owns standards, principles, " +
          "and the target state, while embedded/domain architects make most " +
          "decisions inside published guardrails, and review is risk-tiered — " +
          "self-service for low-risk conforming changes, lightweight review for " +
          "moderate, board only for material or novel decisions. It is the explicit " +
          "antidote to ivory-tower EA and governance-as-velocity-tax: judgment is " +
          "distributed and proportionate, so architecture enables decisions at the " +
          "edge rather than gating them from the center.",
        boundary:
          "Owns the governance operating model, the guardrails, the risk-tiering, " +
          "and the standards/target-state intent; does not own the delivery of any " +
          "solution, the IT operating model and funding (separate function), or the " +
          "execution of portfolio rationalization (separate function).",
        humanAccountabilityPoint:
          "Chief Architect / Head of Enterprise Architecture (with domain architects accountable inside their guardrails)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "target_state_capability_architecture",
        name: "Capability-anchored cross-domain target architecture",
        description:
          "A single coherent target-state architecture spanning the business, " +
          "application, data, and technology domains, anchored to a " +
          "business-capability map so every technology decision can be traced to the " +
          "capability it serves and scored for fit, redundancy, and target " +
          "alignment. It is the decision spine that ties domain choices into a " +
          "coherent whole and exposes redundant capability and gaps — wired into the " +
          "investment cycle so funding is checked against it, not a separate paper future.",
        boundary:
          "Owns the cross-domain target state, the capability map, and the " +
          "conformance scoring; does not own the execution of any transition (that " +
          "is delivery / portfolio rationalization) or the per-domain deep build-out " +
          "(data platform, cloud, security — separate functions).",
        humanAccountabilityPoint:
          "Chief Architect, with named domain architects accountable for their domain's conformance to the target",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "reference_architecture_standards_library",
        name: "Living reference-architecture & standards library",
        description:
          "A curated, versioned library of reference architectures, sanctioned " +
          "patterns, and standards that is usable and current — embedded in the " +
          "delivery path (templates, pipelines, guardrails) so adopting the standard " +
          "is the fast path, not the bureaucratic one. It scales architecture " +
          "judgment: a reused reference is a decision already made well, raising " +
          "reuse and compliance without reviewing everything by hand, and is " +
          "maintained as a product (kept current, deprecated when superseded), not published once.",
        boundary:
          "Owns the reference/standards catalog, its currency, and its embedding in " +
          "delivery tooling; does not own the individual solution that adopts a " +
          "reference or the platform the reference runs on (separate ownership).",
        humanAccountabilityPoint:
          "Reference-architecture / standards owner within the EA function, accountable for currency and adoption",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "technology_radar_lifecycle",
        name: "Directive technology radar & lifecycle governance",
        description:
          "A technology radar operated as a directive control — adopt / trial / " +
          "hold / retire rings with explicit adoption criteria and an end-of-life " +
          "lifecycle policy — that actually gates what enters production rather than " +
          "describing what already has. It converges technology diversity to a " +
          "supported set, drives off-radar and end-of-life technology out, and gives " +
          "teams a sanctioned default per capability category, with a clear path to " +
          "trial new technology deliberately rather than by shadow adoption.",
        boundary:
          "Owns the radar, ring assignments, adoption criteria, and EOL lifecycle " +
          "policy; does not own the procurement/commercial sourcing of any technology " +
          "or its operational run (separate functions).",
        humanAccountabilityPoint:
          "Head of Technology Strategy / Chief Architect, accountable for radar ring decisions and lifecycle policy",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "architecture_decision_record_practice",
        name: "Architecture decision records & traceable rationale",
        description:
          "A standing practice of recording material architecture decisions as " +
          "lightweight, durable architecture decision records (ADRs) — the option " +
          "chosen, the alternatives, the rationale, the standards/principles applied, " +
          "and the accountable owner — so architecture is a traceable chain of " +
          "decisions rather than a set of diagrams. It is how EA proves it enables " +
          "decisions (the record IS the value), how build-vs-buy realization is " +
          "later calibrated, and how rationale survives team turnover.",
        boundary:
          "Owns the decision-record practice, its template, and its discoverability; " +
          "does not own the decisions' execution or the systems the decisions govern " +
          "(it captures and traces them, it does not deliver them).",
        humanAccountabilityPoint:
          "The accountable architect or decision-maker for each record, with the EA function owning the practice",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Enterprise-architecture value is realized as BETTER DECISIONS and AVOIDED " +
        "DEBT — not as diagrams, principles decks, or a completed target-state " +
        "model. The honest chain: a capability-anchored target architecture and a " +
        "usable standards/reference library, wired into the investment cycle, make " +
        "each technology decision converge the estate instead of fragment it — a " +
        "build-vs-buy call made on honest TCO, a redundant platform not bought, an " +
        "off-radar technology not adopted, a migration sequenced before it becomes " +
        "forced. The durable value shows up as REMOVED future cost: converging " +
        "redundant capability and technology diversity strips run, integration, and " +
        "skills cost at once; a directive radar and held standards keep architecture " +
        "debt from compounding into the next change. Re-architecture and convergence " +
        "add value only where the target is real and investment-connected, and only " +
        "incrementally — a transformation roadmap disconnected from funding slips " +
        "and the as-is/target gap widens. Every step is haircut: value depends on " +
        "EA actually being in the room when money is committed (influence, not " +
        "artifacts), on standards being followed (compliance, not publication), on " +
        "governance being proportionate (or teams route around it), and on debt " +
        "reduction holding the RATE of new debt, not buying a one-off dip. The " +
        "business case must book value as decisions influenced and debt avoided — " +
        "never as a count of artifacts produced, a 'modern target state' label, or " +
        "a governance process that gates without adding judgment.",
      dominantHaircutFactors: [
        {
          factor: "Influence gap (architecture not in the room at decision time)",
          rationale:
            "EA value depends on being engaged before investment is committed; where " +
            "architecture reviews after the fact or is routed around, the target " +
            "state and standards do not actually steer spend, so most of the modeled " +
            "value is never realized — the largest and most common haircut.",
          typicalHaircut: {
            low: 0.2,
            high: 0.6,
            basis:
              "Drop-off between architecture intent and realized influence where EA is marginalized to after-the-fact review",
            label: "planning-range",
          },
        },
        {
          factor: "Standards non-adoption / governance route-around",
          rationale:
            "Standards that are unfollowed and governance that is bypassed under " +
            "deadline pressure mean the conformance and convergence the case assumed " +
            "do not happen; a shadow estate accrues and erodes the projected debt " +
            "avoidance and run-cost convergence.",
          typicalHaircut: {
            low: 0.15,
            high: 0.45,
            basis:
              "Erosion of convergence/debt-avoidance value where compliance is low and exceptions go untracked",
            label: "planning-range",
          },
        },
        {
          factor: "Convergence execution drag (decided ≠ converged)",
          rationale:
            "Converging redundant capability and technology diversity is slow and " +
            "blocked by integration lock-in and organizational resistance; a target " +
            "and roadmap can be set while the as-is estate barely moves, giving back " +
            "the convergence savings the case assumed.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Schedule and scope give-back between a decided target state and actual estate convergence",
            label: "planning-range",
          },
        },
        {
          factor: "Architecture-debt re-accrual (rate not held)",
          rationale:
            "A one-off conformance cleanup that does not change how fast new " +
            "exceptions, off-radar technology, and redundant capability accrue sees " +
            "the gain erode — the debt avoidance is temporary unless governance holds the rate.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Erosion of one-off architecture-debt reduction where the rate of new non-conformance is unchanged",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Run-cost convergence from capability & technology rationalization",
          range: {
            low: 0.08,
            high: 0.25,
            basis:
              "Run-cost reduction realized by converging redundant capability and technology diversity to a supported target set, net of convergence give-back",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in run cost (license + infra + support + integration) as redundant capability and technology diversity converge to target",
        },
        {
          lever: "Change-cost / delivery-speed uplift from reduced architecture debt",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reduction in the cost and time of change as integration complexity and architecture debt fall toward target",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in change effort / lead time on systems brought to target architecture, at held-or-improved stability",
        },
        {
          lever: "Avoided-investment value from build-vs-buy and standards discipline",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Investment avoided by not building commodity capability, not buying redundant platforms, and not adopting off-radar technology",
            label: "planning-range",
          },
          measuredAs:
            "Avoided spend per investment cycle from disciplined build-vs-buy and standards/radar gating, traced to specific avoided decisions",
        },
      ],
      timeToValueBand:
        "Standing up federated governance, a usable standards/reference library, " +
        "and a current architecture model: 1-2 quarters to architecture being in " +
        "the room for material decisions and a live conformance view. Influence on " +
        "decisions (build-vs-buy discipline, redundant platforms not bought, " +
        "off-radar adoption gated): visible within 2-3 quarters as the investment " +
        "cycle routes through architecture. Realized convergence value (run-cost " +
        "reduction from rationalizing redundant capability and technology " +
        "diversity): 3-6+ quarters, gated by convergence execution and integration " +
        "lock-in. A held architecture-debt rate and a narrowing as-is/target gap: " +
        "multi-year, as standards, the radar, and governance sustain conformance " +
        "faster than new debt accrues.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Enterprise architecture repository / modeling tool",
          role: "Source of truth for the architecture model — capabilities, applications, technologies, dependencies, and target-state/standards conformance.",
          examples: ["LeanIX", "Mega HOPEX", "BiZZdesign", "Ardoq", "Avolution ABACUS", "Sparx Enterprise Architect"],
        },
        {
          name: "Application portfolio management / CMDB",
          role: "The application and technology inventory the architecture model is reconciled to — ownership, lifecycle status, and the as-is estate.",
          examples: ["ServiceNow APM/CMDB", "LeanIX", "Device42"],
        },
        {
          name: "Technology radar / standards catalog",
          role: "Where the adopt/trial/hold/retire rings, adoption criteria, and the standards/reference-architecture catalog live — the directive control set.",
          examples: ["Technology radar (Thoughtworks-style)", "Backstage/internal developer platform tech catalog", "EA-repository standards module"],
        },
        {
          name: "IT financial management / TBM platform",
          role: "Per-technology and per-capability cost — the TCO side of target-state, convergence, and build-vs-buy decisions.",
          examples: ["Apptio", "ServiceNow ITFM", "Cloudability / Tower TBM model"],
        },
        {
          name: "Investment / portfolio governance system",
          role: "Where technology investment decisions are taken and tracked — the join point that proves whether architecture is engaged at decision time.",
          examples: ["Strategic-portfolio-management tooling (Planview, ServiceNow SPM, Apptio Targetprocess)", "Investment-committee decision records"],
        },
      ],
      roles: [
        {
          title: "Chief Architect / Head of Enterprise Architecture",
          accountability:
            "The cross-domain target-state architecture, the standards and principles, the governance operating model, and EA's influence on material investment decisions.",
        },
        {
          title: "CIO / CTO (technology strategy owner)",
          accountability:
            "The technology strategy and roadmap, the build-vs-buy posture, and wiring the target architecture into the investment and budgeting cycle.",
        },
        {
          title: "Domain architect (business / application / data / technology)",
          accountability:
            "Conformance of their domain to the target architecture and standards, and the architecture decisions inside their published guardrails.",
        },
        {
          title: "Solution architect",
          accountability:
            "The architecture of a specific solution — adopting reference architectures and standards, raising exceptions, and recording the decisions made.",
        },
        {
          title: "Architecture review board / governance owner",
          accountability:
            "The risk-tiered review process, the exception register, and the proportionality of governance (enabling decisions, not gating velocity).",
        },
      ],
      regulatoryFrames: [
        {
          name: "Security & resilience architecture obligations (e.g. DORA, NIS2, regulator IT-resilience expectations)",
          relevance:
            "Resilience, concentration-risk, and security-by-design expectations constrain target-state choices, technology diversity decisions, and which architectures are admissible — architecture standards must encode them.",
        },
        {
          name: "Data architecture & privacy constraints (GDPR/CCPA, data residency, sovereignty)",
          relevance:
            "Data-domain target architecture, integration patterns, and platform/cloud choices are constrained by residency, sovereignty, and privacy-by-design — the data architecture must conform.",
        },
        {
          name: "Technology lifecycle, EOL, and audit obligations",
          relevance:
            "End-of-life/unsupported technology creates security and audit exposure; the radar's hold/retire rings and the lifecycle policy are partly a compliance instrument, not just a preference.",
        },
        {
          name: "AI governance & model-architecture frameworks (e.g. EU AI Act, NIST AI RMF)",
          relevance:
            "Emerging AI-system architecture expectations shape reference architectures and the radar for AI platforms; EA must encode where AI is admissible and under what controls (coordinated with a separate AI-governance expert).",
        },
      ],
      canonicalTerms: [
        {
          term: "Target-state architecture (to-be)",
          definition:
            "The intended future architecture across business, application, data, and technology domains that investment is steered toward — the destination the roadmap closes the as-is/target gap against.",
        },
        {
          term: "Architecture principles & standards",
          definition:
            "The durable rules and sanctioned choices (approved technologies, patterns, integration/security baselines) that govern new investment; standards are only real if compliance is measured and enforced.",
        },
        {
          term: "Reference architecture",
          definition:
            "A reusable, sanctioned design for a recurring problem so a solution adopts a decision already made well instead of designing bespoke — leverage that scales architecture judgment.",
        },
        {
          term: "Technology radar (adopt / trial / hold / retire)",
          definition:
            "A directive control assigning technologies to rings with adoption criteria, used to gate what enters production and drive off-radar/EOL technology out — directive, not merely descriptive.",
        },
        {
          term: "Architecture (technical) debt",
          definition:
            "The accumulated cost of standards exceptions, off-radar technology, and tolerated redundancy that raises the cost of the NEXT change — a silently compounding tax measured as a rate, not a snapshot.",
        },
        {
          term: "Build vs buy",
          definition:
            "The decision to build a capability bespoke versus buy/subscribe, made on honest fully-loaded TCO (including perpetual build-ownership) and real differentiation — the build reflex is the common, expensive error.",
        },
        {
          term: "Business-capability model",
          definition:
            "A stable map of what the enterprise does (capabilities), used to anchor the target architecture, score application fit and redundancy, and keep architecture business-anchored rather than technology-only.",
        },
        {
          term: "Architecture decision record (ADR)",
          definition:
            "A lightweight, durable record of a material architecture decision — the option chosen, alternatives, rationale, standards applied, and owner — so architecture is a traceable chain of decisions, not diagrams.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Architecture influence (EA enabling decisions)",
        authoritativeSource:
          "Investment/governance decision records cross-referenced to architecture engagement and decision (ADR) logs",
        whatGoodEvidenceLooksLike:
          "Material decisions showing architecture engaged before commitment, with specific decisions traceable to architecture input (an option changed, a build averted, a standard applied) — influence, not just artifacts produced.",
        weakEvidenceToReject:
          "A count of diagrams, principles decks, or reference models produced presented as EA value, or an 'architecture was consulted' claim with no decision record showing engagement at decision time.",
      },
      {
        claim: "Standards compliance and architecture conformance",
        authoritativeSource:
          "The standards catalog reconciled to the estate via APM/CMDB tagging plus a live exception register",
        whatGoodEvidenceLooksLike:
          "A measured compliance rate with each non-conformance tracked as a registered exception with an owner and remediation path, reconciled to the actual estate — not an assertion that standards exist.",
        weakEvidenceToReject:
          "A published standards catalog presented as compliance, an unmeasured 'we have standards' claim, or an exception register that only grows and is never worked down.",
      },
      {
        claim: "Architecture debt and convergence (run-cost / integration)",
        authoritativeSource:
          "Architecture exception/non-conformance backlog and the technology-diversity and integration-complexity inventory, sized against change capacity and trended",
        whatGoodEvidenceLooksLike:
          "Architecture debt read as a TREND (rate of accrual vs work-down), technology diversity and redundant capability counted against the target, and convergence savings tied to specific platforms actually retired/converged.",
        weakEvidenceToReject:
          "A single architecture-debt snapshot presented as fixed, a diversity claim with no per-category count, or convergence savings claimed from a target-state model with no estate actually converged.",
      },
      {
        claim: "Roadmap and target-state realization (connected to money)",
        authoritativeSource:
          "Technology-roadmap milestone tracking (committed vs actual) joined to the investment/portfolio plan and as-is/target conformance over time",
        whatGoodEvidenceLooksLike:
          "Roadmap milestones delivered on commitment with the as-is/target gap measurably narrowing, and funding decisions checked against the target architecture — the roadmap driving spend.",
        weakEvidenceToReject:
          "A polished target-state and roadmap with no adherence measurement, not referenced in funding governance, or an as-is/target gap that is widening while the roadmap reports progress.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Of your material technology investment decisions in the last year, what share had architecture engaged BEFORE commitment — and can you point to decisions that changed because of architecture input, not just artifacts produced?",
      "Is your architecture review tiered by risk with a fast/self-service path for low-risk conforming changes, or does everything pass through one heavyweight gate — and how long does a typical decision actually take?",
      "Is your target architecture wired into the investment/budget cycle so funding decisions are checked against it, or does it live separately from where money is committed — and is the as-is/target gap narrowing or widening?",
      "Do you measure architecture debt as a TREND — the rate at which exceptions, off-radar technology, and redundant capability accrue versus get worked down — or is it invisible until the next change becomes unaffordable?",
      "Are your standards enforced and usable (embedded in reference architectures and the delivery path, with a live exception register), and do you actually know your compliance rate — or are they a catalog teams route around?",
      "How many distinct technologies serve the same capability category in production, and does your technology radar actually gate new adoption — or does it just describe the sprawl after it has already happened?",
      "For your significant build decisions, was there an honest build-vs-buy case comparing total ownership cost and real differentiation — and how have your past build decisions actually realized against their cases?",
      "Is there a single coherent cross-domain target architecture (business, application, data, technology) anchored to a business-capability map, or are the domains optimized in silos that produce redundancy and integration sprawl?",
    ],
    maturitySignals: [
      "Architecture is engaged before commitment on most material decisions, measured as % of decisions with architecture input, and EA is judged on decisions enabled and debt avoided — not artifacts produced.",
      "Governance is federated and risk-tiered: a fast/self-service path for conforming low-risk changes, the board reserved for material/novel decisions, with short cycle times and no shadow route-around.",
      "A single capability-anchored cross-domain target architecture is wired into the investment cycle, so funding is checked against it and the as-is/target gap is measurably narrowing.",
      "Standards are enforced and usable with a measured compliance rate and a live, worked-down exception register; technology diversity converges to a supported set via a directive radar.",
      "Architecture debt is measured as a trend with the rate of new non-conformance held, and reference architectures are reused (high reuse rate) so judgment scales without reviewing everything by hand.",
    ],
    redFlags: [
      "EA is measured on artifacts produced (diagrams, principles decks, reference models) rather than decisions enabled, with a low share of decisions having architecture input — the ivory-tower signature.",
      "Architecture review is one heavyweight gate with long cycle times, no risk tiering, and teams routing around it near deadlines — governance as a velocity tax breeding a shadow estate.",
      "A polished target state and roadmap disconnected from funding: low roadmap adherence, target not referenced in investment governance, and the as-is/target gap widening across cycles.",
      "No architecture-debt or conformance measure: no compliance rate, no exception register (or one that only grows), rising technology diversity and EOL/off-radar share, and change estimates inflating with no named cause.",
      "Significant commodity capabilities built bespoke with no documented build-vs-buy TCO case, and a backlog dominated by maintaining custom systems that would have been cheaper to buy.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Enterprise architecture / modeling platforms (LeanIX, Mega HOPEX, BiZZdesign, Ardoq, Avolution)",
        category: "Architecture repository, capability mapping, target-state modeling, and conformance",
        switchingCost:
          "High — the curated architecture model (capabilities, applications, technologies, dependencies, target-state and conformance history) is the asset; migrating it is a re-modeling program, not a flip, and the model underpins every governance decision.",
        renewalDynamics:
          "Per-user or per-application/object subscription; the negotiation is scoping to the estate actually modeled and proving the tool drives real decisions and conformance, not shelfware modeling that no one decides with.",
      },
      {
        vendorName: "IT financial management / TBM (Apptio, ServiceNow ITFM)",
        category: "Per-technology and per-capability TCO for target-state and build-vs-buy decisions",
        switchingCost:
          "High — fused to the cost taxonomy, allocations, and financial feeds; the maintained cost model underpins target-state, convergence, and build-vs-buy cases, so re-platforming it is a multi-quarter program.",
        renewalDynamics:
          "Enterprise platform agreement; value is in the maintained cost model — negotiate against the convergence and avoided-investment decisions it actually informs, not the modeling itself.",
      },
      {
        vendorName: "Strategic portfolio management / investment governance (Planview, ServiceNow SPM, Apptio Targetprocess)",
        category: "Investment decision and roadmap governance — the join between architecture and where money is committed",
        switchingCost:
          "Moderate-to-high — the decision history, roadmap, and investment workflow fuse to the platform; switching loses the traceability that proves architecture was engaged at decision time.",
        renewalDynamics:
          "Per-seat or enterprise subscription; negotiate on the integration to the EA model and investment cycle (so architecture engagement is provable), not on workflow features alone.",
      },
      {
        vendorName: "Architecture / technology-strategy advisory and SI partners (and analyst radar subscriptions)",
        category: "Target-state and technology-strategy advisory, reference architectures, and radar inputs",
        switchingCost:
          "Low-to-moderate — advisory engagements switch readily, but a target state or radar fully outsourced to an advisor without internal ownership erodes the moment the engagement ends.",
        renewalDynamics:
          "Fixed-bid or retainer for advisory, subscription for analyst radar/research; the trap is buying a target-state deck or radar the internal function does not own and cannot sustain — gate on internalization.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the curated architecture MODEL itself — the " +
      "capability map, target state, standards catalog, and conformance history " +
      "in the EA repository, fused to the TBM cost model and the investment " +
      "governance system. The honest risk is the inverse of a tool problem: an " +
      "expensively modeled estate that drives no decisions is the larger waste " +
      "than any switching cost. Outsourcing the target state or radar to an " +
      "advisor trades a tooling dependency for a worse one — an architecture the " +
      "internal function neither owns nor can sustain. Negotiating room is in " +
      "scoping tools to the estate actually modeled-and-decided-with, integration " +
      "to the investment cycle (so engagement is provable), object/model " +
      "portability, and gating advisory spend on internal ownership, not on a " +
      "delivered deck.",
    negotiationLevers: [
      "Scope EA-repository and TBM licensing to the estate actually modeled AND decided with, not to object count — kills shelfware modeling spend that drives no decisions",
      "Require model/object portability and export so the curated architecture model is not hostage to the platform",
      "Tie investment-governance and EA-tool value to provable architecture engagement at decision time (the % decisions with architecture input), not to workflow or modeling features",
      "Gate architecture/technology-strategy advisory on INTERNALIZATION — a target state or radar the internal function owns and sustains, not a delivered deck that decays when the engagement ends",
      "Negotiate analyst radar/research against the adoption and avoided-investment decisions it informs, and avoid letting external hype drive the radar over estate fit",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      architecture_influence_claim: [
        "investment/governance decision records cross-referenced to architecture engagement",
        "specific decisions traceable to architecture input (ADR or decision log)",
        "engagement BEFORE commitment, not after-the-fact review",
      ],
      standards_compliance_claim: [
        "standards catalog reconciled to the estate (APM/CMDB tagging)",
        "live exception register with owner and remediation path",
        "a measured compliance rate, not a 'we have standards' assertion",
      ],
      architecture_debt_claim: [
        "exception/non-conformance backlog sized against change capacity",
        "technology-diversity and integration-complexity inventory per category",
        "read as a TREND (rate of accrual vs work-down), not a snapshot",
      ],
      convergence_savings_claim: [
        "per-technology / per-capability TCO model",
        "specific platforms/technologies actually retired or converged (not a target model)",
        "net of convergence give-back and integration drag",
      ],
      build_vs_buy_claim: [
        "documented fully-loaded TCO comparison including perpetual build-ownership",
        "real differentiation assessment (not 'not-invented-here')",
        "post-implementation realization vs the original case where available",
      ],
      value_projection: [
        "baseline metric (compliance, diversity, debt rate, roadmap adherence)",
        "benchmark planning-range",
        "explicit haircut factors (influence gap, standards non-adoption, convergence drag, debt re-accrual)",
      ],
    },
    citationStandard:
      "Architecture-value claims cite DECISIONS enabled and debt avoided, not " +
      "artifacts produced — influence is evidenced by investment/decision records " +
      "showing architecture engaged before commitment, never by a count of " +
      "diagrams or principles decks. Standards-compliance claims cite a measured " +
      "rate reconciled to the estate and a live exception register, never a " +
      "published catalog. Architecture-debt claims cite a TREND (rate of accrual " +
      "vs work-down), not a snapshot. Convergence savings are booked only against " +
      "platforms/technologies actually retired or converged with TCO verified, " +
      "never against a target-state model alone. Build-vs-buy claims cite a " +
      "fully-loaded TCO comparison (including perpetual build-ownership) and, where " +
      "available, post-implementation realization. Value projections cite a " +
      "baseline plus a labelled planning range and the haircut factors applied " +
      "(influence gap, standards non-adoption, convergence drag, debt re-accrual) " +
      "— never a single asserted ROI, and never an artifact count or a 'modern " +
      "target state' label presented as the architecture business case.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no measured compliance, no exception register, or no current architecture model — frame compliance, technology diversity, redundancy, and debt as industry planning ranges, not their measured numbers.",
      "Architecture value is requested as a dollar figure from artifacts or a target-state model — model the opportunity but flag that EA value realizes as decisions influenced and debt avoided, not artifacts produced, and convergence books only when platforms are actually retired.",
      "A transformation roadmap or target state is presented as a plan — hedge the value against the influence gap (is architecture in the room when money is committed?) and the as-is/target gap, which most programs widen rather than close.",
      "A standards or governance program is pitched as 'more control' — hedge against the velocity-tax and route-around failure mode, and surface the federated, risk-tiered alternative.",
      "Vendor- or advisor-reported architecture/radar maturity or savings are cited — mark as vendor/advisor claims pending tenant validation against provable decision influence, measured compliance, and realized convergence.",
    ],
    inferenceLanguage: [
      "Across large-enterprise estates, technology diversity per capability category and EOL/off-radar tails typically run...",
      "Without your measured compliance rate and current architecture model, the industry pattern suggests standards adherence and architecture-debt levels of...",
      "Peer architecture functions at this scale commonly realize... of decisions with architecture input before convergence and governance discipline take hold",
      "This is a modeled architecture-value opportunity, not realized value — value books as decisions influenced and platforms actually converged, which your data hasn't yet shown.",
    ],
    flagWithoutEvidence: [
      "A specific dollar value for this tenant's enterprise-architecture or technology-strategy program",
      "This tenant's actual standards compliance rate, technology diversity, architecture debt, redundant-capability count, or roadmap adherence",
      "A claim that architecture was engaged before commitment on this tenant's material decisions (influence), versus consulted after the fact",
      "A claim that a redundant capability or off-standard technology here has actually been converged/retired, versus targeted in a model",
      "A claim that architecture debt here has been durably reduced (rate of new non-conformance held), versus dipped once",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "technology radar (adopt / trial / hold / retire by capability category)",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Technologies plotted by capability category against radar ring (adopt/trial/hold/retire), colored by support-lifecycle status, so sprawl, off-radar adoption, and EOL exposure are visible at once.",
    },
    {
      questionPattern: "architecture-value bridge (modeled opportunity to realized, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from modeled architecture-value opportunity to realized value (run-cost convergence + change-cost reduction + avoided investment), showing each haircut (influence gap, standards non-adoption, convergence drag, debt re-accrual).",
    },
    {
      questionPattern: "which haircut bites hardest / architecture-value sensitivity",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of the influence gap, standards non-adoption, convergence execution drag, and architecture-debt re-accrual on realized architecture value.",
    },
    {
      questionPattern: "as-is to target-state roadmap (transition waves over time)",
      exhibitKind: "chart",
      chartKind: "swimlane",
      chartBuilder: "swimlane",
      note: "Swimlane of target-state transition waves across business/application/data/technology domains over time, tied to the investment cycle, so the as-is/target gap closure and funding alignment are legible.",
    },
    {
      questionPattern: "enterprise-architecture health scorecard",
      exhibitKind: "table",
      note: "Standards compliance %, technology diversity index, reference-architecture reuse %, review cycle time, % decisions with architecture input, architecture-debt ratio (trend), redundant-capability count, % EOL/off-radar, capability coverage, roadmap adherence, build-vs-buy realization vs planning ranges.",
    },
    {
      questionPattern: "cross-domain capability & redundancy map (who serves what, where it overlaps)",
      exhibitKind: "graph",
      note: "Capability-to-application/technology map with dependencies, highlighting redundant capability, off-standard technology, and cross-domain integration coupling, so convergence targets and the cross-domain target state are visible.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "EA is measured on decisions enabled and debt avoided, and is engaged BEFORE commitment on material decisions — influence at decision time, not after-the-fact review of artifacts",
      "Governance is federated and risk-tiered (fast/self-service for conforming low-risk changes, board for material/novel) so it enables velocity rather than taxing it",
      "A single capability-anchored cross-domain target architecture is wired into the investment cycle, so funding is checked against it and the as-is/target gap narrows",
      "Standards are enforced and usable (embedded in reference architectures and the delivery path, with a live worked-down exception register) and a directive radar converges technology diversity",
      "Architecture debt is governed as a rate (held, not just dipped) and reference architectures are reused, so architecture judgment scales without reviewing everything by hand",
    ],
    failureDrivers: [
      "Ivory-tower EA — complete artifacts (diagrams, principles, reference models) disconnected from how investment is decided, so delivery teams route around them and standards go unfollowed",
      "Governance as a velocity tax — one heavyweight gate, long cycle times, no risk tiering — that teams bypass under deadline pressure, breeding a shadow estate",
      "A target state and roadmap disconnected from the funding cycle, so investment proceeds off-target and the as-is/target gap widens year over year",
      "Architecture debt left invisible — no compliance measure, no exception register, sprawl and off-radar adoption unchecked — until integration grinds and change becomes unaffordable",
      "The build reflex and domain silos — bespoke commodity systems with no build-vs-buy case, and domains optimized separately into redundancy and integration sprawl",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Federated governance, a usable standards/reference library, and a current " +
      "architecture model adopt first where EA tooling and a capability map " +
      "already exist — architecture can be in the room for material decisions " +
      "within a quarter or two. Influence on decisions (build-vs-buy discipline, " +
      "redundant platforms not bought, off-radar adoption gated) follows as the " +
      "investment cycle routes through architecture — gated less by tooling than " +
      "by the executive backing to make architecture engagement non-optional. " +
      "Realized convergence value (rationalizing redundant capability and " +
      "technology diversity) adopts last and slowest, gated by execution and " +
      "integration lock-in. The decisive factor is whether architecture is " +
      "mandated into investment governance and measured on decisions enabled — " +
      "without that, the function produces a complete target state that steers " +
      "nothing, the ivory-tower trap.",
    roiClarity: "medium",
    roiClarityBasis:
      "ROI clarity is genuinely harder here than in execution disciplines because " +
      "EA's value is INDIRECT — it shows up as better decisions and avoided debt " +
      "(a redundant platform not bought, a build averted, a migration sequenced), " +
      "which are counterfactuals that are hard to attribute and easy to dismiss. " +
      "It earns MEDIUM, not low, because the discipline that makes it legible " +
      "exists: book value as decisions influenced (provable from investment " +
      "records), convergence savings against platforms actually retired with TCO " +
      "verified, and avoided investment traced to specific gated decisions — and " +
      "refuse to count artifacts produced as value. It does not reach high " +
      "because the influence gap is real (much modeled value never realizes if " +
      "architecture is not in the room when money is committed), convergence " +
      "execution and integration lock-in erode the case, and architecture-debt " +
      "avoidance is a rate that re-accrues unless governance holds it. The honest " +
      "framing is that EA's clearest ROI is avoided cost and better decisions, " +
      "never a developer-velocity claim or a 'modern target state' label.",
  },

  regulatoryFrame: {
    name: "Enterprise-architecture governance: resilience/security-by-design, data architecture & residency, technology-lifecycle, and AI-system architecture constraints",
    relevance:
      "The dominant cross-cutting frame for enterprise architecture and technology " +
      "strategy: resilience, concentration-risk, and security-by-design " +
      "expectations (e.g. DORA, NIS2, regulator IT-resilience rules) constrain " +
      "target-state and technology-diversity choices; data-domain architecture, " +
      "integration patterns, and platform/cloud choices are constrained by " +
      "privacy, residency, and sovereignty (GDPR/CCPA and data-sovereignty rules); " +
      "end-of-life/off-radar technology carries security and audit exposure that " +
      "the radar's hold/retire rings and lifecycle policy partly exist to govern; " +
      "and emerging AI-system architecture frameworks (EU AI Act, NIST AI RMF) " +
      "shape reference architectures and the radar for AI platforms. EA's standards " +
      "and target state must encode these constraints rather than treat them as " +
      "external (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
