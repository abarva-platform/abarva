// Consilium expert — Healthcare Care Management & Value-Based Care (provider).
//
// Wave-4 ExpertPack v2. This is the VALUE / POPULATION layer of a provider:
// who is attributed, how sick they really are (risk adjustment), where the
// total cost of care is concentrated, and how care management, quality, and
// VBC contract design bend that curve. It is deliberately distinct from the
// Revenue Cycle expert (claims yield) and the Clinical Process Transformation
// expert (in-encounter clinical workflow) — both separate packs. The honest
// throughline: VBC economics live or die on attribution accuracy + risk
// adjustment, and data interoperability gates everything downstream.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const healthcareCareManagementVbcExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.healthcare-provider.care-management-vbc",
    expertName: "Healthcare Care Management & Value-Based Care Expert",
    kind: "industry-function",
    industry: "healthcare_provider",
    functionKey: "care-management-vbc",
    scopeNote:
      "Provider-side population health and value-based care: attribution, " +
      "risk stratification, care coordination and transitions of care, " +
      "chronic-disease and complex-care management, HCC/RAF coding accuracy, " +
      "quality measures (HEDIS/Stars), and total-cost-of-care management under " +
      "VBC contracts (MSSP/ACO, Medicare Advantage, commercial shared savings). " +
      "This is the VALUE/population layer. Excludes claims yield and denials " +
      "(Revenue Cycle expert) and in-encounter clinical workflow (Clinical " +
      "Process Transformation expert).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "risk_adjusted_tcoc",
        name: "Risk-adjusted total cost of care",
        definition:
          "Total medical and pharmacy spend per attributed member, normalized " +
          "for the population's risk (RAF/HCC) so cost is comparable to a " +
          "benchmark net of how sick the panel is.",
        unit: "USD PMPY (risk-adjusted)",
        directionOfGood: "lower",
        benchmarkRange: {
          low: -0.05,
          high: 0.03,
          basis:
            "Variance vs CMS/payer benchmark expenditure for the attributed " +
            "population; negative = below benchmark (savings)",
          label: "planning-range",
        },
        dataSource:
          "Payer claims feeds + benchmark expenditure (CMS MSSP settlement / MA bid)",
        whyItMatters:
          "The scoreboard for every VBC contract. Shared savings are settled " +
          "against this; a 1% swing on a $1B benchmark population is ~$10M.",
      },
      {
        key: "raf_capture_accuracy",
        name: "RAF / HCC capture accuracy",
        definition:
          "Completeness and correctness of documented, coded HCC conditions " +
          "versus the conditions actually present and supported in the record, " +
          "expressed as the risk-adjustment factor relative to expected.",
        unit: "RAF index (1.0 = average)",
        directionOfGood: "in-range",
        benchmarkRange: {
          low: 0.95,
          high: 1.25,
          basis:
            "Population-dependent; the target is ACCURATE coded acuity, not " +
            "maximized — over-coding is an audit/RADV exposure",
          label: "planning-range",
        },
        dataSource:
          "Coded HCCs from claims + EHR problem list vs chart-validated conditions",
        whyItMatters:
          "Under-capture understates revenue and benchmarks; over-capture is " +
          "fraud exposure. Accuracy — not maximization — is the entire game.",
      },
      {
        key: "readmission_rate",
        name: "30-day all-cause readmission rate",
        definition:
          "Share of index inpatient discharges followed by an unplanned " +
          "all-cause readmission within 30 days for the attributed population.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 12,
          high: 18,
          basis: "CMS HRRP / population health peer ranges; condition-mix dependent",
          label: "planning-range",
        },
        dataSource: "Claims + ADT (admit/discharge/transfer) inpatient events",
        whyItMatters:
          "A direct, controllable cost and quality lever — transitions-of-care " +
          "programs target it, and it carries penalty exposure under HRRP.",
      },
      {
        key: "ed_utilization_per_1000",
        name: "ED utilization per 1,000 attributed lives",
        definition:
          "Emergency department visits per 1,000 attributed members per year, " +
          "with avoidable/ambulatory-care-sensitive visits tracked separately.",
        unit: "visits per 1,000 per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 350,
          high: 600,
          basis: "Commercial vs Medicare populations differ widely; peer ranges",
          label: "planning-range",
        },
        dataSource: "Claims ED facility/professional + ADT ED events",
        whyItMatters:
          "A leading signal of access gaps and uncontrolled chronic disease; " +
          "avoidable ED is among the cleanest care-management savings targets.",
      },
      {
        key: "admissions_per_1000",
        name: "Acute admissions per 1,000 attributed lives",
        definition:
          "Acute inpatient admissions per 1,000 attributed members per year, " +
          "with ambulatory-care-sensitive admissions tracked separately.",
        unit: "admissions per 1,000 per year",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 200,
          high: 320,
          basis: "Medicare populations higher than commercial; peer ranges",
          label: "planning-range",
        },
        dataSource: "Claims inpatient + ADT admit events",
        whyItMatters:
          "The largest single TCOC component for high-risk members; reducing " +
          "avoidable admissions is where complex-care management pays back.",
      },
      {
        key: "pmpm_cost",
        name: "Per-member-per-month (PMPM) cost",
        definition:
          "Total allowed medical and pharmacy spend divided by member-months " +
          "for the attributed population (un-risk-adjusted gross spend).",
        unit: "USD PMPM",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 450,
          high: 1100,
          basis: "Line-of-business dependent (commercial vs MA vs Medicaid)",
          label: "planning-range",
        },
        dataSource: "Payer claims feeds aggregated over member-months",
        whyItMatters:
          "The raw cost trend before risk adjustment; the denominator for trend " +
          "management and the simplest figure a contract negotiation anchors on.",
      },
      {
        key: "hedis_stars_gap_closure",
        name: "HEDIS / Stars quality gap closure rate",
        definition:
          "Share of open care/quality gaps (screenings, controls, adherence " +
          "measures) closed within the measurement year for the population.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 85,
          basis: "Measure-dependent; high-performing programs sustain >80%",
          label: "planning-range",
        },
        dataSource:
          "Quality registry / supplemental data vs measure denominators (HEDIS engine)",
        whyItMatters:
          "Drives Stars/quality bonuses and shared-savings quality gates; an " +
          "unmet quality gate can forfeit earned savings entirely.",
      },
      {
        key: "pct_population_risk_stratified",
        name: "% of population risk-stratified",
        definition:
          "Share of attributed members assigned a current risk tier from a " +
          "stratification model that blends claims, clinical, and SDOH signals.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 95,
          basis: "Operator experience; data-complete programs reach >90%",
          label: "planning-range",
        },
        dataSource: "Risk-stratification model output vs attributed roster",
        whyItMatters:
          "You cannot manage what you have not stratified; coverage gates every " +
          "downstream care-management intervention and resource allocation.",
      },
      {
        key: "care_plan_adherence",
        name: "Care-plan adherence rate",
        definition:
          "Share of enrolled care-management members meeting the agreed care- " +
          "plan touchpoints and self-management goals over the period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 75,
          basis: "Program design and engagement model dependent; peer ranges",
          label: "planning-range",
        },
        dataSource: "Care-management platform activity + outcome tracking",
        whyItMatters:
          "Adherence is the proximate cause of avoided admissions and ED; weak " +
          "adherence is the usual reason a well-designed program fails to bend cost.",
      },
      {
        key: "attributed_lives",
        name: "Attributed lives under management",
        definition:
          "Count of members attributed to the provider across VBC contracts, " +
          "tracked with attribution stability (churn in/out) by contract.",
        unit: "members",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 25000,
          high: 250000,
          basis: "Program scale dependent; ACOs commonly 10k–100k+ Medicare lives",
          label: "planning-range",
        },
        dataSource: "Attribution rosters from each payer/CMS by contract period",
        whyItMatters:
          "The denominator for every per-member metric and the scale on which " +
          "fixed care-management investment amortizes; attribution churn erodes ROI.",
      },
      {
        key: "shared_savings_achieved",
        name: "Shared savings achieved",
        definition:
          "Earned shared savings (or avoided losses) as a share of the contract " +
          "benchmark expenditure for the performance year, after quality gating.",
        unit: "% of benchmark",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 0,
          high: 0.05,
          basis: "MSSP/ACO settlement experience; many programs settle near zero",
          label: "planning-range",
        },
        dataSource: "CMS/payer settlement reports vs benchmark expenditure",
        whyItMatters:
          "The realized financial outcome of the whole VBC machine — and an " +
          "honest reminder that a large attributed population can still settle flat.",
      },
      {
        key: "tcoc_trend",
        name: "Total-cost-of-care trend",
        definition:
          "Year-over-year change in risk-adjusted PMPM for the attributed " +
          "population versus the contract trend target / benchmark trend.",
        unit: "% YoY vs target",
        directionOfGood: "lower",
        benchmarkRange: {
          low: -0.02,
          high: 0.04,
          basis: "Relative to benchmark/national trend; below-trend = savings",
          label: "planning-range",
        },
        dataSource: "Risk-adjusted PMPM time series vs benchmark trend",
        whyItMatters:
          "Beating trend — not absolute cost — is how shared savings are earned; " +
          "the trend gap is the truest read on whether the program is working.",
      },
    ],

    painThemes: [
      {
        key: "attribution_instability",
        name: "Attribution instability & leakage",
        description:
          "Members churn in and out of the attributed panel and seek care " +
          "out-of-network, so care-management investment lands on members who " +
          "leave before value is realized and out-of-network spend escapes control.",
        detectionSignal:
          "High attribution churn between performance periods, large out-of- " +
          "network spend share, members managed who are no longer attributed at settlement.",
        diagnosticQuestion:
          "What is your attribution churn between periods, and how much of your " +
          "attributed TCOC is out-of-network spend you cannot directly influence?",
      },
      {
        key: "risk_adjustment_inaccuracy",
        name: "Risk-adjustment inaccuracy (under- and over-capture)",
        description:
          "Conditions present in the record are not coded (understating acuity " +
          "and benchmarks) while unsupported codes create RADV/audit exposure — " +
          "both distort the financial baseline VBC settles against.",
        detectionSignal:
          "RAF below clinically expected for the population, suspect conditions " +
          "with thin documentation, year-over-year recapture gaps for chronic HCCs.",
        diagnosticQuestion:
          "How do you validate that coded HCCs are both complete AND " +
          "documentation-supported, and what is your chronic-condition recapture rate?",
      },
      {
        key: "interoperability_gaps",
        name: "Data interoperability & latency gaps",
        description:
          "Claims arrive 60–90 days late, clinical data sits in disconnected " +
          "EHRs, and ADT feeds are partial — so stratification and intervention " +
          "run on stale, incomplete data and miss the actionable window.",
        detectionSignal:
          "Claims lag measured in months, no real-time ADT for admissions/ED, " +
          "low supplemental-data feed coverage, manual chart chases for quality gaps.",
        diagnosticQuestion:
          "What is your claims data lag, do you have real-time ADT notifications, " +
          "and what share of clinical/quality data flows in automatically vs manual chase?",
      },
      {
        key: "care_gap_backlog",
        name: "Quality / care-gap closure backlog",
        description:
          "Open HEDIS/Stars gaps accumulate faster than outreach can close them, " +
          "and supplemental data isn't captured, so measured performance lags " +
          "true performance and quality gates are missed at settlement.",
        detectionSignal:
          "Large open-gap inventory late in the measurement year, low gap- " +
          "closure rate, heavy reliance on year-end chart abstraction.",
        diagnosticQuestion:
          "What is your open care-gap inventory and closure rate by measure, and " +
          "how much quality credit depends on year-end manual abstraction?",
      },
      {
        key: "high_cost_concentration",
        name: "High-cost / rising-risk member concentration",
        description:
          "A small share of members drives most of the spend, but programs " +
          "over-focus on the already-high-cost (regression to the mean) and miss " +
          "the rising-risk cohort where intervention actually changes trajectory.",
        detectionSignal:
          "Top 5% of members >50% of spend, care management concentrated on " +
          "stable high-cost members, no rising-risk model or impactability scoring.",
        diagnosticQuestion:
          "Do you target rising-risk and impactable members, or only the current " +
          "top-cost cohort that tends to regress to the mean regardless?",
      },
      {
        key: "transitions_of_care_failure",
        name: "Failed transitions of care",
        description:
          "Discharges happen without timely follow-up, medication " +
          "reconciliation, or PCP handoff, so avoidable readmissions and ED " +
          "returns occur in the high-risk 7–30 day post-discharge window.",
        detectionSignal:
          "Low 7-day post-discharge follow-up rate, readmissions clustered in " +
          "the first two weeks, no ADT-triggered transitions workflow.",
        diagnosticQuestion:
          "What is your 7-day post-discharge follow-up rate, and is it triggered " +
          "automatically by an ADT discharge event or discovered after the fact?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "rising_risk_stratification",
        name: "Rising-risk stratification & impactability scoring",
        valueMechanism:
          "Blend claims, clinical, and SDOH signals to predict which members " +
          "are trending toward high cost AND are impactable, so finite care- " +
          "management capacity targets members where intervention changes the " +
          "trajectory rather than the already-high-cost who regress to the mean.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Historical claims with cost and utilization outcomes",
          "Clinical data (problem lists, labs, vitals) from EHR",
          "SDOH and engagement signals where available",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Models can encode bias — validate for equity across subpopulations",
          "Impactability, not just risk, must drive enrollment to avoid wasting capacity",
        ],
        metricsMoved: [
          "pct_population_risk_stratified",
          "admissions_per_1000",
          "risk_adjusted_tcoc",
        ],
      },
      {
        key: "hcc_coding_gap_detection",
        name: "HCC suspecting & coding-gap detection",
        valueMechanism:
          "Surface clinically-supported but uncoded HCC conditions from notes, " +
          "labs, and meds for clinician confirmation at the point of care — " +
          "raising risk-adjustment ACCURACY (recapture of chronic conditions) " +
          "without inflating unsupported codes.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Clinical documentation, lab results, and medication lists",
          "Prior-year coded HCCs for recapture tracking",
          "Coding guidelines and documentation-support rules",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Every suggested code must be clinician-confirmed and documentation-supported",
          "Suspecting must not become up-coding — RADV audit exposure is severe",
        ],
        metricsMoved: ["raf_capture_accuracy", "shared_savings_achieved"],
      },
      {
        key: "transitions_of_care_orchestration",
        name: "ADT-triggered transitions-of-care orchestration",
        valueMechanism:
          "Use real-time admit/discharge/transfer events to auto-trigger post- " +
          "discharge follow-up, medication reconciliation, and PCP handoff in the " +
          "high-risk window — converting missed handoffs into prevented readmissions.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Real-time ADT feed (HIE or direct facility feeds)",
          "Attributed-member roster for event matching",
          "Care-management platform for task orchestration",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Clinical follow-up decisions stay with care managers and clinicians",
          "ADT match accuracy gates everything — false matches waste scarce outreach",
        ],
        metricsMoved: [
          "readmission_rate",
          "ed_utilization_per_1000",
          "care_plan_adherence",
        ],
      },
      {
        key: "care_gap_closure_automation",
        name: "Quality care-gap detection & outreach automation",
        valueMechanism:
          "Detect open HEDIS/Stars gaps in near-real-time from clinical and " +
          "supplemental data and orchestrate prioritized, personalized outreach — " +
          "closing gaps earlier in the year and reducing year-end chart chases.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Measure denominators and current gap status",
          "Supplemental clinical / lab data feeds",
          "Member contact and channel-preference data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Supplemental data must meet measure-specific evidence standards",
          "Outreach must respect member-communication and consent rules",
        ],
        metricsMoved: ["hedis_stars_gap_closure", "care_plan_adherence"],
      },
      {
        key: "tcoc_drivers_analytics",
        name: "Total-cost-of-care driver analytics & leakage detection",
        valueMechanism:
          "Decompose risk-adjusted TCOC into drivers (sites of care, leakage, " +
          "avoidable utilization, pharmacy) and flag network leakage and " +
          "low-value care, directing contracting and care-redesign where the " +
          "trend gap is largest.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Complete claims (medical + pharmacy) for the attributed population",
          "Benchmark / target trend by contract",
          "Network and referral data for leakage analysis",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Late/incomplete claims distort driver attribution — flag data latency",
          "Leakage findings drive contracting decisions — validate before acting",
        ],
        metricsMoved: [
          "risk_adjusted_tcoc",
          "tcoc_trend",
          "pmpm_cost",
        ],
      },
      {
        key: "complex_care_copilot",
        name: "Care-manager copilot for complex-care management",
        valueMechanism:
          "Summarize a member's longitudinal record, surface open gaps and " +
          "barriers, and draft care-plan updates so care managers spend time on " +
          "members and decisions rather than chart assembly — raising panel " +
          "capacity and adherence.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Longitudinal clinical + claims record per member",
          "Care-plan templates and care-management workflow data",
          "Open care-gap and SDOH context",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Summaries can omit or hallucinate — care manager verifies before acting",
          "PHI handling and care-plan accountability remain with the clinician",
        ],
        metricsMoved: ["care_plan_adherence", "admissions_per_1000"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "population_health_data_platform",
        name: "Population-health data platform & longitudinal record",
        description:
          "An ingestion-and-normalization layer that unifies multi-payer claims, " +
          "EHR clinical data, ADT, pharmacy, and SDOH into an attributed " +
          "longitudinal member record — the substrate all stratification, quality, " +
          "and TCOC analytics depend on.",
        boundary:
          "Owns data unification, identity matching, and the longitudinal record; " +
          "does not make clinical or enrollment decisions.",
        humanAccountabilityPoint: "Chief Population Health Officer / VP Population Health",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "risk_stratification_engine",
        name: "Risk stratification & impactability engine",
        description:
          "A model layer that assigns each attributed member a risk tier and " +
          "impactability score, feeding a prioritized work list into care " +
          "management so finite capacity targets rising-risk, impactable members.",
        boundary:
          "Owns stratification and prioritization output; does not enroll members " +
          "or set care plans — those are clinical decisions.",
        humanAccountabilityPoint: "Care Management Director",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "transitions_of_care_workflow",
        name: "ADT-driven transitions-of-care workflow",
        description:
          "Real-time ADT events match to the attributed roster and trigger a " +
          "standardized post-discharge protocol (follow-up scheduling, med " +
          "reconciliation, PCP handoff) tracked to closure in the care platform.",
        boundary:
          "Owns transition orchestration and follow-up tracking; does not make " +
          "the clinical follow-up decision, which stays with care managers/clinicians.",
        humanAccountabilityPoint: "Transitions-of-Care / Care Management Lead",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "quality_risk_capture_hub",
        name: "Quality & risk-capture closed-loop hub",
        description:
          "A combined HEDIS/Stars gap and HCC-suspecting engine that routes " +
          "documentation-supported suspects and open quality gaps to clinicians " +
          "and outreach, with audit trail for both quality credit and coding support.",
        boundary:
          "Owns gap/suspect detection, routing, and audit trail; does not assign " +
          "codes or close gaps autonomously — clinician confirmation is required.",
        humanAccountabilityPoint: "VP Quality / Risk Adjustment Director",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "vbc_contract_performance_engine",
        name: "VBC contract & settlement performance engine",
        description:
          "Models each VBC contract's benchmark, attribution, quality gates, and " +
          "risk corridors to project shared-savings position in-year and isolate " +
          "the levers (trend, quality, risk accuracy) that move settlement.",
        boundary:
          "Owns contract modeling and performance projection; does not negotiate " +
          "contracts or determine clinical strategy.",
        humanAccountabilityPoint: "VP Value-Based Care / Managed Care Contracting",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "VBC value is earned by beating a risk-adjusted benchmark, not by " +
        "cutting absolute cost. Three levers compound: (1) risk-adjustment " +
        "ACCURACY sets a fair baseline and benchmark; (2) care management bends " +
        "avoidable utilization (admissions, ED, readmissions) for impactable, " +
        "attributed members; (3) quality performance unlocks the gate that lets " +
        "earned savings be paid. Each is throttled by data interoperability and " +
        "attribution stability — value not measured, or earned on members who " +
        "leave, never settles.",
      dominantHaircutFactors: [
        {
          factor: "Attribution stability & network leakage",
          rationale:
            "Care-management investment on members who churn out before " +
            "settlement, and out-of-network spend you cannot influence, erase a " +
            "large share of modeled savings.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Observed attribution churn and out-of-network leakage in ACO/MA programs",
            label: "planning-range",
          },
        },
        {
          factor: "Data interoperability & latency",
          rationale:
            "Claims lag and incomplete clinical/ADT feeds delay stratification " +
            "and intervention past the actionable window, capping realizable value.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Implementation experience where claims lag and feed gaps blunted intervention",
            label: "planning-range",
          },
        },
        {
          factor: "Regression to the mean & impactability",
          rationale:
            "Much high cost reverts without intervention; programs that don't " +
            "isolate impactable members over-credit naturally-occurring decline.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Care-management evaluation literature on regression-to-the-mean confounding",
            label: "planning-range",
          },
        },
        {
          factor: "Engagement & adherence",
          rationale:
            "Identified members must actually engage and adhere; weak engagement " +
            "is the most common reason a sound design fails to bend cost.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis: "Care-management engagement-rate experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Risk-adjusted TCOC / trend reduction",
          range: {
            low: 0.01,
            high: 0.04,
            basis:
              "Reported below-benchmark trend gaps from mature population-health programs",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in risk-adjusted PMPM vs benchmark trend",
        },
        {
          lever: "Avoidable admission reduction (high-risk cohort)",
          range: {
            low: 0.08,
            high: 0.2,
            basis:
              "Reported reductions in ambulatory-care-sensitive admissions from complex-care programs",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in admissions_per_1000 for the managed cohort",
        },
        {
          lever: "Risk-adjustment accuracy uplift (chronic recapture)",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Recapture of supported, previously-uncoded chronic HCCs vs prior year",
            label: "planning-range",
          },
          measuredAs: "Increase in documentation-supported RAF vs prior-year baseline",
        },
      ],
      timeToValueBand:
        "Quality gap closure and risk-accuracy recapture: 1–2 quarters within a " +
        "measurement year. Utilization reduction (readmissions, ED, admissions): " +
        "2–4 quarters as care management ramps. Settled shared savings: typically " +
        "12–18+ months given claims runout and annual settlement cycles.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Population-health / care-management platform",
          role: "System of record for risk stratification, care plans, and member outreach.",
          examples: [
            "Epic Healthy Planet",
            "Innovaccer",
            "Arcadia",
            "Health Catalyst",
          ],
        },
        {
          name: "Electronic health record (clinical source)",
          role: "Source of clinical data — problem lists, labs, vitals, encounters.",
          examples: ["Epic", "Oracle Health (Cerner)"],
        },
        {
          name: "Claims & analytics warehouse",
          role: "Multi-payer claims, TCOC, and benchmark analytics substrate.",
          examples: [
            "Payer 837/835 claims feeds",
            "ACO data warehouse / analytics layer",
          ],
        },
        {
          name: "Health information exchange / ADT feed",
          role: "Real-time admit/discharge/transfer notifications for transitions.",
          examples: ["Regional HIE", "ADT notification service"],
        },
        {
          name: "Risk-adjustment / HCC coding tooling",
          role: "Suspecting, coding-gap detection, and RAF computation.",
          examples: ["HCC suspecting engine", "Risk-adjustment analytics module"],
        },
      ],
      roles: [
        {
          title: "Chief Population Health Officer / VP Population Health",
          accountability:
            "Total-cost-of-care performance and VBC outcomes across contracts.",
        },
        {
          title: "VP Value-Based Care / Managed Care Contracting",
          accountability:
            "VBC contract design, benchmarks, and shared-savings settlement.",
        },
        {
          title: "Care Management Director",
          accountability:
            "Stratification-to-enrollment, care-plan execution, and adherence.",
        },
        {
          title: "Risk Adjustment Director",
          accountability: "Accurate, documentation-supported HCC capture and recapture.",
        },
        {
          title: "VP Quality",
          accountability: "HEDIS/Stars performance and quality-gate attainment.",
        },
      ],
      regulatoryFrames: [
        {
          name: "Medicare Shared Savings Program (MSSP) / ACO",
          relevance:
            "Defines attribution, benchmarks, risk corridors, and quality gates for Medicare ACOs.",
        },
        {
          name: "Medicare Advantage risk adjustment (CMS-HCC) & RADV audits",
          relevance:
            "Governs risk-adjusted payment and audits coding accuracy — the over-capture exposure.",
        },
        {
          name: "HEDIS / CMS Star Ratings",
          relevance:
            "Quality measurement that gates shared savings and drives MA quality bonuses.",
        },
        {
          name: "HIPAA / HITECH & interoperability rules (TEFCA, Info Blocking)",
          relevance:
            "Govern PHI exchange and mandate the data sharing population health depends on.",
        },
      ],
      canonicalTerms: [
        {
          term: "RAF / HCC",
          definition:
            "Risk Adjustment Factor derived from Hierarchical Condition Categories — coded acuity that sets risk-adjusted payment and benchmarks.",
        },
        {
          term: "Attribution",
          definition:
            "The rule (claims-based or voluntary alignment) assigning a member to a provider for accountability under a VBC contract.",
        },
        {
          term: "TCOC",
          definition:
            "Total Cost of Care — all medical and pharmacy spend for an attributed population, the VBC scoreboard.",
        },
        {
          term: "Benchmark / shared savings",
          definition:
            "The expected spend a VBC contract measures performance against; savings below it (after quality gates) are shared.",
        },
        {
          term: "ADT",
          definition:
            "Admit/Discharge/Transfer event feed used to trigger real-time transitions-of-care intervention.",
        },
        {
          term: "Rising risk",
          definition:
            "Members trending toward high cost who are still impactable — the highest-yield care-management target.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Risk-adjusted total cost of care and trend",
        authoritativeSource:
          "Multi-payer claims aggregated to PMPM, risk-adjusted by RAF, vs contract benchmark",
        whatGoodEvidenceLooksLike:
          "Risk-adjusted PMPM time series for the attributed population with the benchmark/trend target and claims-runout completeness noted.",
        weakEvidenceToReject:
          "An un-risk-adjusted gross PMPM, or a figure with no benchmark and no claims-completeness context.",
      },
      {
        claim: "RAF / HCC capture accuracy",
        authoritativeSource:
          "Coded HCCs vs chart-validated, documentation-supported conditions",
        whatGoodEvidenceLooksLike:
          "Recapture and suspect-confirmation rates with documentation support, plus a RADV-style audit sample.",
        weakEvidenceToReject:
          "A raw RAF increase presented as 'improvement' without evidence each code is documentation-supported.",
      },
      {
        claim: "Avoidable utilization (admissions, ED, readmissions)",
        authoritativeSource:
          "Claims + ADT events for the attributed population over a trailing period",
        whatGoodEvidenceLooksLike:
          "Per-1,000 rates with ambulatory-care-sensitive subsets and a comparison vs a matched or prior-period cohort.",
        weakEvidenceToReject:
          "A raw count or single-period rate with no denominator, attribution scope, or comparison.",
      },
      {
        claim: "Shared savings / contract performance",
        authoritativeSource: "CMS/payer settlement reports vs benchmark expenditure",
        whatGoodEvidenceLooksLike:
          "Settled (or projected with stated method) savings against benchmark, after quality gating, by contract.",
        weakEvidenceToReject:
          "A modeled gross savings number with no benchmark, no quality gate, and no attribution basis.",
      },
      {
        claim: "Care-management program effect",
        authoritativeSource:
          "Enrolled-cohort outcomes vs a matched comparison, adjusting for regression to the mean",
        whatGoodEvidenceLooksLike:
          "Pre/post utilization for engaged members against a matched control, with impactability and engagement noted.",
        weakEvidenceToReject:
          "Pre/post on the high-cost cohort with no control — almost certainly regression to the mean.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your risk-adjusted total cost of care versus benchmark, and how much of attributed spend is out-of-network leakage?",
      "How do you validate that coded HCCs are both complete and documentation-supported, and what is your chronic-condition recapture rate?",
      "What is your claims data lag, do you have real-time ADT, and what share of clinical/quality data flows automatically vs manual chase?",
      "What share of your attributed population is currently risk-stratified, and do you target rising-risk and impactable members or only current top-cost?",
      "What is your 7-day post-discharge follow-up rate, and is it ADT-triggered or discovered after the fact?",
      "What is your open care-gap inventory and HEDIS/Stars closure rate, and how much quality credit depends on year-end manual abstraction?",
      "Across your VBC contracts, what is your attribution churn, and how did your last performance year settle against benchmark after quality gates?",
    ],
    maturitySignals: [
      "A unified longitudinal record blends claims, clinical, ADT, and SDOH — not siloed payer reports.",
      "Risk stratification scores impactability, not just risk, and feeds a prioritized care-management work list.",
      "HCC capture is validated for documentation support and tracked for chronic recapture, not maximized.",
      "Transitions of care are ADT-triggered and tracked to closure, and program effect is measured against a matched comparison.",
    ],
    redFlags: [
      "Total cost of care is reported un-risk-adjusted, or with no benchmark to settle against.",
      "RAF is being 'improved' with no evidence each code is documentation-supported — RADV exposure.",
      "Care management is concentrated on already-high-cost members with no rising-risk or impactability model.",
      "No real-time ADT feed exists, so transitions and avoidable-utilization intervention run on stale claims.",
      "Program savings are claimed pre/post with no matched control — likely regression to the mean.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EHR-native population health (e.g. Epic Healthy Planet)",
        category: "Care management / registry / quality on the EHR",
        switchingCost:
          "High — fused to the EHR and clinical workflow; replacement is a platform-level decision.",
        renewalDynamics:
          "Bundled with the enterprise EHR agreement; rarely sourced standalone.",
      },
      {
        vendorName: "Independent population-health & analytics platforms",
        category: "Multi-payer data aggregation, stratification, TCOC analytics",
        switchingCost:
          "Moderate-to-high — owns the unified data model and feeds; migration is a data-integration program.",
        renewalDynamics:
          "Often PMPM or per-attributed-life pricing; scrutinize as attributed lives scale.",
      },
      {
        vendorName: "Risk-adjustment / HCC coding & suspecting vendors",
        category: "HCC suspecting, coding-gap detection, RAF analytics",
        switchingCost:
          "Moderate — integrates via clinical/claims feeds; swappable with mapping effort.",
        renewalDynamics:
          "Sometimes contingency/per-chart pricing; favor accuracy-and-audit terms over volume.",
      },
      {
        vendorName: "ADT / HIE notification services",
        category: "Real-time event notification for transitions of care",
        switchingCost:
          "Low-to-moderate — feed-based and regionally constrained; depends on HIE participation.",
        renewalDynamics:
          "Subscription or per-event; coverage completeness matters more than price.",
      },
    ],
    switchingCosts:
      "The data-platform/longitudinal-record layer is the sticky core — switching it is a multi-quarter data-integration program. Point solutions (HCC suspecting, ADT, gap closure) around it are moderately switchable, which is where negotiation leverage concentrates.",
    negotiationLevers: [
      "Per-attributed-life pricing tied to measured TCOC or quality outcomes, not seats",
      "Data portability and exit rights to avoid lock-in of the unified record",
      "Audit and explainability access for risk-adjustment and stratification models",
      "Coverage/completeness SLAs for claims, ADT, and supplemental data feeds",
      "Pilot-to-scale gating with matched-control outcome proof before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      tcoc_metric: [
        "risk-adjusted PMPM",
        "contract benchmark / trend target",
        "claims-runout completeness note",
      ],
      risk_adjustment_claim: [
        "coded HCCs",
        "documentation support",
        "chart-validated condition",
      ],
      utilization_metric: [
        "claims + ADT events",
        "per-1,000 denominator with attribution scope",
        "comparison or matched cohort",
      ],
      quality_metric: ["measure denominator", "supplemental data meeting measure standard"],
      savings_claim: [
        "benchmark expenditure",
        "settlement or stated projection method",
        "quality-gate status",
      ],
      program_effect_claim: [
        "enrolled cohort outcome",
        "matched comparison",
        "regression-to-the-mean adjustment",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "TCOC and savings claims cite the risk-adjusted basis, the contract " +
      "benchmark, and claims-runout completeness — never an un-risk-adjusted or " +
      "un-benchmarked figure. Risk-adjustment claims cite documentation support, " +
      "not just a RAF delta. Program-effect claims cite a matched comparison; a " +
      "bare pre/post is rejected as regression to the mean. Value projections " +
      "cite a baseline plus a labelled planning range and the haircut factors " +
      "applied — never a single asserted ROI number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no risk-adjusted or benchmarked TCOC — frame cost as an industry pattern, not their measured savings.",
      "Program effect is shown pre/post with no control — flag regression to the mean and present cautiously.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges.",
      "Vendor-reported outcomes are cited — mark as vendor claims pending matched-control validation.",
      "Claims runout is incomplete for the period — note that figures will shift as claims mature.",
    ],
    inferenceLanguage: [
      "Across attributed populations of this type, risk-adjusted cost typically runs...",
      "Without your benchmark and runout-complete claims, the industry pattern suggests...",
      "Peer ACO/MA programs at this scale commonly see avoidable-utilization rates of...",
      "Absent a matched comparison, the apparent improvement may reflect regression to the mean...",
    ],
    flagWithoutEvidence: [
      "A specific shared-savings dollar amount or ROI for this tenant",
      "This tenant's actual risk-adjusted TCOC or trend gap",
      "A claim that this tenant's risk adjustment is accurate (vs documentation-supported)",
      "A claim that a care-management program caused a specific cost reduction without a matched control",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "total cost of care drivers / where is spend concentrated",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack risk-adjusted TCOC by driver (inpatient, ED, pharmacy, leakage) to show where the trend gap concentrates.",
    },
    {
      questionPattern: "utilization or TCOC trend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend risk-adjusted PMPM or per-1,000 utilization against benchmark/target trend.",
    },
    {
      questionPattern: "shared-savings bridge / what moves settlement",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from benchmark to projected settlement via trend, risk accuracy, and quality, with haircuts.",
    },
    {
      questionPattern: "risk-stratification distribution / population by risk tier",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      note: "Show attributed population by risk tier and impactability so capacity allocation is visible.",
    },
    {
      questionPattern: "VBC / population-health KPI scorecard",
      exhibitKind: "table",
      note: "Risk-adjusted TCOC vs benchmark, readmissions, ED/1,000, admissions/1,000, RAF accuracy, HEDIS/Stars closure, attributed lives vs planning ranges.",
    },
    {
      questionPattern: "care-gap or HCC suspect work list",
      exhibitKind: "table",
      note: "Open quality gaps and documentation-supported HCC suspects by member, prioritized for outreach/clinician review.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "A unified, low-latency longitudinal record so stratification and intervention run on current data",
      "Stable attribution and managed network leakage so investment lands on members who settle",
      "Risk adjustment validated for documentation support, not maximized — accuracy sets a fair baseline",
      "Care management targets rising-risk, impactable members and measures effect against a matched control",
      "Quality performance clears the gate that lets earned savings actually be paid",
    ],
    failureDrivers: [
      "Stale or incomplete data (claims lag, no ADT) so intervention misses the actionable window",
      "Attribution churn and out-of-network leakage erasing modeled savings before settlement",
      "Over-coding HCCs for short-term risk revenue, creating RADV/audit exposure",
      "Managing the already-high-cost cohort and crediting regression to the mean as program effect",
      "Quality gates missed, forfeiting savings the cost work actually earned",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Risk-adjustment and quality-gap closure adopt first because they pay back " +
      "within the measurement year and the work is concrete. Care management scales " +
      "next as stratification trust builds, and TCOC/contract analytics mature last " +
      "once multi-payer data is unified — the data integration is the real gating step.",
    roiClarity: "medium",
    roiClarityBasis:
      "VBC ROI is genuinely harder to pin down than revenue cycle: settlement lags " +
      "12–18+ months on claims runout, attribution churn and out-of-network leakage " +
      "blunt attribution of savings, and program effect is confounded by regression " +
      "to the mean unless measured against a matched control. The prize is real but " +
      "the odds and the size hinge on attribution stability, risk-adjustment accuracy, " +
      "and data interoperability — which is why honest haircuts dominate the value model.",
  },

  regulatoryFrame: {
    name: "Medicare Shared Savings Program (MSSP/ACO) & MA risk adjustment (CMS-HCC / RADV)",
    relevance:
      "The dominant VBC frame: defines attribution, benchmarks, risk corridors, " +
      "and quality gates, and audits coding accuracy (RADV). HEDIS/Stars quality " +
      "and HIPAA/interoperability rules also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
