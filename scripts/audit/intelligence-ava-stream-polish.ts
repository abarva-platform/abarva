#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

import type { AvaAnswerPacket } from "../../src/lib/ava-answer/contract";
import { renderAvaAnswerStandaloneHtml } from "../../src/lib/ava-answer/export/render-answer-html";
import {
  scrubPublicAvaAnswerText,
  scrubPublicAvaSourceText,
} from "../../src/lib/ava-answer/public-answer-scrub";
import { validateAvaAnswerPacket } from "../../src/lib/ava-answer/validateAvaAnswerPacket";
import { sanitizeAgentAnswerForRender } from "../../src/lib/intelligence/answer/answer-safety";

const REPORT_DIR = path.join(
  process.cwd(),
  "reports/intelligence-ava-stream-polish",
);

const FORBIDDEN_PATTERNS: Array<[string, RegExp]> = [
  ["not loaded", /\bnot loaded\b/i],
  ["not_loaded", /\bnot_loaded\b/i],
  ["V-layer", /\bV[4-7](?:\b|[_:.-])/i],
  ["source_record_id", /\bsource_record_id\b/i],
  ["context_pack_id", /\bcontext_pack_id\b/i],
  ["evidence_id", /\bevidence_id\b/i],
  ["move_id", /\bmove_id\b/i],
  ["phase_id", /\bphase_id\b/i],
  ["artifact_id", /\bartifact_id\b/i],
  ["tenant_id", /\btenant_id\b/i],
  ["client_id", /\bclient_id\b/i],
  ["dossier", /\bdossier\b/i],
  ["substrate", /\bsubstrate\b/i],
  ["retrieval chunks", /\bretrieval chunks\b/i],
  ["graph nodes", /\bgraph nodes\b/i],
  ["relationship edges", /\brelationship edges\b/i],
  ["field facts", /\bfield facts\b/i],
  ["business records", /\bbusiness records\b/i],
  ["loaded context", /\bloaded context\b/i],
  ["loaded sources", /\bloaded sources\b/i],
  ["source-template", /\bsource-template\b/i],
  ["candidate_move", /\bcandidate_move\b/i],
  ["synthetic_demo_manifest_gated", /\bsynthetic_demo_manifest_gated\b/i],
];

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file: string, value: unknown) {
  fs.writeFileSync(path.join(REPORT_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
}

function scanText(label: string, text: string) {
  return FORBIDDEN_PATTERNS.flatMap(([name, pattern]) =>
    pattern.test(text) ? [{ label, pattern: name }] : [],
  );
}

function writeCsv(file: string, rows: Array<Record<string, string | number | boolean>>) {
  const headers = Object.keys(rows[0] ?? { id: "", score: "", passed: "" });
  const body = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => JSON.stringify(String(row[header] ?? "")))
        .join(","),
    ),
  ].join("\n");
  fs.writeFileSync(path.join(REPORT_DIR, file), `${body}\n`);
}

function answerFixture(): AvaAnswerPacket {
  return {
    surface: "intelligence",
    mode: "ANALYZE",
    tenantKey: "meridian-health",
    question:
      "For Meridian agent assist, rank the top opportunities by value and complexity. Show the tradeoff in an executive-ready way.",
    intent: "decision_canvas",
    status: "answered",
    directAnswer:
      "Meridian should sequence agent assist around value gates, not around the longest capability list. Start with structured eligibility and authorization lookup, then certify intent taxonomy and member identity, and hold generative summarization until transcript governance and real-time claims integration are evidenced in the active enterprise context. The decision is to fund the low-complexity lookup tier now while the CDAO closes the evidence gates for higher-value automation.",
    artifacts: [
      {
        artifact: "table",
        id: "agent-assist-ranking",
        title: "Agent Assist Opportunity Ranking",
        columns: [
          { key: "capability", label: "Capability" },
          { key: "value", label: "Value" },
          { key: "complexity", label: "Complexity" },
          { key: "gate", label: "Decision Gate" },
          { key: "recommendation", label: "Recommendation" },
        ],
        rows: [
          {
            capability: "Structured eligibility / authorization lookup",
            value: "Medium",
            complexity: "Low",
            gate: "Member identity linkage evidenced",
            recommendation: "Fund now",
          },
          {
            capability: "Intent detection and routing",
            value: "Medium-high",
            complexity: "Low-medium",
            gate: "Intent taxonomy validated",
            recommendation: "Certify then fund",
          },
          {
            capability: "Guided scripting / next best action",
            value: "High",
            complexity: "Medium",
            gate: "CRM and claims integration evidenced",
            recommendation: "Gate on integration proof",
          },
          {
            capability: "Post-call summarization / QA",
            value: "High",
            complexity: "Medium-high",
            gate: "Transcript governance evidenced",
            recommendation: "Prepare, do not scale",
          },
          {
            capability: "Real-time generative assist",
            value: "Highest",
            complexity: "High",
            gate: "All evidence gates cleared",
            recommendation: "Hold",
          },
        ],
      },
      {
        artifact: "chart",
        id: "agent-assist-value-complexity",
        kind: "quadrant-matrix",
        title: "Value / Complexity Tradeoff",
        data: {
          xAxisLabel: "Implementation complexity",
          yAxisLabel: "Business value",
          points: [
            { label: "Structured lookup", x: 25, y: 55 },
            { label: "Intent routing", x: 45, y: 70 },
            { label: "Guided scripting", x: 58, y: 78 },
            { label: "Post-call summary", x: 70, y: 80 },
            { label: "Real-time generative assist", x: 85, y: 90 },
          ],
        },
      },
    ],
    citations: [
      {
        id: "c1",
        label: "Meridian active enterprise context",
        sourceClass: "tenant-fact",
        confidence: "high",
        excerpt:
          "Contact Center and Member Experience tracks first-call resolution, average handle time, and agent assist adoption.",
      },
      {
        id: "c2",
        label: "Healthcare contact-center pattern",
        sourceClass: "corpus-pattern",
        confidence: "medium",
        excerpt:
          "Agent assist sequencing depends on evidence for identity, transcript governance, and real-time integration.",
      },
    ],
    factsUsed: [
      {
        id: "fact-contact-center",
        label: "Contact center KPIs",
        value: "first-call resolution, AHT, agent assist adoption",
        citationIds: ["c1"],
      },
    ],
    metricsUsed: [],
    relationshipsUsed: [],
    corpusUsed: [
      {
        id: "healthcare-agent-assist-pattern",
        label: "Healthcare agent assist pattern",
        corpusType: "industry-pattern",
        confidence: "medium",
      },
    ],
    gaps: [
      {
        id: "gap-transcript-governance",
        label: "Transcript governance",
        detail: "Transcript governance is not yet evidenced in the active enterprise context.",
        severity: "high",
      },
    ],
    caveats: [
      {
        id: "planning-grade",
        label: "Planning-grade context",
        detail:
          "Treat value ranking as planning-grade until Finance validates AHT baseline and call-volume assumptions.",
      },
    ],
    nextSteps: [
      {
        id: "move-p2",
        label: "Open a P2 discovery gate for member-service operations",
        rationale:
          "Confirm transcript governance, identity linkage, real-time claims integration, and AHT baseline before scaling generative assist.",
        targetSurface: "moves",
      },
    ],
    quality: {
      confidence: "high",
      evidenceStrength: "strong",
      tenantGrounding: "complete",
      answerCompleteness: "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}

function main() {
  ensureDir(path.join(REPORT_DIR, "screenshots"));
  const modeArg =
    process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ?? "stream";
  const packet = sanitizeAgentAnswerForRender(answerFixture());
  const validation = validateAvaAnswerPacket(packet);
  const html = renderAvaAnswerStandaloneHtml(validation.packet);
  const renderedAnswer = validation.packet.directAnswer;
  const streamEvents = [
    {
      type: "sources",
      sources: [
        {
          type: "TENANT",
          id: "source-1",
          name: scrubPublicAvaSourceText("Meridian V7 executive dossier"),
          detail: scrubPublicAvaSourceText(
            "Transcript governance is not_loaded in the V7 substrate.",
          ),
        },
      ],
    },
    {
      type: "delta",
      text: scrubPublicAvaAnswerText(
        "Transcript governance is not loaded in the V7 substrate.",
      ),
    },
    { type: "context-summary", summary: { sourceSections: 7, visibleGaps: 1 } },
    { type: "agent-answer", answer: validation.packet },
  ];

  const scans = {
    stream: scanText("stream", JSON.stringify(streamEvents)),
    finalPacket: scanText("final-packet", JSON.stringify(validation.packet)),
    rendered: scanText("rendered-answer", renderedAnswer),
    export: scanText("html-export", html),
  };
  const categoryRows =
    validation.packet.quality.cxo?.categories?.map((category) => ({
      id: category.id,
      label: category.label,
      score: category.score,
      maxScore: category.maxScore,
      passed: category.passed,
    })) ?? [];
  const visualProof = {
    tableArtifacts: validation.packet.artifacts.filter(
      (artifact) => artifact.artifact === "table",
    ).length,
    chartArtifacts: validation.packet.artifacts.filter(
      (artifact) => artifact.artifact === "chart",
    ).length,
    graphArtifacts: validation.packet.artifacts.filter(
      (artifact) => artifact.artifact === "graph",
    ).length,
    htmlHasTable: /<table[\s>]/i.test(html),
    htmlHasSvg: /<svg[\s>]/i.test(html),
  };
  const allHits = [
    ...scans.stream,
    ...scans.finalPacket,
    ...scans.rendered,
    ...scans.export,
  ];
  const lowCategories = categoryRows.filter((row) => Number(row.score) < 4);
  const pass =
    validation.passed &&
    allHits.length === 0 &&
    lowCategories.length === 0 &&
    visualProof.tableArtifacts > 0 &&
    visualProof.chartArtifacts > 0 &&
    visualProof.htmlHasTable &&
    visualProof.htmlHasSvg;

  writeJson("summary.json", {
    checkedAt: new Date().toISOString(),
    mode: modeArg,
    pass,
    validationPassed: validation.passed,
    violationCount: validation.violations.length,
    forbiddenHitCount: allHits.length,
    lowCategoryCount: lowCategories.length,
    visualProof,
  });
  fs.writeFileSync(
    path.join(REPORT_DIR, "summary.md"),
    [
      "# Intelligence aVa Stream Polish Audit",
      "",
      `Status: ${pass ? "Pass" : "Fail"}`,
      `Mode: ${modeArg}`,
      `Forbidden hits: ${allHits.length}`,
      `Low CXO categories: ${lowCategories.length}`,
      `Visual artifacts: ${visualProof.tableArtifacts} table, ${visualProof.chartArtifacts} chart, ${visualProof.graphArtifacts} graph`,
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(REPORT_DIR, "rendered-answer-text.md"),
    `${renderedAnswer}\n`,
  );
  writeJson("stream-event-scan.json", { events: streamEvents, hits: scans.stream });
  writeJson("final-packet-scan.json", {
    packet: validation.packet,
    hits: scans.finalPacket,
    validation,
  });
  writeJson("dom-visible-text-scan.json", {
    text: renderedAnswer,
    hits: scans.rendered,
  });
  writeJson("export-scan.json", {
    htmlLength: html.length,
    htmlHasTable: visualProof.htmlHasTable,
    htmlHasSvg: visualProof.htmlHasSvg,
    hits: scans.export,
  });
  writeCsv("cxo-scorecard.csv", categoryRows);
  writeJson("visual-artifact-proof.json", visualProof);
  fs.writeFileSync(
    path.join(REPORT_DIR, "intelligence-ava-stream-polish-proof.html"),
    html,
  );

  if (!pass) {
    console.error(JSON.stringify({ pass, allHits, lowCategories, validation }, null, 2));
    process.exitCode = 1;
  }
}

main();
