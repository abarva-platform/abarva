import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ResponsesStageView } from "@/components/source/canvas/responses/ResponsesStageView";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";

type ViewportResult = {
  viewport: number;
  stageWidth: number;
  matrixWidth: number;
  tableScrollWidth: number;
  tableClientWidth: number;
  scrollClientWidth: number;
  scrollScrollWidth: number;
  documentScrollWidth: number;
  documentClientWidth: number;
  qnaBelowMatrix: boolean;
  qnaCompetesForMatrixWidth: boolean;
  pageOverflowsHorizontally: boolean;
  matrixScrollContained: boolean;
  columns: Array<{
    label: string;
    visibleInScrollport: boolean;
  }>;
  overflowOffenders: Array<{
    tag: string;
    testId: string | null;
    width: number;
    left: number;
    right: number;
    text: string;
  }>;
  screenshot: string;
  status: "pass" | "fail";
  failures: string[];
};

const VIEWPORTS = [1440, 1292, 1100, 900, 768] as const;
const REPORT_DIR = path.join(
  process.cwd(),
  "reports",
  "source-layout",
  "responses-matrix",
);

const readiness: SourceVendorResponseCompleteness = {
  eventId: "evt-layout-harness",
  eventName: "AMS Outsourcing 2026",
  generatedAt: "2026-08-14T00:00:00.000Z",
  stage: "responses",
  summary: {
    totalVendors: 4,
    complete: 2,
    partiallyComplete: 1,
    incomplete: 1,
    notComparable: 0,
    blocked: 0,
  },
  comparabilityReadiness: "partially_complete",
  blockers: ["Atlas SI: transition plan status is incomplete."],
  recommendedNextAction:
    "Collect missing sections, normalize pricing units, and resolve evidence quality before comparison.",
  records: [
    responseRecord("northstar", "Northstar", "complete"),
    responseRecord("atlas", "Atlas SI", "partially_complete", [
      "Transition plan",
    ]),
    responseRecord("arcvault", "ArcVault Managed Operations", "complete"),
    responseRecord("bluemaster", "BlueMaster Operations", "incomplete", [
      "Pricing",
      "References",
    ]),
  ],
};

function responseRecord(
  vendorId: string,
  vendorName: string,
  completenessStatus:
    | "complete"
    | "partially_complete"
    | "incomplete"
    | "not_comparable"
    | "blocked",
  missingSections: string[] = [],
): SourceVendorResponseCompleteness["records"][number] {
  return {
    vendorId,
    vendorName,
    responseStatus: "submitted",
    receivedAt: "2026-08-01",
    requiredSections: ["Scope", "Pricing", "Assumptions", "Transition"],
    submittedSections: ["Scope", "Pricing", "Assumptions"],
    missingSections,
    assumptions: ["3-year term"],
    exclusions: [],
    pricingTemplateStatus: missingSections.includes("Pricing")
      ? "incomplete"
      : "complete",
    transitionPlanStatus: missingSections.includes("Transition plan")
      ? "incomplete"
      : "complete",
    securityResponseStatus: "complete",
    automationRoadmapStatus: "complete",
    evidenceStatus:
      completenessStatus === "complete" ? "Usable Evidence" : "Available",
    comparabilityStatus:
      completenessStatus === "complete" ? "comparable" : "partially_comparable",
    blockers: missingSections.map((section) => `${section} is missing.`),
    completenessStatus,
    rationale:
      missingSections.length > 0
        ? missingSections.map((section) => `${section} needs clarification.`)
        : ["Response is complete."],
    recommendedNextAction:
      missingSections.length > 0
        ? "Resolve missing sections before comparison."
        : "Compare with peers.",
    nexusGuidance: "Keep response evidence visible before scoring.",
    sentinelEvidenceNotes: [],
    stewardGateNotes: [],
    atlasExecutiveImplication: "Comparability confidence is visible.",
  };
}

function renderHarnessMarkup(): string {
  const markup = renderToStaticMarkup(
    createElement(ResponsesStageView, {
      readiness,
      profileSet: null,
      challengeIntelligence: null,
      bafoInstructionPack: null,
      evaluationDecisionView: null,
      parseReports: [],
      contractOptimizationProfile: null,
      documentWorkspace: createElement(
        "section",
        { "data-testid": "layout-harness-document-workspace" },
        "Document workspace fixture",
      ),
    }),
  );

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #f8f7f4;
        color: #111827;
        font-family: "DM Sans", Arial, sans-serif;
      }
      .harness-shell {
        min-height: 100vh;
        padding: 24px 40px;
      }
      .stage-canvas {
        width: calc(100vw - 80px);
        margin: 0 auto;
      }
      @media (max-width: 820px) {
        .harness-shell { padding: 20px 40px; }
        .stage-canvas { width: calc(100vw - 80px); }
      }
    </style>
  </head>
  <body>
    <main class="harness-shell">
      <div class="stage-canvas" data-testid="layout-harness-stage-canvas">
        ${markup}
      </div>
    </main>
  </body>
</html>`;
}

async function run() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results: ViewportResult[] = [];

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: viewport, height: 1100 },
      });
      await page.setContent(renderHarnessMarkup(), { waitUntil: "load" });

      const screenshot = path.join(REPORT_DIR, `${viewport}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });

      const metrics = await page.evaluate(() => {
        const matrix = document.querySelector(
          '[data-testid="source-responses-completeness-matrix"]',
        );
        const qna = document.querySelector(
          '[data-testid="source-responses-qna-symmetry-log"]',
        );
        const stage = document.querySelector(
          '[data-testid="layout-harness-stage-canvas"]',
        );
        if (!(matrix instanceof HTMLElement)) {
          throw new Error("Completeness matrix was not rendered.");
        }
        if (!(qna instanceof HTMLElement)) {
          throw new Error("Q&A symmetry log was not rendered.");
        }
        if (!(stage instanceof HTMLElement)) {
          throw new Error("Stage canvas was not rendered.");
        }
        const table = matrix.querySelector("table");
        const scrollWrap = table?.parentElement;
        if (!(table instanceof HTMLElement)) {
          throw new Error("Completeness matrix table was not rendered.");
        }
        if (!(scrollWrap instanceof HTMLElement)) {
          throw new Error(
            "Completeness matrix scroll wrapper was not rendered.",
          );
        }

        const matrixRect = matrix.getBoundingClientRect();
        const qnaRect = qna.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const scrollRect = scrollWrap.getBoundingClientRect();
        const headers = Array.from(table.querySelectorAll("thead th")).map(
          (header) => {
            const rect = header.getBoundingClientRect();
            const label = header.textContent?.trim() ?? "";
            return {
              label,
              visibleInScrollport:
                rect.left >= scrollRect.left - 1 &&
                rect.right <= scrollRect.right + 1,
            };
          },
        );
        const overflowOffenders = Array.from(
          document.body.querySelectorAll<HTMLElement>("*"),
        )
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { element, rect };
          })
          .filter(({ element, rect }) => {
            let hasScrollableAncestor = false;
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              const scrollableX =
                style.overflowX === "auto" || style.overflowX === "scroll";
              if (scrollableX && parent.scrollWidth > parent.clientWidth + 1) {
                hasScrollableAncestor = true;
                break;
              }
              parent = parent.parentElement;
            }
            return (
              rect.width > 0 &&
              rect.right > document.documentElement.clientWidth + 1 &&
              !hasScrollableAncestor
            );
          })
          .slice(0, 12)
          .map(({ element, rect }) => ({
            tag: element.tagName.toLowerCase(),
            testId: element.getAttribute("data-testid"),
            width: Math.round(rect.width),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            text: (element.textContent ?? "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 90),
          }));

        return {
          stageWidth: stageRect.width,
          matrixWidth: matrixRect.width,
          tableScrollWidth: table.scrollWidth,
          tableClientWidth: table.clientWidth,
          scrollClientWidth: scrollWrap.clientWidth,
          scrollScrollWidth: scrollWrap.scrollWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          documentClientWidth: document.documentElement.clientWidth,
          qnaBelowMatrix: qnaRect.top >= matrixRect.bottom - 1,
          qnaCompetesForMatrixWidth:
            qnaRect.top < matrixRect.bottom - 1 &&
            qnaRect.left > matrixRect.left,
          matrixScrollContained:
            window.getComputedStyle(scrollWrap).overflowX === "auto" &&
            document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          columns: headers,
          overflowOffenders,
        };
      });

      const failures: string[] = [];
      const pageOverflowsHorizontally =
        metrics.documentScrollWidth > metrics.documentClientWidth + 1;
      const columnVisibilityRequired = viewport >= 900;
      if (!metrics.qnaBelowMatrix) {
        failures.push("Q&A log is not stacked below the completeness matrix.");
      }
      if (metrics.qnaCompetesForMatrixWidth) {
        failures.push("Q&A log competes horizontally with the matrix.");
      }
      if (pageOverflowsHorizontally) {
        failures.push(
          "Page overflows horizontally outside the matrix scroll area.",
        );
      }
      if (!metrics.matrixScrollContained) {
        failures.push(
          "Matrix overflow is not contained in its own scrollport.",
        );
      }
      if (
        columnVisibilityRequired &&
        metrics.columns.some((column) => !column.visibleInScrollport)
      ) {
        failures.push(
          `Viewport ${viewport} should show every matrix column without horizontal scroll.`,
        );
      }
      if (viewport === 768 && metrics.columns.at(-1)?.label !== "References") {
        failures.push(
          "References column was not rendered as the final column.",
        );
      }

      await page.close();
      results.push({
        viewport,
        screenshot,
        pageOverflowsHorizontally,
        status: failures.length === 0 ? "pass" : "fail",
        failures,
        ...metrics,
      });
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    status: results.every((result) => result.status === "pass")
      ? "pass"
      : "fail",
    viewports: results,
  };
  fs.writeFileSync(
    path.join(REPORT_DIR, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(REPORT_DIR, "summary.md"),
    renderMarkdown(summary),
  );

  if (summary.status !== "pass") {
    console.error(`Source Responses layout harness failed. See ${REPORT_DIR}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Source Responses layout harness passed. See ${REPORT_DIR}`);
}

function renderMarkdown(summary: {
  generatedAt: string;
  status: string;
  viewports: ViewportResult[];
}): string {
  const lines = [
    "# Source Responses Layout Harness",
    "",
    `Generated: ${summary.generatedAt}`,
    `Status: ${summary.status}`,
    "",
    "| Viewport | Stage width | Matrix width | Table scroll | Page overflow | Q&A below | Status |",
    "| --- | ---: | ---: | ---: | --- | --- | --- |",
    ...summary.viewports.map(
      (result) =>
        `| ${result.viewport} | ${Math.round(result.stageWidth)} | ${Math.round(
          result.matrixWidth,
        )} | ${result.scrollScrollWidth}/${result.scrollClientWidth} | ${
          result.pageOverflowsHorizontally ? "yes" : "no"
        } | ${result.qnaBelowMatrix ? "yes" : "no"} | ${result.status} |`,
    ),
    "",
    "## Failures",
    "",
    ...summary.viewports.flatMap((result) =>
      result.failures.length === 0
        ? [`- ${result.viewport}: none`]
        : result.failures.map((failure) => `- ${result.viewport}: ${failure}`),
    ),
    "",
    "## Overflow Offenders",
    "",
    ...summary.viewports.flatMap((result) =>
      result.overflowOffenders.length === 0
        ? [`- ${result.viewport}: none`]
        : result.overflowOffenders.map(
            (offender) =>
              `- ${result.viewport}: ${offender.tag} ${
                offender.testId ? `[${offender.testId}]` : ""
              } right=${offender.right} width=${offender.width} text="${offender.text}"`,
          ),
    ),
    "",
  ];
  return lines.join("\n");
}

void run();
