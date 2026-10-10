/** Signed-in, read-only evidence for the deployed Moves step pages. */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { DEMO_SAFE_CLIENT_NAMES } from "../../src/lib/client-config";
import { resolvePhaseWorkflow } from "../../src/lib/programs/phase-workflow-registry";
import { STEP_PAGE_VIEWS, type StepPageView } from "../../src/lib/programs/step-page-views";
import { withClerkAuth } from "./_helpers/auth";
import { BASE_URL, CLERK_SECRET_KEY } from "./_helpers/env";
import { movesApi } from "./_helpers/moves-gate-walk";
import { phaseReachable, walkCoverage } from "./_helpers/moves-walk-coverage";
import { captureWalkDomSnapshot } from "./_helpers/moves-walk-ux-capture";
import {
  floorAverage,
  scoreWalkUx,
  type UxVariant,
  type WalkUxInput,
  type WalkUxScore,
} from "./_helpers/moves-walk-ux-score";
import {
  buildJourney,
  type CurrentDocumentReadback,
  type JourneyEntry,
  type PhaseGateReadback,
} from "./_helpers/moves-walk-journey";

type Status = "pass" | "fail" | "known_gap" | "not_reachable";
type Finding = { status: Status; reason: string; landed: string };
type ViewFinding = Finding & {
  phase: number;
  view: StepPageView;
  stepId: string;
  screenshots: string[];
  ux: WalkUxScore;
};

const MOVE_ID = process.env.E2E_MOVES_LIVE_MOVE_ID;
const DEPLOYED_SHA = process.env.E2E_MOVES_DEPLOYED_SHA;
const EXPECTED_TENANT_NAME = DEMO_SAFE_CLIENT_NAMES.meridian;
const PHASES = [0, 1, 2, 3, 4, 5] as const;
const VIEW_ENTRIES = Object.entries(STEP_PAGE_VIEWS) as Array<
  [StepPageView, (typeof STEP_PAGE_VIEWS)[StepPageView]]
>;
const P2_HAS_EVERY_STEP_PAGE = resolvePhaseWorkflow(2, null).every((step) =>
  VIEW_ENTRIES.some(([, entry]) => entry.phase === 2 && entry.stepId === step.id),
);

// Add an exact phase, view, visible text, and reason only for a reviewed gap.
// An empty list means every read failure remains a test failure.
const KNOWN_GAPS: ReadonlyArray<{
  phase: number;
  view: StepPageView;
  text: string;
  reason: string;
  allowedReadText?: readonly string[];
}> = [
  {
    phase: 4,
    view: "p4-estimate",
    text: "No approved estimate yet",
    reason:
      "This existing fixture has no approved P3 estimate. The P4 estimate step remains blocked until a real approval is recorded.",
    allowedReadText: [
      "Estimate inputs remain editable while the approved ROM basis is unavailable.",
    ],
  },
];
const BAD_READ = /could not be read|unavailable/i;
const VISIBLE_TIMEOUT_MS = 20_000;
const UX_VARIANTS: ReadonlyArray<{
  key: UxVariant;
  width: 1440 | 390;
  colorScheme: "light" | "dark";
}> = [
  { key: "desktopLight", width: 1440, colorScheme: "light" },
  { key: "phoneLight", width: 390, colorScheme: "light" },
  { key: "desktopDark", width: 1440, colorScheme: "dark" },
  { key: "phoneDark", width: 390, colorScheme: "dark" },
];

function emptyUxInput(unavailableReason?: string): WalkUxInput {
  return {
    expectedTenantName: EXPECTED_TENANT_NAME,
    settledHeadMs: null,
    unavailableReason,
    variants: {
      desktopLight: { snapshot: null, reason: "view did not settle" },
      phoneLight: { snapshot: null, reason: "view did not settle" },
      desktopDark: { snapshot: null, reason: "view did not settle" },
      phoneDark: { snapshot: null, reason: "view did not settle" },
    },
  };
}

function markdownCell(value: unknown): string {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll(/\s*\n\s*/g, " ");
}

function summaryMarkdown(proof: {
  deployedSha: string;
  coverage: ReturnType<typeof walkCoverage>;
  views: ViewFinding[];
  phaseUxAverage: Record<string, number | null>;
  overallUxAverage: number | null;
  journey: JourneyEntry[];
  journeyReadbackErrors: string[];
}): string {
  const lines = [
    "# Moves signed-in step-page walk",
    "",
    `Deployed SHA: \`${proof.deployedSha}\`. UX scores are measured from the live page at desktop and phone widths, light and dark. An unmeasured dimension is recorded as null with a reason; each score states its measured denominator.`,
    `Step pages: ${proof.coverage.passed}/${proof.coverage.total} passed; ${proof.coverage.reached} reached; ${proof.coverage.knownGap} known gaps; ${proof.coverage.failed} failed; ${proof.coverage.notReachable} not reachable; ${proof.coverage.unassessed} unassessed.`,
    "",
  ];
  for (const phase of PHASES) {
    lines.push(`## P${phase} · UX average ${proof.phaseUxAverage[`P${phase}`] ?? "unmeasured"}`, "");
    lines.push("| View | Status | UX / 100 | Measured points | Top issue |", "|---|---|---:|---:|---|");
    for (const view of proof.views.filter((item) => item.phase === phase)) {
      const unmeasured = Object.entries(view.ux.dimensions).find(
        ([, dimension]) => dimension.earned === null,
      );
      const topIssue =
        view.ux.violations[0] ||
        (unmeasured
          ? `${unmeasured[0]} unmeasured: ${unmeasured[1].reason}`
          : null) ||
        view.reason ||
        "—";
      lines.push(
        `| ${markdownCell(view.view)} | ${view.status} | ${view.ux.score ?? "unmeasured"} | ${view.ux.measuredPoints}/100 | ${markdownCell(topIssue)} |`,
      );
    }
    lines.push("");
  }
  lines.push(`Overall measured UX average: ${proof.overallUxAverage ?? "unmeasured"}`, "");
  lines.push("## Move journey", "", "| Transition | State | Hard met / total | Soft met / total | First open hard check | Current documents built / signed |", "|---|---|---:|---:|---|---|");
  for (const entry of proof.journey) {
    const hard = `${entry.hard.met ?? "unread"}/${entry.hard.total ?? "unread"}`;
    const soft = `${entry.soft.met ?? "unread"}/${entry.soft.total ?? "unread"}`;
    const documents = `${entry.documents.currentBuiltCount ?? "unread"}/${entry.documents.signedOffCount ?? "unread"}`;
    lines.push(
      `| ${entry.transition} | ${entry.state} | ${hard} | ${soft} | ${markdownCell(entry.firstOpenHard ? `${entry.firstOpenHard.id}: ${entry.firstOpenHard.reason}` : entry.gateReadbackReason)} | ${documents} |`,
    );
  }
  lines.push("", "Document counts describe current generated artifacts observed in the Move cabinet; they do not assert that every required deliverable was built.");
  if (proof.journeyReadbackErrors.length) {
    lines.push("", "### Journey read gaps", "", ...proof.journeyReadbackErrors.map((error) => `- ${error}`));
  }
  return `${lines.join("\n")}\n`;
}

function unreviewedReadText(
  body: string,
  phase: number,
  view: StepPageView,
): string | null {
  const gap = KNOWN_GAPS.find(
    (entry) =>
      entry.phase === phase && entry.view === view && body.includes(entry.text),
  );
  let checked = body;
  for (const phrase of gap?.allowedReadText ?? []) {
    checked = checked.replaceAll(phrase, "");
  }
  return checked.match(BAD_READ)?.[0] ?? null;
}

function routeFor(moveId: string, phase: number, query = ""): string {
  return `/strategic-moves/${encodeURIComponent(moveId)}/phase/${phase}${query}`;
}

function landedAt(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

async function measureUxVariants(
  page: Page,
  testInfo: TestInfo,
  phase: number,
  view: StepPageView,
  stepIndex: number,
  screenshots: string[],
  uxInput: WalkUxInput,
): Promise<void> {
  const screenshotErrors: string[] = [];
  for (const variant of UX_VARIANTS) {
    await page.setViewportSize({ width: variant.width, height: 900 });
    await page.emulateMedia({ colorScheme: variant.colorScheme });
    const observation = uxInput.variants[variant.key];
    try {
      const snapshot = await captureWalkDomSnapshot(page, stepIndex);
      const body = await page.locator("body").innerText();
      snapshot.unreviewedReadError = unreviewedReadText(body, phase, view);
      observation.snapshot = snapshot;
      observation.reason = undefined;
    } catch (error) {
      observation.reason = `DOM read: ${String(error)}`;
    }

    try {
      const filename = `${view}-${variant.width}-${variant.colorScheme}.png`;
      const output = testInfo.outputPath(filename);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      await page.screenshot({ path: output, fullPage: true });
      screenshots.push(filename);
    } catch (error) {
      screenshotErrors.push(`${variant.key}: ${String(error)}`);
    }

    try {
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const violations = axe.violations as Array<{
        id: string;
        impact?: string | null;
      }>;
      if (variant.colorScheme === "light") {
        observation.allAxeIds = violations.map((item) => item.id);
        observation.seriousCriticalAxeIds = violations
          .filter((item) => item.impact === "serious" || item.impact === "critical")
          .map((item) => item.id);
      } else {
        observation.contrastAxeIds = violations
          .filter((item) => item.id === "color-contrast")
          .map((item) => item.id);
      }
    } catch (error) {
      observation.reason = [observation.reason, `axe: ${String(error)}`]
        .filter(Boolean)
        .join(" | ");
      if (variant.colorScheme === "light") {
        observation.allAxeIds = null;
        observation.seriousCriticalAxeIds = null;
      } else {
        observation.contrastAxeIds = null;
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: "light" });
  if (screenshotErrors.length) {
    throw new Error(`Screenshot capture failed: ${screenshotErrors.join(" | ")}`);
  }
}

async function inspectPage(
  page: Page,
  destination: string,
  check: () => Promise<void>,
  blockedWrites: string[],
  afterSettle?: () => Promise<void>,
): Promise<Finding> {
  const problems: string[] = [];
  const writeCountBefore = blockedWrites.length;
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  };
  const onPageError = (error: Error) => problems.push(`page error: ${error.message}`);
  const onResponse = (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 400) {
      problems.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);
  try {
    await page.goto(destination, { waitUntil: "domcontentloaded" });
    await check();
    // Streaming and background reads can keep the network busy. The page's
    // visible landmark is required; network-idle is only a bounded settling aid.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    await afterSettle?.();
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  } finally {
    problems.push(...blockedWrites.slice(writeCountBefore).map((item) => `Blocked write: ${item}`));
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }
  return {
    status: problems.length ? "fail" : "pass",
    reason: problems.join(" | "),
    landed: landedAt(page),
  };
}

test("walks every deployed Moves step page without writing", async ({ page }, testInfo) => {
  test.setTimeout(32 * 60_000);
  const missing = [
    !MOVE_ID && "E2E_MOVES_LIVE_MOVE_ID",
    !DEPLOYED_SHA && "E2E_MOVES_DEPLOYED_SHA",
    !process.env.E2E_MOVES_CLIENT_KEY && "E2E_MOVES_CLIENT_KEY",
    !process.env.E2E_MOVES_OPERATOR_EMAIL && "E2E_MOVES_OPERATOR_EMAIL",
    !CLERK_SECRET_KEY && "CLERK_SECRET_KEY",
    BASE_URL !== "https://app.abarva.ai" && "production BASE_URL",
  ].filter(Boolean);
  expect(missing, "Signed-in proof requires all live inputs").toEqual([]);
  expect(MOVE_ID).toMatch(/^[a-zA-Z0-9_-]+$/);
  expect(DEPLOYED_SHA).toMatch(/^[0-9a-f]{40}$/);
  expect(process.env.E2E_MOVES_CLIENT_KEY).toBe("meridian");

  const proof: {
    deployedSha: string;
    deployRunUrl: string | null;
    timestamp: string;
    moveId: string;
    tenantName: string;
    landings: Array<{ phase: number } & Finding>;
    legacy: Array<{ phase: number } & Finding>;
    views: ViewFinding[];
    coverage: ReturnType<typeof walkCoverage>;
    phaseUxAverage: Record<string, number | null>;
    overallUxAverage: number | null;
    journey: JourneyEntry[];
    journeyReadbackErrors: string[];
  } = {
    deployedSha: DEPLOYED_SHA!,
    deployRunUrl: process.env.E2E_MOVES_DEPLOY_RUN_URL || null,
    timestamp: new Date().toISOString(),
    moveId: MOVE_ID!,
    tenantName: EXPECTED_TENANT_NAME,
    landings: [],
    legacy: [],
    views: [],
    coverage: walkCoverage([], VIEW_ENTRIES.length),
    phaseUxAverage: {},
    overallUxAverage: null,
    journey: [],
    journeyReadbackErrors: [],
  };

  try {
    // Match the existing gate-walk Clerk ticket and active-client setup.
    await withClerkAuth(page, {
      activeClient: process.env.E2E_MOVES_CLIENT_KEY,
      email: process.env.E2E_MOVES_OPERATOR_EMAIL,
    });
    const lookup = await movesApi(page, `/api/v1/programs/${MOVE_ID}`);
    expect(lookup.status, "The input Move must be readable for this operator").toBe(200);
    const program = lookup.body.program as
      | { id?: string; clientName?: string; currentPhase?: number }
      | undefined;
    expect(program?.id).toBe(MOVE_ID);
    expect(program?.clientName).toBe(EXPECTED_TENANT_NAME);
    expect(program?.currentPhase, "The Move must have a readable current phase").toEqual(
      expect.any(Number),
    );
    expect(Number.isInteger(program!.currentPhase)).toBe(true);
    expect(program!.currentPhase).toBeGreaterThanOrEqual(0);
    expect(program!.currentPhase).toBeLessThanOrEqual(5);
    const currentPhase = program!.currentPhase!;
    const blockedWrites: string[] = [];
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(`${BASE_URL}/**`, async (route) => {
      const method = route.request().method();
      if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        blockedWrites.push(`${method} ${route.request().url()}`);
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    for (const phase of PHASES) {
      if (!phaseReachable(currentPhase, phase)) {
        const reason = `Move is at P${currentPhase}`;
        const notReachable: Finding = {
          status: "not_reachable",
          reason,
          landed: "",
        };
        proof.landings.push({ phase, ...notReachable });
        proof.legacy.push({ phase, ...notReachable });
        for (const [view, definition] of VIEW_ENTRIES.filter(
          ([, entry]) => entry.phase === phase,
        )) {
          proof.views.push({
            phase,
            view,
            stepId: definition.stepId,
            ...notReachable,
            screenshots: [],
            ux: scoreWalkUx(emptyUxInput(reason)),
          });
        }
        continue;
      }
      const landing = await inspectPage(page, routeFor(MOVE_ID!, phase), async () => {
        await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);
        if (phase === 2 && !P2_HAS_EVERY_STEP_PAGE) {
          await expect(page.getByTestId("moves-capture-flow")).toBeVisible({
            timeout: VISIBLE_TIMEOUT_MS,
          });
          expect(new URL(page.url()).searchParams.has("step")).toBe(false);
        } else {
          await expect(page.locator("#step-panel-title")).toBeVisible({
            timeout: VISIBLE_TIMEOUT_MS,
          });
          expect(new URL(page.url()).searchParams.get("step")).toBeTruthy();
        }
        await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME, {
          timeout: VISIBLE_TIMEOUT_MS,
        });
      }, blockedWrites);
      proof.landings.push({ phase, ...landing });

      const legacy = await inspectPage(
        page,
        routeFor(MOVE_ID!, phase, "?legacy=1"),
        async () => {
          await expect(page.getByTestId("moves-capture-flow")).toBeVisible({
            timeout: VISIBLE_TIMEOUT_MS,
          });
          await expect(page.locator("#step-panel-title")).toHaveCount(0);
          await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME);
          expect(new URL(page.url()).searchParams.get("legacy")).toBe("1");
        },
        blockedWrites,
      );
      proof.legacy.push({ phase, ...legacy });

      for (const [view, definition] of VIEW_ENTRIES.filter(
        ([, entry]) => entry.phase === phase,
      )) {
        const screenshots: string[] = [];
        const uxInput = emptyUxInput();
        const viewStartedAt = Date.now();
        const position = Number(definition.stepId.split(".")[1]) - 1;
        const result = await inspectPage(
          page,
          routeFor(MOVE_ID!, phase, `?step=${view}`),
          async () => {
            await expect(page.locator("#step-panel-title")).toBeVisible({
              timeout: VISIBLE_TIMEOUT_MS,
            });
            uxInput.settledHeadMs = Date.now() - viewStartedAt;
            await expect(page.locator("#step-panel-title")).not.toBeEmpty();
            const nextAction = page.getByRole("status", { name: "What to do next" });
            await expect(nextAction).toBeVisible();
            await expect(nextAction.locator("p").first()).not.toBeEmpty();
            const steps = page.locator('nav[aria-label$=" steps"] ol > li');
            const current = steps.locator('[aria-current="step"]');
            await expect(current).toHaveCount(1);
            await expect(steps.nth(position).locator('[aria-current="step"]')).toBeVisible();
            expect(new URL(page.url()).searchParams.get("step")).toBe(view);
            await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME);
          },
          blockedWrites,
          async () => {
            await measureUxVariants(
              page,
              testInfo,
              phase,
              view,
              position,
              screenshots,
              uxInput,
            );
            const body = await page.locator("body").innerText();
            const badRead = unreviewedReadText(body, phase, view);
            if (badRead) throw new Error(`Unreviewed read gap: ${badRead}`);
          },
        );
        // Keep a visual record even when a structural check prevented the
        // settled-read callback from running.
        for (const variant of UX_VARIANTS) {
          const filename = `${view}-${variant.width}-${variant.colorScheme}.png`;
          if (screenshots.includes(filename)) continue;
          try {
            await page.setViewportSize({ width: variant.width, height: 900 });
            await page.emulateMedia({ colorScheme: variant.colorScheme });
            const output = testInfo.outputPath(filename);
            fs.mkdirSync(path.dirname(output), { recursive: true });
            await page.screenshot({ path: output, fullPage: true });
            screenshots.push(filename);
          } catch (error) {
            result.status = "fail";
            result.reason += ` | screenshot ${variant.key}: ${String(error)}`;
          }
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.emulateMedia({ colorScheme: "light" });
        const visibleText = await page.locator("body").innerText().catch(() => "");
        const allowance = KNOWN_GAPS.find((gap) =>
          gap.phase === phase &&
          gap.view === view &&
          visibleText.includes(gap.text),
        );
        if (allowance && result.status === "pass") {
          result.status = "known_gap";
          result.reason = allowance.reason;
        }
        proof.views.push({
          phase,
          view,
          stepId: definition.stepId,
          ...result,
          screenshots,
          ux: scoreWalkUx(uxInput),
        });
      }
    }

    const readbacks: Array<PhaseGateReadback | null> = [];
    for (const phase of PHASES) {
      if (!phaseReachable(currentPhase, phase)) {
        readbacks.push({
          currentPhase,
          terminalComplete: false,
          criteria: null,
          reason: `Move is at P${currentPhase}; this gate is not reachable`,
        });
        continue;
      }
      try {
        const response = await movesApi(
          page,
          `/api/v1/programs/${MOVE_ID}/phase-intelligence?phase=${phase}&includeGateReadback=1`,
        );
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }
        const readback = response.body.gateReadback as PhaseGateReadback | undefined;
        if (
          !readback ||
          typeof readback.currentPhase !== "number" ||
          !Array.isArray(readback.criteria)
        ) {
          throw new Error("flagged evaluator readback absent or unevaluable");
        }
        readbacks.push(readback);
      } catch (error) {
        readbacks.push(null);
        proof.journeyReadbackErrors.push(`P${phase} gate read: ${String(error)}`);
      }
    }

    let currentDocuments: CurrentDocumentReadback[] | null = null;
    let documentSignOffAvailable = false;
    try {
      const cabinet = await movesApi(
        page,
        `/api/v1/programs/${MOVE_ID}/artifacts?family=generated_deliverable&currentOnly=1`,
      );
      if (cabinet.status !== 200 || !Array.isArray(cabinet.body.artifacts)) {
        throw new Error(`cabinet HTTP ${cabinet.status} or missing artifacts`);
      }
      currentDocuments = cabinet.body.artifacts as CurrentDocumentReadback[];
      documentSignOffAvailable = cabinet.body.deliverableSignOffStatus === "available";
      if (!documentSignOffAvailable) {
        proof.journeyReadbackErrors.push("Document sign-off read is unavailable");
      }
    } catch (error) {
      proof.journeyReadbackErrors.push(`Document read: ${String(error)}`);
    }
    proof.journey = buildJourney(
      readbacks,
      currentDocuments,
      documentSignOffAvailable,
    );
  } finally {
    proof.timestamp = new Date().toISOString();
    proof.coverage = walkCoverage(
      proof.views.map((view) => view.status),
      VIEW_ENTRIES.length,
    );
    for (const phase of PHASES) {
      proof.phaseUxAverage[`P${phase}`] = floorAverage(
        proof.views.filter((view) => view.phase === phase).map((view) => view.ux.score),
      );
    }
    proof.overallUxAverage = floorAverage(proof.views.map((view) => view.ux.score));
    if (proof.journey.length === 0) {
      proof.journeyReadbackErrors.push("Walk stopped before the journey could be read");
    }
    const output = testInfo.outputPath("proof.json");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(proof, null, 2)}\n`);
    await testInfo.attach("proof.json", { path: output, contentType: "application/json" });
    const summary = testInfo.outputPath("summary.md");
    fs.writeFileSync(summary, summaryMarkdown(proof));
    await testInfo.attach("summary.md", { path: summary, contentType: "text/markdown" });
  }

  const failures = [
    ...proof.landings.map((entry) => ({ label: `P${entry.phase} landing`, ...entry })),
    ...proof.legacy.map((entry) => ({ label: `P${entry.phase} legacy`, ...entry })),
    ...proof.views.map((entry) => ({ label: `P${entry.phase} ${entry.view}`, ...entry })),
  ].filter((entry) => entry.status === "fail");
  expect(failures, "Every failed view remains visible in proof.json").toEqual([]);
  expect(proof.journeyReadbackErrors, "The live journey must be readable").toEqual([]);
});
