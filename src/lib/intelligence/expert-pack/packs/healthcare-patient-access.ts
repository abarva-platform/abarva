// Consilium expert — Healthcare Patient Access & Digital Front Door (provider).
//
// Wave-4 ExpertPack v2. Domain: provider-side PATIENT ACCESS — the front door
// to care: scheduling and access, referral management, no-show reduction,
// patient registration, the digital front door (online self-scheduling,
// patient portal / MyChart), the healthcare contact center, and the
// pre-service patient financial experience (estimates, coverage discovery,
// pre-service collections).
//
// Boundary discipline: this is DISTINCT from the Healthcare Revenue Cycle
// expert (back-end claims/denials/coding/AR) and from the generic
// Contact-Center-CX expert (cross-industry service operations). Access is where
// downstream denials and patient experience are SEEDED — but the honest truth
// is that access value depends on clinician scheduling-template discipline and
// referral-network behavior the access team does not fully control.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const healthcarePatientAccessExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.healthcare-provider.patient-access",
    expertName: "Healthcare Patient Access & Digital Front Door Expert",
    kind: "industry-function",
    industry: "healthcare_provider",
    functionKey: "patient-access",
    scopeNote:
      "Provider-side patient access and the digital front door: scheduling and " +
      "access (third-next-available, new-patient lead time, template " +
      "utilization), referral management and leakage, no-show reduction, " +
      "registration and demographic/insurance accuracy, eligibility " +
      "verification, the healthcare contact center, patient-portal activation " +
      "and online self-scheduling, and the PRE-service patient financial " +
      "experience (good-faith estimates, coverage discovery, pre-service " +
      "collections). Access is where downstream denials and patient experience " +
      "are seeded. Excludes back-end revenue cycle (claims, denials rework, " +
      "coding, AR — see Healthcare Revenue Cycle expert) and generic " +
      "cross-industry contact-center operations (see Contact-Center-CX expert).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "third_next_available",
        name: "Third-next-available appointment (TNAA)",
        definition:
          "Average days to the third-next-available appointment slot for a " +
          "given provider or clinic. The third slot (not the first) is used " +
          "because first/second openings are often cancellations, so it is the " +
          "truer measure of real access capacity.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 7,
          high: 21,
          basis:
            "IHI/MGMA access benchmarks; varies sharply by specialty (primary " +
            "care tighter, sub-specialty wider) and operator experience",
          label: "planning-range",
        },
        dataSource:
          "Scheduling system slot availability snapshots (e.g. Epic Cadence) " +
          "by provider and visit type",
        whyItMatters:
          "The canonical access metric. Long TNAA pushes patients to " +
          "competitors and the ED, drives leakage, and is the single number " +
          "boards ask about when they say 'patients can't get in.'",
      },
      {
        key: "no_show_rate",
        name: "No-show rate",
        definition:
          "Share of scheduled appointments where the patient neither arrives " +
          "nor cancels in time to rebook the slot, by visit type and clinic.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 18,
          basis:
            "Ambulatory survey ranges; wide variation by specialty, payer mix, " +
            "and Medicaid/no-transportation populations",
          label: "planning-range",
        },
        dataSource:
          "Appointment status (no-show vs arrived vs cancelled) from the " +
          "scheduling system",
        whyItMatters:
          "Every no-show is lost capacity that cannot be re-sold and a care " +
          "gap for the patient. High no-show rates make access look scarce when " +
          "the real problem is unused booked time.",
      },
      {
        key: "new_patient_lead_time",
        name: "New-patient lead time",
        definition:
          "Median elapsed days from a new patient's request (call, referral, " +
          "or online) to their first completed visit.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 30,
          basis:
            "Operator experience and access surveys; specialty- and " +
            "market-dependent",
          label: "planning-range",
        },
        dataSource:
          "First-request timestamp (call log / referral / portal) joined to " +
          "first-visit arrival date",
        whyItMatters:
          "New patients are the growth engine and the highest leakage risk — a " +
          "long lead time is the moment a referred or net-new patient goes " +
          "elsewhere and never returns.",
      },
      {
        key: "digital_self_scheduling_rate",
        name: "Digital self-scheduling adoption rate",
        definition:
          "Share of eligible appointments booked by patients themselves via " +
          "online/portal self-scheduling rather than by a staff member.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 10,
          high: 40,
          basis:
            "Portal self-scheduling adoption ranges; gated by how many visit " +
            "types are decision-tree-enabled, not just by patient willingness",
          label: "planning-range",
        },
        dataSource:
          "Appointment booking channel attribution (portal/online vs " +
          "agent-booked) in the scheduling system",
        whyItMatters:
          "Self-scheduling deflects contact-center volume and lifts access, but " +
          "is capped by how many visit types clinicians let the decision tree " +
          "open — so a low rate is often a template-governance gap, not a " +
          "patient-demand gap.",
      },
      {
        key: "referral_leakage_rate",
        name: "Referral leakage rate",
        definition:
          "Share of referrals that leave the network (or are never scheduled " +
          "anywhere) when an in-network option existed, by count or by " +
          "estimated downstream revenue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 15,
          high: 35,
          basis:
            "Network-integrity / referral-management vendor findings; varies " +
            "by network density and referring-physician alignment",
          label: "planning-range",
        },
        dataSource:
          "Referral order vs scheduled-visit reconciliation (referral " +
          "management / EHR) and out-of-network claims signals where available",
        whyItMatters:
          "Leaked referrals are growth and downstream revenue walking out the " +
          "door, and a quiet patient-experience failure (the patient was told " +
          "'we'll refer you' and then nothing happened).",
      },
      {
        key: "contact_center_abandonment",
        name: "Contact-center call abandonment rate",
        definition:
          "Share of inbound patient calls that disconnect before reaching a " +
          "live agent, after entering the queue.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 3,
          high: 12,
          basis:
            "Healthcare contact-center benchmarks; degrades fast during " +
            "seasonal surges (open enrollment, respiratory season)",
          label: "planning-range",
        },
        dataSource: "ACD / contact-center platform queue and abandonment logs",
        whyItMatters:
          "An abandoned call is a patient who could not book, refill, or get a " +
          "question answered — it is the audible sound of access failing, and " +
          "it directly feeds no-shows and leakage.",
      },
      {
        key: "registration_accuracy",
        name: "Registration / demographic & insurance accuracy",
        definition:
          "Share of registrations completed without a downstream correction to " +
          "demographic or insurance/coverage fields (a clean registration).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 98,
          basis:
            "Patient-access quality benchmarks; best-in-class >98% with " +
            "real-time validation tools",
          label: "planning-range",
        },
        dataSource:
          "Registration edit/correction logs and downstream eligibility/claim " +
          "rejections traced to registration fields",
        whyItMatters:
          "Registration errors are the upstream cause of eligibility and " +
          "demographic denials weeks later — accuracy here is the cheapest " +
          "denial-prevention lever in the whole revenue cycle.",
      },
      {
        key: "eligibility_verification_rate",
        name: "Eligibility verification rate (pre-service)",
        definition:
          "Share of scheduled encounters with a completed and current " +
          "eligibility/benefits check (270/271) before the date of service.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 98,
          basis:
            "Patient-access benchmarks; gaps concentrate in add-on, walk-in, " +
            "and same-day visits",
          label: "planning-range",
        },
        dataSource:
          "270/271 eligibility transaction completion joined to the scheduled " +
          "encounter list",
        whyItMatters:
          "Unverified eligibility is the direct seed of CO-27 eligibility " +
          "denials and of surprise patient balances — verifying before service " +
          "is what makes accurate estimates and pre-service collection possible.",
      },
      {
        key: "template_utilization",
        name: "Provider scheduling-template utilization",
        definition:
          "Share of bookable template slots that are actually filled with " +
          "completed visits, by provider and clinic.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 90,
          basis:
            "Ambulatory operations benchmarks; depends on template design and " +
            "overbooking policy, not just demand",
          label: "planning-range",
        },
        dataSource:
          "Filled vs available template slots from the scheduling system, net " +
          "of blocks and admin time",
        whyItMatters:
          "Access is as much a supply/template problem as a demand problem — " +
          "low utilization next to long TNAA means the template (not capacity) " +
          "is the bottleneck, which is the most common honest finding.",
      },
      {
        key: "portal_activation_rate",
        name: "Patient-portal activation rate",
        definition:
          "Share of the active patient panel with an activated patient-portal " +
          "(e.g. MyChart) account.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 75,
          basis:
            "Portal adoption ranges; lags in older, rural, and " +
            "limited-English-proficiency populations",
          label: "planning-range",
        },
        dataSource:
          "Activated portal accounts vs active patient panel from the patient " +
          "engagement platform",
        whyItMatters:
          "The portal is the rails for self-scheduling, digital intake, " +
          "estimates, and reminders — every downstream digital-front-door " +
          "benefit is capped by who has actually activated.",
      },
      {
        key: "first_call_resolution",
        name: "Contact-center first-call resolution (FCR)",
        definition:
          "Share of inbound patient contacts fully resolved on the first " +
          "interaction without a callback, transfer, or repeat contact.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 65,
          high: 85,
          basis:
            "Healthcare contact-center benchmarks; depends on agent access to " +
            "scheduling, referral, and financial-clearance tools",
          label: "planning-range",
        },
        dataSource:
          "Contact-center interaction logs with repeat-contact and transfer " +
          "linkage",
        whyItMatters:
          "Low FCR means patients call back, inflating volume and abandonment " +
          "and signalling that agents lack the scheduling/clearance authority " +
          "to actually close the request.",
      },
      {
        key: "estimate_delivery_rate",
        name: "Pre-service good-faith estimate delivery rate",
        definition:
          "Share of eligible scheduled encounters for which a patient receives " +
          "a good-faith / out-of-pocket estimate before the date of service.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 70,
          basis:
            "Emerging compliance + operator ranges post No Surprises Act; " +
            "self-pay and shoppable services higher",
          label: "planning-range",
        },
        dataSource:
          "Estimate generation/delivery logs joined to the scheduled-encounter " +
          "list (patient engagement / estimation tool)",
        whyItMatters:
          "Pre-service estimates are both a No Surprises Act obligation and the " +
          "precondition for pre-service collection and patient trust — the " +
          "cheapest dollar to collect is the one quoted and collected before " +
          "the visit.",
      },
    ],

    painThemes: [
      {
        key: "access_supply_demand_mismatch",
        name: "Access supply/demand mismatch (template, not capacity)",
        description:
          "Patients can't get in (long TNAA) while booked template time goes " +
          "unfilled — the constraint is template design, blocks, and " +
          "scheduling rules, not raw provider capacity.",
        detectionSignal:
          "Long third-next-available alongside template utilization below " +
          "target, large held/blocked slot percentages, heavy manual " +
          "rescheduling.",
        diagnosticQuestion:
          "Where TNAA is longest, what is template utilization for those same " +
          "providers — and how much of the schedule is held, blocked, or " +
          "admin time?",
      },
      {
        key: "no_show_capacity_drain",
        name: "No-show capacity drain",
        description:
          "Unmanaged no-shows and late cancellations burn booked capacity that " +
          "can't be re-sold, making access look scarce while care gaps grow, " +
          "especially in transportation- and access-challenged populations.",
        detectionSignal:
          "High no-show rate concentrated by clinic/payer/visit type, low " +
          "rebooking of freed slots, no waitlist/backfill mechanism.",
        diagnosticQuestion:
          "What is your no-show rate by clinic and payer, and do you have a " +
          "working waitlist or auto-backfill to re-sell freed slots?",
      },
      {
        key: "referral_leakage",
        name: "Silent referral leakage",
        description:
          "Referrals are placed but never scheduled in-network — patients fall " +
          "through after 'we'll refer you,' draining downstream growth and " +
          "quietly failing the patient experience.",
        detectionSignal:
          "Large gap between referrals ordered and referrals scheduled, no " +
          "closed-loop referral tracking, out-of-network utilization by " +
          "owned-life or aligned populations.",
        diagnosticQuestion:
          "What share of referrals you place are actually scheduled in-network, " +
          "and do you close the loop on the ones that aren't?",
      },
      {
        key: "front_end_data_errors",
        name: "Front-end registration & eligibility errors",
        description:
          "Demographic and coverage errors captured at registration surface " +
          "weeks later as eligibility/demographic denials and surprise patient " +
          "balances — access errors that become revenue-cycle losses.",
        detectionSignal:
          "Registration correction volume, downstream CO-27 eligibility " +
          "denials traced to specific registrars/access points, low " +
          "pre-service eligibility verification.",
        diagnosticQuestion:
          "Do you measure denials and rejections back to the registration " +
          "field and access point that caused them, or only count them on the " +
          "back end?",
      },
      {
        key: "contact_center_overload",
        name: "Contact-center overload & abandonment",
        description:
          "A single, overloaded phone queue absorbs scheduling, refills, " +
          "billing, and clinical messages, spiking abandonment and low FCR — " +
          "patients give up and either no-show or leak.",
        detectionSignal:
          "Rising abandonment, long handle/hold times, low FCR, high transfer " +
          "rate, seasonal collapse during surges, no digital deflection.",
        diagnosticQuestion:
          "What is your abandonment and first-call-resolution rate, and how " +
          "much routine volume could be deflected to self-service?",
      },
      {
        key: "digital_front_door_underadoption",
        name: "Digital front door under-adoption",
        description:
          "Online scheduling and the portal exist but few visit types are " +
          "self-schedulable and portal activation is low, so the digital front " +
          "door deflects little and most booking still lands on staff.",
        detectionSignal:
          "Low digital self-scheduling rate, low portal activation, few visit " +
          "types decision-tree-enabled, clinicians restricting online slots.",
        diagnosticQuestion:
          "How many of your visit types are actually open to self-scheduling, " +
          "and what is portal activation across your active panel?",
      },
      {
        key: "pre_service_financial_blindspot",
        name: "Pre-service financial experience blind spot",
        description:
          "Patients arrive without an estimate or pre-service collection " +
          "conversation, so liability lands post-insurance where it collects " +
          "poorly and erodes trust and Net Promoter scores.",
        detectionSignal:
          "Low estimate delivery rate, minimal pre-service collections, rising " +
          "post-insurance patient balances, billing-related complaints.",
        diagnosticQuestion:
          "What share of patients get an accurate estimate before service, and " +
          "do you have a pre-service financial conversation and collection step?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "ai_scheduling_optimization",
        name: "AI scheduling & template optimization",
        valueMechanism:
          "Analyze demand patterns and historical fill to recommend template " +
          "redesign, smart overbooking, and slot-matching — converting unused " +
          "booked time into real access and shortening third-next-available " +
          "without adding provider hours.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical appointment, fill, and no-show data by provider/visit type",
          "Template and block configuration",
          "Demand signals (referrals, calls, online requests)",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Template changes need clinician sign-off — schedules are a " +
            "physician-governance domain, not an algorithm's call",
          "Overbooking must respect clinical safety and visit-length needs",
        ],
        metricsMoved: [
          "third_next_available",
          "template_utilization",
          "new_patient_lead_time",
        ],
      },
      {
        key: "no_show_prediction_outreach",
        name: "No-show prediction & targeted outreach",
        valueMechanism:
          "Score scheduled appointments for no-show risk and route high-risk " +
          "patients to tailored reminders, transportation support, or proactive " +
          "rebooking — recovering capacity and closing care gaps rather than " +
          "burning the slot.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Historical no-show outcomes with patient and visit features",
          "Reminder/outreach channel and response history",
          "Waitlist / backfill candidate pool",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Risk features must not proxy for protected classes — audit for " +
            "equity bias against vulnerable populations",
          "High-risk flags should trigger support, not denial of access or " +
            "punitive overbooking",
        ],
        metricsMoved: [
          "no_show_rate",
          "template_utilization",
          "third_next_available",
        ],
      },
      {
        key: "conversational_scheduling_agent",
        name: "Conversational scheduling & contact-center AI agent",
        valueMechanism:
          "A voice/chat assistant handles routine scheduling, rescheduling, " +
          "and FAQs end-to-end and assists live agents on complex calls — " +
          "deflecting volume, cutting abandonment, and lifting first-call " +
          "resolution.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Scheduling rules, visit-type decision logic, provider availability",
          "Knowledge base for FAQs/policies",
          "Telephony/chat integration and identity verification",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Clinical-symptom triage must escalate to humans — bots must not " +
            "give medical advice",
          "Identity/PHI verification required before disclosing or acting on " +
            "appointments",
        ],
        metricsMoved: [
          "contact_center_abandonment",
          "first_call_resolution",
          "digital_self_scheduling_rate",
        ],
      },
      {
        key: "intelligent_referral_management",
        name: "Intelligent referral routing & leakage prevention",
        valueMechanism:
          "Match referrals to the best-fit in-network provider with the " +
          "shortest wait and close the loop on scheduling — capturing leaked " +
          "referrals as in-network visits and downstream growth.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Referral orders with specialty/clinical context",
          "In-network provider directory, capacity, and access times",
          "Closed-loop scheduling and out-of-network utilization signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Routing must honor patient choice and clinically-required provider " +
            "preferences, not just network economics",
          "Anti-steering and any-willing-provider rules apply to referral " +
            "direction",
        ],
        metricsMoved: ["referral_leakage_rate", "new_patient_lead_time"],
      },
      {
        key: "intelligent_intake_eligibility",
        name: "Intelligent digital intake, registration & eligibility",
        valueMechanism:
          "Pre-fill and validate demographics and coverage at digital intake, " +
          "auto-run eligibility, and discover hidden coverage — driving " +
          "registration accuracy and eligibility verification up before " +
          "service so denials are prevented at the source.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "Digital intake / portal data capture",
          "270/271 eligibility connectivity and payer responses",
          "Coverage-discovery and demographic-validation data sources",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Auto-populated coverage must be confirmable — wrong coverage causes " +
            "downstream denials",
          "Accessibility and limited-English-proficiency support required so " +
            "digital intake doesn't exclude vulnerable patients",
        ],
        metricsMoved: [
          "registration_accuracy",
          "eligibility_verification_rate",
          "portal_activation_rate",
        ],
      },
      {
        key: "pre_service_estimate_propensity",
        name: "Pre-service estimation & propensity-to-pay outreach",
        valueMechanism:
          "Generate accurate out-of-pocket estimates from verified eligibility " +
          "and contract terms, then tailor pre-service collection and " +
          "financial-assistance routing by ability to pay — lifting estimate " +
          "delivery and pre-service collection while protecting trust.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Verified eligibility/benefits and contract/fee-schedule terms",
          "Procedure/visit cost estimates",
          "Patient balance, payment history, and financial-assistance signals",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Estimates must be defensible — over-estimating erodes trust, " +
            "under-estimating breaches good-faith expectations",
          "Never steer eligible patients away from financial assistance or " +
            "charity care",
        ],
        metricsMoved: ["estimate_delivery_rate", "eligibility_verification_rate"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "unified_access_center",
        name: "Unified patient access / contact center",
        description:
          "A consolidated access center that centralizes scheduling, referral " +
          "intake, registration, eligibility, and the phone/chat queue with " +
          "tiered routing and digital deflection, replacing fragmented " +
          "clinic-by-clinic front desks.",
        boundary:
          "Owns centralized scheduling, intake, and contact handling; does not " +
          "own clinical template decisions (clinician-governed) or back-end " +
          "claims and denials rework.",
        humanAccountabilityPoint: "VP Patient Access / Access Center Director",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "digital_front_door_platform",
        name: "Digital front door & self-service platform",
        description:
          "Portal-anchored online self-scheduling, digital intake, reminders, " +
          "estimates, and messaging that lets patients book and prepare " +
          "themselves, with a decision tree governing which visit types are " +
          "self-schedulable.",
        boundary:
          "Owns the patient-facing digital channel and deflection; depends on " +
          "clinician-approved self-scheduling rules and does not override " +
          "template governance.",
        humanAccountabilityPoint: "Director, Digital Patient Experience",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "closed_loop_referral_network",
        name: "Closed-loop referral management",
        description:
          "A referral workflow that routes orders to best-fit in-network " +
          "providers, tracks every referral to a scheduled visit, and surfaces " +
          "leakage for recovery, integrated with the access center.",
        boundary:
          "Owns referral routing and loop-closure; does not dictate referring " +
          "physicians' clinical choices or negotiate network contracts.",
        humanAccountabilityPoint: "Director, Network Integrity / Referral Management",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "financial_clearance_front_end",
        name: "Pre-service financial clearance hub",
        description:
          "A pre-service control point that verifies eligibility, discovers " +
          "hidden coverage, generates good-faith estimates, and runs the " +
          "pre-service collection and financial-assistance conversation before " +
          "the patient arrives.",
        boundary:
          "Owns pre-service financial readiness and patient financial " +
          "experience; hands clean accounts to back-end revenue cycle and does " +
          "not work post-service denials or AR.",
        humanAccountabilityPoint: "Patient Access Director (Financial Clearance)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Patient-access value is dual: a GROWTH/experience engine (shorter " +
        "TNAA, lower leakage, higher self-service captures and retains " +
        "patients) and a DENIAL-PREVENTION engine (accurate registration, " +
        "verified eligibility, and pre-service estimates stop downstream " +
        "denials and bad debt at the source). The durable wins come from " +
        "fixing supply (templates) and front-end data quality — not from " +
        "bolting outreach onto a broken schedule. Crucially, much of the upside " +
        "is gated by clinician scheduling-template discipline and referral " +
        "behavior the access team influences but does not control.",
      dominantHaircutFactors: [
        {
          factor: "Clinician scheduling-template governance",
          rationale:
            "Access automation only realizes value if clinicians open visit " +
            "types to self-scheduling and accept template redesign; restricted " +
            "templates cap self-scheduling and access gains regardless of tool " +
            "quality.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Observed gap between technical self-scheduling capability and " +
              "the share of visit types clinicians actually enable",
            label: "planning-range",
          },
        },
        {
          factor: "Patient digital adoption & equity reach",
          rationale:
            "Self-service value depends on portal activation and digital " +
            "comfort; older, rural, and limited-English-proficiency " +
            "populations under-adopt, so deflection and self-scheduling gains " +
            "fall short of the addressable panel.",
          typicalHaircut: {
            low: 0.15,
            high: 0.35,
            basis:
              "Portal activation gaps and channel-preference data across " +
              "patient segments",
            label: "planning-range",
          },
        },
        {
          factor: "Data & integration readiness",
          rationale:
            "Eligibility, estimation, and referral routing need clean " +
            "directory, contract, and payer-connectivity data; gaps force " +
            "manual fallback and cap registration-accuracy and estimate " +
            "delivery uplift.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Implementation experience where directory/contract/eligibility " +
              "data was incomplete",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Third-next-available reduction",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Reported TNAA reductions from template optimization and " +
              "smart scheduling programs",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in third_next_available (days)",
        },
        {
          lever: "No-show rate reduction",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported reductions from prediction-driven targeted outreach " +
              "and waitlist backfill",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in no_show_rate",
        },
        {
          lever: "Referral leakage recapture",
          range: {
            low: 0.1,
            high: 0.25,
            basis:
              "In-network capture uplift from closed-loop referral management",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in referral_leakage_rate (leaked referrals recaptured in-network)",
        },
      ],
      timeToValueBand:
        "Contact-center deflection and no-show outreach: 1-2 quarters. Digital " +
        "front door / self-scheduling expansion: 2-4 quarters (gated by " +
        "template governance). Closed-loop referral and template optimization: " +
        "2-4 quarters. Pre-service financial clearance: 2-3 quarters once " +
        "eligibility and estimation data are wired.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Scheduling / access system",
          role: "System of record for templates, slots, appointments, and " +
            "appointment status — the access core.",
          examples: ["Epic Cadence", "Epic Welcome (digital scheduling)"],
        },
        {
          name: "Registration / front-end",
          role: "Captures demographics and coverage at the front door and " +
            "feeds eligibility verification.",
          examples: ["Epic Prelude", "Epic Welcome / e-check-in"],
        },
        {
          name: "Patient engagement / portal (digital front door)",
          role: "Patient-facing self-scheduling, digital intake, reminders, " +
            "estimates, and messaging.",
          examples: ["Epic MyChart"],
        },
        {
          name: "Contact-center / telephony platform",
          role: "Routes and records inbound patient calls and chats; the " +
            "source of abandonment and FCR metrics.",
          examples: [
            "ACD / cloud contact-center platform",
            "Conversational IVR / virtual agent",
          ],
        },
        {
          name: "Referral management / network integrity",
          role: "Tracks referrals from order to scheduled visit and surfaces " +
            "leakage.",
          examples: [
            "Epic referral workqueues",
            "Referral-management / network-integrity point solutions",
          ],
        },
      ],
      roles: [
        {
          title: "VP / Chief Patient Access Officer",
          accountability:
            "End-to-end access, digital front door, and patient acquisition/retention.",
        },
        {
          title: "Access Center / Contact Center Director",
          accountability:
            "Scheduling throughput, abandonment, first-call resolution, and deflection.",
        },
        {
          title: "Director, Digital Patient Experience",
          accountability:
            "Portal activation, online self-scheduling adoption, and digital intake.",
        },
        {
          title: "Director, Network Integrity / Referral Management",
          accountability: "Referral loop-closure and in-network capture.",
        },
        {
          title: "Patient Access Director (Financial Clearance)",
          accountability:
            "Registration accuracy, eligibility verification, estimates, and pre-service collection.",
        },
      ],
      regulatoryFrames: [
        {
          name: "HIPAA / HITECH",
          relevance:
            "Governs PHI handling and identity verification across scheduling, " +
            "portal, intake, and contact-center channels — including AI agents.",
        },
        {
          name: "No Surprises Act",
          relevance:
            "Requires good-faith estimates for scheduled/self-pay services and " +
            "balance-billing protections — shapes the pre-service financial " +
            "experience.",
        },
        {
          name: "ONC information blocking / patient access rules",
          relevance:
            "Mandate patient access to records and scheduling functions, " +
            "pushing portal and digital-front-door adoption.",
        },
        {
          name: "Section 1557 / ADA accessibility & language access",
          relevance:
            "Digital front door and contact center must be accessible and " +
            "support limited-English-proficiency patients to avoid inequitable access.",
        },
      ],
      canonicalTerms: [
        {
          term: "Third-next-available (TNAA)",
          definition:
            "Days to the third-next-open appointment slot — the standard, " +
            "manipulation-resistant measure of real access.",
        },
        {
          term: "Referral leakage",
          definition:
            "Referrals that leave the network (or go unscheduled) when an " +
            "in-network option existed — lost growth and broken care continuity.",
        },
        {
          term: "Template (provider schedule template)",
          definition:
            "The configured pattern of bookable slots, blocks, and visit " +
            "types that governs how a provider's day can be scheduled.",
        },
        {
          term: "Financial clearance",
          definition:
            "Pre-service eligibility verification, estimate, and " +
            "collection/assistance steps that ready an account before the visit.",
        },
        {
          term: "270/271",
          definition:
            "EDI eligibility inquiry (270) and response (271) — the " +
            "transaction that verifies a patient's coverage and benefits.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "Access (third-next-available) by provider/clinic",
        authoritativeSource:
          "Scheduling-system slot-availability snapshots over a trailing period",
        whatGoodEvidenceLooksLike:
          "TNAA computed per provider and visit type with the trailing window " +
          "stated, alongside template utilization for the same providers.",
        weakEvidenceToReject:
          "A single clinic-reported 'we're booked out weeks' with no slot-level snapshot.",
      },
      {
        claim: "No-show rate and its drivers",
        authoritativeSource:
          "Appointment status data (no-show/arrived/cancelled) from the scheduling system",
        whatGoodEvidenceLooksLike:
          "No-show rate by clinic, payer, and visit type over a trailing " +
          "period, with the rebooking/backfill outcome of freed slots.",
        weakEvidenceToReject:
          "An aggregate percentage with no visit-type or payer breakdown and no definition of late-cancel handling.",
      },
      {
        claim: "Referral leakage",
        authoritativeSource:
          "Referral-order vs scheduled-visit reconciliation, plus out-of-network utilization signals",
        whatGoodEvidenceLooksLike:
          "Referrals placed vs scheduled in-network with closed-loop tracking, " +
          "ideally tied to downstream out-of-network utilization.",
        weakEvidenceToReject:
          "Anecdotal 'we think patients leave the network' with no referral-order denominator.",
      },
      {
        claim: "Front-end registration / eligibility quality",
        authoritativeSource:
          "Registration correction logs and 270/271 completion joined to scheduled encounters",
        whatGoodEvidenceLooksLike:
          "Registration accuracy and pre-service eligibility-verification rate " +
          "with downstream denials traced back to the originating field and access point.",
        weakEvidenceToReject:
          "A back-end denial total with no linkage to the registration or eligibility step that caused it.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "What is your third-next-available by specialty, and how does it compare " +
        "to template utilization for those same providers (is it a demand or a " +
        "template problem)?",
      "What is your no-show rate by clinic and payer, and do you have a working " +
        "waitlist or auto-backfill to re-sell freed slots?",
      "What share of referrals you place are actually scheduled in-network, and " +
        "do you close the loop on the ones that aren't?",
      "How many of your visit types are open to online self-scheduling, and " +
        "what is portal activation across your active panel?",
      "What is your contact-center abandonment and first-call-resolution rate, " +
        "and how much routine volume could be deflected to self-service?",
      "What is your pre-service eligibility-verification rate and good-faith " +
        "estimate delivery rate, and do you have a pre-service financial " +
        "conversation?",
      "Do you measure downstream eligibility/demographic denials back to the " +
        "registration field and access point that caused them?",
    ],
    maturitySignals: [
      "Access is measured by third-next-available (not just 'days to first " +
        "open') and read alongside template utilization.",
      "Referrals are tracked closed-loop from order to scheduled in-network visit.",
      "A meaningful share of visit types are self-schedulable and portal " +
        "activation is actively managed across segments, including equity reach.",
      "Pre-service eligibility, estimates, and financial-assistance routing " +
        "run before the visit, and front-end errors are traced to their source.",
    ],
    redFlags: [
      "Access is reported as 'days to first available' (cancellation-inflated) " +
        "with no TNAA and no template-utilization context.",
      "Referrals are placed with no loop-closure — leakage is unknown.",
      "Online self-scheduling exists but only a handful of visit types are " +
        "enabled and portal activation is low and untracked.",
      "Registration and eligibility errors are only counted as back-end " +
        "denials, never traced to the access point that caused them.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EHR-native access suite (e.g. Epic Cadence/Welcome/MyChart)",
        category: "Core scheduling / digital front door",
        switchingCost:
          "Extreme — scheduling and the portal are fused to the enterprise " +
          "EHR; replacement is a multi-year platform decision, not a point swap.",
        renewalDynamics:
          "Bundled with the enterprise EHR agreement; access modules rarely " +
          "sourced standalone.",
      },
      {
        vendorName: "Patient-access point solutions (scheduling AI, intake, estimation)",
        category: "Smart scheduling / digital intake / estimation",
        switchingCost:
          "Moderate — integrate via scheduling/eligibility APIs; replaceable " +
          "with integration effort but workflow-embedded.",
        renewalDynamics:
          "Fast-moving market; favor outcome-based terms (TNAA, deflection) " +
          "and exit/data-portability rights.",
      },
      {
        vendorName: "Contact-center & conversational-AI platforms",
        category: "Telephony / IVR / virtual agent",
        switchingCost:
          "Moderate — telephony migration is disruptive but achievable; watch " +
          "conversational-model and integration lock-in.",
        renewalDynamics:
          "Per-seat or per-interaction pricing; negotiate containment/deflection " +
          "guarantees and seasonal-surge capacity terms.",
      },
      {
        vendorName: "Referral-management / network-integrity vendors",
        category: "Closed-loop referral / leakage analytics",
        switchingCost:
          "Moderate — depends on referral-data feeds; replaceable with data mapping.",
        renewalDynamics:
          "Often value-/outcome-priced on in-network capture; scrutinize " +
          "attribution methodology.",
      },
    ],
    switchingCosts:
      "The scheduling and portal core (EHR-native) is effectively " +
      "non-switchable in isolation; the value frontier and negotiating room " +
      "are in the best-of-breed access automation, contact-center, and " +
      "referral layers around it, where switching cost is moderate.",
    negotiationLevers: [
      "Outcome-based pricing tied to measured TNAA reduction, deflection, or " +
        "in-network capture",
      "Containment/deflection and seasonal-surge capacity guarantees for " +
        "contact-center platforms",
      "Data portability and exit rights to avoid scheduling/referral data lock-in",
      "Pilot-to-scale gating with self-scheduling visit-type coverage proof " +
        "before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      access_metric: [
        "scheduling-system slot snapshot",
        "trailing-period window",
        "template-utilization context",
      ],
      no_show_metric: [
        "appointment-status data",
        "clinic/payer/visit-type breakdown",
      ],
      referral_metric: [
        "referral-order denominator",
        "scheduled-visit reconciliation",
        "out-of-network signal where available",
      ],
      front_end_quality: [
        "registration correction logs",
        "270/271 completion",
        "denial-to-source linkage",
      ],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "Quantitative access claims cite the scheduling/contact-center/referral " +
      "source and the trailing period, and pair access numbers with " +
      "template-utilization context. Value projections cite a baseline plus a " +
      "labelled planning range and the haircut factors applied (especially " +
      "template governance and digital adoption) — never a single asserted ROI.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no template-utilization data — frame access as a possible " +
        "supply/template problem, not a confirmed capacity shortage.",
      "Tenant has no closed-loop referral tracking — present leakage as an " +
        "industry pattern, not their measured number.",
      "Benchmarks are quoted without the tenant's own baseline — present as " +
        "planning ranges.",
      "Vendor-reported deflection or capture outcomes are cited — mark as " +
        "vendor claims pending validation.",
    ],
    inferenceLanguage: [
      "Across provider access operations, third-next-available typically runs...",
      "Without your template-utilization data, the industry pattern suggests " +
        "the constraint may be template design rather than capacity...",
      "Peer systems at this scale commonly see referral leakage of...",
    ],
    flagWithoutEvidence: [
      "A specific TNAA, no-show, or leakage rate for this tenant",
      "A specific dollar value of recaptured referrals or deflected calls for " +
        "this tenant",
      "A claim that specific clinicians' templates are the bottleneck without " +
        "utilization data",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "access by specialty / third-next-available comparison",
      exhibitKind: "chart",
      chartKind: "bar",
      note: "Bar TNAA by specialty/clinic to show where access is tightest.",
    },
    {
      questionPattern: "access vs template utilization (supply diagnosis)",
      exhibitKind: "chart",
      chartKind: "range-bar",
      note: "Plot TNAA against template utilization to expose template-vs-capacity " +
        "constraints per provider/clinic.",
    },
    {
      questionPattern:
        "growth/value impact of access improvement / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current leakage/no-shows to recaptured access and " +
        "downstream value with haircuts (template governance, digital adoption).",
    },
    {
      questionPattern: "referral leakage by specialty / destination",
      exhibitKind: "table",
      note: "Referrals placed vs scheduled in-network by specialty, with " +
        "estimated recapture.",
    },
    {
      questionPattern: "patient access KPI scorecard",
      exhibitKind: "table",
      note: "TNAA, no-show rate, new-patient lead time, self-scheduling rate, " +
        "abandonment, FCR, registration accuracy, eligibility-verification rate " +
        "vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "Clinicians open visit types to self-scheduling and accept template " +
        "redesign — the single biggest unlock",
      "Access is centralized and measured by TNAA read alongside template " +
        "utilization, so supply problems get diagnosed correctly",
      "Closed-loop referral tracking exists so leakage is visible and worked",
      "Front-end errors are traced to their source, turning access quality into " +
        "denial prevention",
    ],
    failureDrivers: [
      "Self-scheduling and outreach bolted on while clinicians keep templates " +
        "restricted — capability without enabled visit types",
      "Treating access as a pure demand/capacity problem and missing low " +
        "template utilization",
      "Digital front door deployed without equity reach, so under-adopting " +
        "populations are left on the phone and leakage persists",
      "Registration/eligibility errors left as back-end denials with no " +
        "source linkage, so the same access defects recur",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Contact-center deflection and no-show outreach adopt first (clear, " +
      "measurable, staff-friendly). Digital self-scheduling and template " +
      "optimization scale only as fast as clinician governance allows — " +
      "physician scheduling templates are the gating constraint. Pre-service " +
      "financial clearance follows once eligibility and estimation data are wired.",
    roiClarity: "medium",
    roiClarityBasis:
      "Operational access metrics (TNAA, no-show, abandonment, FCR) are firmly " +
      "measurable, but the downstream GROWTH and denial-prevention value is " +
      "harder to attribute cleanly — recaptured referrals and prevented denials " +
      "depend on market and payer behavior, and self-scheduling upside is " +
      "gated by clinician template decisions, so ROI is real but mid-confidence.",
  },

  regulatoryFrame: {
    name: "No Surprises Act & ONC Patient Access / Information Blocking",
    relevance:
      "The dominant patient-facing regulatory frame for the digital front " +
      "door: No Surprises Act drives good-faith estimates and the pre-service " +
      "financial experience, while ONC patient-access and information-blocking " +
      "rules push portal and self-scheduling adoption. HIPAA/HITECH and " +
      "Section 1557/ADA accessibility also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
