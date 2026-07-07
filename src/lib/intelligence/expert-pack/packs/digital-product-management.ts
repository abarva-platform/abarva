// Consilium expert — Digital Product Management & Product Operating Model (cross-cutting).
//
// W3 draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A horizontal,
// cross-cutting ExpertPack v2 with no industry×function key. It answers the
// question every technology and product leader is asking under the "project to
// product" shift: "how do I run product the way modern digital companies do —
// stable empowered product/platform teams funded as products not projects,
// continuous discovery feeding delivery, roadmaps expressed as OUTCOMES not
// feature lists — and how do I tell real product impact from agile theater?"
//
// Honesty doctrine. This expert is built around three non-negotiable truths.
// First, "agile theater" and OUTPUT-OVER-OUTCOME are the dominant failure mode:
// teams ship features on time, call it success, and never check whether the
// target metric moved. The honest unit is OUTCOME (a moved customer or business
// metric), never shipped features, story points, or velocity. Second, funding
// STABLE TEAMS rather than time-boxed projects is the hard organizational
// change — it touches the funding, planning, and governance machinery of the
// enterprise, and most "product transformations" stall here because finance and
// the PMO never actually stop funding projects. Third, product success is
// PROBABILISTIC: most features and most experiments do NOT move the metric, so
// the discipline is cheap discovery, small bets, and killing losers fast — not
// promising that a roadmap of features will deliver a roadmap of value. The
// expert refuses the "we shipped the roadmap therefore we succeeded" leap and
// insists on outcome instrumentation, continuous discovery evidence, and the
// project-to-product funding change before any value case lands.
//
// Distinct from neighbors. This is the PRODUCT MANAGEMENT craft + the product
// OPERATING MODEL — not engineering-productivity (developer velocity / DORA /
// the SDLC mechanics), and not it-strategy-operating-model (the whole IT
// function's strategy and run/grow/transform shape). Where those overlap, this
// expert owns the product-team operating model, discovery/delivery, outcome
// roadmaps, prioritization, and product analytics.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const digitalProductManagementExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.digital-product-management",
    expertName: "Digital Product Management & Product Operating Model Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "digital-product-management",
    scopeNote:
      "Horizontal across every digital organization and industry: the shift " +
      "from PROJECT to PRODUCT — the product operating model, stable empowered " +
      "product and platform teams funded as products (not time-boxed projects), " +
      "continuous discovery feeding delivery, OUTCOME roadmaps (a moved metric, " +
      "not a feature list), outcome-based prioritization, and product analytics/ " +
      "experimentation. Anchored to three honest positions: agile theater and " +
      "output-over-outcome are the dominant failure; funding stable teams rather " +
      "than projects is the hard org change most transformations stall on; and " +
      "product success is PROBABILISTIC, so most features do not move the metric. " +
      "Excludes engineering/developer productivity and the SDLC mechanics (a " +
      "separate Engineering-Productivity expert — DORA, code/CI/CD), the whole " +
      "IT-function strategy and run/grow/transform operating model (a separate " +
      "IT-Strategy expert), and broad workforce-economics modeling.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "product_funding_ratio",
        name: "% funded as products vs projects",
        definition:
          "Share of the technology investment portfolio funded as persistent, " +
          "outcome-accountable product/platform teams versus time-boxed, " +
          "scope-defined projects — the structural measure of how far the " +
          "project-to-product shift has actually gone in the funding model.",
        unit: "% of tech investment funded as products",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 80,
          basis:
            "Wide variance by transformation maturity: early adopters fund a " +
            "minority of spend as products and most as projects; mature product " +
            "organizations have inverted this — a directional journey, not a fixed bar",
          label: "planning-range",
        },
        dataSource:
          "Technology investment / financial planning records and the PMO portfolio (project codes vs product/team funding lines)",
        whyItMatters:
          "The honest test of whether the product operating model is real or " +
          "rhetorical. If finance and the PMO still fund time-boxed projects, " +
          "teams are not stable and outcomes are not owned — the transformation " +
          "is theater regardless of how teams describe themselves.",
      },
      {
        key: "outcome_vs_output_ratio",
        name: "Outcome-vs-output ratio (roadmap framed as outcomes)",
        definition:
          "Share of roadmap items and team objectives expressed as measurable " +
          "OUTCOMES (a target customer or business metric to move) rather than " +
          "OUTPUTS (features to ship) — the direct measure of whether the org has " +
          "escaped output-over-outcome.",
        unit: "% of roadmap items / objectives framed as outcomes",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 70,
          basis:
            "Most roadmaps are feature lists; outcome-framed roadmaps are the " +
            "minority even in self-described product orgs — a maturity range, not a guarantee",
          label: "planning-range",
        },
        dataSource:
          "Roadmap / planning tool and OKR system (item framing: target metric present vs feature-only)",
        whyItMatters:
          "Output-over-outcome is the dominant failure. A roadmap of features " +
          "ships on time and is called a success while the metric never moves. " +
          "This ratio exposes whether teams are accountable for impact or only for delivery.",
      },
      {
        key: "initiatives_with_target_metric",
        name: "% initiatives with a defined target metric",
        definition:
          "Share of product initiatives that have, BEFORE build, an explicit " +
          "target metric and success threshold tied to a customer or business " +
          "outcome — the instrumentation that makes outcome accountability possible.",
        unit: "% of initiatives with a pre-defined target metric",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 80,
          basis:
            "Many initiatives launch with no measurable success definition; " +
            "mature product orgs require one as an entry gate — a discipline range",
          label: "planning-range",
        },
        dataSource:
          "Product planning / OKR system and product analytics instrumentation plan per initiative",
        whyItMatters:
          "If an initiative has no target metric defined up front, success cannot " +
          "be judged and the team defaults to 'we shipped it.' This is the leading " +
          "indicator of whether outcome accountability is structurally enforced.",
      },
      {
        key: "feature_adoption_rate",
        name: "Feature adoption rate",
        definition:
          "Share of the relevant user/customer base that meaningfully adopts a " +
          "shipped feature within a defined window (active use, not mere exposure) — " +
          "the reality check on whether shipped features are actually used.",
        unit: "% of target users adopting within window",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 40,
          basis:
            "Most shipped features see modest adoption; a large share of features " +
            "are rarely or never used — adoption is highly skewed, not uniform",
          label: "planning-range",
        },
        dataSource:
          "Product analytics platform (feature-level usage instrumentation joined to the target population)",
        whyItMatters:
          "Confronts the probabilistic truth directly: most features do not get " +
          "broadly adopted. Tracking adoption per feature is how an org stops " +
          "celebrating shipped output and starts learning which bets actually land.",
      },
      {
        key: "roadmap_outcome_attainment",
        name: "Roadmap outcome attainment",
        definition:
          "Share of committed roadmap OUTCOMES (target metric movements), not " +
          "features, that were actually achieved in the period — measures whether " +
          "the outcome roadmap delivered impact, not just shipped scope.",
        unit: "% of committed outcomes attained",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Because product is probabilistic, even good teams miss a meaningful " +
            "share of outcome targets; very high attainment usually signals " +
            "unambitious targets, not excellence",
          label: "planning-range",
        },
        dataSource:
          "OKR / outcome-roadmap system reconciled against product analytics for the target metrics",
        whyItMatters:
          "The honest scorecard for an outcome roadmap. Reported against feature " +
          "delivery this is always ~100% (theater); reported against outcomes it is " +
          "realistically partial — and that honesty is the point, because it drives learning.",
      },
      {
        key: "ab_test_win_rate",
        name: "A/B test / experiment win rate",
        definition:
          "Share of controlled experiments that produce a statistically credible " +
          "positive movement in the target metric — the empirical measure of how " +
          "often product bets actually work.",
        unit: "% of experiments that win",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Reported experimentation programs commonly see a minority of tests " +
            "win; a low win rate is normal and healthy if cheap, a very high rate " +
            "often signals weak controls or only safe tests",
          label: "planning-range",
        },
        dataSource:
          "Experimentation / A-B testing platform results joined to the product analytics target metrics",
        whyItMatters:
          "The clearest evidence that product is probabilistic: most experiments " +
          "do not win. Tracked IN-RANGE because the goal is not to maximize win rate " +
          "(which incentivizes only safe bets) but to run many cheap, honest tests and kill losers fast.",
      },
      {
        key: "time_to_learn",
        name: "Time-to-learn (discovery cycle time)",
        definition:
          "Elapsed time from forming a product hypothesis to having validated " +
          "evidence for or against it (via discovery, prototype, or experiment) — " +
          "the speed of the learning loop, not the build loop.",
        unit: "days per validated learning cycle",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 60,
          basis:
            "Continuous-discovery teams validate in days to a couple of weeks; " +
            "build-first teams take a release cycle or more to learn anything — a maturity span",
          label: "planning-range",
        },
        dataSource:
          "Discovery activity records (interviews, prototypes, experiments) and product analytics validation timestamps",
        whyItMatters:
          "Because most bets fail, the value is in learning cheaply and fast. A " +
          "long time-to-learn means the org is paying full build cost to discover a " +
          "feature does not work — the opposite of the probabilistic discipline.",
      },
      {
        key: "idea_to_impact_cycle_time",
        name: "Idea-to-impact cycle time",
        definition:
          "End-to-end elapsed time from a prioritized product idea to a measured " +
          "movement (positive or negative) in its target outcome metric in " +
          "production — the full product-system flow time.",
        unit: "days from prioritized idea to measured impact",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 30,
          high: 180,
          basis:
            "Spans weeks for mature continuous-delivery product teams to multiple " +
            "quarters where discovery, hand-offs, and release batching dominate",
          label: "planning-range",
        },
        dataSource:
          "Product planning + delivery + analytics records (prioritization → release → measured outcome)",
        whyItMatters:
          "Captures the whole product system, not just delivery speed. Long " +
          "idea-to-impact time means slow learning and large, risky batches — the " +
          "structural enemy of a probabilistic, outcome-driven operating model.",
      },
      {
        key: "product_team_stability",
        name: "Product team stability / tenure",
        definition:
          "Average duration a cross-functional product team stays intact and on " +
          "its mission (median team-membership tenure / time since last " +
          "re-formation) — the structural measure of whether teams are persistent or project-churned.",
        unit: "months of stable team tenure (median)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 6,
          high: 36,
          basis:
            "Project-funded orgs re-form teams every few months at project " +
            "boundaries; product orgs keep teams on a mission for a year or more — a maturity range",
          label: "planning-range",
        },
        dataSource:
          "HR/org records and team-topology tracking (team formation, membership, and re-org events)",
        whyItMatters:
          "Stable teams are the load-bearing structure of the product operating " +
          "model — they accumulate domain context, own outcomes over time, and run " +
          "discovery. Low stability is the fingerprint of project-funding that never actually changed.",
      },
      {
        key: "value_per_increment",
        name: "Value delivered per increment",
        definition:
          "Measured outcome value (metric movement attributable) realized per " +
          "shipped increment/release relative to its cost — the efficiency of the " +
          "product engine at converting delivery into impact.",
        unit: "indexed outcome value per increment (or % increments that moved the metric)",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Expressed as the share of increments that produce a measurable " +
            "positive outcome; because product is probabilistic, this is a minority " +
            "even in good teams — a realistic range, not a target of 100%",
          label: "planning-range",
        },
        dataSource:
          "Release records joined to product analytics outcome measurement and cost/effort data",
        whyItMatters:
          "Reframes productivity from output volume to outcome yield. A team that " +
          "ships many increments that move nothing is busy, not effective — this " +
          "metric makes that visible and resists the output-over-outcome trap.",
      },
      {
        key: "customer_satisfaction",
        name: "Customer satisfaction (CSAT / NPS / PMF signal)",
        definition:
          "Customer sentiment toward the product — satisfaction (CSAT), net " +
          "promoter (NPS), or product-market-fit signal — as the outside-in " +
          "outcome check that internal delivery metrics cannot capture.",
        unit: "CSAT % / NPS (-100 to +100) / PMF %",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 50,
          basis:
            "NPS and PMF benchmarks vary widely by category and segment; the " +
            "directional ask is upward against the product's own baseline and peers, not a universal bar",
          label: "planning-range",
        },
        dataSource:
          "Voice-of-customer surveys, in-product feedback, and NPS/PMF instrumentation segmented by cohort",
        whyItMatters:
          "The outcome that matters to customers and ultimately to revenue. " +
          "Internal output metrics can all be green while customers are unhappy — " +
          "this is the outside-in counterweight that keeps the product honest about whether it is winning.",
      },
      {
        key: "discovery_coverage",
        name: "Discovery coverage (initiatives validated before build)",
        definition:
          "Share of significant product initiatives that pass through evidence- " +
          "based discovery (customer contact, prototype, or experiment) BEFORE " +
          "committing to full build — the measure of continuous-discovery discipline.",
        unit: "% of significant initiatives discovery-validated pre-build",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20,
          high: 75,
          basis:
            "Build-first cultures validate little before committing; " +
            "continuous-discovery teams validate most significant bets first — a discipline range",
          label: "planning-range",
        },
        dataSource:
          "Discovery activity records and the product planning gate (evidence attached to initiatives pre-commit)",
        whyItMatters:
          "Because most bets fail, validating cheaply before building is how an " +
          "org avoids paying full build cost for losers. Low discovery coverage means " +
          "the org is committing to features on opinion, then calling delivery success.",
      },
    ],

    painThemes: [
      {
        key: "output_over_outcome",
        name: "Output over outcome (feature-factory roadmap)",
        description:
          "The organization measures and celebrates features shipped, story " +
          "points, and on-time delivery, while almost never checking whether the " +
          "target customer or business metric moved. Roadmaps are feature lists; " +
          "'success' means the roadmap shipped — even when nothing improved.",
        detectionSignal:
          "Roadmaps and OKRs framed as features to deliver, not metrics to move; " +
          "few initiatives carry a pre-defined target metric; success reported as " +
          "delivery completion; no post-launch outcome review.",
        diagnosticQuestion:
          "When you call an initiative a success, are you measuring a moved " +
          "customer/business metric — or are you measuring that the features shipped " +
          "on time? What share of your roadmap is framed as outcomes?",
      },
      {
        key: "agile_theater",
        name: "Agile theater (ceremonies without the operating model)",
        description:
          "Teams run stand-ups, sprints, and retros and call themselves 'agile,' " +
          "but the operating model underneath is unchanged: project funding, " +
          "feature mandates handed down, no empowerment to decide WHAT to build, " +
          "no discovery, no outcome ownership. The rituals are present; the model is not.",
        detectionSignal:
          "Agile ceremonies present but teams have no say over what to build; " +
          "roadmaps dictated by stakeholders as feature commitments; no discovery " +
          "practice; teams measured on velocity and predictability, not outcomes.",
        diagnosticQuestion:
          "Do your product teams decide HOW to solve a problem and own the " +
          "outcome, or are they handed features to build to a deadline? What " +
          "actually changed beyond the ceremonies?",
      },
      {
        key: "project_funding_lock",
        name: "Project funding lock (teams can't be stable)",
        description:
          "Finance and the PMO still fund time-boxed, scope-defined projects with " +
          "fixed budgets and end dates, so teams form and disband at project " +
          "boundaries. Stable, persistent product teams are impossible because the " +
          "funding machinery never stopped funding projects — the deepest, hardest blocker.",
        detectionSignal:
          "Investment governed as projects with fixed scope/budget/end-date; " +
          "teams re-formed at project boundaries; low team-stability tenure; product " +
          "funding ratio low; business cases demand fixed scope up front.",
        diagnosticQuestion:
          "Does finance fund persistent product teams against outcomes, or " +
          "time-boxed projects against fixed scope? Can a team stay on its mission " +
          "across budget cycles, or does it dissolve when the project ends?",
      },
      {
        key: "roadmap_as_promise",
        name: "Roadmap as a fixed feature promise",
        description:
          "The roadmap is treated as a contract of features and dates rather than " +
          "a set of outcome bets under uncertainty. Stakeholders hold teams to " +
          "shipping the committed features regardless of evidence, which kills " +
          "discovery and forces delivery of things known to be losing bets.",
        detectionSignal:
          "Roadmap committed quarters out as specific features/dates; changing it " +
          "based on learning is treated as failure; discovery findings can't alter " +
          "the plan; teams ship features they no longer believe in.",
        diagnosticQuestion:
          "Is your roadmap a set of outcome bets you adjust as you learn, or a " +
          "fixed feature/date promise you're held to regardless of evidence? What " +
          "happens when discovery says a committed feature won't work?",
      },
      {
        key: "no_discovery",
        name: "Build-first culture (discovery skipped)",
        description:
          "Initiatives go straight to build on stakeholder opinion or executive " +
          "request, with little or no customer contact, prototyping, or " +
          "experimentation first. The org pays full build cost to discover whether " +
          "an idea works — the most expensive way to learn that most bets fail.",
        detectionSignal:
          "Low discovery coverage; long time-to-learn; product managers act as " +
          "feature project-managers, not problem-discoverers; little direct customer " +
          "contact; experiments rare or absent.",
        diagnosticQuestion:
          "Before committing to build a significant feature, do teams validate the " +
          "problem and solution cheaply with customers/prototypes/experiments — or " +
          "do you build first and find out in production?",
      },
      {
        key: "prioritization_by_loudest_voice",
        name: "Prioritization by HiPPO / loudest voice",
        description:
          "What gets built is decided by the highest-paid person's opinion, sales " +
          "escalations, or whoever lobbies hardest — not by evidence of value, " +
          "reach, and confidence. The backlog is a queue of stakeholder requests, " +
          "and the product loses any coherent outcome thesis.",
        detectionSignal:
          "No transparent prioritization framework tied to outcomes; roadmap " +
          "churns with executive whim and sales escalations; many parallel " +
          "half-built initiatives; product can't articulate why this over that.",
        diagnosticQuestion:
          "How is prioritization actually decided — by an evidence-based view of " +
          "value, reach, and confidence, or by the loudest stakeholder and the " +
          "latest escalation? Can the team explain why each top item beat the alternatives?",
      },
      {
        key: "vanity_product_analytics",
        name: "Vanity product analytics (no instrumentation for outcomes)",
        description:
          "The org tracks pageviews, logins, and shipped-feature counts but does " +
          "not instrument the actual outcome metrics, cohorts, or funnels needed to " +
          "know if a feature moved behavior. Without outcome instrumentation, every " +
          "claim of impact is anecdote.",
        detectionSignal:
          "Dashboards full of traffic/activity counts; no per-feature adoption, " +
          "cohort retention, or funnel instrumentation; can't answer 'did this " +
          "feature move the metric'; experimentation infrastructure absent or unused.",
        diagnosticQuestion:
          "Can you show, with instrumented data, whether your last three major " +
          "features moved their target metric — or only that they were used / that " +
          "traffic is up? What outcome analytics are actually wired in?",
      },
      {
        key: "pm_as_project_manager",
        name: "Product manager as backlog administrator / project manager",
        description:
          "Product managers are staffed and operate as ticket-writers and " +
          "project-coordinators — managing backlogs, scope, and dates — rather than " +
          "as outcome owners running discovery and making evidence-based bets. The " +
          "craft is hollowed out, so the operating model can't function even if it's declared.",
        detectionSignal:
          "PMs measured on delivery predictability and ticket throughput; little " +
          "time on customer discovery or analytics; high PM-to-team ratios with thin " +
          "empowerment; PMs cannot articulate their product's outcome thesis.",
        diagnosticQuestion:
          "Do your PMs spend their time on customer discovery, analytics, and " +
          "outcome bets — or on backlog grooming, scope, and dates? Are they " +
          "accountable for impact or for delivery?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_product_analytics_insight",
        name: "AI-assisted product analytics & outcome insight",
        valueMechanism:
          "An AI layer over the product analytics and experimentation data " +
          "surfaces which features actually moved which metrics, finds adoption " +
          "and retention patterns, and explains experiment results in plain " +
          "language — collapsing the analysis gap so teams can SEE outcomes, not " +
          "just activity. Value shows up as more initiatives with real outcome " +
          "evidence and a shorter idea-to-impact loop, NOT as more dashboards.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Instrumented product analytics with outcome metrics, cohorts, and funnels",
          "Experimentation/A-B platform results joined to target metrics",
          "Feature-to-metric mapping so impact can be attributed",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "AI surfaces correlations; humans must confirm causal/experimental validity before acting",
          "Guard against vanity metrics being auto-elevated — instrument outcomes, not just activity",
        ],
        metricsMoved: [
          "initiatives_with_target_metric",
          "feature_adoption_rate",
          "idea_to_impact_cycle_time",
        ],
      },
      {
        key: "ai_continuous_discovery",
        name: "AI-accelerated continuous discovery",
        valueMechanism:
          "AI accelerates the discovery loop — synthesizing customer interviews, " +
          "clustering feedback and support themes, drafting and analyzing surveys, " +
          "and summarizing research — so teams reach validated learning far faster " +
          "and cheaper. Because most bets fail, faster/cheaper learning is the core " +
          "value: it shortens time-to-learn and widens discovery coverage before expensive build.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Customer interview transcripts, support tickets, and feedback corpora",
          "Survey and research instrumentation",
          "A discovery practice and team capacity to act on findings",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "AI synthesis can over-smooth or hallucinate themes — product trios must validate against raw evidence",
          "Faster synthesis is worthless without real customer contact behind it; do not let AI replace talking to customers",
        ],
        metricsMoved: [
          "time_to_learn",
          "discovery_coverage",
          "customer_satisfaction",
        ],
      },
      {
        key: "ai_prioritization_decision_support",
        name: "AI prioritization & decision support",
        valueMechanism:
          "AI assembles the evidence behind prioritization — reach, value signal, " +
          "confidence, effort, and dependencies — from analytics, feedback, and " +
          "delivery data into a transparent, outcome-anchored view, displacing " +
          "HiPPO and loudest-voice decisions with an evidence-based ranking the " +
          "team can interrogate. Value is more outcome-framed, defensible prioritization.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Outcome metrics, adoption, and reach data per initiative",
          "Customer feedback and demand signals",
          "Effort/cost and dependency data from delivery",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Prioritization is a judgment call under uncertainty — AI informs the trade-off, accountable humans decide",
          "Inputs are noisy and gameable; transparency of the inputs matters more than a single AI score",
        ],
        metricsMoved: [
          "outcome_vs_output_ratio",
          "initiatives_with_target_metric",
          "value_per_increment",
        ],
      },
      {
        key: "ai_experimentation_acceleration",
        name: "AI-accelerated experimentation",
        valueMechanism:
          "AI helps design experiments, generate variants, monitor for early " +
          "significance and guardrail breaches, and interpret results — so teams " +
          "run MORE cheap experiments and kill losers faster. Because most tests " +
          "lose, throughput and fast-fail are the value: more honest bets per " +
          "quarter at a held statistical bar, raising value-per-increment over time.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "An experimentation/A-B platform with sound statistical engine and guardrails",
          "Sufficient traffic/sample for valid tests",
          "Outcome metric instrumentation to measure wins honestly",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Beware peeking/p-hacking — AI must respect the statistical design, not manufacture significance",
          "More experiments without guardrails can harm users; AI monitoring must enforce, not bypass, safety thresholds",
        ],
        metricsMoved: [
          "ab_test_win_rate",
          "value_per_increment",
          "idea_to_impact_cycle_time",
        ],
      },
      {
        key: "ai_pm_copilot",
        name: "AI product-management copilot (craft augmentation)",
        valueMechanism:
          "An AI copilot drafts PRDs, user stories, release notes, and " +
          "stakeholder comms, and answers questions over the product's own " +
          "knowledge — removing administrative toil so PMs spend more time on " +
          "discovery, analytics, and outcome bets rather than backlog admin. Value " +
          "is reclaiming PM craft time toward outcomes, not producing more documents.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Access to product docs, roadmaps, and decision history",
          "Discovery and analytics context to ground generated artifacts",
          "Clear PM accountability for what the copilot drafts",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Generated PRDs/stories must be owned and validated by the PM — fluent output is not validated insight",
          "Risk of producing more polished output-thinking; copilot time must be reinvested into discovery, not more documentation",
        ],
        metricsMoved: [
          "time_to_learn",
          "discovery_coverage",
          "product_team_stability",
        ],
      },
      {
        key: "ai_voice_of_customer_synthesis",
        name: "AI voice-of-customer & feedback synthesis",
        valueMechanism:
          "AI continuously ingests support tickets, reviews, NPS verbatims, and " +
          "in-product feedback, clustering them into themes and surfacing emerging " +
          "satisfaction/churn signals — giving product teams an always-on, " +
          "outside-in read on customers. Value shows up as earlier detection of " +
          "satisfaction and adoption problems and better-grounded outcome bets.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Aggregated feedback corpora (support, reviews, NPS, in-product)",
          "Customer/cohort identifiers to segment signal",
          "A response loop so synthesized signal reaches the owning team",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Theme clustering can bury minority but critical signals — humans must inspect, not just trust the aggregate",
          "Synthesized sentiment is a lead, not proof; validate against measured behavior before acting",
        ],
        metricsMoved: [
          "customer_satisfaction",
          "feature_adoption_rate",
          "time_to_learn",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "outcome_funded_product_teams",
        name: "Outcome-funded stable product teams (product operating model)",
        description:
          "The structural core of the project-to-product shift: persistent, " +
          "cross-functional, empowered product teams funded against OUTCOMES " +
          "(business/customer metrics to move) on a rolling basis, not against " +
          "time-boxed project scope. Finance and the PMO fund teams and outcomes, " +
          "teams stay on mission across budget cycles, and they own the WHAT, not just the HOW.",
        boundary:
          "Owns the team topology, the outcome-based funding/governance model, and " +
          "team empowerment; does not own the specific product strategy or " +
          "individual prioritization calls, which sit with the teams it funds.",
        humanAccountabilityPoint:
          "Chief Product Officer / Head of Product (with the CFO and PMO who own the funding-model change)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "outcome_roadmap_okr",
        name: "Outcome roadmap & OKR system (bets, not feature promises)",
        description:
          "A planning pattern that expresses the roadmap as a set of outcome bets " +
          "(target metrics with confidence), governed by OKRs, and explicitly " +
          "adjustable as evidence arrives — replacing the fixed feature/date " +
          "contract. It makes outcome attainment (not feature delivery) the unit of " +
          "success and legitimizes changing the plan when discovery says so.",
        boundary:
          "Owns the roadmap framing, OKR cadence, and outcome instrumentation; " +
          "does not own which specific solutions teams build to hit the outcomes.",
        humanAccountabilityPoint:
          "Head of Product (with product leadership owning the OKR and outcome-review cadence)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "continuous_discovery_practice",
        name: "Continuous discovery & dual-track delivery",
        description:
          "A standing practice where product trios (product, design, engineering) " +
          "run weekly customer contact, prototyping, and experimentation in a " +
          "discovery track that feeds the delivery track — so significant bets are " +
          "validated cheaply BEFORE full build. The operating answer to a build-first " +
          "culture and to the probabilistic reality that most bets fail.",
        boundary:
          "Owns the discovery cadence, methods, and the evidence gate into delivery; " +
          "does not own delivery engineering itself or the analytics platform it draws on.",
        humanAccountabilityPoint:
          "Product trio leads (product manager, design lead, tech lead) per team, accountable for evidence before commit",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "product_analytics_experimentation_platform",
        name: "Product analytics & experimentation platform",
        description:
          "The instrumented data foundation — event analytics, cohorts, funnels, " +
          "feature-to-metric mapping, and a statistically sound experimentation " +
          "platform — that makes outcome accountability possible. Without it, " +
          "outcome roadmaps and win-rate honesty are impossible and the org defaults " +
          "to vanity activity metrics.",
        boundary:
          "Owns the analytics/experimentation infrastructure and metric definitions; " +
          "does not own product decisions — it supplies the honest evidence those decisions use.",
        humanAccountabilityPoint:
          "Head of Product Analytics / Data (with the experimentation platform owner)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "evidence_based_prioritization",
        name: "Evidence-based prioritization framework",
        description:
          "A transparent prioritization pattern (reach/value/confidence/effort, or " +
          "opportunity-solution mapping) that anchors what-to-build to outcome " +
          "evidence and makes trade-offs explicit and contestable — displacing " +
          "HiPPO and loudest-voice decisions. The team can always explain why this " +
          "bet beat the alternatives.",
        boundary:
          "Owns the prioritization method and its inputs; does not own the final " +
          "strategic call, which the accountable product leader makes using it.",
        humanAccountabilityPoint:
          "Product manager / product leadership accountable for each team's prioritization decisions",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Product value is realized as moved OUTCOMES — adoption, retention, " +
        "satisfaction, and the business metrics behind them — NOT as features " +
        "shipped or velocity. The honest chain is: the org shifts to stable, " +
        "outcome-funded product teams; those teams run continuous discovery to " +
        "find bets worth making; instrumented analytics and experimentation tell " +
        "them which bets actually move the metric; and outcome-framed roadmaps " +
        "and prioritization concentrate effort on what works while killing losers " +
        "fast. Each step is heavily haircut by the probabilistic reality of " +
        "product (most features and most experiments do NOT move the metric), by " +
        "the funding-model change stalling (finance keeps funding projects), by " +
        "weak outcome instrumentation (no way to know what worked), and by " +
        "attribution uncertainty (metrics move for many reasons). The business " +
        "case must NEVER book a roadmap of features as a roadmap of value, and " +
        "must size the prize as a portfolio of probabilistic bets, not a sum of " +
        "promised features. The discipline that keeps it honest is measuring " +
        "outcomes against a baseline and accepting that a healthy program's hit " +
        "rate is a minority — that is the system working, not failing.",
      dominantHaircutFactors: [
        {
          factor: "Probabilistic bet failure (most features don't move the metric)",
          rationale:
            "The defining haircut of product: a large share of shipped features " +
            "and experiments produce no meaningful outcome movement, so a roadmap's " +
            "promised value must be discounted to its realistic hit rate, not summed as if every bet lands.",
          typicalHaircut: {
            low: 0.4,
            high: 0.7,
            basis:
              "Reported feature adoption skew and experiment win rates where a " +
              "minority of bets produce most of the realized outcome value",
            label: "planning-range",
          },
        },
        {
          factor: "Funding-model change stall (projects keep getting funded)",
          rationale:
            "The product operating model only delivers if teams are actually " +
            "stable and outcome-funded; when finance and the PMO keep funding " +
            "projects, teams churn and outcomes go unowned, removing much of the theoretical value.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Transformation drop-off where the funding/governance machinery never " +
              "shifts from projects to outcome-funded teams",
            label: "planning-range",
          },
        },
        {
          factor: "Outcome instrumentation gap (can't tell what worked)",
          rationale:
            "Without product analytics and experimentation wired to outcome " +
            "metrics, teams cannot distinguish wins from activity, so learning " +
            "stalls and effort keeps flowing to losing bets — eroding realized value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Give-back where vanity analytics replace outcome instrumentation and " +
              "impact cannot be measured or attributed",
            label: "planning-range",
          },
        },
        {
          factor: "Attribution uncertainty",
          rationale:
            "Outcome metrics move for many reasons at once (market, pricing, " +
            "seasonality, other initiatives); without experiments or matched " +
            "baselines, the product is credited for changes it did not cause.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Counterfactual gaps where no experiment or baseline isolates the " +
              "product change's contribution to the outcome",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Outcome lift from outcome-funded product model (vs project model)",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported improvement in outcome attainment / value yield where " +
              "stable outcome-funded teams replace project-funded delivery",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in roadmap_outcome_attainment / value_per_increment at a held cost base",
        },
        {
          lever: "Discovery waste avoidance (losers killed before full build)",
          range: {
            low: 0.1,
            high: 0.35,
            basis:
              "Build cost avoided where continuous discovery and experimentation " +
              "validate or kill bets cheaply before committing full build",
            label: "planning-range",
          },
          measuredAs:
            "Share of would-be build effort redirected, measured via time_to_learn and discovery_coverage",
        },
        {
          lever: "Adoption / outcome uplift from experimentation discipline",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Cumulative outcome gain from running many cheap experiments and " +
              "shipping only winners, compounded across a portfolio",
            label: "planning-range",
          },
          measuredAs:
            "Relative increase in feature_adoption_rate / customer_satisfaction attributable to won experiments",
        },
      ],
      timeToValueBand:
        "AI product-analytics, copilot, and voice-of-customer synthesis: 1-2 " +
        "quarters to first analysis and discovery-speed gains where data is " +
        "instrumented. Continuous discovery and outcome roadmaps: 2-4 quarters to " +
        "move time-to-learn, discovery coverage, and outcome attainment once the " +
        "practice and instrumentation exist. The hard structural change — " +
        "outcome-funded stable teams and the project-to-product funding shift — is " +
        "a 4-8+ quarter program because it touches finance, the PMO, and " +
        "governance, and it is where most transformations stall.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Product analytics platform",
          role: "Source of truth for feature adoption, cohort retention, funnels, and the outcome metrics product success is judged against.",
          examples: ["Amplitude", "Mixpanel", "Pendo", "Heap", "PostHog"],
        },
        {
          name: "Experimentation / A-B testing platform",
          role: "Where controlled experiments run and win/loss is measured — the empirical engine of probabilistic product.",
          examples: ["Optimizely", "LaunchDarkly", "Statsig", "Eppo", "in-house experimentation"],
        },
        {
          name: "Product planning, roadmap & OKR system",
          role: "Where roadmaps, outcomes, and objectives live — the record of whether the plan is framed as outcomes or features.",
          examples: ["Productboard", "Aha!", "Jira Product Discovery", "OKR tooling"],
        },
        {
          name: "Voice-of-customer & feedback platform",
          role: "Aggregates support, reviews, NPS, and in-product feedback — the outside-in signal behind discovery and satisfaction.",
          examples: ["NPS/CSAT survey tools", "support/ticketing systems", "in-product feedback widgets"],
        },
        {
          name: "Delivery / work tracking & financial planning",
          role: "Holds delivery flow data and the investment/funding records that reveal whether work is funded as products or projects.",
          examples: ["Jira", "Linear", "Azure DevOps", "financial planning / PPM systems"],
        },
      ],
      roles: [
        {
          title: "Chief Product Officer / VP of Product",
          accountability:
            "The product operating model, outcome accountability across teams, and the project-to-product transformation end-to-end.",
        },
        {
          title: "Product manager (outcome owner)",
          accountability:
            "Owning a product/team's outcomes — running discovery, prioritizing on evidence, and making the bets, not administering a backlog.",
        },
        {
          title: "Head of Product Operations",
          accountability:
            "The connective tissue: roadmap/OKR cadence, prioritization frameworks, product analytics enablement, and the operating-model mechanics.",
        },
        {
          title: "CFO / PMO (funding-model owners)",
          accountability:
            "The hard change — shifting investment governance from time-boxed projects to outcome-funded persistent product teams.",
        },
        {
          title: "Product designer & engineering lead (the product trio)",
          accountability:
            "With the PM, jointly running continuous discovery and owning the solution and its quality — empowered to decide how, accountable for the outcome.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Product analytics privacy & consent (GDPR/CCPA)",
          relevance:
            "User-level product instrumentation, cohorts, and experimentation must respect consent and privacy law — shaping what can be tracked and tested.",
        },
        {
          name: "Experimentation ethics & user-impact guardrails",
          relevance:
            "A/B tests change real user experiences; ethical guardrails and harm thresholds govern what experiments may run, especially in sensitive domains.",
        },
        {
          name: "Accessibility & inclusive-design standards (e.g. WCAG)",
          relevance:
            "Shipped product increments must meet accessibility obligations; outcome roadmaps cannot trade away inclusive-design compliance.",
        },
        {
          name: "AI governance for product data & decisioning (EU AI Act, NIST AI RMF)",
          relevance:
            "AI used in discovery, prioritization, and personalization is governed by emerging AI-risk frameworks shaping how it may inform product decisions.",
        },
      ],
      canonicalTerms: [
        {
          term: "Product operating model",
          definition:
            "Running technology investment through stable, empowered, cross-functional product teams funded against outcomes — as opposed to the project model of time-boxed, scope-defined delivery.",
        },
        {
          term: "Outcome vs output",
          definition:
            "An outcome is a moved customer/business metric; an output is a shipped feature. Output-over-outcome — celebrating shipped features without checking the metric — is the dominant product failure.",
        },
        {
          term: "Continuous discovery",
          definition:
            "An ongoing practice of weekly customer contact, prototyping, and experimentation by the product trio to validate bets cheaply before committing to full build.",
        },
        {
          term: "Dual-track agile",
          definition:
            "Running a discovery track (validating what to build) in parallel with a delivery track (building it), so learning continuously feeds delivery.",
        },
        {
          term: "Agile theater",
          definition:
            "Performing agile ceremonies (sprints, stand-ups, retros) without the underlying operating-model change — teams remain project-funded, feature-mandated, and outcome-unaccountable.",
        },
        {
          term: "Empowered product team",
          definition:
            "A team given a problem/outcome to solve and the autonomy to decide HOW, accountable for the result — versus a feature team handed a spec to build to a deadline.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Product impact / outcome moved",
        authoritativeSource:
          "Product analytics outcome instrumentation and experiment results, before vs after, attributed to the specific change",
        whatGoodEvidenceLooksLike:
          "A pre-defined target metric, an instrumented before/after with cohort or experimental control, showing the outcome moved — with the realistic hit rate acknowledged.",
        weakEvidenceToReject:
          "Features shipped, story points, velocity, on-time delivery, or pageviews/logins presented as product success or impact.",
      },
      {
        claim: "Operating-model maturity (project-to-product)",
        authoritativeSource:
          "Financial planning / PPM records and team-topology data on funding lines and team stability",
        whatGoodEvidenceLooksLike:
          "The share of investment funded as persistent outcome-accountable teams, with measured team-stability tenure — the structural evidence the model is real.",
        weakEvidenceToReject:
          "A declaration that 'we are a product organization' or the presence of agile ceremonies, with project funding and team churn unchanged underneath.",
      },
      {
        claim: "Discovery validated the bet before build",
        authoritativeSource:
          "Discovery activity records (customer interviews, prototypes, experiments) attached to the initiative pre-commit",
        whatGoodEvidenceLooksLike:
          "Documented customer contact, a tested prototype or experiment, and an explicit go/kill decision recorded BEFORE full build was committed.",
        weakEvidenceToReject:
          "An executive request, a sales escalation, or internal opinion presented as validation that a feature was worth building.",
      },
      {
        claim: "Roadmap value projection",
        authoritativeSource:
          "Outcome-roadmap/OKR baselines plus benchmark planning ranges and the explicit probabilistic and funding-model haircuts",
        whatGoodEvidenceLooksLike:
          "A portfolio of outcome bets each with a baseline, a labelled planning range, and the hit-rate and attribution haircuts applied — sized as probabilistic, not promised.",
        weakEvidenceToReject:
          "A sum of promised features booked as guaranteed value, or a roadmap presented as a fixed feature/date contract delivering its face-value benefits.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When you call an initiative a success, are you measuring a moved customer/business metric — or that features shipped on time? What share of your roadmap is framed as outcomes?",
      "Does finance fund persistent product teams against outcomes, or time-boxed projects against fixed scope? Can a team stay on its mission across budget cycles?",
      "Do your product teams decide HOW to solve a problem and own the outcome, or are they handed features to build to a deadline — what changed beyond the ceremonies?",
      "Before committing to build a significant feature, do teams validate cheaply with customers, prototypes, or experiments — or build first and find out in production?",
      "How is prioritization actually decided — by evidence of value, reach, and confidence, or by the loudest stakeholder and the latest escalation?",
      "Can you show, with instrumented data, whether your last three major features moved their target metric — or only that they were used and traffic is up?",
      "What is your realistic experiment win rate and feature adoption — and does leadership accept that most bets won't move the metric as the system working, not failing?",
      "Are your product managers spending time on discovery, analytics, and outcome bets — or on backlog grooming, scope, and dates?",
    ],
    maturitySignals: [
      "Roadmaps and team objectives are framed as outcomes (metrics to move), and most initiatives carry a pre-defined target metric.",
      "Investment is funded as persistent outcome-accountable product teams; teams stay on mission across budget cycles with high stability tenure.",
      "Continuous discovery is a standing practice — significant bets are validated cheaply before full build, and time-to-learn is short.",
      "Product analytics and experimentation are instrumented to outcomes; the org can say honestly which features moved which metrics.",
      "Leadership treats product as probabilistic — a minority experiment win rate and feature adoption skew are accepted, and losers are killed fast.",
    ],
    redFlags: [
      "Success is reported as features shipped / velocity / on-time delivery, with no pre-defined target metric and no post-launch outcome review — output over outcome.",
      "Agile ceremonies are present but teams have no say over what to build, no discovery, and are funded and churned as projects — agile theater over a project model.",
      "The roadmap is a fixed feature/date promise that can't change on evidence; discovery findings can't alter the plan.",
      "Prioritization is driven by HiPPO and sales escalations; the backlog is a request queue with no transparent outcome-based framework.",
      "Dashboards show pageviews and logins but no per-feature adoption, cohort retention, or experiment outcomes — vanity product analytics.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Product analytics platforms (Amplitude, Mixpanel, Pendo, others)",
        category: "Event analytics, adoption, retention, and funnel instrumentation for outcome measurement",
        switchingCost:
          "Moderate-to-high — instrumentation, event taxonomies, and dashboards are embedded across the product; re-instrumenting is real work, though the analytics layer is replaceable.",
        renewalDynamics:
          "Usage/MTU- or seat-based pricing that scales with product traffic; negotiate on event volume, retention windows, and data-export rights to avoid metric lock-in.",
      },
      {
        vendorName: "Experimentation / feature-flag platforms (Optimizely, LaunchDarkly, Statsig, others)",
        category: "A/B testing, feature flagging, and statistical experimentation infrastructure",
        switchingCost:
          "Moderate — flags and experiment configs are wired into the codebase and release process; portable in principle but workflow-embedded.",
        renewalDynamics:
          "Seat- and usage-based; the market is consolidating and outcome/usage terms are increasingly available — negotiate against measured experimentation throughput.",
      },
      {
        vendorName: "Product planning / roadmap / OKR tools (Productboard, Aha!, Jira Product Discovery)",
        category: "Roadmapping, prioritization, feedback management, and outcome/OKR planning",
        switchingCost:
          "Low-to-moderate — roadmap and feedback data are exportable; stickiness is in adopted workflow and integration depth, not deep technical lock-in.",
        renewalDynamics:
          "Per-seat subscriptions; right-size to active product/PM users and negotiate integration and data-portability rather than blanket seats.",
      },
      {
        vendorName: "Voice-of-customer / feedback & survey platforms",
        category: "NPS/CSAT, in-product feedback, and customer-research aggregation",
        switchingCost:
          "Low-to-moderate — survey and feedback data are portable; switching cost is mostly historical-trend continuity and integration rewiring.",
        renewalDynamics:
          "Response-volume or seat-based; negotiate on data export and continuity of longitudinal NPS/CSAT trends across a switch.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the product analytics instrumentation and event taxonomy the whole outcome-measurement discipline depends on — re-instrumenting is a real program. Experimentation and flags are workflow-embedded but more portable, and roadmap/feedback tools are largely replaceable. The strategic risk is not tool lock-in but losing longitudinal outcome data continuity; negotiate export, portability, and trend continuity above all.",
    negotiationLevers: [
      "Right-size analytics MTU/event volume and tool seats to active product users, not total headcount (kills shelfware and over-scaled usage tiers)",
      "Data-export and event-taxonomy portability to protect longitudinal outcome data across a tool switch",
      "Outcome/usage-based pricing tied to measured experimentation throughput and active product analytics use where available",
      "Pilot-to-scale gating with a defined product-outcome graduation metric before enterprise commitment",
      "Consolidation leverage — fold overlapping analytics, experimentation, and roadmap point tools into fewer platforms at renewal",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      outcome_claim: [
        "pre-defined target metric for the initiative",
        "instrumented before/after with cohort or experimental control",
        "attribution basis (experiment or matched baseline), not bare correlation",
      ],
      operating_model_claim: [
        "funding-line evidence (product/team funding vs project codes)",
        "team-stability tenure data",
        "team empowerment evidence (who decides what to build), not ceremony presence",
      ],
      discovery_claim: [
        "documented customer contact / prototype / experiment pre-commit",
        "an explicit recorded go/kill decision",
        "time-to-learn for the cycle",
      ],
      value_projection: [
        "baseline outcome metric",
        "benchmark planning-range",
        "explicit probabilistic and funding-model haircuts (bet-failure, funding stall, instrumentation gap, attribution)",
      ],
      adoption_claim: [
        "feature-level adoption instrumentation against the target population",
        "cohort/retention evidence, not raw activity counts",
        "the relevant denominator (eligible users), not total traffic",
      ],
    },
    citationStandard:
      "Product claims cite the analytics/experimentation source, the period, the " +
      "feature/initiative scope, the target population/denominator, and the " +
      "comparison basis (baseline + cohort or experiment). Outcome claims MUST " +
      "name the pre-defined target metric and the attribution basis — never " +
      "shipped features, velocity, or activity counts presented as impact. Value " +
      "projections cite a baseline plus a labelled planning range and the " +
      "probabilistic and funding-model haircuts applied (bet-failure, funding " +
      "stall, instrumentation gap, attribution) — and are sized as a portfolio of " +
      "probabilistic bets, never a sum of promised features booked as guaranteed value.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no outcome instrumentation — frame product impact as an industry planning range, not their measured number.",
      "Only output metrics (features shipped, velocity, traffic) are available — present as activity, flag that outcome impact is unproven.",
      "A roadmap is presented as guaranteed value — hedge to a probabilistic portfolio of bets and apply the bet-failure haircut explicitly.",
      "The org calls itself 'product-led' without funding-line or team-stability evidence — hedge operating-model maturity claims pending structural proof.",
      "Vendor- or case-study-reported product outcomes are cited — mark as external claims pending tenant validation against instrumented outcomes.",
    ],
    inferenceLanguage: [
      "Across enterprise product organizations, feature adoption and experiment win rates typically run...",
      "Without your outcome instrumentation, the industry pattern suggests most features and bets do not move the metric...",
      "Peer product orgs at this maturity commonly fund a minority/majority of investment as products, with team stability around...",
      "This is sized as a portfolio of probabilistic bets at an assumed hit rate; your data hasn't yet established your actual win rate.",
    ],
    flagWithoutEvidence: [
      "A specific outcome / metric movement attributed to this tenant's product changes",
      "This tenant's actual feature adoption, experiment win rate, or outcome attainment",
      "A claim that this tenant has genuinely shifted from project to product funding (vs declared it)",
      "A specific ROI or value number for this tenant's product portfolio",
      "A product success claim based on features shipped, velocity, or traffic for this tenant",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "product portfolio scorecard (outcomes, not output)",
      exhibitKind: "table",
      note: "Product funding ratio, outcome-vs-output ratio, initiatives-with-target-metric, feature adoption, outcome attainment, win rate, time-to-learn, idea-to-impact, team stability, CSAT/NPS vs planning ranges.",
    },
    {
      questionPattern: "outcome value bridge (roadmap bets to realized value, with haircuts)",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from face-value roadmap to realistic realized outcome, showing each probabilistic haircut (bet-failure, funding stall, instrumentation gap, attribution).",
    },
    {
      questionPattern: "value sensitivity / which haircut bites hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      chartBuilder: "tornado",
      note: "Tornado of bet-failure rate, funding-model stall, instrumentation gap, and attribution on realized product value.",
    },
    {
      questionPattern: "project-to-product maturity (funding mix shift over time)",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Stacked share of investment funded as products vs projects over periods, with team-stability tenure trend to show the structural shift (or its absence).",
    },
    {
      questionPattern: "outcome trend / where product moved the metric",
      exhibitKind: "chart",
      chartKind: "line",
      chartBuilder: "line",
      note: "Trend target outcome metrics (adoption, retention, CSAT) over time against releases, to show whether shipped increments actually moved outcomes.",
    },
    {
      questionPattern: "discovery / delivery flow narrative",
      exhibitKind: "prose",
      note: "Narrative of the continuous-discovery-to-delivery operating model, the probabilistic bet discipline, and the funding-model change required to make it real.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "low",
    successDrivers: [
      "Finance and the PMO actually shift from funding time-boxed projects to funding stable, outcome-accountable product teams — the hard structural change is real, not declared",
      "Roadmaps and objectives are framed as outcomes with pre-defined target metrics, and changing the plan on evidence is legitimate",
      "Continuous discovery and instrumented analytics/experimentation are in place, so bets are validated cheaply and impact is measurable",
      "Leadership internalizes that product is probabilistic — a minority hit rate is accepted, cheap bets are encouraged, and losers are killed fast",
      "Product managers are empowered outcome owners doing discovery and analytics, not backlog administrators or project managers",
    ],
    failureDrivers: [
      "Output over outcome — celebrating features shipped and velocity while never checking whether the metric moved",
      "Agile theater — ceremonies adopted while the project-funding, feature-mandate operating model underneath is unchanged",
      "The funding-model change stalls because finance and the PMO never stop funding projects, so teams can't be stable and outcomes go unowned",
      "Roadmaps held as fixed feature/date promises that discovery can't alter, forcing delivery of bets known to be losing",
      "No outcome instrumentation and HiPPO-driven prioritization, so the org can't tell what worked and builds on opinion",
    ],
    adoptionReadiness: "low",
    adoptionCurve:
      "Tech-forward product teams and digital-native units adopt the practices " +
      "(continuous discovery, outcome roadmaps, experimentation) first and " +
      "demonstrate impact locally. The broader org follows only when leadership " +
      "and — critically — finance change the FUNDING model from projects to " +
      "outcome-funded teams; without that structural shift, local product practice " +
      "is capped by an unchanged enterprise operating model and regresses to agile " +
      "theater. The decisive unlock is not tooling or training but the project- " +
      "to-product funding and governance change, which is slow, political, and the " +
      "single most common point of stall.",
    roiClarity: "low",
    roiClarityBasis:
      "ROI clarity is LOW because product value is probabilistic and diffuse: " +
      "most features and experiments do not move the metric, so a roadmap's value " +
      "cannot be summed as promised features; outcomes are confounded by market, " +
      "pricing, seasonality, and concurrent initiatives, making attribution hard " +
      "without experiments or matched baselines; and most organizations lack the " +
      "outcome instrumentation to measure impact honestly at all. Clarity improves " +
      "only with disciplined experimentation, outcome instrumentation, and a " +
      "portfolio framing of probabilistic bets — and even then the honest answer " +
      "is a realistic hit rate, never a guaranteed roadmap-to-value conversion.",
  },

  regulatoryFrame: {
    name: "Product data, experimentation, and AI-decisioning governance",
    relevance:
      "The cross-cutting compliance frame for digital product management: " +
      "user-level product analytics, cohorts, and A/B experimentation are " +
      "constrained by privacy and consent law (GDPR/CCPA) and by experimentation " +
      "ethics/harm guardrails; shipped increments carry accessibility obligations " +
      "(WCAG); and AI used in discovery, prioritization, and personalization is " +
      "governed by emerging AI-risk frameworks (EU AI Act, NIST AI RMF) — so the " +
      "outcome-measurement and AI engine of the product model must operate inside " +
      "a defensible privacy, ethics, accessibility, and AI-governance boundary " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (cio)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-20",
  },
};
