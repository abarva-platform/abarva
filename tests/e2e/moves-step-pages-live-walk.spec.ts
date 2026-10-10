/** Signed-in, read-only evidence for the deployed Moves step pages. */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_SAFE_CLIENT_NAMES } from "../../src/lib/client-config";
import { resolvePhaseWorkflow } from "../../src/lib/programs/phase-workflow-registry";
import { STEP_PAGE_VIEWS, type StepPageView } from "../../src/lib/programs/step-page-views";
import { withClerkAuth } from "./_helpers/auth";
import { BASE_URL, CLERK_SECRET_KEY } from "./_helpers/env";
import { movesApi } from "./_helpers/moves-gate-walk";

type Status = "pass" | "fail" | "known_gap";
type Finding = { status: Status; reason: string; landed: string };
type ViewFinding = Finding & {
  phase: number;
  view: StepPageView;
  stepId: string;
  screenshots: string[];
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
  test.setTimeout(25 * 60_000);
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
  } = {
    deployedSha: DEPLOYED_SHA!,
    deployRunUrl: process.env.E2E_MOVES_DEPLOY_RUN_URL || null,
    timestamp: new Date().toISOString(),
    moveId: MOVE_ID!,
    tenantName: EXPECTED_TENANT_NAME,
    landings: [],
    legacy: [],
    views: [],
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
    expect(program?.currentPhase, "The Move must allow a P0–P5 read-only walk").toBeGreaterThanOrEqual(5);
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
      const landing = await inspectPage(page, routeFor(MOVE_ID!, phase), async () => {
        await expect(page).not.toHaveURL(/\/sign-in(?:\?|$)/);
        await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME);
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
        const result = await inspectPage(
          page,
          routeFor(MOVE_ID!, phase, `?step=${view}`),
          async () => {
            await expect(page.locator("#step-panel-title")).toBeVisible({
              timeout: VISIBLE_TIMEOUT_MS,
            });
            await expect(page.locator("#step-panel-title")).not.toBeEmpty();
            const nextAction = page.getByRole("status", { name: "What to do next" });
            await expect(nextAction).toBeVisible();
            await expect(nextAction.locator("p").first()).not.toBeEmpty();
            const steps = page.locator('nav[aria-label$=" steps"] ol > li');
            const current = steps.locator('[aria-current="step"]');
            await expect(current).toHaveCount(1);
            const position = Number(definition.stepId.split(".")[1]) - 1;
            await expect(steps.nth(position).locator('[aria-current="step"]')).toBeVisible();
            expect(new URL(page.url()).searchParams.get("step")).toBe(view);
            await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME);
          },
          blockedWrites,
          async () => {
            try {
              for (const width of [1440, 390]) {
                await page.setViewportSize({ width, height: 900 });
                const filename = `${view}-${width}.png`;
                const output = testInfo.outputPath(filename);
                fs.mkdirSync(path.dirname(output), { recursive: true });
                await page.screenshot({ path: output, fullPage: true });
                screenshots.push(filename);
              }
            } finally {
              await page.setViewportSize({ width: 1440, height: 900 });
            }
            const body = await page.locator("body").innerText();
            const badRead = unreviewedReadText(body, phase, view);
            if (badRead) throw new Error(`Unreviewed read gap: ${badRead}`);
          },
        );
        // Keep a visual record even when a structural check prevented the
        // settled-read callback from running.
        for (const width of [1440, 390]) {
          const filename = `${view}-${width}.png`;
          if (screenshots.includes(filename)) continue;
          try {
            await page.setViewportSize({ width, height: 900 });
            const output = testInfo.outputPath(filename);
            fs.mkdirSync(path.dirname(output), { recursive: true });
            await page.screenshot({ path: output, fullPage: true });
            screenshots.push(filename);
          } catch (error) {
            result.status = "fail";
            result.reason += ` | screenshot ${width}: ${String(error)}`;
          }
        }
        await page.setViewportSize({ width: 1440, height: 900 });
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
        proof.views.push({ phase, view, stepId: definition.stepId, ...result, screenshots });
      }
    }
  } finally {
    proof.timestamp = new Date().toISOString();
    const output = testInfo.outputPath("proof.json");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(proof, null, 2)}\n`);
    await testInfo.attach("proof.json", { path: output, contentType: "application/json" });
  }

  const failures = [
    ...proof.landings.map((entry) => ({ label: `P${entry.phase} landing`, ...entry })),
    ...proof.legacy.map((entry) => ({ label: `P${entry.phase} legacy`, ...entry })),
    ...proof.views.map((entry) => ({ label: `P${entry.phase} ${entry.view}`, ...entry })),
  ].filter((entry) => entry.status === "fail");
  expect(failures, "Every failed view remains visible in proof.json").toEqual([]);
});
