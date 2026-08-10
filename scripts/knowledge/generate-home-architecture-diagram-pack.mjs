#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const tenantKey = "skyharbor-air";
const outDir = path.join(
  repoRoot,
  "datasets/tenant-inputs/skyharbor-air/approved-content/home/architecture-diagram-pack-v1",
);
const publicDir = path.join(
  repoRoot,
  "public/generated/home/skyharbor-air/architecture-diagram-pack-v1",
);
const manifestPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/skyharbor-air/approved-content/home/claude-architecture-diagram-pack.json",
);
const promptContractPath = path.join(
  repoRoot,
  "docs/home-know/HOME_CLAUDE_ARCHITECTURE_DIAGRAM_OUTPUT_CONTRACT.md",
);
const designPackPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/skyharbor-air/approved-content/home/design-contract-pack.json",
);
const relationshipGraphPath = path.join(
  repoRoot,
  "datasets/tenant-inputs/skyharbor-air/derived/relationship-graph.json",
);

const model =
  process.env.HOME_ARCHITECTURE_CLAUDE_MODEL ||
  process.env.KNOWLEDGE_CXO_CLAUDE_MODEL ||
  "claude-sonnet-4-6";
const diagramArgIndex = process.argv.indexOf("--diagram");
const requestedDiagramId =
  diagramArgIndex >= 0 ? process.argv[diagramArgIndex + 1] : "";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function extractJson(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("Claude response did not contain a JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is required to generate a Claude-authored diagram pack.");
  process.exit(2);
}

const contract = read(promptContractPath);
const designPack = readJson(designPackPath);
const relationshipGraph = readJson(relationshipGraphPath);

const tenantContext = {
  tenant_key: tenantKey,
  tenant_name: "SkyHarbor Global",
  industry: "global airline",
  design_contract_metadata: {
    generated_model: designPack.generated_model,
    prompt_version: designPack.prompt_version,
    source_context: designPack.source_context,
    quality_assessment: designPack.quality_assessment,
  },
  current_home_model_requirements: {
    known_numbers: {
      fy2027_technology_budget: "$2.35B",
      fy2026_actual_technology_spend: "$2.18B",
      annual_committed_base: "$1.48B",
      estimated_ai_use_cost: "$170.2M",
      architecture_nodes: 444,
      relationship_flows: 586,
      annual_value_contracts: 119,
    },
    forbidden_interpretation:
      "Do not convert unknown claimable value into $0 value realized. Say unknown / not established.",
  },
  required_architecture_signals: [
    "airline.com / mobile / airport digital channels",
    "reservation and PSS platforms",
    "departure control and crew operations",
    "maintenance / MRO and flight operations",
    "ERP / finance / procurement / HR",
    "mainframe with z/OS, CICS, DB2, and MQ",
    "at least two private data centers and private cloud",
    "hybrid cloud landing zone and controlled egress",
    "integration fabric with APIs, MQ, ETL, ELT, batch, and streaming",
    "enterprise data warehouse, Teradata-style EDW, marts, lakehouse direction",
    "data science platforms such as SAS",
    "Power BI / Tableau / portals consumption layer",
    "AI agents that are gated and integrated through audited APIs, not free-running automation",
  ],
  graph_summary: {
    node_count: relationshipGraph.nodes?.length,
    edge_count: relationshipGraph.edges?.length,
    sample_nodes: relationshipGraph.nodes?.slice?.(0, 30),
    sample_edges: relationshipGraph.edges?.slice?.(0, 40),
  },
};

const diagramRequests = [
  {
    id: "patterns-enterprise-operating-system",
    tab: "patterns",
    title: "Enterprise operating system pattern map",
    subtitle:
      "Show the board-level operating pattern across airline domains, technology estate, economics, evidence, and governance.",
    source_refs: [
      "enterprise_context",
      "architecture_graph",
      "contract_register",
      "tower_value_lane",
    ],
    focus:
      "Make this a compact CXO map of how operations, commercial commitments, platforms, data proof, AI activity, and value gates fit together.",
  },
  {
    id: "economics-value-control",
    tab: "economics",
    title: "Economics and value-control architecture",
    subtitle:
      "Show the value-control path from budget and contract commitments to governed claims and finance validation.",
    source_refs: [
      "it_budget_spend_value",
      "vendors_contracts",
      "ai_automation_use_cases",
      "tower_value_lane",
    ],
    focus:
      "Use high-impact economics visuals: budget bars, committed base, AI use cost, claimable-value gate, and unknown-value boundary. Do not claim realized savings.",
  },
  {
    id: "posture-evidence-authority",
    tab: "posture",
    title: "Evidence and authority posture map",
    subtitle:
      "Show where evidence exists, what is directional, and which authority gates prevent unsupported recommendations.",
    source_refs: [
      "home_evidence_contract",
      "relationship_edges",
      "architecture_advisory_result",
    ],
    focus:
      "Make this a proof posture visual: loaded context, indexed evidence, relationship confidence, decision authority, finance authority, and explicit gaps.",
  },
  {
    id: "coherence-domain-architecture-index",
    tab: "coherence",
    title: "Scoped architecture diagram index",
    subtitle:
      "Show separate scoped architecture views for digital airline channels, ERP, data and AI, and mainframe/private-cloud infrastructure.",
    source_refs: [
      "applications_systems",
      "data_assets_integrations",
      "infrastructure_platforms",
      "relationship_edges",
    ],
    focus:
      "Do not make one giant unreadable diagram. Create an index of smaller architecture domains: digital airline channels, ERP/back office, data and AI, and mainframe/private cloud/data centers. Include mainframe, two data centers, private cloud, hybrid cloud, integration fabric, EDW/marts, SAS, BI/portals, and AI agent action gates.",
  },
  {
    id: "trajectory-executive-shifts",
    tab: "trajectory",
    title: "Executive shift and gate map",
    subtitle:
      "Show plausible movement from current-state constraints to governed modernization steps without asserting a target-state commitment.",
    source_refs: [
      "intelligence_route",
      "moves_route",
      "source_route",
      "tower_route",
    ],
    focus:
      "Show current-state to next-state shifts across architecture, sourcing, value validation, and AI governance. Present as gated movement, not a recommendation or committed target architecture.",
  },
];

function buildDiagramPrompt(diagram) {
  return [
    contract,
    "",
    "## Per-Diagram Generation Mode",
    "",
    "Generate exactly one diagram object for this request. Return strict JSON only. Do not use markdown fences.",
    "The `svg` field must be a compact JSON string with no literal line breaks. Escape quotes inside SVG attributes. The response must parse with JSON.parse.",
    "The SVG itself must include at least 12 `<text>` elements, a `viewBox`, `<title>`, `<desc>`, and no forbidden SVG features.",
    "The SVG must be well-formed XML. Do not duplicate attributes on any element. Every element must close correctly.",
    "Keep all text inside the SVG bounded and readable. Use smaller scoped panels and lanes rather than one crowded mega-diagram.",
    "Use professional enterprise visual quality: lane bands, bounded labels, concise legends, arrows, state markers, and restrained color.",
    "",
    "## Diagram To Generate",
    "",
    JSON.stringify(diagram, null, 2),
    "",
    "## Tenant Context",
    "",
    JSON.stringify(tenantContext, null, 2),
  ].join("\n");
}

async function callClaudeDiagram(diagram) {
  const prompt = buildDiagramPrompt(diagram);
  const stream = client.messages.stream({
    model,
    max_tokens: 12000,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });
  const response = await stream.finalMessage();
  const rawText = response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();
  const rawPath = path.join(outDir, `raw-claude-response-${diagram.id}.json`);
  fs.writeFileSync(
    rawPath,
    `${JSON.stringify({ model, prompt, response, raw_text: rawText }, null, 2)}\n`,
  );
  const parsed = extractJson(rawText);
  if (parsed.id !== diagram.id) {
    throw new Error(`Claude returned id ${parsed.id}; expected ${diagram.id}`);
  }
  if (parsed.tab !== diagram.tab) {
    throw new Error(`Claude returned tab ${parsed.tab}; expected ${diagram.tab}`);
  }
  if (!parsed.svg) {
    throw new Error(`Claude diagram ${diagram.id} did not include svg`);
  }
  return { parsed, rawPath, rawText };
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const generatedDiagrams = [];
const rawResponses = [];
const requestsToGenerate = requestedDiagramId
  ? diagramRequests.filter((diagram) => diagram.id === requestedDiagramId)
  : diagramRequests;

if (requestedDiagramId && requestsToGenerate.length !== 1) {
  throw new Error(`Unknown diagram id for --diagram: ${requestedDiagramId}`);
}

for (const diagramRequest of requestsToGenerate) {
  console.log(`Generating ${diagramRequest.id} with ${model}`);
  const { parsed, rawPath, rawText } = await callClaudeDiagram(diagramRequest);
  const assetPath = path.join(publicDir, `${parsed.id}.svg`);
  fs.writeFileSync(assetPath, parsed.svg);
  delete parsed.svg;
  generatedDiagrams.push({
    ...parsed,
    asset_path: `/generated/home/skyharbor-air/architecture-diagram-pack-v1/${parsed.id}.svg`,
  });
  rawResponses.push({
    diagram_id: parsed.id,
    path: path.relative(repoRoot, rawPath),
    sha256: sha256(rawText),
  });
}

const combinedRawPath = path.join(outDir, "raw-claude-response.json");
const existingManifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : null;
const priorRawResponses =
  requestedDiagramId && existingManifest?.raw_claude_response?.responses
    ? existingManifest.raw_claude_response.responses.filter(
        (response) => response.diagram_id !== requestedDiagramId,
      )
    : [];
const allRawResponses = [...priorRawResponses, ...rawResponses].sort(
  (a, b) =>
    diagramRequests.findIndex((diagram) => diagram.id === a.diagram_id) -
    diagramRequests.findIndex((diagram) => diagram.id === b.diagram_id),
);
const priorDiagrams =
  requestedDiagramId && Array.isArray(existingManifest?.diagrams)
    ? existingManifest.diagrams.filter((diagram) => diagram.id !== requestedDiagramId)
    : [];
const allDiagrams = [...priorDiagrams, ...generatedDiagrams].sort(
  (a, b) =>
    diagramRequests.findIndex((diagram) => diagram.id === a.id) -
    diagramRequests.findIndex((diagram) => diagram.id === b.id),
);
fs.writeFileSync(
  combinedRawPath,
  `${JSON.stringify(
    {
      model,
      prompt_version: "home-claude-architecture-diagram-pack-v1",
      generation_mode: "per_diagram",
      generated_at: new Date().toISOString(),
      raw_responses: allRawResponses,
    },
    null,
    2,
  )}\n`,
);

const manifest = {
  pack_id: "skyharbor-home-architecture-diagram-pack-v1",
  tenant_key: tenantKey,
  tenant_name: "SkyHarbor Global",
  artifact_type: "home_architecture_diagram_pack",
  pack_version: "v1.0.0",
  generated_at: new Date().toISOString(),
  authoring_status: "claude_generated_pending_validation",
  generated_model: model,
  prompt_version: "home-claude-architecture-diagram-pack-v1",
  no_post_claude_mutation: true,
  raw_claude_response: {
    path: path.relative(repoRoot, combinedRawPath),
    mode: "per_diagram",
    responses: allRawResponses,
  },
  claude_generation_contract: {
    prompt_path: path.relative(repoRoot, promptContractPath),
    generator_path: "scripts/knowledge/generate-home-architecture-diagram-pack.mjs",
    validator_path: "scripts/knowledge/validate-home-architecture-diagram-pack.mjs",
    regeneration_policy:
      "Validators reject and return failure report to Claude; they do not rewrite SVG or narrative output.",
  },
  asset_root: "/generated/home/skyharbor-air/architecture-diagram-pack-v1",
  diagrams: allDiagrams,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const validation = spawnSync(
  process.execPath,
  [
    "scripts/knowledge/validate-home-architecture-diagram-pack.mjs",
    "--manifest",
    manifestPath,
    "--require-claude",
  ],
  { cwd: repoRoot, encoding: "utf8" },
);

process.stdout.write(validation.stdout);
process.stderr.write(validation.stderr);
if (validation.status !== 0) {
  process.exit(validation.status ?? 1);
}

const approved = {
  ...manifest,
  authoring_status: "claude_generated_validation_pass",
  quality_gate: {
    status: "pass",
    validated_by: "scripts/knowledge/validate-home-architecture-diagram-pack.mjs",
    validated_at: new Date().toISOString(),
  },
};

fs.writeFileSync(manifestPath, `${JSON.stringify(approved, null, 2)}\n`);
console.log(`Claude-authored Home architecture diagram pack written to ${manifestPath}`);
