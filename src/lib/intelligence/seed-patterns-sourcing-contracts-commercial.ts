import type { PatternSeed } from "./seed-types";

export const SOURCING_CONTRACTS_COMMERCIAL_PATTERNS: PatternSeed[] = [
  {
    id: "PAT-SRC-CON-004",
    slug: "sla-service-credit-architecture",
    title: "SLA and Service-Credit Architecture",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "Service levels become decision-grade only when uptime metrics, exclusions, claim process, credit mechanics, operational remedies, and termination rights are negotiated as one architecture.",
    applicability:
      "Apply when sourcing or renewing SaaS, cloud, managed service, platform, or business-critical technology contracts where downtime, support response, performance degradation, or incident handling can affect operations.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.72,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [
      "https://aws.amazon.com/legal/service-level-agreements/",
      "https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services",
      "https://cloud.google.com/terms/sla",
    ],
    regulatoryChips: [
      "critical-service-review",
      "business-continuity",
      "incident-evidence",
    ],
    relatedPatternIds: ["PAT-SRC-003", "PAT-SRC-CON-005", "PAT-SRC-CON-006"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    standardClauses: [
      {
        clauseArea: "Service-level metric and measurement boundary",
        buyerPosition:
          "Define each covered service, measurement window, downtime formula, excluded events, maintenance treatment, regional or tenant scope, and the evidence the buyer may use to validate the calculation.",
        fallbackPosition:
          "If the vendor will not customize the metric, require a service-specific schedule, status-page evidence retention, and escalation review for recurring incidents.",
        walkawayTriggers: [
          "No measurable service commitment for a critical function",
          "Exclusions broad enough to absorb ordinary vendor-controlled failures",
        ],
        sourceBasis: [
          {
            type: "public-disclosure",
            label: "AWS Service Level Agreements",
            url: "https://aws.amazon.com/legal/service-level-agreements/",
            asOf: "2026-04-29",
          },
          {
            type: "public-disclosure",
            label: "Google Cloud Platform Service Level Agreements",
            url: "https://cloud.google.com/terms/sla",
            asOf: "2026-04-29",
          },
        ],
      },
      {
        clauseArea: "Service credits, remedies, and chronic failure",
        buyerPosition:
          "Treat credits as one remedy layer, not the whole resilience bargain: preserve support escalation, root-cause reporting, remediation plans, enhanced governance, and termination rights for repeated material failures.",
        fallbackPosition:
          "If credits are sole monetary remedy, negotiate a separate chronic-failure termination trigger and executive incident-review process.",
        sourceBasis: [
          {
            type: "public-disclosure",
            label: "Microsoft Online Services SLA",
            url: "https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Criticality-based SLA schedule",
        whenToUse:
          "Use during BAFO when the vendor offers one standard SLA across production, analytics, support, sandbox, integration, and batch functions.",
        buyerAsk:
          "Segment commitments by critical function, production environment, support severity, integration dependency, and reporting cadence rather than accepting one blended availability target.",
        tradeoffs: [
          "Higher service commitments may increase price or require premium support, so align the ask to business criticality and not every module.",
        ],
      },
      {
        lever: "Incident evidence and credit-claim workflow",
        whenToUse:
          "Use when public or form SLAs require the customer to submit claims within a defined process or window.",
        buyerAsk:
          "Require outage evidence, status-page retention, ticket linkage, monthly availability reports, and a named credit-claim process that procurement, IT, and legal can actually operate.",
        evidenceBasis: [
          {
            type: "public-disclosure",
            label: "Google Cloud Platform Service Level Agreements",
            url: "https://cloud.google.com/terms/sla",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    riskFactors: [
      {
        id: "sla-credit-only-remedy-gap",
        label: "Credit-only remedy gap",
        severity: "high",
        detectionSignals: [
          "Service credits are capped at fees while the business impact is operational, customer-facing, or regulatory.",
          "No chronic-failure trigger exists outside the credit table.",
        ],
        mitigations: [
          "Add governance escalation, root-cause reporting, remediation plan, and termination rights for recurring material failures.",
        ],
        contractualRemedies: [
          "Service credits",
          "Root-cause report",
          "Corrective-action plan",
          "Termination for chronic failure",
        ],
      },
      {
        id: "sla-measurement-ambiguity",
        label: "SLA measurement ambiguity",
        severity: "medium",
        detectionSignals: [
          "The contract does not define excluded downtime, measurement window, affected-user test, service boundary, or evidence source.",
          "Vendor status page and buyer monitoring may produce different outage records.",
        ],
        mitigations: [
          "Lock metric definitions, evidence hierarchy, status-reporting cadence, and dispute workflow before award.",
        ],
      },
    ],
    body: `## Summary
SLA and service-credit language should be treated as a contract architecture, not a table pasted into an order form. Public cloud and online-service terms commonly publish service-specific SLA pages, which is useful evidence that commitments can differ by product, measurement period, exclusion, credit percentage, and claim process. The sourcing lesson is not that any public SLA is sufficient. The lesson is that a buyer needs to model the operational service dependency first and then test whether the proposed SLA schedule, support model, and remedy stack actually match that dependency.

## When to apply
Use this pattern when a sourced service supports revenue operations, identity, customer channels, regulated workflows, finance close, analytics, integration, or employee productivity at a level where downtime is not merely inconvenient. It also applies when a vendor sells premium support, resilience add-ons, disaster-recovery options, or multi-region deployment as separate commercial levers. Do not use this pattern to invent uptime targets. Use it to force clear evidence, definitions, and governance around whatever commitment is actually offered or negotiated.

## Contract architecture
Start with the covered service boundary. A SaaS suite may include production application access, API availability, batch processing, reporting, AI features, sandbox, support portal, and optional modules. A cloud or platform agreement may have separate service terms for compute, storage, networking, identity, managed databases, or observability. Each boundary should identify the metric, measurement window, planned maintenance treatment, exclusions, customer dependencies, regional scope, tenant scope, and evidence source. Without that structure, the headline percentage can hide material gaps.

Then separate remedies. A service credit can offset fees, but it rarely repairs the operational effect of a severe incident. For critical services, the buyer should negotiate incident notice, ticket priority, support response, root-cause reporting, corrective-action plans, executive escalation, recurring-failure review, and termination rights where repeated material failures make the service unsuitable. If the vendor insists that credits are the only monetary remedy for availability failures, the buyer can still seek non-monetary operational remedies and a chronic-failure exit.

## Evidence and workflow
The credit process must be usable. The sourcing team should require an evidence pack that names monitoring sources, status pages, support tickets, incident reports, timestamps, affected services, affected users or transactions where relevant, and the deadline for submitting a claim. The contract owner should know whether credits are automatic, requested through support, requested through an account team, or dependent on a written claim. If procurement does not operationalize the process, the negotiated credit schedule may never produce value.

## Negotiation posture
In BAFO, do not ask every vendor for the highest possible uptime number. Ask vendors to show how the service design, support tier, deployment option, and commercial remedy map to the buyer's critical functions. A lower-risk collaboration tool may need clear support and transparency. A customer-facing identity or payment-adjacent service may need stronger incident governance, executive escalation, and exit rights. The defensible outcome is a service-level schedule that a business owner, IT operator, and contract manager can all understand and administer.

## Pitfalls
Common failures include accepting a generic SLA that excludes the actual failure mode, letting credits become the only remedy, ignoring support response commitments, missing claim deadlines, and failing to connect repeated incidents to termination or transition rights. Another failure is comparing vendors by headline availability alone. A vendor with stronger evidence, transparent incident process, and workable escalation may be lower risk than a vendor with a higher headline metric but vague exclusions and no operational accountability.`,
  },
  {
    id: "PAT-SRC-CON-005",
    slug: "dpa-subprocessor-control-evidence",
    title: "DPA, Subprocessor, and Control Evidence Stack",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "Data-processing terms are sourcing evidence, not legal boilerplate; the buyer should map processing scope, subprocessor posture, transfer controls, security evidence, deletion, and assistance obligations before award.",
    applicability:
      "Apply when a vendor will process personal data, confidential data, regulated data, employee data, customer data, telemetry, documents, prompts, outputs, or integration metadata on behalf of the buyer.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.7,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [
      "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
      "https://aws.amazon.com/compliance/sub-processors/",
      "https://cloud.google.com/terms/data-processing-addendum",
      "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
    ],
    regulatoryChips: [
      "GDPR-if-personal-data",
      "subprocessor-review",
      "cross-border-transfer-review",
      "security-control-evidence",
    ],
    relatedPatternIds: ["PAT-SRC-CON-004", "PAT-SRC-CON-006", "PAT-SRC-002"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    standardClauses: [
      {
        clauseArea: "Processing instructions and DPA scope",
        buyerPosition:
          "Define subject matter, duration, processing nature and purpose, personal-data types, data-subject categories, controller instructions, confidentiality, assistance, return/deletion, and audit/evidence cooperation.",
        fallbackPosition:
          "If the vendor will only use its standard DPA, attach a buyer-specific processing description and confirm order-form precedence for the relevant service.",
        sourceBasis: [
          {
            type: "regulatory-document",
            label: "GDPR Article 28 official text",
            url: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
            asOf: "2026-04-29",
          },
        ],
      },
      {
        clauseArea: "Subprocessor notice, objection, and evidence",
        buyerPosition:
          "Require a current subprocessor list, notice of new or replacement subprocessors where applicable, objection path, location/function metadata, and evidence that flowdown obligations apply.",
        fallbackPosition:
          "For low-risk services, accept general authorization only if notice, list maintenance, and exit/escalation rights are workable.",
        sourceBasis: [
          {
            type: "public-disclosure",
            label: "AWS Sub-processors",
            url: "https://aws.amazon.com/compliance/sub-processors/",
            asOf: "2026-04-29",
          },
          {
            type: "regulatory-document",
            label: "GDPR Article 28 official text",
            url: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Data inventory before legal redlines",
        whenToUse:
          "Use before RFP or BAFO when teams are debating the DPA without a stable view of data categories and processing purposes.",
        buyerAsk:
          "Force the vendor and business owner to complete a processing matrix covering data classes, systems, regions, retention, subprocessors, support access, AI use, telemetry, and deletion.",
        tradeoffs: [
          "This can slow contracting, but it prevents accepting a generic DPA that misses the real operating model.",
        ],
      },
      {
        lever: "Control evidence bundle",
        whenToUse:
          "Use when a vendor answers security and privacy questions with broad assurance language instead of artifacts.",
        buyerAsk:
          "Request relevant security reports or summaries, penetration-test summary where available, policy evidence, incident process, encryption posture, access controls, subprocessor list, DPA, and data-flow diagram.",
        evidenceBasis: [
          {
            type: "public-disclosure",
            label: "Microsoft Products and Services Data Protection Addendum",
            url: "https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    riskFactors: [
      {
        id: "dpa-processing-scope-gap",
        label: "Processing scope gap",
        severity: "high",
        detectionSignals: [
          "The DPA is signed before data categories, processing purposes, retention, support access, and AI/telemetry use are documented.",
          "The order form references a service that is not clearly covered by the DPA.",
        ],
        mitigations: [
          "Attach a processing description, data-flow map, service schedule, and security exhibit before award.",
        ],
        contractualRemedies: [
          "Processing schedule",
          "Security exhibit",
          "Deletion certification",
          "Assistance obligations",
        ],
        sourceBasis: [
          {
            type: "regulatory-document",
            label: "GDPR Article 28 official text",
            url: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
            asOf: "2026-04-29",
          },
        ],
      },
      {
        id: "subprocessor-opacity",
        label: "Subprocessor opacity",
        severity: "medium",
        detectionSignals: [
          "Vendor will not identify subprocessor functions, locations, notice process, or objection mechanism.",
          "Subprocessor list is separated from the services actually being purchased.",
        ],
        mitigations: [
          "Require service-specific subprocessor evidence, update notice, objection escalation, and transition rights for unacceptable changes.",
        ],
      },
    ],
    industryVariants: [
      {
        industry: "healthcare",
        modifier:
          "Escalate legal review if PHI or business-associate obligations may apply; do not rely on a generic DPA alone.",
        additionalRequirements: [
          "Data classification",
          "BAA review where applicable",
          "Minimum-necessary access review",
        ],
      },
      {
        industry: "financial_services",
        modifier:
          "Map DPA evidence to outsourcing, operational resilience, audit, data-location, and exit requirements before award.",
        regulatoryRefs: ["DORA if applicable to EU financial entities"],
      },
    ],
    body: `## Summary
A DPA is not a paperwork afterthought. It is the contract layer that should explain what data the vendor processes, why it processes it, how long it keeps it, who else can touch it, what security commitments apply, what happens at termination, and what evidence the buyer can review. GDPR Article 28 is a useful public anchor when personal data is in scope because it identifies core processor-contract subjects, including processing details, instructions, confidentiality, assistance, deletion or return, subprocessing, and audit-related information. This pattern does not give legal advice; it gives the sourcing team a deterministic evidence structure to take into legal and privacy review.

## When to apply
Use this pattern whenever the vendor will handle personal data, employee data, customer data, supplier data, confidential documents, telemetry, prompts, outputs, integration metadata, support logs, or backups. It is especially important for SaaS, AI tools, CLM, AP automation, HR, CRM, analytics, cloud hosting, managed services, and collaboration platforms. Do not wait until final contracting if privacy, security, or data residency is a gating factor. Data-processing questions should shape RFP evidence, finalist selection, and BAFO negotiation.

## Evidence stack
Start with a processing matrix. Name the service, data categories, data subjects, purpose, processing operations, regions, retention periods, support-access model, customer controls, integrations, telemetry, AI/model-training posture if relevant, and deletion or return process. Then map subprocessors. A buyer does not need to turn every subprocessor question into a veto, but it does need a current list or disclosure mechanism, functions performed, service relevance, update notice, and an objection or escalation path where the legal framework or risk posture requires one.

Next collect control evidence. The minimum bundle usually includes the DPA, security exhibit, subprocessor disclosure, incident-notification procedure, encryption and access-control summary, data-flow or architecture summary, deletion and export procedure, and relevant third-party assurance report or certification evidence where available. The buyer should not treat a logo, badge, or generic trust-center page as equivalent to scope-matched evidence. The evidence must align to the service purchased, the data processed, and the environment used.

## Negotiation posture
The strongest lever is sequencing. A buyer who waits until signature to review the DPA has little leverage and may discover that a preferred vendor cannot meet the intended data posture. The sourcing team should make DPA completeness a BAFO input: any finalist should confirm processing scope, subprocessor posture, security evidence, support access, transfer mechanism where relevant, incident cooperation, return/deletion, and customer assistance before award. If a vendor refuses bespoke terms, the buyer can still negotiate an order-form data schedule, service-specific exhibit, operational controls, or stronger exit rights.

## Pitfalls
Common failures include signing a generic DPA that does not cover the purchased module, ignoring telemetry or support data, treating subprocessor lists as static, missing cross-border transfer review, and accepting deletion language that does not address backups, logs, or derived data. Another failure is confusing legal sufficiency with operational readiness. A DPA can be formally present while the buyer lacks practical evidence of access controls, data flows, incident process, or deletion execution. For higher-risk data, the contract file should survive audit by showing not only signed terms but also the decision evidence that made those terms acceptable.

## Outputs
The expected sourcing outputs are a data-processing matrix, subprocessor review record, DPA issue log, security evidence bundle, privacy/legal sign-off, unresolved-risk register, and final contract schedule. These artifacts give the integration lead, privacy reviewer, and commercial owner a single source of truth instead of forcing them to reconstruct the data story from redlines and email threads after the preferred vendor has already been selected.`,
  },
  {
    id: "PAT-SRC-CON-006",
    slug: "audit-right-to-verify-governance",
    title: "Audit and Right-to-Verify Governance",
    domain: "sourcing",
    tier: "validated",
    vertical: "cross-industry",
    thesis:
      "Audit rights create value only when they are converted into an evidence governance model that defines report access, verification triggers, site or remote review, remediation, confidentiality, and regulator support.",
    applicability:
      "Apply when a vendor supports critical operations, regulated functions, security-sensitive data, financial controls, resilience obligations, or outsourced processes that must be verified during the contract term.",
    status: "AUTHORED-DRAFT",
    version: "1.0",
    confidence: 0.69,
    createdFrom: "human_authored",
    createdBy: "codex",
    createdAt: "2026-04-29",
    instanceCount: 0,
    sourceDocuments: [
      "https://www.aicpa-cima.com/soc",
      "https://www.aicpa-cima.com/cpe-learning/publication/soc-2-reporting-on-an-examination-of-controls-at-a-service-organization-relevant-to-security-availability-processing-integrity-confidentiality-or-privacy",
      "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32022R2554",
      "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
    ],
    regulatoryChips: [
      "audit-rights",
      "SOC-report-review",
      "DORA-if-regulated-financial-entity",
      "GDPR-if-personal-data",
    ],
    relatedPatternIds: ["PAT-SRC-CON-004", "PAT-SRC-CON-005", "PAT-SRC-006"],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    category: "contract_intelligence",
    vendorClass: "direct-tech",
    standardClauses: [
      {
        clauseArea: "Evidence access and report cadence",
        buyerPosition:
          "Define which independent reports, certifications, policies, incident summaries, remediation updates, and bridge letters are available; require scope matching to the purchased service and review cadence.",
        fallbackPosition:
          "If direct audit is restricted, require current third-party assurance reports, bridge letters, management responses to exceptions, and a dispute/escalation path for material gaps.",
        sourceBasis: [
          {
            type: "public-disclosure",
            label: "AICPA SOC suite overview",
            url: "https://www.aicpa-cima.com/soc",
            asOf: "2026-04-29",
          },
        ],
      },
      {
        clauseArea: "Right to verify and regulatory cooperation",
        buyerPosition:
          "Preserve risk-based audit or verification rights for material incidents, unresolved control gaps, regulatory inquiry, data breach investigation, or critical service dependency, subject to confidentiality and reasonable security procedures.",
        fallbackPosition:
          "For hyperscale or multi-tenant services, substitute structured assurance evidence and regulator-facing cooperation where direct access is not feasible.",
        sourceBasis: [
          {
            type: "regulatory-document",
            label: "DORA official text",
            url: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A32022R2554",
            asOf: "2026-04-29",
          },
          {
            type: "regulatory-document",
            label: "GDPR Article 28 official text",
            url: "https://eur-lex.europa.eu/legal-content/en/TXT/?uri=CELEX%3A02016R0679-20160504",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    negotiationLevers: [
      {
        lever: "Assurance substitution ladder",
        whenToUse:
          "Use when the vendor rejects customer site audits or broad inspection rights because the service is multi-tenant, hyperscale, or security-sensitive.",
        buyerAsk:
          "Build a ladder of substitutes: SOC or equivalent reports, certifications, bridge letters, questionnaire updates, executive control attestations, incident-specific evidence, and regulator cooperation.",
        tradeoffs: [
          "Substitution may be reasonable for low-risk services, but critical services need trigger-based escalation when reports reveal exceptions or incidents occur.",
        ],
        evidenceBasis: [
          {
            type: "public-disclosure",
            label: "AICPA SOC 2 guide overview",
            url: "https://www.aicpa-cima.com/cpe-learning/publication/soc-2-reporting-on-an-examination-of-controls-at-a-service-organization-relevant-to-security-availability-processing-integrity-confidentiality-or-privacy",
            asOf: "2026-04-29",
          },
        ],
      },
      {
        lever: "Trigger-based enhanced verification",
        whenToUse:
          "Use when annual report review is acceptable for normal operations but insufficient for severe incidents, regulatory requests, or repeated SLA/control failures.",
        buyerAsk:
          "Add enhanced evidence rights triggered by material incidents, audit exceptions, unresolved remediation, regulatory inquiry, breach investigation, or chronic service failure.",
      },
    ],
    riskFactors: [
      {
        id: "audit-right-paper-only",
        label: "Paper-only audit right",
        severity: "high",
        detectionSignals: [
          "The contract says the buyer may audit but does not define notice, scope, method, frequency, evidence, remediation, or confidentiality.",
          "Vendor can satisfy all requests with generic marketing trust materials.",
        ],
        mitigations: [
          "Define evidence types, cadence, scope matching, review process, exception handling, and trigger-based escalation.",
        ],
        contractualRemedies: [
          "Report access",
          "Bridge letter",
          "Remediation plan",
          "Enhanced verification after trigger events",
        ],
      },
      {
        id: "assurance-scope-mismatch",
        label: "Assurance scope mismatch",
        severity: "medium",
        detectionSignals: [
          "SOC or certification scope does not include the purchased service, region, subprocessor, control objective, or period under review.",
          "Bridge letter is missing for the gap between report date and go-live.",
        ],
        mitigations: [
          "Require scope review, report-period review, exception analysis, complementary user-entity control review, and bridge evidence.",
        ],
        sourceBasis: [
          {
            type: "public-disclosure",
            label: "AICPA SOC suite overview",
            url: "https://www.aicpa-cima.com/soc",
            asOf: "2026-04-29",
          },
        ],
      },
    ],
    industryVariants: [
      {
        industry: "financial_services",
        modifier:
          "For EU financial entities where DORA applies, align audit and access language with ICT third-party risk, critical or important function review, and supervisory expectations.",
        regulatoryRefs: ["DORA Regulation (EU) 2022/2554"],
        affectedStages: ["RFP", "BAFO", "Contracting"],
      },
      {
        industry: "public_sector",
        modifier:
          "Preserve audit support for public records, grant, procurement, accessibility, security, or inspector-general review where applicable.",
        additionalRequirements: [
          "Public-sector audit cooperation",
          "Records-retention alignment",
          "Security evidence access",
        ],
      },
    ],
    body: `## Summary
Audit rights are often negotiated as if the words themselves create control. They do not. A right to audit has practical value only when the contract defines what can be reviewed, which evidence substitutes for direct access, when enhanced verification is triggered, how findings are remediated, and how confidentiality and security of the vendor environment are protected. Public assurance ecosystems such as SOC reporting show that third-party reports can be part of the answer, but they are not automatically enough. The report scope, period, exceptions, complementary user controls, and purchased-service alignment matter.

## When to apply
Use this pattern for critical SaaS, cloud, managed service, security, finance, HR, privacy, AI, infrastructure, payment-adjacent, or outsourced operations where the buyer must verify controls during the term. It is also useful when a regulated buyer may need evidence for supervisors, auditors, customers, cyber insurers, board risk committees, or internal control owners. Do not use it to demand unrestricted site access by default. Use it to build a risk-based verification model that can work in a multi-tenant technology environment.

## Governance model
The first layer is scheduled evidence. The contract should identify available SOC or equivalent reports, certifications, penetration-test summaries where offered, policy summaries, security questionnaires, business-continuity evidence, incident summaries, subprocessor disclosures, and bridge letters. The buyer should define cadence, access process, confidentiality terms, permitted reviewers, and how the contract owner records completion of review.

The second layer is scope matching. An assurance report may cover one product but not another, one region but not another, or a period that ends before go-live. A report may also include exceptions or complementary user-entity controls that require buyer action. The sourcing team should therefore require a review worksheet that maps report scope to the purchased service, data classes, control domains, regions, subprocessors, and implementation timeline. If the evidence does not match the deal, the gap should become a risk item or negotiation issue.

The third layer is trigger-based verification. Annual report access may be reasonable during normal operations, but it may not be enough after a material incident, recurring SLA failure, unresolved audit exception, suspected breach, regulatory inquiry, or major subprocessor change. The contract should define what enhanced evidence the vendor will provide in those cases: incident timeline, root-cause analysis, remediation plan, control-owner attestation, meeting with security leadership, regulator cooperation, or limited remote review under agreed procedures.

## Negotiation posture
Many vendors resist broad audit language because it can create security, confidentiality, operational, and multi-tenant risk. The buyer can avoid a binary fight by building an assurance substitution ladder. Start with independent reports and certifications. Add bridge letters, management responses, and exception remediation. Add incident-specific evidence and executive control attestations for triggered events. Preserve direct or regulator-facing review for the highest-risk cases where law, regulation, or material operational risk makes substitution inadequate.

## Pitfalls
Common failures include accepting an audit right with no process, relying on a SOC report that excludes the purchased module, failing to review report exceptions, ignoring complementary user controls, missing the bridge period between report date and production go-live, or assuming a trust-center badge proves control effectiveness. Another failure is separating audit rights from SLA, DPA, incident, and exit terms. Verification is the connective tissue: it tells the buyer whether service commitments, privacy promises, security controls, and remediation obligations are real enough to rely on.

## Outputs
The expected artifacts are an audit-rights matrix, assurance-report inventory, evidence-access workflow, scope-matching worksheet, exception and remediation log, trigger list for enhanced verification, confidentiality procedure, and regulator-cooperation position. These outputs let the contract file show how the buyer will verify the vendor over time, not merely that someone negotiated an audit clause before signature.`,
  },
];
