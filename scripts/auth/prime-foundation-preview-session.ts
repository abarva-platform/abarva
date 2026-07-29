#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { createClerkClient } from "@clerk/backend";
import { chromium, type Page } from "@playwright/test";

import {
  FOUNDATION_PROOF_LOGINS,
  type FoundationProofLogin,
  type FoundationProofTenantKey,
} from "../../src/lib/auth/foundation-proof-logins";
import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
} from "../../src/lib/ai-liability/responsible-ai-acknowledgment-copy";
import {
  RESPONSIBLE_AI_TRAINING_ROUTE,
  RESPONSIBLE_AI_TRAINING_VERSION,
} from "../../src/lib/ai-liability/responsible-ai-training-copy";

const REPO_ROOT = process.cwd();
const WORK_DIR =
  process.env.FOUNDATION_PROOF_WORK_DIR ??
  path.join(os.tmpdir(), "foundation-preview-auth");
const AUTH_DIR =
  process.env.FOUNDATION_PROOF_AUTH_DIR ?? path.join(WORK_DIR, ".auth");
const REPORT_DIR =
  process.env.FOUNDATION_PROOF_REPORT_DIR ?? path.join(WORK_DIR, "reports");
const DEFAULT_BASE_URL = process.env.BASE_URL ?? "https://app.abarva.ai";

function loadEnvFiles(): void {
  for (const candidate of [
    path.join(REPO_ROOT, ".env.local"),
    path.join(REPO_ROOT, ".env"),
  ]) {
    loadEnv({ path: candidate, override: false });
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Use local env; never commit it.`);
  return value;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const getValue = (name: string): string | null => {
    const inline = args.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] ?? null : null;
  };
  const envFlag = (name: string): boolean => ["1", "true", "yes"].includes((process.env[name] ?? "").toLowerCase());
  return {
    baseUrl: getValue("--base-url") ?? process.env.FOUNDATION_PROOF_BASE_URL ?? DEFAULT_BASE_URL,
    emitProofBundle: args.includes("--emit-proof-bundle") || envFlag("FOUNDATION_PROOF_EMIT_PROOF_BUNDLE"),
    tenant: (getValue("--tenant") as FoundationProofTenantKey | null) ?? (process.env.FOUNDATION_PROOF_TENANT as FoundationProofTenantKey | undefined) ?? "airline-demo-new",
    slug: getValue("--slug") ?? process.env.FOUNDATION_PROOF_SLUG ?? "agent-airline-foundation",
    refresh: args.includes("--refresh") || envFlag("FOUNDATION_PROOF_REFRESH"),
    models: getValue("--models") ?? process.env.FOUNDATION_PROOF_MODELS ?? "off",
  };
}

async function signInWithTicket(page: Page, baseUrl: string, userId: string): Promise<void> {
  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const token = await clerk.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 300,
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => (window as Window & { Clerk?: { loaded?: boolean } }).Clerk?.loaded === true,
    null,
    { timeout: 30000 },
  );
  await page.evaluate(async (ticket) => {
    const win = window as unknown as Window & {
      Clerk: {
        client: {
          signIn: {
            create: (params: { strategy: "ticket"; ticket: string }) => Promise<{
              status: string;
              createdSessionId?: string | null;
            }>;
          };
        };
        setActive: (params: { session?: string | null }) => Promise<void>;
      };
    };
    const result = await win.Clerk.client.signIn.create({ strategy: "ticket", ticket });
    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(`Ticket sign-in failed with status ${result.status}`);
    }
    await win.Clerk.setActive({ session: result.createdSessionId });
  }, token.token);
}

async function acknowledgeResponsibleAi(page: Page, baseUrl: string): Promise<void> {
  const ackUrl = new URL(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE, baseUrl).toString();
  const response = await page.goto(ackUrl, { waitUntil: "domcontentloaded" }).catch(() => null);
  if (response && response.status() >= 400 && response.status() !== 404) {
    throw new Error(`Responsible AI acknowledgment route returned ${response.status()}.`);
  }

  const apiResponse = await page.request.post("/api/ai-liability/responsible-ai-acknowledgment", {
    data: {
      accepted: true,
      textVersion: RESPONSIBLE_AI_ACKNOWLEDGMENT_VERSION,
    },
  });
  if (![200, 409].includes(apiResponse.status())) {
    const body = await apiResponse.text().catch(() => "");
    throw new Error(`Responsible AI acknowledgment API returned ${apiResponse.status()}: ${body}`);
  }
}

async function completeResponsibleAiTraining(page: Page, baseUrl: string): Promise<void> {
  const trainingUrl = new URL(RESPONSIBLE_AI_TRAINING_ROUTE, baseUrl).toString();
  const response = await page.goto(trainingUrl, { waitUntil: "domcontentloaded" }).catch(() => null);
  if (response && response.status() >= 400 && response.status() !== 404) {
    throw new Error(`Responsible AI training route returned ${response.status()}.`);
  }

  const apiResponse = await page.request.post("/api/ai-liability/responsible-ai-training", {
    data: {
      completed: true,
      trainingVersion: RESPONSIBLE_AI_TRAINING_VERSION,
    },
  });
  if (![200, 409].includes(apiResponse.status())) {
    const body = await apiResponse.text().catch(() => "");
    throw new Error(`Responsible AI training API returned ${apiResponse.status()}: ${body}`);
  }
}

function selectLogin(args: ReturnType<typeof parseArgs>): FoundationProofLogin {
  const login = FOUNDATION_PROOF_LOGINS.find(
    (candidate) => candidate.tenantKey === args.tenant && candidate.slug === args.slug,
  );
  if (!login) {
    throw new Error(`No foundation proof login for --tenant ${args.tenant} --slug ${args.slug}.`);
  }
  return login;
}

function displayPath(filePath: string): string {
  const relative = path.relative(REPO_ROOT, filePath);
  return relative.startsWith("..") ? filePath : relative;
}

async function main(): Promise<void> {
  loadEnvFiles();
  const args = parseArgs();
  const login = selectLogin(args);
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const storagePath = path.join(AUTH_DIR, `foundation-${login.tenantKey}-${login.slug}.json`);
  if (args.refresh) fs.rmSync(storagePath, { force: true });

  const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });
  const users = await clerk.users.getUserList({ emailAddress: [login.email], limit: 1 });
  const user = users.data[0];
  if (!user) {
    throw new Error(
      `No Clerk user for ${login.email}. Provision first: npx tsx scripts/auth/provision-foundation-proof-logins.ts --tenant ${login.tenantKey} --apply`,
    );
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: args.baseUrl, viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  try {
    await signInWithTicket(page, args.baseUrl, user.id);
    await acknowledgeResponsibleAi(page, args.baseUrl);
    await completeResponsibleAiTraining(page, args.baseUrl);
    const url = new URL("/knowledge-preview", args.baseUrl);
    url.searchParams.set("provider", "http");
    url.searchParams.set("tenant", login.tenantKey);
    url.searchParams.set("models", args.models === "on" ? "on" : "off");

    const response = await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 60000 });
    const status = response?.status() ?? 0;
    const bodyText = await page.locator("body").innerText({ timeout: 30000 });
    const required = [
      "Admin canary",
      "HTTP provider",
      login.tenantKey,
      "Active baseline",
      "governed baseline",
    ];
    const normalizedBodyText = bodyText.toLowerCase();
    const missing = required.filter(
      (needle) => !normalizedBodyText.includes(needle.toLowerCase()),
    );
    const passed = status < 400 && missing.length === 0 && !page.url().includes("/sign-in");

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(REPORT_DIR, `foundation-${login.tenantKey}-${login.slug}-${stamp}.png`);
    const reportPath = path.join(REPORT_DIR, `foundation-${login.tenantKey}-${login.slug}-${stamp}.json`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await context.storageState({ path: storagePath });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: args.baseUrl,
          tenantKey: login.tenantKey,
          slug: login.slug,
          email: login.email,
          url: page.url(),
          status,
          passed,
          missing,
          storagePath: displayPath(storagePath),
          screenshotPath: displayPath(screenshotPath),
        },
        null,
        2,
      ),
    );

    console.log(`${passed ? "[PASS]" : "[FAIL]"} ${login.slug} · ${login.tenantKey}`);
    console.log(`Storage: ${displayPath(storagePath)}`);
    console.log(`Report: ${displayPath(reportPath)}`);
    console.log(`Screenshot: ${displayPath(screenshotPath)}`);
    if (args.emitProofBundle) emitProofBundle(REPORT_DIR);
    if (!passed) process.exitCode = 1;
  } finally {
    await context.close();
    await browser.close();
  }
}

function emitProofBundle(dir: string): void {
  const tar = spawnSync("tar", ["-czf", "-", "-C", dir, "."], { encoding: "buffer" });
  if (tar.status !== 0) {
    throw new Error(`Failed to create foundation preview proof bundle: ${tar.stderr?.toString() || tar.stdout?.toString() || "tar failed"}`);
  }
  console.log("__SEMANTIC2_PROOF_TGZ_BEGIN__");
  console.log(tar.stdout.toString("base64"));
  console.log("__SEMANTIC2_PROOF_TGZ_END__");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
