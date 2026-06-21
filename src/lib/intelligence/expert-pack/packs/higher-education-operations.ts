// Consilium expert — Higher Education & Research Institutions: Student
// Lifecycle & Academic Operations (industry-function).
//
// Wave ExpertPack v2. Domain: the operating spine of a university or college —
// the STUDENT LIFECYCLE (recruitment / admissions / enrollment, retention /
// student success / advising), academic operations, RESEARCH ADMINISTRATION
// (sponsored programs, grants, compliance), the SIS/LMS technology estate,
// FINANCIAL AID, and alumni / advancement, plus campus operations.
//
// CORE DOCTRINE — ENROLLMENT-CLIFF SURVIVAL, NOT GROWTH FANTASY. The honest
// truth for most institutions is existential: the demographic enrollment cliff
// plus net-tuition-revenue (NTR) compression — driven by tuition discounting —
// is the binding threat, not an upside story. STUDENT SUCCESS / RETENTION is
// the highest-ROI lever because keeping an already-recruited student is far
// cheaper than recruiting a new one, BUT it is gated by advising capacity and
// the quality of early-alert data the institution rarely has clean. The SIS
// (Banner / PeopleSoft Campus / Workday Student) is a decade-long replacement
// minefield — automation that assumes a modern, real-time SIS is fiction at
// most schools. Research compliance is NON-NEGOTIABLE and costly: it is a cost
// of doing sponsored research, not a place to "find efficiency" at the expense
// of audit exposure. And "AI for personalized learning" is mostly hype — the
// real, bankable wins are in administrative, advising, and financial-aid
// AUTOMATION. Throughout, SHARED GOVERNANCE (faculty senate, departmental
// autonomy) slows change and must be modeled as a real adoption constraint, not
// dismissed. This expert sizes survival and student success honestly, never an
// ROI that ignores the cliff, compliance, or governance.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";
import type { ExpertPackIdentity } from "@/lib/intelligence/expert-pack/expert-pack";

const identity = {
  id: "xp.higher-education.student-lifecycle-operations",
  expertName:
    "Higher Education — Student Lifecycle & Academic Operations Expert",
  kind: "industry-function",
  industry: "higher_education",
  functionKey: "student-lifecycle-operations",
  scopeNote:
    "Industry-function expert for universities and colleges covering the " +
    "student lifecycle and academic operations: recruitment, admissions, and " +
    "enrollment (yield, melt, cost-to-recruit); retention, student success, " +
    "and advising (first-to-second-year retention, graduation rates, advising " +
    "caseload, early alert); academic operations and the SIS/LMS estate; " +
    "research administration (sponsored programs, grants, indirect-cost " +
    "recovery, compliance); financial aid (packaging, verification, " +
    "Title IV); and alumni / advancement. Optimizes for ENROLLMENT-CLIFF " +
    "SURVIVAL and NET TUITION REVENUE, with student success/retention as the " +
    "highest-ROI lever — bounded by advising capacity, early-alert data " +
    "quality, the SIS replacement minefield, non-negotiable research " +
    "compliance, and shared governance. Excludes academic/curricular content " +
    "design and pedagogy (faculty-owned), the substance of research itself, " +
    "and athletics/auxiliary commercial enterprises beyond their operational " +
    "footprint.",
} satisfies ExpertPackIdentity;

export const higherEducationOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity,

  domain: {
    operatingMetrics: [
      {
        key: "enrollment_yield",
        name: "Enrollment yield rate",
        definition:
          "Share of admitted students who enroll (matriculate) for the term " +
          "they were admitted to — admitted-to-enrolled conversion.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 15,
          high: 40,
          basis:
            "Common Data Set / admissions benchmarks; highly selective and " +
            "loyal-region institutions exceed 40%, broad-access institutions " +
            "with heavy cross-application sit in the teens to low 20s",
          label: "planning-range",
        },
        dataSource:
          "Admissions CRM (e.g. Slate) funnel joined to SIS matriculation " +
          "records by entering cohort",
        whyItMatters:
          "Yield is the lever that converts an admit pool into actual net " +
          "tuition revenue. Falling yield forces deeper discounting or larger " +
          "admit pools, both of which compress NTR — it is the early-warning " +
          "gauge on the enrollment cliff.",
      },
      {
        key: "first_to_second_year_retention",
        name: "First-to-second-year retention rate",
        definition:
          "Share of first-time, full-time entering students who re-enroll for " +
          "their second fall term at the same institution.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 90,
          basis:
            "IPEDS retention benchmarks; selective residential institutions " +
            "reach high 80s-90%, open-access and high-Pell institutions often " +
            "sit in the 60s-low 70s",
          label: "planning-range",
        },
        dataSource:
          "SIS enrollment records cohort-tracked term over term (entering " +
          "cohort re-enrollment)",
        whyItMatters:
          "The single highest-ROI number in the building: a retained student " +
          "is multiple years of net tuition already recruited and paid for, so " +
          "a point of retention is worth far more than a point of new-student " +
          "yield. It is the metric the student-success thesis lives or dies on.",
      },
      {
        key: "graduation_rate",
        name: "Graduation rate (4-/6-year)",
        definition:
          "Share of a first-time, full-time entering cohort completing a " +
          "degree within 150% of normal time (6 years for a 4-year program), " +
          "with the 4-year rate tracked alongside.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "IPEDS graduation-rate benchmarks; elite residential institutions " +
            "exceed 90% six-year, broad-access and commuter institutions often " +
            "report 40-55%, with 4-year rates far lower",
          label: "planning-range",
        },
        dataSource:
          "SIS degree-conferral records cohort-tracked against the entering " +
          "cohort over 4 and 6 years",
        whyItMatters:
          "The headline accountability and outcomes number for accreditors, " +
          "rankings, families, and increasingly state performance funding. " +
          "Low completion signals unrealized tuition, unmet student outcomes, " +
          "and reputational risk all at once.",
      },
      {
        key: "net_tuition_revenue_per_student",
        name: "Net tuition revenue per student",
        definition:
          "Gross tuition and fees minus institutional financial aid " +
          "(scholarships/discounting), divided by enrolled students — the " +
          "actual tuition dollars realized per head.",
        unit: "USD / student",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 8000,
          high: 35000,
          basis:
            "NACUBO tuition-discounting and NTR studies; varies widely by " +
            "sector (public in-state lower, private higher) and is eroding as " +
            "discount rates climb past 50% at many privates",
          label: "planning-range",
        },
        dataSource:
          "Finance/ERP and financial-aid system: gross tuition, institutional " +
          "aid awarded, and headcount from the SIS",
        whyItMatters:
          "The bottom line of the enrollment business. Rising published tuition " +
          "paired with rising discounting can mask falling NTR — this metric " +
          "strips the illusion and is the number that determines institutional " +
          "solvency under the cliff.",
      },
      {
        key: "cost_to_recruit_per_enrolled",
        name: "Cost to recruit per enrolled student",
        definition:
          "Fully-loaded admissions and marketing spend (staff, travel, " +
          "advertising, search, agency fees) divided by the number of students " +
          "who actually enrolled.",
        unit: "USD / enrolled student",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 1500,
          high: 12000,
          basis:
            "Admissions cost-of-recruitment surveys; private institutions and " +
            "low-yield programs run far higher, and the cost rises as the cliff " +
            "shrinks the prospect pool",
          label: "planning-range",
        },
        dataSource:
          "Enrollment-management budget (staff rate-card x FTE, marketing/" +
          "search spend) over enrolled headcount from the admissions CRM/SIS",
        whyItMatters:
          "Frames the retention-vs-recruitment economics that drive this " +
          "expert: when cost-to-recruit is this high and climbing, every " +
          "retained student is a recruitment cost avoided — which is why " +
          "student success outperforms front-of-funnel spend.",
      },
      {
        key: "advising_caseload",
        name: "Advising caseload (students per advisor)",
        definition:
          "Average number of active students assigned per professional " +
          "academic advisor (or success coach).",
        unit: "students / advisor",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 150,
          high: 600,
          basis:
            "NACADA advising-ratio guidance (~300:1 commonly cited as a " +
            "ceiling for proactive advising); many institutions run 400-600:1, " +
            "which precludes proactive intervention",
          label: "planning-range",
        },
        dataSource:
          "Advising/student-success platform assignment records joined to " +
          "active-student counts from the SIS",
        whyItMatters:
          "The capacity constraint that gates the entire retention thesis. " +
          "Above ~300:1, advisors can only react to students who show up, not " +
          "proactively reach at-risk students — so early-alert data is useless " +
          "without the advising capacity to act on it.",
      },
      {
        key: "financial_aid_packaging_cycle_time",
        name: "Financial-aid packaging cycle time",
        definition:
          "Median elapsed days from a complete FAFSA/ISIR (and any verification " +
          "documents) to delivery of a finalized financial-aid award package to " +
          "the student.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 30,
          basis:
            "Financial-aid operations ranges; well-run offices package in days, " +
            "verification-heavy or understaffed offices stretch to weeks, " +
            "especially in ISIR-delay years",
          label: "planning-range",
        },
        dataSource:
          "Financial-aid management system: ISIR receipt and award-letter " +
          "timestamps, including verification holds",
        whyItMatters:
          "Aid timing directly drives yield and melt — admits who do not see a " +
          "clear, timely net-price commitment go elsewhere or melt over summer. " +
          "Verification burden is the largest compressible component, and it " +
          "falls hardest on the lowest-income students.",
      },
      {
        key: "time_to_degree",
        name: "Average time to degree",
        definition:
          "Average elapsed time (years or terms) from initial enrollment to " +
          "degree completion for graduates, including stop-outs.",
        unit: "years",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 4.0,
          high: 5.5,
          basis:
            "Completion-research ranges; residential full-time graduates near " +
            "4.0-4.3 years, commuter/part-time and transfer-heavy populations " +
            "extend to 5+ years",
          label: "planning-range",
        },
        dataSource:
          "SIS enrollment and degree-audit history per graduate (terms enrolled " +
          "to conferral)",
        whyItMatters:
          "Excess time-to-degree is wasted student cost and debt, a hidden " +
          "completion risk (longer means more chances to stop out), and a " +
          "capacity drain — every extra term is a seat not available to a new " +
          "student. Curriculum complexity and course availability are the " +
          "controllable drivers.",
      },
      {
        key: "course_dfw_rate",
        name: "Course DFW rate (D/F/withdraw)",
        definition:
          "Share of course enrollments ending in a grade of D, F, or " +
          "withdrawal, typically tracked for high-enrollment gateway courses.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 35,
          basis:
            "Gateway/bottleneck-course analyses; foundational STEM and " +
            "math/quantitative gateway courses commonly run 25-35% DFW, which " +
            "concentrates attrition risk",
          label: "planning-range",
        },
        dataSource:
          "SIS/LMS grade records by course and section, focused on " +
          "high-enrollment gateway courses",
        whyItMatters:
          "Gateway-course DFW is the most actionable leading indicator of " +
          "attrition and time-to-degree extension. A small number of " +
          "high-DFW bottleneck courses often explain a large share of stop-out " +
          "— making them the highest-leverage student-success target.",
      },
      {
        key: "indirect_cost_recovery_rate",
        name: "Research indirect-cost (F&A) recovery rate",
        definition:
          "Recovered facilities-and-administrative (indirect) cost as a share " +
          "of the institution's negotiated F&A rate applied to sponsored-award " +
          "direct costs — how much of negotiated overhead is actually realized.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 60,
          high: 95,
          basis:
            "Sponsored-programs benchmarks; leakage from capped/waived rates, " +
            "non-federal sponsors, and unrecovered effort means realized " +
            "recovery commonly runs below the negotiated rate",
          label: "planning-range",
        },
        dataSource:
          "Grants-management/ERP financial system: F&A recovered vs F&A " +
          "billable against the negotiated rate agreement",
        whyItMatters:
          "Indirect-cost recovery funds the research enterprise's shared " +
          "infrastructure; under-recovery means research literally operates at " +
          "a subsidized loss to the institution. It is the core economic gauge " +
          "of whether sponsored research is financially sustainable.",
      },
      {
        key: "sponsored_research_compliance_findings",
        name: "Sponsored-research compliance findings",
        definition:
          "Count (or rate per award) of audit/monitoring findings across " +
          "sponsored programs — effort reporting, allowability, cost transfers, " +
          "subrecipient monitoring, and protocol/regulatory compliance.",
        unit: "findings / period",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0,
          high: 10,
          basis:
            "Research-compliance program ranges (expressed against award " +
            "volume); a well-run program drives material findings toward zero, " +
            "since findings carry disallowance, repayment, and reputational risk",
          label: "planning-range",
        },
        dataSource:
          "Single Audit (Uniform Guidance) results, sponsor monitoring reports, " +
          "and internal research-compliance reviews",
        whyItMatters:
          "Compliance findings are non-negotiable risk: they can trigger cost " +
          "disallowances, repayment, expanded audit, and even debarment from " +
          "federal funding. This is the metric that proves research compliance " +
          "is a cost to be funded, not an efficiency to be cut.",
      },
      {
        key: "alumni_giving_participation",
        name: "Alumni giving participation rate",
        definition:
          "Share of solicitable alumni who make at least one gift in the " +
          "fiscal year — the breadth (not size) of the donor base.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "CASE/VSE advancement benchmarks; most institutions report " +
            "single-digit to low-double-digit participation, with elite " +
            "residential alumni bases higher",
          label: "planning-range",
        },
        dataSource:
          "Advancement CRM giving records over the solicitable alumni base of " +
          "record",
        whyItMatters:
          "Participation is the leading indicator of long-term advancement " +
          "health and donor-pipeline depth (and historically a rankings input), " +
          "and a diversified-revenue counterweight to tuition dependence under " +
          "the cliff.",
      },
    ],

    painThemes: [
      {
        key: "enrollment_cliff_ntr_compression",
        name: "Enrollment cliff & net-tuition-revenue compression",
        description:
          "A shrinking pool of traditional-age students collides with rising " +
          "tuition discounting, so institutions chase a falling number of " +
          "prospects with deeper scholarships — published tuition rises while " +
          "net tuition revenue per student falls, threatening solvency.",
        detectionSignal:
          "Rising discount rate past 50%, flat/declining headcount, falling " +
          "yield, growing admit pools to hold class size, NTR-per-student " +
          "declining year over year despite tuition increases.",
        diagnosticQuestion:
          "Is your net tuition revenue per student rising or falling once you " +
          "net out institutional aid, and what is your discount-rate trend " +
          "against yield and headcount?",
      },
      {
        key: "retention_gated_by_advising_data",
        name: "Retention capped by advising capacity & early-alert data",
        description:
          "Student success is the highest-ROI lever, but advising caseloads " +
          "far above the proactive-advising ceiling and poor-quality, late, or " +
          "siloed early-alert data mean at-risk students are identified too " +
          "late or not acted on — so retention programs underdeliver.",
        detectionSignal:
          "Advising ratios well above ~300:1, no proactive outreach, " +
          "early-alert feeds that are sparse/late or not joined to advising " +
          "workflow, interventions with no closed loop on outcome.",
        diagnosticQuestion:
          "What is your advising caseload, and do advisors have timely, " +
          "trustworthy early-alert signals AND the capacity to act on them " +
          "before a student stops out?",
      },
      {
        key: "sis_replacement_minefield",
        name: "SIS replacement & legacy-estate minefield",
        description:
          "The student information system (Banner, PeopleSoft Campus, Workday " +
          "Student) is deeply customized, integrated with dozens of systems, " +
          "and faculty/registrar-governed — so modernization is a multi-year, " +
          "high-risk, high-cost replacement, and automation that assumes a " +
          "real-time modern SIS does not match reality.",
        detectionSignal:
          "Heavily customized/old SIS, batch or nightly data flows, a stalled " +
          "or feared SIS-replacement project, brittle integrations, manual " +
          "reconciliation between SIS, LMS, CRM, and finance.",
        diagnosticQuestion:
          "What is the state of your SIS — modern and API-accessible, or " +
          "heavily customized legacy — and is any automation you are planning " +
          "assuming real-time data the SIS cannot actually provide?",
      },
      {
        key: "financial_aid_verification_burden",
        name: "Financial-aid verification & packaging burden",
        description:
          "Manual FAFSA/ISIR verification, document chasing, and slow " +
          "packaging delay net-price clarity, drive summer melt, and fall " +
          "hardest on the lowest-income students — converting an aid-operations " +
          "bottleneck into lost enrollment and an equity problem.",
        detectionSignal:
          "Long packaging cycle time, high verification-selection workload, " +
          "summer melt concentrated among aid-dependent admits, manual " +
          "document collection, ISIR-delay disruption.",
        diagnosticQuestion:
          "How long does aid packaging take from a complete ISIR, how much of " +
          "that is verification, and how much of your melt is aid-dependent " +
          "students who never got a timely award?",
      },
      {
        key: "research_compliance_cost_and_risk",
        name: "Research-administration compliance cost & risk",
        description:
          "Sponsored-program compliance — effort reporting, allowability, cost " +
          "transfers, subrecipient monitoring, protocol/regulatory review — is " +
          "labor-intensive and non-negotiable, and under-investment shows up as " +
          "audit findings, disallowances, and indirect-cost under-recovery.",
        detectionSignal:
          "Audit/monitoring findings, slow award setup, late/effort-reporting " +
          "noncompliance, manual cost-transfer justification, indirect-cost " +
          "recovery below the negotiated rate, overloaded research-admin staff.",
        diagnosticQuestion:
          "What is your sponsored-research compliance finding history and your " +
          "realized indirect-cost recovery against the negotiated rate, and " +
          "where is the manual compliance burden concentrated?",
      },
      {
        key: "ai_personalized_learning_hype",
        name: "AI 'personalized learning' hype vs. administrative reality",
        description:
          "Attention and budget chase AI for personalized instruction and " +
          "tutoring where evidence and faculty buy-in are thin, while the real, " +
          "bankable wins in advising, financial-aid, admissions, and " +
          "research-admin automation are under-resourced — so AI spend lands in " +
          "the wrong place.",
        detectionSignal:
          "AI initiatives concentrated on courseware/tutoring with weak " +
          "outcome evidence, no business case for administrative automation, " +
          "faculty resistance to instructional AI, no measurement plan.",
        diagnosticQuestion:
          "Where is your AI investment pointed — at personalized learning, or " +
          "at the administrative, advising, and aid automation that has clearer " +
          "ROI and lower faculty-governance friction?",
      },
      {
        key: "shared_governance_change_drag",
        name: "Shared governance & decentralization change drag",
        description:
          "Faculty senate authority, departmental autonomy, and decentralized " +
          "ownership of curriculum, scheduling, and data mean enterprise change " +
          "requires consensus across many veto points — so even well-justified " +
          "operational improvements move slowly and unevenly.",
        detectionSignal:
          "Decentralized data and processes by college/department, " +
          "long approval cycles through governance bodies, inconsistent " +
          "adoption of central systems, 'every college does it differently.'",
        diagnosticQuestion:
          "Which decisions in this change require faculty-senate or " +
          "departmental consensus, and how have past enterprise initiatives " +
          "fared against that governance reality?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "proactive_advising_early_alert",
        name: "Proactive advising & early-alert student-success AI",
        valueMechanism:
          "Score enrolled students for attrition/stop-out risk from " +
          "engagement, grade, financial, and behavioral signals and route " +
          "prioritized, specific outreach to advisors and success coaches — so " +
          "scarce advising capacity is aimed at the students most likely to " +
          "leave, before they leave, lifting retention and completion.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Cohort-tracked SIS enrollment, grade, and registration data",
          "LMS engagement signals and early-alert/flag feeds",
          "Financial-aid and balance/hold data, advising workflow integration",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Risk scores must drive support, never punitive action or denial of opportunity; advisors own the intervention decision",
          "Models must be tested for bias so first-generation, low-income, and minority students are not stereotyped or steered",
          "Risk flags are useless without the advising capacity to act — capacity, not the model, is the binding constraint",
        ],
        metricsMoved: [
          "first_to_second_year_retention",
          "graduation_rate",
          "course_dfw_rate",
          "advising_caseload",
        ],
      },
      {
        key: "enrollment_yield_aid_optimization",
        name: "Enrollment yield & financial-aid leveraging optimization",
        valueMechanism:
          "Model admit-pool conversion and price sensitivity to target " +
          "recruitment effort and aid awards where they most move yield and " +
          "net tuition revenue — improving the class while protecting NTR " +
          "rather than discounting indiscriminately.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Admissions-CRM funnel and historical yield by segment",
          "Financial-aid award and acceptance history (price response)",
          "Net-tuition-revenue and discount-rate data from finance",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Aid-leveraging models must respect access/equity commitments and not systematically disadvantage low-income applicants",
          "Enrollment leaders own award strategy; the model informs, it does not set policy on who gets aid",
        ],
        metricsMoved: [
          "enrollment_yield",
          "net_tuition_revenue_per_student",
          "cost_to_recruit_per_enrolled",
        ],
      },
      {
        key: "ai_admissions_aid_processing",
        name: "AI admissions, document & financial-aid processing automation",
        valueMechanism:
          "Extract and validate data from applications, transcripts, and " +
          "aid/verification documents, auto-complete routine review steps, and " +
          "pre-populate the SIS — compressing admissions and aid-packaging " +
          "cycle time so net-price clarity reaches admits sooner and melt falls.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Application, transcript, and aid/verification document corpora",
          "Admissions-CRM and financial-aid-system schemas to populate",
          "Aid rules, verification requirements, and Title IV constraints",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Low-confidence extractions and aid-eligibility determinations route to human review — no automated denial of admission or aid",
          "FERPA and Title IV govern handling of student records and aid data throughout",
        ],
        metricsMoved: [
          "financial_aid_packaging_cycle_time",
          "enrollment_yield",
          "cost_to_recruit_per_enrolled",
        ],
      },
      {
        key: "student_service_virtual_assistant",
        name: "Student-service conversational assistant & deflection",
        valueMechanism:
          "A grounded virtual assistant answers students' registration, " +
          "financial-aid, billing, and deadline questions and completes routine " +
          "transactions across web, chat, and SMS — deflecting routine contacts " +
          "from registrar, bursar, and aid offices and nudging students through " +
          "enrollment and re-enrollment steps.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Grounded knowledge base of policies, deadlines, and processes",
          "Authenticated SIS/aid/billing status for personalized answers",
          "Multilingual and accessibility-compliant channels",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Must not give incorrect aid/eligibility/academic-standing guidance — answers ground to cited policy with a human handoff always available",
          "FERPA-compliant identity verification required before disclosing student-specific information",
        ],
        metricsMoved: [
          "first_to_second_year_retention",
          "financial_aid_packaging_cycle_time",
          "enrollment_yield",
        ],
      },
      {
        key: "research_admin_compliance_automation",
        name: "Research-administration & compliance automation",
        valueMechanism:
          "Automate proposal budgeting, award setup, effort-reporting reminders, " +
          "allowability and cost-transfer checks, and subrecipient-monitoring " +
          "workflow — reducing the manual compliance burden, surfacing issues " +
          "before they become audit findings, and protecting indirect-cost " +
          "recovery.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Grants-management/ERP award, budget, and effort data",
          "Sponsor terms, Uniform Guidance rules, and the F&A rate agreement",
          "Compliance/protocol records and subrecipient documentation",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Compliance is non-negotiable: automation flags and drafts, but a research-administration/compliance officer approves determinations",
          "Audit-trail and source citation are mandatory — automated checks must be explainable to a federal auditor",
        ],
        metricsMoved: [
          "sponsored_research_compliance_findings",
          "indirect_cost_recovery_rate",
        ],
      },
      {
        key: "course_demand_scheduling_optimization",
        name: "Course-demand forecasting & schedule optimization",
        valueMechanism:
          "Forecast course demand from degree-audit and registration patterns " +
          "and optimize section offerings and capacity so students can get " +
          "required courses on time — relieving gateway bottlenecks, reducing " +
          "DFW pressure, and shortening time-to-degree without adding sections " +
          "blindly.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Degree-audit/requirement data and historical registration demand",
          "Course catalog, section capacity, and faculty-availability data",
          "Bottleneck/gateway-course DFW and waitlist history",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Scheduling and section decisions are department/faculty-governed; the model recommends, departments decide",
          "Optimization must not narrow access to required courses for part-time or working students",
        ],
        metricsMoved: [
          "time_to_degree",
          "course_dfw_rate",
          "graduation_rate",
        ],
      },
      {
        key: "advancement_donor_propensity",
        name: "Advancement donor-propensity & engagement targeting",
        valueMechanism:
          "Score alumni for giving propensity and capacity and recommend " +
          "outreach timing and channel, so advancement staff focus on the " +
          "donors and moments most likely to convert — lifting participation " +
          "and pipeline depth as a diversified-revenue counterweight to tuition.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Advancement-CRM giving history and engagement signals",
          "Alumni biographic and wealth/capacity indicators",
          "Event, communication, and volunteer-engagement data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Wealth-screening and propensity data carry privacy obligations and donor-relations sensitivity — gift officers own outreach",
          "Models must not entrench bias that under-cultivates under-represented alumni segments",
        ],
        metricsMoved: ["alumni_giving_participation"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "student_success_platform",
        name: "Integrated student-success & early-alert platform",
        description:
          "A platform that joins SIS, LMS, financial, and advising data into a " +
          "single risk-and-intervention workflow — surfacing at-risk students, " +
          "coordinating proactive advising and case-management outreach, and " +
          "closing the loop on intervention outcomes across the institution.",
        boundary:
          "Owns the risk-detection and advising-coordination layer; does not " +
          "own academic/grading decisions (faculty), nor add advising capacity " +
          "(staffing), which gates how much of the signal can be acted on.",
        humanAccountabilityPoint:
          "Vice Provost / AVP for Student Success / Retention",
        controlPosture: "human-in-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "enrollment_ntr_optimization",
        name: "Enrollment & net-tuition-revenue optimization model",
        description:
          "An enrollment-management capability that models funnel conversion, " +
          "aid-leveraging, and price response to shape the class and protect net " +
          "tuition revenue — sequencing recruitment spend and aid awards by " +
          "marginal yield/NTR rather than by discount habit, under explicit " +
          "access/equity guardrails.",
        boundary:
          "Owns yield/NTR modeling and award-strategy recommendation; does not " +
          "set tuition or aid policy (board/cabinet) or override access and " +
          "mission commitments.",
        humanAccountabilityPoint: "VP for Enrollment Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "research_admin_compliance_hub",
        name: "Research-administration & compliance automation hub",
        description:
          "A sponsored-programs control point that streamlines proposal-to-award " +
          "setup, effort reporting, allowability and cost-transfer checks, and " +
          "subrecipient monitoring with full audit trail — reducing manual " +
          "compliance burden while keeping every determination human-approved " +
          "and auditor-explainable.",
        boundary:
          "Owns sponsored-program workflow and compliance support; does not own " +
          "the conduct of research or the regulatory determinations themselves, " +
          "which remain with research-compliance officers and IRB/IACUC.",
        humanAccountabilityPoint:
          "AVP for Research / Director of Sponsored Programs",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "sis_strangler_modernization",
        name: "SIS strangler modernization & data-layer integration",
        description:
          "Modernize the student-data estate incrementally — wrapping the legacy " +
          "SIS with an integration/data layer and APIs and replacing capability " +
          "module by module — rather than a single big-bang SIS replacement, so " +
          "value (real-time advising, self-service, automation) lands sooner and " +
          "replacement risk is contained.",
        boundary:
          "Owns the integration/data layer and modernization sequencing; does " +
          "not own the registrar's system-of-record authority or the academic " +
          "policy encoded in the SIS.",
        humanAccountabilityPoint:
          "CIO / Registrar (joint) / Modernization Program Executive",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Higher-education value, honestly framed, is SURVIVAL and STUDENT " +
        "OUTCOMES under the enrollment cliff, not a growth story. The dominant " +
        "lever is RETENTION/STUDENT SUCCESS: keeping an already-recruited " +
        "student avoids a high and rising cost-to-recruit and preserves " +
        "multiple years of net tuition revenue, so a point of retention is " +
        "worth more than a point of front-of-funnel yield. The second lever is " +
        "NTR protection: smarter aid-leveraging and yield optimization defend " +
        "net tuition revenue against indiscriminate discounting. The third is " +
        "ADMINISTRATIVE AUTOMATION — advising, financial aid, admissions, and " +
        "research administration — which is where AI's bankable ROI actually " +
        "sits, NOT in personalized-learning hype. Research administration is a " +
        "compliance-and-recovery play, not an efficiency cut: the value is " +
        "protecting indirect-cost recovery and avoiding audit disallowance. " +
        "Three realities cap realizable value and must be modeled explicitly: " +
        "advising capacity and early-alert data quality gate retention upside; " +
        "the SIS replacement minefield gates how real-time and automated " +
        "anything can be; and shared governance gates adoption speed. Cost and " +
        "capacity models bind to the Workforce Economics substrate (advising/" +
        "admissions/aid/research-admin staffing rate-card x FTE) so claims " +
        "trace to the budget.",
      dominantHaircutFactors: [
        {
          factor: "Advising capacity & early-alert data quality",
          rationale:
            "Retention value is gated by whether advisors have the capacity to " +
            "act on risk signals and whether early-alert data is timely, " +
            "complete, and trustworthy; above the proactive-advising ceiling " +
            "and with sparse data, much of the modeled retention upside cannot " +
            "be realized.",
          typicalHaircut: {
            low: 0.2,
            high: 0.5,
            basis:
              "Observed gap between modeled retention impact and realized " +
              "impact where advising ratios exceed ~300:1 or early-alert feeds " +
              "are sparse/late",
            label: "planning-range",
          },
        },
        {
          factor: "SIS / data-estate readiness",
          rationale:
            "Legacy, heavily customized, batch-oriented SIS estates cap how " +
            "real-time and automated advising, self-service, and processing can " +
            "be; automation value is gated by what the data layer can actually " +
            "support before modernization.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Implementation experience where SIS data was batch-only, " +
              "siloed, or required heavy manual reconciliation",
            label: "planning-range",
          },
        },
        {
          factor: "Shared governance & decentralized adoption",
          rationale:
            "Faculty-senate authority and departmental autonomy slow and " +
            "fragment adoption of enterprise change, so even well-justified " +
            "operational improvements roll out unevenly and later than an " +
            "idealized timeline assumes.",
          typicalHaircut: {
            low: 0.1,
            high: 0.35,
            basis:
              "Higher-ed change-management experience on enterprise " +
              "initiatives subject to governance and departmental consensus",
            label: "planning-range",
          },
        },
        {
          factor: "Net-tuition-revenue / discounting reality",
          rationale:
            "Yield and enrollment gains can be eroded by the discounting " +
            "required to achieve them, so headline enrollment improvements do " +
            "not translate one-for-one into net tuition revenue and must be " +
            "scored net of incremental aid.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Tuition-discounting studies where enrollment gains were partly " +
              "or wholly offset by deeper institutional aid",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Retention / completion improvement",
          range: {
            low: 0.02,
            high: 0.1,
            basis:
              "Reported point gains in first-to-second-year retention from " +
              "proactive advising and early-alert programs (absolute " +
              "percentage-point uplift), gated by advising capacity",
            label: "planning-range",
          },
          measuredAs:
            "Absolute percentage-point gain in first_to_second_year_retention " +
            "(flowing to graduation_rate over time)",
        },
        {
          lever: "Net-tuition-revenue protection from aid/yield optimization",
          range: {
            low: 0.02,
            high: 0.08,
            basis:
              "Reported NTR-per-student protection from disciplined " +
              "aid-leveraging and yield optimization versus undifferentiated " +
              "discounting",
            label: "planning-range",
          },
          measuredAs:
            "Relative protection/uplift in net_tuition_revenue_per_student net " +
            "of incremental institutional aid",
        },
        {
          lever: "Administrative cycle-time & cost reduction",
          range: {
            low: 0.2,
            high: 0.5,
            basis:
              "Reported cycle-time and manual-effort reduction in financial-aid " +
              "packaging, admissions processing, and research-admin workflow " +
              "from automation",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in financial_aid_packaging_cycle_time and " +
            "manual administrative effort (advising/aid/research-admin FTE basis)",
        },
      ],
      timeToValueBand:
        "Student-service deflection and proactive-advising outreach: 1-3 " +
        "quarters. Financial-aid and admissions processing automation, and " +
        "course-demand/scheduling: 2-4 quarters, gated by SIS data access. " +
        "Enrollment/NTR optimization: 2-4 quarters but realized over a full " +
        "admission cycle. Research-admin compliance automation: 2-4 quarters " +
        "with audit-trail validation. SIS modernization (the long pole that " +
        "unlocks real-time automation): multi-year, sequenced via a strangler " +
        "approach rather than a big-bang replacement.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Student Information System (SIS)",
          role:
            "System of record for admissions, enrollment, registration, " +
            "grades, degree audit, and student accounts — the academic core " +
            "and the SIS-replacement minefield.",
          examples: [
            "Ellucian Banner",
            "Oracle PeopleSoft Campus Solutions",
            "Workday Student",
            "Ellucian Colleague",
          ],
        },
        {
          name: "Learning Management System (LMS)",
          role:
            "Course delivery, assignments, grades, and engagement signals; a " +
            "primary source of early-alert engagement data.",
          examples: ["Instructure Canvas", "Blackboard / Anthology", "D2L Brightspace"],
        },
        {
          name: "Admissions / recruitment CRM",
          role:
            "Manages the recruitment-to-enrollment funnel — inquiries, " +
            "applications, communications, yield, and melt.",
          examples: ["Technolutions Slate", "Salesforce Education Cloud", "Ellucian CRM Recruit"],
        },
        {
          name: "Financial-aid management system",
          role:
            "Processes FAFSA/ISIR, verification, packaging, awarding, and " +
            "Title IV disbursement and compliance.",
          examples: ["Ellucian Banner Financial Aid", "PeopleSoft Financial Aid", "CampusLogic / Regent"],
        },
        {
          name: "Student-success / advising platform",
          role:
            "Early-alert, case management, and proactive-advising workflow " +
            "joining SIS/LMS signals to advisor action.",
          examples: ["EAB Navigate", "Civitas Learning", "Starfish / Anthology"],
        },
        {
          name: "Research administration / grants-management system",
          role:
            "Proposal, award, effort-reporting, and sponsored-program " +
            "compliance and financial management.",
          examples: ["Huron / Click (Cayuse, Kuali Research)", "Workday Grants Management", "Banner/PeopleSoft Grants"],
        },
        {
          name: "Advancement / alumni CRM",
          role:
            "Manages alumni relationships, giving, and the donor pipeline for " +
            "advancement.",
          examples: ["Blackbaud Raiser's Edge NXT", "Salesforce / Affinaquest", "Ellucian Advance"],
        },
      ],
      roles: [
        {
          title: "Provost / Chief Academic Officer",
          accountability:
            "Academic mission, faculty governance interface, and the academic " +
            "side of student outcomes and program portfolio.",
        },
        {
          title: "VP for Enrollment Management",
          accountability:
            "The recruitment-to-enrollment funnel, yield, aid-leveraging " +
            "strategy, and net tuition revenue.",
        },
        {
          title: "Vice Provost / AVP for Student Success & Retention",
          accountability:
            "Retention, advising, completion, and the early-alert/" +
            "intervention program across the institution.",
        },
        {
          title: "University Registrar",
          accountability:
            "The SIS system of record, academic records integrity, " +
            "scheduling, and FERPA compliance for student records.",
        },
        {
          title: "Director of Financial Aid",
          accountability:
            "Aid packaging, verification, Title IV compliance, and the timing " +
            "and equity of net-price delivery.",
        },
        {
          title: "AVP for Research / Director of Sponsored Programs",
          accountability:
            "Sponsored-program administration, research compliance, " +
            "indirect-cost recovery, and audit readiness.",
        },
        {
          title: "Chief Information Officer",
          accountability:
            "The technology estate, SIS modernization sequencing, integration/" +
            "data layer, and security/privacy of student and research data.",
        },
      ],
      regulatoryFrames: [
        {
          name: "FERPA (Family Educational Rights and Privacy Act)",
          relevance:
            "Governs the privacy and disclosure of student education records " +
            "across SIS, LMS, advising, CRM, and any AI use on student data — " +
            "a hard constraint on what data can be shared, combined, or surfaced.",
        },
        {
          name: "Title IV / federal financial aid",
          relevance:
            "Governs federal student-aid eligibility, packaging, verification, " +
            "disbursement, return-of-funds, and the integrity of the aid " +
            "process — compliance failures carry program-participation risk.",
        },
        {
          name: "Title IX",
          relevance:
            "Prohibits sex discrimination and governs handling of related " +
            "complaints and records — a compliance frame touching student " +
            "case management and conduct data.",
        },
        {
          name: "Clery Act",
          relevance:
            "Requires disclosure of campus crime statistics and security " +
            "policy — a campus-operations compliance obligation with reporting " +
            "and data requirements.",
        },
        {
          name: "Research compliance (IRB/IACUC, Uniform Guidance, export control)",
          relevance:
            "Human-subjects (IRB), animal (IACUC), federal cost-principles " +
            "(2 CFR 200 / Uniform Guidance), effort reporting, and export " +
            "control govern sponsored research — non-negotiable, audit-backed, " +
            "and costly to administer.",
        },
        {
          name: "Accreditation (institutional & programmatic)",
          relevance:
            "Regional/institutional and programmatic accreditors require " +
            "demonstrated outcomes (retention, completion, assessment) and " +
            "govern eligibility for federal aid — the outcomes accountability " +
            "frame the whole lifecycle is measured against.",
        },
      ],
      canonicalTerms: [
        {
          term: "Enrollment cliff",
          definition:
            "The projected decline in the traditional-age (18-22) student " +
            "population, shrinking the recruitment pool and intensifying " +
            "competition and discounting — the existential threat framing.",
        },
        {
          term: "Net tuition revenue (NTR) / tuition discount rate",
          definition:
            "Gross tuition minus institutional aid (NTR); the discount rate is " +
            "the share of gross tuition given back as institutional aid — the " +
            "true economics behind headline tuition.",
        },
        {
          term: "Yield and summer melt",
          definition:
            "Yield is the admitted-to-enrolled conversion; melt is admits who " +
            "commit but never matriculate (often over summer), concentrated " +
            "among aid-dependent students.",
        },
        {
          term: "Early alert / proactive advising",
          definition:
            "Identifying at-risk students from academic, engagement, and " +
            "financial signals and reaching out before they stop out, rather " +
            "than waiting for them to seek help.",
        },
        {
          term: "DFW rate (gateway/bottleneck course)",
          definition:
            "The share of enrollments ending in D, F, or withdrawal in " +
            "high-enrollment foundational courses — a leading attrition and " +
            "time-to-degree indicator.",
        },
        {
          term: "Indirect cost / F&A recovery",
          definition:
            "Facilities-and-administrative (overhead) cost recovered on " +
            "sponsored awards against the institution's negotiated F&A rate — " +
            "the funding of shared research infrastructure.",
        },
        {
          term: "Shared governance",
          definition:
            "The division of decision authority among the board, " +
            "administration, and faculty (senate/departments) — the structural " +
            "reason enterprise change requires consensus and moves slowly.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Retention and completion outcomes",
        authoritativeSource:
          "SIS cohort-tracked enrollment and degree-conferral records, " +
          "reconcilable to IPEDS retention/graduation reporting",
        whatGoodEvidenceLooksLike:
          "First-to-second-year retention and 4-/6-year graduation tracked by " +
          "entering cohort and disaggregated by population (Pell, " +
          "first-generation, race/ethnicity), with the intervention and its " +
          "outcome closed-loop.",
        weakEvidenceToReject:
          "A single institution-wide retention percentage with no cohort " +
          "definition, no disaggregation, and no link from intervention to " +
          "outcome.",
      },
      {
        claim: "Net tuition revenue and discounting",
        authoritativeSource:
          "Finance/ERP gross-tuition and institutional-aid records joined to " +
          "SIS headcount (NACUBO-style tuition-discounting basis)",
        whatGoodEvidenceLooksLike:
          "Net tuition revenue per student and discount-rate trend over " +
          "multiple years, read against yield and headcount, so the " +
          "discounting-vs-enrollment trade is visible.",
        weakEvidenceToReject:
          "A published-tuition or gross-revenue figure presented as health, " +
          "with no netting of institutional aid and no discount-rate trend.",
      },
      {
        claim: "Advising capacity and early-alert data quality",
        authoritativeSource:
          "Advising/student-success platform assignment records and " +
          "early-alert feed completeness joined to SIS active-student counts",
        whatGoodEvidenceLooksLike:
          "Advising caseload against the proactive-advising ceiling, plus the " +
          "coverage, timeliness, and act-on rate of early-alert signals — " +
          "evidence that signal can actually be acted on.",
        weakEvidenceToReject:
          "A claim of retention impact citing only that an early-alert tool " +
          "exists, with no advising ratio and no act-on/closed-loop evidence.",
      },
      {
        claim: "Research indirect-cost recovery and compliance",
        authoritativeSource:
          "Grants-management/ERP F&A recovery against the negotiated rate " +
          "agreement and Single Audit / sponsor-monitoring findings",
        whatGoodEvidenceLooksLike:
          "Realized indirect-cost recovery versus the negotiated F&A rate with " +
          "the leakage sources identified, and compliance findings trended with " +
          "remediation status.",
        weakEvidenceToReject:
          "An assertion that research 'breaks even' or is 'compliant' with no " +
          "F&A recovery measurement and no audit/finding evidence.",
      },
      {
        claim: "Cost to serve / administrative effort",
        authoritativeSource:
          "Workforce Economics substrate (advising/admissions/aid/" +
          "research-admin staffing rate-card x FTE) joined to volume",
        whatGoodEvidenceLooksLike:
          "Fully-loaded cost and cycle time for aid packaging, admissions " +
          "processing, and research-admin workflow, with the automatable share " +
          "and the residual human-judgment share separated.",
        weakEvidenceToReject:
          "A vendor automation-savings percentage with no link to the " +
          "institution's own staffing cost base or process volume.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Is your net tuition revenue per student rising or falling once you net out institutional aid, and what is your discount-rate trend against yield and headcount?",
      "What is your first-to-second-year retention by entering cohort, disaggregated by Pell/first-generation/race, and what is the dollar value of a point of retention versus your cost to recruit?",
      "What is your advising caseload, and do advisors have timely, trustworthy early-alert signals AND the capacity to act on them before a student stops out?",
      "What is the state of your SIS — modern and API-accessible, or heavily customized legacy — and is the automation you are planning assuming real-time data the SIS cannot provide?",
      "How long does financial-aid packaging take from a complete ISIR, how much of that is verification, and how much of your melt is aid-dependent students who never got a timely award?",
      "What is your sponsored-research compliance finding history and your realized indirect-cost recovery against the negotiated rate, and where is the manual compliance burden concentrated?",
      "Where is your AI investment pointed — at personalized learning, or at the administrative, advising, and aid automation with clearer ROI — and which decisions require faculty-senate or departmental consensus?",
    ],
    maturitySignals: [
      "Enrollment is governed on net tuition revenue and discount rate, not gross tuition or headcount alone, with yield/aid modeled together.",
      "Retention is cohort-tracked and disaggregated, early-alert data is timely and joined to advising workflow, and advising caseloads are within the proactive-advising range so signals can be acted on.",
      "Research administration measures realized indirect-cost recovery against the negotiated rate and trends compliance findings to remediation, treating compliance as funded cost, not optional.",
      "AI investment is concentrated on administrative/advising/aid automation with measured ROI, and enterprise change is sequenced realistically against shared-governance approval paths.",
    ],
    redFlags: [
      "Published tuition and gross revenue are cited as health while net tuition revenue per student is flat or falling and the discount rate climbs unchecked.",
      "An early-alert or student-success tool is in place but advising caseloads are far above the proactive ceiling, so risk signals are identified and never acted on.",
      "Automation plans assume a real-time, modern SIS that does not exist — the estate is batch, customized, and reconciled by hand.",
      "Research operates with unmeasured indirect-cost recovery and a history of audit findings treated as acceptable, exposing the institution to disallowance and repayment.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "SIS vendors (Ellucian, Oracle PeopleSoft, Workday)",
        category: "Student information system (system of record)",
        switchingCost:
          "Extreme — the SIS holds records, registration, and degree audit and is fused to dozens of integrations and registrar-governed policy; replacement is a multi-year, high-risk, high-cost program rarely undertaken outside a funded modernization.",
        renewalDynamics:
          "Long contracts with large maintenance tails; cloud/SaaS migration (e.g. to Workday Student) is the renewal event and the main negotiating window — and the riskiest project on the roadmap.",
      },
      {
        vendorName: "Student-success / advising platforms (EAB Navigate, Civitas, Anthology)",
        category: "Early-alert / advising / retention",
        switchingCost:
          "Moderate-to-high — integrated to SIS/LMS data feeds and embedded in advising workflow; replaceable with data mapping but workflow-sticky once advisors adopt it.",
        renewalDynamics:
          "Subscription pricing, increasingly with AI/predictive add-ons; leverage measured retention/completion outcomes at renewal and scrutinize predictive-model transparency and equity testing.",
      },
      {
        vendorName: "Admissions CRM & enrollment vendors (Slate, Salesforce Education Cloud)",
        category: "Recruitment / admissions / yield",
        switchingCost:
          "High — the funnel, communications, and configuration accrete deeply (Slate especially is heavily customized); re-platforming mid-cycle is disruptive.",
        renewalDynamics:
          "Per-record or platform pricing; AI yield/aid-leveraging capabilities upsold as premium — negotiate against measured yield/NTR outcomes.",
      },
      {
        vendorName: "Financial-aid & verification vendors (Ellucian, CampusLogic/Regent)",
        category: "Aid packaging / verification / Title IV",
        switchingCost:
          "High — bound to the SIS aid module and Title IV compliance configuration; verification-automation tools integrate but carry compliance-validation cost to switch.",
        renewalDynamics:
          "Module or per-student pricing; favor terms tied to packaging cycle-time and verification-automation rate, with compliance acceptance gates.",
      },
      {
        vendorName: "Research-administration vendors (Huron/Cayuse, Kuali, Workday Grants)",
        category: "Sponsored programs / grants / compliance",
        switchingCost:
          "High — encodes sponsor terms, effort-reporting, and compliance workflow tied to the F&A rate agreement and audit trail; migration risks compliance continuity.",
        renewalDynamics:
          "Module/subscription pricing; leverage realized indirect-cost recovery and reduced compliance findings, and require audit-explainability of any automated checks.",
      },
    ],
    switchingCosts:
      "The SIS system of record is effectively non-switchable outside a funded multi-year modernization, and research-admin/aid systems carry compliance-continuity risk — so the negotiable frontier is the student-success, admissions-CRM, and automation layers around the core, plus the contracting model itself (modular, outcome-linked, exit-protected) rather than a wholesale SIS replacement undertaken casually.",
    negotiationLevers: [
      "Outcome-linked terms tied to measured retention/completion, yield/NTR, packaging cycle-time, or compliance-finding reduction rather than seats/effort alone",
      "Modular, phased SIS modernization with a strangler/integration-layer approach instead of a single big-bang replacement, to preserve competition and contain risk",
      "Predictive-model transparency, equity/bias testing, and data-portability rights so student-success and aid-leveraging models are auditable and not hostage to one vendor",
      "Consortium / system-office purchasing and shared-services leverage to improve pricing against a shrinking-budget reality",
      "FERPA/Title IV/research-compliance acceptance gates and audit-explainability as mandatory terms, not change orders",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      retention_outcome_claim: [
        "SIS cohort-tracked enrollment/conferral records",
        "cohort definition and trailing window",
        "disaggregation by population where outcomes are claimed",
        "intervention-to-outcome closed loop",
      ],
      net_tuition_revenue_claim: [
        "gross tuition and institutional-aid basis (netted)",
        "discount-rate and yield/headcount trend",
        "multi-year period",
      ],
      advising_capacity_claim: [
        "advising caseload against the proactive ceiling",
        "early-alert coverage/timeliness/act-on rate",
      ],
      research_compliance_claim: [
        "indirect-cost recovery vs negotiated F&A rate",
        "Single Audit / sponsor-monitoring findings",
        "audit-explainable basis for any automated check",
      ],
      cost_to_serve_claim: [
        "Workforce Economics substrate staffing basis (rate-card x FTE)",
        "process volume / cycle time",
        "automatable-vs-human-judgment split",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors (advising capacity / SIS readiness / governance / discounting)",
        "net-of-aid reconciliation for any enrollment-revenue claim",
      ],
    },
    citationStandard:
      "Quantitative claims cite the SIS for retention/completion (with cohort " +
      "definition and disaggregation), finance/ERP plus financial-aid records " +
      "for net tuition revenue (NETTED of institutional aid, with the discount " +
      "trend), the advising platform for caseload and early-alert act-on rate, " +
      "and grants-management/audit sources for indirect-cost recovery and " +
      "compliance findings. Cost-to-serve claims cite the Workforce Economics " +
      "substrate (staffing rate-card x FTE). Value projections cite a baseline " +
      "plus a labelled planning range and the haircut factors applied " +
      "(especially advising capacity, SIS readiness, governance, and " +
      "discounting) — never a single asserted ROI, and never a gross-tuition " +
      "or enrollment gain presented without netting incremental aid.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no advising-caseload or early-alert act-on data — frame retention upside as an industry planning range gated by capacity, not their realizable number.",
      "An enrollment or yield gain is quoted without netting institutional aid — flag that net tuition revenue, not headcount, is the real measure and may not move proportionally.",
      "Automation potential is cited without confirming real-time SIS data access — present the legacy-SIS-gated ceiling explicitly.",
      "A research efficiency is proposed that touches compliance — mark that compliance is non-negotiable and findings/recovery, not headcount cuts, are the honest value.",
    ],
    inferenceLanguage: [
      "Across institutions at this scale, a point of first-to-second-year retention is typically worth more than a point of new-student yield, so...",
      "Without your advising-ratio and early-alert data, the industry pattern is that retention models underdeliver when caseloads exceed the proactive-advising ceiling...",
      "Treating this as a planning range rather than your measured figure, and net of the discounting required to achieve it...",
      "Peer institutions commonly cap realizable automation where the SIS is still batch/legacy, so...",
    ],
    flagWithoutEvidence: [
      "A specific retention, graduation, yield, NTR, or indirect-cost-recovery figure for this institution",
      "A specific dollar ROI for this institution stated without netting institutional aid",
      "A claim that retention will improve without evidence advisors have the capacity to act on early-alert signals",
      "A claim that a research process can be made more efficient without confirming it preserves compliance and audit-explainability",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "net tuition revenue vs gross tuition and discount rate trend",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend gross tuition, institutional aid (discount rate), and net tuition revenue per student over multiple years to expose discounting masking NTR erosion.",
    },
    {
      questionPattern:
        "retention / completion value story / student-success value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current attrition to retention/completion gains and downstream net tuition revenue retained, with advising-capacity, SIS-readiness, governance, and discounting haircuts shown explicitly.",
    },
    {
      questionPattern:
        "retention drivers / what moves first-to-second-year retention",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Rank the levers (gateway-course DFW, advising contact, aid timeliness, engagement) by impact on retention to focus the highest-leverage intervention.",
    },
    {
      questionPattern: "student-lifecycle KPI scorecard",
      exhibitKind: "table",
      note: "Enrollment yield, first-to-second-year retention, 4-/6-year graduation, NTR per student, cost-to-recruit, advising caseload, aid packaging cycle time, time-to-degree, DFW rate, indirect-cost recovery, compliance findings, and alumni participation vs planning ranges.",
    },
    {
      questionPattern: "gateway-course DFW and bottleneck analysis by course",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar DFW rate by high-enrollment gateway course to surface the bottleneck courses concentrating attrition and time-to-degree extension.",
    },
    {
      questionPattern:
        "administrative cost-to-serve by function (aid / admissions / research admin)",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack fully-loaded cost and the automatable vs human-judgment share across aid packaging, admissions processing, and research-admin workflow to size the automation prize honestly.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The institution governs on net tuition revenue and cohort-disaggregated retention, so it targets the highest-ROI lever (keeping students) rather than chasing yield with discounting",
      "Advising caseloads are within the proactive range and early-alert data is timely and joined to workflow, so risk signals can actually be acted on",
      "AI investment is concentrated on administrative, advising, and aid automation with measured ROI, not on personalized-learning hype with thin evidence and faculty resistance",
      "Research administration treats compliance as funded cost and measures indirect-cost recovery, protecting against disallowance while improving workflow",
    ],
    failureDrivers: [
      "Headline tuition and enrollment are celebrated while net tuition revenue erodes under unchecked discounting, so the cliff is met with a worsening unit economic",
      "A student-success tool is bought but advising capacity is left far above the proactive ceiling, so risk is identified and never acted on and retention does not move",
      "Automation is planned on a legacy, batch, heavily customized SIS that cannot support real-time data, so projected benefits never materialize",
      "Enterprise change is pushed against shared governance without sequencing for consensus, so adoption fragments and stalls — and research 'efficiency' that weakens compliance invites audit disallowance",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Student-service deflection and proactive-advising outreach adopt first " +
      "because they are measurable and relieve overloaded offices. " +
      "Financial-aid and admissions processing automation and course-demand " +
      "optimization follow as SIS data access allows. Enrollment/NTR " +
      "optimization adopts over a full admission cycle. Research-admin " +
      "compliance automation adopts deliberately with audit validation. " +
      "Instructional/personalized-learning AI lags and is governance-gated by " +
      "faculty. SIS modernization is the long pole that determines how far " +
      "real-time automation can ultimately go, and shared governance sets the " +
      "ceiling on enterprise-wide adoption speed throughout.",
    roiClarity: "medium",
    roiClarityBasis:
      "The retention-vs-recruitment economics are firm and intuitive — cost to " +
      "recruit is high and rising, so retained students clearly outperform " +
      "front-of-funnel spend — and administrative cycle-time/cost gains are " +
      "measurable against the Workforce Economics substrate. But ROI clarity " +
      "sits at medium, not high: retention upside is gated by advising " +
      "capacity and data quality the institution often lacks; enrollment gains " +
      "must be netted against the discounting that achieved them; the SIS " +
      "estate caps what automation can realize; and shared governance makes " +
      "timing uncertain. The honest value is survival-and-outcomes under the " +
      "cliff, sized as ranges, not a single confident ROI.",
  },

  regulatoryFrame: {
    name: "FERPA, Title IV & research compliance (with accreditation accountability)",
    relevance:
      "The dominant frame for higher education: FERPA governs the privacy and " +
      "disclosure of student education records across every system and any AI " +
      "use on student data; Title IV governs federal financial-aid integrity " +
      "and carries program-participation risk; and research compliance " +
      "(IRB/IACUC, Uniform Guidance cost principles, effort reporting, export " +
      "control) is non-negotiable and audit-backed, where findings mean " +
      "disallowance and repayment. Title IX and the Clery Act add " +
      "compliance obligations on conduct and campus-safety data, and " +
      "accreditation holds the institution accountable for demonstrated " +
      "retention and completion outcomes and gates federal-aid eligibility " +
      "(see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "medium",
    asOf: "2026-06-21",
  },
};
