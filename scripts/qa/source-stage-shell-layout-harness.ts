import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SourceStageCanvasPanel } from "@/components/source/SourceStageCanvasPanel";
import { EventStepRail } from "@/components/source/canvas/EventStepRail";
import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import type {
  SourceStageKey,
  SourcingEventDetail,
  WorkflowStage,
} from "@/lib/source/types";

type StageShellResult = {
  stage: SourceStageKey;
  viewport: number;
  railSteps: number;
  selectedRailLabel: string;
  selectedRailVisible: boolean;
  stagePanelRendered: boolean;
  stageHeading: string;
  localWorkflowRendered: boolean;
  localStepCount: number;
  activeLocalStepVisible: boolean;
  hasProgressText: boolean;
  hasGateText: boolean;
  hasDeliverablesText: boolean;
  stageCardWidth: number;
  stagePanelWidth: number;
  canvasWidthUtilizationPct: number;
  documentScrollWidth: number;
  documentClientWidth: number;
  pageOverflowsHorizontally: boolean;
  screenshot: string;
  status: "pass" | "fail";
  failures: string[];
};

const VIEWPORTS = [1440, 1100, 900, 768] as const;
const REPORT_DIR = path.join(
  process.cwd(),
  "reports",
  "source-layout",
  "stage-shell",
);

function workflowStages(currentStage: SourceStageKey): WorkflowStage[] {
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(currentStage);
  return SOURCE_STAGE_ORDER.map((stage, index) => ({
    key: stage,
    label: SOURCE_STAGE_LABELS[stage],
    status:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "active"
          : "not_started",
    summary: `${SOURCE_STAGE_LABELS[stage]} layout smoke fixture.`,
    gate: {
      id: `gate-${stage}`,
      label: `${SOURCE_STAGE_LABELS[stage]} gate`,
      status: index < currentIndex ? "approved" : "not_started",
      ownerRole: "Sourcing lead",
      requiredArtifacts: [],
      blocker: null,
    },
  }));
}

function eventFixture(viewStage: SourceStageKey): SourcingEventDetail {
  return {
    id: "evt-stage-shell-layout",
    code: "SRC-LAYOUT",
    name: "New Event Layout Harness",
    accountName: "AbarVa QA",
    leadAgent: "Sentinel",
    archetype: "competitive_sourcing",
    rigor: "strategic",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "intake",
    currentStageLabel: "Strategy",
    openAlerts: 0,
    owner: "Sourcing lead",
    decisionOwner: "Executive sponsor",
    createdByUserId: null,
    agingDays: 12,
    blocker: null,
    nextAction: `Review ${SOURCE_STAGE_LABELS[viewStage]} layout.`,
    isAtRisk: false,
    valueAtStakeUsd: 0,
    projectedValueUsd: 0,
    realizedValueUsd: 0,
    nextDecision: "No live decision in layout harness.",
    sourcingMotion: "competitive_rfp",
    classifiedCategory: "application_managed_services",
    synopsis: "Static event fixture for all-stage Source layout QA.",
    problemStatement:
      "The Source stage shell must make process position and required work obvious.",
    stages: workflowStages(viewStage),
    alerts: [],
    artifacts: [],
    scorecard: {
      decisionOwner: "Executive sponsor",
      reviewCadence: "Weekly",
      approvalState: "not_started",
      criteria: [],
    },
    valueLedger: {
      updatedAt: "2026-08-14T00:00:00.000Z",
      projected: [],
      realized: [],
    },
    dataReadiness: [
      {
        id: `readiness-${viewStage}`,
        category: `${SOURCE_STAGE_LABELS[viewStage]} required evidence`,
        requirementLevel: "required",
        readinessState: "Requested",
        evidenceUsability: "not_available",
        owner: "Sourcing lead",
        sourceSystemOrFile: "Client evidence pack",
        lastUpdated: null,
        confidence: "medium",
        workflowImpact: "Blocks stage readiness until accepted.",
        agentRecommendation: "Load required evidence before approval.",
        stewardAdminHandoffLabel: "No admin handoff required",
      },
    ],
  };
}

function renderStageMarkup(stage: SourceStageKey): string {
  const label = SOURCE_STAGE_LABELS[stage];
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      { className: "stage-card", "data-stage": stage },
      createElement(EventStepRail, {
        eventId: "evt-stage-shell-layout",
        currentStage: stage,
        viewStage: stage,
      }),
      createElement(
        "div",
        { className: "stage-panel-wrap" },
        createElement(SourceStageCanvasPanel, {
          stageKey: stage,
          event: eventFixture(stage),
          nextGateEvaluations: [],
        }),
      ),
    ),
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
        padding: 24px 80px 40px;
      }
      .stage-card {
        width: calc(100vw - 160px);
        max-width: 1280px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }
      .stage-panel-wrap {
        width: 100%;
        max-width: none;
        margin-left: 0;
      }
      @media (max-width: 900px) {
        .harness-shell { padding: 20px 72px 36px; }
        .stage-card { width: calc(100vw - 144px); }
        .stage-panel-wrap { max-width: none; margin-left: 0; }
      }
    </style>
    <title>Source stage shell layout - ${label}</title>
  </head>
  <body>
    <main class="harness-shell" data-testid="source-stage-shell-harness">
      ${markup}
    </main>
  </body>
</html>`;
}

async function run() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results: StageShellResult[] = [];

  try {
    for (const stage of SOURCE_STAGE_ORDER) {
      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage({
          viewport: { width: viewport, height: 960 },
        });
        await page.setContent(renderStageMarkup(stage), { waitUntil: "load" });

        const screenshot = path.join(REPORT_DIR, `${stage}-${viewport}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });

        const metrics = await page.evaluate((stageKey) => {
          const rail = document.querySelector(
            '[data-testid="source-canvas-step-rail"]',
          );
          const railSteps = Array.from(
            document.querySelectorAll('[data-testid^="source-canvas-step-"]'),
          ).filter((element) => {
            const testId = element.getAttribute("data-testid") ?? "";
            return (
              element instanceof HTMLAnchorElement &&
              testId !== "source-canvas-step-rail"
            );
          });
          const selected = document.querySelector(
            `[data-testid="source-canvas-step-${stageKey}"]`,
          );
          const stagePanel = document.querySelector(
            "section[aria-label^='Stage canvas']",
          );
          const stageCard = document.querySelector(".stage-card");
          const stagePanelWrap = document.querySelector(".stage-panel-wrap");
          const h2 = stagePanel?.querySelector("h2");
          const localWorkflow = document.querySelector(
            '[data-testid="source-stage-local-workflow"]',
          );
          const localSteps = Array.from(
            document.querySelectorAll(
              '[data-testid^="source-stage-local-step-"]',
            ),
          );
          const activeLocalStep = document.querySelector(
            '[data-local-step-state="current"], [data-local-step-state="blocked"]',
          );
          const selectedRect =
            selected instanceof HTMLElement
              ? selected.getBoundingClientRect()
              : null;
          const activeLocalStepRect =
            activeLocalStep instanceof HTMLElement
              ? activeLocalStep.getBoundingClientRect()
              : null;
          const stageCardRect =
            stageCard instanceof HTMLElement
              ? stageCard.getBoundingClientRect()
              : null;
          const stagePanelWrapRect =
            stagePanelWrap instanceof HTMLElement
              ? stagePanelWrap.getBoundingClientRect()
              : null;
          const canvasWidthUtilizationPct =
            stageCardRect && stagePanelWrapRect && stageCardRect.width > 0
              ? Math.round(
                  (stagePanelWrapRect.width / stageCardRect.width) * 100,
                )
              : 0;
          const text = document.body.textContent ?? "";

          return {
            railRendered: rail instanceof HTMLElement,
            railSteps: railSteps.length,
            selectedRailLabel:
              selected?.textContent?.replace(/\s+/g, " ").trim() ?? "",
            selectedRailVisible:
              selectedRect !== null &&
              selectedRect.width > 0 &&
              selectedRect.height > 0 &&
              selectedRect.left >= -1 &&
              selectedRect.right <= document.documentElement.clientWidth + 1,
            stagePanelRendered: stagePanel instanceof HTMLElement,
            stageHeading: h2?.textContent?.trim() ?? "",
            localWorkflowRendered: localWorkflow instanceof HTMLElement,
            localStepCount: localSteps.length,
            activeLocalStepVisible:
              activeLocalStepRect !== null &&
              activeLocalStepRect.width > 0 &&
              activeLocalStepRect.height > 0 &&
              activeLocalStepRect.left >= -1 &&
              activeLocalStepRect.right <=
                document.documentElement.clientWidth + 1,
            hasProgressText: /Step\s+\d+\s+of\s+11/.test(text),
            hasGateText:
              text.includes("Gate") || text.includes("Completion criteria"),
            hasDeliverablesText: text.includes("Step deliverables"),
            stageCardWidth: stageCardRect?.width ?? 0,
            stagePanelWidth: stagePanelWrapRect?.width ?? 0,
            canvasWidthUtilizationPct,
            documentScrollWidth: document.documentElement.scrollWidth,
            documentClientWidth: document.documentElement.clientWidth,
          };
        }, stage);

        const failures: string[] = [];
        const expectedLabel = SOURCE_STAGE_LABELS[stage];
        const pageOverflowsHorizontally =
          metrics.documentScrollWidth > metrics.documentClientWidth + 1;

        if (!metrics.railRendered)
          failures.push("Lifecycle rail was not rendered.");
        if (metrics.railSteps !== SOURCE_STAGE_ORDER.length) {
          failures.push(
            `Expected ${SOURCE_STAGE_ORDER.length} rail steps, found ${metrics.railSteps}.`,
          );
        }
        if (!metrics.selectedRailLabel.includes(expectedLabel)) {
          failures.push(`Selected rail step did not include ${expectedLabel}.`);
        }
        if (!metrics.selectedRailVisible) {
          failures.push(`Selected rail step for ${expectedLabel} is clipped.`);
        }
        if (!metrics.stagePanelRendered) {
          failures.push("Stage canvas panel was not rendered.");
        }
        if (metrics.stageHeading !== expectedLabel) {
          failures.push(
            `Expected stage heading ${expectedLabel}, found ${metrics.stageHeading || "empty"}.`,
          );
        }
        if (!metrics.localWorkflowRendered) {
          failures.push("Local stage workflow was not rendered.");
        }
        if (metrics.localStepCount < 4) {
          failures.push(
            `Expected at least 4 local steps, found ${metrics.localStepCount}.`,
          );
        }
        if (!metrics.activeLocalStepVisible) {
          failures.push("Active local step is missing or clipped.");
        }
        if (!metrics.hasProgressText) {
          failures.push("Stage progress text is missing.");
        }
        if (!metrics.hasGateText) {
          failures.push("Gate or completion text is missing.");
        }
        if (!metrics.hasDeliverablesText) {
          failures.push("Deliverables summary is missing.");
        }
        if (pageOverflowsHorizontally) {
          failures.push("Page overflows horizontally.");
        }
        if (metrics.canvasWidthUtilizationPct < 92) {
          failures.push(
            `Stage canvas uses only ${metrics.canvasWidthUtilizationPct}% of the available shell width.`,
          );
        }

        await page.close();
        results.push({
          stage,
          viewport,
          selectedRailLabel: metrics.selectedRailLabel,
          selectedRailVisible: metrics.selectedRailVisible,
          stagePanelRendered: metrics.stagePanelRendered,
          stageHeading: metrics.stageHeading,
          localWorkflowRendered: metrics.localWorkflowRendered,
          localStepCount: metrics.localStepCount,
          activeLocalStepVisible: metrics.activeLocalStepVisible,
          railSteps: metrics.railSteps,
          hasProgressText: metrics.hasProgressText,
          hasGateText: metrics.hasGateText,
          hasDeliverablesText: metrics.hasDeliverablesText,
          stageCardWidth: metrics.stageCardWidth,
          stagePanelWidth: metrics.stagePanelWidth,
          canvasWidthUtilizationPct: metrics.canvasWidthUtilizationPct,
          documentScrollWidth: metrics.documentScrollWidth,
          documentClientWidth: metrics.documentClientWidth,
          pageOverflowsHorizontally,
          screenshot,
          status: failures.length === 0 ? "pass" : "fail",
          failures,
        });
      }
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    status: results.every((result) => result.status === "pass")
      ? "pass"
      : "fail",
    stages: SOURCE_STAGE_ORDER,
    viewports: VIEWPORTS,
    results,
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
    console.error(
      `Source stage shell layout harness failed. See ${REPORT_DIR}`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Source stage shell layout harness passed. See ${REPORT_DIR}`);
}

function renderMarkdown(summary: {
  generatedAt: string;
  status: string;
  stages: readonly SourceStageKey[];
  viewports: readonly number[];
  results: StageShellResult[];
}): string {
  const lines = [
    "# Source Stage Shell Layout Harness",
    "",
    `Generated: ${summary.generatedAt}`,
    `Status: ${summary.status}`,
    "",
    "| Stage | Viewport | Rail steps | Local steps | Active local | Selected visible | Heading | Canvas utilization | Overflow | Status |",
    "| --- | ---: | ---: | ---: | --- | --- | --- | ---: | --- | --- |",
    ...summary.results.map(
      (result) =>
        `| ${SOURCE_STAGE_LABELS[result.stage]} | ${result.viewport} | ${result.railSteps} | ${
          result.localStepCount
        } | ${result.activeLocalStepVisible ? "yes" : "no"} | ${
          result.selectedRailVisible ? "yes" : "no"
        } | ${result.stageHeading} | ${result.canvasWidthUtilizationPct}% | ${
          result.pageOverflowsHorizontally ? "yes" : "no"
        } | ${result.status} |`,
    ),
    "",
    "## Failures",
    "",
    ...summary.results.flatMap((result) =>
      result.failures.length === 0
        ? [`- ${SOURCE_STAGE_LABELS[result.stage]} ${result.viewport}: none`]
        : result.failures.map(
            (failure) =>
              `- ${SOURCE_STAGE_LABELS[result.stage]} ${result.viewport}: ${failure}`,
          ),
    ),
    "",
  ];
  return lines.join("\n");
}

void run();
