// Consilium expert — Healthcare Pharmacy Operations (provider).
//
// Wave-4 ExpertPack v2 (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). An
// industry-function expert for provider pharmacy operations spanning inpatient,
// outpatient/retail, and specialty pharmacy.
//
// Honest framing: in a provider pharmacy the dominant economics and the
// dominant regulatory exposure are (1) the 340B Drug Pricing Program — the
// margin engine that underwrites the enterprise and the single largest audit
// risk — and (2) specialty-drug spend, which is a minority of scripts but the
// majority of dollars and growth. Dispensing throughput, formulary discipline,
// and medication safety matter, but they are not where the money or the
// compliance jeopardy concentrates. This pack says so explicitly.
//
// Anchored to Epic Willow (inpatient + ambulatory pharmacy) as the dominant
// system of record, with 340B split-billing / TPA tooling and PBM/payer
// connectivity around it — product-aware, not product-locked.

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const healthcarePharmacyOperationsExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.healthcare-provider.pharmacy-operations",
    expertName: "Healthcare Pharmacy Operations Expert",
    kind: "industry-function",
    industry: "healthcare_provider",
    functionKey: "pharmacy-operations",
    scopeNote:
      "Provider-side pharmacy operations across three settings: inpatient " +
      "pharmacy (dispensing, sterile compounding, med safety, formulary), " +
      "outpatient/retail pharmacy, and specialty pharmacy (specialty Rx " +
      "capture, prior auth, adherence). Covers the 340B Drug Pricing Program " +
      "(eligibility, split-billing, contract pharmacy, compliance), formulary " +
      "and medication management, pharmacy revenue and margin, and clinical " +
      "pharmacy. Anchored to Epic Willow. Excludes payer/PBM adjudication " +
      "internals and clinical care delivery (separate experts).",
  },

  domain: {
    operatingMetrics: [
      {
        key: "drug_spend_pct_of_expense",
        name: "Drug spend as % of total operating expense",
        definition:
          "Total pharmaceutical acquisition cost (inpatient + outpatient + " +
          "specialty) as a share of total enterprise operating expense.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 8,
          high: 15,
          basis:
            "Provider cost-structure ranges; specialty-heavy academic systems run higher",
          label: "planning-range",
        },
        dataSource:
          "Pharmacy purchasing (wholesaler/GPO invoices) vs GL operating expense",
        whyItMatters:
          "Drug spend is one of the fastest-growing non-labor cost lines and is " +
          "dominated by specialty; the trend, not the level, signals whether " +
          "formulary and specialty strategy are holding.",
      },
      {
        key: "savings_340b_captured",
        name: "340B savings captured (vs WAC)",
        definition:
          "Realized acquisition savings on 340B-eligible drugs measured as the " +
          "spread between 340B ceiling price and the price otherwise paid (WAC/" +
          "GPO), net of program administration cost.",
        unit: "USD",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 20000000,
          high: 200000000,
          basis:
            "Wide by covered-entity type and patient volume; DSH/CAH/grantee differ markedly",
          label: "planning-range",
        },
        dataSource:
          "Split-billing / TPA capture reports reconciled to wholesaler 340B accumulations",
        whyItMatters:
          "340B is the margin engine that underwrites charity care and service " +
          "lines for most safety-net and DSH providers; under-capture is forgone " +
          "margin and over-capture is the top audit exposure.",
      },
      {
        key: "specialty_rx_capture_rate",
        name: "Specialty Rx capture rate",
        definition:
          "Share of specialty prescriptions written by the system's providers " +
          "that are filled by the system's own specialty pharmacy (vs leaked to " +
          "external/PBM-mandated pharmacies).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 30,
          high: 60,
          basis:
            "Limited-distribution and payer-mandate restrictions cap achievable capture",
          label: "planning-range",
        },
        dataSource:
          "Specialty Rx written (EHR) vs filled internally (Willow specialty / dispensing system)",
        whyItMatters:
          "Specialty is the dollar and margin center of pharmacy; every captured " +
          "script keeps margin in-house, enables 340B capture, and improves " +
          "adherence and clinical oversight.",
      },
      {
        key: "specialty_drug_spend",
        name: "Specialty drug spend",
        definition:
          "Total acquisition cost of specialty pharmaceuticals across all " +
          "settings, in dollars, over a trailing period.",
        unit: "USD",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 50000000,
          high: 500000000,
          basis:
            "Specialty is ~50%+ of drug spend at large systems and growing double digits",
          label: "planning-range",
        },
        dataSource:
          "Purchasing detail flagged by specialty NDC / therapeutic class",
        whyItMatters:
          "Specialty is a minority of volume but the majority of spend and nearly " +
          "all the growth; managing it (biosimilars, site of care, formulary) is " +
          "where the cost curve is won or lost.",
      },
      {
        key: "formulary_compliance_rate",
        name: "Formulary compliance rate",
        definition:
          "Share of medication orders/dispenses that conform to the approved " +
          "formulary (preferred agent, no unjustified non-formulary use).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 90,
          high: 98,
          basis: "P&T-managed systems; non-formulary use concentrated in a few prescribers",
          label: "planning-range",
        },
        dataSource:
          "Orders vs formulary status (EHR / pharmacy formulary master)",
        whyItMatters:
          "Formulary discipline converts P&T decisions (biosimilar preference, " +
          "therapeutic interchange) into realized savings; leakage erases the " +
          "negotiated value.",
      },
      {
        key: "medication_error_rate",
        name: "Medication error rate",
        definition:
          "Reported medication errors (including near-misses where tracked) per " +
          "1,000 doses dispensed or administered.",
        unit: "per 1,000 doses",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 0.5,
          high: 5,
          basis:
            "Highly dependent on reporting culture; lower can signal under-reporting, not safety",
          label: "planning-range",
        },
        dataSource:
          "Safety event reporting system + barcode med administration (BCMA) records",
        whyItMatters:
          "Medication safety is the clinical and reputational floor; a low rate " +
          "with weak reporting culture is a red flag, not a win.",
      },
      {
        key: "dispensing_turnaround_time",
        name: "Dispensing turnaround time",
        definition:
          "Median elapsed time from verified order to medication available for " +
          "administration (inpatient) or ready for pickup (outpatient).",
        unit: "minutes",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 20,
          high: 60,
          basis: "Inpatient first-dose targets; STAT and outpatient differ",
          label: "planning-range",
        },
        dataSource:
          "Order-verify-to-dispense timestamps (Willow / automated dispensing cabinets)",
        whyItMatters:
          "Turnaround drives nursing satisfaction, length-of-stay edges, and " +
          "outpatient abandonment; it is the operational service level of pharmacy.",
      },
      {
        key: "generic_dispensing_rate",
        name: "Generic dispensing rate (GDR)",
        definition:
          "Share of eligible dispenses filled with a generic (or biosimilar, " +
          "where tracked together) rather than the brand reference product.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 85,
          high: 95,
          basis: "Mature outpatient operations; specialty/biosimilar adoption lags",
          label: "planning-range",
        },
        dataSource: "Dispense records by NDC vs available generic/biosimilar",
        whyItMatters:
          "The simplest, highest-confidence cost lever in non-specialty spend; " +
          "the remaining gap is increasingly biosimilar adoption in specialty.",
      },
      {
        key: "drug_prior_auth_turnaround",
        name: "Prior-authorization turnaround (drugs)",
        definition:
          "Median time from identification of a drug requiring prior auth to a " +
          "payer decision (approval/denial), across specialty and non-specialty.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 24,
          high: 96,
          basis: "Payer-dependent; specialty PAs and appeals run longer",
          label: "planning-range",
        },
        dataSource:
          "PA workqueue timestamps (specialty pharmacy / benefits investigation tooling)",
        whyItMatters:
          "Drug PA delay is the leading cause of therapy abandonment and delayed " +
          "starts in specialty — directly costing capture, adherence, and outcomes.",
      },
      {
        key: "inventory_carrying_cost",
        name: "Pharmacy inventory carrying cost",
        definition:
          "Cost of holding drug inventory (capital, expiry/waste, storage) as a " +
          "share of annual drug purchases.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 2,
          high: 6,
          basis: "Operator ranges; specialty/cold-chain and 340B carve-outs widen it",
          label: "planning-range",
        },
        dataSource:
          "Inventory valuation, expiry/waste write-offs vs purchases (pharmacy inventory system)",
        whyItMatters:
          "High-cost specialty units and 340B inventory segregation make carrying " +
          "cost and expiry waste materially larger than legacy formularies suggest.",
      },
      {
        key: "pharmacy_margin",
        name: "Pharmacy contribution margin",
        definition:
          "Net pharmacy revenue (dispensing + specialty + 340B savings) less " +
          "drug acquisition and direct operating cost, as a share of pharmacy " +
          "revenue.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 5,
          high: 25,
          basis:
            "Highly sensitive to 340B status, specialty mix, and PBM reimbursement (incl. DIR)",
          label: "planning-range",
        },
        dataSource:
          "Pharmacy revenue (claims/reimbursement) less acquisition + direct cost (GL)",
        whyItMatters:
          "The bottom line of the pharmacy enterprise; for 340B providers it is " +
          "dominated by program capture and specialty reimbursement net of PBM " +
          "fees, not by dispensing volume.",
      },
      {
        key: "medication_adherence",
        name: "Medication adherence (PDC)",
        definition:
          "Proportion of days covered (PDC) for patients on chronic/specialty " +
          "therapy at or above the adherence threshold (commonly 80%).",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 90,
          basis: "Specialty disease-state programs; varies by therapeutic class",
          label: "planning-range",
        },
        dataSource:
          "Refill/fill history (specialty dispensing system) computed as PDC",
        whyItMatters:
          "Adherence drives clinical outcomes, specialty re-fill revenue, and " +
          "value-based/limited-distribution network eligibility — the clinical " +
          "ROI of an integrated specialty pharmacy.",
      },
    ],

    painThemes: [
      {
        key: "340b_compliance_exposure",
        name: "340B compliance & audit exposure",
        description:
          "340B eligibility (patient definition, eligible locations, contract " +
          "pharmacy arrangements), duplicate-discount avoidance, and accurate " +
          "split-billing are intricate and shifting; HRSA audits and " +
          "manufacturer contract-pharmacy restrictions can claw back or shut off " +
          "savings, threatening the margin engine.",
        detectionSignal:
          "No independent 340B audit trail, manual split-billing, growing " +
          "manufacturer contract-pharmacy restriction letters, unreconciled " +
          "accumulations, prior HRSA/manufacturer audit findings.",
        diagnosticQuestion:
          "How is 340B eligibility determined and documented per dispense, and " +
          "when was your last independent program audit?",
      },
      {
        key: "specialty_leakage",
        name: "Specialty prescription leakage",
        description:
          "Specialty scripts written by system providers get filled outside the " +
          "system — driven by PBM/payer mandates, limited-distribution drug " +
          "(LDD) network exclusion, and slow internal benefits investigation — " +
          "forfeiting margin, 340B capture, and clinical oversight.",
        detectionSignal:
          "Low specialty capture rate, high external-fill volume, slow benefits " +
          "investigation, missing LDD network access, PA delays.",
        diagnosticQuestion:
          "What share of your providers' specialty scripts do you actually fill, " +
          "and where does the rest go and why?",
      },
      {
        key: "specialty_cost_curve",
        name: "Unmanaged specialty cost curve",
        description:
          "Specialty spend grows double-digits with new launches and gene/cell " +
          "therapies while biosimilar adoption, site-of-care optimization, and " +
          "formulary preference lag, so the cost curve outruns interventions.",
        detectionSignal:
          "Specialty spend growth outpacing volume, low biosimilar conversion, " +
          "high hospital-outpatient infusion vs lower-cost sites, brand use where " +
          "biosimilars exist.",
        diagnosticQuestion:
          "What is driving your specialty spend growth, and what is your " +
          "biosimilar conversion and site-of-care mix?",
      },
      {
        key: "drug_prior_auth_bottleneck",
        name: "Drug prior-authorization bottleneck",
        description:
          "Manual, payer-by-payer drug PA and benefits investigation delay " +
          "therapy starts, drive abandonment, and consume pharmacy/technician " +
          "time — most acutely in specialty where PAs and appeals are routine.",
        detectionSignal:
          "Long PA turnaround, high time-to-fill on specialty starts, large PA " +
          "workqueues, abandonment at the PA step, technician overtime.",
        diagnosticQuestion:
          "What is your drug PA turnaround and abandonment rate, and how much " +
          "staff time is spent on benefits investigation and appeals?",
      },
      {
        key: "medication_safety_gaps",
        name: "Medication safety & reporting-culture gaps",
        description:
          "High-alert medications, sterile compounding, and order verification " +
          "carry patient-harm risk; weak near-miss reporting masks the true " +
          "error picture so a low reported rate can hide systemic exposure.",
        detectionSignal:
          "Low near-miss reporting, BCMA scan-rate gaps, override-heavy " +
          "automated dispensing cabinets, recurring high-alert events, USP " +
          "<797>/<800> compounding gaps.",
        diagnosticQuestion:
          "What is your near-miss reporting rate and BCMA scan compliance, and " +
          "how are high-alert and compounded medications controlled?",
      },
      {
        key: "pbm_reimbursement_pressure",
        name: "PBM reimbursement & DIR-fee pressure",
        description:
          "Outpatient and specialty reimbursement is squeezed by PBM contract " +
          "terms, retroactive DIR-style fees, and narrow networks, eroding " +
          "pharmacy margin even as dispensing volume holds or grows.",
        detectionSignal:
          "Falling reimbursement per script, large retroactive fee adjustments, " +
          "below-acquisition reimbursement on some claims, network exclusions.",
        diagnosticQuestion:
          "How is your per-script reimbursement trending net of all PBM fees, " +
          "and which contracts carry retroactive or below-cost terms?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "340b_eligibility_capture",
        name: "AI-assisted 340B eligibility & capture optimization",
        valueMechanism:
          "Continuously evaluate each dispense against 340B eligibility rules, " +
          "flag missed captures and duplicate-discount risk, and reconcile " +
          "accumulations — increasing compliant savings captured while shrinking " +
          "audit exposure.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Dispense + encounter data with patient/location eligibility context",
          "Wholesaler 340B accumulations and split-billing records",
          "Current HRSA program rules and manufacturer restriction lists",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Eligibility determinations are a compliance act — every flag must be auditable",
          "Bias toward over-capture is a direct audit liability; conservative defaults required",
        ],
        metricsMoved: ["savings_340b_captured", "pharmacy_margin"],
      },
      {
        key: "specialty_capture_orchestration",
        name: "Specialty capture & benefits-investigation orchestration",
        valueMechanism:
          "Detect specialty scripts at point of order, auto-run benefits " +
          "investigation and PA initiation, and route eligible fills to the " +
          "internal specialty pharmacy before they leak — lifting capture and " +
          "speeding therapy starts.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Specialty Rx orders from the EHR",
          "Payer benefit, formulary, and LDD network rules",
          "PA requirements by drug and plan",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Must respect payer mandates and LDD restrictions — cannot route where access is barred",
          "Patient choice of pharmacy must be preserved",
        ],
        metricsMoved: [
          "specialty_rx_capture_rate",
          "drug_prior_auth_turnaround",
          "pharmacy_margin",
        ],
      },
      {
        key: "ai_drug_prior_auth",
        name: "AI-assisted drug prior authorization",
        valueMechanism:
          "Predict PA requirement, assemble the clinical packet from the record, " +
          "submit and follow up across payers — cutting turnaround and " +
          "abandonment for specialty and non-specialty starts.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "Payer PA requirement rules by drug/plan",
          "Clinical documentation and diagnosis/lab evidence",
          "Payer portal / ePA (NCPDP SCRIPT) connectivity",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Medical-necessity assertions must be clinician-attested, not model-fabricated",
          "Portal automation must respect payer terms and rate limits",
        ],
        metricsMoved: [
          "drug_prior_auth_turnaround",
          "specialty_rx_capture_rate",
          "medication_adherence",
        ],
      },
      {
        key: "specialty_spend_management",
        name: "Specialty spend & biosimilar / site-of-care optimization",
        valueMechanism:
          "Surface biosimilar conversion opportunities, formulary-preference " +
          "leakage, and lower-cost site-of-care shifts on high-cost specialty " +
          "therapies — bending the specialty cost curve.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Purchasing detail by specialty NDC and therapeutic class",
          "Biosimilar availability and formulary preference rules",
          "Site-of-care and reimbursement data",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Switch recommendations must respect clinical appropriateness and P&T decisions",
          "Site-of-care shifts must not compromise patient access or safety",
        ],
        metricsMoved: [
          "specialty_drug_spend",
          "generic_dispensing_rate",
          "formulary_compliance_rate",
        ],
      },
      {
        key: "med_safety_surveillance",
        name: "Medication-safety surveillance & error prevention",
        valueMechanism:
          "Screen orders and dispenses for high-alert interactions, dosing " +
          "anomalies, and near-miss patterns, and flag override and scan-gap " +
          "trends — preventing harm and strengthening the safety signal.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Orders, dispenses, and BCMA administration records",
          "High-alert drug rules and dosing references",
          "Safety event / near-miss reports",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Alert fatigue must be managed — over-alerting degrades safety",
          "A pharmacist remains accountable for every clinical intervention",
        ],
        metricsMoved: ["medication_error_rate", "dispensing_turnaround_time"],
      },
      {
        key: "adherence_outreach",
        name: "Specialty adherence prediction & proactive outreach",
        valueMechanism:
          "Predict non-adherence and gaps in care on specialty therapy and " +
          "trigger pharmacist outreach and refill coordination — improving PDC, " +
          "outcomes, and refill capture.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Specialty fill/refill history and PDC",
          "Disease-state and clinical context",
          "Prior outreach response signals",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "Outreach must comply with patient-communication consent rules",
          "Clinical interventions remain pharmacist-led",
        ],
        metricsMoved: ["medication_adherence", "specialty_rx_capture_rate"],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "340b_integrity_platform",
        name: "340B program integrity platform",
        description:
          "An independent split-billing/TPA and audit layer that determines " +
          "eligibility per dispense, prevents duplicate discounts, reconciles " +
          "accumulations, and maintains an audit-ready trail across owned and " +
          "contract pharmacies.",
        boundary:
          "Owns 340B eligibility determination, capture, and audit evidence; " +
          "does not set the drug formulary or negotiate manufacturer pricing.",
        humanAccountabilityPoint: "340B Program Director / Compliance Officer",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "integrated_specialty_pharmacy",
        name: "Integrated specialty pharmacy with capture orchestration",
        description:
          "An owned specialty pharmacy with embedded benefits investigation, PA " +
          "automation, LDD network access, and adherence management that captures " +
          "system-written specialty scripts end to end.",
        boundary:
          "Owns internal specialty fill, PA, and adherence; does not override " +
          "payer mandates or limited-distribution restrictions.",
        humanAccountabilityPoint: "Director of Specialty Pharmacy",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
      {
        key: "formulary_value_engine",
        name: "Formulary & specialty value-management engine",
        description:
          "A P&T-governed engine that enforces formulary preference, drives " +
          "biosimilar/therapeutic interchange, and targets site-of-care shifts " +
          "to realize negotiated and clinical-equivalent savings.",
        boundary:
          "Owns formulary preference enforcement and savings tracking; does not " +
          "make patient-specific clinical substitution decisions — those route " +
          "to the prescriber/pharmacist.",
        humanAccountabilityPoint: "Pharmacy & Therapeutics (P&T) Committee Chair",
        controlPosture: "human-on-the-loop",
        dispositionKind: "option",
      },
      {
        key: "med_safety_control_layer",
        name: "Medication-safety surveillance control layer",
        description:
          "A surveillance layer over orders, dispensing automation, and BCMA " +
          "that screens for high-alert risk, monitors override and scan gaps, " +
          "and feeds near-miss learning back into practice.",
        boundary:
          "Owns safety screening and signal generation; does not replace the " +
          "pharmacist's clinical verification or override authority.",
        humanAccountabilityPoint:
          "Director of Pharmacy / Medication Safety Officer",
        controlPosture: "human-approval-required",
        dispositionKind: "foundation",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Pharmacy value is dominated by two levers and supported by a third. " +
        "First, 340B program integrity protects and expands the savings engine " +
        "that underwrites the enterprise — the highest-value, highest-risk " +
        "lever. Second, specialty capture and specialty-spend management win or " +
        "lose the cost-and-margin curve, because specialty is the majority of " +
        "dollars and nearly all growth. Third, dispensing efficiency, formulary " +
        "discipline, and medication safety are the operational and clinical " +
        "floor — necessary, measurable, but smaller in dollar terms. Durable " +
        "value comes from defending 340B and bending specialty, not from " +
        "squeezing dispensing throughput.",
      dominantHaircutFactors: [
        {
          factor: "340B regulatory & manufacturer-restriction risk",
          rationale:
            "Contract-pharmacy restrictions, HRSA rule changes, and audit " +
            "findings can claw back or shut off savings, so projected 340B " +
            "value must be discounted for policy and manufacturer response.",
          typicalHaircut: {
            low: 0.15,
            high: 0.4,
            basis:
              "Observed erosion from contract-pharmacy restrictions and audit recoupments",
            label: "planning-range",
          },
        },
        {
          factor: "Payer mandates & limited-distribution access",
          rationale:
            "PBM/payer pharmacy mandates and LDD exclusions cap how much " +
            "specialty capture is actually achievable regardless of execution.",
          typicalHaircut: {
            low: 0.2,
            high: 0.45,
            basis:
              "Capture ceilings imposed by payer steering and LDD network exclusion",
            label: "planning-range",
          },
        },
        {
          factor: "Adoption & workflow change (clinicians, technicians)",
          rationale:
            "Capture, PA automation, and formulary preference require " +
            "prescriber, pharmacist, and technician workflow change; partial " +
            "adoption leaves benefit unrealized.",
          typicalHaircut: {
            low: 0.1,
            high: 0.25,
            basis: "Pharmacy change-management experience",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "Specialty capture-rate lift",
          range: {
            low: 0.1,
            high: 0.3,
            basis:
              "Reported capture gains from integrated specialty + orchestration programs",
            label: "planning-range",
          },
          measuredAs: "Absolute increase in specialty_rx_capture_rate (pp)",
        },
        {
          lever: "Specialty spend avoidance (biosimilar + site of care)",
          range: {
            low: 0.03,
            high: 0.1,
            basis:
              "Spend reduction from biosimilar conversion and site-of-care optimization",
            label: "planning-range",
          },
          measuredAs: "Relative reduction in specialty_drug_spend",
        },
        {
          lever: "340B savings capture improvement",
          range: {
            low: 0.05,
            high: 0.2,
            basis:
              "Incremental compliant capture from independent integrity tooling",
            label: "planning-range",
          },
          measuredAs: "Relative increase in savings_340b_captured",
        },
      ],
      timeToValueBand:
        "340B integrity and capture: 2-3 quarters (tooling + audit reconciliation). " +
        "Specialty capture orchestration: 2-4 quarters. Specialty spend/biosimilar " +
        "management: 1-3 quarters once formulary preference is set. PA automation " +
        "and adherence: 2-3 quarters including workflow ramp.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Pharmacy information system (inpatient + ambulatory)",
          role: "System of record for orders, verification, dispensing, and the formulary.",
          examples: ["Epic Willow Inpatient", "Epic Willow Ambulatory"],
        },
        {
          name: "Specialty pharmacy dispensing & management",
          role: "Manages specialty fills, benefits investigation, PA, and adherence.",
          examples: [
            "Epic Willow specialty workflows",
            "Standalone specialty dispensing platforms",
          ],
        },
        {
          name: "340B split-billing / TPA",
          role: "Determines 340B eligibility, splits inventory, and reconciles accumulations.",
          examples: [
            "Split-billing engines / third-party administrators (TPA)",
            "Contract-pharmacy claim-capture tools",
          ],
        },
        {
          name: "Automated dispensing & inventory automation",
          role: "Cabinet dispensing, carousel/robotics, BCMA, and inventory control.",
          examples: [
            "Automated dispensing cabinets (ADC)",
            "Barcode medication administration (BCMA)",
          ],
        },
        {
          name: "Wholesaler / GPO purchasing",
          role: "Drug acquisition, pricing tiers (WAC/GPO/340B), and accumulations.",
          examples: ["Wholesaler ordering portals", "GPO contract catalogs"],
        },
      ],
      roles: [
        {
          title: "Chief Pharmacy Officer / VP Pharmacy",
          accountability:
            "End-to-end pharmacy enterprise economics, safety, and compliance.",
        },
        {
          title: "340B Program Director",
          accountability:
            "340B eligibility, capture, duplicate-discount avoidance, and audit readiness.",
        },
        {
          title: "Director of Specialty Pharmacy",
          accountability:
            "Specialty capture, PA, adherence, and limited-distribution access.",
        },
        {
          title: "Pharmacy & Therapeutics (P&T) Committee Chair",
          accountability:
            "Formulary decisions, therapeutic interchange, and biosimilar policy.",
        },
        {
          title: "Medication Safety Officer",
          accountability:
            "High-alert medication control, sterile compounding, and error prevention.",
        },
      ],
      regulatoryFrames: [
        {
          name: "340B Drug Pricing Program (HRSA)",
          relevance:
            "Governs eligibility, contract pharmacy, duplicate-discount avoidance, and audit — the dominant regulatory exposure.",
        },
        {
          name: "USP <797> / <800>",
          relevance:
            "Sterile and hazardous-drug compounding standards governing safety and facility controls.",
        },
        {
          name: "DEA / controlled-substance regulations",
          relevance:
            "Governs ordering, storage, dispensing, and diversion controls for controlled substances.",
        },
        {
          name: "HIPAA / HITECH",
          relevance:
            "Governs PHI across pharmacy systems and AI processing of medication and patient data.",
        },
      ],
      canonicalTerms: [
        {
          term: "340B ceiling price",
          definition:
            "The maximum statutory price a covered entity pays for a 340B-eligible drug; the spread vs WAC/GPO is the program's savings.",
        },
        {
          term: "Split-billing",
          definition:
            "Process that classifies each dispense as 340B-eligible or not and allocates inventory/accumulations accordingly.",
        },
        {
          term: "Duplicate discount",
          definition:
            "Prohibited combination of a 340B discount and a Medicaid rebate on the same drug — a core compliance risk.",
        },
        {
          term: "Limited-distribution drug (LDD)",
          definition:
            "A specialty drug a manufacturer restricts to a narrow pharmacy network, constraining where it can be filled.",
        },
        {
          term: "PDC",
          definition:
            "Proportion of Days Covered — the standard adherence measure (covered days over the period), typically thresholded at 80%.",
        },
        {
          term: "DIR fees",
          definition:
            "Direct and Indirect Remuneration — retroactive PBM fees that reduce realized pharmacy reimbursement after the point of sale.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "340B savings captured",
        authoritativeSource:
          "Split-billing/TPA capture reports reconciled to wholesaler 340B accumulations",
        whatGoodEvidenceLooksLike:
          "Captured units and savings by eligible/ineligible classification, reconciled to accumulations, with an audit trail per dispense.",
        weakEvidenceToReject:
          "A single program-level savings figure with no eligibility or reconciliation detail.",
      },
      {
        claim: "Specialty Rx capture rate",
        authoritativeSource:
          "Specialty scripts written (EHR) vs filled internally (dispensing system)",
        whatGoodEvidenceLooksLike:
          "Written-vs-filled by drug and payer, with external-fill reasons (mandate/LDD/PA delay) categorized.",
        weakEvidenceToReject:
          "Internal fill counts with no written-script denominator or leakage reasons.",
      },
      {
        claim: "Specialty drug spend and growth drivers",
        authoritativeSource:
          "Purchasing detail flagged by specialty NDC / therapeutic class",
        whatGoodEvidenceLooksLike:
          "Spend by class with biosimilar availability, conversion, and site-of-care mix over a trailing period.",
        weakEvidenceToReject:
          "A total specialty spend number with no class, biosimilar, or site-of-care breakdown.",
      },
      {
        claim: "Drug prior-authorization turnaround",
        authoritativeSource:
          "PA workqueue timestamps from the specialty/benefits-investigation system",
        whatGoodEvidenceLooksLike:
          "Median PA decision time by payer and drug with abandonment at the PA step quantified.",
        weakEvidenceToReject:
          "A staff-estimated average turnaround with no per-payer or abandonment data.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "Are you a 340B covered entity, and how is per-dispense eligibility determined, documented, and audited?",
      "What is your specialty Rx capture rate, and where do the un-captured scripts go and why (payer mandate, LDD, PA delay)?",
      "What is driving specialty spend growth, and what are your biosimilar conversion and site-of-care mix?",
      "What is your drug prior-auth turnaround and therapy-abandonment rate at the PA step?",
      "How is pharmacy contribution margin trending net of all PBM fees including retroactive DIR-style adjustments?",
      "What is your near-miss reporting rate and BCMA scan compliance, and how are high-alert and compounded medications controlled?",
      "What is your formulary compliance and generic/biosimilar dispensing rate, and where does non-formulary use concentrate?",
    ],
    maturitySignals: [
      "340B eligibility is determined per dispense with an independent audit trail and reconciled accumulations.",
      "Specialty capture is measured written-vs-filled with categorized leakage reasons, not just internal fill counts.",
      "Specialty spend is managed by class with active biosimilar conversion and site-of-care optimization.",
      "Medication-safety reporting culture is strong (near-misses captured) and BCMA scan rates are high.",
    ],
    redFlags: [
      "No independent 340B audit trail or reconciliation — savings are reported but not defensible.",
      "Specialty capture is unknown or measured only as internal fill volume with no leakage analysis.",
      "A very low reported medication-error rate paired with weak near-miss reporting (masked exposure).",
      "Pharmacy margin reported gross of PBM/DIR fees, hiding true reimbursement erosion.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "EHR-native pharmacy (Epic Willow)",
        category: "Core pharmacy information system",
        switchingCost:
          "Extreme — fused to the clinical record and order entry; replacement is a multi-year platform decision.",
        renewalDynamics:
          "Bundled with the enterprise EHR agreement; rarely sourced standalone.",
      },
      {
        vendorName: "340B split-billing / TPA vendors",
        category: "340B program integrity & contract-pharmacy capture",
        switchingCost:
          "Moderate — integrates via dispense/accumulation feeds; replaceable with mapping effort and audit-trail migration.",
        renewalDynamics:
          "Often percentage-of-savings pricing; scrutinize as captured savings grow and after audit findings.",
      },
      {
        vendorName: "Specialty pharmacy & adherence platforms",
        category: "Specialty dispensing / benefits investigation / adherence",
        switchingCost:
          "Moderate-high — workflow- and accreditation-embedded; LDD network access and data migration raise the bar.",
        renewalDynamics:
          "Tied to accreditation and LDD network status; favor outcome and data-portability terms.",
      },
      {
        vendorName: "AI PA / specialty-spend / safety-surveillance vendors",
        category: "Drug PA automation, specialty analytics, med-safety AI",
        switchingCost:
          "Moderate — embedded but swappable; watch model lock-in and audit/explainability access.",
        renewalDynamics:
          "Emerging, fast-moving pricing; favor outcome-based terms and exit rights.",
      },
    ],
    switchingCosts:
      "The pharmacy core (Epic Willow) is effectively non-switchable in isolation; the value and negotiation frontier is the 340B integrity, specialty, and AI layer around it, where switching cost is moderate and terms are negotiable.",
    negotiationLevers: [
      "Outcome/contingency pricing tied to measured capture lift or compliant 340B savings",
      "Audit, explainability, and data-portability access as contractual requirements",
      "Exit rights and accreditation continuity to avoid specialty/network lock-in",
      "Pilot-to-scale gating with parity proof before enterprise commitment",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      "340b_claim": [
        "split-billing/TPA capture detail",
        "wholesaler accumulation reconciliation",
        "per-dispense eligibility audit trail",
      ],
      specialty_capture_claim: [
        "written specialty scripts (EHR)",
        "internal fill records",
        "categorized leakage reasons",
      ],
      spend_metric: [
        "purchasing detail by NDC/class",
        "biosimilar/site-of-care breakdown",
      ],
      pa_metric: ["PA workqueue timestamps", "abandonment-at-PA basis"],
      margin_metric: ["reimbursement net of PBM/DIR fees", "acquisition + direct cost"],
      value_projection: [
        "baseline metric",
        "benchmark planning-range",
        "explicit haircut factors",
      ],
    },
    citationStandard:
      "Quantitative pharmacy claims cite the dispensing/purchasing/PA/capture " +
      "source and the period. 340B claims additionally cite the eligibility and " +
      "reconciliation evidence. Value projections cite a baseline plus a labelled " +
      "planning range and the haircut factors applied — never a single asserted " +
      "ROI or savings number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant's 340B status or capture data is unknown — frame 340B value as an industry pattern, not their number, and flag program/manufacturer risk.",
      "Specialty capture ceilings (payer mandates, LDD) are not yet mapped — present capture lift as a range bounded by access.",
      "Benchmarks are quoted without the tenant's own baseline — present as planning ranges.",
      "Vendor-reported savings or capture outcomes are cited — mark as vendor claims pending validation.",
    ],
    inferenceLanguage: [
      "Across provider pharmacies, specialty is typically the majority of spend...",
      "Without your split-billing data, the 340B pattern at comparable entities suggests...",
      "Peer systems at this scale commonly capture specialty in the range of...",
    ],
    flagWithoutEvidence: [
      "A specific 340B savings or recovery figure for this tenant",
      "This tenant's actual specialty capture rate or specialty spend",
      "A claim that this tenant has a 340B compliance violation",
    ],
  },

  outputRecipes: [
    {
      questionPattern: "drug spend composition / spend by class or specialty vs non-specialty",
      exhibitKind: "chart",
      chartKind: "cost-stack",
      chartBuilder: "costStack",
      note: "Stack drug spend by therapeutic class or specialty/non-specialty to show where dollars concentrate.",
    },
    {
      questionPattern: "specialty spend trend / drug spend over time",
      exhibitKind: "chart",
      chartKind: "line",
      note: "Trend specialty (and total) drug spend over periods to show whether the cost curve is bending.",
    },
    {
      questionPattern: "value of specialty capture or 340B improvement / value bridge",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current capture/savings to achievable value with access and regulatory haircuts.",
    },
    {
      questionPattern: "specialty capture leakage / written-vs-filled by reason",
      exhibitKind: "table",
      note: "Written vs internally filled by drug/payer with leakage reasons (mandate, LDD, PA delay).",
    },
    {
      questionPattern: "pharmacy KPI scorecard",
      exhibitKind: "table",
      note: "340B savings, specialty capture, drug spend %, formulary compliance, GDR, PA turnaround, margin vs planning ranges.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "340B program integrity is treated as a defended asset with independent audit trail, not a spreadsheet",
      "Specialty capture is orchestrated at point of order with automated benefits investigation and PA",
      "P&T actively drives biosimilar conversion and site-of-care optimization on specialty",
      "Pharmacist and technician workflows are redesigned to absorb automation, not bypass it",
    ],
    failureDrivers: [
      "340B value assumed stable while manufacturer restrictions and audit risk erode it",
      "Specialty capture targeted without mapping payer mandates and LDD ceilings (chasing unreachable scripts)",
      "Specialty cost curve left to grow while biosimilar/site-of-care levers go unused",
      "Reporting medication safety on a low error rate built on weak near-miss capture",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Pharmacy operations and 340B/specialty teams adopt readily where economics " +
      "are measurable; PA and capture automation land first in specialty, then " +
      "outpatient, then inpatient safety surveillance once alert fatigue is managed. " +
      "Prescriber-facing formulary changes take longest because they cross into " +
      "clinical workflow.",
    roiClarity: "medium",
    roiClarityBasis:
      "Specialty capture, 340B savings, and spend levers are directly measurable " +
      "in capture/purchasing data, so the prize is sizable and visible — but ROI " +
      "is haircut by exogenous payer mandates, LDD access, and 340B " +
      "policy/manufacturer response that the provider does not control, which is " +
      "why clarity is medium rather than high.",
  },

  regulatoryFrame: {
    name: "340B Drug Pricing Program (HRSA)",
    relevance:
      "The dominant regulatory frame for provider pharmacy: governs covered-" +
      "entity eligibility, contract-pharmacy arrangements, duplicate-discount " +
      "avoidance, and HRSA/manufacturer audits. It is simultaneously the margin " +
      "engine and the top compliance exposure. USP <797>/<800>, DEA controlled-" +
      "substance rules, and HIPAA/HITECH also apply (see vocabulary.regulatoryFrames).",
  },

  provenance: {
    authoredBy: "claude-subagent (wave4)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-20",
  },
};
