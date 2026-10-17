import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { prepareExecutiveContext } from "@/lib/intelligence/ask/executive-context";
import { buildGroundedSourceAnswer } from "@/lib/source/archetypes/grounded-answer";
import { CONTRACT_RENEWAL } from "@/lib/source/archetypes/registry";
import {
  buildGovernedEventContextBundle,
  type EventContextCandidate,
  type EventContextIdentity,
} from "@/lib/source/ava/event-context-bundle";
import {
  buildDecisionReasoningRequest,
  buildValidatedAgentContextBundle,
  type BuildBundleOptions,
  type GovernedCandidate,
} from "../agent-context-bundle";
import { fromEnterpriseBundle } from "../context-bundle-adapters";

const APIS = [
  "buildValidatedAgentContextBundle",
  "buildDecisionReasoningRequest",
] as const;
type Api = (typeof APIS)[number];
type Readiness = "true" | "false" | "omitted" | "forwarded";
interface Caller {
  file: string;
  api: Api;
  owner: string;
  readiness: Readiness;
}

const ROOT = path.resolve(__dirname, "../../../..");
const BUNDLE_MODULE = "src/lib/governance/agent-context-bundle.ts";

function apiName(name: string): Api | undefined {
  return APIS.find((api) => api === name);
}

function runtimeFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return ["__tests__", "__mocks__", "node_modules"].includes(entry.name)
        ? []
        : runtimeFiles(filename);
    }
    return /\.(?:[cm]?[jt]sx?)$/.test(entry.name) &&
      !/\.(?:test|spec|d)\.[cm]?[jt]sx?$/.test(entry.name)
      ? [filename]
      : [];
  });
}

function enclosingFunction(node: ts.Node): string {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isFunctionDeclaration(parent) && parent.name)
      return parent.name.text;
    if (
      (ts.isArrowFunction(parent) || ts.isFunctionExpression(parent)) &&
      ts.isVariableDeclaration(parent.parent) &&
      ts.isIdentifier(parent.parent.name)
    ) {
      return parent.parent.name.text;
    }
  }
  return "top-level";
}

function readinessOption(expression: ts.Expression | undefined): Readiness {
  if (!expression) return "omitted";
  if (ts.isIdentifier(expression) && expression.text === "options") {
    return "forwarded";
  }
  if (!ts.isObjectLiteralExpression(expression)) {
    throw new Error("Review a new dynamic governance options expression");
  }
  let readiness: Readiness = "omitted";
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error("Review governance options with spreads or shorthand");
    }
    const name = property.name;
    if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) {
      throw new Error("Review computed governance option names");
    }
    if (name.text !== "requireAgentReady") continue;
    if (property.initializer.kind === ts.SyntaxKind.TrueKeyword)
      readiness = "true";
    else if (property.initializer.kind === ts.SyntaxKind.FalseKeyword)
      readiness = "false";
    else throw new Error("Review a nonliteral requireAgentReady option");
  }
  return readiness;
}

// Parse calls and import bindings; comments, strings and type references are not callers.
function callersIn(file: string, source: string): Caller[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const bindings = new Map<string, Api>();
  const namespaces = new Set<string>();
  if (file === BUNDLE_MODULE) APIS.forEach((api) => bindings.set(api, api));
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      statement.importClause?.isTypeOnly
    )
      continue;
    const imports = statement.importClause?.namedBindings;
    if (imports && ts.isNamedImports(imports)) {
      for (const specifier of imports.elements) {
        if (specifier.isTypeOnly) continue;
        const api = apiName((specifier.propertyName ?? specifier.name).text);
        if (api) bindings.set(specifier.name.text, api);
      }
    }
    if (
      imports &&
      ts.isNamespaceImport(imports) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.endsWith("agent-context-bundle")
    )
      namespaces.add(imports.name.text);
  }
  const callers: Caller[] = [];
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const api = ts.isIdentifier(callee)
        ? bindings.get(callee.text)
        : ts.isPropertyAccessExpression(callee) &&
            ts.isIdentifier(callee.expression) &&
            namespaces.has(callee.expression.text)
          ? apiName(callee.name.text)
          : undefined;
      if (api)
        callers.push({
          file,
          api,
          owner: enclosingFunction(node),
          readiness:
            api === "buildValidatedAgentContextBundle"
              ? readinessOption(node.arguments[1])
              : "omitted",
        });
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return callers;
}

function moduleReferencesIn(file: string, source: string): string[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const references: string[] = [];
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !(ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) &&
      !(ts.isExportDeclaration(node) && node.isTypeOnly)
    ) {
      references.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      references.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return references;
}

const EXPECTED_CALLERS: Array<[string, string, Readiness]> = [
  ["scripts/deliverables/proof/purpose-fresh-source.ts", "main", "false"],
  [
    "scripts/ecl/build_home_ecl_narrative_layer.ts",
    "buildGovernedSignalPacket",
    "true",
  ],
  [
    "scripts/ecl/build_home_ecl_narrative_layer.ts",
    "buildGovernedSignalPacket",
    "true",
  ],
  [
    "src/lib/ecl/insights/home-admission.ts",
    "validateHomeInsightAdmission",
    "true",
  ],
  [BUNDLE_MODULE, "buildDecisionReasoningRequest", "true"],
  [
    "src/lib/intelligence/ask/executive-context.ts",
    "prepareExecutiveContext",
    "omitted",
  ],
  ["src/lib/knowledge/agent-context-broker.ts", "withGovernance", "omitted"],
  [
    "src/lib/programs/evidence-readiness/exact-source-preparation.ts",
    "prepareExactSourcePlan",
    "true",
  ],
  ["src/lib/programs/move-agent-admission.ts", "admitMoveSources", "true"],
  [
    "src/lib/source/archetypes/grounded-answer.ts",
    "buildGroundedSourceAnswer",
    "omitted",
  ],
  [
    "src/lib/source/ava/award-readiness-governed-answer.ts",
    "buildAwardReadinessGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/bafo-instructions-governed-answer.ts",
    "buildBafoInstructionsGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/event-context-bundle.ts",
    "buildGovernedEventContextBundle",
    "forwarded",
  ],
  [
    "src/lib/source/ava/evidence-readiness-governed-answer.ts",
    "buildEvidenceReadinessGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/pricing-comparison-governed-answer.ts",
    "buildPricingComparisonGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/rfp-design-governed-answer.ts",
    "buildRfpDesignGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/selection-decision-governed-answer.ts",
    "buildSelectionDecisionGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/value-ledger-governed-answer.ts",
    "buildValueLedgerGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/vendor-coverage-governed-answer.ts",
    "buildProfileGroundedVendorCoverageAnswer",
    "false",
  ],
  [
    "src/lib/source/ava/vendor-coverage-governed-answer.ts",
    "buildVendorCoverageGovernedAnswer",
    "false",
  ],
  [
    "src/lib/source/new-workspace/event-intelligence.ts",
    "buildSourceNewEventIntelligence",
    "true",
  ],
  [
    "src/lib/source/vendor-proposals/governed-vendor-proposal-facts.ts",
    "buildGovernedVendorProposalFactBundle",
    "false",
  ],
  [
    "src/scripts/context-healthcheck/client-context-healthcheck.ts",
    "bundleProbe",
    "omitted",
  ],
];

const callers = ["src", "scripts", "tests"]
  .flatMap((directory) =>
    runtimeFiles(path.join(ROOT, directory)).flatMap((filename) =>
      callersIn(path.relative(ROOT, filename), readFileSync(filename, "utf8")),
    ),
  )
  .sort((left, right) => left.file.localeCompare(right.file));

function readyCandidate(
  clientKey: string,
  overrides: Partial<GovernedCandidate> = {},
): GovernedCandidate {
  return {
    id: "ready-control",
    client_key: clientKey,
    tenant_id: "fixture-tenant-id",
    source_layer: "tenant_context",
    source_basis: "fixture://declared-source/v1",
    classification: "internal",
    retrievability: "fts_indexed",
    agent_readiness_status: "agent_ready",
    confidence_level: "high",
    cited_render_verified_at: "2026-10-17T00:00:00Z",
    citations: ["fixture://ready#1"],
    ...overrides,
  };
}

function candidateVariants(clientKey: string): GovernedCandidate[] {
  return [
    readyCandidate(clientKey, {
      id: "candidate-floor",
      agent_readiness_status: "blocked",
      downstream_context_policy: "exclude",
      retrievability: "not_indexed",
      confidence_level: "unverified",
      cited_render_verified_at: null,
      citations: ["fixture://candidate-floor#1"],
    }),
    readyCandidate(clientKey, {
      id: "blocked-only",
      agent_readiness_status: "blocked",
      citations: ["fixture://blocked#1"],
    }),
    readyCandidate(clientKey, {
      id: "excluded-only",
      downstream_context_policy: "exclude",
      citations: ["fixture://excluded#1"],
    }),
    readyCandidate(clientKey, {
      id: "quarantined",
      agent_readiness_status: "quarantined",
      citations: ["fixture://quarantined#1"],
    }),
    readyCandidate(clientKey, {
      id: "retired",
      agent_readiness_status: "retired",
      citations: ["fixture://retired#1"],
    }),
  ];
}

function optionsFor(readiness: Readiness): BuildBundleOptions[] {
  const settings =
    readiness === "forwarded"
      ? [{}, { requireAgentReady: false }, { requireAgentReady: true }]
      : readiness === "omitted"
        ? [{}]
        : [{ requireAgentReady: readiness === "true" }];
  return settings.flatMap((setting) => [
    setting,
    {
      ...setting,
      allowSensitive: true,
      allowRestrictedDownstreamContext: true,
    },
  ]);
}

describe("non-serving candidate advisory readiness", () => {
  it("discovers the reviewed call inventory with no runtime decision-request callers", () => {
    expect(callers).toEqual(
      EXPECTED_CALLERS.map(([file, owner, readiness]) => ({
        file,
        owner,
        readiness,
        api: "buildValidatedAgentContextBundle",
      })),
    );
  });

  it("recognizes named aliases and namespaces without counting prose or type references", () => {
    expect(
      callersIn(
        "fixture.ts",
        `
      import { buildValidatedAgentContextBundle as gate } from "./agent-context-bundle";
      import * as governance from "./agent-context-bundle";
      // buildDecisionReasoningRequest({ candidates: [] });
      const prose = "buildValidatedAgentContextBundle([])";
      type Result = ReturnType<typeof gate>;
      function check() {
        gate([], { requireAgentReady: true });
        governance.buildDecisionReasoningRequest({ candidates: [] });
      }
    `,
      ),
    ).toEqual([
      { file: "fixture.ts", api: APIS[0], owner: "check", readiness: "true" },
      {
        file: "fixture.ts",
        api: APIS[1],
        owner: "check",
        readiness: "omitted",
      },
    ]);
    expect(() =>
      callersIn(
        "fixture.ts",
        `
      import { buildValidatedAgentContextBundle as gate } from "./agent-context-bundle";
      gate([], { requireAgentReady: true, ...unknownOptions });
    `,
      ),
    ).toThrow("spreads or shorthand");
  });

  it("keeps candidate execution modules disconnected from src runtime consumers", () => {
    const candidateModules = new Set([
      "scripts/ecl/adapt_ec_private_candidate_v0",
      "scripts/ecl/ec_private_candidate_types",
      "scripts/ecl/ec_slice_v6_shadow",
      "scripts/ecl/ec_slice_rules",
    ]);
    const consumers = runtimeFiles(path.join(ROOT, "src")).flatMap(
      (filename) => {
        const file = path.relative(ROOT, filename);
        return moduleReferencesIn(file, readFileSync(filename, "utf8")).flatMap(
          (reference) => {
            const resolved = reference.startsWith("@/")
              ? `src/${reference.slice(2)}`
              : path.posix.normalize(
                  path.posix.join(path.posix.dirname(file), reference),
                );
            const resolvedModule = resolved.replace(/\.[cm]?[jt]sx?$/, "");
            return candidateModules.has(resolvedModule)
              ? [`${file} -> ${resolvedModule}`]
              : [];
          },
        );
      },
    );
    expect(consumers).toEqual([]);
    expect(
      moduleReferencesIn(
        "fixture.ts",
        `
      import type { Candidate } from "./types";
      import { adapt } from "./adapter";
      export { adapt } from "./adapter";
      const dynamic = import("./adapter");
      const commonjs = require("./adapter");
      const prose = "import('./ignored')";
    `,
      ),
    ).toEqual(["./adapter", "./adapter", "./adapter", "./adapter"]);
  });

  describe.each(CANONICAL_TENANT_KEYS)("registry tenant %s", (clientKey) => {
    it.each(EXPECTED_CALLERS)(
      "excludes non-serving candidates at %s / %s (%s)",
      (_file, _owner, readiness) => {
        const refused = candidateVariants(clientKey);
        for (const options of optionsFor(readiness)) {
          const bundle = buildValidatedAgentContextBundle(
            [readyCandidate(clientKey), ...refused],
            options,
          );
          expect(bundle.usable.map((candidate) => candidate.id)).toEqual([
            "ready-control",
          ]);
          expect(bundle.blocked.map(({ candidate }) => candidate.id)).toEqual(
            refused.map((candidate) => candidate.id),
          );
          expect(bundle.citations).toEqual(["fixture://ready#1"]);
          expect(bundle.agentReadyCount).toBe(1);
          expect(bundle.decision).toBe("warn");
          const candidateOnly = buildValidatedAgentContextBundle(
            refused,
            options,
          );
          expect(candidateOnly.usable).toEqual([]);
          expect(candidateOnly.citations).toEqual([]);
          expect(candidateOnly.agentReadyCount).toBe(0);
          expect(candidateOnly.decision).toBe("block");
        }
      },
    );

    it.each([
      ["unreviewed", { agent_readiness_status: "not_reviewed" }],
      ["committed", { agent_readiness_status: "committed_not_indexed" }],
      ["restricted readiness", { agent_readiness_status: "restricted" }],
      ["not indexed", { retrievability: "not_indexed" }],
      ["committed index", { retrievability: "committed_not_indexed" }],
      ["missing source", { source_basis: null }],
      ["missing confidence", { confidence_level: null }],
      ["missing cite proof", { cited_render_verified_at: null }],
      ["missing tenant binding", { tenant_id: null }],
    ] satisfies Array<[string, Partial<GovernedCandidate>]>)(
      "strict advisory mode rejects %s",
      (_label, overrides) => {
        const bundle = buildValidatedAgentContextBundle(
          [readyCandidate(clientKey, overrides)],
          { requireAgentReady: true },
        );
        expect(bundle.usable).toEqual([]);
        expect(bundle.citations).toEqual([]);
        expect(bundle.blocked).toHaveLength(1);
        expect(bundle.agentReadyCount).toBe(0);
        expect(bundle.decision).toBe("block");
      },
    );

    it.each(["fts_indexed", "search_indexed"] as const)(
      "accepts a ready positive control with %s",
      (retrievability) => {
        const bundle = buildValidatedAgentContextBundle(
          [readyCandidate(clientKey, { retrievability })],
          { requireAgentReady: true },
        );
        expect(bundle.usable).toHaveLength(1);
        expect(bundle.agentReadyCount).toBe(1);
        expect(bundle.decision).toBe("pass");
      },
    );

    it("keeps blocked and excluded candidates out of the actual decision-request helper", () => {
      const request = buildDecisionReasoningRequest({
        task: "fixture advisory",
        agent: "nexus",
        tenantKey: clientKey,
        candidates: [
          readyCandidate(clientKey),
          ...candidateVariants(clientKey),
        ],
      });
      expect(request.retrievalBundle.usable.map(({ id }) => id)).toEqual([
        "ready-control",
      ]);
      expect(request.retrievalBundle.citations).toEqual(["fixture://ready#1"]);
    });

    it("keeps provisional context diagnostic-only, out of the decision request", () => {
      const provisional = readyCandidate(clientKey, {
        agent_readiness_status: "not_reviewed",
      });
      const request = buildDecisionReasoningRequest({
        task: "fixture advisory",
        agent: "nexus",
        tenantKey: clientKey,
        candidates: [provisional],
      });
      expect(request.retrievalBundle.usable).toEqual([]);
      expect(request.retrievalBundle.citations).toEqual([]);
      expect(request.retrievalBundle.blocked).toHaveLength(1);
      expect(request.retrievalBundle.agentReadyCount).toBe(0);
      expect(request.retrievalBundle.decision).toBe("block");
      expect(request.retrievalBundle.blocked[0].errors.join(" ")).toMatch(
        /require agent_ready/,
      );

      const diagnostic = buildValidatedAgentContextBundle([provisional]);
      expect(diagnostic.usable).toEqual([provisional]);
      expect(diagnostic.agentReadyCount).toBe(0);
    });

    const incompleteReadiness: Array<[string, Partial<GovernedCandidate>]> = [
      ["unreviewed", { agent_readiness_status: "not_reviewed" }],
      ["unindexed commitment", { agent_readiness_status: "committed_not_indexed" }],
      ["restricted readiness", { agent_readiness_status: "restricted" }],
      ["missing source", { source_basis: null }],
      ["missing confidence", { confidence_level: null }],
      ["missing cite-render proof", { cited_render_verified_at: null }],
      ["not indexed", { retrievability: "not_indexed" }],
      ["committed but not indexed", { retrievability: "committed_not_indexed" }],
    ];

    it.each(incompleteReadiness)(
      "excludes %s content and citations from a mixed decision request",
      (_label, overrides) => {
        const request = buildDecisionReasoningRequest({
          task: "fixture advisory",
          agent: "nexus",
          tenantKey: clientKey,
          candidates: [
            readyCandidate(clientKey),
            readyCandidate(clientKey, {
              ...overrides,
              id: "unready-control",
              citations: ["fixture://unready#1"],
            }),
          ],
        });

        expect(request.retrievalBundle.usable.map(({ id }) => id)).toEqual([
          "ready-control",
        ]);
        expect(request.retrievalBundle.citations).toEqual(["fixture://ready#1"]);
        expect(
          request.retrievalBundle.blocked.map(({ candidate }) => candidate.id),
        ).toEqual(["unready-control"]);
        expect(request.retrievalBundle.agentReadyCount).toBe(1);
        expect(request.retrievalBundle.decision).toBe("warn");
      },
    );

    it.each(["fts_indexed", "search_indexed"] as const)(
      "accepts a fully ready decision-request control with %s",
      (retrievability) => {
        const request = buildDecisionReasoningRequest({
          task: "fixture advisory",
          agent: "nexus",
          tenantKey: clientKey,
          candidates: [readyCandidate(clientKey, { retrievability })],
        });
        expect(request.retrievalBundle.usable).toHaveLength(1);
        expect(request.retrievalBundle.agentReadyCount).toBe(1);
        expect(request.retrievalBundle.decision).toBe("pass");
      },
    );

    it("preserves enterprise-item exclusion through the real adapter and bundle", () => {
      const candidates = fromEnterpriseBundle(
        {
          tenantKey: clientKey,
          items: [
            {
              id: "candidate-item",
              sourceBasis: "fixture://candidate/v1",
              downstreamContextPolicy: "exclude",
            },
          ],
        },
        clientKey,
        "fixture-tenant-id",
      );
      expect(candidates[0].downstream_context_policy).toBe("exclude");
      const bundle = buildValidatedAgentContextBundle(candidates);
      expect(bundle.usable).toEqual([]);
      expect(bundle.citations).toEqual([]);
      expect(bundle.blocked[0].errors).toContain(
        'downstream_context_policy is "exclude"; candidate may not enter an agent bundle',
      );
    });

    it("keeps the executive adapter provisional rather than minting readiness", () => {
      const result = prepareExecutiveContext(
        [
          {
            id: "fixture-source",
            type: "SURFACE",
            name: "Fixture source",
            detail: "Qualitative fixture only",
          },
        ],
        clientKey,
        "fixture-tenant-id",
      );
      expect(result.bundle.usable).toHaveLength(1);
      expect(result.bundle.agentReadyCount).toBe(0);
      expect(result.bundle.usable[0].agent_readiness_status).toBe(
        "not_reviewed",
      );
      expect(result.decisionGuard).toContain(
        "Every supplied company source is provisional",
      );
    });

    it("the actual grounded-answer postfilter rejects provisional and excluded evidence", () => {
      const familyKey = CONTRACT_RENEWAL.requiredEvidenceFamilies[0].key;
      const result = buildGroundedSourceAnswer({
        archetype: CONTRACT_RENEWAL,
        tenantKey: clientKey,
        candidates: [
          {
            ...readyCandidate(clientKey, {
              agent_readiness_status: "not_reviewed",
            }),
            familyKey,
          },
          ...candidateVariants(clientKey).map((candidate) => ({
            ...candidate,
            familyKey,
          })),
        ],
      });
      expect(result.bundle.usable).toHaveLength(1);
      expect(result.mayAnswer).toBe(false);
      expect(result.envelope.evidenceUsed).toEqual([]);
      expect(result.envelope.citations).toEqual([]);
    });

    it.each([false, true])(
      "the actual event wrapper excludes candidate text with requireAgentReady=%s",
      (requireAgentReady) => {
        const identity: EventContextIdentity = {
          tenantId: "fixture-tenant-id",
          clientKey,
          eventId: "fixture-event",
          contractId: null,
          currentStageKey: "strategy",
          acceptedArtifactVersions: {},
        };
        const toEventCandidate = (
          candidate: GovernedCandidate,
        ): EventContextCandidate => ({
          id: candidate.id,
          kind: "reviewed_evidence",
          tenantId: candidate.tenant_id,
          clientKey: candidate.client_key,
          eventId: identity.eventId,
          reviewState: "reviewed",
          sourceLayer: candidate.source_layer,
          sourceBasis: candidate.source_basis,
          classification: candidate.classification,
          retrievability: candidate.retrievability,
          agentReadinessStatus: candidate.agent_readiness_status,
          confidenceLevel: candidate.confidence_level,
          citedRenderVerifiedAt: candidate.cited_render_verified_at,
          downstreamContextPolicy: candidate.downstream_context_policy,
          citations: candidate.citations,
          content: `fixture text ${candidate.id}`,
        });
        const result = buildGovernedEventContextBundle(
          [readyCandidate(clientKey), ...candidateVariants(clientKey)].map(
            toEventCandidate,
          ),
          identity,
          {
            requireAgentReady,
            allowSensitive: true,
            allowRestrictedDownstreamContext: true,
          },
        );
        expect(result.admitted.map(({ id }) => id)).toEqual(["ready-control"]);
        expect(result.citations).toEqual(["fixture://ready#1"]);
        expect(result.refused).toHaveLength(5);
        expect(
          result.refused.every(
            ({ candidate, contentRedacted }) =>
              contentRedacted && candidate.content === undefined,
          ),
        ).toBe(true);
      },
    );
  });
});
