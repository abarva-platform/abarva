#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const releaseId = "airline-demo-new-source-operational-demo-v1.0.0";
const tenantKey = "airline-demo-new";
const outDir = path.join(
  root,
  "clients",
  tenantKey,
  "23-source-operational-demo",
  releaseId,
);
const runtimeFixtureDir = path.join(
  root,
  "scripts",
  "source",
  "fixtures",
  releaseId,
);
const outputDirs = [outDir, runtimeFixtureDir];

const event = {
  eventId: "srcop-airdn-ops-crew-platform-2026",
  eventCode: "AIRDN-OPS-CREW-DATA-2026",
  tenantKey,
  releaseId,
  scenario: "OPERATIONAL RECOVERY AND CREW DATA PLATFORM SELECTION",
  name: "Operational Recovery and Crew Data Platform Selection",
  currentStage: "executive_decision",
  syntheticDataLabel: "synthetic_source_operational_demo",
  knowledgeContext: {
    provider: "KnowledgeConsumptionProvider",
    tenantKey,
    frozenV1Status: "EXISTING LIVE AIRLINE CORPUS RECONCILED THROUGH CUBE",
    baselineRef: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
    limitation:
      "Live Knowledge contains 10 interview rows; leadership/C-suite completeness is not certified.",
  },
};

const categories = [
  "business",
  "operational",
  "architecture",
  "data",
  "security",
  "implementation",
  "commercial",
];

const requirements = [
  ["REQ-BUS-01", "business", "Protect irregular-operations recovery value with auditable decision support.", 5],
  ["REQ-BUS-02", "business", "Reduce crew reassignment cycle time during disruption events.", 5],
  ["REQ-BUS-03", "business", "Expose finance-ready value and cost attribution by operating lever.", 4],
  ["REQ-OPS-01", "operational", "Support crew legality, fatigue, and contract-rule checks in planning workflows.", 5],
  ["REQ-OPS-02", "operational", "Provide station, aircraft, and crew-state synchronization for recovery teams.", 5],
  ["REQ-OPS-03", "operational", "Support playbook execution with role-based action logs.", 4],
  ["REQ-OPS-04", "operational", "Maintain degraded-mode recovery workflow when an upstream feed is delayed.", 4],
  ["REQ-ARC-01", "architecture", "Integrate with operations control, crew management, data platform, and notification services.", 5],
  ["REQ-ARC-02", "architecture", "Use tenant-scoped APIs and avoid direct UI access to raw Knowledge tables.", 5],
  ["REQ-ARC-03", "architecture", "Expose Source workflow state through SourceOperationalProvider.", 5],
  ["REQ-ARC-04", "architecture", "Emit deterministic view models through SourceViewModelAssembler.", 4],
  ["REQ-DAT-01", "data", "Resolve crew, flight, aircraft, station, and disruption entities with stable IDs.", 5],
  ["REQ-DAT-02", "data", "Carry evidence references and known gaps for every decision-critical claim.", 5],
  ["REQ-DAT-03", "data", "Support lineage from proposal response to evaluation score to recommendation.", 4],
  ["REQ-DAT-04", "data", "Keep Source operational records separate from canonical Knowledge publications.", 5],
  ["REQ-SEC-01", "security", "Enforce tenant isolation for records, artifacts, and generated Decision Briefs.", 5],
  ["REQ-SEC-02", "security", "Support least-privilege evaluator access and audit logging.", 4],
  ["REQ-SEC-03", "security", "Do not weaken storage, database, auth, or provider security controls.", 5],
  ["REQ-IMP-01", "implementation", "Deliver a staged migration with parallel run and rollback checkpoints.", 4],
  ["REQ-IMP-02", "implementation", "Provide training, transition commitments, and hypercare measures.", 4],
  ["REQ-IMP-03", "implementation", "Demonstrate no SkyHarbor or non-airline tenant fallback in demo paths.", 5],
  ["REQ-COM-01", "commercial", "Normalize pricing across platform, implementation, support, and usage lines.", 5],
  ["REQ-COM-02", "commercial", "Tie BAFO changes to score, risk, and transition commitments.", 4],
  ["REQ-COM-03", "commercial", "Define service credits and value tracking for recovery performance.", 4],
].map(([id, category, statement, weight]) => ({
  id,
  eventId: event.eventId,
  category,
  statement,
  weight,
  syntheticDataLabel: event.syntheticDataLabel,
  evidenceRefs: [
    `knowledge:${tenantKey}:frozen-v1:${category}`,
    `source:${releaseId}:requirements:${id}`,
  ],
}));

const vendors = [
  ["VEND-AIRDN-ORBIT", "OrbitOps Cloud", "balanced", 1.03, 86, 82, 88, "medium"],
  ["VEND-AIRDN-CREWLINE", "CrewLine Systems", "operator specialist", 1.08, 91, 79, 84, "medium-low"],
  ["VEND-AIRDN-SKYFORGE", "SkyForge Data", "data platform", 0.96, 83, 88, 78, "medium"],
  ["VEND-AIRDN-GROUNDLOOP", "GroundLoop Services", "commercial challenger", 0.91, 76, 93, 72, "high"],
].map(([id, name, posture, priceIndex, technicalBase, commercialBase, transitionBase, risk]) => ({
  id,
  eventId: event.eventId,
  displayName: name,
  posture,
  priceIndex,
  technicalBase,
  commercialBase,
  transitionBase,
  risk,
  syntheticDataLabel: event.syntheticDataLabel,
}));

const criteria = [
  ["CRIT-TECH", "Operational and technical fit", 35],
  ["CRIT-DATA", "Data lineage and integration", 20],
  ["CRIT-SEC", "Security and tenant isolation", 15],
  ["CRIT-COMM", "Commercial value and pricing clarity", 20],
  ["CRIT-TRANS", "Transition risk and commitments", 10],
].map(([id, label, weightPct]) => ({ id, label, weightPct }));

const proposalResponses = vendors.flatMap((vendor) =>
  requirements.map((requirement, index) => {
    const pattern = (index + vendor.id.length) % 4;
    const status = pattern === 0 ? "partial" : pattern === 1 ? "addressed" : "addressed";
    const score =
      status === "partial"
        ? Math.max(68, Math.round(vendor.technicalBase - 9 + (requirement.weight % 3)))
        : Math.min(96, Math.round(vendor.technicalBase + (requirement.weight % 4)));
    return {
      id: `RESP-${vendor.id}-${requirement.id}`,
      eventId: event.eventId,
      proposalId: `PROP-${vendor.id}`,
      vendorId: vendor.id,
      requirementId: requirement.id,
      status,
      score,
      response:
        status === "partial"
          ? `${vendor.displayName} partially addresses ${requirement.id}; BAFO clarification required.`
          : `${vendor.displayName} addresses ${requirement.id} with named operational controls.`,
      evidenceRefs: [`source:${releaseId}:proposal:${vendor.id}:${requirement.id}`],
      syntheticDataLabel: event.syntheticDataLabel,
    };
  }),
);

const proposals = vendors.map((vendor) => ({
  id: `PROP-${vendor.id}`,
  eventId: event.eventId,
  vendorId: vendor.id,
  summary: `${vendor.displayName} proposal for operational recovery and crew data platform selection.`,
  coveragePct: Math.round(
    (proposalResponses.filter((r) => r.vendorId === vendor.id && r.status === "addressed").length /
      requirements.length) *
      100,
  ),
  assumptions: [
    "Client confirms access to disruption history and crew legality feeds.",
    "Parallel run uses lab-only Source operational records.",
  ],
  risks: [
    vendor.risk === "high"
      ? "Compressed transition and support assumptions require risk-owner signoff."
      : "Transition dependencies require named owner acceptance.",
  ],
  syntheticDataLabel: event.syntheticDataLabel,
}));

const evaluations = vendors.map((vendor) => {
  const scores = {
    "CRIT-TECH": vendor.technicalBase,
    "CRIT-DATA": Math.round((vendor.technicalBase + vendor.transitionBase) / 2),
    "CRIT-SEC": vendor.risk === "high" ? 74 : 86,
    "CRIT-COMM": vendor.commercialBase,
    "CRIT-TRANS": vendor.transitionBase,
  };
  const weightedScore = round2(
    criteria.reduce((sum, criterion) => sum + (scores[criterion.id] * criterion.weightPct) / 100, 0),
  );
  return {
    id: `EVAL-${vendor.id}`,
    eventId: event.eventId,
    proposalId: `PROP-${vendor.id}`,
    vendorId: vendor.id,
    scores,
    weightedScore,
    evaluatorComment:
      vendor.risk === "high"
        ? "Strong price position but transition and support assumptions need BAFO protection."
        : "Coherent response with traceable controls and manageable transition risk.",
    syntheticDataLabel: event.syntheticDataLabel,
  };
});

const pricing = vendors.map((vendor) => {
  const platform = Math.round(7600000 * vendor.priceIndex);
  const implementation = Math.round(4200000 * vendor.priceIndex);
  const support = Math.round(3100000 * vendor.priceIndex);
  const usage = Math.round(1800000 * vendor.priceIndex);
  const serviceCreditCapPct = vendor.risk === "high" ? 6 : 10;
  const totalYearOne = platform + implementation + support + usage;
  return {
    id: `PRICE-${vendor.id}`,
    eventId: event.eventId,
    proposalId: `PROP-${vendor.id}`,
    vendorId: vendor.id,
    currency: "USD",
    lines: [
      { type: "platform", amountUsd: platform },
      { type: "implementation", amountUsd: implementation },
      { type: "managed_support", amountUsd: support },
      { type: "usage_and_recovery_events", amountUsd: usage },
    ],
    totalYearOneUsd: totalYearOne,
    serviceCreditCapPct,
    syntheticDataLabel: event.syntheticDataLabel,
  };
});

const bafo = vendors.map((vendor) => ({
  id: `BAFO-${vendor.id}`,
  eventId: event.eventId,
  proposalId: `PROP-${vendor.id}`,
  vendorId: vendor.id,
  requestedChanges: [
    "Confirm transition go/no-go dependencies.",
    "Clarify service credits for recovery-performance misses.",
    "Confirm data lineage and audit export commitments.",
  ],
  revisedTotalYearOneUsd: Math.round(
    pricing.find((p) => p.vendorId === vendor.id).totalYearOneUsd *
      (vendor.id === "VEND-AIRDN-CREWLINE" ? 0.97 : vendor.id === "VEND-AIRDN-GROUNDLOOP" ? 0.99 : 0.98),
  ),
  references: [`PROP-${vendor.id}`, `EVAL-${vendor.id}`, `PRICE-${vendor.id}`],
  syntheticDataLabel: event.syntheticDataLabel,
}));

const finalScores = evaluations.map((evaluation) => {
  const price = pricing.find((p) => p.vendorId === evaluation.vendorId);
  const bafoRow = bafo.find((b) => b.vendorId === evaluation.vendorId);
  const lowestBafo = Math.min(...bafo.map((b) => b.revisedTotalYearOneUsd));
  const priceScore = round2((lowestBafo / bafoRow.revisedTotalYearOneUsd) * 100);
  const riskPenalty = vendors.find((v) => v.id === evaluation.vendorId).risk === "high" ? 5 : 0;
  const finalScore = round2(evaluation.weightedScore * 0.75 + priceScore * 0.25 - riskPenalty);
  return {
    vendorId: evaluation.vendorId,
    proposalId: evaluation.proposalId,
    evaluationScore: evaluation.weightedScore,
    priceScore,
    finalScore,
    yearOneUsd: price.totalYearOneUsd,
    bafoYearOneUsd: bafoRow.revisedTotalYearOneUsd,
    riskPenalty,
  };
});

const winner = finalScores.slice().sort((a, b) => b.finalScore - a.finalScore)[0];

const recommendation = {
  id: "REC-AIRDN-OPS-CREW-2026",
  eventId: event.eventId,
  recommendedVendorId: winner.vendorId,
  decision: "recommend_award_pending_lab_proof",
  rationale:
    "Recommended vendor has the strongest combined operational, data-lineage, transition, and BAFO-adjusted value score.",
  finalScores,
  evidenceRefs: [
    `source:${releaseId}:evaluation`,
    `source:${releaseId}:pricing`,
    `source:${releaseId}:bafo`,
    `knowledge:${tenantKey}:frozen-v1:evidence-gaps`,
  ],
  syntheticDataLabel: event.syntheticDataLabel,
};

const transitionCommitments = [
  ["TRANS-01", "Access and feed readiness", "Named data-feed owners confirmed before kickoff", "week 1"],
  ["TRANS-02", "Parallel-run checkpoint", "Recovery recommendations compared against current operating process", "weeks 2-4"],
  ["TRANS-03", "Knowledge transfer", "Runbooks and escalation playbooks accepted by operations control", "weeks 3-6"],
  ["TRANS-04", "Hypercare", "Daily recovery-performance review through first disruption simulation", "weeks 6-10"],
].map(([id, title, commitment, window]) => ({
  id,
  eventId: event.eventId,
  vendorId: winner.vendorId,
  title,
  commitment,
  window,
  references: [recommendation.id, `BAFO-${winner.vendorId}`],
  syntheticDataLabel: event.syntheticDataLabel,
}));

const valueScorecard = {
  id: "VALUE-AIRDN-OPS-CREW-2026",
  eventId: event.eventId,
  metrics: [
    { id: "VAL-01", label: "Recovery-cycle productivity", annualValueUsd: 6200000, confidence: "medium" },
    { id: "VAL-02", label: "Avoided disruption support leakage", annualValueUsd: 4100000, confidence: "medium" },
    { id: "VAL-03", label: "Crew reassignment delay reduction", annualValueUsd: 5300000, confidence: "low" },
    { id: "VAL-04", label: "Service-credit protection", annualValueUsd: 2100000, confidence: "medium" },
  ],
  totalAnnualValueUsd: 17700000,
  caveat:
    "Planning-grade synthetic operational value scorecard; not a live client savings claim.",
  syntheticDataLabel: event.syntheticDataLabel,
};

const decisionBrief = {
  id: "DBRIEF-AIRDN-OPS-CREW-2026",
  eventId: event.eventId,
  title: "Decision Brief - Operational Recovery and Crew Data Platform Selection",
  sections: [
    "Scenario and governed V1 context",
    "Requirements and proposal coverage",
    "Weighted evaluation and pricing parity",
    "BAFO changes and transition commitments",
    "Recommendation and remaining limitations",
  ],
  exportProofRequired: true,
  syntheticDataLabel: event.syntheticDataLabel,
};

const release = {
  event,
  requirements,
  vendors,
  proposals,
  proposalResponses,
  criteria,
  evaluations,
  pricing,
  bafo,
  recommendation,
  transitionCommitments,
  valueScorecard,
  decisionBrief,
};

const validation = validateRelease(release);
if (!validation.ok) {
  console.error(JSON.stringify(validation, null, 2));
  process.exit(1);
}

for (const dir of outputDirs) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
writeJson("release.json", release);
writeJson("validation-summary.json", validation);

const releaseHash = sha256(JSON.stringify(canonicalize(release)));
const manifest = {
  releaseId,
  tenantKey,
  generatedAt: "2026-07-30T00:00:00.000Z",
  sourceBasis: "synthetic_source_operational_demo",
  knowledgeContext: event.knowledgeContext,
  releaseHashSha256: releaseHash,
  objectCounts: validation.objectCounts,
  loadPolicy: {
    allowed: "lab_only_source_operational_schema",
    forbidden: [
      "canonical_knowledge_promotion",
      "knowledge_publication",
      "baseline_activation",
      "offline_augmentation_ingestion",
      "production_provider_cutover",
    ],
  },
  expectedUiConsumers: [
    "SourceOperationalProvider",
    "SourceViewModelAssembler",
    "SourceAnalyticsCanvas",
    "Decision Brief export",
  ],
};
writeJson("release-manifest.json", manifest);

const hashLines = [
  `${releaseHash}  release.json`,
  `${sha256(JSON.stringify(canonicalize(validation)))}  validation-summary.json`,
  `${sha256(JSON.stringify(canonicalize(manifest)))}  release-manifest.json`,
  "",
].join("\n");
fs.writeFileSync(path.join(outDir, "SHA256SUMS"), hashLines);
fs.writeFileSync(path.join(runtimeFixtureDir, "SHA256SUMS"), hashLines);

console.log(`Generated ${releaseId}`);
console.log(`releaseHashSha256=${releaseHash}`);
console.log(`outDir=${outDir}`);
console.log(`runtimeFixtureDir=${runtimeFixtureDir}`);

function validateRelease(input) {
  const errors = [];
  const objectCounts = {};
  for (const [key, value] of Object.entries(input)) {
    objectCounts[key] = Array.isArray(value) ? value.length : 1;
  }
  const ids = new Map();
  for (const [key, value] of Object.entries(input)) {
    const rows = Array.isArray(value) ? value : [value];
    for (const row of rows) {
      if (!row.id) continue;
      if (ids.has(row.id)) errors.push(`duplicate id ${row.id}`);
      ids.set(row.id, key);
    }
  }
  if (input.event.tenantKey !== tenantKey) errors.push("tenant mismatch");
  if (input.event.releaseId !== releaseId) errors.push("release mismatch");
  if (input.requirements.length < 20 || input.requirements.length > 30) {
    errors.push("requirements count must be 20-30");
  }
  for (const category of categories) {
    if (!input.requirements.some((r) => r.category === category)) {
      errors.push(`missing requirement category ${category}`);
    }
  }
  if (input.vendors.length !== 4) errors.push("vendor count must be 4");
  const criteriaWeight = input.criteria.reduce((sum, c) => sum + c.weightPct, 0);
  if (criteriaWeight !== 100) errors.push(`criteria weights sum to ${criteriaWeight}`);
  for (const proposal of input.proposals) {
    const coverage = input.proposalResponses.filter((r) => r.proposalId === proposal.id);
    if (coverage.length !== input.requirements.length) {
      errors.push(`${proposal.id} does not cover every requirement`);
    }
  }
  for (const evaluation of input.evaluations) {
    const recomputed = round2(
      input.criteria.reduce((sum, criterion) => sum + (evaluation.scores[criterion.id] * criterion.weightPct) / 100, 0),
    );
    if (recomputed !== evaluation.weightedScore) {
      errors.push(`${evaluation.id} weighted score mismatch`);
    }
  }
  for (const price of input.pricing) {
    const recomputed = price.lines.reduce((sum, line) => sum + line.amountUsd, 0);
    if (recomputed !== price.totalYearOneUsd) {
      errors.push(`${price.id} pricing total mismatch`);
    }
  }
  for (const bafoRow of input.bafo) {
    for (const ref of bafoRow.references) {
      if (!ids.has(ref)) errors.push(`${bafoRow.id} bad reference ${ref}`);
    }
  }
  for (const commitment of input.transitionCommitments) {
    for (const ref of commitment.references) {
      if (!ids.has(ref)) errors.push(`${commitment.id} bad reference ${ref}`);
    }
  }
  const syntheticMissing = [];
  for (const [key, value] of Object.entries(input)) {
    const rows = Array.isArray(value) ? value : [value];
    for (const row of rows) {
      if (row && typeof row === "object" && "syntheticDataLabel" in row) {
        if (row.syntheticDataLabel !== "synthetic_source_operational_demo") {
          syntheticMissing.push(`${key}:${row.id ?? "object"}`);
        }
      }
    }
  }
  if (syntheticMissing.length) errors.push(`synthetic labels invalid: ${syntheticMissing.join(",")}`);
  if (input.recommendation.recommendedVendorId !== winner.vendorId) {
    errors.push("recommendation winner mismatch");
  }
  if (input.valueScorecard.totalAnnualValueUsd !== input.valueScorecard.metrics.reduce((sum, m) => sum + m.annualValueUsd, 0)) {
    errors.push("value scorecard total mismatch");
  }
  return {
    ok: errors.length === 0,
    releaseId,
    tenantKey,
    objectCounts,
    checks: {
      primaryKeys: errors.filter((e) => e.includes("duplicate")).length === 0,
      foreignKeys: errors.filter((e) => e.includes("bad reference")).length === 0,
      criteriaWeights: criteriaWeight === 100,
      scoreRecomputation: errors.filter((e) => e.includes("weighted score")).length === 0,
      pricingRecomputation: errors.filter((e) => e.includes("pricing total")).length === 0,
      proposalCoverage: errors.filter((e) => e.includes("does not cover")).length === 0,
      bafoReferences: errors.filter((e) => e.startsWith("BAFO")).length === 0,
      transitionReferences: errors.filter((e) => e.startsWith("TRANS")).length === 0,
      syntheticLabels: syntheticMissing.length === 0,
    },
    errors,
  };
}

function writeJson(name, value) {
  for (const dir of outputDirs) {
    fs.writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
}
