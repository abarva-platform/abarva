import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { parseFileToRows } from "../../src/lib/source/facts/extraction/file-to-rows";
import {
  mapTemplateUploadToFacts,
  type ParsedTemplateUpload,
} from "../../src/lib/source/facts/extraction/structured-map";
import {
  applyValidationDecisions,
  commitValidatedCandidates,
  parseDocumentToCandidates,
  type FactLocatorRule,
  type ParsedDocument,
} from "../../src/lib/source/facts/extraction/parse-validate";
import { templateFactMapByCode } from "../../src/lib/source/facts/template-fact-map";
import type { SourceEventFactInsert } from "../../src/lib/source/facts/fact-types";
import { extractVendorProposalFacts } from "../../src/lib/source/vendor-proposals/extract-vendor-proposal-facts";

type ProofStepStatus = "pass" | "fail" | "informational";

interface ProofStep {
  name: string;
  status: ProofStepStatus;
  evidence: Record<string, unknown>;
}

interface CapturedFactRow extends SourceEventFactInsert {
  captured_at: string;
  is_stale: boolean;
}

class InMemoryFactWriteSeam {
  private rows: CapturedFactRow[] = [];

  async insertFacts(facts: readonly SourceEventFactInsert[]) {
    const capturedAt = new Date().toISOString();
    this.rows.push(
      ...facts.map((fact) => ({
        ...fact,
        captured_at: capturedAt,
        is_stale: false,
      })),
    );
    return { ok: true as const, data: { inserted: facts.length } };
  }

  readback(
    filter: Partial<Pick<CapturedFactRow, "source_method" | "fact_key">> = {},
  ) {
    return this.rows.filter((row) => {
      if (filter.source_method && row.source_method !== filter.source_method)
        return false;
      if (filter.fact_key && row.fact_key !== filter.fact_key) return false;
      return true;
    });
  }

  allRows() {
    return [...this.rows];
  }
}

function parseArgs(argv: readonly string[]) {
  let outDir: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--out-dir") {
      outDir = argv[i + 1] ?? null;
      i += 1;
    }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    outDir:
      outDir ??
      path.join(
        os.tmpdir(),
        `source-controlled-upload-parse-readback-proof-${stamp}`,
      ),
  };
}

function requireCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function byFactKey(rows: readonly CapturedFactRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.fact_key] = (acc[row.fact_key] ?? 0) + 1;
    return acc;
  }, {});
}

async function proveStructuredCsvUpload(args: {
  sourceEventId: string;
  clientKey: string;
  writeSeam: InMemoryFactWriteSeam;
}): Promise<ProofStep> {
  const templateCode = "CONTRACT_TERMS_V1";
  const template = templateFactMapByCode(templateCode);
  requireCondition(template, `${templateCode} template map is missing`);

  const csv = [
    [
      "Vendor",
      "Transition Fee (USD)",
      "Transition Overrun Probability (%)",
      "Overrun Cost Multiple (x)",
      "SLA Credit Cap (%)",
      "At-Risk Fee Pool (USD/yr)",
      "Committed Productivity Credit (%)",
      "Retained FTE Delta",
      "Contract Term (Years)",
      "Unmapped Notes",
    ].join(","),
    [
      "Vendor A",
      "$250,000",
      "30",
      "1.6",
      "12",
      "$18,000,000",
      "4",
      "9",
      "5",
      "ignored by map",
    ].join(","),
  ].join("\n");

  const parsed: ParsedTemplateUpload = await parseFileToRows({
    bytes: Buffer.from(csv, "utf8"),
    filename: "vendor-commercials.csv",
    mimeType: "text/csv",
  });
  const mapped = mapTemplateUploadToFacts(template, parsed, {
    sourceEventId: args.sourceEventId,
    clientKey: args.clientKey,
  });

  await args.writeSeam.insertFacts(mapped.facts);
  const readback = args.writeSeam.readback({ source_method: "structured_map" });

  requireCondition(
    parsed.headers.length === 10,
    "CSV parser did not preserve all headers",
  );
  requireCondition(
    mapped.facts.length === 8,
    "Expected 8 mapped contract-term facts",
  );
  requireCondition(
    mapped.unmappedColumns.includes("Unmapped Notes"),
    "Expected unmapped column to be reported loudly",
  );
  requireCondition(
    readback.length === 8,
    "Structured-map readback did not return 8 facts",
  );
  requireCondition(
    readback.every((row) => row.source_citation?.doc === templateCode),
    "Structured facts must cite the template code",
  );

  return {
    name: "CSV/XLSX-style structured upload -> typed facts -> readback",
    status: "pass",
    evidence: {
      productionMutation: false,
      parser: "parseFileToRows",
      templateCode,
      parsedHeaders: parsed.headers,
      parsedRows: parsed.rows.length,
      mappedFacts: mapped.facts.length,
      unmappedColumns: mapped.unmappedColumns,
      rejectedRows: mapped.rejectedRows.length,
      readbackFacts: readback.length,
      readbackByFactKey: byFactKey(readback),
    },
  };
}

async function proveDocumentParseValidateCommit(args: {
  sourceEventId: string;
  clientKey: string;
  writeSeam: InMemoryFactWriteSeam;
}): Promise<ProofStep> {
  const doc: ParsedDocument = {
    doc: "proposal-extract-page-blocks",
    blocks: [
      {
        locator: "page 11, commercial summary",
        text: "The one-time transition fee is $250,000 for Vendor A.",
      },
      {
        locator: "page 12, service economics",
        text: "Annual change-order spend is $1,200,000 across the in-scope towers.",
      },
      {
        locator: "page 13, productivity",
        text: "The committed productivity credit is 4% per contract year.",
      },
    ],
  };
  const rules: FactLocatorRule[] = [
    {
      factKey: "transition_fee",
      entityRef: "Vendor A",
      confidence: "med",
      patterns: [/transition fee is\s+\$?([\d,]+)/i],
    },
    {
      factKey: "annual_change_order_spend",
      confidence: "med",
      patterns: [/Annual change-order spend is\s+\$?([\d,]+)/i],
    },
    {
      factKey: "committed_credit_pct",
      entityRef: "Vendor A",
      confidence: "med",
      patterns: [/committed productivity credit is\s+([\d.]+)%/i],
    },
    {
      factKey: "at_risk_fee_pool",
      entityRef: "Vendor A",
      confidence: "med",
      patterns: [/at-risk fee pool is\s+\$?([\d,]+)/i],
    },
  ];

  const proposed = parseDocumentToCandidates(doc, rules, {
    sourceEventId: args.sourceEventId,
    clientKey: args.clientKey,
  });
  requireCondition(
    proposed.candidates.length === 3,
    "Expected 3 located candidate facts",
  );
  requireCondition(
    proposed.rejected.length === 1,
    "Expected 1 unlocated rejected rule",
  );

  const annualChangeOrderCandidate = proposed.candidates.find(
    (candidate) => candidate.insert.fact_key === "annual_change_order_spend",
  );
  const transitionCandidate = proposed.candidates.find(
    (candidate) => candidate.insert.fact_key === "transition_fee",
  );
  const productivityCandidate = proposed.candidates.find(
    (candidate) => candidate.insert.fact_key === "committed_credit_pct",
  );
  requireCondition(
    annualChangeOrderCandidate,
    "Missing change-order candidate",
  );
  requireCondition(transitionCandidate, "Missing transition-fee candidate");
  requireCondition(productivityCandidate, "Missing productivity candidate");

  const decisions = applyValidationDecisions(proposed.candidates, [
    { candidateId: transitionCandidate.candidateId, action: "confirm" },
    {
      candidateId: annualChangeOrderCandidate.candidateId,
      action: "edit",
      valueNumeric: 1_100_000,
    },
    { candidateId: productivityCandidate.candidateId, action: "reject" },
  ]);
  requireCondition(
    decisions.unapplied.length === 0,
    "Expected all decisions to apply",
  );

  const commit = await commitValidatedCandidates(
    decisions.validated,
    { sourceEventId: args.sourceEventId, clientKey: args.clientKey },
    args.writeSeam,
  );
  const readback = args.writeSeam.readback({ source_method: "parsed" });
  const edited = readback.find(
    (row) => row.fact_key === "annual_change_order_spend",
  );

  requireCondition(commit.ok, `Commit failed: ${commit.error ?? "unknown"}`);
  requireCondition(
    commit.committed === 2,
    "Expected exactly 2 committed parsed facts",
  );
  requireCondition(
    commit.dropped === 1,
    "Expected rejected candidate to be dropped",
  );
  requireCondition(
    readback.length === 2,
    "Parsed readback did not return 2 facts",
  );
  requireCondition(
    !readback.some((row) => row.fact_key === "committed_credit_pct"),
    "Rejected productivity candidate must not be persisted",
  );
  requireCondition(
    edited?.source_citation?.edited_from === 1_200_000,
    "Edited fact must preserve edited_from provenance",
  );

  return {
    name: "Document parse -> human validation -> commit seam -> readback",
    status: "pass",
    evidence: {
      productionMutation: false,
      parser: "parseDocumentToCandidates",
      proposedCandidates: proposed.candidates.length,
      rejectedRules: proposed.rejected,
      validationDecisions: {
        confirmed: 1,
        edited: 1,
        rejected: 1,
      },
      commit,
      readbackFacts: readback.length,
      readbackByFactKey: byFactKey(readback),
      editedFactCitation: edited?.source_citation,
    },
  };
}

function proveVendorProposalExtraction(): ProofStep {
  const proposalText = [
    "[page 12] Solution architecture: Azure landing zone with ServiceNow CMDB federation and governed integration patterns.",
    "[page 18] AI automation: 22% ticket-deflection target for knowledge-enabled L1 service desk interactions.",
    "[page 21] Accelerator: Migration factory reusable runbook and test harness for airline operations workloads.",
    "[page 31] SLA: 99.9% platform availability with service-credit remedy language.",
    "[page 44] Evidence: Three client references, implementation plan appendix, and named solution assets.",
  ].join("\n");
  const candidates = extractVendorProposalFacts(proposalText);
  const factKeys = new Set(candidates.map((candidate) => candidate.factKey));

  for (const expected of [
    "solution_architecture",
    "automation_productivity",
    "accelerator",
    "sla",
    "evidence_reference",
  ]) {
    requireCondition(
      factKeys.has(expected),
      `Missing vendor proposal candidate '${expected}'`,
    );
  }

  return {
    name: "Rich vendor proposal text -> candidate facts",
    status: "pass",
    evidence: {
      productionMutation: false,
      persistence:
        "not run; proposal facts use a separate review/persistence path",
      extractor: "extractVendorProposalFacts",
      candidateFacts: candidates.length,
      factKeys: [...factKeys],
      candidateOnlyBoundary:
        "This proves extraction readiness, not source_event_facts persistence for proposal facts.",
    },
  };
}

function buildApplyBoundary() {
  return {
    liveMutationRemainsGated: true,
    controlledApplyOptions: [
      {
        path: "product-route upload",
        command:
          "POST /api/v1/source/:eventId/facts/ingest-file with a signed-in session, selected tenant/event, templateCode, and file",
        requiredProof:
          "capture event id, tenant/client key, templateCode, source artifact id, pre/post source_event_facts counts, route response, artifact processing state, and route-scoped readback",
      },
      {
        path: "operator/package load",
        command:
          "node scripts/source/load-source-golden-contract-evidence.mjs --package-dir <approved-package> --tenant-key <approved-tenant> --dataset-id <approved-dataset> --dataset-version <version> --contract-id <ids> --apply",
        requiredProof:
          "run only through approved data-plane lane with idempotency/load-run id, manifest hash, preflight, post-apply readback, proof bundle, and idle/runtime invariant where applicable",
      },
    ],
  };
}

async function main() {
  const { outDir } = parseArgs(process.argv.slice(2));
  const sourceEventId =
    "lane2-proof-event-00000000-0000-4000-8000-000000000001";
  const clientKey = "lane2-proof-client";
  const writeSeam = new InMemoryFactWriteSeam();

  const steps: ProofStep[] = [];
  steps.push(
    await proveStructuredCsvUpload({ sourceEventId, clientKey, writeSeam }),
  );
  steps.push(
    await proveDocumentParseValidateCommit({
      sourceEventId,
      clientKey,
      writeSeam,
    }),
  );
  steps.push(proveVendorProposalExtraction());

  const persistedRows = writeSeam.allRows();
  const summary = {
    generatedAt: new Date().toISOString(),
    sourceEventId,
    clientKey,
    productionMutation: false,
    databaseConnectionUsed: false,
    writeSeam: "in-memory capture adapter",
    steps,
    readback: {
      totalFacts: persistedRows.length,
      bySourceMethod: persistedRows.reduce<Record<string, number>>(
        (acc, row) => {
          acc[row.source_method] = (acc[row.source_method] ?? 0) + 1;
          return acc;
        },
        {},
      ),
      byFactKey: byFactKey(persistedRows),
      allRows: persistedRows,
    },
    controlledApplyBoundary: buildApplyBoundary(),
  };

  requireCondition(
    steps.every(
      (step) => step.status === "pass" || step.status === "informational",
    ),
    "One or more proof steps failed",
  );
  requireCondition(
    persistedRows.length === 10,
    "Expected 10 captured fact rows total",
  );

  await mkdir(outDir, { recursive: true });
  const jsonPath = path.join(
    outDir,
    "controlled-upload-parse-readback-proof.json",
  );
  const mdPath = path.join(outDir, "controlled-upload-parse-readback-proof.md");
  await writeFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(
    mdPath,
    [
      "# Source controlled upload -> parse -> persist -> readback proof",
      "",
      `Generated: ${summary.generatedAt}`,
      "",
      "## Boundary",
      "",
      "- Production mutation: false",
      "- Database connection used: false",
      "- Write seam: in-memory capture adapter",
      "- Live mutation remains gated: true",
      "",
      "## Results",
      "",
      ...steps.map(
        (step) =>
          `- ${step.status.toUpperCase()}: ${step.name} (${JSON.stringify(step.evidence)})`,
      ),
      "",
      "## Readback",
      "",
      `- Total captured fact rows: ${persistedRows.length}`,
      `- By source method: ${JSON.stringify(summary.readback.bySourceMethod)}`,
      `- By fact key: ${JSON.stringify(summary.readback.byFactKey)}`,
      "",
      "## Controlled apply boundary",
      "",
      "Live mutation is intentionally not performed by this proof. Use the JSON proof for the exact controlled apply options and required proof gates.",
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        outDir,
        jsonPath,
        mdPath,
        productionMutation: false,
        databaseConnectionUsed: false,
        capturedFacts: persistedRows.length,
        stepCount: steps.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
