// Consilium expert — Data Privacy & Protection (cross-cutting, regulatory data-rights).
//
// W3 backlog-wave draft (docs/build/SHARED_CONTEXT_BRAIN_MASTER_PLAN.md). A
// horizontal, cross-cutting ExpertPack v2 with no industry×function key. It owns
// the privacy/regulatory data-rights program every enterprise now runs: the
// privacy program and policy framework (GDPR / CCPA-CPRA / the US state-law
// patchwork), data subject access rights (DSAR), consent & preference
// management, data mapping / Records of Processing (RoPA), privacy-by-design,
// data residency / sovereignty and cross-border transfer, retention &
// minimization, PII discovery & classification, breach response, and
// vendor/processor (DPA) management.
//
// DISTINCT FROM cybersecurity (threat detection / defense of the estate) and
// from ai-governance (model risk, validation, drift). This expert is about the
// RIGHTS individuals hold over their personal data and the obligations that
// creates — a regulatory/legal-operations discipline, not a security or
// model-risk one. It references those adjacent experts (a breach is also a
// security incident; AI training data reopens privacy questions) but owns the
// privacy-program lens.
//
// CORE DOCTRINE — "COMPLIANT ON PAPER" IS THE LIE; PROVABLE DATA MAPS ARE THE
// TRUTH. The honest framing this expert insists on: (1) DSAR and consent AT
// SCALE are the operational pain — manual, SLA-bound, and fragmented across
// dozens of systems no single team fully maps. (2) "We're GDPR compliant"
// almost always means policy-on-paper, not a provable, current data map; the
// gap between the privacy NOTICE and the actual data FLOWS is where liability
// lives. (3) PII discovery is NEVER complete — shadow data, backups, logs, and
// SaaS copies mean coverage is asymptotic, and any "100% discovered" claim is a
// red flag. (4) Retention / minimization is the most-ignored and
// highest-liability gap: data kept past purpose is pure downside risk in a
// breach, with no offsetting benefit. (5) AI training data and LLM ingestion
// just REOPENED consent and purpose-limitation questions everyone thought were
// settled — personal data scraped or repurposed into a model is a fresh lawful-
// basis problem. And (6) privacy ROI is RISK-AVOIDANCE, not hard dollars — fines
// and breach cost avoided, plus trust preserved and consent-driven addressable
// reach — so the value case is honestly framed as probabilistic, and roiClarity
// is not "high".

import type { ExpertPack } from "@/lib/intelligence/expert-pack/expert-pack";

export const dataPrivacyProtectionExpert: ExpertPack = {
  packVersion: "expert-pack/v2",

  identity: {
    id: "xp.x.data-privacy-protection",
    expertName: "Data Privacy & Protection Expert",
    kind: "cross-cutting-domain",
    crossCuttingDomain: "data-privacy-protection",
    scopeNote:
      "Cross-cutting privacy & regulatory data-rights program spanning every " +
      "industry: the privacy program and policy framework (GDPR, CCPA/CPRA and " +
      "the US state-law patchwork, sector rules where personal data is in " +
      "scope); data subject access rights (DSAR) intake, fulfillment, and SLA; " +
      "consent & preference management and opt-out honoring; data mapping and " +
      "Records of Processing (RoPA); privacy-by-design and DPIA/PIA; data " +
      "residency / sovereignty and cross-border transfer mechanisms (SCCs, " +
      "adequacy, transfer impact); retention & data minimization; PII discovery " +
      "& classification (including shadow data); breach detection-to-notify; and " +
      "vendor / processor (DPA) management. Doctrine: 'compliant on paper' is the " +
      "lie and a provable, current data map is the truth — DSAR and consent at " +
      "scale are the operational pain, PII discovery is never complete, retention " +
      "is the most-ignored high-liability gap, AI training data reopened consent " +
      "and purpose limitation, and privacy ROI is probabilistic risk-avoidance. " +
      "Excludes cybersecurity threat/defense (separate expert; a breach is also a " +
      "security incident it owns the response telemetry for) and AI model risk / " +
      "validation / drift (AI-governance expert) — though it owns the personal-" +
      "data, lawful-basis, and consent layer that AI governance binds to.",
  },

  domain: {
    operatingMetrics: [
      {
        key: "dsar_cycle_time",
        name: "DSAR cycle time (intake to fulfillment)",
        definition:
          "Median elapsed calendar days from a verified data subject access / " +
          "deletion / correction request being received to the response being " +
          "delivered to the requester, across all in-scope source systems.",
        unit: "days",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 5,
          high: 45,
          basis:
            "Privacy-operations experience against statutory clocks (GDPR ~30 " +
            "days extendable, CCPA/CPRA ~45 days extendable); automated, " +
            "well-mapped programs clear in days, manual fragmented ones run the " +
            "full window or breach it",
          label: "planning-range",
        },
        dataSource:
          "Privacy-management / DSAR workflow platform request timestamps " +
          "(received → verified → fulfilled), joined to source-system collection logs",
        whyItMatters:
          "The headline operational-pain number. Cycle time is driven by how " +
          "fragmented personal data is across systems; long or breaching times " +
          "expose an unmapped estate and create direct regulatory and reputational risk.",
      },
      {
        key: "dsar_sla_attainment",
        name: "DSAR SLA attainment",
        definition:
          "Share of data subject requests fulfilled within the statutory / " +
          "policy deadline for their applicable regime (and request type), of " +
          "all requests due in the period.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 70,
          high: 99,
          basis:
            "Privacy-program maturity ranges; mature automated programs approach " +
            "near-full on-time attainment, manual programs miss the long-tail " +
            "requests that require many-system collection",
          label: "planning-range",
        },
        dataSource:
          "DSAR workflow platform deadline vs fulfillment timestamps by regime " +
          "and request type",
        whyItMatters:
          "A missed statutory deadline is a per-request compliance failure and a " +
          "complaint trigger. SLA attainment is the directly regulator-visible " +
          "measure of whether the privacy operation actually functions at scale.",
      },
      {
        key: "consent_optout_honor_rate",
        name: "Consent capture & opt-out honor rate",
        definition:
          "Share of users whose recorded consent / opt-out signal (including " +
          "Global Privacy Control and 'do-not-sell/share') is correctly honored " +
          "by every downstream system that processes them, vs leaks where a " +
          "suppressed user is still processed.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 80,
          high: 99,
          basis:
            "Consent-enforcement testing ranges; the gap from a captured signal " +
            "to actual downstream suppression across ad/marketing/analytics tags " +
            "is where leakage concentrates",
          label: "planning-range",
        },
        dataSource:
          "Consent / preference-management platform signal records reconciled " +
          "against downstream tag-manager, marketing, and data-pipeline suppression logs",
        whyItMatters:
          "Capturing consent is easy; ENFORCING it everywhere is hard. An honor-" +
          "rate gap means opted-out users are still tracked or sold — exactly the " +
          "'do-not-sell' and ePrivacy violation regulators and class actions target.",
      },
      {
        key: "systems_in_data_map_pct",
        name: "% systems in data map / RoPA",
        definition:
          "Share of in-scope systems, data stores, and SaaS applications that " +
          "process personal data and are documented in a current data map / " +
          "Records of Processing, of the true known-plus-discovered population.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 90,
          basis:
            "Data-mapping completeness ranges; manually-maintained RoPA captures " +
            "the obvious systems but lags SaaS sprawl and embedded processing, so " +
            "true coverage trails the documented count",
          label: "planning-range",
        },
        dataSource:
          "Data-mapping / RoPA inventory cross-checked against the application " +
          "inventory (CMDB / SaaS-management / discovery scans)",
        whyItMatters:
          "The provable-data-map number that separates real compliance from " +
          "policy-on-paper. Every system outside the map is processing personal " +
          "data with no recorded lawful basis, retention rule, or DSAR reachability.",
      },
      {
        key: "pii_discovery_coverage",
        name: "PII discovery & classification coverage",
        definition:
          "Estimated share of personal data across structured and unstructured " +
          "stores (databases, files, logs, backups, SaaS) that has been " +
          "discovered, classified by sensitivity, and linked to a system in the " +
          "data map — an estimate, never an asserted complete number.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 90,
          basis:
            "PII-discovery coverage ranges; discovery is asymptotic — shadow " +
            "data, backups, logs, and SaaS copies mean coverage approaches but " +
            "never reaches 100%, and 'fully discovered' is a red flag",
          label: "planning-range",
        },
        dataSource:
          "PII-discovery / data-classification platform scan coverage across " +
          "data stores, reconciled to the data map",
        whyItMatters:
          "You cannot protect, map, or fulfill DSARs against data you cannot " +
          "find. Discovery coverage is the foundational denominator — and its " +
          "incompleteness is the honest reason no privacy claim is ever absolute.",
      },
      {
        key: "records_past_retention_pct",
        name: "% records past retention (overdue deletion)",
        definition:
          "Share of personal-data records held beyond their defined retention " +
          "period (or held with no retention rule at all) that should have been " +
          "deleted or anonymized, of the classified personal-data population.",
        unit: "%",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 10,
          high: 60,
          basis:
            "Retention-hygiene ranges; minimization is the most-ignored control, " +
            "so over-retention is common and high — large shares of data are kept " +
            "past purpose with no defensible basis",
          label: "planning-range",
        },
        dataSource:
          "Retention schedule joined to data-store record ages from the " +
          "discovery / classification platform and source-system timestamps",
        whyItMatters:
          "The highest-liability, most-ignored gap. Every record kept past " +
          "purpose is pure downside — it expands the breach blast radius and the " +
          "DSAR scope with no offsetting benefit; minimization is the cheapest " +
          "real risk reduction available.",
      },
      {
        key: "cross_border_transfer_mechanism_pct",
        name: "% cross-border transfers with a valid mechanism",
        definition:
          "Share of identified personal-data flows that cross a regulated border " +
          "(e.g. EU→US) which are covered by a valid transfer mechanism (adequacy, " +
          "SCCs with a transfer impact assessment, BCRs) vs flows with no or a " +
          "lapsed mechanism.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Transfer-governance ranges; post-Schrems II programs that have " +
            "mapped flows and papered SCCs/TIAs approach full coverage, but " +
            "undiscovered flows and embedded SaaS sub-processors leave gaps",
          label: "planning-range",
        },
        dataSource:
          "Data map / RoPA transfer register joined to executed transfer " +
          "mechanisms (adequacy/SCC/BCR) and sub-processor transfer disclosures",
        whyItMatters:
          "Cross-border transfer is the legally most fragile area post-Schrems " +
          "II. An unmapped or unmechanism'd flow is an unlawful transfer; the " +
          "metric is only meaningful once flows are actually discovered, not assumed.",
      },
      {
        key: "pia_dpia_completion_rate",
        name: "Privacy-impact-assessment (PIA/DPIA) completion rate",
        definition:
          "Share of in-scope new or materially-changed processing activities " +
          "(high-risk, new data uses, new AI uses of personal data) that " +
          "completed a required PIA/DPIA before go-live, of those that triggered one.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 40,
          high: 95,
          basis:
            "Privacy-by-design adoption ranges; mature programs with an intake " +
            "gate approach full coverage of triggering activities, immature ones " +
            "assess reactively after launch or not at all",
          label: "planning-range",
        },
        dataSource:
          "Privacy-management platform PIA/DPIA workflow records joined to the " +
          "change / project intake and the AI use-case inventory",
        whyItMatters:
          "Privacy-by-design is cheapest before build. A low completion rate " +
          "means risky processing (including new AI uses of personal data) ships " +
          "without an assessed lawful basis or mitigation — the bolt-on-late trap.",
      },
      {
        key: "breach_time_to_notify",
        name: "Breach time-to-notify",
        definition:
          "Elapsed time from confirmation that a personal-data breach is " +
          "notifiable to the notification being issued to the supervisory " +
          "authority and (where required) affected individuals, against the " +
          "applicable deadline.",
        unit: "hours",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 24,
          high: 72,
          basis:
            "Breach-notification practice against statutory clocks (GDPR ~72h to " +
            "authority); rehearsed programs notify well inside the window, " +
            "unrehearsed ones consume it on scoping and legal review",
          label: "planning-range",
        },
        dataSource:
          "Incident-response / breach-management record timestamps " +
          "(confirmed-notifiable → notified) against the regime deadline",
        whyItMatters:
          "Late notification is itself a violation, independent of the breach. " +
          "Time-to-notify exposes whether breach scoping (which data, whose, " +
          "which regimes) is rehearsed — and that depends entirely on the data map.",
      },
      {
        key: "processor_dpa_coverage",
        name: "Vendor / processor DPA coverage",
        definition:
          "Share of third-party processors and sub-processors handling personal " +
          "data that are covered by a current, signed Data Processing Agreement " +
          "with the required clauses (purpose limits, security, sub-processor, " +
          "transfer, breach-notification) of all identified processors.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 50,
          high: 95,
          basis:
            "Vendor-privacy-governance ranges; programs with a procurement gate " +
            "approach full DPA coverage of known processors, but unmapped SaaS " +
            "and fourth-party sub-processors leave the long tail uncovered",
          label: "planning-range",
        },
        dataSource:
          "Vendor / TPRM and contract repository DPA records reconciled against " +
          "the processor inventory in the data map",
        whyItMatters:
          "Controllers are liable for their processors' handling. Uncovered " +
          "processors are unmanaged personal-data exposure and a DSAR/breach " +
          "reachability gap; sub-processor sprawl is where coverage quietly fails.",
      },
      {
        key: "cost_per_dsar",
        name: "Cost per DSAR",
        definition:
          "Fully-loaded average cost (labor across privacy, legal, IT, and " +
          "business; tooling; redaction) to intake, verify, collect, redact, and " +
          "fulfill one data subject request.",
        unit: "USD / request",
        directionOfGood: "lower",
        benchmarkRange: {
          low: 40,
          high: 1500,
          basis:
            "DSAR unit-cost experience; highly automated, well-mapped programs " +
            "approach low tens of dollars, while manual multi-system collection " +
            "with human redaction runs into the high hundreds-to-thousands",
          label: "planning-range",
        },
        dataSource:
          "Privacy-operations time tracking and tooling cost over fulfilled-" +
          "request volume from the DSAR workflow platform",
        whyItMatters:
          "The metric that makes the operational-pain case in dollars and the " +
          "automation ROI legible. A high cost-per-DSAR rising with request " +
          "volume is the burning platform; it falls only when the data map and " +
          "collection are automated.",
      },
      {
        key: "privacy_training_completion",
        name: "Privacy training completion rate",
        definition:
          "Share of in-scope workforce (and, where required, contractors) who " +
          "completed mandatory privacy / data-handling training within the policy " +
          "cycle, of those assigned.",
        unit: "%",
        directionOfGood: "higher",
        benchmarkRange: {
          low: 75,
          high: 99,
          basis:
            "Mandatory-training completion ranges; programs enforced through HR " +
            "approach near-full completion, but completion alone is a hygiene " +
            "floor, not evidence of behavior change",
          label: "planning-range",
        },
        dataSource:
          "Learning-management system completion records scoped to the " +
          "privacy-training assignment",
        whyItMatters:
          "Human handling errors (mis-sent data, wrong-recipient disclosure) are " +
          "a leading breach cause. Completion is a baseline accountability " +
          "control auditors check — necessary but, read alone, a weak proxy for " +
          "actual data-handling behavior.",
      },
    ],

    painThemes: [
      {
        key: "dsar_at_scale_fragmentation",
        name: "DSAR at scale across a fragmented estate",
        description:
          "Fulfilling access/deletion requests means finding one person's data " +
          "across dozens of systems no one fully maps, verifying identity, " +
          "collecting, redacting third-party data, and responding inside a " +
          "statutory clock — largely manual, SLA-bound, and ballooning in cost " +
          "as request volume rises. The single sharpest operational pain.",
        detectionSignal:
          "Long or breaching DSAR cycle times, low SLA attainment, high and " +
          "rising cost-per-DSAR, manual cross-system collection, no automated " +
          "data-subject-to-system map.",
        diagnosticQuestion:
          "When a deletion request arrives, how do you find every system holding " +
          "that person's data, how long does fulfillment take, and what does one " +
          "request cost you fully loaded?",
      },
      {
        key: "compliant_on_paper_no_data_map",
        name: "'Compliant on paper' with no provable data map",
        description:
          "The program has policies, a privacy notice, and signed attestations, " +
          "but no current, provable map of what personal data is actually held, " +
          "where, why, and under what lawful basis — so the notice describes " +
          "flows the organization cannot evidence, and the gap surfaces only " +
          "under a regulator's question or a breach.",
        detectionSignal:
          "A polished privacy notice but a stale or partial RoPA; low % of " +
          "systems in the data map; lawful basis asserted generically; inability " +
          "to produce data flows on demand.",
        diagnosticQuestion:
          "If a regulator asked for your Records of Processing tomorrow, what " +
          "share of systems actually holding personal data would it cover, and " +
          "when was it last reconciled against your real application estate?",
      },
      {
        key: "pii_discovery_never_complete",
        name: "Shadow data & never-complete PII discovery",
        description:
          "Personal data sprawls into unstructured stores, logs, backups, data " +
          "lakes, and SaaS copies faster than discovery captures it, so a " +
          "material share of PII is uninventoried — and any claim of complete " +
          "discovery is false. The asymptotic-coverage reality undermines every " +
          "downstream control built on the inventory.",
        detectionSignal:
          "Discovery coverage well below 100% with no shrinking trend; PII found " +
          "in logs/backups/free-text fields no one classified; a stated " +
          "'fully discovered' posture with no scan reconciliation.",
        diagnosticQuestion:
          "How do you discover personal data in unstructured stores, logs, and " +
          "backups — not just databases — and what is your honest estimate of the " +
          "share still undiscovered?",
      },
      {
        key: "retention_minimization_ignored",
        name: "Ignored retention & minimization (the liability sink)",
        description:
          "Data is kept indefinitely because deleting it is harder than keeping " +
          "it and no one owns minimization — so the estate accumulates personal " +
          "data past its purpose, expanding breach blast radius and DSAR scope " +
          "for zero benefit. The most-ignored control and the highest-liability " +
          "gap in most programs.",
        detectionSignal:
          "Large share of records past retention or with no retention rule; no " +
          "automated deletion; data kept 'just in case'; retention schedule " +
          "exists on paper but is not enforced in systems.",
        diagnosticQuestion:
          "What share of your personal data is past its retention period or has " +
          "no retention rule at all, and is deletion actually automated or just " +
          "documented as a policy?",
      },
      {
        key: "consent_enforcement_leakage",
        name: "Consent / preference enforcement leakage",
        description:
          "Consent and opt-out signals are captured at the front door but not " +
          "enforced consistently downstream — marketing tags, ad pixels, " +
          "analytics, and data pipelines keep processing suppressed users — so " +
          "'do-not-sell/share', GPC, and ePrivacy obligations are violated even " +
          "though the consent record looks clean.",
        detectionSignal:
          "Opt-out honor rate below target; opted-out users still receiving " +
          "marketing or appearing in ad audiences; GPC signals unhandled; no " +
          "downstream suppression reconciliation/testing.",
        diagnosticQuestion:
          "When a user opts out or sends a Global Privacy Control signal, can you " +
          "prove every downstream system — tags, ads, analytics, pipelines — " +
          "actually suppresses them, or only that you recorded the signal?",
      },
      {
        key: "ai_training_data_consent_reopened",
        name: "AI training data reopens consent & purpose limitation",
        description:
          "Personal data is scraped, repurposed, or ingested into model training " +
          "and RAG/LLM pipelines without a fresh lawful basis or purpose-" +
          "limitation check — reopening consent and secondary-use questions " +
          "everyone thought settled, and creating data that is hard to unwind " +
          "from a trained model when a deletion request arrives.",
        detectionSignal:
          "Training/RAG corpora with personal data and no documented lawful " +
          "basis; no purpose-limitation review on AI uses; DSAR deletion that " +
          "cannot reach data embedded in a model or vector store; no DPIA on AI use.",
        diagnosticQuestion:
          "What personal data flows into your AI training, fine-tuning, and " +
          "RAG/LLM pipelines, what is its lawful basis and purpose, and how would " +
          "you honor a deletion request against data already in a model?",
      },
      {
        key: "vendor_subprocessor_sprawl",
        name: "Vendor & sub-processor sprawl",
        description:
          "Personal data is shared with a long tail of processors and their " +
          "sub-processors (fourth parties) faster than DPAs and transfer " +
          "mechanisms are papered, so controller liability extends to handling " +
          "the organization neither maps nor controls — and a processor's breach " +
          "or unlawful transfer becomes the controller's problem.",
        detectionSignal:
          "DPA coverage below the processor count; unknown sub-processors; SaaS " +
          "procured without a privacy review; transfer mechanisms missing for " +
          "vendor flows; no flow-down of breach-notification obligations.",
        diagnosticQuestion:
          "How complete is your DPA coverage across processors AND their " +
          "sub-processors, and do you know which vendor flows cross a border " +
          "without a valid transfer mechanism?",
      },
    ],

    aiUseCaseArchetypes: [
      {
        key: "automated_dsar_fulfillment",
        name: "Automated DSAR discovery & fulfillment",
        valueMechanism:
          "Use the data map plus connectors to automatically locate a data " +
          "subject's records across systems, orchestrate verification, " +
          "collection, and redaction (including AI-assisted detection of " +
          "third-party data to redact), and assemble the response — collapsing " +
          "DSAR cycle time and cost-per-DSAR and making SLA attainment " +
          "achievable at scale, the core operational-pain relief.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A current data map / RoPA binding systems to personal-data categories",
          "Connectors / APIs to source systems for automated collection and deletion",
          "Identity-verification and a request-workflow system of record",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Automated deletion is irreversible and high-impact — destructive actions need confirmation and an audit trail",
          "AI redaction can miss third-party personal data or over-redact — sampled human QA on responses is required",
          "Automation only reaches mapped systems; unmapped/shadow data silently escapes fulfillment",
        ],
        metricsMoved: [
          "dsar_cycle_time",
          "dsar_sla_attainment",
          "cost_per_dsar",
        ],
      },
      {
        key: "pii_discovery_classification",
        name: "AI PII discovery & classification",
        valueMechanism:
          "Scan structured and unstructured stores, logs, and SaaS to detect, " +
          "classify, and link personal data to systems — using ML/NLP to find " +
          "PII in free text and documents that pattern rules miss — shrinking the " +
          "shadow-data gap so the data map, retention, and DSAR fulfillment " +
          "operate on the real estate rather than the documented minority.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Read access / scan connectors across databases, files, logs, lakes, and SaaS",
          "A classification taxonomy (PII categories, special-category data, sensitivity)",
          "The data map / RoPA as the reconciliation target",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Discovery is never complete — coverage must be reported as an estimate, never as 100%",
          "Scans touch sensitive data and must themselves respect access, residency, and minimization limits",
          "ML classification has false positives/negatives — high-stakes tiers need human confirmation",
        ],
        metricsMoved: [
          "pii_discovery_coverage",
          "systems_in_data_map_pct",
          "records_past_retention_pct",
        ],
      },
      {
        key: "consent_preference_orchestration",
        name: "Consent & preference orchestration with downstream enforcement",
        valueMechanism:
          "Capture consent / opt-out / GPC signals once and propagate and " +
          "ENFORCE them across every downstream system (tags, ads, analytics, " +
          "pipelines), reconciling that suppressed users are actually suppressed " +
          "— closing the consent-enforcement leak that turns a clean consent " +
          "record into a 'do-not-sell'/ePrivacy violation.",
        adoptionProfile: "mainstream",
        dataDependencies: [
          "A consent/preference system of record and a universal signal schema",
          "Integrations to tag managers, marketing/ad platforms, analytics, and data pipelines",
          "Downstream processing logs to reconcile suppression vs signal",
        ],
        controlPosture: "human-on-the-loop",
        controlRiskNotes: [
          "Propagation without reconciliation gives false assurance — suppression must be tested, not assumed",
          "Signal mapping errors (mis-scoped purposes) can over- or under-suppress legitimate processing",
        ],
        metricsMoved: [
          "consent_optout_honor_rate",
          "systems_in_data_map_pct",
        ],
      },
      {
        key: "automated_retention_minimization",
        name: "Automated retention enforcement & minimization",
        valueMechanism:
          "Bind retention rules to classified data and execute defensible, " +
          "logged deletion / anonymization when records pass purpose — turning a " +
          "paper retention schedule into enforced minimization that shrinks the " +
          "personal-data footprint, the breach blast radius, and DSAR scope, the " +
          "cheapest real risk reduction available.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "A retention schedule mapped to data categories and lawful basis/purpose",
          "Record-age and legal-hold status from source systems and the classification platform",
          "Deletion/anonymization connectors with verifiable, logged execution",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "Deletion is irreversible and must respect legal holds and litigation — automated purge needs a hold check and approval",
          "Over-deletion can destroy data with a live lawful basis — purpose and basis must gate every rule",
          "Anonymization that is reversible is not anonymization — re-identification risk must be assessed",
        ],
        metricsMoved: [
          "records_past_retention_pct",
          "pii_discovery_coverage",
        ],
      },
      {
        key: "ai_breach_scoping_assessment",
        name: "AI-assisted breach scoping & notification assessment",
        valueMechanism:
          "On a suspected breach, use the data map plus AI to rapidly scope " +
          "which personal data, whose, and under which regimes was affected, and " +
          "draft the regulator/individual notification — compressing breach " +
          "time-to-notify inside statutory clocks and making the 72-hour decision " +
          "evidence-based rather than a fire drill.",
        adoptionProfile: "experimenting",
        dataDependencies: [
          "A current data map linking affected systems to data subjects and regimes",
          "Incident detection feed and affected-asset scope from security operations",
          "Notification templates and the per-regime deadline / threshold rules",
        ],
        controlPosture: "human-approval-required",
        controlRiskNotes: [
          "The notify-or-not decision is a legal judgment — AI scopes and drafts, counsel decides and approves",
          "Scoping is only as good as the data map; unmapped data means under-scoped (and thus unlawful) notification",
          "Drafted notifications must be legally reviewed before issuance — no auto-send",
        ],
        metricsMoved: [
          "breach_time_to_notify",
          "systems_in_data_map_pct",
        ],
      },
      {
        key: "privacy_by_design_dpia_copilot",
        name: "Privacy-by-design DPIA / assessment copilot",
        valueMechanism:
          "Triage new and changed processing (including new AI uses of personal " +
          "data) at intake, auto-flag what triggers a DPIA/PIA or a transfer " +
          "assessment, and draft the assessment from the project's data flows — " +
          "raising PIA/DPIA completion and embedding privacy-by-design before " +
          "build rather than bolting it on after a launch.",
        adoptionProfile: "emerging",
        dataDependencies: [
          "Change/project and AI-use-case intake feeds describing data flows",
          "A DPIA/PIA trigger rubric and assessment templates",
          "The data map and lawful-basis register to ground the assessment",
        ],
        controlPosture: "human-in-the-loop",
        controlRiskNotes: [
          "A drafted DPIA is a starting point — the privacy officer owns the risk judgment and sign-off",
          "Trigger detection can miss novel high-risk processing; the rubric needs human review and updating",
        ],
        metricsMoved: [
          "pia_dpia_completion_rate",
          "cross_border_transfer_mechanism_pct",
          "processor_dpa_coverage",
        ],
      },
    ],

    referenceSolutionPatterns: [
      {
        key: "living_data_map_ropa",
        name: "Living data map & RoPA (the provable spine)",
        description:
          "A continuously-reconciled map binding every system, data store, and " +
          "SaaS to the personal-data categories it holds, the lawful basis and " +
          "purpose, retention rule, cross-border flows, and processors — kept " +
          "current by discovery rather than annual manual survey, so it is a " +
          "PROVABLE record, not a paper RoPA. The spine every other privacy " +
          "control binds to.",
        boundary:
          "Owns the personal-data inventory, flows, and lawful-basis/retention " +
          "register; does not own the systems themselves (system owners do) or " +
          "the security controls on them (cybersecurity), and does not make the " +
          "business decision to process — it records and governs it.",
        humanAccountabilityPoint:
          "Data Protection Officer / Chief Privacy Officer (accountable for the " +
          "accuracy and currency of the Records of Processing)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "automated_rights_consent_fabric",
        name: "Automated rights & consent fabric",
        description:
          "An integrated operational layer — DSAR workflow plus consent / " +
          "preference orchestration — wired by connectors to source systems and " +
          "downstream processors so requests are fulfilled and consent signals " +
          "enforced automatically across the estate, turning the two scale pains " +
          "(DSAR fulfillment, consent enforcement) into reconciled, audited " +
          "operations rather than manual fire drills.",
        boundary:
          "Owns the rights-fulfillment and consent-enforcement operation and its " +
          "reconciliation; does not own the data map it depends on (the RoPA " +
          "spine) or identity-verification policy, and reaches only mapped " +
          "systems — shadow data stays out of scope until discovered.",
        humanAccountabilityPoint:
          "Head of Privacy Operations (accountable for DSAR SLA and consent " +
          "honor-rate reconciliation)",
        controlPosture: "human-on-the-loop",
        dispositionKind: "foundation",
      },
      {
        key: "minimization_retention_engine",
        name: "Minimization & retention enforcement engine",
        description:
          "Retention rules bound to classified data and executed as defensible, " +
          "logged, legal-hold-aware deletion / anonymization — converting a paper " +
          "schedule into enforced minimization that continuously shrinks the " +
          "personal-data footprint, the highest-leverage and most-ignored risk " +
          "reduction in the program.",
        boundary:
          "Owns retention-rule enforcement and deletion execution; does not own " +
          "legal-hold determination (legal/e-discovery) or the lawful-basis " +
          "decision (it enforces the rules those set), and depends on " +
          "discovery/classification for the data it acts on.",
        humanAccountabilityPoint:
          "Records & Information Management Lead with the DPO (accountable for " +
          "the retention schedule and defensible deletion)",
        controlPosture: "human-approval-required",
        dispositionKind: "option",
      },
      {
        key: "vendor_transfer_governance",
        name: "Vendor & cross-border transfer governance",
        description:
          "A procurement-gated process that maps every processor and " +
          "sub-processor, ensures a current DPA with the required clauses, and " +
          "covers each cross-border flow with a valid transfer mechanism (SCCs + " +
          "transfer impact assessment, adequacy, BCRs) — extending controller " +
          "accountability across the third- and fourth-party tail that liability " +
          "follows.",
        boundary:
          "Owns processor/transfer mapping, DPA terms, and transfer-mechanism " +
          "coverage; does not own the vendor relationship or the security " +
          "assessment (TPRM/security), and integrates with procurement rather " +
          "than replacing it.",
        humanAccountabilityPoint:
          "Privacy Counsel / DPO with Procurement (accountable for DPA and " +
          "transfer-mechanism coverage of the processor estate)",
        controlPosture: "human-in-the-loop",
        dispositionKind: "option",
      },
    ],

    valueModel: {
      valueRealizationNarrative:
        "Data-privacy value is realized as RISK-AVOIDANCE plus OPERATIONAL " +
        "EFFICIENCY plus a real but indirect TRUST / ENABLEMENT dividend — and " +
        "being honest that the dominant prize is probabilistic is what keeps the " +
        "case credible. The risk-avoidance half is the largest and softest: " +
        "regulatory fines (GDPR up to 4% of global turnover, CPRA per-violation " +
        "penalties), breach cost (a smaller personal-data footprint is a smaller " +
        "breach), and litigation/class-action exposure avoided — all expected " +
        "values over uncertain enforcement, never a booked saving. The efficiency " +
        "half is the FIRM anchor: automating DSAR fulfillment and consent " +
        "enforcement cuts cost-per-DSAR and privacy-operations labor directly and " +
        "measurably, and minimization shrinks storage and breach scope. The third, " +
        "indirect, lever is enablement and trust: clean consent expands the " +
        "lawfully-addressable marketing audience, a provable data map unblocks AI " +
        "uses of personal data that would otherwise stall, and demonstrable " +
        "privacy is increasingly a sales and trust differentiator. The honest " +
        "framing: minimization is the cheapest, highest-certainty risk reduction " +
        "(less data is strictly less liability), DSAR/consent automation carries " +
        "the firm efficiency case, and fine/breach avoidance is sized as " +
        "expected-loss-avoided and hedged heavily — privacy is a low-to-medium " +
        "ROI-clarity domain and the expert says so rather than promising a " +
        "hard-dollar return on fines that may never have been levied.",
      dominantHaircutFactors: [
        {
          factor: "Fine / breach-avoidance value is probabilistic, not booked",
          rationale:
            "The largest benefit — fines, breach cost, and litigation avoided — " +
            "is an expected value over uncertain enforcement and uncertain " +
            "breaches. Finance will not credit it as a hard saving, so it must be " +
            "discounted heavily and framed as risk reduction, never a guaranteed return.",
          typicalHaircut: {
            low: 0.3,
            high: 0.7,
            basis:
              "Gap between modeled expected-fine/breach-loss avoided and what " +
              "finance credits as a hard benefit for probabilistic regulatory risk",
            label: "planning-range",
          },
        },
        {
          factor: "Discovery & data-map incompleteness",
          rationale:
            "Every privacy control acts only on data it can see; because " +
            "discovery is asymptotic and the map always trails the estate, " +
            "realized risk reduction and DSAR/consent coverage fall short of the " +
            "designed program — shadow data stays exposed.",
          typicalHaircut: {
            low: 0.15,
            high: 0.5,
            basis:
              "Coverage gap between the designed controls and the share of the " +
              "true personal-data estate actually discovered and mapped",
            label: "planning-range",
          },
        },
        {
          factor: "Downstream enforcement & integration gaps",
          rationale:
            "Captured consent, retention rules, and DSAR scope only deliver value " +
            "if enforced across every downstream system; missing integrations and " +
            "manual hand-offs leak suppressed users, leave records un-deleted, and " +
            "miss systems in fulfillment.",
          typicalHaircut: {
            low: 0.1,
            high: 0.4,
            basis:
              "Observed give-back where consent/retention/DSAR controls are " +
              "captured centrally but not enforced across all downstream processing",
            label: "planning-range",
          },
        },
        {
          factor: "Regulatory volatility & multi-regime fragmentation",
          rationale:
            "The US state-law patchwork, evolving transfer rules (post-Schrems " +
            "II), and new AI/privacy guidance keep moving the bar, so a program " +
            "scoped to today's rules requires continued investment and a static " +
            "business case overstates durable value.",
          typicalHaircut: {
            low: 0.1,
            high: 0.3,
            basis:
              "Re-work and scope-expansion cost as new state laws, transfer " +
              "regimes, and AI-privacy rules land during the program horizon",
            label: "planning-range",
          },
        },
      ],
      valueBenchmarks: [
        {
          lever: "DSAR / privacy-operations cost reduction",
          range: {
            low: 0.3,
            high: 0.7,
            basis:
              "Reduction in fully-loaded cost-per-DSAR and privacy-ops labor when " +
              "automated discovery/fulfillment replaces manual multi-system collection",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in cost_per_dsar and privacy-operations labor " +
            "(a firm, measurable efficiency saving)",
        },
        {
          lever: "Expected fine / breach-loss avoided (risk reduction)",
          range: {
            low: 0.15,
            high: 0.4,
            basis:
              "Modeled reduction in expected regulatory-fine and breach loss from " +
              "minimization, consent enforcement, and faster notification — " +
              "probabilistic, not booked",
            label: "planning-range",
          },
          measuredAs:
            "Relative reduction in modeled expected-loss (fine probability × " +
            "magnitude + breach cost), framed as avoided loss, not realized savings",
        },
        {
          lever: "Consent-driven addressable-audience / trust uplift",
          range: {
            low: 0.05,
            high: 0.25,
            basis:
              "Indicative uplift in lawfully-addressable marketing reach and " +
              "AI-use enablement when clean consent and a provable map unblock " +
              "uses that would otherwise be withheld — indirect and context-dependent",
            label: "planning-range",
          },
          measuredAs:
            "Relative change in lawfully-addressable audience and unblocked " +
            "personal-data use cases (an indirect enablement benefit, not a " +
            "direct privacy saving)",
        },
      ],
      timeToValueBand:
        "DSAR-fulfillment and consent-enforcement automation on a partial data " +
        "map: 1-3 quarters to measurable cycle-time and cost relief. PII " +
        "discovery + data-map / RoPA build-out: 2-4 quarters to usable coverage " +
        "(and ongoing, because discovery never finishes). Retention/minimization " +
        "enforcement: 2-4 quarters once classification and legal-hold checks are " +
        "wired. Full provable-data-map program with transfer/vendor governance " +
        "and AI-data lawful-basis coverage: 12-24+ months, and the risk-reduction " +
        "value compounds slowly because it is realized as fines and breaches that " +
        "do NOT happen.",
    },

    vocabulary: {
      systemsOfRecord: [
        {
          name: "Privacy-management / DSAR & RoPA platform",
          role:
            "System of record for data-subject requests, consent, data mapping / " +
            "RoPA, DPIAs, and breach workflows — the operational spine of the " +
            "privacy program.",
          examples: ["OneTrust", "TrustArc", "Securiti", "Transcend"],
        },
        {
          name: "Consent & preference management platform (CMP)",
          role:
            "Captures and stores consent, opt-out, and GPC signals and " +
            "propagates them to downstream systems — the consent system of record.",
          examples: [
            "OneTrust Consent",
            "Transcend Consent",
            "Didomi",
            "Osano",
          ],
        },
        {
          name: "PII discovery & data-classification platform",
          role:
            "Scans structured and unstructured stores to discover, classify, and " +
            "link personal data to systems — the data-map's discovery substrate.",
          examples: ["BigID", "Securiti", "Microsoft Purview", "Immuta"],
        },
        {
          name: "Vendor / TPRM & contract repository",
          role:
            "Holds Data Processing Agreements, sub-processor lists, and transfer " +
            "mechanisms — the processor-governance and DPA-coverage record.",
          examples: [
            "OneTrust Vendorpedia",
            "ServiceNow (TPRM)",
            "Contract-lifecycle / CLM repositories",
          ],
        },
        {
          name: "Data catalog / lineage & governance",
          role:
            "Tracks data lineage, classification, and flows that the data map and " +
            "minimization/retention controls bind to.",
          examples: ["Collibra", "Alation", "Microsoft Purview", "Unity Catalog"],
        },
        {
          name: "Incident / breach-management system",
          role:
            "Captures personal-data breaches, scoping, and the notification " +
            "decision and timeline — the source for breach time-to-notify.",
          examples: [
            "OneTrust Incident Management",
            "ServiceNow IRM",
            "Privacy-platform breach workflow",
          ],
        },
      ],
      roles: [
        {
          title: "Data Protection Officer (DPO) / Chief Privacy Officer (CPO)",
          accountability:
            "Enterprise privacy program, lawful-basis and RoPA accuracy, " +
            "regulator relationship, and the independent privacy-risk judgment " +
            "(GDPR-mandated DPO independence where applicable).",
        },
        {
          title: "Head of Privacy Operations",
          accountability:
            "DSAR fulfillment and SLA, consent-enforcement reconciliation, and " +
            "the day-to-day running of the rights-and-consent operation at scale.",
        },
        {
          title: "Privacy Counsel / Legal",
          accountability:
            "Regulatory interpretation, the breach notify-or-not decision, DPA " +
            "and transfer-mechanism terms, and litigation/enforcement defense.",
        },
        {
          title: "Records & Information Management Lead",
          accountability:
            "The retention schedule, defensible deletion, legal-hold " +
            "coordination, and minimization enforcement.",
        },
        {
          title: "Chief Data Officer / Data Governance Lead",
          accountability:
            "Data discovery, classification, lineage, and the data map's " +
            "technical substrate that privacy controls bind to.",
        },
      ],
      regulatoryFrames: [
        {
          name: "GDPR (EU General Data Protection Regulation)",
          relevance:
            "The dominant comprehensive privacy regime — lawful basis, data " +
            "subject rights, RoPA, DPIA, 72-hour breach notification, DPO, and " +
            "cross-border transfer obligations — that sets the global high-water " +
            "bar most programs design to.",
        },
        {
          name: "CCPA / CPRA and the US state-privacy patchwork",
          relevance:
            "California's CCPA/CPRA plus the growing set of US state laws " +
            "(Virginia, Colorado, and others) create a multi-regime patchwork of " +
            "access/deletion rights, do-not-sell/share, GPC honoring, and " +
            "per-violation penalties that programs must reconcile state by state.",
        },
        {
          name: "ePrivacy / cookie & electronic-communications rules",
          relevance:
            "Governs cookies, tracking, and electronic-marketing consent — the " +
            "frame behind consent banners, GPC, and the downstream-enforcement " +
            "obligations on tags and ad pixels.",
        },
        {
          name: "Cross-border transfer regimes (Schrems II / SCCs / adequacy / DPF)",
          relevance:
            "Post-Schrems II transfer law — Standard Contractual Clauses plus " +
            "transfer impact assessments, adequacy decisions, the EU-US Data " +
            "Privacy Framework, and BCRs — that makes every cross-border " +
            "personal-data flow a lawfulness question.",
        },
        {
          name: "Sector data-protection rules (HIPAA, GLBA, FERPA, sectoral)",
          relevance:
            "Domain-specific personal-data rules — HIPAA for protected health " +
            "information, GLBA for financial data, FERPA for education records — " +
            "that overlay additional handling, breach, and access obligations on " +
            "specific data categories.",
        },
      ],
      canonicalTerms: [
        {
          term: "DSAR (Data Subject Access Request)",
          definition:
            "A request by an individual to exercise a data right — access, " +
            "deletion, correction, portability, or opt-out — that the controller " +
            "must verify and fulfill within a statutory deadline.",
        },
        {
          term: "RoPA (Records of Processing Activities)",
          definition:
            "The GDPR-required register of processing activities — what personal " +
            "data is held, why, on what lawful basis, with whom shared, where " +
            "transferred, and how long retained — the provable data map.",
        },
        {
          term: "Lawful basis & purpose limitation",
          definition:
            "The requirement that every processing of personal data have a valid " +
            "legal ground (consent, contract, legitimate interest, etc.) and be " +
            "used only for the specified purpose — the constraint AI secondary use reopens.",
        },
        {
          term: "Data minimization",
          definition:
            "The principle that an organization collect and retain only the " +
            "personal data necessary for the stated purpose, and delete it after " +
            "— the cheapest, most-ignored risk reduction.",
        },
        {
          term: "Personal data / PII / special-category data",
          definition:
            "Information relating to an identified or identifiable person; " +
            "special-category (sensitive) data — health, biometric, racial, etc. " +
            "— carries heightened obligations.",
        },
        {
          term: "Cross-border transfer mechanism",
          definition:
            "The legal instrument (adequacy decision, Standard Contractual " +
            "Clauses with a transfer impact assessment, BCRs) that makes moving " +
            "personal data across a regulated border lawful.",
        },
        {
          term: "Controller vs processor",
          definition:
            "The controller decides why and how personal data is processed and " +
            "holds primary accountability; a processor acts on the controller's " +
            "instructions under a Data Processing Agreement — the basis of vendor liability.",
        },
      ],
    },

    evidenceAnchors: [
      {
        claim: "DSAR operation (cycle time, SLA attainment, cost)",
        authoritativeSource:
          "Privacy-management / DSAR workflow platform request timestamps and " +
          "fulfillment records, joined to source-system collection logs and " +
          "privacy-operations time tracking",
        whatGoodEvidenceLooksLike:
          "Median cycle time, on-time SLA attainment by regime and request type, " +
          "and fully-loaded cost-per-DSAR over a trailing period, with the " +
          "systems actually reached vs the mapped population shown.",
        weakEvidenceToReject:
          "A vendor-quoted 'fulfill DSARs in minutes' or an average that hides " +
          "the long-tail multi-system requests and the systems never reached.",
      },
      {
        claim: "Data map / RoPA and PII-discovery coverage",
        authoritativeSource:
          "Data-mapping / RoPA inventory cross-checked against the application " +
          "inventory and an independent PII-discovery scan across structured and " +
          "unstructured stores",
        whatGoodEvidenceLooksLike:
          "% of systems in the map reconciled to the real estate and a discovery-" +
          "coverage ESTIMATE with the residual shadow-data gap acknowledged and " +
          "trending down — never a 100% claim.",
        weakEvidenceToReject:
          "A self-reported RoPA presented as complete, or a 'we have discovered " +
          "all our PII' / '100% coverage' assertion with no scan reconciliation.",
      },
      {
        claim: "Consent enforcement and retention/minimization",
        authoritativeSource:
          "Consent / preference platform signal records reconciled against " +
          "downstream suppression logs, and retention schedule joined to record " +
          "ages from the classification platform",
        whatGoodEvidenceLooksLike:
          "Opt-out honor rate proven by downstream-suppression reconciliation " +
          "(not just signal capture), and % of records past retention with " +
          "evidence of enforced, legal-hold-aware deletion.",
        weakEvidenceToReject:
          "A 'consent recorded' count with no downstream-enforcement test, or a " +
          "retention policy document with no evidence deletion is actually executed.",
      },
      {
        claim: "Transfer, vendor (DPA), and breach-notification posture",
        authoritativeSource:
          "Transfer register and executed mechanisms (adequacy/SCC+TIA/BCR), " +
          "TPRM/contract DPA records reconciled to the processor inventory, and " +
          "breach-management timestamps against regime deadlines",
        whatGoodEvidenceLooksLike:
          "% of mapped cross-border flows with a valid mechanism, DPA coverage " +
          "across processors AND sub-processors, and breach time-to-notify " +
          "measured against the statutory clock with the scoping basis shown.",
        weakEvidenceToReject:
          "An assertion of 'all transfers covered' or 'all vendors have DPAs' " +
          "with no flow/processor reconciliation, or a breach timeline with no " +
          "data-map-based scoping.",
      },
      {
        claim: "Privacy value (efficiency saving + risk reduction)",
        authoritativeSource:
          "Cost-per-DSAR and privacy-ops labor deltas from platform/time data, " +
          "plus a modeled expected fine/breach-loss-avoided framed as probabilistic",
        whatGoodEvidenceLooksLike:
          "Firm efficiency deltas (cost-per-DSAR, ops labor, storage) as the " +
          "anchored part, with fine/breach avoidance explicitly framed as " +
          "expected-loss-avoided and the discovery/enforcement haircuts named.",
        weakEvidenceToReject:
          "A guaranteed-dollar 'fines avoided' ROI with no probability framing, " +
          "no counterfactual, and no offset for the share of the estate still undiscovered.",
      },
    ],
  },

  diagnostics: {
    discoveryQuestions: [
      "When a deletion request arrives, how do you find every system holding that person's data, what is your DSAR cycle time and SLA attainment, and what does one request cost you fully loaded?",
      "If a regulator asked for your Records of Processing tomorrow, what share of systems actually holding personal data would it cover, and when was it last reconciled against your real application estate?",
      "How do you discover personal data in unstructured stores, logs, and backups — not just databases — and what is your honest estimate of the share still undiscovered?",
      "What share of your personal data is past its retention period or has no retention rule, and is deletion actually automated or only documented as policy?",
      "When a user opts out or sends a Global Privacy Control signal, can you prove every downstream system — tags, ads, analytics, pipelines — actually suppresses them, or only that you recorded the signal?",
      "What personal data flows into your AI training, fine-tuning, and RAG/LLM pipelines, what is its lawful basis and purpose, and how would you honor a deletion request against data already in a model?",
      "How complete is your DPA coverage across processors AND sub-processors, and which cross-border flows lack a valid transfer mechanism post-Schrems II?",
    ],
    maturitySignals: [
      "The data map / RoPA is continuously reconciled against the real application estate by discovery, so it is a provable record rather than a stale annual survey.",
      "DSAR fulfillment and consent enforcement are automated and reconciled (suppression and systems-reached tested, not assumed), so SLA attainment and honor rate hold at scale.",
      "PII-discovery coverage is reported as an honest estimate that is trending up, and the program never claims complete discovery.",
      "Retention is enforced as legal-hold-aware automated deletion, so over-retention is shrinking — minimization is treated as the highest-leverage control, not a paper schedule.",
      "New processing and new AI uses of personal data are gated by a DPIA/lawful-basis check before build, and cross-border flows and processors carry current mechanisms and DPAs.",
    ],
    redFlags: [
      "'We're GDPR/CCPA compliant' rests on policies and a privacy notice with no current, reconciled data map — compliant on paper, unprovable in fact.",
      "A claim of complete PII discovery ('100% / we've found it all') — discovery is asymptotic, so this signals an unmeasured shadow-data exposure rather than completeness.",
      "Large or unknown share of records past retention with deletion documented but never executed — the highest-liability, most-ignored gap left open.",
      "Consent is 'captured' but downstream enforcement is untested — opted-out users may still be tracked or sold, a live do-not-sell/ePrivacy violation.",
      "Personal data flows into AI training/RAG with no lawful-basis or purpose review, and no answer for how a deletion request reaches data already in a model.",
    ],
  },

  sourcing: {
    vendorLandscape: [
      {
        vendorName: "Privacy-management suites (OneTrust, TrustArc, Securiti, Transcend)",
        category: "DSAR workflow, consent, data mapping/RoPA, DPIA, and breach management",
        switchingCost:
          "High — the data map, consent records, request history, DPIA library, " +
          "and accumulated integrations to source systems are configured into " +
          "the platform; migrating that operational state plus re-building " +
          "connectors is a multi-quarter effort.",
        renewalDynamics:
          "Module/seat and data-volume or request-volume pricing; modules " +
          "(consent, discovery, vendor) are upsold and bundled — watch for " +
          "per-DSAR or per-data-source metering that scales with the estate.",
      },
      {
        vendorName: "PII discovery & classification (BigID, Securiti, Microsoft Purview)",
        category: "Personal-data discovery, classification, and data-map population",
        switchingCost:
          "Moderate-to-high — scan connectors, classification taxonomy, and the " +
          "accumulated discovery baseline accrete stickiness, though scans are " +
          "re-runnable with effort on a new tool.",
        renewalDynamics:
          "Data-volume / data-source-count pricing; the fast-growing premium " +
          "segment is unstructured and cloud/SaaS coverage — negotiate against " +
          "actual scanned-source count, not list breadth.",
      },
      {
        vendorName: "Consent management platforms (OneTrust Consent, Didomi, Osano, Transcend)",
        category: "Consent / preference capture and downstream signal orchestration",
        switchingCost:
          "Moderate — re-tagging properties and re-wiring downstream " +
          "integrations is real work, but consent records and signal schemas are " +
          "portable with effort; the lock-in is the integration web, not the data.",
        renewalDynamics:
          "Traffic/visitor-volume or domain-based pricing; enforcement " +
          "(downstream propagation) vs mere capture is the differentiator to " +
          "price on — pay for proven suppression, not banner display.",
      },
      {
        vendorName: "Privacy advisory & DPO-as-a-service / managed privacy",
        category: "Outsourced privacy program, DSAR fulfillment, and regulatory advisory",
        switchingCost:
          "Moderate — the provider holds program knowledge, runbooks, and " +
          "regulator-interaction history; re-transition risk and ramp time make " +
          "switching disruptive, though the methodology is re-sourceable.",
        renewalDynamics:
          "Retainer plus per-DSAR or per-assessment pricing; structure to build " +
          "in-house capability rather than a standing dependency, and price " +
          "DSAR fulfillment per-request as automation deflects volume.",
      },
    ],
    switchingCosts:
      "The deepest lock-in is the privacy-management suite that holds the data " +
      "map, consent records, request history, and the integration web to source " +
      "systems and downstream processors — re-building that operational state and " +
      "those connectors is the real cost, not the data itself. Discovery and " +
      "consent tooling is more portable (scans re-run, signals export). The " +
      "negotiable frontier is keeping discovery and consent tooling modular " +
      "around the suite, pricing per-DSAR/per-source against the real estate, and " +
      "re-sourcing managed privacy services as in-house capability and automation mature.",
    negotiationLevers: [
      "Price DSAR and discovery per-request / per-data-source against the real estate rather than a flat enterprise fee, and let automation-deflected DSAR volume re-price the managed-service tier",
      "Require regulatory-coverage commitments (current GDPR / CCPA-CPRA / state-law / transfer-regime mappings) given the fast-moving patchwork — favor shorter terms over multi-year lock-in",
      "Insist on data-map, consent-record, and request-history export and audit-log portability so accumulated privacy state is not held hostage at renewal",
      "Price consent platforms on proven downstream ENFORCEMENT (suppression) rather than banner/traffic volume — pay for the honor rate, not the capture",
      "Keep discovery and consent tooling modular and connector-portable around the privacy suite so single-vendor lock-in on the data map can be contested",
    ],
  },

  evidenceRules: {
    requiredEvidenceByClaimType: {
      dsar_operation_claim: [
        "DSAR workflow timestamps (received → verified → fulfilled) by regime and request type",
        "SLA attainment against the statutory deadline",
        "fully-loaded cost-per-DSAR and the systems actually reached vs mapped",
      ],
      data_map_coverage_claim: [
        "RoPA / data-map inventory reconciled to the real application estate",
        "independent PII-discovery scan coverage across structured AND unstructured stores",
        "an explicit residual shadow-data gap (never a 100% claim)",
      ],
      consent_retention_claim: [
        "consent/opt-out/GPC signal records",
        "downstream-suppression reconciliation proving enforcement (not just capture)",
        "% records past retention with evidence of enforced, legal-hold-aware deletion",
      ],
      transfer_vendor_breach_claim: [
        "transfer register with executed mechanisms (adequacy/SCC+TIA/BCR) per mapped flow",
        "DPA coverage across processors and sub-processors",
        "breach time-to-notify against the regime deadline with data-map-based scoping",
      ],
      value_projection: [
        "firm efficiency deltas (cost-per-DSAR, ops labor, storage)",
        "fine/breach avoidance framed as expected-loss-avoided (probabilistic)",
        "explicit haircut factors (probabilistic avoidance, discovery gap, enforcement gap, regulatory volatility)",
        "labelled planning range, framed as risk reduction not booked revenue",
      ],
    },
    citationStandard:
      "Privacy claims cite the system of record — the privacy-management / DSAR " +
      "platform, consent platform, discovery/classification platform, transfer/" +
      "DPA register, or breach-management record — over a stated period, by regime " +
      "and request/data type, and reconciled to the REAL estate rather than the " +
      "documented subset. Coverage claims (data map, PII discovery, transfers, " +
      "DPAs) state the reconciliation basis and acknowledge the residual gap; " +
      "discovery is never cited as complete. Value claims separate the FIRM part " +
      "(measured cost-per-DSAR and privacy-ops labor) from the PROBABILISTIC part " +
      "(expected fine/breach loss avoided), cite a labelled planning range and " +
      "haircut factors, and frame risk reduction as expected-loss-avoided — never " +
      "a guaranteed-dollar 'fines avoided' number.",
  },

  hedgeRules: {
    whenToHedge: [
      "Tenant has no reconciled data map or measured DSAR baseline — frame coverage, cycle time, and cost as industry planning ranges, not their numbers.",
      "A hard-dollar ROI on fines/breaches is requested — model the benefit as probabilistic expected-loss-avoided plus firm efficiency saving, and hedge the conversion to booked dollars heavily.",
      "PII-discovery or data-map coverage is asserted as complete — flag that discovery is asymptotic and present the likely residual shadow-data gap explicitly.",
      "Consent is reported as 'captured' — flag that capture without a downstream-suppression test does not prove the opt-out is honored.",
      "Vendor- or advisor-reported compliance/coverage figures are cited — mark as provider claims pending reconciliation against the tenant's own estate.",
    ],
    inferenceLanguage: [
      "Across enterprise privacy programs at this scale, DSAR cycle time and cost-per-DSAR typically run...",
      "Without your reconciled data map, the industry pattern is that documented RoPA coverage lags the true estate by...",
      "Treating fine/breach avoidance as expected-loss-avoided rather than a booked saving...",
      "Peer programs commonly find PII-discovery coverage sits around... with a known residual shadow-data gap, since discovery never fully completes...",
      "Treating this as a planning range rather than your measured figure...",
    ],
    flagWithoutEvidence: [
      "A specific dollar ROI or amount of 'fines avoided' for this tenant's privacy program",
      "This tenant's actual DSAR cycle time, SLA attainment, discovery coverage, or over-retention figures",
      "A claim that the personal-data estate is fully discovered / fully mapped with no shadow data",
      "A claim that consent/opt-out is honored, retention is enforced, or transfers/DPAs are covered without downstream/reconciliation evidence",
    ],
  },

  outputRecipes: [
    {
      questionPattern:
        "privacy program scorecard / how is the privacy operation doing",
      exhibitKind: "table",
      note: "DSAR cycle time & SLA, consent honor rate, % systems in data map, PII-discovery coverage, % records past retention, transfer-mechanism coverage, DPIA completion, breach time-to-notify, DPA coverage, cost-per-DSAR vs planning ranges and own baseline.",
    },
    {
      questionPattern:
        "privacy value story / efficiency saving plus risk reduction with honest offsets",
      exhibitKind: "chart",
      chartKind: "value-bridge",
      chartBuilder: "valueBridge",
      note: "Bridge from current state to DSAR/ops efficiency saving to minimization/consent risk reduction to net value, showing the probabilistic-avoidance and discovery/enforcement haircuts explicitly.",
    },
    {
      questionPattern:
        "DSAR funnel / where requests stall and cost concentrates",
      exhibitKind: "chart",
      chartKind: "waterfall",
      note: "Requests received → verified → systems located → collected/redacted → fulfilled on time, exposing where cycle time, cost, and SLA breaches concentrate across the fragmented estate.",
    },
    {
      questionPattern:
        "data-map / discovery coverage gap / where personal data is ungoverned",
      exhibitKind: "chart",
      chartKind: "stacked-bar",
      chartBuilder: "stackedBar",
      note: "Systems/data stores split by mapped-and-classified vs discovered-not-mapped vs undiscovered (estimated), making the shadow-data gap and the over-retention share visible.",
    },
    {
      questionPattern:
        "value sensitivity / which haircut bites the privacy case hardest",
      exhibitKind: "chart",
      chartKind: "tornado",
      note: "Tornado of probabilistic fine/breach-avoidance, discovery incompleteness, downstream-enforcement gap, and regulatory-volatility haircuts on realized value.",
    },
    {
      questionPattern:
        "cross-border transfer & vendor/DPA coverage map",
      exhibitKind: "table",
      note: "Per mapped flow/processor: destination/jurisdiction, transfer mechanism (adequacy/SCC+TIA/BCR or none), DPA status and required clauses, sub-processor disclosure, and the coverage gap.",
    },
  ],

  successModel: {
    probabilityOfSuccess: "medium",
    successDrivers: [
      "The program is built on a living, reconciled data map / RoPA rather than policies on paper — every control binds to a provable record of what data is held, where, and why",
      "DSAR fulfillment and consent enforcement are automated AND reconciled (systems-reached and downstream-suppression tested), so SLA attainment and honor rate hold as request volume scales",
      "PII discovery coverage is treated as an honest, improving estimate and minimization is enforced as automated, legal-hold-aware deletion — the cheapest, highest-leverage risk reduction is actually taken",
      "Privacy-by-design gates new processing and new AI uses of personal data before build, with lawful-basis and transfer/DPA coverage maintained across the patchwork of regimes",
    ],
    failureDrivers: [
      "'Compliant on paper' — a polished notice and policies over a stale or partial data map, so the gap surfaces only under a regulator's question or a breach",
      "Discovery is assumed complete; shadow data in logs, backups, and SaaS stays uninventoried, so DSAR, retention, and consent controls quietly miss a material share of the estate",
      "Retention and minimization are documented but never enforced, so the estate accumulates personal data past purpose — pure liability with no offsetting benefit",
      "Consent is captured but not enforced downstream, so opted-out users are still tracked or sold — a live do-not-sell/ePrivacy violation behind a clean-looking consent record",
      "Privacy value is sold as guaranteed-dollar 'fines avoided' ROI; when the counterfactual cannot be proven, board confidence in the next investment wave collapses",
    ],
    adoptionReadiness: "medium",
    adoptionCurve:
      "Consent management and the regulated, deadline-bound DSAR operation adopt " +
      "first and fastest because the statutory clocks and visible complaint risk " +
      "force them. Data mapping / RoPA and PII discovery follow as the program " +
      "moves from paper compliance toward a provable map — slower, because " +
      "discovery never finishes and the map chases a sprawling estate. Retention " +
      "/ minimization enforcement and the AI-data lawful-basis layer are the " +
      "hardest and latest: deletion is irreversible and politically resisted " +
      "('keep it just in case'), and unwinding personal data from trained models " +
      "is genuinely unsolved. Throughout, adoption accelerates when privacy is " +
      "experienced as automation that relieves the DSAR/consent burden, and " +
      "stalls when it is a manual compliance tax.",
    roiClarity: "medium",
    roiClarityBasis:
      "Privacy ROI is firmer on the EFFICIENCY half — cost-per-DSAR, " +
      "privacy-operations labor, and storage from minimization are directly " +
      "measurable — but inherently softer on the dominant RISK-REDUCTION half: " +
      "the prize is largely fines, breach cost, and litigation AVOIDED, which is " +
      "real but probabilistic and counterfactual (you are valuing enforcement and " +
      "breaches that did not happen, and finance will not book them as hard " +
      "savings). The trust / enablement lever (consent-driven addressable reach, " +
      "unblocked AI uses of personal data) is genuine but indirect. So ROI is " +
      "anchored on the measured efficiency saving, risk reduction is framed as " +
      "expected-loss-avoided and hedged heavily, and the expert is explicit that " +
      "this is a low-to-medium ROI-clarity domain rather than promising a " +
      "hard-dollar return on fines that may never have been levied.",
  },

  regulatoryFrame: {
    name: "GDPR + CCPA/CPRA & the US state patchwork + transfer regimes",
    relevance:
      "The governing frame is layered and multi-regime: GDPR sets the global " +
      "high-water bar (lawful basis, data subject rights, RoPA, DPIA, 72-hour " +
      "breach notification, DPO, transfers); CCPA/CPRA and the growing US " +
      "state-law patchwork add access/deletion rights, do-not-sell/share, GPC " +
      "honoring, and per-violation penalties that must be reconciled state by " +
      "state; ePrivacy/cookie rules govern consent and downstream tracking " +
      "enforcement; post-Schrems II transfer law (SCCs + transfer impact " +
      "assessments, adequacy, the EU-US Data Privacy Framework, BCRs) makes every " +
      "cross-border flow a lawfulness question; and sector rules (HIPAA, GLBA, " +
      "FERPA) overlay heightened obligations on specific data categories (see " +
      "vocabulary.regulatoryFrames). AI training/ingestion of personal data " +
      "reopens consent and purpose-limitation questions across all of these.",
  },

  provenance: {
    authoredBy: "claude-subagent (backlog-wave)",
    reviewTier: "ai-gate",
    confidence: "high",
    asOf: "2026-06-21",
  },
};
