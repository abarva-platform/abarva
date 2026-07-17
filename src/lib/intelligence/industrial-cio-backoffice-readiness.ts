import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type ClaimMaturity =
  | "loaded_fact"
  | "calculated"
  | "relationship_inferred"
  | "abarva_assessment"
  | "industry_context"
  | "client_signoff_required"
  | "missing_evidence";

export interface ClaimMaturityEntry {
  statement: string;
  maturity: ClaimMaturity;
  basis: string;
  confidence: "high" | "medium" | "low";
  signoffRequired: boolean;
}

export interface BranchChoice {
  id: string;
  label: string;
  description: string;
}

export interface DecisionBranch {
  question: string;
  choices: BranchChoice[];
  customAllowed: boolean;
  rawBlock: string;
}

export interface IndustrialCioBackofficePacket {
  tenantKey: "lakeshore-holdings";
  packetId: "industrial-cio-backoffice-value-office-v1";
  decision: "prove_shared_services_value_office_with_finance_treasury_first";
  morganStreetGoal: string;
  valueMechanism: string;
  functions: V6Record[];
  ownership: V6Record[];
  systems: V6Record[];
  dataAssets: V6Record[];
  programs: V6Record[];
  aiInitiatives: V6Record[];
  risksControls: V6Record[];
  spend: V6Record[];
  relationships: V6Record[];
  evidenceSources: V6Record[];
  metrics: V6Record[];
  industryPatterns: V6Record[];
  expertLenses: V6Record[];
  lighthouseUseCases: LighthouseUseCase[];
  missingEvidenceChecklist: string[];
  planningAssumptions: string[];
  claimMaturity: ClaimMaturityEntry[];
  branch: DecisionBranch;
  sourceFiles: string[];
}

export interface LighthouseUseCase {
  name: string;
  function: string;
  posture: "prove_now" | "shape_next" | "hold_until_input";
  why: string;
  tenantEvidence: string[];
  missingToScale: string[];
}

export type V6Record = Record<string, string>;

const REQUIRED_SOURCE_FILES = [
  "V6_02_business_functions.csv",
  "V6_03_org_ownership.csv",
  "V6_05_applications_systems.csv",
  "V6_06_data_assets_integrations.csv",
  "V6_08_spend_value.csv",
  "V6_09_programs_initiatives.csv",
  "V6_10_ai_initiatives.csv",
  "V6_11_operations_risk_controls.csv",
  "V6_12_relationships.csv",
  "V6_13_evidence_sources.csv",
  "V6_14_metric_definitions.csv",
  "V6_15_industry_corpus_patterns.csv",
  "V6_16_expert_lenses.csv",
] as const;

const BRANCH_MARKER = "[DECISION_BRANCH]";

const BACKOFFICE_RE =
  /\b(treasury|kyriba|finance|fp&a|fpa|controller|close|cash|payment|bank|sox|blackline|hyperion|servicenow|copilot|shared\s+services|service\s+desk|workday|hr|legal|contract|clm|ai\s+enablement|value\s+office|innovation\s+office|back[-\s]?office|process\s+transformation|automation)\b/i;

export function buildIndustrialCioBackofficePacket(
  repoRoot = process.cwd(),
): IndustrialCioBackofficePacket {
  const datasetRoot = path.join(
    repoRoot,
    "datasets",
    "lakeshore-holdings-synthetic-v6",
    "templates",
  );
  const files = Object.fromEntries(
    REQUIRED_SOURCE_FILES.map((file) => [file, readV6File(datasetRoot, file)]),
  );
  const functions = filterBackoffice(
    files["V6_02_business_functions.csv"],
  ).slice(0, 14);
  const ownership = filterBackoffice(files["V6_03_org_ownership.csv"]).slice(
    0,
    14,
  );
  const systems = filterBackoffice(
    files["V6_05_applications_systems.csv"],
  ).slice(0, 18);
  const dataAssets = filterBackoffice(
    files["V6_06_data_assets_integrations.csv"],
  ).slice(0, 18);
  const spend = filterBackoffice(files["V6_08_spend_value.csv"]).slice(0, 14);
  const programs = filterBackoffice(
    files["V6_09_programs_initiatives.csv"],
  ).slice(0, 12);
  const aiInitiatives = filterBackoffice(
    files["V6_10_ai_initiatives.csv"],
  ).slice(0, 12);
  const risksControls = filterBackoffice(
    files["V6_11_operations_risk_controls.csv"],
  ).slice(0, 14);
  const relationships = filterBackoffice(
    files["V6_12_relationships.csv"],
  ).slice(0, 32);
  const evidenceSources = filterBackoffice(
    files["V6_13_evidence_sources.csv"],
  ).slice(0, 10);
  const metrics = filterBackoffice(files["V6_14_metric_definitions.csv"]).slice(
    0,
    12,
  );
  const industryPatterns = filterBackoffice(
    files["V6_15_industry_corpus_patterns.csv"],
  ).slice(0, 10);
  const expertLenses = files["V6_16_expert_lenses.csv"].filter((row) =>
    clean(row.expert_lens_name),
  );

  const lighthouseUseCases = buildLighthouseUseCases({
    programs,
    aiInitiatives,
    risksControls,
    metrics,
    systems,
    dataAssets,
  });

  const missingEvidenceChecklist = [
    "Finance-attested baseline and value owner for each Shared Services lighthouse use case.",
    "Current process-volume, cycle-time, rework, exception, and unit-cost baselines by function.",
    "Named business process owner and control owner for Treasury, Finance, HR, and Legal workflows.",
    "Evidence that system-of-record data, semantic definitions, and lineage are certified for the decision being automated.",
    "Adoption, role-change, and human-in-the-loop operating model for each proposed agent or automation.",
    "HR and Legal source-system/process evidence before making a scale recommendation in those functions.",
  ];

  const planningAssumptions = [
    "Use Treasury and Finance as Phase 1 lighthouse domains because the loaded context evidence is strongest there.",
    "Treat HR and Legal as Phase 2 discovery branches until Workday, CLM/eBilling, policy, matter, and service-volume evidence is loaded or confirmed by the client.",
    "Use directional value ranges only after the CIO/CFO authorizes assumptions or provides current process volumes and unit costs.",
    "Measure the Value Office by realized business value, governed reuse, and decision-cycle compression, not by number of AI pilots launched.",
  ];

  const branch = defaultDecisionBranch();

  return {
    tenantKey: "lakeshore-holdings",
    packetId: "industrial-cio-backoffice-value-office-v1",
    decision: "prove_shared_services_value_office_with_finance_treasury_first",
    morganStreetGoal:
      "Stand up an Enterprise Innovation, AI Enablement & Value Office that maps work, redesigns processes, governs AI, measures value, and reuses context across Shared Services.",
    valueMechanism:
      "Value comes from redesigning high-friction Shared Services work, proving Finance-attested outcomes, and reusing the same context/agent/governance assets across Treasury, Finance, HR, Legal, Procurement, and IT Operations.",
    functions,
    ownership,
    systems,
    dataAssets,
    programs,
    aiInitiatives,
    risksControls,
    spend,
    relationships,
    evidenceSources,
    metrics,
    industryPatterns,
    expertLenses,
    lighthouseUseCases,
    missingEvidenceChecklist,
    planningAssumptions,
    claimMaturity: buildClaimMaturity({
      functions,
      ownership,
      systems,
      dataAssets,
      programs,
      aiInitiatives,
      risksControls,
      spend,
      relationships,
      evidenceSources,
      metrics,
      industryPatterns,
    }),
    branch,
    sourceFiles: [...REQUIRED_SOURCE_FILES],
  };
}

export function composeIndustrialCioBackofficeAnswer(
  question: string,
  packet = buildIndustrialCioBackofficePacket(),
): string {
  const lower = question.toLowerCase();
  const hrLegal = /\b(hr|legal|contract|clm|workday|people)\b/.test(lower);
  const valueOffice =
    /\b(value office|innovation office|enablement office|operating model|stand up)\b/.test(
      lower,
    );
  const fund = /\b(fund|prioritize|sequence|first|lighthouse)\b/.test(lower);
  const assumptions =
    /\b(assumption|assume|missing|input|values|permission)\b/.test(lower);
  const treasury = /\b(kyriba|treasury|cash|bank|payment)\b/.test(lower);

  let pointOfView =
    "My point of view: start the Lakeshore Holdings-style Value Office with Treasury and Finance, not a broad AI roadshow.";
  if (valueOffice)
    pointOfView =
      "My point of view: the office is valuable only if it becomes a repeatable value-realization method, not another intake committee.";
  if (fund)
    pointOfView =
      "My point of view: fund two lighthouse tracks first: Kyriba/treasury control evidence and finance close/reporting automation.";
  if (treasury)
    pointOfView =
      "My point of view: Kyriba is the cleanest first proof because it combines process redesign, bank connectivity, controls, SAP integration, and measurable cash visibility.";
  if (hrLegal)
    pointOfView =
      "My point of view: HR and Legal are credible next waves, but the loaded evidence does not yet justify treating them as Phase 1 scale bets.";
  if (assumptions)
    pointOfView =
      "My point of view: ask the CIO/CFO for permission to use planning assumptions, or ask them for four values before sizing impact.";

  return [
    pointOfView,
    `What this means: use AbarVa to turn Shared Services ideas into mapped work, governed AI/automation, a Finance-attested value case, and reusable context. The loaded packet supports ${packet.functions.length} back-office functions, ${packet.systems.length} relevant systems, ${packet.aiInitiatives.length} AI/automation initiatives, and ${packet.risksControls.length} control or operational signals.`,
    `Why it matters: ${packet.valueMechanism}`,
    `The first two lighthouse candidates are ${packet.lighthouseUseCases[0]?.name} and ${packet.lighthouseUseCases[1]?.name}. They are stronger than HR or Legal today because the tenant evidence already names systems, owners, metrics, risks, and control gaps.`,
    `Known from loaded evidence: ${listValues(packet.systems, "system_name", 5)}; ${listValues(packet.aiInitiatives, "use_case", 5)}; and ${listValues(packet.metrics, "metric_name", 5)}.`,
    `What is missing before board-grade claims: ${packet.missingEvidenceChecklist.slice(0, 4).join(" ")} These are client-signoff boundaries, not formatting gaps.`,
    `The executive branch is simple: either approve directional assumptions for a fast business case, provide current volumes/unit costs for a tighter case, or keep Phase 1 as readiness and process-design proof only.`,
    formatDecisionBranch(packet.branch),
  ].join("\n\n");
}

export function parseDecisionBranch(text: string): {
  visibleText: string;
  branch: DecisionBranch | null;
} {
  const source = String(text ?? "");
  const markerIndex = source.indexOf(BRANCH_MARKER);
  if (markerIndex < 0) return { visibleText: source, branch: null };
  const visibleText = source.slice(0, markerIndex).replace(/\s+$/, "");
  const rawBlock = source.slice(markerIndex);
  const lines = rawBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const questionLine = lines.find((line) =>
    line.toLowerCase().startsWith("question:"),
  );
  const customLine = lines.find((line) =>
    line.toLowerCase().startsWith("custom_allowed:"),
  );
  const choiceLines = lines.filter((line) => /^-\s*id:/.test(line));
  const choices = choiceLines.map((line) => {
    const id = line.match(/^-\s*id:\s*([^|]+?)\s*\|/)?.[1]?.trim() ?? "choice";
    const label =
      line.match(/\|\s*label:\s*([^|]+?)(?:\s*\||$)/)?.[1]?.trim() ?? id;
    const description =
      line.match(/\|\s*description:\s*(.+)$/)?.[1]?.trim() ?? "";
    return { id, label, description };
  });
  return {
    visibleText,
    branch: {
      question:
        questionLine?.replace(/^question:\s*/i, "").trim() ??
        "Choose the next step.",
      choices,
      customAllowed: /true/i.test(customLine ?? ""),
      rawBlock,
    },
  };
}

export function formatDecisionBranch(branch: DecisionBranch): string {
  return [
    BRANCH_MARKER,
    `question: ${branch.question}`,
    ...branch.choices.map(
      (choice) =>
        `- id: ${choice.id} | label: ${choice.label} | description: ${choice.description}`,
    ),
    `custom_allowed: ${branch.customAllowed ? "true" : "false"}`,
  ].join("\n");
}

function buildLighthouseUseCases(inputs: {
  programs: V6Record[];
  aiInitiatives: V6Record[];
  risksControls: V6Record[];
  metrics: V6Record[];
  systems: V6Record[];
  dataAssets: V6Record[];
}): LighthouseUseCase[] {
  return [
    {
      name: "Kyriba cash, bank connectivity, and payment-control proof",
      function: "Treasury",
      posture: "prove_now",
      why: "It links cash visibility, bank connectivity, SAP mapping, payment approvals, SOX evidence, and defect triage into one CIO/CFO-visible outcome.",
      tenantEvidence: [
        findName(inputs.programs, /kyriba global/i),
        findName(inputs.aiInitiatives, /kyriba global/i),
        findName(
          inputs.risksControls,
          /kyriba mapping|bank file|payment approval|SWIFT/i,
        ),
        findName(
          inputs.metrics,
          /cash visibility|bank connectivity|payment straight/i,
        ),
      ].filter(Boolean),
      missingToScale: [
        "Critical-bank certification evidence",
        "payment volume and exception-cost baseline",
        "SOX signer/control attestation",
      ],
    },
    {
      name: "Finance close, reconciliation, and reporting semantic layer",
      function: "Finance and Controller",
      posture: "prove_now",
      why: "It turns SAP/BlackLine/Hyperion evidence into faster close, cleaner reconciliations, and board-readable finance narratives.",
      tenantEvidence: [
        findName(inputs.programs, /close|reporting semantic/i),
        findName(inputs.aiInitiatives, /close|variance/i),
        findName(inputs.risksControls, /BlackLine|Power BI|close calendar/i),
        findName(inputs.metrics, /close cycle|control evidence/i),
      ].filter(Boolean),
      missingToScale: [
        "Finance-approved close baseline",
        "reconciliation aging by entity",
        "semantic owner for GL/management reporting definitions",
      ],
    },
    {
      name: "ServiceNow finance support and knowledge automation",
      function: "Shared Services / IT Operations",
      posture: "shape_next",
      why: "It can reduce repeat finance support demand only if knowledge quality, SAP root-cause tagging, and service-volume baselines are proven.",
      tenantEvidence: [
        findName(inputs.programs, /servicenow finance/i),
        findName(inputs.aiInitiatives, /servicenow finance/i),
        findName(inputs.risksControls, /finance service desk/i),
      ].filter(Boolean),
      missingToScale: [
        "Ticket volumes by process",
        "repeat-contact drivers",
        "deflection and resolution-quality measurement",
      ],
    },
    {
      name: "HR and Legal AI operating model discovery",
      function: "HR / Legal",
      posture: "hold_until_input",
      why: "The Lakeshore Holdings office should include HR and Legal, but the current tenant evidence is not deep enough to recommend scale.",
      tenantEvidence: [
        findName(inputs.systems, /Workday|ServiceNow/i),
        findName(inputs.dataAssets, /policy|contract|service/i),
      ].filter(Boolean),
      missingToScale: [
        "Workday HR process volumes",
        "CLM/eBilling/matter data",
        "policy and contract request taxonomy",
        "legal control and privacy boundaries",
      ],
    },
  ];
}

function defaultDecisionBranch(): DecisionBranch {
  const branch: DecisionBranch = {
    question:
      "How should aVa make the Lakeshore Holdings CIO case more precise?",
    choices: [
      {
        id: "use_planning_assumptions",
        label: "Use planning assumptions",
        description:
          "Build a directional case for the Value Office while labeling every non-tenant number as assumption-led.",
      },
      {
        id: "enter_current_values",
        label: "Enter current values",
        description:
          "Ask for process volumes, cycle times, unit costs, exception rates, and target adoption so the case can be tighter.",
      },
      {
        id: "start_treasury_finance",
        label: "Start Treasury + Finance",
        description:
          "Keep Phase 1 on Kyriba, bank controls, close, reconciliation, and finance reporting evidence.",
      },
      {
        id: "expand_hr_legal_discovery",
        label: "Add HR/Legal discovery",
        description:
          "Open a discovery branch for HR and Legal, but do not claim scale readiness until source evidence is loaded.",
      },
      {
        id: "create_value_office_blueprint",
        label: "Create office blueprint",
        description:
          "Turn the answer into an operating model, governance cadence, value scorecard, and first two lighthouse briefs.",
      },
    ],
    customAllowed: true,
    rawBlock: "",
  };
  return { ...branch, rawBlock: formatDecisionBranch(branch) };
}

function buildClaimMaturity(inputs: {
  functions: V6Record[];
  ownership: V6Record[];
  systems: V6Record[];
  dataAssets: V6Record[];
  programs: V6Record[];
  aiInitiatives: V6Record[];
  risksControls: V6Record[];
  spend: V6Record[];
  relationships: V6Record[];
  evidenceSources: V6Record[];
  metrics: V6Record[];
  industryPatterns: V6Record[];
}): ClaimMaturityEntry[] {
  return [
    {
      statement:
        "Lakeshore Holdings has enough loaded evidence to start a Treasury/Finance Shared Services value-office proof.",
      maturity: "loaded_fact",
      basis: `${inputs.functions.length} functions, ${inputs.systems.length} systems, ${inputs.aiInitiatives.length} AI initiatives, and ${inputs.risksControls.length} operations/control rows are selected from governed context evidence.`,
      confidence: "high",
      signoffRequired: false,
    },
    {
      statement:
        "Treasury and Finance should be Phase 1; HR and Legal should be discovery branches until their process evidence is loaded.",
      maturity: "abarva_assessment",
      basis:
        "Treasury/Finance evidence has named systems, initiatives, metrics, risks, and owners; HR/Legal evidence is thinner in the current packet.",
      confidence: "medium",
      signoffRequired: true,
    },
    {
      statement:
        "Measured AI values in the packet are tenant evidence but still require Finance attestation before board or investment-committee use.",
      maturity: "client_signoff_required",
      basis: `${inputs.spend.length} spend/value rows and ${inputs.metrics.length} metric rows are present, but Finance-approved value governance is still a required checklist item.`,
      confidence: "high",
      signoffRequired: true,
    },
    {
      statement:
        "Shared Services value depends on process redesign, controls, adoption, and data lineage, not tool deployment alone.",
      maturity: "industry_context",
      basis: `${inputs.industryPatterns.length} industry/pattern rows and expert lenses reinforce this boundary.`,
      confidence: "medium",
      signoffRequired: false,
    },
    {
      statement:
        "System, data, and control dependencies are relationship-backed but need owner validation before they become a signed operating model.",
      maturity: "relationship_inferred",
      basis: `${inputs.relationships.length} relationship rows are in the focused packet.`,
      confidence: "medium",
      signoffRequired: true,
    },
    {
      statement:
        "Missing values should trigger CIO/CFO choice prompts instead of fabricated precision.",
      maturity: "missing_evidence",
      basis:
        "Current process volumes, unit costs, exception cost, adoption baselines, HR, and Legal source evidence remain explicit gaps.",
      confidence: "high",
      signoffRequired: false,
    },
  ];
}

function filterBackoffice(rows: V6Record[]): V6Record[] {
  return rows.filter((row) => BACKOFFICE_RE.test(Object.values(row).join(" ")));
}

function findName(rows: V6Record[], pattern: RegExp): string {
  const row = rows.find((candidate) =>
    pattern.test(Object.values(candidate).join(" ")),
  );
  return (
    clean(row?.record_name) ||
    clean(row?.use_case) ||
    clean(row?.system_name) ||
    clean(row?.metric_name)
  );
}

function listValues(rows: V6Record[], key: string, limit: number): string {
  return rows
    .map((row) => row[key])
    .filter(Boolean)
    .slice(0, limit)
    .join("; ");
}

function readV6File(root: string, file: string): V6Record[] {
  const filePath = path.join(root, file);
  if (!existsSync(filePath))
    throw new Error(`Missing Industrial context file: ${filePath}`);
  return parseCsv(readFileSync(filePath, "utf8"));
}

function parseCsv(text: string): V6Record[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""]),
    ),
  );
}

function clean(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text.startsWith("data_thin:")) return "";
  return text;
}
