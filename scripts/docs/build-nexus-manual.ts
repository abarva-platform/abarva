#!/usr/bin/env tsx

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POLICY_VERSION } from "../../src/lib/governance/context-corpus-policy";
import { AVA_MODULE_EXPERT_CONTRACTS } from "../../src/lib/agent/module-routing";
import { PRODUCT_CAPABILITY_REGISTRY } from "../../src/lib/agent/product-truth/capability-registry";
import { SURFACE_SCOPE_REGISTRY } from "../../src/lib/agent/product-truth/surface-scope";
import { FEATURE_FLAGS } from "../../src/lib/features/registry";
import {
  CXO_ANSWER_MODE_REGISTRY,
  MOVES_EXECUTION_PHASE_LABELS,
  type CxoAnswerModeContract,
} from "../../src/lib/intelligence/ask/answer-mode-registry";
import { PACKS_V2, type PhaseNumber } from "../../src/lib/programs/phase-packs/v2";
import {
  hardCriteriaForStage,
  requiredEvidenceForStage,
  requiredSpecsForStage,
} from "../../src/lib/source/canonical-specs";
import {
  SOURCE_LEAD_AGENT,
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "../../src/lib/source/constants";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outPath = path.join(
  root,
  "docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md",
);
const corpusPath = path.join(
  root,
  "docs/product/generated/nexus-product-manual-corpus.jsonl",
);
const checkMode = process.argv.includes("--check");
const CXO_ANSWER_MODE_CONTRACTS = Object.values(
  CXO_ANSWER_MODE_REGISTRY,
) as CxoAnswerModeContract[];

interface RouteRow {
  file: string;
  route: string;
  audience: "admin" | "client" | "public" | "internal";
  product: string;
}

interface ManualCorpusRecord {
  id: string;
  tenant_id: null;
  client_key: "corpus_global";
  object_type: "nexus_product_manual_section";
  source_layer: "product_docs";
  industry: null;
  enterprise_area: "cross_enterprise";
  function: null;
  process_area: null;
  use_case_category: "product_training";
  strategic_move_phase_applicability: string[];
  applicable_agents: Array<"nexus" | "sentinel" | "source" | "tower">;
  source_basis: "generated_from_executable_product_contracts";
  source_references: string[];
  classification: "internal";
  compliance_basis: string;
  agent_readiness_status: "committed_not_indexed";
  retrievability: "committed_not_indexed";
  confidence_level: "high";
  confidence_rationale: string;
  cited_render_verified_at: null;
  last_reviewed_at: null;
  owner: "AbarVa Product Governance";
  data_domains: string[];
  required_kpis: [];
  baseline_requirements: [];
  measurement_method: null;
  value_levers: [];
  known_failure_modes: string[];
  guardrails: string[];
  human_in_loop_controls: string[];
  allowed_agent_actions: string[];
  blocked_agent_actions: string[];
  provenance: {
    source_file: "docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md";
    parse_method: "generated_markdown_h2_section_split";
    committed_at: null;
    indexed_at: null;
    index_name: null;
  };
  policy_version: string;
  contract_hash: string;
  created_at: null;
  updated_at: null;
  title: string;
  body: string;
  section_anchor: string;
}

function ascii(input: unknown): string {
  return String(input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function publicSafe(input: unknown): string {
  return ascii(input)
    .replace(/\bMeridian(?: Health)?\b/gi, "an enrolled tenant")
    .replace(/\bSkyHarbor(?: Air)?\b/gi, "an enrolled tenant")
    .replace(/\bLakeshore(?: Holdings)?\b/gi, "an enrolled tenant")
    .replace(/\bFirst Capital\b/gi, "an enrolled tenant")
    .replace(/\bApex Retail\b/gi, "an enrolled tenant")
    .replace(/\bapexretail\b/gi, "enrolled-tenant")
    .replace(/\barcturus\b/gi, "enrolled-tenant")
    .replace(/\bskyharbor\b/gi, "enrolled-tenant")
    .replace(/\blakeshore\b/gi, "enrolled-tenant")
    .replace(/\bmeridian\b/gi, "enrolled-tenant")
    .replace(/\bfirst-capital\b/gi, "enrolled-tenant");
}

function cell(input: unknown): string {
  return publicSafe(input).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function slug(input: string): string {
  return publicSafe(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function list(items: readonly string[], empty = "None declared."): string {
  if (items.length === 0) return `- ${empty}`;
  return items.map((item) => `- ${ascii(item)}`).join("\n");
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(abs);
    return entry.isFile() ? [abs] : [];
  });
}

function table(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [
    `| ${headers.map(cell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

function isPhaseNumber(value: number): value is PhaseNumber {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

function routeFromPage(file: string): string {
  const rel = path.relative(path.join(root, "src/app"), file);
  const withoutPage = rel.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  const parts = withoutPage
    .split(path.sep)
    .filter(Boolean)
    .filter((part) => !(part.startsWith("(") && part.endsWith(")")));
  return `/${parts.join("/")}`.replace(/\/+/g, "/") || "/";
}

function classifyRoute(route: string): RouteRow["audience"] {
  if (
    route.startsWith("/admin") ||
    route.startsWith("/platform/admin") ||
    route.includes("/admin/") ||
    route.startsWith("/engineering")
  ) {
    return "admin";
  }
  if (
    route === "/" ||
    route.startsWith("/architecture") ||
    route.startsWith("/atlas") ||
    route.startsWith("/contact") ||
    route.startsWith("/contradictions") ||
    route.startsWith("/digest") ||
    route.startsWith("/editorial") ||
    route.startsWith("/how-it-works") ||
    route.startsWith("/known-limitations") ||
    route.startsWith("/model-card") ||
    route.startsWith("/patterns") ||
    route.startsWith("/responsible-ai") ||
    route.startsWith("/solutions") ||
    route.startsWith("/status") ||
    route.startsWith("/subprocessors") ||
    route.startsWith("/sign-in") ||
    route.startsWith("/signed-out") ||
    route.startsWith("/session-expired") ||
    route.startsWith("/access") ||
    route.startsWith("/auth-redirect") ||
    route.startsWith("/invite") ||
    route.startsWith("/investors") ||
    route.startsWith("/sponsor")
  ) {
    return "public";
  }
  if (route.startsWith("/demo") || route.startsWith("/preview")) return "internal";
  return "client";
}

function productForRoute(route: string): string {
  if (route.startsWith("/home")) return "Home";
  if (route.startsWith("/intelligence")) return "Intelligence";
  if (route.startsWith("/source")) return "Source";
  if (route.startsWith("/strategic-moves") || route.startsWith("/programs")) return "Moves";
  if (route.includes("/tower") || route.startsWith("/tower")) return "Tower";
  if (route.startsWith("/admin") || route.startsWith("/platform/admin")) return "Admin";
  if (route.startsWith("/platform")) return "Platform";
  if (route.startsWith("/docs") || route.startsWith("/learn")) return "Learn";
  if (route.startsWith("/tenant")) return "Tenant workspace";
  if (route.startsWith("/engagements")) return "Engagements";
  return "Shared";
}

function getRoutes(): RouteRow[] {
  return walk(path.join(root, "src/app"))
    .filter((file) => file.endsWith(`${path.sep}page.tsx`) || file.endsWith(`${path.sep}page.jsx`))
    .map((file) => {
      const route = routeFromPage(file);
      return {
        file: path.relative(root, file),
        route,
        audience: classifyRoute(route),
        product: productForRoute(route),
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route));
}

function movesPhaseLabelsFromPacks(): string[] {
  return Object.keys(PACKS_V2)
    .map((key) => Number(key))
    .filter(isPhaseNumber)
    .sort((a, b) => a - b)
    .map((phase) => PACKS_V2[phase].phase_name);
}

function collectPhaseMentions(sourceName: string, text: string): string[] {
  const mentions: string[] = [];
  const phaseRef = /\bP([0-5])\s+([A-Z][A-Za-z0-9 &/]+?)(?=,|\sand\sP|\sand\sTower|\s-\s|\)|\.|\n|$)/g;
  for (const match of text.matchAll(phaseRef)) {
    mentions.push(`${sourceName}: P${match[1]} ${match[2].trim()}`);
  }
  return mentions;
}

function assertManualInputConsistency(): void {
  const errors: string[] = [];
  const packPhaseLabels = movesPhaseLabelsFromPacks();
  const answerModePhaseLabels = MOVES_EXECUTION_PHASE_LABELS.filter((label) =>
    /^P[0-5]\b/.test(label),
  );

  if (packPhaseLabels.join("\n") !== answerModePhaseLabels.join("\n")) {
    errors.push(
      [
        "Moves phase label list disagrees with V2 phase packs.",
        `phase-packs=${packPhaseLabels.join(" | ")}`,
        `answer-mode=${answerModePhaseLabels.join(" | ")}`,
      ].join(" "),
    );
  }

  const canonicalByPhase = new Map(
    packPhaseLabels.map((label) => [label.slice(0, 2), label]),
  );
  const phaseMentionSources = [
    ...PRODUCT_CAPABILITY_REGISTRY.map((entry) => ({
      source: `capability:${entry.key}`,
      text: entry.claimGuidance,
    })),
    ...CXO_ANSWER_MODE_CONTRACTS.map((entry) => ({
      source: `answer-mode:${entry.mode}`,
      text: [entry.systemContract, entry.promptDirective].filter(Boolean).join("\n"),
    })),
    {
      source: "answer-mode:MOVES_EXECUTION_PHASE_LABELS",
      text: MOVES_EXECUTION_PHASE_LABELS.join("\n"),
    },
  ];

  for (const source of phaseMentionSources) {
    for (const mention of collectPhaseMentions(source.source, source.text)) {
      const phaseKey = mention.match(/\bP[0-5]\b/)?.[0];
      const canonical = phaseKey ? canonicalByPhase.get(phaseKey) : undefined;
      if (canonical && !mention.endsWith(canonical)) {
        errors.push(`Moves phase label mismatch: ${mention}; expected ${canonical}`);
      }
    }
  }

  const scopeSurfaces = new Set(SURFACE_SCOPE_REGISTRY.map((entry) => entry.surface));
  const moduleSurfaces = Object.entries(AVA_MODULE_EXPERT_CONTRACTS);
  for (const [key, contract] of moduleSurfaces) {
    if (contract.surface !== key) {
      errors.push(`Module contract key ${key} declares surface ${contract.surface}.`);
    }
    if (!scopeSurfaces.has(contract.surface)) {
      errors.push(`Module contract ${key} has no surface-scope registry entry.`);
    }
  }

  for (const entry of SURFACE_SCOPE_REGISTRY) {
    for (const target of entry.handoffTargets) {
      if (!scopeSurfaces.has(target)) {
        errors.push(`Surface ${entry.surface} points to unknown handoff target ${target}.`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Nexus manual input consistency failed:\n- ${errors.join("\n- ")}`);
  }
}

function routeInventory(routes: RouteRow[]): string {
  const counts = routes.reduce(
    (acc, route) => {
      acc[route.audience] += 1;
      acc.products.set(route.product, (acc.products.get(route.product) ?? 0) + 1);
      return acc;
    },
    { admin: 0, client: 0, public: 0, internal: 0, products: new Map<string, number>() },
  );
  return [
    "## Generated Route Spine",
    "",
    "Generated from `src/app/**/page.tsx`. Route groups are removed, dynamic segments are preserved, and routes are classified for aVa training posture.",
    "",
    table(
      ["Audience", "Route count", "aVa posture"],
      [
        ["client", counts.client, "Answer in the active tenant/workspace only; cite loaded context or name what is missing."],
        ["admin", counts.admin, "Explain setup/governance controls; avoid tenant data claims unless scoped evidence is supplied."],
        ["public", counts.public, "Describe public/product material; never imply authenticated capability proof."],
        ["internal", counts.internal, "Treat as preview/demo/operator-only unless release evidence says otherwise."],
      ],
    ),
    "",
    table(["Product area", "Route count"], [...counts.products.entries()].sort(([a], [b]) => a.localeCompare(b))),
    "",
    table(
      ["Route", "Audience", "Product area", "Source file"],
      routes.map((route) => [route.route, route.audience, route.product, route.file]),
    ),
  ].join("\n");
}

function featureFlagSection(): string {
  return [
    "## Generated Feature Availability Spine",
    "",
    "Generated from `src/lib/features/registry.ts`. aVa must use this language for availability: platform flags are generally on, tenant flags are unavailable unless the active tenant is enrolled or the environment allowlist enables them.",
    "",
    table(
      ["Flag", "Policy", "Included tenants", "Excluded tenants", "Training guidance"],
      FEATURE_FLAGS.map((flag) => [
        flag.key,
        flag.policy,
        flag.includeTenants?.length ? `${flag.includeTenants.length} enrolled` : "",
        flag.excludeTenants?.length ? `${flag.excludeTenants.length} excluded` : "",
        flag.summary,
      ]),
    ),
  ].join("\n");
}

function capabilitySection(): string {
  return [
    "## Generated Product Truth Spine",
    "",
    "Generated from `src/lib/agent/product-truth/capability-registry.ts`. Shipped does not mean live-proven for a specific tenant; tenant proof still comes from runtime state and citations.",
    "",
    table(
      ["Capability", "Surface", "Maturity", "Pilot tenants", "aVa claim guidance"],
      PRODUCT_CAPABILITY_REGISTRY.map((entry) => [
        entry.label,
        entry.surface,
        entry.maturity,
        entry.pilotTenants?.length ? `${entry.pilotTenants.length} enrolled` : "",
        entry.claimGuidance,
      ]),
    ),
  ].join("\n");
}

function moduleExpertSection(): string {
  return [
    "## Generated aVa Module Expert Spine",
    "",
    "Generated from `AVA_MODULE_EXPERT_CONTRACTS`, `SURFACE_SCOPE_REGISTRY`, and `CXO_ANSWER_MODE_REGISTRY`. aVa is trained as routed module experts, not as one unbounded assistant: each expert consumes a deterministic packet, formats a module prompt, and applies a post-hoc quality gate.",
    "",
    table(
      ["Module", "Owned scope", "Handoff targets", "Redirect boundary"],
      Object.values(SURFACE_SCOPE_REGISTRY).map((entry) => [
        entry.surface,
        entry.ownedScope,
        entry.handoffTargets.join(", "),
        entry.redirectScope,
      ]),
    ),
    "",
    table(
      ["Implemented expert", "Classifier", "Packet builder", "Prompt formatter", "Quality gate"],
      Object.values(AVA_MODULE_EXPERT_CONTRACTS).map((contract) => [
        contract.surface,
        contract.classifyQuestion.name || "anonymous",
        contract.buildPacket.name || "anonymous",
        contract.formatPrompt.name || "anonymous",
        contract.runQualityGate.name || "anonymous",
      ]),
    ),
    "",
    "### Intelligence Answer Modes",
    "",
    table(
      ["Mode", "Active", "Required sections", "Artifacts", "Export", "Live-proof prompt"],
      CXO_ANSWER_MODE_CONTRACTS.map((entry) => [
        entry.mode,
        entry.active ? "yes" : "no",
        entry.requiredSections.join("; "),
        entry.requiredArtifacts.join("; "),
        entry.exportRequired ? "yes" : "no",
        entry.liveProofPrompt,
      ]),
    ),
  ].join("\n");
}

function sourceSection(): string {
  const rows = SOURCE_STAGE_ORDER.map((stage, index) => {
    const artifacts = requiredSpecsForStage(stage).map((spec) => spec.name).join("; ");
    const evidence = requiredEvidenceForStage(stage)
      .map((req) => `${req.label} (${req.minimumState})`)
      .join("; ");
    const gates = hardCriteriaForStage(stage)
      .map((criterion) => criterion.title)
      .join("; ");
    return [index + 1, SOURCE_STAGE_LABELS[stage], artifacts, evidence, gates];
  });

  return [
    "## Source Operating Guide",
    "",
    `Code currently declares Source's lead agent as \`${SOURCE_LEAD_AGENT}\` in \`src/lib/source/constants.ts\`. Newer user-facing surfaces use aVa language; until the name is reconciled everywhere, answers should explain Source behavior without claiming the rename is universal.`,
    "",
    "Source runs governed sourcing events, renewals, Contract 360, vendor portfolio analysis, pricing normalization, BAFO, decision packets, and value proof. Source does not autonomously negotiate, approve legal positions, or certify commercial outcomes.",
    "",
    table(
      ["Step", "Stage", "Required artifacts", "Required evidence", "Hard gate checks"],
      rows,
    ),
    "",
    "### Source aVa Rules",
    "",
    list([
      "Start with the event, current product stage, viewed stage, artifacts, and gate evidence.",
      "Separate generated drafts, uploaded evidence, and client-final accepted artifacts.",
      "If a vendor, price, SLA, renewal date, clause, or obligation is absent from loaded evidence, say it is missing.",
      "Never turn a sourcing recommendation into legal, procurement, finance, or executive approval.",
      "Treat industry lifecycle corpus stages as pattern context only, never as the product's 11-stage event workflow.",
      "When the user wants to turn an event insight into an initiative, hand off to Moves P0 with Source context.",
    ]),
  ].join("\n");
}

function movesSection(): string {
  const phases = Object.keys(PACKS_V2)
    .map((key) => Number(key) as PhaseNumber)
    .sort((a, b) => a - b);

  const phaseSummaries = phases.map((phase) => {
    const pack = PACKS_V2[phase];
    return [
      `### ${pack.phase_name}`,
      "",
      pack.phase_intent,
      "",
      "**Workflow steps**",
      "",
      table(
        ["Step", "Name", "Goal"],
        pack.workflow_steps.map((step) => [step.step_id, step.step_name, step.step_goal]),
      ),
      "",
      "**Evidence requirements**",
      "",
      table(
        ["Evidence", "Type", "Source", "Evaluation"],
        pack.evidence_requirements.map((req) => [
          req.label,
          req.type,
          req.source,
          req.evaluation_hint,
        ]),
      ),
      "",
      "**Gate criteria**",
      "",
      table(
        ["Criterion", "Type", "Evaluation"],
        pack.gate_criteria.map((criterion) => [
          criterion.label,
          criterion.type,
          criterion.evaluation,
        ]),
      ),
      "",
      "**Anti-hallucination rules**",
      "",
      list(
        pack.anti_hallucination_rules.map(
          (rule) => `${rule.id}: ${rule.rule} Required behavior: ${rule.required_behavior}`,
        ),
      ),
    ].join("\n");
  });

  return [
    "## Moves / Nexus Operating Guide",
    "",
    "Moves turns a signal into a governed Strategic Move through P0-P5 and then hands outcome tracking to Tower. Nexus/aVa may structure, coach, draft, and detect gaps; named humans own sponsor commitment, gate approval, funding, execution authority, and external commitments.",
    "",
    table(
      ["Phase", "Intent", "Steps", "Hard gates", "Evidence requirements"],
      phases.map((phase) => {
        const pack = PACKS_V2[phase];
        return [
          pack.phase_name,
          pack.phase_intent,
          pack.workflow_steps.length,
          pack.gate_criteria.filter((criterion) => criterion.type === "hard").length,
          pack.evidence_requirements.length,
        ];
      }),
    ),
    "",
    ...phaseSummaries,
  ].join("\n");
}

function buildManual(): string {
  assertManualInputConsistency();
  const routes = getRoutes();

  return ascii(`# Nexus Manual and aVa Training Guide

> Generated by \`npm run docs:nexus-manual\`. Check freshness and cross-source consistency with \`npm run docs:nexus-manual:check\`.
> Do not hand-edit this file. Update \`scripts/docs/build-nexus-manual.ts\` or the executable registries it reads.

## Purpose

This is the durable Nexus operating manual and the matching aVa training guide. It is built from execution contracts where possible: route files, feature flags, product-truth capability rules, Source stage specs, Moves phase packs, module expert contracts, surface routing scope, and Intelligence answer modes. Hand-authored doctrine is limited to posture, boundaries, and human decision rules.

The manual has three jobs:

- Give operators a complete map of Nexus surfaces and workflows.
- Give aVa a safe product-truth spine for "how do I..." and "can I..." answers.
- Fail when executable product facts change without regenerating the guide, or when executable inputs contradict each other.

## Non-Negotiable Data Model

Nexus follows the Enterprise Information Architecture:

- Layer 1: Client intake is organized by who owns the data, not by AbarVa's schema.
- Layer 2: Source adapters normalize intake tabs into canonical objects.
- Layer 3: The canonical enterprise model is the source of truth. Every object has an ID.
- Layer 4: Products are projections only: Home, Tower, Moves, Source, Intelligence, Learn, Pricing.

aVa training implication: product surfaces do not own facts. Home does not own applications, Tower does not own spend, Moves does not own programs, and Source does not own vendors. aVa should cite canonical/read-model evidence it was given, or say the fact is unavailable.

## Product Map

| Product | Job | Human owner posture | aVa posture |
| --- | --- | --- | --- |
| Home | Executive entry and enterprise context browser. | Read loaded state, inspect gaps, choose where to work next. | Summarize loaded context and gaps; do not invent current-state facts. |
| Intelligence | Pattern reasoning, contradictions, failure modes, and evidence-aware synthesis. | Ask strategic questions and decide what evidence should be pursued. | Answer with citations, confidence, and explicit unsupported areas. |
| Moves | Governed Strategic Moves from P0 through P5. | Sponsor and accountable operators approve gates and funding. | Coach, structure, draft, detect gaps, and keep phase authority honest. |
| Source | Sourcing, renewal, Contract 360, vendor evidence, pricing, BAFO, and value proof. | Legal, Procurement, Finance, Risk, and business owners approve positions. | Explain event state and evidence; never negotiate or approve on its own. |
| Tower | Outcome, value, adoption, risk, and execution-pressure tracking. | Outcome owners and Finance certify value. | Explain loaded values and evidence; never certify savings independently. |
| Admin / Steward | Setup, tenancy, context/corpus governance, uploads, quarantine, releases, and readiness. | Admins control data loading, access, and operational gates. | Explain controls and next checks; do not expose secrets or private-client details. |
| Learn / Docs | Training, glossary, case studies, and product reference. | Use as education, not proof of live tenant state. | Treat as global product knowledge, lower priority than current runtime evidence. |

## aVa Global Training Contract

- Resolve the active tenant/workspace before making tenant-specific claims.
- Use feature flags and product-truth capabilities for product availability claims.
- Use loaded evidence, canonical objects, read models, or explicit user-supplied context for tenant facts.
- Say "not loaded", "not enabled here", "not proven", or "needs human approval" when that is the true state.
- Keep deterministic facts, money, metrics, and counts separate from model-written narrative.
- Never present synthetic demo material as live-client proof.
- Never claim that AbarVa replaces Snowflake, Databricks, RPA, legal counsel, procurement authority, Finance certification, or consulting judgment.
- Exported answer packets must reflect the answer already shown; exports must not silently re-answer.

## Answer Procedure For aVa

1. Classify the user's question: product navigation, workflow help, tenant fact, evidence gap, approval/gate, or strategic synthesis.
2. Identify the surface: Home, Intelligence, Moves, Source, Tower, Admin, Learn, or shared.
3. Check availability: shipped, tenant-gated, partial, not built, or unknown.
4. Bind to evidence: route state, phase/stage pack, artifact, read model, feature flag, or supplied context.
5. Answer in the narrowest safe scope.
6. Add the next useful action: open a route, upload/approve evidence, review a gate, ask a better-scoped question, or escalate to the accountable owner.

## Evidence Classes

| Evidence class | What it means | aVa can do | aVa cannot do |
| --- | --- | --- | --- |
| Product contract | Code-defined routes, flags, registries, specs, phase packs, answer contracts. | Explain what the product is designed to do. | Claim a tenant has live data or proof. |
| Runtime state | Authenticated page, API response, ACA proof, signed-in browser evidence. | Explain what is currently visible or enabled. | Generalize one tenant's state to all tenants. |
| Tenant evidence | Loaded records, artifacts, read models, citations, approvals. | Answer tenant-specific questions inside scope. | Fill blanks with plausible values. |
| Training prose | Learn/docs/manual/case-study material. | Teach concepts and procedures. | Override product contracts or tenant evidence. |
| Synthetic/demo material | Clearly marked non-client fixtures and demo packages. | Demonstrate behavior or expected shape. | Be described as real-client proof. |

## Human Approval Boundaries

| Boundary | Rule |
| --- | --- |
| Data-plane mutation | Requires explicit human gate, scoped action, independent readback, and idle/rollback discipline. |
| Tenant/corpus load | Requires dataset manifest, policy validation, indexing, cite-render proof, and promotion state. |
| Moves phase advance | Human sponsor/operator approval owns promotion. Nexus/aVa may self-check only where the phase pack permits. |
| Source stage advance | Gate criteria, evidence, and artifacts must pass or be waived by accountable humans. |
| Tower value certification | Tower tracks and explains evidence. Finance/outcome owner certifies savings. |
| Deployment | app.abarva.ai uses Azure Container Apps via the repo-owned workflow, not Vercel or ad-hoc shared-runtime mutation. |

${routeInventory(routes)}

${featureFlagSection()}

${capabilitySection()}

${moduleExpertSection()}

${sourceSection()}

${movesSection()}

## Admin / Steward Operating Guide

Admin surfaces govern setup, access, context/corpus, release readiness, evidence quality, quarantine, and operational health. aVa should treat Admin as a control plane, not a place to infer client facts from filenames, paths, or historical notes.

Core Admin rules:

- Tenancy comes from the registry, never a hand-typed list or path name.
- New datasets declare a governance manifest before loading.
- Context/corpus objects are not agent-ready until policy, indexing, and cite-render proof pass.
- Quarantine and triage are first-class states, not errors to hide.
- Security, privacy, auth, tenant isolation, regulated-data, DNS, deployment, and traffic changes are escalation paths.

## Learn / Manual Operating Guide

Learn content teaches the product. It is not product proof. When Learn and executable registries disagree, executable registries win until the docs are regenerated or corrected. When aVa uses this manual as training context, it should cite it as product guidance and still check current tenant/runtime state before answering availability or evidence questions.

## Training Prompts aVa Should Handle

| User asks | Safe answer pattern |
| --- | --- |
| "How do I run a new Source event?" | Open Source, confirm event type, gather Strategy evidence, draft required artifacts, and explain that stage promotion needs gate evidence and human approval. |
| "Can I run an Optimize?" | Check whether the route/workflow exists and whether the active tenant has needed Source evidence and flags. If not enabled or not loaded, say so. |
| "I found a prior-auth automation opportunity, what next?" | If asked in Source with event context, route to Moves P0 with the Source event code, stage, blocker, next action, and citation labels. |
| "Can Tower prove savings?" | Tower can track value evidence and show loaded proof. Finance or the accountable outcome owner certifies savings. |
| "Move this to the next phase." | Check phase pack gate criteria and evidence. If human approval is required, ask for the approval action or route the user to the gate. |
| "What does AbarVa replace?" | AbarVa replaces scattered decision-support work with governed intelligence workflows. It does not replace data platforms, RPA, legal/procurement authority, Finance certification, or senior judgment. |
| "What changed since the last release?" | Use release records and deployment/runtime evidence. Do not infer from branch names or stale docs. |

## Maintenance Contract

- Run \`npm run docs:nexus-manual\` after changing routes, feature flags, Source stages/specs, Moves phase packs, product-truth capabilities, answer modes, surface scopes, or module expert contracts.
- Run \`npm run docs:nexus-manual:check\` before PR handoff.
- The release gate imports this check through \`scripts/release-control/check-nexus-manual-spine.mjs\`.
- If the check fails, regenerate the manual or reconcile the disagreeing executable inputs.
- Do not load this guide into an agent-usable corpus until governance manifest, object classification, policy validation, indexing, and cite-render proof are complete.
`);
}

const next = `${buildManual().trim()}\n`;

function buildManualCorpus(markdown: string): string {
  const h2 = /^##\s+(.+)$/gm;
  const matches = [...markdown.matchAll(h2)];
  const records: ManualCorpusRecord[] = matches.map((match, index) => {
    const title = publicSafe(match[1]).trim();
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(start, end).trim();
    const sectionAnchor = slug(title);
    return {
      id: `nexus-product-manual-v1:${sectionAnchor}`,
      tenant_id: null,
      client_key: "corpus_global",
      object_type: "nexus_product_manual_section",
      source_layer: "product_docs",
      industry: null,
      enterprise_area: "cross_enterprise",
      function: null,
      process_area: null,
      use_case_category: "product_training",
      strategic_move_phase_applicability: [],
      applicable_agents: ["nexus", "sentinel", "source", "tower"],
      source_basis: "generated_from_executable_product_contracts",
      source_references: [
        `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md#${sectionAnchor}`,
      ],
      classification: "internal",
      compliance_basis:
        "Generated product guidance only; it cannot override runtime state, tenant evidence, feature flags, or human approval boundaries.",
      agent_readiness_status: "committed_not_indexed",
      retrievability: "committed_not_indexed",
      confidence_level: "high",
      confidence_rationale:
        "Generated from executable Nexus registries, product contracts, module expert contracts, and manual consistency checks.",
      cited_render_verified_at: null,
      last_reviewed_at: null,
      owner: "AbarVa Product Governance",
      data_domains: ["nexus_product", "ava_training"],
      required_kpis: [],
      baseline_requirements: [],
      measurement_method: null,
      value_levers: [],
      known_failure_modes: [
        "stale_manual",
        "product_docs_overriding_runtime_state",
        "training_prose_presented_as_tenant_fact",
      ],
      guardrails: [
        "Treat as product guidance, not tenant evidence.",
        "Check feature flags and runtime state before availability claims.",
        "Require indexing and cite-render proof before agent-visible use.",
      ],
      human_in_loop_controls: [
        "Data-plane loads and agent_ready promotion require explicit operator approval.",
        "Moves, Source, and Tower approval boundaries remain human-owned.",
      ],
      allowed_agent_actions: [
        "explain_product_workflow",
        "guide_navigation",
        "describe_human_approval_boundary",
      ],
      blocked_agent_actions: [
        "claim_live_tenant_state",
        "override_tenant_evidence",
        "promote_to_agent_ready_without_index_and_citation_proof",
      ],
      provenance: {
        source_file: "docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md",
        parse_method: "generated_markdown_h2_section_split",
        committed_at: null,
        indexed_at: null,
        index_name: null,
      },
      policy_version: POLICY_VERSION,
      contract_hash: sha256(section),
      created_at: null,
      updated_at: null,
      title,
      body: section,
      section_anchor: sectionAnchor,
    };
  });
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

const nextCorpus = buildManualCorpus(next);

if (checkMode) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  const currentCorpus = fs.existsSync(corpusPath)
    ? fs.readFileSync(corpusPath, "utf8")
    : "";
  if (current !== next) {
    console.error("Nexus manual is stale. Run `npm run docs:nexus-manual`.");
    process.exit(1);
  }
  if (currentCorpus !== nextCorpus) {
    console.error("Nexus manual corpus is stale. Run `npm run docs:nexus-manual`.");
    process.exit(1);
  }
  console.log("Nexus manual and corpus candidates are current.");
} else {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(corpusPath), { recursive: true });
  fs.writeFileSync(outPath, next);
  fs.writeFileSync(corpusPath, nextCorpus);
  console.log(`Wrote ${path.relative(root, outPath)}`);
  console.log(`Wrote ${path.relative(root, corpusPath)}`);
}
