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

const prompt = [
  contract,
  "",
  "## Tenant Context",
  "",
  JSON.stringify(
    {
      tenant_key: tenantKey,
      tenant_name: "SkyHarbor Global",
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
      graph_summary: {
        node_count: relationshipGraph.nodes?.length,
        edge_count: relationshipGraph.edges?.length,
        sample_nodes: relationshipGraph.nodes?.slice?.(0, 30),
        sample_edges: relationshipGraph.edges?.slice?.(0, 40),
      },
    },
    null,
    2,
  ),
].join("\n");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const response = await client.messages.create({
  model,
  max_tokens: 24000,
  temperature: 0,
  messages: [{ role: "user", content: prompt }],
});

const rawText = response.content
  .map((part) => (part.type === "text" ? part.text : ""))
  .join("\n")
  .trim();

const rawPath = path.join(outDir, "raw-claude-response.json");
fs.writeFileSync(
  rawPath,
  `${JSON.stringify({ model, prompt, response, raw_text: rawText }, null, 2)}\n`,
);

const parsed = extractJson(rawText);
const rawHash = sha256(rawText);

for (const diagram of parsed.diagrams ?? []) {
  if (!diagram.id || !diagram.svg) {
    throw new Error("Each Claude diagram must include id and svg");
  }
  const assetPath = path.join(publicDir, `${diagram.id}.svg`);
  fs.writeFileSync(assetPath, diagram.svg);
  diagram.asset_path = `/generated/home/skyharbor-air/architecture-diagram-pack-v1/${diagram.id}.svg`;
  delete diagram.svg;
}

const manifest = {
  ...parsed,
  generated_at: new Date().toISOString(),
  authoring_status: "claude_generated_pending_validation",
  generated_model: model,
  prompt_version: "home-claude-architecture-diagram-pack-v1",
  no_post_claude_mutation: true,
  raw_claude_response: {
    path: path.relative(repoRoot, rawPath),
    sha256: rawHash,
  },
  claude_generation_contract: {
    prompt_path: path.relative(repoRoot, promptContractPath),
    generator_path: "scripts/knowledge/generate-home-architecture-diagram-pack.mjs",
    validator_path: "scripts/knowledge/validate-home-architecture-diagram-pack.mjs",
    regeneration_policy:
      "Validators reject and return failure report to Claude; they do not rewrite SVG or narrative output.",
  },
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
