/** Signed-in, read-only evidence for the deployed Moves step pages. */
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
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
const EXPECTED_TENANT_NAME = process.env.E2E_MOVES_TENANT_NAME;
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
}> = [];
const BAD_READ = /could not be read|unavailable/i;

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
    // Let client-side reads finish so their refusal text and responses count.
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    await check();
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
    !EXPECTED_TENANT_NAME && "E2E_MOVES_TENANT_NAME",
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
    tenantName: EXPECTED_TENANT_NAME!,
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
        await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME!);
        if (phase === 2 && !P2_HAS_EVERY_STEP_PAGE) {
          await expect(page.getByTestId("moves-capture-flow")).toBeVisible();
          expect(new URL(page.url()).searchParams.has("step")).toBe(false);
        } else {
          await expect(page.locator("#step-panel-title")).toBeVisible();
          expect(new URL(page.url()).searchParams.get("step")).toBeTruthy();
        }
      }, blockedWrites);
      proof.landings.push({ phase, ...landing });

      const legacy = await inspectPage(
        page,
        routeFor(MOVE_ID!, phase, "?legacy=1"),
        async () => {
          await expect(page.getByTestId("moves-capture-flow")).toBeVisible();
          await expect(page.locator("#step-panel-title")).toHaveCount(0);
          await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME!);
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
            await expect(page.locator("#step-panel-title")).toBeVisible();
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
            await expect(page.locator("body")).toContainText(EXPECTED_TENANT_NAME!);

            const body = await page.locator("body").innerText();
            const badReads = body.match(BAD_READ);
            if (badReads) {
              const allowance = KNOWN_GAPS.find(
                (gap) =>
                  gap.phase === phase &&
                  gap.view === view &&
                  body.includes(gap.text),
              );
              if (!allowance) throw new Error(`Unreviewed read gap: ${badReads[0]}`);
            }
          },
          blockedWrites,
        );
        for (const width of [1440, 390]) {
          try {
            await page.setViewportSize({ width, height: 900 });
            const filename = `${view}-${width}.png`;
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
