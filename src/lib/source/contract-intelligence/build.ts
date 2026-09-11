import type {
  ContractDepthPackageInput,
  CsvRecord,
} from "../contract-depth-package/projection";
import type {
  ContractIntelligenceDerivedInsight,
  ContractIntelligenceAnatomy,
  ContractIntelligenceAnatomyNode,
  ContractIntelligenceAnatomyRelationship,
  ContractIntelligenceEvidenceLane,
  ContractIntelligenceEvidenceState,
  ContractIntelligenceFact,
  ContractIntelligenceFinding,
  ContractIntelligenceLever,
  ContractIntelligenceMetric,
  ContractIntelligenceRecord,
  ContractIntelligenceReadout,
  ContractIntelligenceReviewStatus,
} from "./types";

const MODEL_VERSION = "source-contract-intelligence-v1";
function text(row: CsvRecord, key: string): string {
  return row[key]?.trim() ?? "";
}

function number(row: CsvRecord, key: string): number | null {
  const parsed = Number(text(row, key).replace(/[$,%]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: string | number | null): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "Not established";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function percent(value: number | null): string {
  return value === null ? "Not established" : `${value.toFixed(1)}%`;
}

function groupBy(
  rows: readonly CsvRecord[],
  key: string,
): Map<string, CsvRecord[]> {
  const groups = new Map<string, CsvRecord[]>();
  for (const row of rows) {
    const groupKey = text(row, key);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
  }
  return groups;
}

function sourceRef(row: CsvRecord, fallback: string): string {
  return text(row, "source_row_id") || text(row, "source_file_id") || fallback;
}

function sourceRefs(rows: readonly CsvRecord[], fallback: string): string[] {
  return rows.map((row) => sourceRef(row, fallback)).filter(Boolean);
}

function sum(rows: readonly CsvRecord[], key: string): number {
  return rows.reduce((total, row) => total + (number(row, key) ?? 0), 0);
}

function sumFirstAvailable(
  rows: readonly CsvRecord[],
  keys: readonly string[],
): number {
  return rows.reduce((total, row) => {
    const key = keys.find((candidate) => text(row, candidate) !== "");
    return total + (key ? (number(row, key) ?? 0) : 0);
  }, 0);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function humanArchetype(archetype: string): string {
  const labels: Record<string, string> = {
    application_managed_services: "application managed services",
    consumption_commit: "consumption commitment",
    cloud_consumption: "cloud consumption",
    cloud_data_platform_subscription: "cloud data platform subscription",
    saas_data_platform: "SaaS data platform",
    cloud_platform_enterprise_agreement: "cloud platform enterprise agreement",
  };
  return labels[archetype] ?? archetype.replaceAll("_", " ");
}

function stateFor(
  rows: readonly CsvRecord[],
  required: boolean,
): ContractIntelligenceEvidenceState {
  if (rows.length > 0) return "loaded";
  return required ? "missing" : "not_required";
}

function lane(
  key: string,
  label: string,
  rows: readonly CsvRecord[],
  required: boolean,
  plainEnglish: string,
  fallback: string,
): ContractIntelligenceEvidenceLane {
  return {
    key,
    label,
    state: stateFor(rows, required),
    plainEnglish,
    sourceRefs: sourceRefs(rows, fallback),
  };
}

function candidateRange(row: CsvRecord): string {
  const low = number(row, "annual_impact_low_usd");
  const high = number(row, "annual_impact_high_usd");
  if (low === null && high === null) return "Not sized";
  if (low !== null && high !== null && low !== high)
    return `${money(low)}-${money(high)}`;
  return money(low ?? high);
}

function buildFindings(
  rows: readonly CsvRecord[],
): ContractIntelligenceFinding[] {
  return rows.map((row, index) => ({
    findingId: text(row, "finding_id") || `finding-${index + 1}`,
    label: text(row, "category").replaceAll("_", " ") || "Contract finding",
    statement: text(row, "current_state") || "Finding statement not loaded.",
    implication:
      text(row, "sourcing_implication") || "Commercial implication not loaded.",
    recommendedAction:
      text(row, "recommended_action") || "Recommended action not loaded.",
    annualImpact: money(number(row, "estimated_annual_impact_usd")),
    confidence: ["high", "medium", "low"].includes(text(row, "confidence"))
      ? (text(row, "confidence") as "high" | "medium" | "low")
      : "low",
    sourceRefs: [sourceRef(row, `finding-${index + 1}`)],
  }));
}

function buildLevers(rows: readonly CsvRecord[]): ContractIntelligenceLever[] {
  return rows.map((row, index) => ({
    leverId: text(row, "lever_id") || `lever-${index + 1}`,
    leverType: text(row, "lever_type") || "unclassified",
    label: text(row, "lever_type").replaceAll("_", " ") || "Negotiation lever",
    currentTerm: text(row, "current_term") || "Current term not loaded.",
    targetTerm: text(row, "target_term") || "Target term not loaded.",
    buyerAsk: text(row, "buyer_ask") || "Buyer ask not loaded.",
    negotiationLanguage:
      text(row, "negotiation_language") || "Negotiation language not loaded.",
    vendorGive: text(row, "vendor_give") || "Vendor give not loaded.",
    valueBasis: text(row, "value_basis") || "Value basis not loaded.",
    candidateRange: candidateRange(row),
    timingDependency:
      text(row, "timing_dependency") || "Timing dependency not loaded.",
    ownerRole: text(row, "owner_role") || "Owner not assigned.",
    priority: text(row, "priority") || "Priority not assigned.",
    riskIfIgnored:
      text(row, "risk_if_ignored") || "Risk if ignored not loaded.",
    sourceRefs: [sourceRef(row, `lever-${index + 1}`)],
  }));
}

function buildAnatomy(
  contract: CsvRecord,
  scope: readonly CsvRecord[],
  documents: readonly CsvRecord[],
  clauses: readonly CsvRecord[],
  spend: readonly CsvRecord[],
  invoices: readonly CsvRecord[],
  performance: readonly CsvRecord[],
  tickets: readonly CsvRecord[],
  changes: readonly CsvRecord[],
  opportunities: readonly CsvRecord[],
  levers: readonly CsvRecord[],
  archetype: string,
): ContractIntelligenceAnatomy {
  const contractId = text(contract, "contract_id");
  const contractNode = `contract:${contractId}`;
  const vendorNode = `vendor:${text(contract, "vendor_ref") || text(contract, "vendor_name")}`;
  const archetypeNode = `archetype:${archetype || "unclassified"}`;
  const nodes: ContractIntelligenceAnatomyNode[] = [
    {
      id: contractNode,
      kind: "contract",
      label: text(contract, "contract_name") || contractId,
      description:
        "The governed contract identity that anchors every connected fact.",
      sourceRefs: [sourceRef(contract, contractId)],
    },
    {
      id: vendorNode,
      kind: "vendor",
      label: text(contract, "vendor_name") || "Vendor not established",
      description: "The counterparty named by the contract register.",
      sourceRefs: [sourceRef(contract, contractId)],
    },
    {
      id: archetypeNode,
      kind: "archetype",
      label: humanArchetype(archetype) || "Archetype not established",
      description:
        "The contract shape used to select the relevant evidence lanes and playbook questions.",
      sourceRefs: [sourceRef(contract, contractId)],
    },
  ];
  const relationships: ContractIntelligenceAnatomyRelationship[] = [
    {
      id: `${contractNode}->${vendorNode}`,
      from: contractNode,
      to: vendorNode,
      type: "provided_by",
      label: "provided by",
      explanation:
        "The register identifies this vendor as the contract counterparty.",
      sourceRefs: [sourceRef(contract, contractId)],
      confidence: "high",
    },
    {
      id: `${contractNode}->${archetypeNode}`,
      from: contractNode,
      to: archetypeNode,
      type: "classified_as",
      label: "classified as",
      explanation:
        "The declared archetype controls which commercial and operating questions are relevant.",
      sourceRefs: [sourceRef(contract, contractId)],
      confidence: text(contract, "archetype") ? "high" : "low",
    },
  ];
  const addNode = (node: ContractIntelligenceAnatomyNode): void => {
    if (!nodes.some((existing) => existing.id === node.id)) nodes.push(node);
  };
  const addRelationship = (
    relationship: ContractIntelligenceAnatomyRelationship,
  ): void => {
    if (!relationships.some((existing) => existing.id === relationship.id))
      relationships.push(relationship);
  };
  for (const row of scope) {
    const scopeId =
      text(row, "application_id") ||
      text(row, "application_ref") ||
      sourceRef(row, "scope");
    const scopeNode = `scope:${scopeId}`;
    const scopeLabel = text(row, "application_name") || scopeId;
    addNode({
      id: scopeNode,
      kind: "scope",
      label: scopeLabel,
      description: `${text(row, "scope_status") || "Named"} scope${text(row, "business_function") ? ` for ${text(row, "business_function")}` : ""}.`,
      sourceRefs: [sourceRef(row, scopeId)],
    });
    addRelationship({
      id: `${contractNode}->${scopeNode}`,
      from: contractNode,
      to: scopeNode,
      type: "covers",
      label: "covers",
      explanation:
        "This application or service is explicitly named in the governed scope rows.",
      sourceRefs: [sourceRef(row, scopeId)],
      confidence: "high",
    });
  }
  const evidenceSources = [
    {
      key: "contract-documents",
      label: "Contract documents",
      rows: documents,
      description: "Order forms, agreements, and other governed paper.",
    },
    {
      key: "commercial-clauses",
      label: "Extracted clauses",
      rows: clauses,
      description:
        "Clause-level facts used to explain the commercial position.",
    },
    {
      key: "spend-records",
      label: "Spend or consumption records",
      rows: spend,
      description:
        "Monthly usage or spend observations used to test the commercial baseline.",
    },
    {
      key: "invoice-records",
      label: "Invoice records",
      rows: invoices,
      description: "Invoice lines used to reconcile what was billed.",
    },
    {
      key: "performance-records",
      label: "Performance and ticket records",
      rows: [...performance, ...tickets],
      description:
        "Service-level or operational records used to test delivery claims.",
    },
    {
      key: "change-order-records",
      label: "Change-order records",
      rows: changes,
      description:
        "Approved or proposed changes that alter scope or economics.",
    },
    {
      key: "optimization-records",
      label: "Optimization records",
      rows: [...opportunities, ...levers],
      description: "Candidate actions linked back to evidence rows.",
    },
  ];
  for (const source of evidenceSources) {
    if (source.rows.length === 0) continue;
    const sourceNode = `evidence:${source.key}:${contractId}`;
    addNode({
      id: sourceNode,
      kind: "evidence_source",
      label: source.label,
      description: source.description,
      sourceRefs: sourceRefs(source.rows, contractId),
    });
    addRelationship({
      id: `${contractNode}->${sourceNode}`,
      from: contractNode,
      to: sourceNode,
      type: "supported_by",
      label: "supported by",
      explanation: `The ${source.label.toLowerCase()} are mapped to this contract and can be opened as evidence.`,
      sourceRefs: sourceRefs(source.rows, contractId),
      confidence: "high",
    });
  }
  const owner = text(contract, "business_owner");
  if (owner) {
    const ownerNode = `owner:${owner}`;
    addNode({
      id: ownerNode,
      kind: "owner",
      label: owner,
      description: "The business owner named in the contract register.",
      sourceRefs: [sourceRef(contract, contractId)],
    });
    addRelationship({
      id: `${contractNode}->${ownerNode}`,
      from: contractNode,
      to: ownerNode,
      type: "owned_by",
      label: "owned by",
      explanation:
        "This owner is the accountable business contact recorded for the agreement.",
      sourceRefs: [sourceRef(contract, contractId)],
      confidence: "high",
    });
  }
  for (const row of levers) {
    const leverId = text(row, "lever_id") || sourceRef(row, "lever");
    const leverNode = `lever:${leverId}`;
    addNode({
      id: leverNode,
      kind: "lever",
      label:
        text(row, "lever_type").replaceAll("_", " ") || "Negotiation lever",
      description: text(row, "buyer_ask") || "Buyer ask not loaded.",
      sourceRefs: [sourceRef(row, leverId)],
    });
    addRelationship({
      id: `${contractNode}->${leverNode}`,
      from: contractNode,
      to: leverNode,
      type: "creates_opportunity",
      label: "creates opportunity",
      explanation:
        "The lever is a documented action connected to the contract evidence, not a free-form suggestion.",
      sourceRefs: [sourceRef(row, leverId)],
      confidence: "high",
    });
  }
  return {
    plainEnglish: `This map shows what the contract is, who provides it, which archetype governs the reading, what workloads it covers, which evidence sources support it, and which documented actions follow from those facts.`,
    nodes,
    relationships,
  };
}

function buildContractRecord(
  input: ContractDepthPackageInput,
  contract: CsvRecord,
): ContractIntelligenceRecord {
  const contractId = text(contract, "contract_id");
  const scope = input.applicationScope.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const spend = input.monthlySpend.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const invoices = input.invoiceLineDetail.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const performance = input.slaPerformance.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const tickets = input.ticketVolumetrics.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const documents = input.evidenceManifest.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const pages = input.contractPageText.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const clauses = input.contractClauses.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const changes = input.changeOrders.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const opportunities = input.optimizationOpportunities.filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const findings = (input.negotiationFindings ?? []).filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const levers = (input.negotiationLevers ?? []).filter(
    (row) => text(row, "contract_id") === contractId,
  );
  const annualCommitment =
    number(contract, "committed_annual_spend_usd") ??
    number(contract, "annual_value_usd");
  const observedSpend =
    spend.length > 0
      ? sumFirstAvailable(spend, ["actual_spend_usd", "spend_usd"])
      : number(contract, "actual_annual_spend_usd");
  const utilization =
    annualCommitment && observedSpend !== null
      ? (observedSpend / annualCommitment) * 100
      : null;
  const scopeNames = unique(
    scope.map(
      (row) => text(row, "application_name") || text(row, "application_id"),
    ),
  );
  const activeScope = scope.filter((row) =>
    text(row, "scope_status").includes("active"),
  ).length;
  const plannedScope = scope.filter((row) =>
    text(row, "scope_status").includes("planned"),
  ).length;
  const archetype = text(contract, "archetype") || text(contract, "category");
  const missingEvidence: string[] = [];
  if (documents.length === 0)
    missingEvidence.push("the governing contract document");
  if (scope.length === 0)
    missingEvidence.push("the applications or services covered");
  if (spend.length === 0) missingEvidence.push("monthly consumption or spend");
  if (invoices.length === 0) missingEvidence.push("invoice detail");
  const performanceRequired =
    archetype.includes("managed_services") ||
    text(contract, "category").toLowerCase().includes("managed services");
  if (performanceRequired && performance.length === 0 && tickets.length === 0)
    missingEvidence.push("service performance or ticket evidence");
  if (pages.length === 0) missingEvidence.push("searchable document text");
  const reviewStatus: ContractIntelligenceReviewStatus =
    missingEvidence.length === 0 ? "reviewed" : "blocked_missing_evidence";
  const purpose = `${text(contract, "vendor_name")} provides ${humanArchetype(archetype)} under this agreement. ${scopeNames.length > 0 ? `The loaded scope names ${scopeNames.slice(0, 4).join(", ")}${scopeNames.length > 4 ? " and other workloads" : ""}.` : "The agreement's covered applications and services are not loaded yet."}`;
  const evidenceBoundary =
    missingEvidence.length > 0
      ? `The next conclusion is blocked until ${missingEvidence.join(", ")}.`
      : "The loaded contract, commercial, usage, invoice, and performance records support a decision view.";
  const metrics: ContractIntelligenceMetric[] = [
    {
      key: "annual_commitment",
      label: "Annual commitment",
      value: money(annualCommitment),
      meaning:
        "The recurring amount the agreement commits the buyer to before actual usage is considered.",
      sourceRefs: [sourceRef(contract, contractId)],
    },
    {
      key: "observed_spend",
      label: "Observed spend",
      value: money(observedSpend),
      meaning:
        "The amount present in the loaded monthly spend rows or contract baseline.",
      sourceRefs: sourceRefs(spend, sourceRef(contract, contractId)),
    },
    {
      key: "usage_against_commitment",
      label: "Usage against commitment",
      value: percent(utilization),
      meaning:
        "How much of the annual commitment the loaded spend represents; it is not a savings claim.",
      sourceRefs: [
        sourceRef(contract, contractId),
        ...sourceRefs(spend, contractId),
      ],
    },
    {
      key: "documented_levers",
      label: "Documented negotiation levers",
      value: String(levers.length || opportunities.length),
      meaning:
        "Structured asks connected to contract evidence; finance confirmation is still a separate gate.",
      sourceRefs:
        levers.length > 0
          ? sourceRefs(levers, contractId)
          : sourceRefs(opportunities, contractId),
    },
  ];
  const facts: ContractIntelligenceFact[] = [
    {
      key: "contract_term",
      label: "Contract term",
      value: `${text(contract, "start_date")} to ${text(contract, "end_date")}`,
      meaning:
        "The loaded agreement dates used for renewal and timing decisions.",
      sourceRefs: [sourceRef(contract, contractId)],
      confidence: "high",
      reviewStatus: "reviewed",
    },
    {
      key: "scope_coverage",
      label: "What the contract covers",
      value:
        scope.length > 0
          ? `${scope.length} named scope rows`
          : "Not established",
      meaning:
        scope.length > 0
          ? `${activeScope} active and ${plannedScope} planned scope rows are loaded.`
          : "No governed scope rows are loaded, so the blast radius cannot be stated.",
      sourceRefs: sourceRefs(scope, contractId),
      confidence: scope.length > 0 ? "high" : "low",
      reviewStatus: scope.length > 0 ? "reviewed" : "blocked_missing_evidence",
    },
    {
      key: "document_basis",
      label: "Document basis",
      value:
        documents.length > 0
          ? `${documents.length} source documents`
          : "Not established",
      meaning:
        pages.length > 0
          ? `${pages.length} searchable page rows are available for traceability.`
          : "The document inventory may exist without searchable page text.",
      sourceRefs: sourceRefs(documents, contractId),
      confidence: documents.length > 0 && pages.length > 0 ? "high" : "low",
      reviewStatus:
        documents.length > 0 && pages.length > 0
          ? "reviewed"
          : "blocked_missing_evidence",
    },
  ];
  const lanes: ContractIntelligenceEvidenceLane[] = [
    lane(
      "contract",
      "Governing agreement",
      documents,
      true,
      documents.length > 0
        ? "The agreement is mapped to this contract."
        : "No governing agreement is mapped to this contract.",
      contractId,
    ),
    lane(
      "scope",
      "Applications and services",
      scope,
      true,
      scope.length > 0
        ? "The covered workloads or services are named."
        : "The covered workloads or services are not yet named.",
      contractId,
    ),
    lane(
      "commercial",
      "Commercial terms",
      clauses,
      true,
      clauses.length > 0
        ? "Extracted clauses support the commercial reading."
        : "Commercial clauses are not loaded.",
      contractId,
    ),
    lane(
      "spend",
      "Consumption or spend",
      spend,
      true,
      spend.length > 0
        ? "Monthly spend rows support the baseline."
        : "No monthly spend rows support the baseline.",
      contractId,
    ),
    lane(
      "invoice",
      "Invoice detail",
      invoices,
      true,
      invoices.length > 0
        ? "Invoice lines support reconciliation."
        : "Invoice detail is not loaded.",
      contractId,
    ),
    lane(
      "performance",
      "Service performance",
      performance.length > 0 || tickets.length > 0
        ? [...performance, ...tickets]
        : [],
      false,
      performance.length > 0 || tickets.length > 0
        ? "Performance or ticket evidence is available."
        : "No performance or ticket evidence is loaded.",
      contractId,
    ),
    lane(
      "change_orders",
      "Change orders",
      changes,
      false,
      changes.length > 0
        ? "Change-order exposure is visible."
        : "No change-order rows are loaded.",
      contractId,
    ),
  ];
  const derivedInsights: ContractIntelligenceDerivedInsight[] = [];
  if (
    annualCommitment !== null &&
    observedSpend !== null &&
    annualCommitment > observedSpend
  ) {
    derivedInsights.push({
      key: "commercial_posture",
      label: "Commercial posture",
      statement:
        "The loaded evidence points to a commitment-shape discussion, not a service-failure claim.",
      whyItMatters:
        "The buyer should change the timing or basis of the commitment only after the usage and contract terms are reviewed together.",
      sourceRefs: [
        sourceRef(contract, contractId),
        ...sourceRefs(spend, contractId),
      ],
      confidence: "high",
      reviewStatus: "draft",
    });
  }
  if (performanceRequired && performance.length === 0 && tickets.length === 0) {
    derivedInsights.push({
      key: "performance_boundary",
      label: "Performance boundary",
      statement:
        "There is no loaded service-performance evidence to support a performance concession.",
      whyItMatters:
        "The negotiation should stay focused on commercial structure until service-level records are loaded.",
      sourceRefs: [contractId],
      confidence: "high",
      reviewStatus: "draft",
    });
  }
  const findingRows = buildFindings(findings);
  const leverRows = buildLevers(levers);
  const sourceRowRefs = unique([
    sourceRef(contract, contractId),
    ...sourceRefs(scope, contractId),
    ...sourceRefs(spend, contractId),
    ...sourceRefs(invoices, contractId),
    ...sourceRefs(documents, contractId),
    ...sourceRefs(clauses, contractId),
    ...sourceRefs(opportunities, contractId),
    ...sourceRefs(findings, contractId),
    ...sourceRefs(levers, contractId),
  ]);
  return {
    contractId,
    vendorName: text(contract, "vendor_name"),
    contractName: text(contract, "contract_name"),
    category: text(contract, "category"),
    archetype,
    story: {
      headline:
        missingEvidence.length > 0
          ? "A usable baseline exists, but the decision is gated by missing evidence."
          : "The loaded evidence supports a contract decision.",
      purpose,
      scope:
        scope.length > 0
          ? `${scope.length} named scope rows: ${scopeNames.slice(0, 4).join(", ")}.`
          : "Scope is not established from governed rows.",
      decision:
        leverRows.length > 0
          ? `The next decision is to review ${leverRows.length} documented negotiation lever${leverRows.length === 1 ? "" : "s"}, in order of timing and evidence.`
          : "No documented negotiation lever is loaded yet.",
      evidenceBoundary,
    },
    baseline: { metrics, facts },
    evidenceLanes: lanes,
    anatomy: buildAnatomy(
      contract,
      scope,
      documents,
      clauses,
      spend,
      invoices,
      performance,
      tickets,
      changes,
      opportunities,
      levers,
      archetype,
    ),
    findings: findingRows,
    levers: leverRows,
    derivedInsights,
    industryIntelligence: {
      state: "missing_benchmark",
      archetype: humanArchetype(archetype),
      plainEnglish: `The ${humanArchetype(archetype)} playbook can identify relevant negotiation questions, but no external market benchmark is loaded for this contract.`,
      benchmarkBoundary:
        "Do not present a market percentile, discount range, or industry rate without a cited benchmark source.",
    },
    review: {
      status: reviewStatus,
      plainEnglish:
        reviewStatus === "blocked_missing_evidence"
          ? `This record is not ready for an executive claim because ${missingEvidence.join(", ")} ${missingEvidence.length === 1 ? "is" : "are"} missing.`
          : "This record has the minimum evidence required for a reviewable decision view.",
      missingEvidence,
    },
    provenance: {
      tenantKey: text(contract, "tenant_key"),
      datasetVersion: text(contract, "dataset_version"),
      modelVersion: MODEL_VERSION,
      sourceRefs: sourceRowRefs,
      loadRunId: null,
    },
  };
}

export function buildContractIntelligenceRecords(
  input: ContractDepthPackageInput,
): ContractIntelligenceRecord[] {
  return input.contracts.map((contract) =>
    buildContractRecord(input, contract),
  );
}

export function buildContractIntelligenceReadout(
  records: readonly ContractIntelligenceRecord[],
): ContractIntelligenceReadout {
  const ready = records.filter(
    (record) =>
      record.review.status === "reviewed" ||
      record.review.status === "approved",
  );
  const blocked = records.filter(
    (record) => record.review.status === "blocked_missing_evidence",
  );
  const leverCount = records.reduce(
    (total, record) => total + record.levers.length,
    0,
  );
  const sourceRefs = unique(
    records.flatMap((record) => record.provenance.sourceRefs),
  );
  return {
    headline:
      records.length === 0
        ? "No governed contract intelligence is loaded yet."
        : ready.length > 0
          ? "The loaded contract set separates decisions that are ready from decisions that need evidence."
          : "The loaded contract set has useful facts, but it is not yet ready for executive claims.",
    subhead:
      records.length === 0
        ? "Load a governed contract package before showing a decision story."
        : "Every statement below is tied to a contract record and source reference.",
    metrics: [
      {
        key: "contracts_with_intelligence",
        label: "Contracts with a governed intelligence record",
        value: String(records.length),
        meaning:
          "A contract has an identity, purpose, evidence lanes, anatomy, and provenance record.",
        sourceRefs,
      },
      {
        key: "contracts_ready_for_review",
        label: "Contracts ready for an evidence-backed decision review",
        value: String(ready.length),
        meaning:
          "Required evidence lanes are loaded well enough to support a reviewable decision story.",
        sourceRefs: ready.flatMap((record) => record.provenance.sourceRefs),
      },
      {
        key: "contracts_needing_evidence",
        label: "Contracts needing more evidence before action",
        value: String(blocked.length),
        meaning:
          "The record is useful for directing the next data request, but it must not be presented as a completed recommendation.",
        sourceRefs: blocked.flatMap((record) => record.provenance.sourceRefs),
      },
      {
        key: "documented_levers",
        label: "Documented negotiation levers",
        value: String(leverCount),
        meaning:
          "Levers loaded from structured contract findings; amounts remain candidate until finance confirms them.",
        sourceRefs: records.flatMap((record) =>
          record.levers.flatMap((lever) => lever.sourceRefs),
        ),
      },
    ],
    interpretation:
      blocked.length > 0
        ? "The portfolio is not empty; it is explicit about where the evidence stops. The next action is to close the named evidence gaps, not to fill the screen with placeholder claims."
        : "The portfolio can support executive review because each contract has a decision story and a traceable evidence boundary.",
    nextQuestion:
      blocked.length > 0
        ? "Which missing evidence source should be loaded first to unblock the highest-value contract decision?"
        : "Which reviewed contract decision should move into an approved action workflow?",
    sourceRefs,
  };
}

export { MODEL_VERSION };
