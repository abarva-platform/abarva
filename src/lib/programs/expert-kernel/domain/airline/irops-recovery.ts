// Domain Function Pack — Airline · Irregular-Operations (IROPS) recovery & customer care.
//
// The disruption-recovery function of a global network carrier: when weather /
// ATC / crew / mechanical events break the schedule, how the airline re-accommodates
// passengers, controls goodwill/compensation, and protects loyalty. This is where
// proactive, AI-driven passenger recovery creates the sharpest value.
//
// Pure, deterministic, typed module — no I/O, no fabrication. Every benchmark is a
// labelled PLANNING range with an explicit basis; nothing here is asserted as a
// client fact. Content is airline-specific (the spec hard-fails generic layers).

import type { FunctionPack } from "../function-pack-types";

export const airlineIropsRecoveryPack: FunctionPack = {
  industryKey: "airline",
  functionKey: "irops_recovery",
  functionLabel: "Irregular operations (IROPS) recovery & customer care",
  summary:
    "When a global network carrier hits irregular operations — weather, ATC/airspace, crew, or mechanical disruption — the operation is rebuilt by the Operations Control Center while the passenger consequence is handled reactively and downstream: generic notifications, airport service-desk queues, and contact-center spikes. This function covers how disrupted passengers are re-accommodated, how goodwill and statutory compensation are controlled, and how high-value and vulnerable travelers are protected. The economic and loyalty stakes concentrate here precisely when the customer is most at risk, which is why proactive, personalized, mostly self-served recovery — and value/vulnerability triage of the cases that need a human — is the highest-leverage AI bet.",
  version: "1.0.0",
  lastReviewed: "2026-06-13",

  // ── Layer 1 — operating metrics (≥10) ──
  operatingMetrics: [
    {
      key: "time_to_confirmed_rebooking",
      name: "Time to confirmed rebooking",
      definition:
        "Elapsed time from a disruption affecting a passenger to a confirmed, accepted re-accommodation on a new itinerary.",
      unit: "minutes",
      directionOfGood: "lower",
      benchmarkRange: {
        low: 30,
        high: 95,
        basis:
          "Operator experience across hub carriers; the high end reflects reactive desk/call-center handling, the low end proactive self-service.",
        label: "planning-range",
      },
      dataSource:
        "PSS / reservations rebooking transactions + contact-center timestamps",
      whyItMatters:
        "The single clearest measure of recovery responsiveness; it drives both satisfaction and downstream misconnect cascades.",
    },
    {
      key: "end_to_end_recovery_time",
      name: "End-to-end recovery time",
      definition:
        "Time from disruption to a fully resolved passenger outcome including any hotel, ground transport, and meal provisioning.",
      unit: "hours",
      directionOfGood: "lower",
      benchmarkRange: {
        low: 1.5,
        high: 5.5,
        basis:
          "Severe-day hub operator ranges; widens sharply on weather days with hotel/ground sourcing.",
        label: "planning-range",
      },
      dataSource: "Service-desk + disruption-care (hotel/ground) systems",
      whyItMatters:
        "Captures the full passenger burden, not just the rebooking transaction.",
    },
    {
      key: "self_service_recovery_rate",
      name: "Self-service recovery rate",
      definition:
        "Share of disrupted passengers who complete re-accommodation digitally without an agent.",
      unit: "%",
      directionOfGood: "higher",
      benchmarkRange: {
        low: 15,
        high: 70,
        basis:
          "Low end = generic-notification baselines; high end = carriers with actionable, personalized digital recovery.",
        label: "planning-range",
      },
      dataSource: "Mobile app / web self-service completion events",
      whyItMatters:
        "The deflection lever: every self-served recovery removes a desk/call-center contact and resolves the passenger faster.",
    },
    {
      key: "irops_contact_deflection_rate",
      name: "IROPS contact deflection rate",
      definition:
        'Share of disruption-driven contacts resolved without a live agent (the deflectable "what are my options" demand).',
      unit: "%",
      directionOfGood: "higher",
      benchmarkRange: {
        low: 20,
        high: 65,
        basis:
          "Speech-analytics samples put 60–75% of IROPS contacts in the deflectable band; realized deflection lags intent.",
        label: "planning-range",
      },
      dataSource: "Contact-center platform + speech/intent analytics",
      whyItMatters:
        "Directly sizes the contact-center cost-avoidance value pool on severe days.",
    },
    {
      key: "irops_call_spike_ratio",
      name: "IROPS contact-volume spike ratio",
      definition:
        "Peak disruption-day contact volume as a multiple of a normal-day baseline.",
      unit: "x baseline",
      directionOfGood: "lower",
      benchmarkRange: {
        low: 2.0,
        high: 4.0,
        basis: "Hub-carrier operator experience on severe weather/ATC days.",
        label: "planning-range",
      },
      dataSource: "Contact-center platform volume telemetry",
      whyItMatters:
        "The spike is what overwhelms staffing and collapses service levels; deflection flattens it.",
    },
    {
      key: "misconnect_rate",
      name: "Misconnect rate on disrupted itineraries",
      definition:
        "Share of disrupted connecting itineraries where the passenger misses an onward segment.",
      unit: "%",
      directionOfGood: "lower",
      benchmarkRange: {
        low: 12,
        high: 28,
        basis:
          "Connecting-bank operator ranges; earlier prediction + proactive re-protection reduces cascades.",
        label: "planning-range",
      },
      dataSource: "PSS itinerary + operations control schedule",
      whyItMatters:
        "Misconnects multiply re-accommodation cost and are the most damaging disruption experience.",
    },
    {
      key: "goodwill_spend_per_disrupted_pax",
      name: "Goodwill + compensation spend per disrupted passenger",
      definition:
        "Average discretionary goodwill plus statutory compensation issued per disrupted passenger.",
      unit: "USD per pax",
      directionOfGood: "lower",
      benchmarkRange: {
        low: 18,
        high: 60,
        basis:
          "Operator ranges; the spread reflects manual discretion vs policy-governed automated offers.",
        label: "planning-range",
      },
      dataSource: "Compensation / goodwill engine + finance reconciliation",
      whyItMatters:
        "Manual issuance under pressure leaks budget; policy-governed offers recover it without under-serving.",
    },
    {
      key: "compensation_policy_compliance",
      name: "Compensation policy-compliance rate",
      definition:
        "Share of compensation/care decisions that match the codified entitlement policy for the jurisdiction and cause.",
      unit: "%",
      directionOfGood: "higher",
      benchmarkRange: {
        low: 70,
        high: 99,
        basis:
          "Manual application sits low; codified, jurisdiction-aware automation approaches near-complete compliance.",
        label: "planning-range",
      },
      dataSource: "Compensation engine audit log vs entitlement rules",
      whyItMatters:
        "Both a cost-control and a regulatory-exposure measure (EU261/DOT correctness).",
    },
    {
      key: "proactive_notification_lead_time",
      name: "Proactive notification lead time",
      definition:
        "Time before the original gate at which the passenger receives personalized recovery options.",
      unit: "minutes before gate",
      directionOfGood: "higher",
      benchmarkRange: {
        low: 0,
        high: 120,
        basis:
          "Reactive baselines notify at/after the event; proactive carriers push options well before the gate.",
        label: "planning-range",
      },
      dataSource:
        "Notification gateway (app/SMS/messaging) send events vs scheduled departure",
      whyItMatters:
        "Earlier, actionable notice is what converts a queue into a self-service resolution.",
    },
    {
      key: "high_value_retention_through_disruption",
      name: "High-value passenger retention through a disruption",
      definition:
        "90-day retention of top-tier loyalty members who experienced a severe disruption, vs non-disrupted top-tier.",
      unit: "% retained",
      directionOfGood: "higher",
      benchmarkRange: {
        low: 88,
        high: 97,
        basis:
          "Loyalty-analytics ranges; severe disruption lifts top-tier attrition several points without a protected experience.",
        label: "planning-range",
      },
      dataSource: "Loyalty / CRM analytics cohort tracking",
      whyItMatters:
        "Top-tier travelers concentrate revenue; protecting their disruption experience is the largest value pool.",
    },
    {
      key: "disruption_experience_nps_delta",
      name: "Disruption-experience NPS delta",
      definition:
        "Change in Net Promoter Score among passengers measured during/after a disruption vs baseline.",
      unit: "NPS points",
      directionOfGood: "higher",
      benchmarkRange: {
        low: -40,
        high: -10,
        basis:
          "Disruption NPS collapses 30+ points reactively; a protected recovery narrows the drop.",
        label: "planning-range",
      },
      dataSource: "CX measurement / post-trip survey",
      whyItMatters:
        "The clearest leading indicator of loyalty damage from poor recovery.",
    },
  ],

  // ── Layer 2 — pain themes (≥6) ──
  painThemes: [
    {
      key: "late_generic_notification",
      name: "Late, generic disruption notification",
      description:
        'Passengers get a "your flight is delayed/cancelled" message with no personalized options and no action, so they self-select into queues and calls.',
      detectionSignal:
        'High share of inbound "what are my options" contacts immediately after a disruption is declared.',
      diagnosticQuestion:
        "When a disruption is declared, what does the passenger receive, when, and can they act on it without contacting us?",
    },
    {
      key: "queue_by_arrival_not_value",
      name: "Recovery worked by arrival order, not value or vulnerability",
      description:
        "Agents work the desk/call queue in arrival order; high-value, vulnerable, and complex-itinerary passengers wait behind simple cases.",
      detectionSignal:
        "No tier/vulnerability signal in the recovery queue; top-tier members report long waits.",
      diagnosticQuestion:
        "Can an agent see, in the moment, which passengers are high-value or vulnerable — and does that change who is helped first?",
    },
    {
      key: "manual_goodwill_leakage",
      name: "Manual goodwill leakage",
      description:
        "Compensation and goodwill are applied at individual agent discretion under pressure, producing off-policy over-issuance and inconsistent EU261/DOT application.",
      detectionSignal:
        "Finance audit shows a material gap between issued goodwill and codified policy entitlement.",
      diagnosticQuestion:
        "How is compensation decided today, and what is the estimated leakage versus the written policy?",
    },
    {
      key: "no_realtime_passenger_profile",
      name: "No real-time unified passenger profile",
      description:
        "Tier, value, behavioral, service history, and live itinerary live in siloed, batch systems (Teradata/SAS/mainframe feeds); the unifying real-time CDP is not activated, so recovery cannot personalize in seconds.",
      detectionSignal:
        "Customer signals are a day stale; no activated real-time profile joining loyalty, digital, service, and PNR.",
      diagnosticQuestion:
        "What is the real-time data path for a passenger decision today — or is everything batch — and is the real-time customer profile/CDP activated?",
    },
    {
      key: "pss_load_brownout_risk",
      name: "Reservation-host load brownout on storm days",
      description:
        "Self-service rebooking at storm-day volume can overwhelm the PSS host, risking transaction integrity without throttling/queueing.",
      detectionSignal:
        "PSS latency/error rates spike during mass re-accommodation; rebooking is batch-triggered by agents to protect the host.",
      diagnosticQuestion:
        "What is the reservation host's throughput ceiling, and how is it protected under simultaneous self-service load?",
    },
    {
      key: "fragmented_recovery_channels",
      name: "Fragmented, open-loop recovery channels",
      description:
        "App, SMS, messaging, desk, and call center are not a closed loop; passengers re-contact to check progress, adding volume, and updates are generic.",
      detectionSignal:
        "Repeat-contact rate during disruptions is high; no single status thread across channels.",
      diagnosticQuestion:
        "Is there one closed-loop recovery thread per passenger across channels, or do they re-contact to find out what is happening?",
    },
  ],

  // ── Layer 3 — AI use-case archetypes (≥5) ──
  aiUseCaseArchetypes: [
    {
      key: "proactive_personalized_recovery",
      name: "Proactive personalized recovery",
      valueMechanism:
        "Detect the disruption and predict each passenger's impact, generate a ranked set of personalized options, and push them to the preferred channel before the passenger reaches the gate — converting queue demand into self-service resolution and deflecting contacts.",
      adoptionProfile: "emerging",
      dataDependencies: [
        "Real-time operations/disruption events",
        "PNR/itinerary",
        "rebooking inventory",
        "loyalty tier",
        "consented channel",
      ],
      controlPosture: "human-on-the-loop",
      controlRiskNotes: [
        "Must present statutory options (refund/re-route) where owed",
        "Notification must respect consent + accessibility",
        "No personalized offer without a real-time profile or an honest fallback",
      ],
      metricsMoved: [
        "self_service_recovery_rate",
        "time_to_confirmed_rebooking",
        "irops_contact_deflection_rate",
        "disruption_experience_nps_delta",
      ],
    },
    {
      key: "value_vulnerability_triage",
      name: "Value & vulnerability triage",
      valueMechanism:
        "Score the recovery queue by tier/lifetime value and vulnerability (unaccompanied minors, special assistance, complex international), routing the cases that need a human to agents while the rest self-serve — protecting retention and duty of care.",
      adoptionProfile: "early",
      dataDependencies: [
        "Loyalty tier + value",
        "vulnerability flags",
        "itinerary complexity",
      ],
      controlPosture: "human-in-the-loop",
      controlRiskNotes: [
        "Vulnerable passengers must always reach a human",
        "Triage must not be a discriminatory or opaque ranking",
        "Fairness review of the scoring",
      ],
      metricsMoved: [
        "high_value_retention_through_disruption",
        "end_to_end_recovery_time",
      ],
    },
    {
      key: "policy_governed_compensation",
      name: "Policy-governed automated compensation",
      valueMechanism:
        "Apply the correct jurisdiction- and cause-aware entitlement automatically within set limits and log every offer immutably — recovering goodwill leakage while improving regulatory correctness.",
      adoptionProfile: "early",
      dataDependencies: [
        "Codified EU261/DOT/UK261 entitlement rules",
        "cause coding",
        "fare/itinerary",
      ],
      controlPosture: "human-approval-required",
      controlRiskNotes: [
        "Every automated offer must be auditable + reproducible",
        "Limits and escalation thresholds set by finance/legal",
        "Cause classification governs exposure",
      ],
      metricsMoved: [
        "goodwill_spend_per_disrupted_pax",
        "compensation_policy_compliance",
      ],
    },
    {
      key: "misconnect_prediction",
      name: "Misconnect prediction & proactive re-protection",
      valueMechanism:
        "Predict which connecting passengers will misconnect from live position/ETA and re-protect them proactively before the missed connection, reducing cascade cost.",
      adoptionProfile: "experimenting",
      dataDependencies: [
        "Real-time flight position/ETA",
        "connection banks",
        "inventory",
      ],
      controlPosture: "human-on-the-loop",
      controlRiskNotes: [
        "Avoid premature re-protection that wastes inventory",
        "Confidence threshold on the prediction",
      ],
      metricsMoved: ["misconnect_rate", "time_to_confirmed_rebooking"],
    },
    {
      key: "self_service_rebooking_orchestration",
      name: "Self-service rebooking orchestration",
      valueMechanism:
        "Wire one-tap self-rebooking to inventory + PSS with protected-inventory guardrails and host throttling, so passengers complete the transaction themselves without brownout risk.",
      adoptionProfile: "emerging",
      dataDependencies: [
        "Rebooking inventory API",
        "PSS transaction layer",
        "protected-inventory rules",
      ],
      controlPosture: "autonomous-with-audit",
      controlRiskNotes: [
        "Guardrails prevent premium-cabin give-away",
        "Throttle/queue to protect the host",
        "Every transaction logged",
      ],
      metricsMoved: [
        "self_service_recovery_rate",
        "time_to_confirmed_rebooking",
      ],
    },
  ],

  // ── Layer 4 — reference solution patterns (≥4) ──
  referenceSolutionPatterns: [
    {
      key: "recovery_orchestration_layer",
      name: "Recovery orchestration layer",
      description:
        "A real-time layer between the operations control system and the passenger that maps events to affected PNRs, generates ranked recovery options, and drives multichannel notification + self-service + agent triage.",
      boundary:
        "Owns the per-passenger recovery decision and channel orchestration; does NOT own the schedule recovery (OCC) or the rebooking transaction (PSS).",
      humanAccountabilityPoint:
        "Operations Control Center declares the disruption and cause; Customer Experience owns the recovery policy.",
      controlPosture: "human-on-the-loop",
      dispositionKind: "option",
    },
    {
      key: "realtime_profile_foundation",
      name: "Real-time passenger-profile foundation",
      description:
        "The unified, low-latency profile (loyalty + behavioral + service + live itinerary) the recovery decision reads. Either activate the real-time CDP or build a thin purpose-built real-time layer over the operational truth, keeping the warehouse/lake/SAS estate as the analytics backplane.",
      boundary:
        "Provides the real-time read for a recovery decision; does NOT replace the analytical warehouse or require completing the full estate migration.",
      humanAccountabilityPoint:
        "Enterprise Architecture / Head of Data Platforms owns the activate-CDP-vs-purpose-built decision.",
      controlPosture: "human-approval-required",
      dispositionKind: "foundation",
    },
    {
      key: "one_tap_self_rebooking",
      name: "One-tap self-rebooking",
      description:
        "A guarded self-service rebooking action wired to inventory + PSS with protected-inventory rules and host throttling, surfaced in the proactive notification.",
      boundary:
        "Owns the passenger-initiated rebooking transaction within guardrails; does NOT set fare/inventory rules (Revenue Management) or handle interline (phase 2).",
      humanAccountabilityPoint:
        "Revenue Management owns the protected-inventory and fare-class guardrails.",
      controlPosture: "autonomous-with-audit",
      dispositionKind: "option",
    },
    {
      key: "agent_exception_console",
      name: "Agent exception-handling console",
      description:
        "Agents shift from queue-working to exception handling, with the same ranked option set pre-loaded for the vulnerable/complex cases triaged to them.",
      boundary:
        "Owns the assisted-recovery and exception decisions; does NOT replace self-service for routine cases.",
      humanAccountabilityPoint:
        "Customer Care leadership owns the agent operating model and the exception policy.",
      controlPosture: "human-in-the-loop",
      dispositionKind: "option",
    },
  ],

  // ── Layer 5 — value model ──
  valueModel: {
    valueRealizationNarrative:
      'Value comes from four pools that move together when recovery shifts from reactive to proactive: (1) contact-center + service-desk cost avoidance via deflection of the "what are my options" demand; (2) goodwill/compensation leakage recovery via policy-governed automated offers; (3) retained high-value loyalty revenue from a protected disruption experience; and (4) reduced misconnect re-accommodation cost from earlier prediction. The pools are real but each is heavily conditioned by adoption, the real-time-data gap, and regulatory correctness — so a forecast must be haircut honestly rather than summed at face value.',
    dominantHaircutFactors: [
      {
        factor: "Real-time data readiness",
        rationale:
          "A batch warehouse/SAS/mainframe estate with an un-activated real-time profile caps how much recovery can personalize in seconds — the largest constraint on the proactive value.",
        typicalHaircut: {
          low: 0.2,
          high: 0.45,
          basis:
            "Operator experience where the real-time profile/CDP is not yet live.",
          label: "planning-range",
        },
      },
      {
        factor: "Adoption / channel reach",
        rationale:
          "Self-service value is bounded by app/messaging reach and passenger willingness during stress.",
        typicalHaircut: {
          low: 0.15,
          high: 0.35,
          basis: "Digital-adoption ranges across disrupted-passenger cohorts.",
          label: "planning-range",
        },
      },
      {
        factor: "Regulatory entitlement floor",
        rationale:
          "Statutory compensation (EU261/DOT) is largely fixed; savings come from correct-first-time application, not reduction.",
        typicalHaircut: {
          low: 0.1,
          high: 0.25,
          basis:
            "Share of compensation that is statutory and non-discretionary.",
          label: "planning-range",
        },
      },
      {
        factor: "PSS load / throttling",
        rationale:
          "Host throughput limits throttle how much self-service can flow on the worst days.",
        typicalHaircut: {
          low: 0.05,
          high: 0.2,
          basis: "Operator experience on severe-day reservation-host load.",
          label: "planning-range",
        },
      },
    ],
    valueBenchmarks: [
      {
        lever: "Contact-center + service-desk deflection cost avoidance",
        range: {
          low: 0.3,
          high: 0.55,
          basis:
            "Fraction of IROPS contact cost addressable via deflection of the deflectable band.",
          label: "planning-range",
        },
        measuredAs: "reduction in IROPS contact + service-desk cost",
      },
      {
        lever: "Goodwill / compensation leakage recovery",
        range: {
          low: 0.15,
          high: 0.35,
          basis:
            "Fraction of discretionary goodwill recoverable under policy-governed offers.",
          label: "planning-range",
        },
        measuredAs: "reduction in off-policy goodwill spend",
      },
      {
        lever: "Retained high-value loyalty revenue",
        range: {
          low: 0.2,
          high: 0.5,
          basis:
            "Fraction of disruption-driven top-tier attrition addressable by a protected experience.",
          label: "planning-range",
        },
        measuredAs: "retained top-tier revenue at risk",
      },
      {
        lever: "Misconnect re-accommodation cost reduction",
        range: {
          low: 0.1,
          high: 0.3,
          basis:
            "Fraction of misconnect cascade cost addressable by earlier prediction + re-protection.",
          label: "planning-range",
        },
        measuredAs: "reduction in downstream re-accommodation cost",
      },
    ],
    timeToValueBand:
      "Hub pilot value in 1–2 quarters (deflection + self-service), network value over 3–4 quarters once the real-time path and compensation governance are in place.",
  },

  // ── Layer 6 — vocabulary & entities ──
  vocabulary: {
    systemsOfRecord: [
      {
        name: "Passenger Service System (PSS)",
        role: "PNR, ticketing, and rebooking transactions — the reservation host of record.",
        examples: ["Amadeus Altea", "Sabre", "Navitaire"],
      },
      {
        name: "Operations Control System",
        role: "Schedule, delays, cancellations, crew/aircraft recovery and cause coding.",
        examples: ["Sabre Movement Manager", "Lufthansa Systems NetLine/Ops"],
      },
      {
        name: "Rebooking inventory / availability",
        role: "Seat availability and fare-class rules that bound re-accommodation options.",
        examples: ["Revenue-management availability engine"],
      },
      {
        name: "Loyalty / CRM platform",
        role: "Tier, lifetime value, contact preference and consent for triage and channel.",
        examples: ["Loyalty FF platform", "Salesforce Service Cloud"],
      },
      {
        name: "Notification / CPaaS gateway",
        role: "Outbound app push / SMS / messaging with delivery receipts.",
        examples: ["Twilio", "app push"],
      },
      {
        name: "Compensation / goodwill engine",
        role: "Vouchers and statutory entitlement application with audit log.",
        examples: ["In-house compensation engine"],
      },
      {
        name: "Analytics estate (warehouse / lake / SAS)",
        role: "Batch analytics, measurement and model training — the backplane, not the real-time serving layer.",
        examples: ["Teradata", "cloud lake", "SAS"],
      },
    ],
    roles: [
      {
        title: "Operations Control Center (OCC) lead",
        accountability:
          "Declares disruptions, codes cause/severity, owns schedule recovery — the operational truth.",
      },
      {
        title: "Chief Customer Officer",
        accountability:
          "Accountable for the disruption experience, loyalty retention, and contact-center cost.",
      },
      {
        title: "Customer Care / contact-center director",
        accountability:
          "Deflection target + agent operating model and exception handling.",
      },
      {
        title: "Revenue Management",
        accountability:
          "Protected-inventory and fare guardrails on automated rebooking.",
      },
      {
        title: "Legal / regulatory",
        accountability:
          "Jurisdiction-aware entitlement logic and audit of automated offers.",
      },
    ],
    regulatoryFrames: [
      {
        name: "EU261 / EC 261/2004",
        relevance:
          "Care + cash-compensation obligations on EU departures/arrivals by distance band when within the carrier's control.",
      },
      {
        name: "US DOT passenger protections",
        relevance:
          "Automatic refunds for cancellations/significant changes and published customer-service-plan care commitments.",
      },
      {
        name: "UK261",
        relevance: "Retained-EU261 obligations for UK touchpoints.",
      },
    ],
    canonicalTerms: [
      {
        term: "IROPS",
        definition:
          "Irregular operations — disruptions to the planned schedule (weather, ATC, crew, mechanical).",
      },
      {
        term: "Re-accommodation",
        definition:
          "Re-protecting a disrupted passenger onto a new itinerary, including ground/hotel where owed.",
      },
      {
        term: "Misconnect",
        definition:
          "A connecting passenger missing an onward segment due to an upstream disruption.",
      },
      {
        term: "Ground stop",
        definition:
          "An ATC-imposed hold preventing departures to/from an airport, a major IROPS trigger.",
      },
      {
        term: "Controllable vs extraordinary cause",
        definition:
          "The disruption-cause classification (e.g. crew/mechanical vs weather/ATC) that governs statutory compensation exposure.",
      },
    ],
  },

  // ── Layer 7 — deliverable outlines (all 4 phase artifacts) ──
  deliverableOutlines: [
    {
      artifact: "discover_brief",
      label: "IROPS Recovery — Discover & Diagnose Brief",
      phase: "P2 Discover & Diagnose",
      purpose:
        "Establish the current-state recovery reality, the baselines, and the gaps the design must close.",
      sections: [
        {
          heading: "Current-state recovery flow",
          guidance:
            "Trace disruption declaration → notification → queue/call → manual rebooking → goodwill; name where the operational truth and the passenger experience disconnect.",
        },
        {
          heading: "Baselines",
          guidance:
            "Record the operating metrics that exist (time-to-rebooking, self-service rate, deflectable %, NPS delta, misconnect rate) and mark the missing ones as precise seed gaps.",
        },
        {
          heading: "Data & real-time readiness",
          guidance:
            "Assess the estate (warehouse/lake/SAS/mainframe) and whether a real-time profile/CDP is activated — the top constraint on personalization.",
        },
        {
          heading: "Pain themes & gaps",
          guidance:
            "Map the function pain themes to observed signals; produce the gap register that the design and business case will close.",
        },
      ],
    },
    {
      artifact: "business_case",
      label: "IROPS Recovery — Costed Business Case",
      phase: "P4 Roadmap & Business Case",
      purpose:
        "Make the fund/shape/kill case from the four value pools, haircut honestly against the real-time-data and adoption constraints.",
      sections: [
        {
          heading: "Value pools",
          guidance:
            "Build deflection, goodwill-leakage, retained-loyalty, and misconnect-cost pools from the recorded baselines and the value-model benchmark ranges — never invented numbers.",
        },
        {
          heading: "Haircuts",
          guidance:
            "Apply the dominant haircut factors (real-time data readiness, adoption, regulatory floor, PSS load) and show the haircut value, not the face value.",
        },
        {
          heading: "Cost & phasing",
          guidance:
            "Orchestration build + integrations (ops, inventory, PSS, CPaaS, compensation), AI run cost, pilot ops, change management; phase a hub pilot before network.",
        },
        {
          heading: "Recommendation & kill condition",
          guidance:
            "State the fund/shape/kill verdict and the explicit kill condition (self-service rate + time-to-rebooking at the hub) before network rollout.",
        },
      ],
    },
    {
      artifact: "solution_architecture",
      label: "IROPS Recovery — Solution Architecture",
      phase: "P3 Design Future State",
      purpose:
        "Select the recovery architecture and resolve the real-time-data foundation decision.",
      sections: [
        {
          heading: "Target experience",
          guidance:
            "Describe proactive recovery: event→impact→ranked options→multichannel push→self-service + triage→policy-governed compensation.",
        },
        {
          heading: "Real-time foundation decision",
          guidance:
            "Rank activate-CDP vs purpose-built real-time layer over the operational truth, keeping warehouse/lake/SAS as the analytics backplane; do not depend on completing the full migration.",
        },
        {
          heading: "Pattern scorecard",
          guidance:
            "Score the recovery-orchestration layer, one-tap self-rebooking, and agent exception console as options; show the real-time-profile foundation as adopted.",
        },
        {
          heading: "Non-functional + governance",
          guidance:
            "PSS throttling/queueing, jurisdiction-aware entitlement engine, immutable audit trail, consent and accessibility.",
        },
      ],
    },
    {
      artifact: "mobilization_plan",
      label: "IROPS Recovery — Mobilization Plan",
      phase: "P5 Mobilize & Handoff",
      purpose: "Stand up the hub pilot pod and instrument the proof.",
      sections: [
        {
          heading: "Pilot pod & scope",
          guidance:
            "OCC liaison, customer-care lead, digital product, integration engineering, finance/legal reviewer; primary-hub own-metal scope, interline/long-haul out.",
        },
        {
          heading: "Instrumentation",
          guidance:
            "Wire the baselines (time-to-rebooking, self-service rate, IROPS contact volume, disruption NPS) before go-live so the kill condition is measurable.",
        },
        {
          heading: "Governance gate",
          guidance:
            "Gate self-service compensation go-live on the audited entitlement policy sign-off.",
        },
        {
          heading: "Handoff to Tower",
          guidance:
            "Hand execution tracking to Tower against the roadmap and the kill condition.",
        },
      ],
    },
  ],

  // ── Layer 8 — evidence anchors (≥4) ──
  evidenceAnchors: [
    {
      claim:
        "Current recovery responsiveness (time-to-rebooking, self-service rate)",
      authoritativeSource:
        "PSS rebooking transactions + contact-center timestamps + app self-service events",
      whatGoodEvidenceLooksLike:
        "Measured distributions over a recent disruption window, segmented by cause and hub.",
      weakEvidenceToReject:
        'A single anecdotal "about an hour" figure with no measurement window or source.',
    },
    {
      claim: "Goodwill leakage vs policy",
      authoritativeSource:
        "Compensation-engine audit log compared to the codified entitlement policy + a finance audit sample",
      whatGoodEvidenceLooksLike:
        "A reconciled gap between issued goodwill and policy entitlement, with a sampled error rate.",
      weakEvidenceToReject:
        'A blanket "agents over-issue" claim with no audit sample or quantified gap.',
    },
    {
      claim: "High-value attrition after a severe disruption",
      authoritativeSource:
        "Loyalty/CRM cohort analytics tracking disrupted vs non-disrupted top-tier retention",
      whatGoodEvidenceLooksLike:
        "A measured 90-day retention delta by tier from a defined disruption cohort.",
      weakEvidenceToReject:
        "An assumed attrition number with no cohort definition or tracking.",
    },
    {
      claim: "Real-time data readiness for personalization",
      authoritativeSource:
        "Enterprise-architecture estate profile + the activation status of the real-time profile/CDP",
      whatGoodEvidenceLooksLike:
        "A documented latency path from operational event to a usable unified profile, and the CDP activation state.",
      weakEvidenceToReject:
        "A vendor slide asserting a real-time profile that is licensed but not activated.",
    },
  ],
};
