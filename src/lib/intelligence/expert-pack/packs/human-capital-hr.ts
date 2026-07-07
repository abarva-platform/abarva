// Consilium expert — Human Resources & People / Human Capital (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key: the STRATEGIC
// people/human-capital function that runs across every business. It covers
// talent acquisition, talent management & succession, total rewards/
// compensation, workforce planning, learning & development, employee
// experience & engagement, HR business partnering, and DEI.
//
// Boundary discipline. This expert is DISTINCT from two neighbours it is often
// confused with: (1) Back-Office Shared Services — the transactional HR ops /
// payroll / case-management engine that PROCESSES people transactions (a
// separate expert); and (2) Future of Work — the GenAI workforce-productivity
// expert that asks how each role gets work done faster (a separate expert).
// This pack owns the STRATEGY of the workforce: who you hire, how you pay,
// grow, retain, and succession-plan the people — not the rails that run payroll
// nor the productivity uplift of GenAI tools.
//
// Honesty doctrine. People-program ROI is genuinely hard to attribute; manager
// capability is the gate on almost every people outcome (a great policy dies in
// a weak manager's hands); and engagement/retention are LAGGING indicators that
// move quarters after the cause. This expert refuses to promise a clean dollar
// return on an engagement survey, insists on regrettable-vs-total attrition
// distinctions, and treats benchmarks as planning ranges, not measured truth.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const humanCapitalHrExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.human-capital-hr",
    expertName: "Human Capital & People Strategy Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "human-capital-hr",
    scopeNote:
      "Horizontal across every function and industry: the STRATEGIC people / " +
      "human-capital function — talent acquisition, talent management & " +
      "succession, total rewards / compensation, workforce planning, learning & " +
      "development, employee experience & engagement, HR business partnering, " +
      "and DEI. Owns who the firm hires, how it pays, grows, retains, and " +
      "succession-plans its people, and the manager capability that gates all of " +
      "it. Excludes transactional HR operations / payroll / case management " +
      "(that is the Back-Office Shared Services expert) and GenAI workforce " +
      "productivity / role-redesign uplift (that is the Future of Work expert). " +
      "Honest by design about people-program ROI attribution, the manager " +
      "execution gate, and engagement/retention being lagging indicators.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "voluntary_attrition_rate",
        name: "Voluntary attrition rate",
        definition:
          "Share of employees who leave voluntarily over a period, annualized — " +
          "the headline turnover signal before regrettable/non-regrettable split.",
        unit: "% (annualized)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8,
          high: 18,
          basis:
            "Cross-industry voluntary turnover; varies widely by sector, labor " +
            "market tightness, and job family (frontline vs professional)",
          label: "planning-range",
        },
        dataSource:
          "HRIS termination records (reason-coded voluntary) over average headcount",
        whyItMatters:
          "The cost-and-capability drain everyone watches, but it is a blunt " +
          "instrument until split into regrettable vs non-regrettable — losing " +
          "low performers is not the same problem as losing your best people.",
      },
      {
        key: "regrettable_attrition_rate",
        name: "Regrettable attrition rate",
        definition:
          "Share of voluntary leavers the organization wanted to keep " +
          "(high performers, critical-skill, high-potential), as a rate over " +
          "headcount — the turnover that actually hurts.",
        unit: "% (annualized)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4,
          high: 10,
          basis:
            "Regrettable share of voluntary attrition once performance/criticality " +
            "coding is applied; many firms cannot compute it at all",
          label: "planning-range",
        },
        dataSource:
          "HRIS terminations joined to performance rating, criticality flag, and manager attestation",
        whyItMatters:
          "The honest retention metric. Total attrition can look fine while the " +
          "firm quietly bleeds its best people; regrettable attrition isolates the " +
          "loss that degrades capability and is worth paying to prevent.",
      },
      {
        key: "time_to_fill",
        name: "Time to fill",
        definition:
          "Median elapsed days from job requisition opening (or approval) to " +
          "accepted offer, by job family and level.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Median req-to-accept across roles; senior/specialized and " +
            "regulated roles run materially longer",
          label: "planning-range",
        },
        dataSource: "ATS requisition timestamps (open → offer accepted)",
        whyItMatters:
          "The speed of the talent supply chain — long fills mean vacant " +
          "capacity, overloaded teams, and lost candidates; but speed traded " +
          "against quality of hire is a false economy.",
      },
      {
        key: "quality_of_hire",
        name: "Quality of hire",
        definition:
          "A composite of new-hire performance, ramp-to-productivity, and " +
          "first-year retention — how good the people you actually hired turn out " +
          "to be, not just how fast or cheaply you hired them.",
        unit: "index / composite score",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis:
            "Composite quality-of-hire indices where firms track post-hire " +
            "performance and early retention; methodology varies, so treat as directional",
          label: "planning-range",
        },
        dataSource:
          "Performance ratings + ramp/productivity milestones + 1-year retention for hire cohorts, joined to ATS source",
        whyItMatters:
          "The outcome that makes recruiting matter — a fast cheap fill that " +
          "underperforms or leaves in a year destroys more value than a slow one. " +
          "It is the metric most firms claim and fewest actually measure rigorously.",
      },
      {
        key: "internal_fill_rate",
        name: "Internal fill rate (internal mobility)",
        definition:
          "Share of open roles filled by internal candidates (promotion or " +
          "lateral move) rather than external hires — the build-vs-buy signal for talent.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25,
          high: 50,
          basis:
            "Internal-fill share of total hires; strong talent-marketplace " +
            "programs push the upper end, weak career architecture the lower",
          label: "planning-range",
        },
        dataSource: "ATS/HRIS hire records flagged internal vs external",
        whyItMatters:
          "Internal mobility lowers hiring cost and risk, retains institutional " +
          "knowledge, and is itself a retention lever — people who see a path stay. " +
          "A low rate signals weak career architecture or hoarding managers.",
      },
      {
        key: "engagement_enps",
        name: "Employee engagement / eNPS",
        definition:
          "Engagement index or employee net-promoter score from the engagement " +
          "survey — the perceived experience that precedes discretionary effort " +
          "and retention.",
        unit: "eNPS (-100 to +100) / engagement %",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Knowledge-and-frontline workforce eNPS ranges; highly sensitive to " +
            "industry, tenure mix, and recent change events",
          label: "planning-range",
        },
        dataSource: "Engagement / experience platform survey, segmented by org and tenure",
        whyItMatters:
          "The leading-ish read on culture and intent to stay — but it is a " +
          "perception, it lags causes by quarters, and it predicts retention only " +
          "loosely; treat it as a directional signal, never as a guaranteed ROI lever.",
      },
      {
        key: "span_of_control",
        name: "Span of control",
        definition:
          "Average number of direct reports per people-manager — the structural " +
          "read on layers, manager load, and whether managers have room to manage.",
        unit: "direct reports per manager",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 6,
          high: 10,
          basis:
            "Healthy span for managers expected to develop and coach; too narrow " +
            "= excess layers, too wide = no time to manage",
          label: "planning-range",
        },
        dataSource: "HRIS org structure (manager-to-report relationships)",
        whyItMatters:
          "Both extremes are expensive: narrow spans build costly layers and " +
          "bureaucracy; over-wide spans mean managers cannot coach, which is the " +
          "single biggest gate on engagement, development, and execution.",
      },
      {
        key: "total_rewards_competitiveness",
        name: "Total-rewards competitiveness (compa-ratio / market position)",
        definition:
          "Position of total compensation against the relevant market — typically " +
          "compa-ratio to midpoint or percentile of market for benchmark roles.",
        unit: "compa-ratio (1.0 = midpoint) / market percentile",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 0.95,
          high: 1.05,
          basis:
            "Compa-ratio band around market midpoint for a competitive-but-" +
            "sustainable position; intentional lead/lag by segment shifts the target",
          label: "planning-range",
        },
        dataSource:
          "Compensation benchmarking survey data matched to internal pay by job/level/geo",
        whyItMatters:
          "Pay position drives offer-accept and regrettable attrition at the " +
          "margins, but more pay rarely fixes a manager or culture problem; the " +
          "honest read is whether pay is a cause of loss before reaching for it as a fix.",
      },
      {
        key: "succession_coverage_critical_roles",
        name: "Succession coverage for critical roles",
        definition:
          "Share of designated critical/key roles with at least one ready-now or " +
          "ready-soon identified successor — the resilience of leadership and " +
          "scarce-skill continuity.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 80,
          basis:
            "Critical-role coverage with a credible (not nominal) successor; " +
            "'ready-now' depth is usually far thinner than nominal coverage",
          label: "planning-range",
        },
        dataSource:
          "Talent-review / succession module: critical-role list with named, rated successors",
        whyItMatters:
          "The continuity-risk metric the board cares about. Thin coverage on " +
          "critical roles is an unhedged single point of failure; nominal coverage " +
          "(a name with no real readiness) is a comforting illusion.",
      },
      {
        key: "ld_completion_rate",
        name: "Learning & development completion rate",
        definition:
          "Share of assigned/targeted L&D (skill, leadership, compliance, role) " +
          "completed to the defined bar within the period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 90,
          basis:
            "Completion in funded programs; completion is a participation proxy, " +
            "not capability — capability requires applied-on-the-job evidence",
          label: "planning-range",
        },
        dataSource: "LMS completion records by program and audience",
        whyItMatters:
          "A lead indicator for capability and a compliance must-have, but " +
          "completion ≠ competence — high completion with no behavior change is " +
          "training theater; pair it with applied-skill evidence to mean anything.",
      },
      {
        key: "offer_accept_rate",
        name: "Offer acceptance rate",
        definition:
          "Share of extended offers that candidates accept — the read on offer " +
          "competitiveness, candidate experience, and employer brand at the close.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 92,
          basis:
            "Offer-accept across roles; competitive/senior and hot-skill roles " +
            "run lower, frontline higher",
          label: "planning-range",
        },
        dataSource: "ATS offer records (extended vs accepted)",
        whyItMatters:
          "A falling accept rate is an early warning that pay, brand, speed, or " +
          "candidate experience is off-market — caught here, it is cheaper to fix " +
          "than after it shows up as missed hires and longer time-to-fill.",
      },
      {
        key: "high_potential_retention",
        name: "High-potential / critical-talent retention",
        definition:
          "Retention rate of employees flagged high-potential or critical-skill " +
          "over a period — the survival rate of the talent the future depends on.",
        unit: "% retained (annualized)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 95,
          basis:
            "Retention of identified hi-po / critical-skill populations; below " +
            "this band signals the bench is eroding faster than it is built",
          label: "planning-range",
        },
        dataSource:
          "HRIS retention for the hi-po / critical-talent flagged population vs the general population",
        whyItMatters:
          "The forward-looking complement to succession coverage — losing the " +
          "people you were grooming for critical roles quietly hollows out the " +
          "pipeline before the gap ever shows on a succession chart.",
      },
    ],

    painThemes: [
      {
        key: "regrettable_attrition_blind",
        name: "Flying blind on regrettable attrition",
        description:
          "The firm tracks total turnover but cannot tell good leavers from bad — " +
          "no performance/criticality coding — so it either panics over healthy " +
          "churn or stays calm while its best people walk out.",
        detectionSignal:
          "Turnover reported as a single headline number; no regrettable split; " +
          "no link between exits and performance ratings or criticality flags.",
        diagnosticQuestion:
          "Can you split voluntary attrition into regrettable vs non-regrettable, " +
          "and what is your regrettable rate in critical and high-performer populations?",
      },
      {
        key: "manager_capability_gate",
        name: "Manager capability is the unfixed gate",
        description:
          "Engagement, retention, development, and execution all funnel through " +
          "people-managers, yet managers are promoted for technical skill, given " +
          "wide spans, and never built — so good people-programs die at the manager.",
        detectionSignal:
          "Engagement and attrition vary far more by manager than by policy; no " +
          "manager-quality measure; first-time managers with large spans and no enablement.",
        diagnosticQuestion:
          "How much of your engagement and attrition variance is explained by " +
          "manager, and what is your manager span and capability-build investment?",
      },
      {
        key: "succession_illusion",
        name: "Succession on paper only",
        description:
          "Critical roles show coverage on the chart, but the named successors are " +
          "not actually ready, not being developed, and would not be moved if the " +
          "seat opened tomorrow — comfort without resilience.",
        detectionSignal:
          "High nominal coverage but near-zero 'ready-now'; successors unaware or " +
          "undeveloped; same names listed against multiple roles.",
        diagnosticQuestion:
          "Of your critical-role successors, how many are genuinely ready-now with " +
          "an active development plan, and how many are names on a slide?",
      },
      {
        key: "pay_as_blunt_instrument",
        name: "Reaching for pay to fix non-pay problems",
        description:
          "Retention and engagement gaps caused by manager, role, or culture get " +
          "answered with comp increases and retention bonuses, which buys time at " +
          "high cost without addressing the cause — and resets expectations.",
        detectionSignal:
          "Rising spot bonuses / off-cycle raises with flat engagement; exits " +
          "citing manager/growth, not pay; comp spend up, regrettable attrition flat.",
        diagnosticQuestion:
          "For your recent regrettable exits, what did they actually cite — and " +
          "how often is the response a pay action rather than the named root cause?",
      },
      {
        key: "engagement_survey_theater",
        name: "Engagement survey theater (measure, don't act)",
        description:
          "An annual survey is run, scores are reported, and little changes before " +
          "the next cycle — so employees learn that feedback is performative, " +
          "response rates and trust erode, and the lagging signal lags even more.",
        detectionSignal:
          "Survey run annually with no closed-loop action plans; declining " +
          "response rates; managers without their own results or accountability.",
        diagnosticQuestion:
          "After your last engagement survey, what concrete actions were taken " +
          "and owned by managers, and how do employees know their input changed anything?",
      },
      {
        key: "skills_gap_no_architecture",
        name: "Skills gaps with no skills architecture",
        description:
          "The firm cannot say what skills it has, needs, or is losing, because " +
          "there is no job/skills architecture — so workforce planning, internal " +
          "mobility, and reskilling are all guesswork.",
        detectionSignal:
          "No skills taxonomy or job architecture; internal fill rate low; " +
          "reskilling decided ad hoc; workforce plan is a headcount budget, not a skills plan.",
        diagnosticQuestion:
          "Do you have a maintained skills/job architecture, and can you state " +
          "your top skill surpluses and shortages against your strategy?",
      },
      {
        key: "roi_attribution_fog",
        name: "People-program ROI attribution fog",
        description:
          "People investments (L&D, engagement, DEI, rewards) are real but their " +
          "payoff is diffuse, lagging, and confounded by market and business " +
          "factors — so programs are funded on faith and cut on the same faith.",
        detectionSignal:
          "Program value claimed with no baseline or counterfactual; benefits " +
          "asserted as causal from correlated lagging indicators; finance unconvinced.",
        diagnosticQuestion:
          "For your major people investments, what is the baseline, the lagging " +
          "horizon, and how do you separate the program's effect from market/business factors?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "attrition_risk_prediction",
        name: "Attrition / flight-risk prediction",
        valueMechanism:
          "Model regrettable-attrition risk from HRIS, engagement, pay-position, " +
          "tenure, and manager signals so HR business partners and managers can " +
          "intervene with the right lever BEFORE the best people resign — turning " +
          "retention from reactive counter-offers into targeted prevention.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clean HRIS history with reason-coded, regrettable-flagged terminations",
          "Engagement, pay-position, and performance signals joined at the person level",
          "Manager/org structure to localize risk and route intervention",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Predictions guide human conversations — never trigger automated adverse action",
          "High bias/fairness risk on a protected-class-adjacent population; audit for disparate impact",
          "Treat scores as directional flight-risk signals, not deterministic labels on people",
        ],
        metricsMoved: [
          "regrettable_attrition_rate",
          "high_potential_retention",
          "voluntary_attrition_rate",
        ],
      },
      {
        key: "talent_acquisition_copilot",
        name: "Talent-acquisition copilot (sourcing, screening assist, scheduling)",
        valueMechanism:
          "Assist recruiters with sourcing, JD drafting, resume summarization, and " +
          "interview scheduling/logistics so the talent supply chain moves faster " +
          "and candidate experience improves — compressing time-to-fill while " +
          "keeping the hiring decision with humans.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "ATS data with consistent stage timestamps and structured requisitions",
          "Job/skills definitions for matching and JD generation",
          "Candidate-consent and data-handling configuration",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Automated screening/ranking is high regulatory risk (EEOC/AI hiring law, EU AI Act high-risk)",
          "Bias-audit and explainability are often legally required before any ranking use",
          "Keep humans accountable for advance/reject; copilot drafts and organizes, it does not decide",
        ],
        metricsMoved: [
          "time_to_fill",
          "offer_accept_rate",
          "quality_of_hire",
        ],
      },
      {
        key: "internal_talent_marketplace",
        name: "Internal talent marketplace & skills matching",
        valueMechanism:
          "Match employees to internal roles, gigs, and development based on a " +
          "skills graph so more openings are filled internally — raising internal " +
          "fill rate, lowering hiring cost/risk, and giving people the visible path " +
          "that itself reduces regrettable attrition.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A maintained skills/job architecture and inferred employee skill profiles",
          "Open-role and gig inventory wired to the marketplace",
          "Manager-mobility norms that don't block internal moves (hoarding control)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Skill inference can be wrong or stale — let employees correct their profiles",
          "Guard against entrenching existing patterns (equity in who gets surfaced)",
          "Managers and employees own the move decision; the match is a recommendation",
        ],
        metricsMoved: [
          "internal_fill_rate",
          "high_potential_retention",
          "ld_completion_rate",
        ],
      },
      {
        key: "manager_coaching_assistant",
        name: "Manager coaching & people-leadership assistant",
        valueMechanism:
          "Give people-managers in-flow guidance — feedback drafting, 1:1 prep, " +
          "development-plan support, difficult-conversation coaching — to lift the " +
          "manager-capability gate that bounds engagement, development, and " +
          "retention across the whole organization.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Manager-team context (within strict privacy boundaries)",
          "Competency/leadership frameworks to ground the coaching",
          "Engagement and team signals to target where coaching helps most",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Highly sensitive employee data — strict access control and purpose limitation",
          "Guidance must support, not script, the manager; over-reliance erodes real skill",
          "Never let it generate performance/discipline content that bypasses HR review",
        ],
        metricsMoved: [
          "engagement_enps",
          "regrettable_attrition_rate",
          "span_of_control",
        ],
      },
      {
        key: "compensation_intelligence",
        name: "Compensation & pay-equity intelligence",
        valueMechanism:
          "Continuously benchmark pay position and surface pay-equity gaps and " +
          "off-market roles so total rewards is competitive where it matters and " +
          "defensible where it is examined — targeting comp spend at genuine " +
          "retention/attraction risk instead of across-the-board.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Market benchmarking data matched to internal job/level/geo",
          "Internal comp data with demographic fields for equity analysis (governed)",
          "Performance and attrition signals to target spend",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Pay-equity analysis is legally and reputationally sensitive — privilege/legal review",
          "Benchmark matching errors propagate into bad pay decisions; validate job matching",
          "Comp decisions stay with reward partners and management, not the model",
        ],
        metricsMoved: [
          "total_rewards_competitiveness",
          "offer_accept_rate",
          "regrettable_attrition_rate",
        ],
      },
      {
        key: "personalized_learning_pathways",
        name: "Personalized learning & skills-development pathways",
        valueMechanism:
          "Recommend role- and skill-relevant learning tied to the skills " +
          "architecture and career goals so development is targeted and applied " +
          "rather than generic — raising completion that actually maps to " +
          "capability and feeding the internal mobility pipeline.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Skills architecture and employee skill profiles",
          "LMS content tagged to skills and roles",
          "Career-path and aspiration data (employee-provided)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Recommendations can narrow rather than broaden growth — keep exploration open",
          "Completion is a proxy; pair with applied-skill evidence to claim capability",
          "Avoid using learning data for evaluation in ways employees didn't consent to",
        ],
        metricsMoved: [
          "ld_completion_rate",
          "internal_fill_rate",
          "succession_coverage_critical_roles",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "regrettable_attrition_intelligence",
        name: "Regrettable-attrition intelligence & retention play system",
        description:
          "A measurement-plus-action pattern that codes every exit as regrettable " +
          "or not (performance × criticality), tracks regrettable and hi-po/" +
          "critical retention as the headline, surfaces flight risk, and routes a " +
          "matched retention play to the manager/HRBP — replacing blunt turnover " +
          "reporting with targeted prevention.",
        boundary:
          "Owns the regrettable taxonomy, the risk signal, and the play library; " +
          "does not own the retention decision itself (manager/HRBP) nor the comp " +
          "budget that may fund a play.",
        humanAccountabilityPoint:
          "Chief Human Resources Officer (with HR business partners owning the play execution)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "skills_job_architecture",
        name: "Skills & job architecture (the talent data spine)",
        description:
          "A maintained taxonomy of jobs, levels, and skills that becomes the " +
          "spine for workforce planning, internal mobility, learning, succession, " +
          "and pay — without it, every other people-program runs on guesswork. " +
          "Includes inferred employee skill profiles kept current and correctable.",
        boundary:
          "Owns the taxonomy and its maintenance; does not own the downstream " +
          "decisions (who to hire, pay, promote) — it supplies the structured " +
          "language those decisions need.",
        humanAccountabilityPoint:
          "Head of Talent Management / People Analytics (as architecture owner)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "manager_capability_engine",
        name: "Manager capability & enablement engine",
        description:
          "A standing capability that selects, builds, supports, and measures " +
          "people-managers — right-sizing span, building first-time managers, " +
          "providing in-flow coaching support, and measuring manager quality — " +
          "because the manager is the gate on engagement, development, and retention.",
        boundary:
          "Owns manager selection criteria, enablement, and the manager-quality " +
          "measure; does not own individual performance/promotion decisions or " +
          "the org-design choices that set span.",
        humanAccountabilityPoint:
          "Head of Leadership Development / Talent Management",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "talent_review_succession_cadence",
        name: "Talent review & succession cadence",
        description:
          "A disciplined recurring talent-review and succession process that " +
          "designates critical roles, assesses successors against a real readiness " +
          "bar (ready-now vs ready-soon), assigns active development, and tracks " +
          "credible coverage — turning a slide of names into managed continuity risk.",
        boundary:
          "Owns the cadence, the readiness standard, and the coverage view; does " +
          "not own the appointment decision when a seat actually opens (that is the " +
          "accountable executive's call, informed by this).",
        humanAccountabilityPoint:
          "CEO/business-unit leader for their slate, facilitated by the CHRO",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "total_rewards_equity_framework",
        name: "Total-rewards & pay-equity framework",
        description:
          "A structured rewards framework — market benchmarking, pay ranges by " +
          "job/level/geo, governed equity analysis, and a targeting model — so comp " +
          "is competitive where retention/attraction risk is real and defensible " +
          "where it is examined, rather than reactive and across-the-board.",
        boundary:
          "Owns the framework, ranges, and equity methodology; does not own " +
          "individual pay decisions (reward partners/management) or the comp budget " +
          "(finance/leadership).",
        humanAccountabilityPoint:
          "Head of Total Rewards / Compensation (with Legal for equity analysis)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Human-capital value is real but LAGGING and HARD TO ATTRIBUTE — the " +
        "honest framing. The dominant value lever is preventing regrettable and " +
        "critical-talent attrition: each avoided regrettable exit saves a large, " +
        "concrete replacement-and-ramp cost (recruiting, lost productivity, " +
        "vacancy, time-to-full-productivity) that is far more defensible than soft " +
        "engagement-to-revenue claims. Secondary value comes from internal " +
        "mobility (lower hiring cost/risk, retained knowledge) and faster, " +
        "higher-quality hiring (vacant-capacity recovered, fewer bad hires). The " +
        "chain is gated at every step by manager capability — a great policy in a " +
        "weak manager's hands realizes little — and the headline is haircut by " +
        "attribution uncertainty (people outcomes move for market and business " +
        "reasons too), the lag between cause and lagging-indicator response, the " +
        "manager-execution gate, and the difference between nominal and real " +
        "readiness/competence. The discipline is to anchor value on the hard, " +
        "countable lever (regrettable replacement cost avoided) and treat " +
        "engagement/DEI/L&D returns as enabling and directional, never as a " +
        "promised dollar ROI.",
      dominantHaircutFactors: [
        {
          factor: "Attribution uncertainty (lagging, confounded outcomes)",
          rationale:
            "Retention and engagement move for labor-market, business, and " +
            "personal reasons at once; without a baseline or counterfactual, the " +
            "people-program's true share of any improvement is uncertain.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Counterfactual gap on diffuse, lagging people outcomes with no matched comparison",
            label: "planning-range",
          },
        },
        {
          factor: "Manager-execution gate",
          rationale:
            "Programs are delivered through people-managers; weak or overloaded " +
            "managers under-execute, so a large share of designed value never " +
            "reaches employees regardless of policy quality.",
          typicalHaircut: {
            low: 0.2,
            high: 0.4,
            basis:
              "Variance in people-outcomes explained by manager quality where capability is not built",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption / behavior-change lag",
          rationale:
            "Engagement and retention are lagging indicators; even effective " +
            "interventions take quarters to show, and value claimed too early is " +
            "discounted by the lag and by partial behavior change.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Lag between intervention and movement in lagging engagement/retention signals",
            label: "planning-range",
          },
        },
        {
          factor: "Nominal vs real readiness / competence give-back",
          rationale:
            "Succession coverage and L&D completion overstate readiness; real " +
            "ready-now depth and applied competence are thinner, so continuity and " +
            "capability value is less than the nominal numbers imply.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Gap between nominal coverage/completion and demonstrated readiness/competence",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Regrettable attrition reduction (replacement cost avoided)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Relative reduction in regrettable attrition achievable with targeted " +
              "retention play systems and manager capability, against a baseline",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in regrettable_attrition_rate × loaded replacement-and-ramp cost per role",
        },
        {
          lever: "Internal fill-rate uplift (hiring cost/risk avoided)",
          range: {
            low: 0.1,
            high: 0.25,
            basis:
              "Internal-fill uplift from a working talent marketplace and skills " +
              "architecture, vs prior external-hire mix",
            label: "planning-range",
          },
          measuredAs:
            "Increase in internal_fill_rate × external-hire cost/risk differential per role",
        },
        {
          lever: "Time-to-fill compression (vacant capacity recovered)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Time-to-fill reduction from a TA copilot and a healthier funnel, " +
              "held to a constant quality-of-hire bar",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in time_to_fill × value of recovered vacant capacity, quality held constant",
        },
      ],
      timeToValueBand:
        "Talent-acquisition copilot and offer/funnel improvements: 1-2 quarters " +
        "to measured time-to-fill and accept-rate gains. Regrettable-attrition " +
        "intelligence and targeted retention plays: 2-4 quarters to a credible " +
        "regrettable-rate signal (lagging indicator). Skills/job architecture, " +
        "internal marketplace, manager capability, and succession depth: 4-8+ " +
        "quarters — these are foundational capabilities whose value compounds " +
        "rather than lands in a single quarter.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Core HRIS / HCM",
          role: "System of record for headcount, job/level taxonomy, org structure, terminations, and the spine every people metric joins to.",
          examples: ["Workday", "SAP SuccessFactors", "Oracle HCM Cloud", "UKG"],
        },
        {
          name: "Applicant tracking system (ATS)",
          role: "Recruiting funnel of record — requisitions, candidates, stages, offers — and the source for time-to-fill, accept rate, and quality-of-hire joins.",
          examples: ["Greenhouse", "Workday Recruiting", "iCIMS", "SmartRecruiters"],
        },
        {
          name: "Talent management / talent review platform",
          role: "Performance, goals, calibration, talent review, and succession — the home of succession coverage and hi-po identification.",
          examples: ["Workday Talent", "SuccessFactors Talent", "Lattice", "Culture Amp Performance"],
        },
        {
          name: "Compensation / total-rewards & benchmarking",
          role: "Pay ranges, compa-ratio, equity analysis, and market benchmarking matched to internal jobs.",
          examples: ["Payscale", "Mercer/Radford survey data", "Workday Compensation", "Pave"],
        },
        {
          name: "Engagement / employee-experience platform",
          role: "Engagement and eNPS surveys, lifecycle and pulse feedback — the perception/experience signal.",
          examples: ["Glint", "Qualtrics EX", "Culture Amp", "Medallia EX"],
        },
        {
          name: "Learning management / talent marketplace (LMS/LXP)",
          role: "Learning assignment/completion and internal mobility matching against the skills architecture.",
          examples: ["Cornerstone", "Degreed", "Workday Learning", "Gloat", "Eightfold"],
        },
      ],
      roles: [
        {
          title: "Chief Human Resources Officer (CHRO / CPO)",
          accountability:
            "Enterprise people strategy — talent, rewards, succession, culture, and the human-capital risk the board cares about.",
        },
        {
          title: "HR Business Partner (HRBP)",
          accountability:
            "Translating people strategy into a business unit — retention plays, talent moves, manager support, and org health locally.",
        },
        {
          title: "Head of Talent Acquisition",
          accountability:
            "The talent supply chain — sourcing, candidate experience, time-to-fill, accept rate, and quality of hire.",
        },
        {
          title: "Head of Total Rewards / Compensation",
          accountability:
            "Pay competitiveness, ranges, pay equity, and targeting comp spend at genuine attraction/retention risk.",
        },
        {
          title: "Head of Talent Management & Leadership Development",
          accountability:
            "Succession, hi-po development, manager capability, the skills architecture, and the learning portfolio.",
        },
        {
          title: "People Analytics Lead",
          accountability:
            "The people-data spine, regrettable-attrition coding, and the honest baselines/attribution behind every value claim.",
        },
      ],
      regulatoryFrames: [
        {
          name: "EEO / anti-discrimination & adverse-impact (e.g. EEOC, Title VII, OFCCP)",
          relevance:
            "Governs hiring, promotion, pay, and any AI-assisted selection — adverse-impact and disparate-treatment exposure is central to people decisions.",
        },
        {
          name: "AI-in-employment law (e.g. NYC Local Law 144, EU AI Act high-risk, state AI-hiring statutes)",
          relevance:
            "Automated screening/ranking and many HR AI uses are regulated/high-risk — bias audits, notice, and explainability are increasingly mandatory.",
        },
        {
          name: "Pay-equity & pay-transparency laws",
          relevance:
            "Shape compensation analysis, range disclosure, and the defensibility of pay decisions across a growing number of jurisdictions.",
        },
        {
          name: "Employee data privacy & labor consultation (GDPR/CCPA, works councils)",
          relevance:
            "Sensitive employee data, monitoring, and people-program changes can require consent, purpose limitation, and works-council/labor consultation.",
        },
      ],
      canonicalTerms: [
        {
          term: "Regrettable vs non-regrettable attrition",
          definition:
            "Regrettable = the firm wanted to keep the leaver (performance/criticality); non-regrettable = it did not. The split that turns turnover from noise into signal.",
        },
        {
          term: "Quality of hire",
          definition:
            "A composite of post-hire performance, ramp-to-productivity, and first-year retention — how good the people you hired actually turned out to be.",
        },
        {
          term: "Span of control",
          definition:
            "Average direct reports per people-manager; both too-narrow (excess layers) and too-wide (no time to coach) are costly.",
        },
        {
          term: "Compa-ratio",
          definition:
            "Pay as a ratio to the market/range midpoint (1.0 = at midpoint); the standard read on individual and aggregate pay position.",
        },
        {
          term: "Succession readiness (ready-now / ready-soon)",
          definition:
            "Whether a named successor could step into a critical role now or after defined development — the difference between real coverage and a name on a slide.",
        },
        {
          term: "High-potential (hi-po)",
          definition:
            "An employee identified as having the ability and aspiration to grow into broader/critical roles — the population whose retention and development the pipeline depends on.",
        },
        {
          term: "Skills / job architecture",
          definition:
            "The maintained taxonomy of jobs, levels, and skills that is the data spine for planning, mobility, learning, succession, and pay.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Regrettable / critical-talent attrition",
        authoritativeSource:
          "HRIS termination records, reason-coded and joined to performance rating, criticality flag, and manager attestation",
        whatGoodEvidenceLooksLike:
          "Voluntary exits split into regrettable vs non-regrettable with a documented coding rule, segmented by performance and critical/hi-po population, over a defined period.",
        weakEvidenceToReject:
          "A single headline turnover percentage with no regrettable split, no reason coding, and no performance/criticality segmentation.",
      },
      {
        claim: "Recruiting performance (time-to-fill, accept, quality of hire)",
        authoritativeSource:
          "ATS requisition/offer timestamps and a quality-of-hire composite (post-hire performance + ramp + 1-year retention) by source",
        whatGoodEvidenceLooksLike:
          "Median time-to-fill and accept rate by job family/level, with quality-of-hire tracked for the same cohorts so speed is not read in isolation.",
        weakEvidenceToReject:
          "A blended average time-to-fill across all roles, or a 'quality of hire' claim with no post-hire performance or retention measurement behind it.",
      },
      {
        claim: "Succession coverage / readiness",
        authoritativeSource:
          "Talent-review/succession module: critical-role list with named successors rated against a documented readiness bar (ready-now / ready-soon) and active development plans",
        whatGoodEvidenceLooksLike:
          "Critical-role coverage reported as credible ready-now depth with development plans in motion, not just nominal name counts.",
        weakEvidenceToReject:
          "A nominal coverage percentage where successors are unaware, undeveloped, listed against multiple roles, or have no readiness rating.",
      },
      {
        claim: "People-program value / ROI",
        authoritativeSource:
          "A baseline, a defined lagging horizon, and where possible a matched/cohort comparison, with replacement-and-ramp cost models reconciled with Finance",
        whatGoodEvidenceLooksLike:
          "Value anchored on a hard countable lever (e.g. regrettable exits avoided × loaded replacement cost) net of attribution and manager-gate haircuts, with the lag stated.",
        weakEvidenceToReject:
          "A causal dollar ROI asserted from an engagement-score-to-revenue correlation, or a benefit claimed with no baseline, lag horizon, or counterfactual.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Can you split voluntary attrition into regrettable vs non-regrettable, and what are your regrettable and hi-po/critical-talent retention rates?",
      "How much of your engagement and attrition variance is explained by manager, and what is your span of control and manager-capability investment?",
      "Of your critical-role successors, how many are genuinely ready-now with an active development plan versus names on a slide?",
      "Do you have a maintained skills/job architecture, and what is your internal fill rate against external hiring?",
      "What is your time-to-fill, offer-accept rate, and how do you actually measure quality of hire after people are in seat?",
      "Where do you sit on total-rewards competitiveness, and for recent regrettable exits, did they cite pay or something pay cannot fix?",
      "After your last engagement survey, what concrete manager-owned actions were taken, and how do employees know their input changed anything?",
      "For your major people investments (L&D, engagement, DEI, rewards), what is the baseline and how do you separate the program's effect from market/business factors?",
    ],
    maturitySignals: [
      "Every exit is coded regrettable vs non-regrettable, and regrettable/critical-talent retention is the headline, not total turnover.",
      "A maintained skills/job architecture is the spine for planning, mobility, learning, succession, and pay.",
      "Manager quality is measured and built; span is in a healthy band and first-time managers are enabled, not just promoted.",
      "Succession is reviewed on a cadence with a real readiness bar and active development, not nominal name counts.",
      "People-program value is anchored on hard, countable levers (regrettable replacement cost avoided) with baselines, lag horizons, and Finance reconciliation — engagement returns are framed as directional.",
    ],
    redFlags: [
      "Turnover is reported as a single headline number with no regrettable split or performance/criticality coding.",
      "Engagement and attrition vary far more by manager than by policy, yet manager quality is unmeasured and managers carry wide spans with no enablement.",
      "Succession charts show high nominal coverage but near-zero genuinely ready-now successors with active development.",
      "Comp increases and retention bonuses are used to patch manager/role/culture problems that pay cannot fix, while regrettable attrition stays flat.",
      "People-program ROI is asserted as a causal dollar return from a lagging engagement-to-revenue correlation, with no baseline or counterfactual.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Core HCM suites (Workday, SAP SuccessFactors, Oracle HCM)",
        category: "System-of-record HCM (HRIS, talent, comp, learning modules)",
        switchingCost:
          "Very high — the HCM is the employee system of record fused to payroll, finance, and identity; re-platforming is a multi-year program.",
        renewalDynamics:
          "Multi-year enterprise agreements priced per-employee; module bundling and AI add-ons are the negotiation surface, not the core swap.",
      },
      {
        vendorName: "Best-of-breed talent point solutions (ATS, engagement, performance, marketplace)",
        category: "Recruiting, engagement, performance, talent-marketplace specialists",
        switchingCost:
          "Moderate — integration-embedded and data-rich, but generally replaceable; the cost is integration rework and historical-data migration.",
        renewalDynamics:
          "Per-seat/per-employee SaaS; crowded, consolidating market — usage and outcome-based terms and integration commitments are negotiable.",
      },
      {
        vendorName: "Compensation benchmarking & survey providers",
        category: "Market pay data, survey participation, pay-equity tooling",
        switchingCost:
          "Low-to-moderate — data subscriptions are re-sourceable, but job-matching continuity and survey participation history have value.",
        renewalDynamics:
          "Annual data subscriptions; participation often discounts price — leverage multi-survey coverage and match-quality in negotiation.",
      },
      {
        vendorName: "HR AI / people-analytics & talent-intelligence vendors",
        category: "Attrition prediction, skills inference, talent intelligence, coaching assistants",
        switchingCost:
          "Low-to-moderate — newer layer, swappable, but model lock-in grows once skills graphs and workflows embed.",
        renewalDynamics:
          "Fast-moving pricing/capability and high regulatory scrutiny — favor bias-audit support, explainability, model-portability, and exit rights.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the core HCM system of record — fused to payroll, " +
      "finance, and identity, it is a multi-year re-platform. Talent point " +
      "solutions and the HR-AI layer are far more portable, so the negotiating " +
      "frontier sits in module bundling on the suite and in integration, " +
      "bias-audit, and exit terms on the specialist and AI layers.",
    negotiationLevers: [
      "Per-employee pricing right-sized to active populations and module need, not blanket entitlement",
      "Bundle vs best-of-breed leverage — play suite AI modules against specialist incumbents",
      "Mandatory bias-audit support, explainability, and compliance attestations for any HR-AI selection",
      "Data export, model-portability, and exit rights to avoid skills-graph and history lock-in",
      "Survey participation and multi-survey coverage to discount compensation-data subscriptions",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      attrition_claim: [
        "HRIS reason-coded terminations",
        "regrettable vs non-regrettable coding rule",
        "performance/criticality segmentation",
      ],
      recruiting_claim: [
        "ATS requisition/offer timestamps",
        "quality-of-hire composite (post-hire performance + ramp + retention)",
        "segmentation by job family/level",
      ],
      succession_claim: [
        "critical-role list",
        "named successors rated against a documented readiness bar",
        "active development plans",
      ],
      compensation_claim: [
        "market benchmark matched to internal job/level/geo",
        "compa-ratio / market position",
        "governed pay-equity analysis where equity is claimed",
      ],
      value_projection: [
        "baseline metric",
        "labelled benchmark planning-range",
        "explicit haircut factors (attribution, manager gate, lag, nominal-vs-real)",
        "hard countable lever (e.g. replacement cost avoided)",
      ],
    },
    citationStandard:
      "Attrition claims cite the HRIS source, period, and whether a regrettable " +
      "coding rule was applied. Recruiting claims cite the ATS source and state " +
      "whether quality of hire was measured, not just speed. Succession claims " +
      "state the readiness bar and distinguish nominal from ready-now. Value " +
      "projections cite a baseline, a labelled planning range, the lag horizon, " +
      "and the haircut factors applied (attribution, manager gate, behavior-" +
      "change lag, nominal-vs-real) — anchored on a hard countable lever, never " +
      "a causal dollar ROI asserted from an engagement-to-revenue correlation.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no regrettable-vs-non-regrettable coding — frame retention loss as total turnover and flag that the regrettable signal is unknown.",
      "A people-program dollar ROI is requested — anchor on hard replacement-cost-avoided math and hedge engagement/DEI/L&D returns as directional, lagging, and attribution-limited.",
      "Engagement or retention movement is cited as program success — flag the lag and the confounds (market, business, manager) before attributing it to the program.",
      "Succession coverage is presented — distinguish nominal coverage from genuinely ready-now depth and hedge any continuity-risk reassurance.",
      "Pay is proposed as the retention fix — hedge that pay rarely fixes manager/role/culture causes and ask what recent regrettable exits actually cited.",
      "Only benchmark ranges (not tenant data) are available — present them as industry planning ranges, not the tenant's measured numbers.",
    ],
    inferenceLanguage: [
      "Across organizations of this profile, regrettable attrition typically runs...",
      "Without your regrettable coding, the industry pattern suggests a regrettable share of voluntary attrition of...",
      "Peer firms at this scale commonly see succession ready-now depth far below nominal coverage...",
      "This is a directional, lagging people signal — attributing it to the program requires a baseline your data hasn't yet established.",
      "Engagement-to-business-outcome links are correlational at this maturity; treat them as enabling, not as a promised dollar return.",
    ],
    flagWithoutEvidence: [
      "This tenant's regrettable attrition rate or hi-po retention rate",
      "A specific dollar ROI for this tenant's engagement, DEI, or L&D program",
      "A claim that this tenant's critical roles are genuinely succession-covered (ready-now)",
      "This tenant's actual quality of hire or pay-equity position",
      "A causal claim that a people program caused a business outcome here",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "attrition by org / where are we losing people (and which)",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Stack regrettable vs non-regrettable attrition by org/function/level to separate healthy churn from real loss.",
    },
    {
      questionPattern: "people-program value bridge / what does retention actually buy",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from gross replacement-cost-avoided to net value, showing each haircut (attribution, manager gate, lag, nominal-vs-real).",
    },
    {
      questionPattern: "which haircut bites hardest on the people-value case",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of attribution uncertainty, manager-execution gate, behavior-change lag, and nominal-vs-real readiness on realized value.",
    },
    {
      questionPattern: "talent / human-capital scorecard",
      exhibitKind: "table",
      note: "Voluntary & regrettable attrition, hi-po retention, time-to-fill, accept rate, quality of hire, internal fill, eNPS, span, total-rewards competitiveness, succession coverage, L&D completion vs planning ranges.",
    },
    {
      questionPattern: "succession coverage / continuity risk on critical roles",
      exhibitKind: "chart",
      chartKind: "heatmap",
      chartBuilder: "heatmap",
      note: "Heatmap of critical roles × successor readiness (ready-now/ready-soon/none) to expose nominal-vs-real coverage and single points of failure.",
    },
    {
      questionPattern: "attrition / engagement trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend regrettable attrition and engagement/eNPS to read these lagging indicators against intervention timing.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Every exit is coded regrettable vs non-regrettable so effort targets the loss that actually hurts",
      "Manager capability is measured and built — the gate on engagement, development, and retention is addressed directly",
      "A maintained skills/job architecture gives planning, mobility, learning, and succession a real data spine",
      "Succession is run on a cadence with a genuine ready-now bar and active development, not nominal names",
      "People-program value is anchored on hard countable levers (regrettable replacement cost avoided) with baselines and Finance reconciliation",
    ],
    failureDrivers: [
      "Turnover tracked as one headline number, so the firm bleeds its best people while the metric looks fine",
      "Manager capability left as an unfixed gate — good policy dies in weak managers' hands",
      "Succession kept on paper only; named successors are not ready and not being developed",
      "Pay reached for to fix manager/role/culture problems, raising cost without moving regrettable attrition",
      "Engagement surveys run without closed-loop action, and people-program ROI asserted from lagging, confounded correlations",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Talent acquisition and people-analytics teams adopt data-and-AI tooling " +
      "first (clear funnel metrics, visible time-to-fill wins). HR business " +
      "partners and the broader manager population are the harder, slower middle " +
      "— adoption of retention plays, talent-marketplace moves, and coaching " +
      "support depends on manager capability and trust. Sensitive uses " +
      "(attrition prediction, pay equity, AI screening) advance only as fast as " +
      "fairness, privacy, and legal comfort allow, so the curve is gated by " +
      "governance as much as by enthusiasm.",
    roiClarity: "low",
    roiClarityBasis:
      "People-program ROI is genuinely hard: the strongest outcomes (retention, " +
      "engagement, succession depth) are LAGGING indicators that move quarters " +
      "after the cause and are confounded by labor-market, business, and manager " +
      "factors; manager capability gates how much of any program is actually " +
      "executed; and most firms lack baselines, regrettable coding, or matched " +
      "cohorts. The one defensible anchor is the hard, countable lever — " +
      "regrettable/critical exits avoided × loaded replacement-and-ramp cost — " +
      "so value should be built on that, net of attribution and manager-gate " +
      "haircuts. Treating engagement/DEI/L&D as promised dollar returns is the " +
      "dishonest move this expert refuses; they are enabling and directional.",
  },

  regulatoryFrame: {
    name: "Employment law, AI-in-hiring regulation, and employee-data governance",
    relevance:
      "The dominant cross-cutting frame: hiring, promotion, and pay decisions " +
      "carry EEO/adverse-impact exposure; AI-assisted selection is increasingly " +
      "regulated as high-risk (NYC LL144, EU AI Act, state AI-hiring statutes) " +
      "with bias-audit, notice, and explainability duties; pay-equity and " +
      "pay-transparency laws shape compensation analysis; and sensitive employee " +
      "data and people-program changes invoke privacy (GDPR/CCPA) and, in many " +
      "jurisdictions, works-council/labor consultation (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (shared-svcs)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
